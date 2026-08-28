import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { hashPassword } from '@/lib/auth';

// GET - Fetch all users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query with filters
    let query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        role,
        permissions,
        department,
        status,
        last_login,
        created_at,
        updated_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (department && department !== 'all') {
      query += ' AND department = ?';
      params.push(department);
    }

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get total count for pagination
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Add pagination and ordering
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

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
    }>(query, params);

    // Parse permissions JSON
    const formattedUsers = users.map(user => {
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

      return {
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
        phone: '', // Not in current schema, can be added later
        notes: '', // Not in current schema, can be added later
        createdBy: 'system' // Can be tracked if needed
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      department, 
      status = 'active',
      permissions = []
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      console.error('Create user validation failed:', { firstName, lastName, email, password: password ? '***' : null, role });
      return NextResponse.json(
        { error: 'First name, last name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ['super_admin', 'admin', 'hr_manager', 'recruiter', 'candidate_manager', 'employer_manager', 'content_moderator'];
    if (!validRoles.includes(role)) {
      console.error('Invalid role provided:', role, 'Valid roles:', validRoles);
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('Creating user with role:', role);

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

    // Determine permissions based on role if not provided
    let userPermissions = permissions;
    if (userPermissions.length === 0) {
      // Default permissions based on role
      const rolePermissions: { [key: string]: string[] } = {
        super_admin: ['all'],
        admin: ['candidates', 'jobs', 'applications', 'employers'],
        hr_manager: ['candidates', 'jobs', 'applications'],
        recruiter: ['candidates', 'applications'],
        candidate_manager: ['candidates'],
        employer_manager: ['employers', 'jobs'],
        content_moderator: ['content', 'moderation']
      };
      userPermissions = rolePermissions[role] || [];
    }

    // Create user
    console.log('Inserting user with role:', role);
    const result = await executeSingleQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, permissions, department, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        email.toLowerCase().trim(),
        passwordHash,
        role,
        JSON.stringify(userPermissions),
        department || null,
        status
      ]
    );
    console.log('User created with ID:', result.insertId, 'and role:', role);

    // Fetch the created user
    const newUsers = await executeQuery<{
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
      [result.insertId]
    );

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve created user' },
        { status: 500 }
      );
    }

    const user = newUsers[0];
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
      message: 'User created successfully',
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
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error?.message },
      { status: 500 }
    );
  }
}

