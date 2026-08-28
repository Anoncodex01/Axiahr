import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  let savedPhotoUrl: string | null = null;
  let savedFilename: string | null = null;
  let savedSize = 0;
  let savedType = '';

  try {
    const formData = await request.formData();
    const candidateId = formData.get('candidateId') as string;
    const file = formData.get('file') as File;

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'Candidate ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
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
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'photos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${candidateId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file to server
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update database with photo information
    const photoUrl = `/uploads/photos/${filename}`;
    savedPhotoUrl = photoUrl;
    savedFilename = filename;
    savedSize = file.size;
    savedType = file.type;
    
    try {
      // Check if candidate already has a photo
      const existingPhoto = await executeQuery(
        'SELECT photo_url FROM candidate_profiles WHERE candidate_id = ?',
        [candidateId]
      );

      if (existingPhoto.length > 0) {
        // Update existing photo
        await executeSingleQuery(
          'UPDATE candidate_profiles SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE candidate_id = ?',
          [photoUrl, candidateId]
        );
      } else {
        // Insert new photo record
        await executeSingleQuery(
          'INSERT INTO candidate_profiles (candidate_id, photo_url, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE photo_url = ?, updated_at = CURRENT_TIMESTAMP',
          [candidateId, photoUrl, photoUrl]
        );
      }
    } catch (dbError) {
      console.error('Profile photo saved, but database update failed:', dbError);
      return NextResponse.json({
        success: true,
        warning: 'Photo uploaded successfully. It may not persist after refresh until the database connection is available.',
        data: {
          photoUrl,
          filename,
          size: file.size,
          type: file.type
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        photoUrl,
        filename,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    if (savedPhotoUrl && savedFilename) {
      return NextResponse.json({
        success: true,
        warning: 'Photo uploaded successfully, but profile sync did not finish. Please refresh once the database is available.',
        data: {
          photoUrl: savedPhotoUrl,
          filename: savedFilename,
          size: savedSize,
          type: savedType
        }
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload profile photo' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'Candidate ID is required' }, { status: 400 });
    }

    // Remove photo from database
    await executeSingleQuery(
      'UPDATE candidate_profiles SET photo_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile photo deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete profile photo' 
    }, { status: 500 });
  }
}
