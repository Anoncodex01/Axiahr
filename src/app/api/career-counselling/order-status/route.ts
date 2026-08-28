import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/career-counselling/order-status - Get career counselling order status for candidate
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value ||
                  request.cookies.get('axia_candidate_token')?.value ||
                  request.cookies.get('candidateAuthToken')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

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

    const candidateId = decoded.candidateId || decoded.id || decoded.sub;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    // Get all career counselling orders for this candidate
    const orders = await executeQuery(
      `SELECT 
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
        co.payment_reference,
        co.stripe_session_id,
        co.status,
        co.session_completed_at,
        co.counsellor_notes,
        co.created_at,
        co.paid_at,
        c.first_name,
        c.surname
       FROM career_counselling_orders co
       LEFT JOIN candidates c ON co.candidate_id = c.id
       WHERE co.candidate_id = ? 
       ORDER BY co.created_at DESC`,
      [candidateId]
    );

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        hasOrder: false,
        orders: [],
        latestOrder: null
      });
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
      paymentReference: order.payment_reference,
      stripeSessionId: order.stripe_session_id,
      status: order.status,
      sessionCompletedAt: order.session_completed_at,
      counsellorNotes: order.counsellor_notes,
      createdAt: order.created_at,
      paidAt: order.paid_at
    }));

    return NextResponse.json({
      success: true,
      hasOrder: true,
      orders: formattedOrders,
      latestOrder: formattedOrders[0]
    });

  } catch (error: any) {
    console.error('❌ Error getting career counselling order status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get order status' 
      },
      { status: 500 }
    );
  }
}

