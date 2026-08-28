import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refereeEmail, candidateName, referenceName, verificationLink } = body;

    // Basic validation
    if (!refereeEmail || !candidateName || !referenceName || !verificationLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create HTML email content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #114373; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Axia HR Advisory</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px;">Professional Job Portal</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #114373; margin-top: 0;">Reference Verification Request</h2>
        
        <p>Dear ${referenceName},</p>
        
        <p><strong>${candidateName}</strong> has listed you as a professional reference and has consented to us contacting you for verification purposes.</p>
        
        <p>To complete the reference verification process, please click the button below and fill out the reference form:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #114373; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Complete Reference Verification
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${verificationLink}</p>
        
        <p>This verification will help us confirm ${candidateName}'s professional background and qualifications.</p>
        
        <p>If you have any questions or concerns, please contact us.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          <strong>The Axia HR Advisory Team</strong><br>
          Professional Job Portal & HR Services
        </p>
      </div>
    </div>
    `;

    // Send the actual email
    const emailSent = await sendEmail({
      to: refereeEmail,
      subject: `Reference Verification Request for ${candidateName}`,
      html: htmlContent
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Referee verification email sent successfully',
      emailDetails: {
        to: refereeEmail,
        candidateName,
        referenceName,
        verificationLink
      }
    });

  } catch (error) {
    console.error('Error sending referee email:', error);
    return NextResponse.json(
      { error: 'Failed to send referee email' },
      { status: 500 }
    );
  }
}
