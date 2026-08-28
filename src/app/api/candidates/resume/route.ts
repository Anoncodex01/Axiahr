import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Get resume for the candidate
    const resume = await executeQuery(
      'SELECT * FROM candidate_resume WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      data: resume.length > 0 ? resume[0] : null
    });

  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, resumeData } = body;

    if (!candidateId || !resumeData) {
      return NextResponse.json(
        { error: 'Candidate ID and resume data are required' },
        { status: 400 }
      );
    }

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
          resumeData.resumeUrl || null,
          resumeData.resumeFilename || null,
          resumeData.resumeSize || null,
          candidateId
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Resume updated successfully'
      });
    } else {
      // Insert new resume
      const result = await executeSingleQuery(
        `INSERT INTO candidate_resume 
         (candidate_id, resume_url, resume_filename, resume_size) 
         VALUES (?, ?, ?, ?)`,
        [
          candidateId,
          resumeData.resumeUrl || null,
          resumeData.resumeFilename || null,
          resumeData.resumeSize || null
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Resume added successfully',
        data: { id: result.insertId }
      });
    }

  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // Delete resume
    await executeSingleQuery(
      'DELETE FROM candidate_resume WHERE candidate_id = ?',
      [candidateId]
    );

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
