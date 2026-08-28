import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// POST /api/evaluations/send-to-employer - Send multiple qualified candidates to employer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, evaluationIds } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (!evaluationIds || !Array.isArray(evaluationIds) || evaluationIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one evaluation ID is required' },
        { status: 400 }
      );
    }

    // Get job details to find employer
    const jobs = await executeQuery(`
      SELECT j.id, j.employer_id, j.title as job_title, emp.company_name, emp.email as employer_email
      FROM jobs j
      LEFT JOIN employers emp ON j.employer_id = emp.id
      WHERE j.id = ?
    `, [jobId]);

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobs[0];
    const employerId = job.employer_id;

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer not found for this job' },
        { status: 404 }
      );
    }

    // Mark all evaluations as sent to employer
    const placeholders = evaluationIds.map(() => '?').join(',');
    await executeSingleQuery(`
      UPDATE evaluations 
      SET sent_to_employer = TRUE, sent_to_employer_date = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `, evaluationIds);

    // Update application status to 'sent_to_employer' or keep as 'screened'
    // We'll create a new status or use existing one
    const applications = await executeQuery(`
      SELECT DISTINCT application_id 
      FROM evaluations 
      WHERE id IN (${placeholders})
    `, evaluationIds);

    for (const app of applications) {
      // Update application status - we can add a new status or keep as screened
      // For now, we'll keep it as 'screened' but mark evaluations as sent
      // You might want to add a 'sent_to_employer' status later
    }

    // Create notification for employer
    try {
      await executeSingleQuery(`
        INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
        VALUES (?, 'employer', 'evaluation_completed', 'Screened Candidates Available', ?, ?)
      `, [
        employerId,
        `${evaluationIds.length} screened candidate(s) available for review - ${job.job_title}`,
        JSON.stringify({ 
          jobId: job.id,
          jobTitle: job.job_title,
          evaluationIds,
          candidateCount: evaluationIds.length
        })
      ]);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${evaluationIds.length} candidate(s) to employer`,
      employerId,
      jobTitle: job.job_title
    });

  } catch (error) {
    console.error('Error sending candidates to employer:', error);
    return NextResponse.json(
      { error: 'Failed to send candidates to employer' },
      { status: 500 }
    );
  }
}

