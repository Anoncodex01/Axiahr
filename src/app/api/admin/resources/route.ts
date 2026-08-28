import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch all resources (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const targetAudience = searchParams.get('target_audience');
    const contentType = searchParams.get('content_type');

    // Build query with optional filters
    let query = `
      SELECT 
        rh.id,
        rh.title,
        rh.description,
        rh.content,
        rh.image_url,
        rh.image_file_path,
        rh.featured_image_url,
        rh.featured_image_file_path,
        rh.category_id,
        rh.content_type,
        rh.display_order,
        rh.is_active,
        rh.target_audience,
        rh.link_url,
        rh.link_text,
        rh.created_by,
        rh.created_at,
        rh.updated_at,
        u.first_name as created_by_name,
        u.last_name as created_by_surname,
        rc.name as category_name
      FROM resources_hub rh
      LEFT JOIN users u ON rh.created_by = u.id
      LEFT JOIN resource_categories rc ON rh.category_id = rc.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isActive !== null) {
      query += ` AND rh.is_active = ?`;
      params.push(isActive === 'true');
    }

    if (targetAudience) {
      query += ` AND rh.target_audience IN (?, 'all')`;
      params.push(targetAudience);
    }

    if (contentType) {
      query += ` AND rh.content_type = ?`;
      params.push(contentType);
    }

    query += ` ORDER BY rh.display_order ASC, rh.created_at DESC`;

    const resources = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: resources,
      count: resources.length
    });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST - Create a new resource
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
    const {
      title,
      description,
      content,
      image_url,
      image_file_path,
      featured_image_url,
      featured_image_file_path,
      category_id,
      content_type = 'general',
      display_order = 0,
      is_active = true,
      target_audience = 'candidates',
      link_url,
      link_text
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Insert new resource
    const result = await executeSingleQuery(
      `INSERT INTO resources_hub 
       (title, description, content, image_url, image_file_path, featured_image_url, featured_image_file_path, category_id, content_type, display_order, is_active, target_audience, link_url, link_text, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        content || null,
        image_url || null,
        image_file_path || null,
        featured_image_url || null,
        featured_image_file_path || null,
        category_id || null,
        content_type,
        display_order,
        is_active,
        target_audience,
        link_url || null,
        link_text || null,
        decoded.sub || decoded.id
      ]
    );

    // Fetch the created resource
    const newResource = await executeQuery(
      `SELECT 
        rh.id,
        rh.title,
        rh.description,
        rh.image_url,
        rh.content_type,
        rh.display_order,
        rh.is_active,
        rh.target_audience,
        rh.link_url,
        rh.link_text,
        rh.created_by,
        rh.created_at,
        rh.updated_at,
        u.first_name as created_by_name,
        u.last_name as created_by_surname
      FROM resources_hub rh
      LEFT JOIN users u ON rh.created_by = u.id
      WHERE rh.id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Resource created successfully',
      data: newResource[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create resource', details: error.message },
      { status: 500 }
    );
  }
}

