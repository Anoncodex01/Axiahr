import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// GET /api/evaluations - Get evaluations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const interviewerId = searchParams.get('interviewerId');
    const sentToEmployer = searchParams.get('sentToEmployer');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        e.*,
        a.candidate_id,
        a.job_id,
        c.first_name,
        c.surname as last_name,
        c.email as candidate_email,
        j.title as job_title,
        emp.company_name,
        u.first_name as interviewer_first_name,
        u.last_name as interviewer_last_name,
        i.scheduled_date as interview_date
      FROM evaluations e
      LEFT JOIN applications a ON e.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN employers emp ON j.employer_id = emp.id
      LEFT JOIN users u ON e.interviewer_id = u.id
      LEFT JOIN interviews i ON e.interview_id = i.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    const jobId = searchParams.get('jobId');
    
    if (applicationId) {
      query += ' AND e.application_id = ?';
      params.push(applicationId);
    }
    
    if (jobId) {
      query += ' AND a.job_id = ?';
      params.push(jobId);
    }
    
    if (interviewerId) {
      query += ' AND e.interviewer_id = ?';
      params.push(interviewerId);
    }
    
    if (sentToEmployer !== null) {
      query += ' AND e.sent_to_employer = ?';
      params.push(sentToEmployer === 'true');
    }
    
    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const evaluations = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: evaluations
    });

  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Submit evaluation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicationId,
      interviewerId,
      interviewId,
      overallScore,
      communicationSkills,
      technicalSkills,
      experience,
      culturalFit,
      leadership,
      strengths,
      weaknesses,
      additionalNotes,
      recommendation,
      currentSalary,
      expectedSalary,
      availability,
      interviewerNotes
    } = body;

    // Validate required fields
    if (!applicationId || !interviewerId || !overallScore || !recommendation || !strengths || !weaknesses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate score range
    if (overallScore < 1 || overallScore > 10) {
      return NextResponse.json(
        { error: 'Overall score must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Validate recommendation
    if (!['does_not_meet', 'partially_meets', 'meets', 'exceeds'].includes(recommendation)) {
      return NextResponse.json(
        { error: 'Invalid recommendation value' },
        { status: 400 }
      );
    }

    // Validate skill ratings
    const validRatings = ['outstanding', 'above_satisfactory', 'satisfactory', 'below_satisfactory', 'unsatisfactory'];
    const skillRatings = { communicationSkills, technicalSkills, experience, culturalFit, leadership };
    
    for (const [key, value] of Object.entries(skillRatings)) {
      if (value && !validRatings.includes(value)) {
        return NextResponse.json(
          { error: `Invalid ${key} rating` },
          { status: 400 }
        );
      }
    }

    // Create evaluation
    const result = await executeSingleQuery(`
      INSERT INTO evaluations (
        application_id, interviewer_id, interview_id, overall_score,
        communication_skills, technical_skills, experience, cultural_fit, leadership,
        strengths, weaknesses, additional_notes, recommendation,
        current_salary, expected_salary, availability, interviewer_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      applicationId, interviewerId, interviewId, overallScore,
      communicationSkills, technicalSkills, experience, culturalFit, leadership,
      strengths, weaknesses, additionalNotes, recommendation,
      currentSalary, expectedSalary, availability, interviewerNotes
    ]);

    const evaluationId = result.insertId;

    // Update application status based on recommendation
    let newStatus = '';
    if (recommendation === 'meets' || recommendation === 'exceeds') {
      newStatus = 'screened';
    } else {
      newStatus = 'rejected';
    }

    await executeSingleQuery(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, applicationId]);

    // Log status change
    await executeSingleQuery(`
      INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, change_reason)
      VALUES (?, 'interviewed', ?, ?, 'Evaluation completed')
    `, [applicationId, newStatus, interviewerId]);

    return NextResponse.json({
      success: true,
      evaluationId,
      applicationStatus: newStatus,
      message: 'Evaluation submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
}

// PUT /api/evaluations/[id]/send-to-employer - Send evaluation to employer
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get('id');
    const body = await request.json();
    const { employerId } = body;

    if (!evaluationId) {
      return NextResponse.json(
        { error: 'Evaluation ID is required' },
        { status: 400 }
      );
    }

    // Get evaluation details
    const evaluation = await executeQuery(`
      SELECT e.*, a.candidate_id, c.first_name, c.surname as last_name, c.email,
             j.title as job_title, emp.company_name, emp.email as employer_email
      FROM evaluations e
      JOIN applications a ON e.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      JOIN employers emp ON j.employer_id = emp.id
      WHERE e.id = ?
    `, [evaluationId]);

    if (evaluation.length === 0) {
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    const evalData = evaluation[0];

    // Mark evaluation as sent to employer
    await executeSingleQuery(`
      UPDATE evaluations 
      SET sent_to_employer = TRUE, sent_to_employer_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [evaluationId]);

    // Create notification for employer
    await executeSingleQuery(`
      INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
      VALUES (?, 'employer', 'evaluation_completed', 'Candidate Evaluation Available', ?, ?)
    `, [
      employerId || evalData.employer_id,
      `Evaluation completed for ${evalData.first_name} ${evalData.last_name} - ${evalData.job_title}`,
      JSON.stringify({ 
        evaluationId, 
        applicationId: evalData.application_id,
        candidateName: `${evalData.first_name} ${evalData.last_name}`,
        jobTitle: evalData.job_title,
        recommendation: evalData.recommendation,
        overallScore: evalData.overall_score
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Evaluation sent to employer successfully'
    });

  } catch (error) {
    console.error('Error sending evaluation to employer:', error);
    return NextResponse.json(
      { error: 'Failed to send evaluation to employer' },
      { status: 500 }
    );
  }
}
