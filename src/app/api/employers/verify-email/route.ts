import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import crypto from 'crypto';

// GET - Verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find employer with this verification token
    const employers = await executeQuery<{
      id: number;
      email: string;
      email_verified: boolean;
      verification_token_expires: Date;
      status: string;
    }>(
      `SELECT id, email, email_verified, verification_token_expires, status
       FROM employers
       WHERE verification_token = ?`,
      [token]
    );

    if (employers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 404 }
      );
    }

    const employer = employers[0];

    // Check if already verified
    if (employer.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true
      });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(employer.verification_token_expires);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification email.' },
        { status: 400 }
      );
    }

    // Verify email and activate account
    await executeSingleQuery(
      `UPDATE employers 
       SET email_verified = TRUE, 
           verification_token = NULL, 
           verification_token_expires = NULL,
           status = 'active',
           updated_at = NOW()
       WHERE id = ?`,
      [employer.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Your account is now active. You can now log in.',
      data: {
        employerId: employer.id.toString(),
        email: employer.email
      }
    });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Resend verification email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find employer by email
    const employers = await executeQuery<{
      id: number;
      email: string;
      email_verified: boolean;
      first_name: string;
      last_name: string;
    }>(
      `SELECT id, email, email_verified, first_name, last_name
       FROM employers
       WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (employers.length === 0) {
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    const employer = employers[0];

    // Check if already verified
    if (employer.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can log in.',
        alreadyVerified: true
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update verification token
    await executeSingleQuery(
      `UPDATE employers 
       SET verification_token = ?, 
           verification_token_expires = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [verificationToken, verificationTokenExpires, employer.id]
    );

    // Send verification email
    try {
      const { sendEmail } = await import('@/lib/email');
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/employer/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: employer.email,
        subject: 'Verify Your Email - Axia HR Advisory',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
              <h2 style="color: #114373; margin: 0 0 20px 0;">Verify Your Email Address</h2>
              <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
                Hello ${employer.first_name},<br><br>
                You requested a new verification email. Please click the button below to verify your email address:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="background: #114373; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationLink}" style="color: #114373; word-break: break-all;">${verificationLink}</a>
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⏰ Important:</strong> This verification link will expire in 24 hours.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
              <p>Best regards,<br>The Axia HR Advisory Team</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error: any) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email', details: error?.message },
      { status: 500 }
    );
  }
}

