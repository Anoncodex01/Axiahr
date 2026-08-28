import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery, executeQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// PUT - Reject job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { reason, notes } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // First, fetch job and employer details before updating
    const jobData = await executeQuery<any>(
      `SELECT 
        j.id,
        j.title,
        j.status,
        e.id as employer_id,
        e.email as employer_email,
        e.company_name,
        e.contact_person,
        e.first_name,
        e.last_name
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?`,
      [jobId]
    );

    if (jobData.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobData[0];
    const employerEmail = job.employer_email;
    const employerName = job.contact_person || `${job.first_name || ''} ${job.last_name || ''}`.trim() || job.company_name || 'Employer';
    const jobTitle = job.title;

    // Update job status to rejected
    await executeSingleQuery(
      `UPDATE jobs 
       SET status = 'rejected', 
           updated_at = NOW()
       WHERE id = ?`,
      [jobId]
    );

    // Add admin notes with rejection reason
    const adminNotes = notes || reason || 'Job rejected by admin';
    await executeSingleQuery(
      `UPDATE jobs 
       SET admin_notes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [adminNotes, jobId]
    );

    // Send email notification to employer
    if (employerEmail) {
      try {
        const jobUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/employer/job-posting`;
        
        await sendEmail({
          to: employerEmail,
          subject: `Job Posting Rejected - ${jobTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #dc3545; margin: 0 0 20px 0;">Job Posting Rejected</h2>
                <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                  Hello ${employerName},
                </p>
                <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                  We regret to inform you that your job posting for <strong>"${jobTitle}"</strong> has been reviewed and rejected by our team.
                </p>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #721c24; margin: 0; font-size: 14px;">
                    <strong>❌ Status:</strong> Your job posting has been <strong>Rejected</strong> and will not be published.
                  </p>
                </div>
                
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #004085; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Rejection Reason:</p>
                  <p style="color: #004085; margin: 0; font-size: 14px; white-space: pre-wrap;">${adminNotes}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${jobUrl}" 
                     style="background: #114373; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    View Job Posting
                  </a>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>📋 What to do next:</strong><br>
                    • Review the rejection reason above<br>
                    • You can edit and resubmit your job posting<br>
                    • If you have questions, please contact our support team
                  </p>
                </div>
                
                <p style="color: #666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                  If you believe this was an error or need clarification, please don't hesitate to contact our support team. We're here to help.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>Best regards,<br>The Axia HR Advisory Team</p>
              </div>
            </div>
          `
        });
        console.log('Job rejection email sent successfully to:', employerEmail);
      } catch (emailError: any) {
        // Log email error but don't fail the rejection
        console.error('Error sending job rejection email:', emailError);
        // Continue with the rejection even if email fails
      }
    } else {
      console.warn('No employer email found for job rejection notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Job rejected successfully'
    });

  } catch (error: any) {
    console.error('Reject job error:', error);
    return NextResponse.json(
      { error: 'Failed to reject job', details: error?.message },
      { status: 500 }
    );
  }
}

