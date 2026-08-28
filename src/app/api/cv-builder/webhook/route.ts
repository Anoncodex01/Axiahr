import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/cv-builder/webhook - Handle Stripe webhook events for CV Builder
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log('📥 CV Builder webhook received:', {
      hasSignature: !!signature,
      hasWebhookSecret: !!webhookSecret,
      bodyLength: body.length,
      headers: Object.fromEntries(request.headers.entries())
    });

    let event: Stripe.Event;

    // Verify webhook signature
    if (signature && webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
        console.log('✅ Webhook signature verified successfully');
      } catch (error: any) {
        console.error('❌ Webhook signature verification failed:', {
          error: error.message,
          signature: signature.substring(0, 20) + '...',
          webhookSecret: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT SET'
        });
        
        // In development/test mode, allow parsing without verification for testing
        if (process.env.NODE_ENV !== 'production') {
          console.warn('⚠️ Development mode: Parsing event without verification');
          try {
            event = JSON.parse(body) as Stripe.Event;
          } catch (parseError: any) {
            console.error('❌ Failed to parse webhook body:', parseError.message);
            return NextResponse.json(
              { error: 'Invalid webhook body', details: parseError.message },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'Webhook signature verification failed', details: error.message },
            { status: 400 }
          );
        }
      }
    } else {
      // No signature or webhook secret - only allow in development
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Production mode requires webhook signature');
        return NextResponse.json(
          { error: 'Webhook signature required' },
          { status: 400 }
        );
      }
      
      console.warn('⚠️ No signature or webhook secret - parsing directly (development mode)');
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch (parseError: any) {
        console.error('❌ Failed to parse webhook body:', parseError.message);
        return NextResponse.json(
          { error: 'Invalid webhook body', details: parseError.message },
          { status: 400 }
        );
      }
    }

    console.log('📥 CV Builder webhook event processed:', {
      type: event.type,
      id: event.id,
      created: event.created,
      livemode: event.livemode
    });

    // Handle different event types
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('🔄 Handling checkout.session.completed event...');
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          console.log('✅ checkout.session.completed handler completed');
          break;
        case 'payment_intent.succeeded':
          console.log('🔄 Handling payment_intent.succeeded event...');
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          console.log('✅ payment_intent.succeeded handler completed');
          break;
        case 'payment_intent.payment_failed':
          console.log('🔄 Handling payment_intent.payment_failed event...');
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          console.log('✅ payment_intent.payment_failed handler completed');
          break;
        default:
          console.log(`ℹ️ Unhandled CV Builder event type: ${event.type}`);
      }
    } catch (handlerError: any) {
      console.error(`❌ Error in webhook handler for ${event.type}:`, {
        error: handlerError.message,
        stack: handlerError.stack,
        eventId: event.id,
        eventType: event.type
      });
      // Don't throw - we still want to return 200 to Stripe
      // But log the error for debugging
    }

    return NextResponse.json({ 
      received: true,
      eventType: event.type,
      eventId: event.id
    });

  } catch (error: any) {
    console.error('❌ Error processing CV Builder webhook:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: error.message || 'Webhook processing failed',
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const candidateId = session.metadata?.candidate_id;
  const serviceType = session.metadata?.service_type;
  const paymentStatus = session.payment_status;
  const paymentIntentId = typeof session.payment_intent === 'string' 
    ? session.payment_intent 
    : session.payment_intent?.id;

  console.log('🔔 Processing CV Builder checkout.session.completed:', {
    sessionId,
    candidateId,
    serviceType,
    paymentStatus,
    paymentIntentId,
    metadata: session.metadata,
    fullSession: JSON.stringify(session, null, 2)
  });

  // Check if this is a CV Builder payment
  if (serviceType !== 'cv_builder') {
    console.log('ℹ️ Not a CV Builder payment, skipping...', { serviceType, metadata: session.metadata });
    return;
  }

  if (!candidateId) {
    console.warn('⚠️ No candidate_id in session metadata', { metadata: session.metadata });
    return;
  }

  // Find CV order by session ID (more reliable than candidate_id)
  console.log(`🔍 Searching for order with session_id: ${sessionId}`);
  let orders = await executeQuery(
    'SELECT id, candidate_id, payment_status, stripe_session_id FROM cv_orders WHERE stripe_session_id = ?',
    [sessionId]
  );

  console.log(`🔍 Found ${orders.length} order(s) by session_id`);

  // If not found by session_id, try by candidate_id
  if (orders.length === 0 && candidateId) {
    console.log(`🔍 Order not found by session_id, trying candidate_id ${candidateId}...`);
    orders = await executeQuery(
      'SELECT id, candidate_id, payment_status, stripe_session_id FROM cv_orders WHERE candidate_id = ? AND payment_status = "pending" ORDER BY created_at DESC LIMIT 1',
      [candidateId]
    );
    console.log(`🔍 Found ${orders.length} order(s) by candidate_id`);
  }

  if (orders.length === 0) {
    // List all recent orders for debugging
    const allOrders = await executeQuery(
      'SELECT id, candidate_id, payment_status, stripe_session_id, created_at FROM cv_orders ORDER BY created_at DESC LIMIT 5'
    );
    console.error(`⚠️ CV order not found for session ${sessionId} or candidate ${candidateId}`, {
      searchedSessionId: sessionId,
      searchedCandidateId: candidateId,
      recentOrders: allOrders
    });
    return;
  }

  const order = orders[0];
  const orderId = order.id;

  console.log(`📋 Found order ${orderId} with current status: ${order.payment_status}`);

  // Check payment status - Stripe returns 'paid' for successful payments
  // Also check the session mode and payment status
  const isPaid = paymentStatus === 'paid' || 
                 session.payment_status === 'paid' ||
                 (session as any).status === 'complete';

  console.log(`💰 Payment status check:`, {
    paymentStatus,
    sessionPaymentStatus: session.payment_status,
    isPaid,
    sessionMode: session.mode,
    sessionStatus: (session as any).status
  });

  // Always update if we found the order and session exists
  // The webhook is only called when payment is successful
  try {
    const updateResult = await executeSingleQuery(
      `UPDATE cv_orders 
       SET payment_status = 'completed',
           payment_reference = ?,
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [paymentIntentId || sessionId, orderId]
    );

    console.log(`✅ CV order ${orderId} updated to completed status`, {
      orderId,
      sessionId,
      paymentIntentId,
      paymentStatus,
      isPaid,
      affectedRows: updateResult.affectedRows || 'unknown'
    });
  } catch (updateError: any) {
    console.error(`❌ Failed to update order ${orderId}:`, {
      error: updateError.message,
      stack: updateError.stack
    });
    throw updateError; // Re-throw to be caught by outer try-catch
  }

  // TODO: Send email notification to candidate
  // TODO: Notify admin/HR team to process CV
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const sessionId = paymentIntent.metadata?.session_id;

  console.log('🔔 Processing CV Builder payment_intent.succeeded:', {
    paymentIntentId,
    sessionId,
    metadata: paymentIntent.metadata
  });

  // Try to find order by payment intent ID or session ID
  let orders = await executeQuery(
    'SELECT id, candidate_id, payment_status FROM cv_orders WHERE payment_reference = ? OR stripe_session_id = ?',
    [paymentIntentId, sessionId || '']
  );

  if (orders.length === 0 && sessionId) {
    // Try to find by session ID from metadata
    orders = await executeQuery(
      'SELECT id, candidate_id, payment_status FROM cv_orders WHERE stripe_session_id = ?',
      [sessionId]
    );
  }

  if (orders.length === 0) {
    console.warn(`⚠️ CV order not found for payment intent ${paymentIntentId}`);
    return;
  }

  const order = orders[0];
  const orderId = order.id;

  // Update order status if still pending
  if (order.payment_status === 'pending' || order.payment_status === 'processing') {
    await executeSingleQuery(
      `UPDATE cv_orders 
       SET payment_status = 'completed',
           payment_reference = ?,
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [paymentIntentId, orderId]
    );

    console.log(`✅ CV order ${orderId} updated to completed status via payment_intent.succeeded`);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const sessionId = paymentIntent.metadata?.session_id;

  console.log('❌ Processing CV Builder payment_intent.payment_failed:', {
    paymentIntentId,
    sessionId
  });

  // Find and update order status to failed
  let orders = await executeQuery(
    'SELECT id FROM cv_orders WHERE payment_reference = ? OR stripe_session_id = ?',
    [paymentIntentId, sessionId || '']
  );

  if (orders.length > 0) {
    await executeSingleQuery(
      `UPDATE cv_orders 
       SET payment_status = 'failed',
           updated_at = NOW()
       WHERE id = ?`,
      [orders[0].id]
    );

    console.log(`❌ CV order ${orders[0].id} marked as failed`);
  }
}

