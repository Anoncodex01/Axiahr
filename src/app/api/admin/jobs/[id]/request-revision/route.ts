import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery, executeQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// PUT - Request revision for job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { notes, revisionNotes } = body;

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

    // Update job status to draft (so employer can edit)
    await executeSingleQuery(
      `UPDATE jobs 
       SET status = 'draft', 
           updated_at = NOW()
       WHERE id = ?`,
      [jobId]
    );

    // Add admin notes with revision request
    const adminNotes = notes || revisionNotes || 'Revision requested by admin';
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
          subject: `Revision Requested for Your Job Posting - ${jobTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #ff9800; margin: 0 0 20px 0;">📝 Revision Requested for Your Job Posting</h2>
                <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                  Hello ${employerName},
                </p>
                <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                  Your job posting for <strong>"${jobTitle}"</strong> has been reviewed by our team. We need some revisions before we can approve and publish it.
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⚠️ Status:</strong> Your job posting is now in <strong>Draft</strong> status. Please review the revision notes below and make the necessary changes.
                  </p>
                </div>
                
                <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #004085; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Revision Notes:</p>
                  <p style="color: #004085; margin: 0; font-size: 14px; white-space: pre-wrap;">${adminNotes}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${jobUrl}" 
                     style="background: #114373; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Edit Job Posting
                  </a>
                </div>
                
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="color: #0c5460; margin: 0; font-size: 14px;">
                    <strong>📋 Next Steps:</strong><br>
                    • Review the revision notes above<br>
                    • Edit your job posting with the requested changes<br>
                    • Resubmit for review once you've made the updates<br>
                    • Our team will review it again after you resubmit
                  </p>
                </div>
                
                <p style="color: #666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                  If you have any questions about the requested revisions, please don't hesitate to contact our support team. We're here to help you create the best job posting possible.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                <p>Best regards,<br>The Axia HR Advisory Team</p>
              </div>
            </div>
          `
        });
        console.log('Job revision request email sent successfully to:', employerEmail);
      } catch (emailError: any) {
        // Log email error but don't fail the revision request
        console.error('Error sending job revision request email:', emailError);
        // Continue with the revision request even if email fails
      }
    } else {
      console.warn('No employer email found for job revision request notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Revision requested successfully'
    });

  } catch (error: any) {
    console.error('Request revision error:', error);
    return NextResponse.json(
      { error: 'Failed to request revision', details: error?.message },
      { status: 500 }
    );
  }
}

