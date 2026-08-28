'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, ArrowRight, Sparkles, Clock, Shield, AlertCircle } from 'lucide-react';

export default function CandidateVerification() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user email from localStorage
    const candidateUser = localStorage.getItem('candidateUser');
    if (candidateUser) {
      const userData = JSON.parse(candidateUser);
      setUserEmail(userData.email || '');
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear errors when user starts typing
    if (errors.verification) {
      setErrors(prev => ({ ...prev, verification: '' }));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only process if pasted data contains 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('').slice(0, 6);
      setVerificationCode(digits);
      
      // Clear errors
      if (errors.verification) {
        setErrors(prev => ({ ...prev, verification: '' }));
      }
      
      // Focus the last input
      const lastInput = document.getElementById(`code-5`);
      lastInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const validateCode = () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      return 'Please enter the complete 6-digit verification code';
    }
    if (!/^\d{6}$/.test(code)) {
      return 'Verification code must contain only numbers';
    }
    return null;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCode();
    if (validationError) {
      setErrors({ verification: validationError });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Get user data from localStorage
      const candidateUser = localStorage.getItem('candidateUser');
      if (!candidateUser) {
        throw new Error('User data not found. Please register again.');
      }

      const userData = JSON.parse(candidateUser);
      
      // Call verification API
      const response = await fetch('/api/candidates/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          otp: verificationCode.join('')
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      // Clear ALL old localStorage data to prevent showing wrong user's data
      // This is critical to prevent showing previous user's profile
      const keysToRemove = [
        'candidateUser',
        'candidateData',
        'authToken',
        'token',
        'candidateAuthToken',
        'profileCompletionPercent',
        'pendingApply',
        'userData',
        'employerData',
        'employerUser',
        'candidateProfile', // Clear any cached profile data
        'profileData' // Clear any cached profile data
      ];
      
      console.log('🧹 Clearing old localStorage data before setting new user data...');
      keysToRemove.forEach(key => {
        try {
          const hadValue = localStorage.getItem(key);
          if (hadValue) {
            console.log(`  ✓ Removed ${key}`);
          }
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key} from localStorage:`, e);
        }
      });

      // Store new auth token if provided (from login after verification)
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('token', result.token);
      }

      // Use the candidate data from API response (most accurate)
      if (result.candidate) {
        const newCandidateData = {
          id: result.candidate.id,
          firstName: result.candidate.first_name || userData.firstName,
          middleName: result.candidate.middle_name || userData.middleName,
          surname: result.candidate.surname || userData.surname,
          email: result.candidate.email || userData.email,
          phone: result.candidate.phone || userData.phone,
          gender: result.candidate.gender || userData.gender,
          isVerified: true,
          emailVerified: true,
          verificationDate: new Date().toISOString()
        };
        
        // Store new candidate user data
        localStorage.setItem('candidateUser', JSON.stringify(newCandidateData));
        
        // Also store in candidateData format for compatibility
        localStorage.setItem('candidateData', JSON.stringify({
          id: result.candidate.id,
          first_name: result.candidate.first_name,
          middle_name: result.candidate.middle_name,
          surname: result.candidate.surname,
          email: result.candidate.email,
          phone: result.candidate.phone,
          gender: result.candidate.gender,
          email_verified: true
        }));
      } else {
        // Fallback: update existing user data
        const updatedUserData = {
          ...userData,
          isVerified: true,
          emailVerified: true,
          verificationDate: new Date().toISOString()
        };
        localStorage.setItem('candidateUser', JSON.stringify(updatedUserData));
      }

      // Show success message briefly before redirect
      setErrors({ success: 'Email verified successfully! Redirecting...' });

      // Check if there's a pending apply action
      const pendingApply = localStorage.getItem('pendingApply');
      if (pendingApply) {
        localStorage.removeItem('pendingApply');
        setTimeout(() => {
          // Force reload to clear any cached data
          window.location.href = pendingApply;
        }, 1000);
      } else {
        // Check profile completion status before redirecting
        try {
          const profileResponse = await fetch('/api/candidates/profile', { 
            cache: 'no-store',
            headers: result.token ? {
              'Authorization': `Bearer ${result.token}`
            } : {}
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const profileStatus = profileData?.data?.profile?.status;
            
            // If profile is not completed, redirect to profile wizard
            if (profileStatus !== 'completed') {
              setTimeout(() => {
                window.location.href = '/candidate/profile-wizard';
              }, 1000);
              return;
            }
          }
        } catch (error) {
          // If profile check fails, still redirect to wizard to be safe
          setTimeout(() => {
            window.location.href = '/candidate/profile-wizard';
          }, 1000);
          return;
        }
        
        // Profile is completed, redirect to dashboard
        // Use window.location.href instead of router.push to force a full page reload
        // This ensures all components fetch fresh data from the API
        setTimeout(() => {
          window.location.href = '/candidate/dashboard';
        }, 1000);
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Verification failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Get user data from localStorage
      const candidateUser = localStorage.getItem('candidateUser');
      if (!candidateUser) {
        throw new Error('User data not found. Please register again.');
      }

      const userData = JSON.parse(candidateUser);
      
      // Call resend API
      const response = await fetch('/api/candidates/verify-otp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend code');
      }

      // Clear verification code fields
      setVerificationCode(['', '', '', '', '', '']);
      
      // Set cooldown timer
      setResendCooldown(60); // 60 seconds cooldown
      
      // Show success message
      setErrors({ success: 'Verification code has been resent to your email. Please check your inbox.' });
      
      // Focus first input
      const firstInput = document.getElementById('code-0');
      firstInput?.focus();
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to resend code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#114373] via-[#1e5a8a] to-[#2d7dd2] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Verify Your Account
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              We've sent a verification code to your email address. 
              Please enter the code below to complete your registration.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-blue-100">Secure account verification</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-blue-100">Protect your personal information</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-blue-100">Access to all platform features</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Right side - Verification form */}
      <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#114373] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-[#114373]">{userEmail}</span>
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleVerify}>
              {/* Verification Code Input */}
              <div className="group">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-4">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Verification Code *
                </label>
                <div className="flex justify-center space-x-3" onPaste={handlePaste}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        errors.verification 
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#114373]'
                      }`}
                    />
                  ))}
                </div>
                {errors.verification && (
                  <p className="mt-2 text-sm text-red-600 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.verification}
                  </p>
                )}
              </div>

              {/* Success Message */}
              {errors.success && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {errors.success}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errors.submit && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {errors.submit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Verify Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.join('').length !== 6}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-[#114373] to-[#1e5a8a] hover:from-[#0d3559] hover:to-[#114373] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Verifying your account...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span>Verify Account</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[#114373] hover:text-[#0d3559] font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? (
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    'Resend verification code'
                  )}
                </button>
              </div>
            </form>

            {/* Back to Registration */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Need to change your email?</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/candidate/register')}
                  className="w-full flex justify-center items-center py-3 px-6 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Back to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
