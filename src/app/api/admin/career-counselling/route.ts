import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/career-counselling - Get all career counselling orders for admin panel
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        co.id,
        co.candidate_id,
        co.full_name,
        co.email,
        co.phone,
        co.preferred_datetime,
        co.session_mode,
        co.city,
        co.notes,
        co.amount_tzs,
        co.amount_usd,
        co.currency,
        co.payment_status,
        co.payment_method,
        co.stripe_session_id,
        co.status,
        co.session_completed_at,
        co.counsellor_notes,
        co.created_at,
        co.paid_at,
        co.updated_at,
        c.first_name,
        c.surname
      FROM career_counselling_orders co
      LEFT JOIN candidates c ON co.candidate_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND co.status = ?`;
      params.push(status);
    }

    if (paymentStatus) {
      query += ` AND co.payment_status = ?`;
      params.push(paymentStatus);
    }

    query += ` ORDER BY co.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const orders = await executeQuery(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM career_counselling_orders co
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (status) {
      countQuery += ` AND co.status = ?`;
      countParams.push(status);
    }

    if (paymentStatus) {
      countQuery += ` AND co.payment_status = ?`;
      countParams.push(paymentStatus);
    }

    const countResult = await executeQuery(countQuery, countParams);
    let total = 0;
    if (countResult && countResult.length > 0) {
      total = typeof countResult[0].total === 'number' 
        ? countResult[0].total 
        : parseInt(String(countResult[0].total || '0'));
    }

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      candidateId: order.candidate_id,
      candidateName: order.full_name || (order.first_name && order.surname 
        ? `${order.first_name} ${order.surname}`.trim()
        : order.first_name || order.surname || `Candidate #${order.candidate_id}`),
      email: order.email,
      phone: order.phone,
      preferredDatetime: order.preferred_datetime,
      sessionMode: order.session_mode,
      city: order.city,
      notes: order.notes,
      amountTZS: parseFloat(order.amount_tzs),
      amountUSD: parseFloat(order.amount_usd),
      currency: order.currency,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      stripeSessionId: order.stripe_session_id,
      status: order.status,
      sessionCompletedAt: order.session_completed_at,
      counsellorNotes: order.counsellor_notes,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      updatedAt: order.updated_at
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      total,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('❌ Error getting career counselling orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get orders' 
      },
      { status: 500 }
    );
  }
}

