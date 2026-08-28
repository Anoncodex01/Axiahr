import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET - Fetch all candidate responses
export async function GET(request: NextRequest) {
  try {
    // Fetch offer letter responses
    const offerResponses = await executeQuery(`
      SELECT 
        ol.id,
        ol.application_id,
        ol.candidate_response as response_type,
        ol.response_date,
        ol.rejection_reason,
        a.candidate_id,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.id as job_id,
        j.title as job_title,
        ol.id as offer_letter_id
      FROM offer_letters ol
      INNER JOIN applications a ON ol.application_id = a.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE ol.candidate_response IS NOT NULL
      ORDER BY ol.response_date DESC
    `);

    // Fetch interview confirmations/cancellations
    const interviewResponses = await executeQuery(`
      SELECT 
        i.id,
        i.application_id,
        CASE 
          WHEN i.status = 'completed' THEN 'interview_confirmed'
          WHEN i.status = 'cancelled' THEN 'interview_cancelled'
          ELSE NULL
        END as response_type,
        i.updated_at as response_date,
        i.notes as response_data,
        a.candidate_id,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.id as job_id,
        j.title as job_title,
        i.id as interview_id
      FROM interviews i
      INNER JOIN applications a ON i.application_id = a.id
      INNER JOIN candidates c ON a.candidate_id = c.id
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE i.status IN ('completed', 'cancelled')
      ORDER BY i.updated_at DESC
    `);

    // Format and combine all responses
    const allResponses = [
      ...offerResponses
        .filter((or: any) => or.response_type)
        .map((or: any) => ({
          id: `offer_response_${or.id}`,
          applicationId: or.application_id.toString(),
          candidateId: or.candidate_id.toString(),
          candidateName: `${or.candidate_first_name} ${or.candidate_last_name}`,
          candidateEmail: or.candidate_email,
          responseType: `offer_${or.response_type}`,
          offerLetterId: or.offer_letter_id.toString(),
          interviewId: undefined,
          jobId: or.job_id.toString(),
          jobTitle: or.job_title,
          responseDate: or.response_date,
          responseData: {},
          rejectionReason: or.rejection_reason
        })),
      ...interviewResponses
        .filter((ir: any) => ir.response_type)
        .map((ir: any) => ({
          id: `interview_response_${ir.id}`,
          applicationId: ir.application_id.toString(),
          candidateId: ir.candidate_id.toString(),
          candidateName: `${ir.candidate_first_name} ${ir.candidate_last_name}`,
          candidateEmail: ir.candidate_email,
          responseType: ir.response_type,
          offerLetterId: undefined,
          interviewId: ir.interview_id.toString(),
          jobId: ir.job_id.toString(),
          jobTitle: ir.job_title,
          responseDate: ir.response_date,
          responseData: ir.response_data ? JSON.parse(ir.response_data) : {},
          rejectionReason: undefined
        }))
    ].sort((a, b) => new Date(b.responseDate).getTime() - new Date(a.responseDate).getTime());

    return NextResponse.json({
      success: true,
      responses: allResponses
    });

  } catch (error: any) {
    console.error('Error fetching candidate responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate responses', details: error?.message },
      { status: 500 }
    );
  }
}

