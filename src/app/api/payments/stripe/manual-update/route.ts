import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/payments/stripe/manual-update - Manually update payment status from Stripe
// This is useful when webhook fails or for testing
export async function POST(request: NextRequest) {
  try {
    // Get token for authentication (admin only)
    const token = request.cookies.get('authToken')?.value ||
                  request.cookies.get('adminAuthToken')?.value ||
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

    // Check if user is admin
    const userRole = decoded.role || decoded.userType || decoded.type;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId, paymentIntentId, invoiceId } = body;

    if (!sessionId && !paymentIntentId && !invoiceId) {
      return NextResponse.json(
        { success: false, error: 'sessionId, paymentIntentId, or invoiceId is required' },
        { status: 400 }
      );
    }

    let session: Stripe.Checkout.Session | null = null;
    let paymentIntent: Stripe.PaymentIntent | null = null;

    // Try to get session or payment intent from Stripe
    if (sessionId) {
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log('📋 Retrieved Stripe session:', {
          id: session.id,
          payment_status: session.payment_status,
          payment_intent: session.payment_intent,
          metadata: session.metadata
        });
      } catch (error: any) {
        console.error('Error retrieving session:', error.message);
      }
    }

    if (paymentIntentId || (session && session.payment_intent)) {
      const intentId = paymentIntentId || (session && session.payment_intent ? (typeof session.payment_intent === 'string' ? session.payment_intent : (typeof session.payment_intent === 'object' && session.payment_intent && 'id' in session.payment_intent ? session.payment_intent.id : null)) : null);
      if (intentId) {
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(intentId);
          console.log('💳 Retrieved Stripe payment intent:', {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          });
        } catch (error: any) {
          console.error('Error retrieving payment intent:', error.message);
        }
      }
    }

    // Determine invoice ID
    let finalInvoiceId = invoiceId;
    if (!finalInvoiceId && session?.metadata?.invoice_id) {
      finalInvoiceId = session.metadata.invoice_id;
    }

    if (!finalInvoiceId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine invoice ID' },
        { status: 400 }
      );
    }

    // Check payment status
    const isPaid = session?.payment_status === 'paid' || 
                   paymentIntent?.status === 'succeeded';

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        error: 'Payment not completed in Stripe',
        paymentStatus: session?.payment_status || paymentIntent?.status
      }, { status: 400 });
    }

    // Get invoice details
    const invoices = await executeQuery(`
      SELECT i.*, i.total_amount, i.currency, i.offer_letter_id, i.employer_id
      FROM invoices i
      WHERE i.id = ?
    `, [finalInvoiceId]);

    if (invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoices[0];
    const amount = parseFloat(invoice.total_amount);
    const currency = invoice.currency || 'TZS';
    const paymentIntentIdFinal = paymentIntent?.id || 
                                 (session && session.payment_intent ? (typeof session.payment_intent === 'string' ? session.payment_intent : (typeof session.payment_intent === 'object' && session.payment_intent && 'id' in session.payment_intent ? session.payment_intent.id : null)) : null) || 
                                 session?.id;

    // Update invoice status
    await executeSingleQuery(`
      UPDATE invoices 
      SET status = 'paid',
          paid_date = CURRENT_TIMESTAMP,
          payment_method = 'stripe',
          payment_reference = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [paymentIntentIdFinal || session?.id, finalInvoiceId]);

    // Update or create payment record
    const { offer_letter_id, employer_id } = invoice;
    const existingPayments = await executeQuery(`
      SELECT id FROM payments 
      WHERE offer_letter_id = ? OR stripe_payment_intent_id = ?
    `, [offer_letter_id, paymentIntentIdFinal || session?.id]);

    if (existingPayments.length > 0) {
      await executeSingleQuery(`
        UPDATE payments 
        SET payment_status = 'completed',
            payment_date = CURRENT_TIMESTAMP,
            stripe_payment_intent_id = ?,
            payment_method = 'stripe',
            payment_reference = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [paymentIntentIdFinal || session?.id, session?.id, existingPayments[0].id]);
    } else {
      await executeSingleQuery(`
        INSERT INTO payments (
          offer_letter_id, employer_id, amount, currency,
          payment_method, payment_status, payment_date,
          stripe_payment_intent_id, payment_reference
        )
        VALUES (?, ?, ?, ?, 'stripe', 'completed', CURRENT_TIMESTAMP, ?, ?)
      `, [offer_letter_id, employer_id, amount, currency, paymentIntentIdFinal || session?.id, session?.id]);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      invoiceId: finalInvoiceId,
      paymentStatus: 'completed'
    });

  } catch (error: any) {
    console.error('Error manually updating payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

