import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
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
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ success: false, error: 'Document type is required' }, { status: 400 });
    }

    // Validate document type
    const allowedTypes = ['company_profile', 'business_license', 'tax_certificate', 'registration_certificate'];
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid document type. Allowed types: company_profile, business_license, tax_certificate, registration_certificate' 
      }, { status: 400 });
    }

    // Validate file type based on document type
    let allowedFileTypes: string[] = [];
    if (documentType === 'company_profile') {
      allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
    } else {
      // For other documents (business license, tax certificate, registration certificate)
      allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    }
    
    if (!allowedFileTypes.includes(file.type)) {
      const errorMessage = documentType === 'company_profile'
        ? 'Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'
        : 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'employer-documents');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${documentType}_${employerId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file to server
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update database with document URL
    const documentUrl = `/uploads/employer-documents/${filename}`;
    
    // Map document type to database column
    const columnMap: { [key: string]: string } = {
      'company_profile': 'company_profile_document',
      'business_license': 'business_license_document',
      'tax_certificate': 'tax_certificate_document',
      'registration_certificate': 'registration_certificate_document'
    };

    const columnName = columnMap[documentType];

    if (columnName) {
      try {
        // Check if document already exists and delete old file
        const existing = await executeQuery<{ [key: string]: string | null }>(
          `SELECT ${columnName} FROM employers WHERE id = ?`,
          [employerId]
        );

        if (existing.length > 0 && existing[0][columnName]) {
          // Delete old file
          const oldFilePath = join(process.cwd(), 'public', existing[0][columnName] as string);
          try {
            if (existsSync(oldFilePath)) {
              await unlink(oldFilePath);
            }
          } catch (error) {
            console.warn('Could not delete old document file:', error);
          }
        }

        // Update database
        await executeSingleQuery(
          `UPDATE employers SET ${columnName} = ?, updated_at = NOW() WHERE id = ?`,
          [documentUrl, employerId]
        );
      } catch (error: any) {
        // If column doesn't exist, log warning but file is still saved
        console.warn(`Could not update ${columnName} column:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        documentUrl,
        filename,
        documentType,
        size: file.size,
        type: file.type
      }
    });

  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload document',
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
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Map document type to database column
    const columnMap: { [key: string]: string } = {
      'company_profile': 'company_profile_document',
      'business_license': 'business_license_document',
      'tax_certificate': 'tax_certificate_document',
      'registration_certificate': 'registration_certificate_document'
    };

    const columnName = columnMap[documentType];

    if (!columnName) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Get current document URL from database
    const employers = await executeQuery<{ [key: string]: string | null }>(
      `SELECT ${columnName} FROM employers WHERE id = ?`,
      [employerId]
    );

    if (employers.length > 0 && employers[0][columnName]) {
      // Delete file from server
      const documentPath = join(process.cwd(), 'public', employers[0][columnName] as string);
      
      try {
        if (existsSync(documentPath)) {
          await unlink(documentPath);
        }
      } catch (error) {
        console.warn('Could not delete document file:', error);
      }

      // Remove document URL from database
      try {
        await executeSingleQuery(
          `UPDATE employers SET ${columnName} = NULL, updated_at = NOW() WHERE id = ?`,
          [employerId]
        );
      } catch (error: any) {
        console.warn(`Could not update ${columnName} column:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete document' 
    }, { status: 500 });
  }
}

