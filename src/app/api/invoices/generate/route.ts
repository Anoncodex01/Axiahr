import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingleQuery } from '@/lib/database';

// Helper function to format currency
function formatCurrency(amount: number, currency: string = 'TZS'): string {
  if (currency === 'TZS') {
    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `TZS ${formatted}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// POST /api/invoices/generate - Generate invoice when offer is accepted
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { offerLetterId, applicationId } = body;

    if (!offerLetterId || !applicationId) {
      return NextResponse.json(
        { error: 'Offer letter ID and application ID are required' },
        { status: 400 }
      );
    }

    // Get offer letter and related details
    const offerDetails = await executeQuery(`
      SELECT 
        ol.id as offer_letter_id,
        ol.offer_amount,
        ol.position_title,
        ol.application_id,
        ol.employer_id,
        a.candidate_id,
        a.job_id,
        a.status as application_status,
        c.first_name as candidate_first_name,
        c.surname as candidate_last_name,
        c.email as candidate_email,
        j.title as job_title,
        e.company_name,
        e.email as employer_email,
        e.first_name as employer_first_name,
        e.surname as employer_last_name,
        e.address as employer_address,
        e.city as employer_city,
        e.country as employer_country
      FROM offer_letters ol
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON ol.employer_id = e.id
      WHERE ol.id = ? AND a.id = ?
    `, [offerLetterId, applicationId]);

    if (offerDetails.length === 0) {
      return NextResponse.json(
        { error: 'Offer letter or application not found' },
        { status: 404 }
      );
    }

    const offer = offerDetails[0];

    // Check if invoice already exists
    const existingInvoice = await executeQuery(`
      SELECT id FROM invoices 
      WHERE offer_letter_id = ?
    `, [offerLetterId]);

    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Invoice already exists',
          invoiceId: existingInvoice[0].id 
        }
      );
    }

    // Get employer's approved agreement to determine pricing
    const agreementDetails = await executeQuery(`
      SELECT 
        id,
        service_type,
        placement_fee_amount,
        agreement_content
      FROM employer_agreements
      WHERE employer_id = ?
      AND status IN ('approved', 'signed')
      AND service_type = 'end-to-end'
      ORDER BY 
        CASE WHEN status = 'approved' THEN 1 ELSE 2 END,
        approved_at DESC, signed_at DESC, created_at DESC
      LIMIT 1
    `, [offer.employer_id]);

    // Calculate invoice amount based on agreement terms
    // According to agreement: "The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher."
    const offerAmount = parseFloat(offer.offer_amount || '0');
    const minimumFee = 800000; // TSH 800,000 minimum
    let subtotal = 0;
    let commissionRate = 0;
    
    // ALWAYS calculate based on agreement terms: max(offer_amount, 800000)
    // Do NOT use stored placement_fee_amount as it may be incorrect for different offers
    // According to agreement: "The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher."
    subtotal = Math.max(offerAmount, minimumFee);
    
    // Calculate commission rate for display
    if (offerAmount > 0) {
      commissionRate = (subtotal / offerAmount) * 100;
    } else {
      commissionRate = 0;
    }
    
    console.log(`💰 Invoice calculation:`, {
      offerAmount,
      minimumFee,
      calculatedSubtotal: subtotal,
      commissionRate: `${commissionRate.toFixed(2)}%`
    });

    // Tax calculation (VAT if applicable - currently 0%)
    const taxRate = 0.00; // No tax for now, can be configured
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${randomSuffix}`;

    // Calculate due date (15 days from invoice date as per agreement)
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 15);

    // Create invoice
    const invoiceResult = await executeSingleQuery(`
      INSERT INTO invoices (
        invoice_number,
        offer_letter_id,
        application_id,
        employer_id,
        candidate_id,
        job_id,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        currency,
        commission_rate,
        offer_amount,
        status,
        invoice_date,
        due_date,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
    `, [
      invoiceNumber,
      offerLetterId,
      applicationId,
      offer.employer_id,
      offer.candidate_id,
      offer.job_id,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      'TZS',
      commissionRate,
      offerAmount,
      invoiceDate.toISOString().split('T')[0],
      dueDate.toISOString().split('T')[0],
      `Placement fee for ${offer.position_title || offer.job_title} - ${offer.candidate_first_name} ${offer.candidate_last_name}. Fee calculated as per agreement: one-month gross salary (${formatCurrency(offerAmount)}) or TZS 800,000, whichever is higher.`
    ]);

    const invoiceId = invoiceResult.insertId;

    // Update application status to 'selected' if not already
    if (offer.application_status !== 'selected') {
      await executeSingleQuery(`
        UPDATE applications 
        SET status = 'selected', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [applicationId]);
    }

    // Create Stripe payment link for the invoice
    let paymentLink = null;
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-10-29.clover' as any,
      });

      // Convert TZS to USD for Stripe (Stripe doesn't support TZS)
      // Exchange rate: 1 USD = 2500 TZS (configurable via TZS_TO_USD_RATE env var)
      // Calculate USD amount that converts back closest to original TZS
      const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2500');
      const amountInUSD = totalAmount / TZS_TO_USD_RATE;
      const amountInUSDRounded = Math.round(amountInUSD * 100) / 100;
      const convertedBackTZS = amountInUSDRounded * TZS_TO_USD_RATE;
      const difference = Math.abs(convertedBackTZS - totalAmount);
      
      // If difference is significant, try rounding up/down to minimize it
      let finalAmountInUSD = amountInUSDRounded;
      if (difference > 0.5) {
        const amountUp = Math.ceil(amountInUSD * 100) / 100;
        const amountDown = Math.floor(amountInUSD * 100) / 100;
        const diffUp = Math.abs(amountUp * TZS_TO_USD_RATE - totalAmount);
        const diffDown = Math.abs(amountDown * TZS_TO_USD_RATE - totalAmount);
        finalAmountInUSD = diffUp < diffDown ? amountUp : amountDown;
      }
      
      const amountInCents = Math.round(finalAmountInUSD * 100);
      
      // Verify conversion accuracy
      const finalConvertedBackTZS = finalAmountInUSD * TZS_TO_USD_RATE;
      const finalDifference = Math.abs(finalConvertedBackTZS - totalAmount);
      if (finalDifference > 1) {
        console.warn(`⚠️ Currency conversion: TZS ${totalAmount} → USD $${finalAmountInUSD} → TZS ${finalConvertedBackTZS} (diff: ${finalDifference.toFixed(2)})`);
      }

      // Format TZS amount for display
      const formattedTZSAmount = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(totalAmount);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd', // Stripe doesn't support TZS, using USD
              product_data: {
                name: `Invoice ${invoiceNumber}`,
                description: `Placement Fee - ${offer.position_title || offer.job_title} - ${offer.candidate_first_name} ${offer.candidate_last_name}\n\nOriginal Amount: TZS ${formattedTZSAmount}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employer/invoices?payment=cancelled`,
        customer_email: offer.employer_email,
        metadata: {
          invoice_id: invoiceId.toString(),
          invoice_number: invoiceNumber,
          employer_id: offer.employer_id.toString(),
          original_amount_tzs: totalAmount.toString(),
          original_currency: 'TZS',
          exchange_rate: TZS_TO_USD_RATE.toString(),
        },
        invoice_creation: {
          enabled: true,
        },
      });

      paymentLink = session.url;

      // Update invoice with payment link
      await executeSingleQuery(`
        UPDATE invoices 
        SET payment_link = ?
        WHERE id = ?
      `, [paymentLink, invoiceId]);

      // Create payment record
      // Use offer_letter_id as the payments table structure requires it
      await executeSingleQuery(`
        INSERT INTO payments (
          offer_letter_id, employer_id, amount, currency, 
          payment_method, payment_status, stripe_payment_intent_id
        ) VALUES (?, ?, ?, ?, 'stripe', 'pending', ?)
      `, [offerLetterId, offer.employer_id, totalAmount, 'TZS', session.id]);

    } catch (stripeError: any) {
      console.error('Error creating Stripe payment link:', stripeError);
      // Continue without payment link - it can be created later
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: {
        id: invoiceId,
        invoiceNumber,
        totalAmount,
        subtotal,
        taxAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        invoiceDate: invoiceDate.toISOString().split('T')[0],
        paymentLink
      }
    });

  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

