/**
 * Test Email Script
 * Tests sending an email using the configured SMTP settings
 * 
 * Usage: node scripts/test-email.js
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');

  // Get SMTP configuration
  const smtpHost = process.env.SMTP_HOST || 'support.axia.co.tz';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || 'no-reply@support.axia.co.tz';
  const smtpPass = process.env.SMTP_PASS || '';
  const fromEmail = process.env.FROM_EMAIL || smtpUser;
  const fromName = process.env.FROM_NAME || 'Axia HR Advisory';

  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${smtpHost}`);
  console.log(`   Port: ${smtpPort}`);
  console.log(`   Secure: ${smtpSecure}`);
  console.log(`   User: ${smtpUser}`);
  console.log(`   From: ${fromName} <${fromEmail}>`);
  console.log('');

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('❌ Error: SMTP configuration is incomplete!');
    console.error('   Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local');
    process.exit(1);
  }

  // Create transporter
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
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  try {
    // Verify connection
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    const testEmailAddress = 'uriohalvin@gmail.com';
    console.log(`📤 Sending test email to: ${testEmailAddress}...`);

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: testEmailAddress,
      subject: 'Test Email from Axia HR Advisory',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #114373 0%, #0d3559 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #114373; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Test Email</h2>
            <p style="color: #333333; margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
              This is a test email from Axia HR Advisory to verify SMTP configuration.
            </p>
            <div style="background: #f8f9fa; border-left: 4px solid #114373; padding: 15px; margin: 20px 0;">
              <p style="color: #495057; margin: 0; font-size: 14px; line-height: 1.6;">
                <strong>Configuration Details:</strong><br>
                SMTP Host: ${smtpHost}<br>
                SMTP Port: ${smtpPort}<br>
                Secure: ${smtpSecure ? 'Yes' : 'No'}<br>
                From: ${fromEmail}
              </p>
            </div>
            <p style="color: #495057; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
              If you received this email, the SMTP configuration is working correctly! ✅
            </p>
          </div>
          <div style="background: #f8f9fa; border-top: 1px solid #e9ecef; padding: 20px; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">Best regards,<br><strong>Axia HR Advisory Team</strong></p>
            <p style="color: #adb5bd; margin: 10px 0 0 0; font-size: 11px;">&copy; ${new Date().getFullYear()} Axia HR Advisory. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Test Email from Axia HR Advisory\n\nThis is a test email to verify SMTP configuration.\n\nConfiguration:\n- SMTP Host: ${smtpHost}\n- SMTP Port: ${smtpPort}\n- Secure: ${smtpSecure ? 'Yes' : 'No'}\n- From: ${fromEmail}\n\nIf you received this email, the SMTP configuration is working correctly!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`\n📬 Please check ${testEmailAddress} (including spam/junk folder)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Command: ${error.command || 'N/A'}`);
    console.error(`   Message: ${error.message}`);
    if (error.response) {
      console.error(`   SMTP Response: ${error.response}`);
    }
    process.exit(1);
  }
}

// Run the test
testEmail();

