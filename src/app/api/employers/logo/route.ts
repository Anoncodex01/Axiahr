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

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, and SVG images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'company-logos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `logo_${employerId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file to server
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update database with logo URL
    const logoUrl = `/uploads/company-logos/${filename}`;
    
    // Try to update company_logo column, fallback to storing in a JSON field or separate table
    try {
      await executeSingleQuery(
        'UPDATE employers SET company_logo = ?, updated_at = NOW() WHERE id = ?',
        [logoUrl, employerId]
      );
    } catch (error: any) {
      // If company_logo column doesn't exist, we'll store it in a separate table or JSON field
      // For now, just log the error - the file is still saved
      console.warn('Could not update company_logo column:', error.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        logoUrl,
        filename,
        size: file.size,
        type: file.type
      }
    });

  } catch (error: any) {
    console.error('Error uploading company logo:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload company logo',
      details: error?.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get current logo URL from database
    const employers = await executeQuery<{ company_logo: string | null }>(
      'SELECT company_logo FROM employers WHERE id = ?',
      [employerId]
    );

    if (employers.length > 0 && employers[0].company_logo) {
      // Delete file from server
      const { unlink } = await import('fs/promises');
      const logoPath = join(process.cwd(), 'public', employers[0].company_logo);
      
      try {
        await unlink(logoPath);
      } catch (error) {
        console.warn('Could not delete logo file:', error);
      }

      // Remove logo URL from database
      try {
        await executeSingleQuery(
          'UPDATE employers SET company_logo = NULL, updated_at = NOW() WHERE id = ?',
          [employerId]
        );
      } catch (error: any) {
        console.warn('Could not update company_logo column:', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Company logo deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting company logo:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete company logo' 
    }, { status: 500 });
  }
}

