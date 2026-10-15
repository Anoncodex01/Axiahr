import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { handleDatabaseError } from '@/lib/dbErrorHandler';

// Rate limiting for login attempts (in-memory + IP-based)
const loginAttempts = new Map<string, { count: number; lockoutUntil: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour window

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

function checkRateLimit(email: string, ip: string): { allowed: boolean; remainingTime?: number } {
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;
  
  // Check email-based rate limit
  const emailAttempt = loginAttempts.get(emailKey);
  if (emailAttempt && emailAttempt.lockoutUntil > Date.now()) {
    const remainingMinutes = Math.ceil((emailAttempt.lockoutUntil - Date.now()) / 60000);
    return { allowed: false, remainingTime: remainingMinutes };
  }

  // Check IP-based rate limit (prevent distributed attacks)
  const ipAttempt = loginAttempts.get(ipKey);
  if (ipAttempt && ipAttempt.lockoutUntil > Date.now()) {
    const remainingMinutes = Math.ceil((ipAttempt.lockoutUntil - Date.now()) / 60000);
    return { allowed: false, remainingTime: remainingMinutes };
  }

  // Clean up old attempts (older than 1 hour)
  const now = Date.now();
  if (emailAttempt && now - emailAttempt.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(emailKey);
  }
  if (ipAttempt && now - ipAttempt.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(ipKey);
  }

  return { allowed: true };
}

function recordFailedAttempt(email: string, ip: string) {
  const emailKey = `email:${email.toLowerCase()}`;
  const ipKey = `ip:${ip}`;
  const now = Date.now();

  // Record email-based attempt
  const emailAttempt = loginAttempts.get(emailKey) || { count: 0, lockoutUntil: 0, lastAttempt: 0 };
  emailAttempt.count += 1;
  emailAttempt.lastAttempt = now;
  if (emailAttempt.count >= MAX_ATTEMPTS) {
    emailAttempt.lockoutUntil = now + LOCKOUT_TIME;
  }
  loginAttempts.set(emailKey, emailAttempt);

  // Record IP-based attempt (separate counter)
  const ipAttempt = loginAttempts.get(ipKey) || { count: 0, lockoutUntil: 0, lastAttempt: 0 };
  ipAttempt.count += 1;
  ipAttempt.lastAttempt = now;
  if (ipAttempt.count >= MAX_ATTEMPTS * 2) { // IP limit is higher (10 attempts)
    ipAttempt.lockoutUntil = now + LOCKOUT_TIME;
  }
  loginAttempts.set(ipKey, ipAttempt);
}

function resetRateLimit(email: string, ip: string) {
  loginAttempts.delete(`email:${email.toLowerCase()}`);
  // Don't reset IP limit on success (prevents abuse)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check rate limiting (email and IP-based)
    const rateLimitCheck = checkRateLimit(email, clientIP);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateLimitCheck.remainingTime} minutes.`,
          rateLimited: true
        },
        { status: 429 }
      );
    }

    // Find candidate by email (use consistent timing to prevent timing attacks)
    const candidates = await executeQuery(
      'SELECT id, first_name, middle_name, surname, email, phone, password_hash, email_verified, status FROM candidates WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    // Always perform password comparison to prevent timing attacks
    // Use a dummy hash if user doesn't exist
    const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks.by.always.comparing';
    const candidate = candidates.length > 0 ? candidates[0] : null;
    const hashToCompare = candidate?.password_hash || dummyHash;

    // Verify password (always takes same time regardless of user existence)
    const isPasswordValid = candidate && await bcrypt.compare(password, hashToCompare);

    if (!candidate || !isPasswordValid) {
      recordFailedAttempt(email, clientIP);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (candidate.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if email is verified - if not, send new OTP and redirect to verification
    if (!candidate.email_verified) {
      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Store new OTP in database
      await executeSingleQuery(
        `INSERT INTO candidate_email_verifications (candidate_id, email, otp_code, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [candidate.id, candidate.email, otpCode, expiresAt]
      );

      // Send OTP email
      try {
        await sendEmail({
          to: candidate.email,
          subject: 'Verify Your Email - Axia HR Advisory',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #114373; margin: 0;">Axia HR Advisory</h1>
                <p style="color: #666; margin: 10px 0 0 0;">Professional HR Solutions</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #114373; margin: 0 0 20px 0;">Verify Your Email Address</h2>
                <p style="color: #666; margin: 0 0 20px 0;">
                  Thank you for logging in. Please use the verification code below to complete your email verification:
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
          {
            error: 'We could not send the verification code right now. Please check the email service settings and try again.',
            details: process.env.NODE_ENV === 'development' && emailError instanceof Error ? emailError.message : undefined,
            requiresVerification: false
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Please verify your email address',
          requiresVerification: true,
          email: candidate.email,
          candidate: {
            id: candidate.id,
            first_name: candidate.first_name,
            middle_name: candidate.middle_name,
            surname: candidate.surname,
            email: candidate.email,
            phone: candidate.phone,
            gender: candidate.gender
          }
        },
        { status: 200 } // Return 200 to indicate successful login but needs verification
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(email, clientIP);

    // Update last login timestamp
    try {
      await executeSingleQuery(
        'UPDATE candidates SET last_login = NOW() WHERE id = ?',
        [candidate.id]
      );
    } catch (error) {
      console.error('Failed to update last_login:', error);
      // Don't fail login if this update fails
    }

    // Return candidate data (without password) and JWT token
    const { password_hash, ...candidateData } = candidate;
    const token = generateToken({
      sub: candidate.id,
      email: candidate.email,
      type: 'candidate'
    });

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      candidate: candidateData
    });

    // Set secure HttpOnly cookies so server can read auth on requests
    const cookieOptions = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    };
    res.cookies.set('authToken', token, cookieOptions);
    res.cookies.set('axia_candidate_token', token, cookieOptions);
    return res;

  } catch (error: any) {
    console.error('Candidate login error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // Handle database connection errors specifically
    if (error?.code === 'DB_CONNECTION_ERROR' || error?.message?.includes('Database service')) {
      return handleDatabaseError(error);
    }
    
    return NextResponse.json(
      { 
        error: 'Login failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
