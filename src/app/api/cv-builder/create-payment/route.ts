import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { executeQuery, executeSingleQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover' as any,
});

// POST /api/cv-builder/create-payment - Create Stripe Checkout Session for CV Builder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { candidateId } = body;

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
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract candidate ID from token if not provided in body
    const tokenCandidateId = decoded.candidateId || decoded.id || decoded.sub;
    
    if (!candidateId) {
      // Use candidate ID from token
      candidateId = tokenCandidateId;
    } else {
      // Verify candidate ID from body matches token
      if (tokenCandidateId && tokenCandidateId.toString() !== candidateId.toString()) {
        console.warn('⚠️ Candidate ID mismatch:', {
          bodyCandidateId: candidateId,
          tokenCandidateId: tokenCandidateId
        });
        // Use token candidate ID instead for security
        candidateId = tokenCandidateId;
      }
    }

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: 'Candidate ID not found in token' },
        { status: 401 }
      );
    }

    console.log('✅ CV Builder payment - Authenticated:', {
      candidateId,
      tokenCandidateId,
      decodedKeys: Object.keys(decoded)
    });

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

    // CV Builder pricing
    const amountTZS = 50000; // TZS 50,000
    const TZS_TO_USD_RATE = parseFloat(process.env.TZS_TO_USD_RATE || '2500');
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
            currency: 'usd', // Stripe doesn't support TZS, using USD
            product_data: {
              name: 'Professional CV Generation',
              description: `Professional CV generation service for ${candidate.first_name} ${candidate.surname || ''}\n\nAmount: TZS ${formattedTZSAmount} (USD ${formattedUSDAmount})`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/cv-builder?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/cv-builder?payment=cancelled`,
      customer_email: candidate.email,
      metadata: {
        candidate_id: candidateId.toString(),
        candidate_name: `${candidate.first_name} ${candidate.surname || ''}`,
        candidate_email: candidate.email,
        service_type: 'cv_builder',
        amount_tzs: amountTZS.toString(),
        amount_usd: amountInUSD.toString(),
        exchange_rate: TZS_TO_USD_RATE.toString(),
      },
    });

            // Create CV order record
            const orderResult = await executeSingleQuery(
              `INSERT INTO cv_orders 
               (candidate_id, amount_tzs, amount_usd, currency, payment_status, payment_method, stripe_session_id, created_at, updated_at) 
               VALUES (?, ?, ?, 'USD', 'pending', 'stripe', ?, NOW(), NOW())`,
              [candidateId, amountTZS, amountInUSD, session.id]
            );

            console.log('✅ CV order created:', {
              orderId: orderResult.insertId,
              candidateId,
              sessionId: session.id,
              amountTZS,
              amountUSD: amountInUSD
            });

    console.log('✅ CV Builder payment session created:', {
      sessionId: session.id,
      orderId: orderResult.insertId,
      candidateId,
      amountTZS,
      amountUSD: amountInUSD
    });

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
    console.error('❌ Error creating CV Builder payment session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create payment session' 
      },
      { status: 500 }
    );
  }
}

