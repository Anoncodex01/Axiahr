import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');

    let query = `
      SELECT 
        id,
        name,
        slug,
        description,
        icon,
        color,
        display_order,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM resource_categories
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isActive !== null) {
      query += ` AND is_active = ?`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY display_order ASC, name ASC`;

    const categories = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = verifyToken(token);
      if (decoded.type !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Admin access required' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, icon, color, display_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await executeQuery(
      'SELECT id FROM resource_categories WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Get max display order
    const maxOrder = await executeQuery(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM resource_categories'
    );
    const nextOrder = display_order !== undefined ? display_order : (maxOrder[0]?.max_order || 0) + 1;

    // Insert new category
    const result = await executeSingleQuery(
      `INSERT INTO resource_categories 
       (name, slug, description, icon, color, display_order, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        name.trim(),
        slug,
        description?.trim() || null,
        icon || null,
        color || null,
        nextOrder,
        decoded.sub || decoded.id
      ]
    );

    // Fetch the created category
    const newCategory = await executeQuery(
      'SELECT * FROM resource_categories WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: newCategory[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category', details: error.message },
      { status: 500 }
    );
  }
}

