import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// Update or delete IP whitelist entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // Await params (Next.js 15+)
    const { id } = await params;

    const body = await request.json();
    const { active } = body;

    // Check if entry exists
    const existing = await executeQuery<any>(
      'SELECT id, active FROM ip_whitelist WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'IP entry not found' }, { status: 404 });
    }

    // Update active status
    const newActiveStatus = active !== undefined ? active : !existing[0].active;
    await executeSingleQuery(
      'UPDATE ip_whitelist SET active = ? WHERE id = ?',
      [newActiveStatus, id]
    );

    // Fetch updated entry
    const updated = await executeQuery<any>(
      `SELECT id, ip, description, created_at as createdAt, created_by as createdBy, active
       FROM ip_whitelist WHERE id = ?`,
      [id]
    );

    const entry = {
      ...updated[0],
      createdAt: updated[0].createdAt ? new Date(updated[0].createdAt).toISOString() : new Date().toISOString(),
      active: Boolean(updated[0].active)
    };

    return NextResponse.json({
      success: true,
      entry
    });
  } catch (error: any) {
    console.error('Error updating IP whitelist:', error);
    return NextResponse.json(
      { error: 'Failed to update IP whitelist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('adminAuthToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin' || decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
    }

    // Await params (Next.js 15+)
    const { id } = await params;

    // Check if entry exists
    const existing = await executeQuery<any>(
      'SELECT id FROM ip_whitelist WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'IP entry not found' }, { status: 404 });
    }

    // Delete from database
    await executeSingleQuery(
      'DELETE FROM ip_whitelist WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'IP removed from whitelist'
    });
  } catch (error: any) {
    console.error('Error deleting IP from whitelist:', error);
    return NextResponse.json(
      { error: 'Failed to delete IP from whitelist' },
      { status: 500 }
    );
  }
}

