import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// POST /api/payments/stripe/create-intent - Create Stripe payment intent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, amount, currency = 'TZS' } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID and amount are required' },
        { status: 400 }
      );
    }

    // Get token for authentication
    const token = request.cookies.get('authToken')?.value ||
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

    // Get invoice details
    const invoiceDetails = await executeQuery(`
      SELECT i.*, e.company_name, e.email as employer_email
      FROM invoices i
      JOIN employers e ON i.employer_id = e.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (invoiceDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceDetails[0];

    // TODO: Integrate with Stripe API
    // For now, we'll create a mock payment intent
    // In production, use: const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({...});

    const stripePaymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_mock_${stripePaymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    // Create or update payment record
    const existingPayment = await executeQuery(`
      SELECT id FROM payments 
      WHERE offer_letter_id = (SELECT offer_letter_id FROM invoices WHERE id = ?)
    `, [invoiceId]);

    let paymentId;
    if (existingPayment.length > 0) {
      paymentId = existingPayment[0].id;
      await executeSingleQuery(`
        UPDATE payments 
        SET amount = ?, currency = ?, payment_method = 'stripe',
            payment_status = 'processing', payment_reference = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [amount, currency, stripePaymentIntentId, paymentId]);
    } else {
      const result = await executeSingleQuery(`
        INSERT INTO payments (
          offer_letter_id, employer_id, amount, currency, 
          payment_method, payment_status, payment_reference
        )
        SELECT ?, employer_id, ?, ?, 'stripe', 'processing', ?
        FROM invoices WHERE id = ?
      `, [invoice.offer_letter_id, amount, currency, stripePaymentIntentId, invoiceId]);
      paymentId = result.insertId;
    }

    // Update invoice status to sent if it's draft
    if (invoice.status === 'draft') {
      await executeSingleQuery(`
        UPDATE invoices SET status = 'sent' WHERE id = ?
      `, [invoiceId]);
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: stripePaymentIntentId,
      clientSecret: clientSecret,
      paymentId: paymentId,
      message: 'Stripe payment intent created successfully'
    });

  } catch (error: any) {
    console.error('Error creating Stripe payment intent:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

