import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if token is for admin
    if (decoded.type !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      );
    }

    // Get user from database to ensure they still exist and are active
    const users = await executeQuery<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      permissions: string | null;
      department: string | null;
      status: string;
    }>(
      `SELECT id, first_name, last_name, email, role, permissions, department, status 
       FROM users 
       WHERE id = ? AND email = ?`,
      [decoded.sub, decoded.email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Check if account is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Parse permissions
    let permissions: string[] = [];
    try {
      if (user.permissions) {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      }
    } catch (error) {
      console.error('Failed to parse permissions:', error);
      permissions = [];
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        permissions: permissions,
        department: user.department || '',
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 500 }
    );
  }
}

