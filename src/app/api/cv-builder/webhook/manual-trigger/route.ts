import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// POST /api/cv-builder/webhook/manual-trigger - Manually trigger webhook update for testing
// This is useful when webhook fails or for testing without Stripe
export async function POST(request: NextRequest) {
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

    const candidateId = decoded.candidateId || decoded.id || decoded.sub;

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, paymentIntentId } = body;

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'sessionId or paymentIntentId required' },
        { status: 400 }
      );
    }

    // Find order by session ID or payment intent ID
    let orders = await executeQuery(
      `SELECT id, candidate_id, payment_status, stripe_session_id 
       FROM cv_orders 
       WHERE (stripe_session_id = ? OR payment_reference = ?) 
       AND candidate_id = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [sessionId || paymentIntentId, paymentIntentId || sessionId, candidateId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Only update if still pending
    if (order.payment_status === 'pending' || order.payment_status === 'processing') {
      await executeSingleQuery(
        `UPDATE cv_orders 
         SET payment_status = 'completed',
             payment_reference = ?,
             paid_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [paymentIntentId || sessionId || order.stripe_session_id, order.id]
      );

      console.log(`✅ CV order ${order.id} manually updated to completed status`);

      return NextResponse.json({
        success: true,
        message: 'Order status updated successfully',
        orderId: order.id,
        previousStatus: order.payment_status,
        newStatus: 'completed'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Order already processed',
        orderId: order.id,
        currentStatus: order.payment_status
      });
    }

  } catch (error: any) {
    console.error('❌ Error in manual webhook trigger:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update order status' 
      },
      { status: 500 }
    );
  }
}

