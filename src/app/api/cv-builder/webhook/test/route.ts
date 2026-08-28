import { NextRequest, NextResponse } from 'next/server';

// GET /api/cv-builder/webhook/test - Test webhook endpoint connectivity
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'CV Builder webhook endpoint is accessible',
    endpoint: '/api/cv-builder/webhook',
    method: 'POST',
    requiredHeaders: {
      'stripe-signature': 'Required for production, optional for development'
    },
    environment: {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET 
        ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...' 
        : 'NOT SET'
    },
    instructions: {
      step1: 'Go to Stripe Dashboard → Developers → Webhooks',
      step2: 'Click "Add endpoint"',
      step3: 'Enter your webhook URL: https://yourdomain.com/api/cv-builder/webhook',
      step4: 'For local testing, use ngrok: https://your-ngrok-url.ngrok.io/api/cv-builder/webhook',
      step5: 'Select events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed',
      step6: 'Copy the webhook signing secret to your .env as STRIPE_WEBHOOK_SECRET',
      step7: 'Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/cv-builder/webhook'
    }
  });
}

