"use client";

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testEmailConnection = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Email connection successful!');
      } else {
        setMessage(`❌ Email connection failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async (emailType: string = 'custom') => {
    if (!email) {
      setMessage('❌ Please enter an email address');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      let requestBody: any = {
        to: email,
        type: emailType,
      };

      // Set different email content based on type
      switch (emailType) {
        case 'otp-verification':
          requestBody.data = {
            name: 'Test User',
            otp: '123456',
            expiryMinutes: 10
          };
          break;
        case 'welcome-candidate':
          requestBody.data = {
            name: 'Test User',
            loginUrl: 'https://yoursite.com/login'
          };
          break;
        case 'custom':
        default:
          requestBody.subject = 'Test Email from Axia HR';
          requestBody.html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #114373, #0d3559); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Test Email</h1>
              </div>
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #114373; margin-top: 0;">Hello!</h2>
                <p>This is a test email from Axia HR Advisory to verify that our email system is working correctly.</p>
                <p>If you received this email, our SMTP configuration is working properly!</p>
                <p>Best regards,<br>The Axia HR Team</p>
              </div>
              <div style="background: #114373; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>© 2024 Axia HR Advisory. All rights reserved.</p>
              </div>
            </div>
          `;
          break;
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ${emailType} email sent successfully!`);
      } else {
        setMessage(`❌ Failed to send email: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Email Configuration Test</h1>
          
          <div className="space-y-6">
            {/* Test Connection */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Test SMTP Connection</h2>
              <p className="text-gray-600 mb-4">
                This will test if the SMTP server connection is working properly.
              </p>
              <button
                onClick={testEmailConnection}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {/* Send Test Email */}
            <div className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Send Test Emails</h2>
              <p className="text-gray-600 mb-4">
                Enter an email address and choose an email template to test.
              </p>
              <div className="flex gap-4 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Email Template Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => sendTestEmail('custom')}
                  disabled={loading || !email}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending...' : '📧 Basic Test'}
                </button>
                <button
                  onClick={() => sendTestEmail('otp-verification')}
                  disabled={loading || !email}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending...' : '🔐 OTP Verification'}
                </button>
                <button
                  onClick={() => sendTestEmail('welcome-candidate')}
                  disabled={loading || !email}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending...' : '🎉 Welcome Email'}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Configuration Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">SMTP Configuration</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Host:</strong> mail.nisapoti.co.tz</p>
                <p><strong>Port:</strong> 465</p>
                <p><strong>Security:</strong> SSL/TLS</p>
                <p><strong>From:</strong> no-reply@nisapoti.co.tz</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
