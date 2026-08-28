import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery, executeQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// PUT - Approve job (set status to published)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { notes } = body;

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

    // Update job status to published and set posted_date
    await executeSingleQuery(
      `UPDATE jobs 
       SET status = 'published', 
           posted_date = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [jobId]
    );

    // Add admin notes if provided
    if (notes) {
      await executeSingleQuery(
        `UPDATE jobs 
         SET admin_notes = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [notes, jobId]
      );
    }

    // Send email notification to employer
    if (employerEmail) {
      try {
        const jobUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/employer/job-posting`;
        const publicJobUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/job-search`;
        
        await sendEmail({
          to: employerEmail,
          subject: `Job Posting Approved - ${jobTitle}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Job Posting Approved</h2>
                <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Dear ${employerName},</p>
                <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                  Your job posting for <strong>${jobTitle}</strong> has been approved and is now live on our platform.
                </p>
                <div style="background: #f0f9f4; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                  <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>Status:</strong> Published - Candidates can now view and apply for this position.
                  </p>
                </div>
                <div style="text-align: center; margin: 25px 0;">
                  <a href="${jobUrl}" style="background: #114373; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 15px; margin: 5px;">Manage Job</a>
                  <a href="${publicJobUrl}" style="background: #28a745; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 15px; margin: 5px;">View Listing</a>
                </div>
                ${notes ? `
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 15px; margin: 20px 0;">
                  <p style="color: #004085; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Admin Notes:</p>
                  <p style="color: #004085; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${notes}</p>
                </div>
                ` : ''}
                <p style="color: #495057; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                  Monitor applications through your employer dashboard. For assistance, contact us at <a href="mailto:career@axia.co.tz" style="color: #114373;">career@axia.co.tz</a>.
                </p>
              </div>
              <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
                <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
                <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `
        });
        console.log('Job approval email sent successfully to:', employerEmail);
      } catch (emailError: any) {
        // Log email error but don't fail the approval
        console.error('Error sending job approval email:', emailError);
        // Continue with the approval even if email fails
      }
    } else {
      console.warn('No employer email found for job approval notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Job approved and published successfully'
    });

  } catch (error: any) {
    console.error('Approve job error:', error);
    return NextResponse.json(
      { error: 'Failed to approve job', details: error?.message },
      { status: 500 }
    );
  }
}

