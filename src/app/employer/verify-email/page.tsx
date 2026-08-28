'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'expired'>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from localStorage or URL
    const storedEmail = localStorage.getItem('employerEmail');
    const token = searchParams.get('token');

    if (storedEmail) {
      setEmail(storedEmail);
    }

    // If token is present, verify automatically
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setIsVerifying(true);
    setStatus('verifying');

    try {
      const response = await fetch(`/api/employers/verify-email?token=${token}`);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes('expired')) {
          setStatus('expired');
          setMessage(data.error || 'Verification link has expired. Please request a new one.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
        return;
      }

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! Your account is now active.');
        
        // Clear registration data
        localStorage.removeItem('employerEmail');
        localStorage.removeItem('employerRegistration');
        
        // Update employerData if it exists (user might be logged in)
        const employerData = localStorage.getItem('employerData');
        if (employerData) {
          try {
            const parsed = JSON.parse(employerData);
            parsed.emailVerified = true;
            localStorage.setItem('employerData', JSON.stringify(parsed));
          } catch (e) {
            console.error('Error updating employerData:', e);
          }
        }
        
        // Also set the old flag for backward compatibility
        localStorage.setItem('employerEmailVerified', 'true');
        
        // Redirect to company profile after 3 seconds (or login if not logged in)
        setTimeout(() => {
          const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
          if (authToken) {
            // User is already logged in, redirect to company profile to complete it
            router.push('/employer/company-profile');
          } else {
            // User not logged in, redirect to login
            router.push('/employer/login?verified=true');
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('Verification failed. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setMessage('Email address not found. Please register again.');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      const response = await fetch('/api/employers/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to resend verification email. Please try again.');
        return;
      }

      if (data.success) {
        setMessage('Verification email sent! Please check your inbox.');
        setStatus('idle');
      }
    } catch (error: any) {
      console.error('Resend email error:', error);
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center">
              <img src="/logo11.png" alt="Axia HR Advisory" className="h-12 w-auto" />
            </Link>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600">
            Please verify your email address to complete registration
          </p>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 border-4 border-[#114373] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full bg-[#114373] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#0d3559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full bg-[#114373] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#0d3559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Request New Verification Link
                  </>
                )}
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 text-[#114373]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to <strong>{email || 'your email'}</strong>. 
                Please click the link in the email to verify your account.
              </p>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                  className="w-full bg-[#114373] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#0d3559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Resend Verification Email
                    </>
                  )}
                </button>

                <Link
                  href="/employer/login"
                  className="block w-full text-center text-[#114373] hover:text-[#0d3559] font-medium py-2"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Back to Registration */}
          <div className="mt-6 text-center">
            <Link
              href="/employer/register"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

