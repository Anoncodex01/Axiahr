/**
 * Simple Email Test Script
 * Tests sending a simple text email
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpSecure = true;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env.local');
    process.exit(1);
  }
  const fromEmail = process.env.FROM_EMAIL || smtpUser;
  const fromName = process.env.FROM_NAME || 'Axia HR Advisory';

  console.log('📧 Testing email to: uriohalvin@gmail.com');
  console.log(`   From: ${fromName} <${fromEmail}>`);
  console.log(`   SMTP: ${smtpHost}:${smtpPort}\n`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true, // Enable debug logging
    logger: true, // Log to console
  });

  try {
    console.log('🔌 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified!\n');

    console.log('📤 Sending email...');
    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: 'uriohalvin@gmail.com',
      subject: 'Test Email - Axia HR Advisory',
      text: 'This is a simple test email from Axia HR Advisory. If you receive this, the email system is working!',
      html: '<p>This is a simple test email from <strong>Axia HR Advisory</strong>.</p><p>If you receive this, the email system is working!</p>',
    });

    console.log('\n✅ Email sent!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   Accepted: ${info.accepted}`);
    console.log(`   Rejected: ${info.rejected}`);
    console.log('\n📬 Check uriohalvin@gmail.com (including spam/junk folder)');
    console.log('   Gmail may take a few minutes to deliver the email.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    process.exit(1);
  }
}

testEmail();

