import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/payments/stripe/create-checkout-session - Create Stripe Checkout Session (Payment Link)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get token for authentication
    const token = request.cookies.get('authToken')?.value ||
                  request.cookies.get('employerAuthToken')?.value ||
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
      SELECT 
        i.*,
        i.offer_letter_id,
        e.company_name,
        e.email as employer_email,
        e.first_name as employer_first_name,
        e.last_name as employer_last_name,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        j.title as job_title,
        ol.position_title
      FROM invoices i
      JOIN employers e ON i.employer_id = e.id
      JOIN candidates c ON i.candidate_id = c.id
      JOIN jobs j ON i.job_id = j.id
      LEFT JOIN offer_letters ol ON i.offer_letter_id = ol.id
      WHERE i.id = ?
    `, [invoiceId]);

    if (invoiceDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceDetails[0];

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Check if payment link already exists
    if (invoice.payment_link) {
      return NextResponse.json({
        success: true,
        paymentLink: invoice.payment_link,
        message: 'Payment link already exists'
      });
    }

    // Convert TZS to USD for Stripe (Stripe doesn't support TZS)
    // Exchange rate: 1 USD = 2500 TZS (configurable via TZS_TO_USD_RATE env var)
    // Calculate USD amount that converts back closest to original TZS
    const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2500');
    const totalAmountTZS = parseFloat(invoice.total_amount);
    
    let finalAmountInUSD = totalAmountTZS;
    let amountInCents = 0;
    
    if (invoice.currency.toLowerCase() === 'tzs') {
      const amountInUSD = totalAmountTZS / TZS_TO_USD_RATE;
      const amountInUSDRounded = Math.round(amountInUSD * 100) / 100;
      const convertedBackTZS = amountInUSDRounded * TZS_TO_USD_RATE;
      const difference = Math.abs(convertedBackTZS - totalAmountTZS);
      
      // If difference is significant, try rounding up/down to minimize it
      if (difference > 0.5) {
        const amountUp = Math.ceil(amountInUSD * 100) / 100;
        const amountDown = Math.floor(amountInUSD * 100) / 100;
        const diffUp = Math.abs(amountUp * TZS_TO_USD_RATE - totalAmountTZS);
        const diffDown = Math.abs(amountDown * TZS_TO_USD_RATE - totalAmountTZS);
        finalAmountInUSD = diffUp < diffDown ? amountUp : amountDown;
      } else {
        finalAmountInUSD = amountInUSDRounded;
      }
      
      amountInCents = Math.round(finalAmountInUSD * 100);
      
      // Verify conversion accuracy
      const finalConvertedBackTZS = finalAmountInUSD * TZS_TO_USD_RATE;
      const finalDifference = Math.abs(finalConvertedBackTZS - totalAmountTZS);
      if (finalDifference > 1) {
        console.warn(`⚠️ Currency conversion for invoice ${invoice.invoice_number}: TZS ${totalAmountTZS} → USD $${finalAmountInUSD} → TZS ${finalConvertedBackTZS} (diff: ${finalDifference.toFixed(2)})`);
      }
    } else {
      finalAmountInUSD = totalAmountTZS;
      amountInCents = Math.round(finalAmountInUSD * 100);
    }

    // Format TZS amount for display (if original currency is TZS)
    let productDescription = `Placement Fee - ${invoice.position_title || invoice.job_title} - ${invoice.candidate_first_name} ${invoice.candidate_last_name}`;
    if (invoice.currency.toLowerCase() === 'tzs') {
      const formattedTZSAmount = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(totalAmountTZS);
      productDescription += `\n\nOriginal Amount: TZS ${formattedTZSAmount}`;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd', // Stripe doesn't support TZS, using USD
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: productDescription,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=cancelled`,
      customer_email: invoice.employer_email,
      metadata: {
        invoice_id: invoice.id.toString(),
        invoice_number: invoice.invoice_number,
        employer_id: invoice.employer_id.toString(),
        employer_email: invoice.employer_email,
        original_amount_tzs: invoice.currency.toLowerCase() === 'tzs' ? totalAmountTZS.toString() : '',
        original_currency: invoice.currency,
        exchange_rate: invoice.currency.toLowerCase() === 'tzs' ? TZS_TO_USD_RATE.toString() : '1',
      },
      invoice_creation: {
        enabled: true,
      },
    });

    // Save payment link to database
    await executeSingleQuery(`
      UPDATE invoices 
      SET payment_link = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [session.url, invoiceId]);

    // Create or update payment record
    // Check for existing payment using offer_letter_id
    const offerLetterId = invoice.offer_letter_id;
    const existingPayment = offerLetterId ? await executeQuery(`
      SELECT id FROM payments 
      WHERE offer_letter_id = ?
    `, [offerLetterId]) : [];

    if (existingPayment.length > 0) {
      await executeSingleQuery(`
        UPDATE payments 
        SET amount = ?, currency = ?, payment_method = 'stripe',
            payment_status = 'pending', 
            stripe_payment_intent_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [invoice.total_amount, invoice.currency, session.id, existingPayment[0].id]);
    } else {
      // Use offer_letter_id as the payments table structure requires it
      const offerLetterId = invoice.offer_letter_id;
      if (!offerLetterId) {
        console.error('⚠️ No offer_letter_id found for invoice, cannot create payment record');
      } else {
        await executeSingleQuery(`
          INSERT INTO payments (
            offer_letter_id, employer_id, amount, currency, 
            payment_method, payment_status, stripe_payment_intent_id
          ) VALUES (?, ?, ?, ?, 'stripe', 'pending', ?)
        `, [offerLetterId, invoice.employer_id, invoice.total_amount, invoice.currency, session.id]);
      }
    }

    return NextResponse.json({
      success: true,
      paymentLink: session.url,
      sessionId: session.id,
      message: 'Payment link created successfully'
    });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment link' },
      { status: 500 }
    );
  }
}

