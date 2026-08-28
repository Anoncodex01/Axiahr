import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('employerAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const employerId = decoded.sub;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('applicationId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 });
    }

    // Verify application belongs to employer and is selected
    const applications = await executeQuery(`
      SELECT a.id, a.status, j.employer_id
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ? AND j.employer_id = ?
    `, [applicationId, employerId]);

    if (applications.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Application not found or unauthorized' 
      }, { status: 404 });
    }

    if (applications[0].status !== 'selected') {
      return NextResponse.json({ 
        success: false, 
        error: 'Application must be selected before uploading offer letter' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'offer-letters');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `offer_${applicationId}_${employerId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file to server
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const offerFileUrl = `/uploads/offer-letters/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        offerFileUrl,
        filename,
        size: file.size,
        type: file.type
      }
    });

  } catch (error: any) {
    console.error('Error uploading offer letter:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload offer letter',
      details: error?.message
    }, { status: 500 });
  }
}

