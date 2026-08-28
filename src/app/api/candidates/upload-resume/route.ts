import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { executeQuery, executeSingleQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const candidateId = formData.get('candidateId') as string;

    if (!file || !candidateId) {
      return NextResponse.json(
        { error: 'File and candidate ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and Word documents are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${candidateId}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const resumeUrl = `/uploads/resumes/${filename}`;

    // Save resume data to database
    const resumeData = {
      resumeUrl,
      resumeFilename: file.name,
      resumeSize: file.size
    };

    // Check if resume already exists
    const existing = await executeQuery(
      'SELECT id FROM candidate_resume WHERE candidate_id = ?',
      [candidateId]
    );

    if (existing.length > 0) {
      // Update existing resume
      await executeSingleQuery(
        `UPDATE candidate_resume SET 
         resume_url = ?, resume_filename = ?, resume_size = ?, updated_at = NOW() 
         WHERE candidate_id = ?`,
        [
          resumeData.resumeUrl,
          resumeData.resumeFilename,
          resumeData.resumeSize,
          candidateId
        ]
      );
    } else {
      // Insert new resume
      await executeSingleQuery(
        `INSERT INTO candidate_resume 
         (candidate_id, resume_url, resume_filename, resume_size) 
         VALUES (?, ?, ?, ?)`,
        [
          candidateId,
          resumeData.resumeUrl,
          resumeData.resumeFilename,
          resumeData.resumeSize
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: resumeData
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
}
