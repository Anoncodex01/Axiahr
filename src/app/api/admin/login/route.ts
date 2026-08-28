import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { generateTokenEdge } from '@/lib/auth-edge'; // ✅ FIXED

// Simple rate limiting store
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

function checkRateLimit(identifier: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(identifier, { count: 1, resetTime: now + LOCKOUT_TIME });
    return { allowed: true };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }

  attempt.count++;
  return { allowed: true };
}

function resetRateLimit(identifier: string) {
  loginAttempts.delete(identifier);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check rate limit
    const rate = checkRateLimit(email);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rate.remainingTime} minutes.` },
        { status: 429 }
      );
    }

    // Fetch user
    const users = await executeQuery(
      `SELECT id, first_name, last_name, email, password_hash, role, permissions, department, status, last_login 
       FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Contact support.' },
        { status: 403 }
      );
    }

    resetRateLimit(email);

    // Update last login
    await executeSingleQuery(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

    let permissions: string[] = [];
    try {
      if (user.permissions) {
        permissions = JSON.parse(user.permissions);
      }
    } catch (_) {}

    // ✅ FIX: generate Edge-compatible token
    const token = await generateTokenEdge({
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      type: 'admin',
      permissions
    });

    const userData = {
      id: user.id.toString(),
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      permissions,
      department: user.department || '',
      lastLogin: user.last_login ? new Date(user.last_login).toISOString() : null
    };

    const res = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    };

    // Both cookies for compatibility
    res.cookies.set('adminAuthToken', token, cookieOptions);
    res.cookies.set('axia_admin_token', token, cookieOptions);

    console.log('✅ Login successful:', user.email);

    return res;

  } catch (error: any) {
    console.error('Admin login error:', error);

    return NextResponse.json(
      {
        error: 'Login failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
