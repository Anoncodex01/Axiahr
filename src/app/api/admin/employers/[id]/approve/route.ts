import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery, executeQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// PUT - Approve employer profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employerId } = await params;

    if (!employerId) {
      return NextResponse.json(
        { error: 'Employer ID is required' },
        { status: 400 }
      );
    }

    // First, fetch employer details before updating
    const employerData = await executeQuery<any>(
      `SELECT 
        id,
        company_name,
        contact_person,
        first_name,
        last_name,
        email,
        email_verified,
        industry,
        status,
        profile_status
      FROM employers
      WHERE id = ?`,
      [employerId]
    );

    if (employerData.length === 0) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    const employer = employerData[0];
    const employerEmail = employer.email;
    const companyName = employer.company_name || 'Your Company';
    const contactName = employer.contact_person || 
                       `${employer.first_name || ''} ${employer.last_name || ''}`.trim() || 
                       'Employer';

    // Update profile status to approved
    await executeSingleQuery(
      `UPDATE employers 
       SET profile_status = 'approved', 
           status = 'active',
           updated_at = NOW()
       WHERE id = ?`,
      [employerId]
    );

    // Send email notification to employer
    if (employerEmail && employer.email_verified) {
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/dashboard`;
        const jobPostingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/job-posting`;
        const companyProfileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/company-profile`;
        
        await sendEmail({
          to: employerEmail,
          subject: `Company Profile Approved - ${companyName}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">Axia HR Advisory</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px; font-weight: 300;">Professional HR Solutions</p>
              </div>
              
              <!-- Main Content -->
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <h2 style="color: #114373; margin: 0 0 25px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">Company Profile Approval Confirmation</h2>
                
                <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.7;">
                  Dear ${contactName},
                </p>
                
                <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.7;">
                  We are pleased to inform you that your company profile for <strong>${companyName}</strong> has been reviewed and approved by our verification team. Your employer account has been activated and is now ready for use.
                </p>
                
                <!-- Status Box -->
                <div style="background: #f0f9f4; border-left: 4px solid #28a745; padding: 18px 20px; margin: 25px 0; border-radius: 4px;">
                  <p style="color: #155724; margin: 0; font-size: 14px; line-height: 1.6;">
                    <strong>Account Status:</strong> Approved and Active<br>
                    <strong>Profile Status:</strong> Verified
                  </p>
                </div>
                
                <!-- Action Buttons -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${dashboardUrl}" 
                     style="background: #114373; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px; display: inline-block; margin: 8px; letter-spacing: 0.3px;">
                    Access Dashboard
                  </a>
                  <a href="${jobPostingUrl}" 
                     style="background: #28a745; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 15px; display: inline-block; margin: 8px; letter-spacing: 0.3px;">
                    Post Job Opening
                  </a>
                </div>
                
                <!-- Features Section -->
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #114373; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Available Features</h3>
                  <ul style="color: #495057; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">Post and manage job openings</li>
                    <li style="margin-bottom: 8px;">Access candidate profiles and applications</li>
                    <li style="margin-bottom: 8px;">Utilize end-to-end recruitment services</li>
                    <li style="margin-bottom: 8px;">Manage company profile and settings</li>
                    <li style="margin-bottom: 0;">Track application status and analytics</li>
                  </ul>
                </div>
                
                <!-- Quick Links Section -->
                <div style="background: #f0f7ff; border: 1px solid #cfe2ff; border-radius: 4px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #114373; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Quick Links</h3>
                  <ul style="color: #004085; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                    <li style="margin-bottom: 8px;"><a href="${dashboardUrl}" style="color: #114373; text-decoration: none; border-bottom: 1px solid #114373;">View Employer Dashboard</a></li>
                    <li style="margin-bottom: 8px;"><a href="${companyProfileUrl}" style="color: #114373; text-decoration: none; border-bottom: 1px solid #114373;">Manage Company Profile</a></li>
                    <li style="margin-bottom: 0;"><a href="${jobPostingUrl}" style="color: #114373; text-decoration: none; border-bottom: 1px solid #114373;">Create New Job Posting</a></li>
                  </ul>
                </div>
                
                <!-- Support Information -->
                <div style="border-top: 1px solid #e9ecef; padding-top: 25px; margin-top: 30px;">
                  <p style="color: #495057; margin: 0 0 15px 0; font-size: 14px; line-height: 1.7;">
                    Should you require any assistance or have questions regarding the platform, our support team is available to help.
                  </p>
                  <p style="color: #495057; margin: 0; font-size: 14px; line-height: 1.7;">
                    <strong>Contact Information:</strong><br>
                    Email: <a href="mailto:career@axia.co.tz" style="color: #114373; text-decoration: none;">career@axia.co.tz</a><br>
                    Phone: <a href="tel:+255786443003" style="color: #114373; text-decoration: none;">+255 786 443 003</a><br>
                    Website: <a href="https://www.axia.co.tz" style="color: #114373; text-decoration: none;">www.axia.co.tz</a>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 25px 30px; text-align: center;">
                <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                  Best regards,<br>
                  <strong style="color: #114373;">Axia HR Advisory Team</strong>
                </p>
                <p style="color: #adb5bd; margin: 15px 0 0 0; font-size: 12px; line-height: 1.5;">
                  This is an automated notification. Please do not reply to this email.<br>
                  &copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.
                </p>
              </div>
            </div>
          `
        });
        console.log('Employer approval email sent successfully to:', employerEmail);
      } catch (emailError: any) {
        // Log email error but don't fail the approval
        console.error('Error sending employer approval email:', emailError);
        // Continue with the approval even if email fails
      }
    } else {
      if (!employerEmail) {
        console.warn('No employer email found for approval notification');
      } else if (!employer.email_verified) {
        console.warn('Employer email not verified, skipping approval email notification');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Employer profile approved successfully'
    });

  } catch (error: any) {
    console.error('Approve employer error:', error);
    return NextResponse.json(
      { error: 'Failed to approve employer', details: error?.message },
      { status: 500 }
    );
  }
}

