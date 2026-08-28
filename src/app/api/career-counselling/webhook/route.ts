import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/career-counselling/webhook - Handle Stripe webhook events for Career Counselling
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    // Verify webhook signature
    if (signature && webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
          event = JSON.parse(body) as Stripe.Event;
        } else {
          return NextResponse.json(
            { error: 'Webhook signature verification failed' },
            { status: 400 }
          );
        }
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Webhook signature required' },
          { status: 400 }
        );
      }
      event = JSON.parse(body) as Stripe.Event;
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
      }
    } catch (handlerError: any) {
      console.error(`❌ Error in webhook handler for ${event.type}:`, handlerError);
    }

    return NextResponse.json({ 
      received: true,
      eventType: event.type,
      eventId: event.id
    });

  } catch (error: any) {
    console.error('❌ Error processing Career Counselling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const serviceType = session.metadata?.service_type;

  if (serviceType !== 'career_counselling') {
    return;
  }

  // Retrieve full session details
  const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent']
  });

  const paymentStatus = fullSession.payment_status;
  const status = fullSession.status;

  // Find order by stripe_session_id
  let orders = await executeQuery(
    'SELECT id, candidate_id, payment_status FROM career_counselling_orders WHERE stripe_session_id = ?',
    [sessionId]
  );

  if (orders.length === 0) {
    console.warn(`⚠️ Career counselling order not found for session ${sessionId}`);
    return;
  }

  const order = orders[0];
  const orderId = order.id;

  // Update order if payment is confirmed
  if (paymentStatus === 'paid' || status === 'complete') {
    await executeSingleQuery(
      `UPDATE career_counselling_orders 
       SET payment_status = 'completed',
           paid_at = NOW(),
           status = 'scheduled',
           updated_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    console.log(`✅ Career counselling order ${orderId} updated to completed status`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const sessionId = paymentIntent.metadata?.session_id;

  // Try to find order by payment intent ID or session ID
  let orders = await executeQuery(
    'SELECT id, candidate_id, payment_status FROM career_counselling_orders WHERE payment_reference = ? OR stripe_session_id = ?',
    [paymentIntentId, sessionId || '']
  );

  if (orders.length === 0 && sessionId) {
    orders = await executeQuery(
      'SELECT id, candidate_id, payment_status FROM career_counselling_orders WHERE stripe_session_id = ?',
      [sessionId]
    );
  }

  if (orders.length === 0) {
    console.warn(`⚠️ Career counselling order not found for payment intent ${paymentIntentId}`);
    return;
  }

  const order = orders[0];
  const orderId = order.id;

  // Update order status if still pending
  if (order.payment_status === 'pending' || order.payment_status === 'processing') {
    await executeSingleQuery(
      `UPDATE career_counselling_orders 
       SET payment_status = 'completed',
           payment_reference = ?,
           paid_at = NOW(),
           status = 'scheduled',
           updated_at = NOW()
       WHERE id = ?`,
      [paymentIntentId, orderId]
    );

    console.log(`✅ Career counselling order ${orderId} updated to completed status via payment_intent.succeeded`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const sessionId = paymentIntent.metadata?.session_id;

  // Find order
  let orders = await executeQuery(
    'SELECT id FROM career_counselling_orders WHERE payment_reference = ? OR stripe_session_id = ?',
    [paymentIntentId, sessionId || '']
  );

  if (orders.length === 0 && sessionId) {
    orders = await executeQuery(
      'SELECT id FROM career_counselling_orders WHERE stripe_session_id = ?',
      [sessionId]
    );
  }

  if (orders.length > 0) {
    await executeSingleQuery(
      `UPDATE career_counselling_orders 
       SET payment_status = 'failed',
           updated_at = NOW()
       WHERE id = ?`,
      [orders[0].id]
    );

    console.log(`❌ Career counselling order ${orders[0].id} marked as failed`);
  }
}

