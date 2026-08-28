import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET /api/interviews - Get interviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const interviewerId = searchParams.get('interviewerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.*,
        a.candidate_id,
        c.first_name,
        c.surname as last_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        j.title as job_title,
        e.company_name,
        u.first_name as interviewer_first_name,
        u.last_name as interviewer_last_name
      FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN users u ON i.interviewer_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (applicationId) {
      query += ' AND i.application_id = ?';
      params.push(applicationId);
    }
    
    if (interviewerId) {
      query += ' AND i.interviewer_id = ?';
      params.push(interviewerId);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.scheduled_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const interviews = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: interviews
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Schedule new interview
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      interviewerId,
      interviewType,
      scheduledDate,
      durationMinutes = 60,
      location,
      meetingLink
    } = body;

    // Validate required fields
    if (!applicationId || !interviewerId || !interviewType || !scheduledDate) {
      return NextResponse.json(
        { error: 'Application ID, Interviewer ID, Interview Type, and Scheduled Date are required' },
        { status: 400 }
      );
    }

    // Validate interview type
    if (!['phone', 'video', 'in_person'].includes(interviewType)) {
      return NextResponse.json(
        { error: 'Invalid interview type. Must be phone, video, or in_person' },
        { status: 400 }
      );
    }

    // Create interview
    const result = await executeSingleQuery(`
      INSERT INTO interviews (
        application_id, interviewer_id, interview_type, scheduled_date,
        duration_minutes, location, meeting_link, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [
      applicationId, interviewerId, interviewType, scheduledDate,
      durationMinutes, location, meetingLink
    ]);

    const interviewId = result.insertId;

    // Update application status to shortlisted if not already
    await executeSingleQuery(`
      UPDATE applications 
      SET status = 'shortlisted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'reviewed'
    `, [applicationId]);

    // Create notification for candidate
    const candidateInfo = await executeQuery(`
      SELECT c.id, c.first_name, c.surname as last_name, c.email
      FROM candidates c
      JOIN applications a ON c.id = a.candidate_id
      WHERE a.id = ?
    `, [applicationId]);

    if (candidateInfo.length > 0) {
      const candidate = candidateInfo[0];
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'candidate', 'interview_scheduled', 'Interview Scheduled', ?, ?)
      `, [
        candidate.id,
        `Your interview has been scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        JSON.stringify({ interviewId, applicationId, scheduledDate, interviewType })
      ]);
    }

    return NextResponse.json({
      success: true,
      interviewId,
      message: 'Interview scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    );
  }
}

// PUT /api/interviews/[id] - Update interview (mark as conducted, update outcome)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('id');
    const body = await request.json();
    const { status, outcome, notes, feedback } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Validate outcome if provided
    if (outcome && !['conducted_screened', 'conducted_rejected', 'not_conducted'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Invalid outcome. Must be conducted_screened, conducted_rejected, or not_conducted' },
        { status: 400 }
      );
    }

    // Update interview
    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (outcome) {
      updateFields.push('outcome = ?');
      updateValues.push(outcome);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (feedback !== undefined) {
      updateFields.push('feedback = ?');
      updateValues.push(feedback);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateValues.push(interviewId);

    await executeSingleQuery(`
      UPDATE interviews SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, updateValues);

    // Update application status based on outcome
    if (outcome) {
      let newStatus = '';
      if (outcome === 'conducted_screened') {
        newStatus = 'screened';
      } else if (outcome === 'conducted_rejected') {
        newStatus = 'rejected';
      }

      if (newStatus) {
        await executeSingleQuery(`
          UPDATE applications 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = (SELECT application_id FROM interviews WHERE id = ?)
        `, [newStatus, interviewId]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Interview updated successfully'
    });

  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}
