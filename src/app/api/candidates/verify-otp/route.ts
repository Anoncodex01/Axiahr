import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery, executeTransaction } from '@/lib/database';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find the most recent unverified OTP for this email
    const otpRecord = await executeQuery(
      `SELECT cev.*, c.id as candidate_id, c.first_name, c.surname
       FROM candidate_email_verifications cev
       JOIN candidates c ON cev.candidate_id = c.id
       WHERE cev.email = ? AND cev.otp_code = ? AND cev.verified = FALSE AND cev.expires_at > NOW()
       ORDER BY cev.created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    if (otpRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    const { candidate_id } = otpRecord[0];

    // Use transaction to ensure both updates succeed or fail together
    await executeTransaction(async (connection) => {
      // Mark OTP as verified
      await connection.execute(
        'UPDATE candidate_email_verifications SET verified = TRUE WHERE id = ?',
        [otpRecord[0].id]
      );

      // Mark candidate email as verified
      await connection.execute(
        'UPDATE candidates SET email_verified = TRUE WHERE id = ?',
        [candidate_id]
      );
    });

    // Get candidate data for response
    const candidate = await executeQuery(
      'SELECT id, first_name, middle_name, surname, email, phone, gender FROM candidates WHERE id = ?',
      [candidate_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      candidate: candidate[0]
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find candidate by email
    const candidate = await executeQuery(
      'SELECT id FROM candidates WHERE email = ?',
      [email]
    );

    if (candidate.length === 0) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    const candidateId = candidate[0].id;

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store new OTP in database
    await executeSingleQuery(
      `INSERT INTO candidate_email_verifications (candidate_id, email, otp_code, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [candidateId, email, otpCode, expiresAt]
    );

    // Send new OTP email
    try {
      await sendEmail({
        to: email,
        subject: 'New Verification Code - Axia HR Advisory',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h2 style="color: #114373; margin: 0 0 20px 0;">New Verification Code</h2>
              <p style="color: #666; margin: 0 0 20px 0;">
                You requested a new verification code. Please use the code below to verify your email:
              </p>
              
              <div style="background: #114373; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                ${otpCode}
              </div>
              
              <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
                This code will expire in 5 minutes. If you didn't request this verification, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Best regards,<br>The Axia HR Advisory Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}
