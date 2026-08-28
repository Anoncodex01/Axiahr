import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

// GET - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;

    const users = await executeQuery<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      permissions: string | null;
      department: string | null;
      status: string;
      last_login: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, first_name, last_name, email, role, permissions, department, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    let permissions: string[] = [];
    try {
      if (user.permissions) {
        permissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      }
    } catch (error) {
      console.error('Failed to parse permissions:', error);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: permissions,
        department: user.department || '',
        lastLogin: user.last_login ? new Date(user.last_login).toISOString() : null,
        createdAt: new Date(user.created_at).toISOString(),
        updatedAt: new Date(user.updated_at).toISOString(),
        phone: '',
        notes: '',
        createdBy: 'system'
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      department, 
      status,
      permissions
    } = body;

    // Check if user exists
    const existingUsers = await executeQuery(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUsers[0].email) {
      const emailCheck = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email.toLowerCase().trim(), userId]
      );

      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 409 }
        );
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const updateParams: any[] = [];

    // Validate required fields if provided
    if (firstName !== undefined) {
      if (!firstName || firstName.trim() === '') {
        return NextResponse.json(
          { error: 'First name cannot be empty' },
          { status: 400 }
        );
      }
      updates.push('first_name = ?');
      updateParams.push(firstName.trim());
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim() === '') {
        return NextResponse.json(
          { error: 'Last name cannot be empty' },
          { status: 400 }
        );
      }
      updates.push('last_name = ?');
      updateParams.push(lastName.trim());
    }

    if (email !== undefined) {
      if (!email || email.trim() === '') {
        return NextResponse.json(
          { error: 'Email cannot be empty' },
          { status: 400 }
        );
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      updates.push('email = ?');
      updateParams.push(email.toLowerCase().trim());
    }

    if (password !== undefined && password !== null && password !== '') {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      updateParams.push(passwordHash);
    }

    if (role !== undefined && role !== null && role !== '') {
      // Validate role value
      const validRoles = ['super_admin', 'admin', 'hr_manager', 'recruiter', 'candidate_manager', 'employer_manager', 'content_moderator'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push('role = ?');
      updateParams.push(role);
    }

    if (department !== undefined) {
      updates.push('department = ?');
      updateParams.push(department && department.trim() !== '' ? department.trim() : null);
    }

    if (status !== undefined && status !== null && status !== '') {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.push('status = ?');
      updateParams.push(status);
    }

    if (permissions !== undefined) {
      // Validate permissions is an array
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { error: 'Permissions must be an array' },
          { status: 400 }
        );
      }
      updates.push('permissions = ?');
      updateParams.push(JSON.stringify(permissions));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    updateParams.push(userId);

    console.log('Updating user:', userId, 'with fields:', updates);
    console.log('Update params:', updateParams.map((p, i) => i === updateParams.length - 1 ? 'userId' : (typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)));

    await executeSingleQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      updateParams
    );

    console.log('User updated successfully');

    // Fetch updated user
    const updatedUsers = await executeQuery<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      permissions: string | null;
      department: string | null;
      status: string;
      last_login: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, first_name, last_name, email, role, permissions, department, status, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = updatedUsers[0];
    let parsedPermissions: string[] = [];
    try {
      if (user.permissions) {
        parsedPermissions = typeof user.permissions === 'string' 
          ? JSON.parse(user.permissions) 
          : user.permissions;
      }
    } catch (error) {
      console.error('Failed to parse permissions:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: parsedPermissions,
        department: user.department || '',
        lastLogin: user.last_login ? new Date(user.last_login).toISOString() : null,
        createdAt: new Date(user.created_at).toISOString(),
        updatedAt: new Date(user.updated_at).toISOString(),
        phone: '',
        notes: '',
        createdBy: 'system'
      }
    });

  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;

    // Check if user exists
    const existingUsers = await executeQuery(
      'SELECT id, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = existingUsers[0];

    // Prevent deleting super_admin (optional safety check)
    if (user.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin user' },
        { status: 403 }
      );
    }

    // Delete user
    await executeSingleQuery(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    
    // Check for foreign key constraints
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json(
        { error: 'Cannot delete user. User is referenced in other records. Consider deactivating instead.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete user', details: error?.message },
      { status: 500 }
    );
  }
}

