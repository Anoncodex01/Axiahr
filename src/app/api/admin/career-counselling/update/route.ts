import { NextRequest, NextResponse } from 'next/server';
import { executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// PUT /api/admin/career-counselling/update - Update career counselling order status
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    const adminAuthTokenCookie = request.cookies.get('adminAuthToken')?.value;
    const axiaAdminTokenCookie = request.cookies.get('axia_admin_token')?.value;
    const authTokenCookie = request.cookies.get('authToken')?.value;

    const token = authHeader || adminAuthTokenCookie || axiaAdminTokenCookie || authTokenCookie;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userRole = decoded.role || decoded.type;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status, counsellorNotes } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      // If marking as completed, also set session_completed_at
      if (status === 'completed') {
        updates.push('session_completed_at = NOW()');
      }
    }

    if (counsellorNotes !== undefined) {
      updates.push('counsellor_notes = ?');
      params.push(counsellorNotes || null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = NOW()');
    params.push(orderId);

    const query = `UPDATE career_counselling_orders SET ${updates.join(', ')} WHERE id = ?`;

    await executeSingleQuery(query, params);

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating career counselling order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update order' 
      },
      { status: 500 }
    );
  }
}

