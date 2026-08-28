import { sendEmail } from './email';

// Email notification templates and functions for the recruitment management system

export interface EmailNotificationData {
  recipientEmail: string;
  recipientName: string;
  type: EmailNotificationType;
  data: any;
}

export type EmailNotificationType = 
  | 'application_received'
  | 'application_reviewed'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'evaluation_completed'
  | 'candidate_screened'
  | 'offer_sent'
  | 'offer_response'
  | 'payment_required'
  | 'payment_completed'
  | 'invoice_generated'
  | 'invoice_sent'
  | 'withholding_tax_uploaded'
  | 'job_closed'
  | 'status_update';

// Application received notification
export async function sendApplicationReceivedNotification(data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationId: string;
}) {
  const emailData = {
    to: data.candidateEmail,
    subject: `Application Confirmation - ${data.jobTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Application Received</h2>
          <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Dear ${data.candidateName},</p>
          <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
            Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been received.
          </p>
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Application ID:</strong> ${data.applicationId}</p>
            <p style="color: #495057; margin: 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
            Our team will review your application and contact you within 5-7 business days if you are shortlisted.
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/candidate/applications" style="background: #114373; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 15px;">View Application Status</a>
          </div>
        </div>
        <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
          <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
          <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Interview scheduled notification
export async function sendInterviewScheduledNotification(data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'phone' | 'video' | 'in_person';
  location?: string;
  meetingLink?: string;
  interviewerName: string;
}) {
  const emailData = {
    to: data.candidateEmail,
    subject: `Interview Scheduled - ${data.jobTitle}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Interview Scheduled</h2>
          <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Dear ${data.candidateName},</p>
          <p style="color: #333333; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
            An interview has been scheduled for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.
          </p>
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 20px; margin: 20px 0;">
            <p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(data.interviewDate).toLocaleDateString()}</p>
            <p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Time:</strong> ${data.interviewTime}</p>
            <p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Type:</strong> ${data.interviewType.charAt(0).toUpperCase() + data.interviewType.slice(1).replace('_', ' ')}</p>
            <p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Interviewer:</strong> ${data.interviewerName}</p>
            ${data.location ? `<p style="color: #495057; margin: 0 0 8px 0; font-size: 14px;"><strong>Location:</strong> ${data.location}</p>` : ''}
            ${data.meetingLink ? `<p style="color: #495057; margin: 0; font-size: 14px;"><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #114373;">${data.meetingLink}</a></p>` : ''}
          </div>
          <p style="color: #333333; margin: 20px 0 0 0; font-size: 15px; line-height: 1.6;">
            Please confirm your attendance or contact us to reschedule if needed.
          </p>
        </div>
        <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
          <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
          <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Evaluation completed notification (to employer)
export async function sendEvaluationCompletedNotification(data: {
  employerEmail: string;
  employerName: string;
  candidateName: string;
  jobTitle: string;
  evaluationScore: number;
  recommendation: string;
  evaluationId: string;
}) {
  const emailData = {
    to: data.employerEmail,
    subject: `Candidate Evaluation Available - ${data.candidateName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Evaluation Complete</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.employerName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            The evaluation for <strong>${data.candidateName}</strong> has been completed for the <strong>${data.jobTitle}</strong> position.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Evaluation Summary</h3>
            <p><strong>Candidate:</strong> ${data.candidateName}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Overall Score:</strong> ${data.evaluationScore}/10</p>
            <p><strong>Recommendation:</strong> ${data.recommendation.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/screened-candidates?evaluationId=${data.evaluationId}" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Evaluation
            </a>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Please log in to your employer portal to view the complete evaluation details and make your hiring decision.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Offer letter sent notification
export async function sendOfferLetterNotification(data: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  offerAmount: string;
  expiryDate: string;
  offerLetterUrl: string;
}) {
  const emailData = {
    to: data.candidateEmail,
    subject: `Offer Letter - ${data.jobTitle} at ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">You've Received an Offer</p>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.candidateName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Congratulations! We are pleased to offer you the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Offer Details</h3>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Offer Amount:</strong> ${data.offerAmount}</p>
            <p><strong>Response Deadline:</strong> ${new Date(data.expiryDate).toLocaleDateString()}</p>
          </div>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">Next Steps</h4>
            <ol style="color: #333; margin: 0;">
              <li>Review the attached offer letter carefully</li>
              <li>Consider the terms and conditions</li>
              <li>Respond by the deadline: ${new Date(data.expiryDate).toLocaleDateString()}</li>
              <li>Contact us if you have any questions</li>
            </ol>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/candidate/offers" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              View Offer Details
            </a>
            <a href="${data.offerLetterUrl}" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Offer Letter
            </a>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            We're excited about the possibility of you joining our team. Please don't hesitate to reach out if you have any questions.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Payment required notification
export async function sendPaymentRequiredNotification(data: {
  employerEmail: string;
  employerName: string;
  candidateName: string;
  jobTitle: string;
  paymentAmount: string;
  paymentLink: string;
  dueDate: string;
}) {
  const emailData = {
    to: data.employerEmail,
    subject: `Payment Required - ${data.candidateName} Placement`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Required</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.employerName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Congratulations! <strong>${data.candidateName}</strong> has accepted the offer for the <strong>${data.jobTitle}</strong> position.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Payment Details</h3>
            <p><strong>Candidate:</strong> ${data.candidateName}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Amount Due:</strong> ${data.paymentAmount}</p>
            <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">Important Information</h4>
            <ul style="color: #333; margin: 0;">
              <li>Payment must be completed before the candidate starts</li>
              <li>An invoice will be generated automatically after payment</li>
              <li>Withholding tax documents must be uploaded after payment</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.paymentLink}" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Make Payment
            </a>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            If you have any questions about the payment process, please contact our finance team.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Invoice generated notification
export async function sendInvoiceGeneratedNotification(data: {
  employerEmail: string;
  employerName: string;
  invoiceNumber: string;
  invoiceAmount: string;
  invoiceUrl: string;
  candidateName: string;
  jobTitle: string;
}) {
  const emailData = {
    to: data.employerEmail,
    subject: `Invoice Generated - ${data.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Invoice Generated</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.employerName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Your invoice has been generated for the successful placement of <strong>${data.candidateName}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Invoice Details</h3>
            <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
            <p><strong>Amount:</strong> ${data.invoiceAmount}</p>
            <p><strong>Candidate:</strong> ${data.candidateName}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">Next Steps</h4>
            <ol style="color: #333; margin: 0;">
              <li>Download and review the invoice</li>
              <li>Process payment according to your company's procedures</li>
              <li>Upload withholding tax documents after payment</li>
              <li>Keep records for your accounting purposes</li>
            </ol>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invoiceUrl}" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Invoice
            </a>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Thank you for choosing our recruitment services. We look forward to continuing our partnership.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Withholding tax document uploaded notification
export async function sendWithholdingTaxUploadedNotification(data: {
  adminEmail: string;
  employerName: string;
  invoiceNumber: string;
  candidateName: string;
  jobTitle: string;
  documentUrl: string;
}) {
  const emailData = {
    to: data.adminEmail,
    subject: `Withholding Tax Document Uploaded - ${data.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Document Uploaded</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear Admin Team,</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            <strong>${data.employerName}</strong> has uploaded the withholding tax document for invoice <strong>${data.invoiceNumber}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Document Details</h3>
            <p><strong>Employer:</strong> ${data.employerName}</p>
            <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
            <p><strong>Candidate:</strong> ${data.candidateName}</p>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Upload Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.documentUrl}" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Document
            </a>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Please review the document and verify its accuracy. Once verified, the job position can be marked as closed.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Job closed notification
export async function sendJobClosedNotification(data: {
  employerEmail: string;
  employerName: string;
  jobTitle: string;
  hiredCandidates: string[];
  totalPlacements: number;
}) {
  const emailData = {
    to: data.employerEmail,
    subject: `Job Position Closed - ${data.jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Position Closed</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${data.employerName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Congratulations! The <strong>${data.jobTitle}</strong> position has been successfully closed with <strong>${data.totalPlacements}</strong> placement(s).
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #114373; margin-top: 0;">Hired Candidates</h3>
            <ul style="color: #333; margin: 0;">
              ${data.hiredCandidates.map(candidate => `<li>${candidate}</li>`).join('')}
            </ul>
          </div>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin-top: 0;">What's Next?</h4>
            <ul style="color: #333; margin: 0;">
              <li>All candidates have been successfully onboarded</li>
              <li>Invoices have been generated and processed</li>
              <li>Withholding tax documents have been uploaded</li>
              <li>The recruitment process is now complete</li>
            </ul>
          </div>
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Thank you for choosing our recruitment services. We hope the new team members will be valuable additions to your organization.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/employer/jobs" 
               style="background: #114373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View All Jobs
            </a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Generic notification sender
export async function sendNotification(notificationData: EmailNotificationData) {
  try {
    switch (notificationData.type) {
      case 'application_received':
        return await sendApplicationReceivedNotification(notificationData.data);
      case 'interview_scheduled':
        return await sendInterviewScheduledNotification(notificationData.data);
      case 'evaluation_completed':
        return await sendEvaluationCompletedNotification(notificationData.data);
      case 'offer_sent':
        return await sendOfferLetterNotification(notificationData.data);
      case 'payment_required':
        return await sendPaymentRequiredNotification(notificationData.data);
      case 'invoice_generated':
        return await sendInvoiceGeneratedNotification(notificationData.data);
      case 'withholding_tax_uploaded':
        return await sendWithholdingTaxUploadedNotification(notificationData.data);
      case 'job_closed':
        return await sendJobClosedNotification(notificationData.data);
      default:
        console.warn(`Unknown notification type: ${notificationData.type}`);
        return { success: false, error: 'Unknown notification type' };
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Batch notification sender for multiple recipients
export async function sendBatchNotifications(notifications: EmailNotificationData[]) {
  const results = await Promise.allSettled(
    notifications.map(notification => sendNotification(notification))
  );
  
  return results.map((result, index) => ({
    notification: notifications[index],
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason : null
  }));
}
