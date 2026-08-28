import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// GET /api/cv-builder/order-status - Get CV order status for candidate
export async function GET(request: NextRequest) {
  try {
    // Get token for authentication
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

    // Verify token
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract candidate ID from token
    const candidateId = decoded.candidateId || decoded.id || decoded.sub;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    // Get all CV orders for this candidate with candidate name
    const orders = await executeQuery(
      `SELECT 
        co.id,
        co.candidate_id,
        co.amount_tzs,
        co.amount_usd,
        co.currency,
        co.payment_status,
        co.payment_method,
        co.payment_reference,
        co.stripe_session_id,
        co.cv_file_path,
        co.processed_cv_path,
        co.status,
        co.created_at,
        co.paid_at,
        co.completed_at,
        c.first_name,
        c.surname,
        c.email
       FROM cv_orders co
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
      candidateName: order.first_name && order.surname 
        ? `${order.first_name} ${order.surname}`.trim()
        : order.first_name || order.surname || `Candidate #${order.candidate_id}`,
      candidateEmail: order.email,
      amountTZS: parseFloat(order.amount_tzs),
      amountUSD: parseFloat(order.amount_usd),
      currency: order.currency,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      paymentReference: order.payment_reference,
      stripeSessionId: order.stripe_session_id,
      cvFilePath: order.cv_file_path,
      processedCvPath: order.processed_cv_path,
      status: order.status,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      completedAt: order.completed_at,
      canUpload: order.payment_status === 'completed' && !order.cv_file_path,
      hasProcessedCv: !!order.processed_cv_path
    }));

    return NextResponse.json({
      success: true,
      hasOrder: true,
      orders: formattedOrders,
      latestOrder: formattedOrders[0]
    });

  } catch (error: any) {
    console.error('❌ Error getting CV order status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get order status' 
      },
      { status: 500 }
    );
  }
}

