import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { comparePassword, generateToken } from '@/lib/auth';
import { handleDatabaseError } from '@/lib/dbErrorHandler';

// Rate limiting for login attempts (email + IP-based)
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

// POST - Employer login
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

    // Find employer by email
    // Try to select with new columns first, fallback to old structure
    let employers;
    try {
      employers = await executeQuery<{
        id: number;
        company_name: string;
        contact_person: string;
        first_name?: string;
        last_name?: string;
        email: string;
        password_hash: string;
        email_verified: boolean;
        status: string;
        last_login: Date | null;
      }>(
        `SELECT id, company_name, contact_person, 
                COALESCE(first_name, '') as first_name, 
                COALESCE(last_name, '') as last_name, 
                email, password_hash, email_verified, status, last_login
         FROM employers
         WHERE email = ?`,
        [email.toLowerCase().trim()]
      );
    } catch (error: any) {
      // If new columns don't exist, use old structure
      if (error?.code === 'ER_BAD_FIELD_ERROR') {
        employers = await executeQuery<{
          id: number;
          company_name: string;
          contact_person: string;
          email: string;
          password_hash: string;
          email_verified: boolean;
          status: string;
          last_login: Date | null;
        }>(
          `SELECT id, company_name, contact_person, email, password_hash, 
                  COALESCE(email_verified, FALSE) as email_verified, 
                  COALESCE(status, 'active') as status, 
                  NULL as last_login
           FROM employers
           WHERE email = ?`,
          [email.toLowerCase().trim()]
        );
        // Set defaults for missing columns
        if (employers.length > 0) {
          (employers[0] as any).first_name = '';
          (employers[0] as any).last_name = '';
          (employers[0] as any).email_verified = true; // Assume verified if column doesn't exist
        }
      } else {
        throw error;
      }
    }

    // Always perform password comparison to prevent timing attacks
    // Use a dummy hash if user doesn't exist
    const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks.by.always.comparing';
    const employer = employers.length > 0 ? employers[0] : null;
    const hashToCompare = employer?.password_hash || dummyHash;

    // Verify password (always takes same time regardless of user existence)
    const isPasswordValid = employer && await comparePassword(password, hashToCompare);

    if (!employer || !isPasswordValid) {
      recordFailedAttempt(email, clientIP);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (employer.status !== 'active') {
      return NextResponse.json(
        {
          error: employer.status === 'suspended'
            ? 'Your account has been suspended. Please contact support.'
            : employer.status === 'pending'
            ? 'Your account is pending verification. Please verify your email first.'
            : 'Your account is not active. Please contact support.'
        },
        { status: 403 }
      );
    }

    // Check if email is verified (only if column exists and is false)
    // If email_verified column doesn't exist, we skip this check (for backward compatibility)
    if (employer.email_verified === false) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          emailNotVerified: true
        },
        { status: 403 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(email, clientIP);

    // Update last login timestamp
    try {
      await executeSingleQuery(
        'UPDATE employers SET last_login = NOW() WHERE id = ?',
        [employer.id]
      );
    } catch (error) {
      console.error('Failed to update last_login:', error);
    }

    // Generate JWT token
    const token = generateToken({
      sub: employer.id.toString(),
      email: employer.email,
      type: 'employer',
      companyName: employer.company_name
    });

    // Prepare employer data (without password)
    // Extract first/last name from contact_person if separate columns don't exist
    let firstName = (employer as any).first_name || '';
    let lastName = (employer as any).last_name || '';
    
    if (!firstName && !lastName && employer.contact_person) {
      const nameParts = employer.contact_person.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const employerData = {
      id: employer.id.toString(),
      firstName: firstName,
      lastName: lastName,
      companyName: employer.company_name,
      contactPerson: employer.contact_person,
      email: employer.email,
      emailVerified: employer.email_verified ?? true, // Default to true if column doesn't exist
      lastLogin: employer.last_login ? new Date(employer.last_login).toISOString() : null
    };

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      employer: employerData
    });

    // Set secure HttpOnly cookies
    const cookieOptions = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    };
    res.cookies.set('authToken', token, cookieOptions);
    res.cookies.set('employerAuthToken', token, cookieOptions);

    return res;

  } catch (error: any) {
    console.error('Employer login error:', error);
    
    // Handle database connection errors specifically
    if (error?.code === 'DB_CONNECTION_ERROR' || error?.message?.includes('Database service')) {
      return handleDatabaseError(error);
    }
    
    return NextResponse.json(
      {
        error: 'Login failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { details: error?.message })
      },
      { status: 500 }
    );
  }
}

