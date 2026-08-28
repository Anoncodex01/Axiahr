import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

/**
 * Update admin user password
 * SECURITY: In production, this should be protected with proper authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is allowed (only in development or with special key)
    const authKey = request.headers.get('x-setup-key');
    if (process.env.NODE_ENV === 'production' && authKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password
    await executeSingleQuery(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?',
      [passwordHash, email.toLowerCase().trim()]
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}

