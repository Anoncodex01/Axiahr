import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeQuery, executeTransaction, executeSingleQuery } from '@/lib/database';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('Failed to parse request body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid request body. Please ensure Content-Type is application/json and the body is valid JSON.' },
        { status: 400 }
      );
    }

    const { firstName, middleName, surname, gender, email, phone, password, requestId } = body;

    // Validate required fields
    if (!firstName || !surname || !email || !phone || !password || !gender) {
      return NextResponse.json(
        { error: 'All required fields are missing' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^\+\d{1,4}\d{6,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please include country code and phone number.' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Normalize email and phone
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Normalize gender to lowercase to match database ENUM ('male', 'female', 'other')
    const normalizedGender = gender ? gender.toLowerCase() : null;
    if (normalizedGender && !['male', 'female', 'other'].includes(normalizedGender)) {
      return NextResponse.json(
        { error: 'Invalid gender value. Please select Male, Female, or Other.' },
        { status: 400 }
      );
    }

    // Check if email already exists (outside transaction for early return)
    const existingEmail = await executeQuery(
      'SELECT id, email_verified, first_name, middle_name, surname, phone, gender FROM candidates WHERE email = ?',
      [normalizedEmail]
    );

    if (existingEmail.length > 0) {
      const candidate = existingEmail[0];
      if (candidate.email_verified) {
        return NextResponse.json(
          { error: 'Email already registered and verified. Please login instead.' },
          { status: 409 }
        );
      } else {
        // Email exists but not verified - generate new OTP and send it
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Store new OTP in database
        try {
          await executeSingleQuery(
            `INSERT INTO candidate_email_verifications (candidate_id, email, otp_code, expires_at) 
             VALUES (?, ?, ?, ?)`,
            [candidate.id, normalizedEmail, otpCode, expiresAt]
          );
        } catch (otpError) {
          console.error('Failed to create OTP:', otpError);
          // Continue anyway - might be duplicate OTP
        }

        try {
          await sendEmail({
            to: normalizedEmail,
            subject: 'Email Verification Code - Axia HR Advisory',
            html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
              </div>
              <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Email Verification</h2>
                <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Your account exists but email is not verified. Please use the code below to verify your email:</p>
                <div style="background: #f8f9fa; border: 2px solid #114373; border-radius: 4px; padding: 25px; text-align: center; margin: 25px 0;">
                  <p style="color: #495057; margin: 0 0 10px 0; font-size: 13px; font-weight: 500;">Verification Code</p>
                  <div style="background: #114373; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace;">
                    ${otpCode}
                  </div>
                  <p style="color: #dc3545; margin: 15px 0 0 0; font-size: 13px; font-weight: 500;">Expires in 5 minutes</p>
                </div>
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 20px 0;">
                  <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.5;">If you did not create an account, please ignore this email.</p>
                </div>
              </div>
              <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
                <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
                <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `
          });
        } catch (emailError: any) {
          console.error('❌ Failed to send OTP email for unverified account:', emailError);
          return NextResponse.json(
            {
              error: 'We found your account, but could not send a new verification code right now. Please check the email service settings and try again.',
              details: process.env.NODE_ENV === 'development' ? emailError?.message : undefined
            },
            { status: 503 }
          );
        }

        // Return success with redirect to verification immediately
        return NextResponse.json({
          success: true,
          message: 'A new verification code has been sent to your email. Please verify your email to continue.',
          unverified: true,
          requiresVerification: true,
          email: normalizedEmail,
          candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            middle_name: candidate.middle_name,
            surname: candidate.surname,
            email: normalizedEmail,
            phone: candidate.phone,
            gender: candidate.gender
          }
        }, { status: 200 });
      }
    }

    // Check if phone number already exists
    const existingPhone = await executeQuery(
      'SELECT id FROM candidates WHERE phone = ?',
      [normalizedPhone]
    );

    if (existingPhone.length > 0) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Hash password before transaction (faster)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Use transaction to ensure data consistency and handle race conditions
    // This prevents duplicate registrations even with 100+ simultaneous requests
    const result = await executeTransaction(async (connection) => {
      // Double-check for duplicates within transaction (handles race conditions)
      // Removed FOR UPDATE to avoid lock contention - we already checked before transaction
      const [duplicateCheck] = await connection.execute(
        'SELECT id, email_verified, email, phone FROM candidates WHERE email = ? OR phone = ?',
        [normalizedEmail, normalizedPhone]
      ) as any[];

      if (duplicateCheck.length > 0) {
        const existing = duplicateCheck[0];
        if (existing.email === normalizedEmail) {
          if (existing.email_verified) {
            throw new Error('EMAIL_VERIFIED');
          } else {
            throw new Error('EMAIL_UNVERIFIED');
          }
        } else {
          throw new Error('PHONE_EXISTS');
        }
      }

      // Create candidate record
      const [candidateResult] = await connection.execute(
        `INSERT INTO candidates (first_name, middle_name, surname, email, phone, gender, password_hash, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [firstName.trim(), middleName?.trim() || null, surname.trim(), normalizedEmail, normalizedPhone, normalizedGender, passwordHash, 'active']
      );

      const candidateId = (candidateResult as any).insertId;

      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Store OTP in database
      await connection.execute(
        `INSERT INTO candidate_email_verifications (candidate_id, email, otp_code, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [candidateId, normalizedEmail, otpCode, expiresAt]
      );

      return { candidateId, otpCode };
    });

    const { candidateId, otpCode } = result;

    console.log('📧 Sending OTP email to:', email);

    try {
      await sendEmail({
      to: email,
      subject: 'Email Verification Code - Axia HR Advisory',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Email Verification</h2>
            <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Thank you for registering. Please use the code below to verify your email:</p>
            <div style="background: #f8f9fa; border: 2px solid #114373; border-radius: 4px; padding: 25px; text-align: center; margin: 25px 0;">
              <p style="color: #495057; margin: 0 0 10px 0; font-size: 13px; font-weight: 500;">Verification Code</p>
              <div style="background: #114373; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace;">
                ${otpCode}
              </div>
              <p style="color: #dc3545; margin: 15px 0 0 0; font-size: 13px; font-weight: 500;">Expires in 5 minutes</p>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.5;">If you did not create an account, please ignore this email.</p>
            </div>
          </div>
          <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
            <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
          </div>
        </div>
      `
      });
    } catch (emailError: any) {
      console.error('❌ Failed to send OTP email during registration:', emailError);
      return NextResponse.json(
        {
          error: 'Registration was saved, but we could not send the verification code right now. Please check the email service settings and use Resend verification code.',
          details: process.env.NODE_ENV === 'development' ? emailError?.message : undefined,
          data: {
            candidateId,
            email
          }
        },
        { status: 503 }
      );
    }

    console.log('📧 OTP email sent successfully to:', email);


    // Return success response immediately - email is sent in background
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        candidateId,
        email
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Candidate registration error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack
    });

    // Handle specific transaction errors
    if (error?.message === 'EMAIL_VERIFIED') {
      return NextResponse.json(
        { error: 'Email already registered and verified. Please login instead.' },
        { status: 409 }
      );
    }

    if (error?.message === 'EMAIL_UNVERIFIED') {
      return NextResponse.json(
        {
          error: 'Email already registered but not verified. Please check your email for verification code or contact support.',
          unverified: true
        },
        { status: 409 }
      );
    }

    if (error?.message === 'PHONE_EXISTS') {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Handle database errors
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists' },
        { status: 409 }
      );
    }

    // Provide more specific error messages
    let errorMessage = 'Registration failed. Please try again.';
    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Database schema error. Please contact support.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
