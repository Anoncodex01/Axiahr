require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');
const Stripe = require('stripe');

// Script to manually update payment record from Stripe session
async function updatePaymentFromStripe() {
  console.log('🔄 Updating Payment from Stripe...\n');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
  });

  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'axia_db',
      port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    console.log('✅ Connected to database\n');

    // Find payment with stripe_payment_intent_id but missing payment_reference
    const [payments] = await connection.execute(`
      SELECT 
        p.id,
        p.offer_letter_id,
        p.employer_id,
        p.amount,
        p.currency,
        p.payment_status,
        p.stripe_payment_intent_id,
        p.payment_reference,
        p.payment_date,
        i.id as invoice_id,
        i.invoice_number
      FROM payments p
      LEFT JOIN invoices i ON i.offer_letter_id = p.offer_letter_id
      WHERE p.payment_status = 'pending'
      AND (p.stripe_payment_intent_id IS NOT NULL OR p.payment_reference IS NOT NULL)
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log(`Found ${payments.length} pending payments to check:\n`);

    for (const payment of payments) {
      const sessionId = payment.stripe_payment_intent_id || payment.payment_reference;
      
      if (!sessionId) {
        console.log(`⚠️  Payment #${payment.id}: No session ID found, skipping`);
        continue;
      }

      try {
        // Try to retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        console.log(`📋 Payment #${payment.id}:`);
        console.log(`   Session ID: ${sessionId}`);
        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Invoice ID from metadata: ${session.metadata?.invoice_id || 'N/A'}`);

        if (session.payment_status === 'paid' || session.payment_status === 'complete') {
          // Update payment record
          const paymentIntentId = typeof session.payment_intent === 'string' 
            ? session.payment_intent 
            : session.payment_intent?.id;

          // Update payment
          await connection.execute(`
            UPDATE payments 
            SET payment_status = 'completed',
                payment_date = CURRENT_TIMESTAMP,
                payment_method = 'stripe',
                payment_reference = ?,
                ${payment.stripe_payment_intent_id ? 'stripe_payment_intent_id = ?,' : ''}
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, payment.stripe_payment_intent_id 
            ? [sessionId, paymentIntentId || sessionId, payment.id]
            : [sessionId, payment.id]
          );

          // Update invoice if exists
          if (payment.invoice_id) {
            await connection.execute(`
              UPDATE invoices 
              SET status = 'paid',
                  paid_date = CURRENT_TIMESTAMP,
                  payment_method = 'stripe',
                  payment_reference = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [sessionId, payment.invoice_id]);
            console.log(`   ✅ Updated invoice ${payment.invoice_number} to paid`);
          }

          console.log(`   ✅ Updated payment #${payment.id} to completed\n`);
        } else {
          console.log(`   ⏳ Payment still pending in Stripe\n`);
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`   ⚠️  Session ${sessionId} not found in Stripe\n`);
        } else {
          console.error(`   ❌ Error checking session ${sessionId}:`, error.message || error);
        }
      }
    }

    console.log('✅ Update completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updatePaymentFromStripe();

