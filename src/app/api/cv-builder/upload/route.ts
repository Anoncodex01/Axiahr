import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// POST /api/cv-builder/upload - Upload CV file for processing
export async function POST(request: NextRequest) {
  try {
    // Get token for authentication
    const token = request.cookies.get('authToken')?.value ||
                  request.cookies.get('axia_candidate_token')?.value ||
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract candidate ID from token
    const candidateId = decoded.candidateId || decoded.id || decoded.sub;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    // Check if candidate has a completed payment
    const orders = await executeQuery(
      `SELECT id, payment_status, cv_file_path 
       FROM cv_orders 
       WHERE candidate_id = ? AND payment_status = 'completed'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [candidateId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No completed payment found. Please complete payment first.' },
        { status: 403 }
      );
    }

    const order = orders[0];

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('cvFile') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PDF or Word document.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cv-orders');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `cv_${candidateId}_${order.id}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    const relativePath = `/uploads/cv-orders/${fileName}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update order with CV file path
    await executeSingleQuery(
      `UPDATE cv_orders 
       SET cv_file_path = ?,
           status = 'processing',
           updated_at = NOW()
       WHERE id = ?`,
      [relativePath, order.id]
    );

    console.log('✅ CV uploaded successfully:', {
      orderId: order.id,
      candidateId,
      fileName,
      filePath: relativePath
    });

    return NextResponse.json({
      success: true,
      message: 'CV uploaded successfully',
      orderId: order.id,
      filePath: relativePath
    });

  } catch (error: any) {
    console.error('❌ Error uploading CV:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload CV' 
      },
      { status: 500 }
    );
  }
}

