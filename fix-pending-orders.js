/**
 * Script to verify and update pending CV orders by checking Stripe payment status
 * Only updates orders where Stripe confirms payment was successful
 * Run with: node fix-pending-orders.js
 * 
 * Requires: npm install mysql2 stripe dotenv
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const Stripe = require('stripe');

const dbConfig = {
  host: process.env.DB_HOST || '192.250.229.162',
  user: process.env.DB_USER || 'nisapoti_Axia',
  password: process.env.DB_PASSWORD || 'Alvin@2025',
  database: process.env.DB_NAME || 'nisapoti_Axia',
  port: process.env.DB_PORT || 3306
};

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.log('   Please ensure your .env file contains: STRIPE_SECRET_KEY=sk_test_...');
  console.log('   Current env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-10-29.clover',
});

async function verifyStripePayment(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      exists: true,
      paymentStatus: session.payment_status,
      status: session.status,
      paid: session.payment_status === 'paid' || session.status === 'complete',
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
      metadata: session.metadata
    };
  } catch (error) {
    if (error.code === 'resource_missing') {
      return {
        exists: false,
        error: 'Session not found in Stripe'
      };
    }
    return {
      exists: false,
      error: error.message
    };
  }
}

async function fixPendingOrders() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
      console.log('   Please add it to your .env file');
      process.exit(1);
    }

    // Get all pending orders
    const [orders] = await connection.execute(
      `SELECT id, candidate_id, stripe_session_id, payment_status, created_at, amount_usd
       FROM cv_orders 
       WHERE payment_status = 'pending' 
       ORDER BY created_at DESC`
    );

    console.log(`\n📋 Found ${orders.length} pending order(s)\n`);
    console.log('🔍 Verifying payment status with Stripe...\n');

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Order ID: ${order.id}`);
      console.log(`  Candidate ID: ${order.candidate_id}`);
      console.log(`  Session ID: ${order.stripe_session_id}`);
      console.log(`  Amount: $${order.amount_usd}`);
      console.log(`  Created: ${order.created_at}`);
      
      if (!order.stripe_session_id) {
        console.log(`  ⚠️  No Stripe session ID - skipping`);
        skippedCount++;
        console.log('');
        continue;
      }

      // Verify payment with Stripe
      console.log(`  🔍 Checking Stripe payment status...`);
      const stripeStatus = await verifyStripePayment(order.stripe_session_id);
      
      if (!stripeStatus.exists) {
        console.log(`  ❌ Session not found in Stripe: ${stripeStatus.error}`);
        errorCount++;
        console.log('');
        continue;
      }

      console.log(`  📊 Stripe Status:`);
      console.log(`     Payment Status: ${stripeStatus.paymentStatus}`);
      console.log(`     Session Status: ${stripeStatus.status}`);
      console.log(`     Amount: ${stripeStatus.amountTotal ? (stripeStatus.amountTotal / 100).toFixed(2) : 'N/A'} ${stripeStatus.currency?.toUpperCase() || ''}`);
      
      if (stripeStatus.paid) {
        // Payment is confirmed - update order
        await connection.execute(
          `UPDATE cv_orders 
           SET payment_status = 'completed',
               paid_at = NOW(),
               updated_at = NOW()
           WHERE id = ?`,
          [order.id]
        );
        
        console.log(`  ✅ Payment verified - Updated to completed`);
        updatedCount++;
      } else {
        console.log(`  ⚠️  Payment not completed in Stripe - keeping as pending`);
        console.log(`     (Payment status: ${stripeStatus.paymentStatus}, Session status: ${stripeStatus.status})`);
        skippedCount++;
      }
      
      console.log('');
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} order(s)`);
    console.log(`   ⚠️  Skipped: ${skippedCount} order(s)`);
    console.log(`   ❌ Errors: ${errorCount} order(s)`);
    console.log(`   📋 Total: ${orders.length} order(s)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
fixPendingOrders().catch(console.error);

