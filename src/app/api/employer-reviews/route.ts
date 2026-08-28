import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET /api/employer-reviews - Get employer reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employerId');
    const applicationId = searchParams.get('applicationId');
    const action = searchParams.get('action');

    let query = `
      SELECT 
        er.*,
        a.candidate_id,
        c.first_name,
        c.last_name,
        c.email as candidate_email,
        j.title as job_title,
        e.company_name,
        ev.overall_score,
        ev.recommendation,
        ev.strengths,
        ev.weaknesses
      FROM employer_reviews er
      LEFT JOIN applications a ON er.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN evaluations ev ON er.evaluation_id = ev.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (employerId) {
      query += ' AND er.employer_id = ?';
      params.push(employerId);
    }
    
    if (applicationId) {
      query += ' AND er.application_id = ?';
      params.push(applicationId);
    }
    
    if (action) {
      query += ' AND er.action = ?';
      params.push(action);
    }
    
    query += ' ORDER BY er.created_at DESC';

    const reviews = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching employer reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer reviews' },
      { status: 500 }
    );
  }
}

// POST /api/employer-reviews - Submit employer review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      employerId,
      evaluationId,
      action,
      notes,
      interviewType,
      interviewScheduledDate,
      interviewLocation,
      interviewLink
    } = body;

    // Validate required fields
    if (!applicationId || !employerId || !evaluationId || !action) {
      return NextResponse.json(
        { error: 'Application ID, Employer ID, Evaluation ID, and Action are required' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['interview_again', 'reject', 'select'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be interview_again, reject, or select' },
        { status: 400 }
      );
    }

    // Create employer review
    const result = await executeSingleQuery(`
      INSERT INTO employer_reviews (
        application_id, employer_id, evaluation_id, action, notes,
        interview_type, interview_scheduled_date, interview_location, interview_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      applicationId, employerId, evaluationId, action, notes,
      interviewType, interviewScheduledDate, interviewLocation, interviewLink
    ]);

    const reviewId = result.insertId;

    // Update application status based on action
    let newStatus = '';
    if (action === 'select') {
      newStatus = 'selected';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'interview_again') {
      newStatus = 'interviewed'; // Will be scheduled for another interview
    }

    if (newStatus) {
      await executeSingleQuery(`
        UPDATE applications 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, applicationId]);

      // Log status change
      await executeSingleQuery(`
        INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, change_reason)
        VALUES (?, 'screened', ?, ?, 'Employer review completed')
      `, [applicationId, newStatus, employerId]);
    }

    // Create notification for admin
    const applicationInfo = await executeQuery(`
      SELECT c.first_name, c.last_name, j.title as job_title
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [applicationId]);

    if (applicationInfo.length > 0) {
      const app = applicationInfo[0];
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'admin', 'employer_review', 'Employer Review Submitted', ?, ?)
      `, [
        1, // Assuming admin user ID is 1
        `Employer review submitted for ${app.first_name} ${app.last_name} - ${app.job_title}`,
        JSON.stringify({ reviewId, applicationId, action, employerId })
      ]);
    }

    return NextResponse.json({
      success: true,
      reviewId,
      applicationStatus: newStatus,
      message: 'Employer review submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting employer review:', error);
    return NextResponse.json(
      { error: 'Failed to submit employer review' },
      { status: 500 }
    );
  }
}
