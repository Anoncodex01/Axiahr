import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/career-counselling/create-payment - Create Stripe Checkout Session for Career Counselling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { candidateId, bookingData } = body;

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

    // Extract candidate ID from token if not provided in body
    const tokenCandidateId = decoded.candidateId || decoded.id || decoded.sub;
    
    if (!candidateId) {
      candidateId = tokenCandidateId;
    } else {
      if (tokenCandidateId && tokenCandidateId.toString() !== candidateId.toString()) {
        candidateId = tokenCandidateId;
      }
    }

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    // Validate booking data
    if (!bookingData || !bookingData.fullName || !bookingData.email || !bookingData.phone || !bookingData.preferredDatetime) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    // Get candidate details
    const candidates = await executeQuery(
      'SELECT id, first_name, surname, email FROM candidates WHERE id = ?',
      [candidateId]
    );

    if (candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const candidate = candidates[0];

    // Career Counselling pricing
    const amountTZS = 50000; // TZS 50,000
    const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2678');
    const amountInUSD = amountTZS / TZS_TO_USD_RATE;
    const amountInCents = Math.round(amountInUSD * 100);

    // Format amounts for display
    const formattedTZSAmount = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amountTZS);

    const formattedUSDAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountInUSD);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Career Counselling Session',
              description: `Career counselling session for ${bookingData.fullName}\n\nSession: ${new Date(bookingData.preferredDatetime).toLocaleString()}\nMode: ${bookingData.sessionMode === 'online' ? 'Online' : 'In-person'}\n\nAmount: TZS ${formattedTZSAmount} (USD ${formattedUSDAmount})`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/career-counselling?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/career-counselling?payment=cancelled`,
      customer_email: bookingData.email,
      metadata: {
        candidate_id: candidateId.toString(),
        candidate_name: bookingData.fullName,
        candidate_email: bookingData.email,
        service_type: 'career_counselling',
        amount_tzs: amountTZS.toString(),
        amount_usd: amountInUSD.toString(),
        exchange_rate: TZS_TO_USD_RATE.toString(),
        preferred_datetime: bookingData.preferredDatetime,
        session_mode: bookingData.sessionMode,
        city: bookingData.city || '',
      },
    });

    // Create career counselling order record
    const orderResult = await executeSingleQuery(
      `INSERT INTO career_counselling_orders 
       (candidate_id, full_name, email, phone, preferred_datetime, session_mode, city, notes, 
        amount_tzs, amount_usd, currency, payment_status, payment_method, stripe_session_id, 
        created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', 'pending', 'stripe', ?, NOW(), NOW())`,
      [
        candidateId,
        bookingData.fullName,
        bookingData.email,
        bookingData.phone,
        bookingData.preferredDatetime,
        bookingData.sessionMode || 'online',
        bookingData.city || null,
        bookingData.notes || null,
        amountTZS,
        amountInUSD,
        session.id
      ]
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: orderResult.insertId,
      amountTZS: amountTZS,
      amountUSD: amountInUSD,
      formattedTZS: formattedTZSAmount,
      formattedUSD: formattedUSDAmount,
      exchangeRate: TZS_TO_USD_RATE
    });

  } catch (error: any) {
    console.error('❌ Error creating Career Counselling payment session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create payment session' 
      },
      { status: 500 }
    );
  }
}

