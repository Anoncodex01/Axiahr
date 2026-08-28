import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

// POST /api/employer/candidate-action - Handle employer actions on candidates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, action, notes, interviewData } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['interview_again', 'reject', 'select'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: interview_again, reject, select' },
        { status: 400 }
      );
    }

    // Get application details
    const applications = await executeQuery(`
      SELECT a.*, j.employer_id, j.title as job_title
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [applicationId]);

    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = applications[0];

    // Map employer actions to application statuses
    let newStatus = '';
    switch (action) {
      case 'interview_again':
        newStatus = 'interview_again';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'select':
        newStatus = 'selected';
        break;
      default:
        newStatus = application.status;
    }

    // Update application status
    await executeSingleQuery(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newStatus, applicationId]);

    // Store employer notes if provided
    if (notes) {
      await executeSingleQuery(`
        UPDATE applications 
        SET admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n\n[Employer Note] ', ?)
        WHERE id = ?
      `, [notes, applicationId]);
    }

    // If interview is scheduled, create interview record and send email
    if (action === 'interview_again' && interviewData) {
      try {
        // Get a system user ID (admin/recruiter) for employer interviews
        // First, try to find an active admin or recruiter user
        const systemUsers = await executeQuery(`
          SELECT id FROM users 
          WHERE role IN ('admin', 'recruiter', 'hr_manager') AND status = 'active'
          LIMIT 1
        `, []);
        
        const interviewerId = systemUsers.length > 0 ? systemUsers[0].id : 1; // Fallback to ID 1
        
        // Combine date and time into datetime string
        const scheduledDateTime = `${interviewData.date}T${interviewData.time}:00`;
        
        // Create interview record
        const interviewResult = await executeSingleQuery(`
          INSERT INTO interviews (
            application_id, 
            interviewer_id, 
            interview_type, 
            scheduled_date, 
            duration_minutes,
            location, 
            meeting_link, 
            status, 
            notes
          ) VALUES (?, ?, ?, ?, 60, ?, ?, 'scheduled', ?)
        `, [
          applicationId,
          interviewerId,
          interviewData.type === 'online' ? 'video' : 'in_person',
          scheduledDateTime,
          interviewData.location || null,
          interviewData.link || null,
          notes || `Employer requested interview: ${interviewData.type}`
        ]);

        const interviewId = interviewResult.insertId;

        // Get candidate information for email
        const candidateInfo = await executeQuery(`
          SELECT c.id, c.first_name, c.surname, c.email, j.title as job_title
          FROM candidates c
          JOIN applications a ON c.id = a.candidate_id
          JOIN jobs j ON a.job_id = j.id
          WHERE a.id = ?
        `, [applicationId]);

        if (candidateInfo.length > 0) {
          const candidate = candidateInfo[0];
          
          // Format date and time for email
          const interviewDate = new Date(scheduledDateTime);
          const date = interviewDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const time = interviewDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
          });

          // Create notification for candidate
          try {
            await executeSingleQuery(`
              INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
              VALUES (?, 'candidate', 'interview_scheduled', 'Interview Scheduled', ?, ?)
            `, [
              candidate.id,
              `Your interview has been scheduled for ${date} at ${time}`,
              JSON.stringify({ interviewId, applicationId, scheduledDate: scheduledDateTime, interviewType: interviewData.type === 'online' ? 'video' : 'in_person' })
            ]);
          } catch (notifError) {
            console.error('Error creating notification:', notifError);
            // Don't fail if notification creation fails
          }

          // Send email notification to candidate
          try {
            const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #114373, #0d3559); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
                      <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Interview Scheduled</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
                      <h2 style="color: #114373; margin-top: 0; font-size: 20px;">Congratulations, ${candidate.first_name}!</h2>
                    
                      <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                        Your application for <strong>${candidate.job_title}</strong> has been shortlisted, and we're excited to schedule an interview with you!
                      </p>
                      
                      <div style="background: white; border-left: 4px solid #114373; padding: 20px; margin: 25px 0; border-radius: 8px;">
                        <h3 style="color: #114373; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📅 Interview Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Date:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${date}</strong></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${time}</strong></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Type:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${interviewData.type === 'online' ? 'Video Interview' : 'In-Person Interview'}</strong></td>
                          </tr>
                          ${interviewData.location ? `
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Location:</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${interviewData.location}</strong></td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>
                      
                      ${interviewData.link ? `
                      <div style="background: linear-gradient(135deg, #114373, #0d3559); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                        <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🔗 Join Interview</h3>
                        <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 14px;">
                          Click the button below to join the interview at the scheduled time:
                        </p>
                        <a href="${interviewData.link}" 
                           style="background: white; color: #114373; padding: 14px 28px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                          🎥 Join Meeting
                        </a>
                        <p style="color: rgba(255,255,255,0.8); margin: 15px 0 0 0; font-size: 12px; word-break: break-all;">
                          Or copy this link: ${interviewData.link}
                        </p>
                      </div>
                      ` : ''}
                      
                      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Interview Tips:</h4>
                        <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                          ${interviewData.type === 'online' ? `
                          <li>Test your internet connection and camera/microphone beforehand</li>
                          <li>Find a quiet, well-lit space for the interview</li>
                          <li>Join the meeting 5 minutes early</li>
                          ` : `
                          <li>Arrive 10-15 minutes early</li>
                          <li>Bring copies of your resume and any relevant documents</li>
                          <li>Dress professionally</li>
                          `}
                          <li>Prepare questions to ask about the role and company</li>
                          <li>Review the job description and your application</li>
                        </ul>
                      </div>
                      
                      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 25px;">
                        If you have any questions or need to reschedule, please contact us as soon as possible.
                      </p>
                      
                      <p style="color: #1e293b; font-size: 16px; margin-top: 30px;">
                        Best regards,<br>
                        <strong>The Axia HR Team</strong>
                      </p>
                    </div>
                    
                    <div style="background: #114373; color: white; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px;">
                      <p style="margin: 0;">© 2024 Axia HR Advisory. All rights reserved.</p>
                    </div>
                  </div>
                `;

            await sendEmail({
              to: candidate.email,
              subject: `Interview Scheduled - ${candidate.job_title}`,
              html: emailHtml,
            });
          } catch (emailError) {
            console.error('Error sending interview email:', emailError);
            // Don't fail the whole operation if email sending fails
          }
        }
      } catch (error) {
        console.error('Error creating interview record:', error);
        // Don't fail the whole operation if interview creation fails
      }
    }

    // Log status change
    try {
      await executeSingleQuery(`
        INSERT INTO application_status_history (
          application_id, 
          old_status, 
          new_status, 
          changed_by, 
          change_reason
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        applicationId,
        application.status,
        newStatus,
        application.employer_id, // Using employer_id as changed_by
        `Employer action: ${action}${notes ? ` - ${notes}` : ''}`
      ]);
    } catch (error) {
      console.error('Error logging status change:', error);
      // Don't fail the whole operation if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${action} successfully`,
      applicationId,
      newStatus
    });

  } catch (error) {
    console.error('Error processing candidate action:', error);
    return NextResponse.json(
      { error: 'Failed to process candidate action' },
      { status: 500 }
    );
  }
}

