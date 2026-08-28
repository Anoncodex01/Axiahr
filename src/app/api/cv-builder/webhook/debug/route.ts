import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/cv-builder/webhook/debug - Debug webhook and order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const candidateId = searchParams.get('candidate_id');

    let orders = [];

    if (sessionId) {
      orders = await executeQuery(
        'SELECT * FROM cv_orders WHERE stripe_session_id = ? ORDER BY created_at DESC',
        [sessionId]
      );
    } else if (candidateId) {
      orders = await executeQuery(
        'SELECT * FROM cv_orders WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 5',
        [candidateId]
      );
    } else {
      orders = await executeQuery(
        'SELECT * FROM cv_orders ORDER BY created_at DESC LIMIT 10',
        []
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        candidateId: order.candidate_id,
        amountTZS: order.amount_tzs,
        amountUSD: order.amount_usd,
        paymentStatus: order.payment_status,
        stripeSessionId: order.stripe_session_id,
        paymentReference: order.payment_reference,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        updatedAt: order.updated_at
      })),
      environment: {
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET 
          ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 15) + '...' 
          : 'NOT SET',
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('❌ Error in webhook debug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch debug info' 
      },
      { status: 500 }
    );
  }
}

