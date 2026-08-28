import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all employer actions
export async function GET(request: NextRequest) {
  try {
    // Fetch interview actions
    const interviews = await executeQuery(`
      SELECT 
        i.id,
        i.application_id,
        i.interview_type as action_type,
        i.scheduled_date as action_date,
        i.status,
        i.notes,
        a.candidate_id,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.id as job_id,
        j.title as job_title,
        e.id as employer_id,
        e.company_name as employer_name,
        e.email as employer_email
      FROM interviews i
      INNER JOIN applications a ON i.application_id = a.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN employers e ON j.employer_id = e.id
      ORDER BY i.created_at DESC
    `);

    // Fetch application status changes (select/reject)
    const statusChanges = await executeQuery(`
      SELECT 
        ash.id,
        ash.application_id,
        ash.new_status as action_type,
        ash.created_at as action_date,
        ash.change_reason as notes,
        a.candidate_id,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.id as job_id,
        j.title as job_title,
        e.id as employer_id,
        e.company_name as employer_name,
        e.email as employer_email
      FROM application_status_history ash
      INNER JOIN applications a ON ash.application_id = a.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN employers e ON j.employer_id = e.id
      WHERE ash.new_status IN ('selected', 'rejected')
      ORDER BY ash.created_at DESC
    `);

    // Fetch offer letter actions
    const offerLetters = await executeQuery(`
      SELECT 
        ol.id,
        ol.application_id,
        'offer_sent' as action_type,
        ol.created_at as action_date,
        ol.status,
        CONCAT('Offer Amount: ', ol.offer_amount) as notes,
        a.candidate_id,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.id as job_id,
        j.title as job_title,
        e.id as employer_id,
        e.company_name as employer_name,
        e.email as employer_email
      FROM offer_letters ol
      INNER JOIN applications a ON ol.application_id = a.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN employers e ON j.employer_id = e.id
      ORDER BY ol.created_at DESC
    `);

    // Format and combine all actions
    const allActions = [
      ...interviews.map((i: any) => ({
        id: `interview_${i.id}`,
        employerId: i.employer_id.toString(),
        employerName: i.employer_name,
        employerEmail: i.employer_email,
        actionType: 'interview',
        candidateId: i.candidate_id.toString(),
        candidateName: `${i.candidate_first_name} ${i.candidate_last_name}`,
        candidateEmail: i.candidate_email,
        jobId: i.job_id.toString(),
        jobTitle: i.job_title,
        applicationId: i.application_id.toString(),
        actionDate: i.action_date,
        notes: i.notes,
        status: i.status === 'completed' ? 'completed' : i.status === 'cancelled' ? 'cancelled' : 'pending',
        metadata: {
          interviewType: i.action_type,
          scheduledDate: i.action_date
        }
      })),
      ...statusChanges.map((sc: any) => ({
        id: `status_${sc.id}`,
        employerId: sc.employer_id.toString(),
        employerName: sc.employer_name,
        employerEmail: sc.employer_email,
        actionType: sc.action_type === 'selected' ? 'select' : 'reject',
        candidateId: sc.candidate_id.toString(),
        candidateName: `${sc.candidate_first_name} ${sc.candidate_last_name}`,
        candidateEmail: sc.candidate_email,
        jobId: sc.job_id.toString(),
        jobTitle: sc.job_title,
        applicationId: sc.application_id.toString(),
        actionDate: sc.action_date,
        notes: sc.notes,
        status: 'completed',
        metadata: {}
      })),
      ...offerLetters.map((ol: any) => ({
        id: `offer_${ol.id}`,
        employerId: ol.employer_id.toString(),
        employerName: ol.employer_name,
        employerEmail: ol.employer_email,
        actionType: 'offer_sent',
        candidateId: ol.candidate_id.toString(),
        candidateName: `${ol.candidate_first_name} ${ol.candidate_last_name}`,
        candidateEmail: ol.candidate_email,
        jobId: ol.job_id.toString(),
        jobTitle: ol.job_title,
        applicationId: ol.application_id.toString(),
        actionDate: ol.action_date,
        notes: ol.notes,
        status: ol.status === 'sent' ? 'pending' : ol.status === 'accepted' ? 'completed' : 'cancelled',
        metadata: {
          offerLetterId: ol.id
        }
      }))
    ].sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());

    return NextResponse.json({
      success: true,
      actions: allActions
    });

  } catch (error: any) {
    console.error('Error fetching employer actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employer actions', details: error?.message },
      { status: 500 }
    );
  }
}

