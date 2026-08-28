import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET - Fetch a single resource by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resourceId = id;

    const resources = await executeQuery(
      `SELECT 
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
      WHERE rh.id = ?`,
      [resourceId]
    );

    if (resources.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resources[0]
    });
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}

// PUT - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const resourceId = id;
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
      content_type,
      display_order,
      is_active,
      target_audience,
      link_url,
      link_text
    } = body;

    // Check if resource exists
    const existing = await executeQuery(
      'SELECT id FROM resources_hub WHERE id = ?',
      [resourceId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url);
    }
    if (image_file_path !== undefined) {
      updates.push('image_file_path = ?');
      values.push(image_file_path);
    }
    if (featured_image_url !== undefined) {
      updates.push('featured_image_url = ?');
      values.push(featured_image_url);
    }
    if (featured_image_file_path !== undefined) {
      updates.push('featured_image_file_path = ?');
      values.push(featured_image_file_path);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(category_id);
    }
    if (content_type !== undefined) {
      updates.push('content_type = ?');
      values.push(content_type);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (target_audience !== undefined) {
      updates.push('target_audience = ?');
      values.push(target_audience);
    }
    if (link_url !== undefined) {
      updates.push('link_url = ?');
      values.push(link_url);
    }
    if (link_text !== undefined) {
      updates.push('link_text = ?');
      values.push(link_text);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(resourceId);

    await executeSingleQuery(
      `UPDATE resources_hub SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated resource
    const updated = await executeQuery(
      `SELECT 
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
      WHERE rh.id = ?`,
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      message: 'Resource updated successfully',
      data: updated[0]
    });
  } catch (error: any) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update resource', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const resourceId = id;

    // Check if resource exists
    const existing = await executeQuery(
      'SELECT id FROM resources_hub WHERE id = ?',
      [resourceId]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Delete resource
    await executeSingleQuery(
      'DELETE FROM resources_hub WHERE id = ?',
      [resourceId]
    );

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete resource', details: error.message },
      { status: 500 }
    );
  }
}

