import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch interviews for authenticated employer
export async function GET(request: NextRequest) {
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
    const status = searchParams.get('status');
    const applicationId = searchParams.get('applicationId');

    // Build query to get interviews for this employer's jobs
    let query = `
      SELECT 
        i.id,
        i.application_id,
        i.interview_type,
        i.scheduled_date,
        i.duration_minutes,
        i.location,
        i.meeting_link,
        i.status,
        i.outcome,
        i.notes,
        i.feedback,
        i.created_at,
        i.updated_at,
        a.candidate_id,
        a.job_id,
        a.status as application_status,
        c.first_name,
        c.surname as last_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        j.title as job_title,
        e.company_name,
        u.first_name as interviewer_first_name,
        u.last_name as interviewer_last_name
      FROM interviews i
      INNER JOIN applications a ON i.application_id = a.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN employers e ON j.employer_id = e.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON i.interviewer_id = u.id
      WHERE j.employer_id = ?
    `;
    
    const params: any[] = [employerId];
    
    if (applicationId) {
      query += ' AND i.application_id = ?';
      params.push(applicationId);
    }
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.scheduled_date DESC';

    const interviews = await executeQuery<any>(query, params);

    // Format interviews
    const formattedInterviews = interviews.map((interview: any) => ({
      id: interview.id.toString(),
      applicationId: interview.application_id.toString(),
      candidateId: interview.candidate_id.toString(),
      jobId: interview.job_id.toString(),
      candidateName: `${interview.first_name} ${interview.last_name}`,
      candidateEmail: interview.candidate_email,
      candidatePhone: interview.candidate_phone,
      jobTitle: interview.job_title,
      companyName: interview.company_name,
      interviewerName: interview.interviewer_first_name && interview.interviewer_last_name
        ? `${interview.interviewer_first_name} ${interview.interviewer_last_name}`
        : 'System',
      interviewType: interview.interview_type,
      scheduledDate: interview.scheduled_date ? new Date(interview.scheduled_date).toISOString() : null,
      durationMinutes: interview.duration_minutes || 60,
      location: interview.location,
      meetingLink: interview.meeting_link,
      status: interview.status,
      outcome: interview.outcome,
      notes: interview.notes,
      feedback: interview.feedback,
      applicationStatus: interview.application_status,
      createdAt: interview.created_at ? new Date(interview.created_at).toISOString() : null,
      updatedAt: interview.updated_at ? new Date(interview.updated_at).toISOString() : null
    }));

    return NextResponse.json({
      success: true,
      interviews: formattedInterviews
    });

  } catch (error: any) {
    console.error('Get employer interviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews', details: error?.message },
      { status: 500 }
    );
  }
}

