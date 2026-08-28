import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeTransaction } from '@/lib/database';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

// POST - Register new employer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      industry,
      jobTitle,
      password
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !companyName || !industry || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, phone, company name, industry, and password are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (should include country code and at least 6 digits)
    const phoneRegex = /^\+\d{1,4}\d{6,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please include country code and phone number.' },
        { status: 400 }
      );
    }

    // Parse phone number: extract country code and phone number
    // Format: +255775228897 -> countryCode: +255, phoneNumber: 775228897
    const phoneTrimmed = phone.trim();
    let mobileCountryCode = '+255'; // Default to Tanzania
    let mobilePhone = phoneTrimmed;
    
    // Extract country code (1-4 digits after +)
    const countryCodeMatch = phoneTrimmed.match(/^(\+\d{1,4})/);
    if (countryCodeMatch) {
      mobileCountryCode = countryCodeMatch[1];
      mobilePhone = phoneTrimmed.substring(countryCodeMatch[1].length);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Check if employer already exists (including unverified accounts)
    const existingEmployers = await executeQuery(
      'SELECT id, email, email_verified, status FROM employers WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingEmployers.length > 0) {
      const employer = existingEmployers[0];
      // If account exists but not verified, allow resending verification
      if (!employer.email_verified) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists but is not verified. Please check your email for verification link or contact support.',
            unverified: true,
            email: employer.email
          },
          { status: 409 }
        );
      }
      // If verified, they should login
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    // Use transaction to ensure atomicity - all or nothing
    const { employerId, verificationToken } = await executeTransaction(async (connection) => {
      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Create employer account using transaction
      // Try with new columns first (including industry and mobile_phone/mobile_country_code)
      let result;
      try {
        const [insertResult] = await connection.execute(
          `INSERT INTO employers (
            company_name, contact_person, first_name, last_name, job_title, industry,
            email, password_hash, mobile_phone, mobile_country_code,
            email_verified, verification_token, verification_token_expires, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyName.trim(),
            `${firstName.trim()} ${lastName.trim()}`.trim(),
            firstName.trim(),
            lastName.trim(),
            jobTitle?.trim() || null,
            industry.trim(),
            email.toLowerCase().trim(),
            passwordHash,
            mobilePhone.trim(),
            mobileCountryCode.trim(),
            false, // email_verified
            verificationToken,
            verificationTokenExpires,
            'pending' // status
          ]
        );
        result = insertResult as any;
      } catch (error: any) {
        // If new columns don't exist, try with industry but without first_name/last_name/job_title
        if (error?.code === 'ER_BAD_FIELD_ERROR') {
          try {
            const [insertResult] = await connection.execute(
              `INSERT INTO employers (
                company_name, contact_person, industry,
                email, password_hash, mobile_phone, mobile_country_code,
                email_verified, verification_token, verification_token_expires, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                companyName.trim(),
                `${firstName.trim()} ${lastName.trim()}`.trim(),
                industry.trim(),
                email.toLowerCase().trim(),
                passwordHash,
                mobilePhone.trim(),
                mobileCountryCode.trim(),
                false, // email_verified
                verificationToken,
                verificationTokenExpires,
                'pending' // status
              ]
            );
            result = insertResult as any;
          } catch (error2: any) {
            // If industry column also doesn't exist, use old structure without industry
            if (error2?.code === 'ER_BAD_FIELD_ERROR') {
              const [insertResult] = await connection.execute(
                `INSERT INTO employers (
                  company_name, contact_person,
                  email, password_hash, mobile_phone, mobile_country_code,
                  email_verified, verification_token, verification_token_expires, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  companyName.trim(),
                  `${firstName.trim()} ${lastName.trim()}`.trim(),
                  email.toLowerCase().trim(),
                  passwordHash,
                  mobilePhone.trim(),
                  mobileCountryCode.trim(),
                  false, // email_verified
                  verificationToken,
                  verificationTokenExpires,
                  'pending' // status
                ]
              );
              result = insertResult as any;
            } else {
              throw error2;
            }
          }
        } else {
          throw error;
        }
      }

      const employerId = (result as any).insertId;
      return { employerId, verificationToken };
    });

    // Send verification email
    // Note: Email sending failure should not prevent account creation
    let emailSent = false;
    let emailError = null;
    
    try {
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/employer/verify-email?token=${verificationToken}`;
      
      console.log('📧 Attempting to send verification email to:', email);
      console.log('📧 Verification link:', verificationLink);
      
      const emailResult = await sendEmail({
        to: email,
        subject: 'Email Verification Required - Axia HR Advisory',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
              <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Email Verification Required</h2>
              <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">Thank you for registering as an employer. Please verify your email to complete registration.</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${verificationLink}" style="background: #114373; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 15px;">Verify Email Address</a>
              </div>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 12px; margin: 20px 0;">
                <p style="color: #495057; margin: 0 0 8px 0; font-size: 13px; word-break: break-all;"><strong>Or copy this link:</strong></p>
                <p style="color: #114373; margin: 0; font-size: 12px; word-break: break-all;">${verificationLink}</p>
              </div>
              <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 13px; line-height: 1.5;">
                  <strong>Important:</strong> This link expires in 24 hours. If you did not create an account, please ignore this email.
                </p>
              </div>
            </div>
            <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
              <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
              <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
            </div>
          </div>
        `
      });
      
      emailSent = true;
      console.log('✅ Verification email sent successfully to:', email);
    } catch (err: any) {
      emailError = err;
      console.error('❌ Failed to send verification email to:', email);
      console.error('❌ Error details:', {
        message: err?.message,
        code: err?.code,
        response: err?.response,
        stack: err?.stack
      });
      
      // Log SMTP-specific errors
      if (err?.response) {
        console.error('❌ SMTP Response:', err.response);
      }
      if (err?.code) {
        console.error('❌ Error Code:', err.code);
      }
      if (err?.command) {
        console.error('❌ SMTP Command:', err.command);
      }
      
      // Don't fail registration if email fails - account is already created
    }

    // Return success response
    // Include verification token in response if email failed (for manual verification)
    const response: any = {
      success: true,
      emailSent: emailSent,
      message: emailSent 
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. However, we could not send the verification email. Please contact support or use the verification link below.',
      data: {
        employerId: employerId.toString(),
        email: email,
      }
    };

    // Include verification token if email failed (for development/testing or manual verification)
    if (!emailSent) {
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/employer/verify-email?token=${verificationToken}`;
      response.data.verificationLink = verificationLink;
      response.data.verificationToken = verificationToken; // Only include if email failed
      response.warning = 'Email delivery failed. Please use the verification link provided.';
      
      if (emailError) {
        response.emailError = process.env.NODE_ENV === 'development' 
          ? emailError.message 
          : 'Email delivery failed. Please contact support.';
        console.error('📧 Email error details for response:', emailError.message);
      }
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Employer registration error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to register employer account';
    if (error?.code === 'ER_DUP_ENTRY') {
      errorMessage = 'An account with this email or phone number already exists';
    } else if (error?.code === 'ER_BAD_FIELD_ERROR') {
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
