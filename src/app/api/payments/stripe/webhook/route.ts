import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/payments/stripe/webhook - Handle Stripe webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.warn('⚠️ No Stripe signature found');
      // For development, allow webhooks without signature verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'No signature provided' },
          { status: 400 }
        );
      }
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature - use invoice-specific webhook secret
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_INVOICE || process.env.STRIPE_WEBHOOK_SECRET;
      if (signature && webhookSecret) {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
      } else {
        // For development, parse without verification
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      // In development, continue without verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('📥 Stripe webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const invoiceId = session.metadata?.invoice_id;
  const paymentIntentId = typeof session.payment_intent === 'string' 
    ? session.payment_intent 
    : session.payment_intent?.id;

  console.log('🔔 Processing checkout.session.completed:', {
    sessionId,
    invoiceId,
    paymentIntentId,
    paymentStatus: session.payment_status,
    metadata: session.metadata
  });

  if (!invoiceId) {
    console.warn('⚠️ No invoice_id in session metadata', {
      sessionId,
      metadata: session.metadata
    });
    return;
  }

  // Get invoice details
  const invoices = await executeQuery(`
    SELECT i.*, i.total_amount, i.currency
    FROM invoices i
    WHERE i.id = ?
  `, [invoiceId]);

  if (invoices.length === 0) {
    console.warn(`⚠️ Invoice ${invoiceId} not found`);
    return;
  }

  const invoice = invoices[0];
  const amount = parseFloat(invoice.total_amount);
  const currency = invoice.currency || 'TZS';

  // Update invoice status with payment reference (session ID)
  await executeSingleQuery(`
    UPDATE invoices 
    SET status = 'paid',
        paid_date = CURRENT_TIMESTAMP,
        payment_method = 'stripe',
        payment_reference = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [sessionId, invoiceId]);
  
  console.log(`✅ Invoice ${invoiceId} updated to paid status with reference ${sessionId}`);

  // Get offer_letter_id from invoice
  const invoiceDetails = await executeQuery(`
    SELECT offer_letter_id, employer_id FROM invoices WHERE id = ?
  `, [invoiceId]);

  if (invoiceDetails.length === 0) {
    console.warn(`⚠️ Invoice ${invoiceId} details not found`);
    return;
  }

  const { offer_letter_id, employer_id } = invoiceDetails[0];

  // Update or create payment record using offer_letter_id
  // Check if stripe_payment_intent_id column exists, if not, use payment_reference
  let existingPayments;
  try {
    existingPayments = await executeQuery(`
      SELECT id FROM payments 
      WHERE offer_letter_id = ? OR payment_reference = ?
    `, [offer_letter_id, paymentIntentId || sessionId]);
  } catch (error: any) {
    // Fallback if column doesn't exist
    existingPayments = await executeQuery(`
      SELECT id FROM payments 
      WHERE offer_letter_id = ? OR payment_reference = ?
    `, [offer_letter_id, sessionId]);
  }

  if (existingPayments.length > 0) {
    // Update existing payment record
    const paymentId = existingPayments[0].id;
    try {
      await executeSingleQuery(`
        UPDATE payments 
        SET payment_status = 'completed',
            payment_date = CURRENT_TIMESTAMP,
            stripe_payment_intent_id = ?,
            payment_method = 'stripe',
            payment_reference = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [paymentIntentId || sessionId, sessionId, paymentId]);
      console.log(`✅ Updated existing payment record #${paymentId} with reference ${sessionId}`);
    } catch (error: any) {
      // Fallback if stripe_payment_intent_id column doesn't exist
      await executeSingleQuery(`
        UPDATE payments 
        SET payment_status = 'completed',
            payment_date = CURRENT_TIMESTAMP,
            payment_method = 'stripe',
            payment_reference = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [sessionId, paymentId]);
      console.log(`✅ Updated existing payment record #${paymentId} (fallback) with reference ${sessionId}`);
    }
  } else {
    // Create new payment record
    try {
      const result = await executeSingleQuery(`
        INSERT INTO payments (
          offer_letter_id, employer_id, amount, currency,
          payment_method, payment_status, payment_date,
          stripe_payment_intent_id, payment_reference
        )
        VALUES (?, ?, ?, ?, 'stripe', 'completed', CURRENT_TIMESTAMP, ?, ?)
      `, [offer_letter_id, employer_id, amount, currency, paymentIntentId || sessionId, sessionId]);
      console.log(`✅ Created new payment record #${result.insertId} with reference ${sessionId}`);
    } catch (error: any) {
      // Fallback if stripe_payment_intent_id column doesn't exist
      const result = await executeSingleQuery(`
        INSERT INTO payments (
          offer_letter_id, employer_id, amount, currency,
          payment_method, payment_status, payment_date,
          payment_reference
        )
        VALUES (?, ?, ?, ?, 'stripe', 'completed', CURRENT_TIMESTAMP, ?)
      `, [offer_letter_id, employer_id, amount, currency, sessionId]);
      console.log(`✅ Created new payment record #${result.insertId} (fallback) with reference ${sessionId}`);
    }
  }

  console.log(`✅ Payment completed for invoice ${invoiceId}, session ${sessionId}`, {
    invoiceId,
    sessionId,
    paymentIntentId: paymentIntentId || sessionId,
    amount,
    currency,
    employerId: employer_id,
    offerLetterId: offer_letter_id
  });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;
  const amount = (paymentIntent.amount || 0) / 100; // Stripe amounts are in cents
  const currency = (paymentIntent.currency || 'tzs').toUpperCase();

  // Find payment by Stripe payment intent ID
  const payments = await executeQuery(`
    SELECT p.*, i.id as invoice_id
    FROM payments p
    LEFT JOIN invoices i ON i.offer_letter_id = p.offer_letter_id
    WHERE p.stripe_payment_intent_id = ? OR p.payment_reference = ?
  `, [paymentIntentId, paymentIntentId]);

  if (payments.length > 0) {
    const payment = payments[0];

    // Update payment status
    await executeSingleQuery(`
      UPDATE payments 
      SET payment_status = 'completed',
          payment_date = CURRENT_TIMESTAMP,
          stripe_payment_intent_id = ?,
          payment_method = 'stripe',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [paymentIntentId, payment.id]);

    // Update invoice status if exists
    if (payment.invoice_id) {
      await executeSingleQuery(`
        UPDATE invoices 
        SET status = 'paid',
            paid_date = CURRENT_TIMESTAMP,
            payment_method = 'stripe',
            payment_reference = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [paymentIntentId, payment.invoice_id]);
    }

    console.log(`✅ Payment ${paymentIntentId} marked as completed`);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  const payments = await executeQuery(`
    SELECT id FROM payments 
    WHERE stripe_payment_intent_id = ? OR payment_reference = ?
  `, [paymentIntentId, paymentIntentId]);

  if (payments.length > 0) {
    await executeSingleQuery(`
      UPDATE payments 
      SET payment_status = 'failed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [payments[0].id]);

    console.log(`❌ Payment ${paymentIntentId} marked as failed`);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  const payments = await executeQuery(`
    SELECT id FROM payments 
    WHERE stripe_payment_intent_id = ? OR payment_reference = ?
  `, [paymentIntentId, paymentIntentId]);

  if (payments.length > 0) {
    await executeSingleQuery(`
      UPDATE payments 
      SET payment_status = 'failed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [payments[0].id]);

    console.log(`⚠️ Payment ${paymentIntentId} marked as canceled`);
  }
}

