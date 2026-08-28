import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

/**
 * This endpoint helps set up a default admin user in the database
 * It should be called once to create the initial admin account
 * SECURITY: In production, this should be disabled or protected
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
    const { email, password, firstName, lastName, role = 'super_admin', department = 'IT' } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await executeSingleQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, permissions, department, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        firstName,
        lastName,
        email.toLowerCase().trim(),
        passwordHash,
        role,
        JSON.stringify(['all']), // Super admin gets all permissions
        department
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}

