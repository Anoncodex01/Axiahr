import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refereeEmail, refereeName, candidateName } = body;

    // Basic validation
    if (!refereeEmail || !refereeName) {
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
        <h2 style="color: #114373; margin-top: 0;">Thank You for Your Reference</h2>
        
        <p>Dear ${refereeName},</p>
        
        <p>Hello ${refereeName}, this is from <strong>Axia HR Advisory</strong>.</p>
        
        <p>We have successfully received your reference verification for <strong>${candidateName}</strong>. Thank you for taking the time to provide this valuable feedback.</p>
        
        <p>Your reference has been recorded and will be used to help us assess ${candidateName}'s professional qualifications and suitability for opportunities.</p>
        
        <p>We appreciate your cooperation and the time you took to complete the verification process.</p>
        
        <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
        
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
      subject: `Thank You for Your Reference - Axia HR Advisory`,
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
      message: 'Referee confirmation email sent successfully',
      emailDetails: {
        to: refereeEmail,
        refereeName,
        candidateName
      }
    });

  } catch (error) {
    console.error('Error sending referee confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send referee confirmation email' },
      { status: 500 }
    );
  }
}
