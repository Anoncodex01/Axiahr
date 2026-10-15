'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function CandidateLoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const readApiResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return {
      error: text.includes('<!DOCTYPE')
        ? 'The server returned an error page instead of a login response. Please try again after the server finishes compiling or contact support.'
        : text || 'Login failed. Please try again.'
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/candidates/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await readApiResponse(response);

      // Check for verification requirement first (even if success is false)
      if (result.requiresVerification) {
        // User exists but email not verified - redirect to verification
        const userData = {
          id: result.candidate?.id,
          firstName: result.candidate?.first_name,
          middleName: result.candidate?.middle_name,
          surname: result.candidate?.surname,
          email: result.email || result.candidate?.email,
          phone: result.candidate?.phone,
          gender: result.candidate?.gender,
          isAuthenticated: true,
          isVerified: false
        };
        localStorage.setItem('candidateUser', JSON.stringify(userData));
        router.push('/candidate/verification');
        return;
      }

      if (result.success) {
        // Clear all old candidate-related data to prevent conflicts when switching accounts
        const keysToRemove = [
          'candidateUser',
          'candidateData',
          'authToken',
          'candidateAuthToken',
          'token',
          'profileCompletionPercent',
          'profileData',
          'candidateProfile'
        ];
        
        console.log('🧹 Clearing old localStorage data before login...');
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key} from localStorage:`, e);
          }
        });
        
        // Store new token and candidate data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('candidateAuthToken', result.token);
        localStorage.setItem('token', result.token);
        localStorage.setItem('userType', 'candidate');
        localStorage.setItem('candidateData', JSON.stringify(result.candidate));
        
        // Also store in candidateUser format for compatibility
        const candidateUserData = {
          id: result.candidate.id,
          firstName: result.candidate.first_name,
          middleName: result.candidate.middle_name,
          surname: result.candidate.surname,
          email: result.candidate.email,
          phone: result.candidate.phone,
          gender: result.candidate.gender,
          isAuthenticated: true,
          isVerified: result.candidate.email_verified || false
        };
        localStorage.setItem('candidateUser', JSON.stringify(candidateUserData));
        // Set auth cookie for middleware (7 days)
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
        document.cookie = `authToken=${result.token}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`;
        document.cookie = `candidateAuthToken=${result.token}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isHttps ? '; Secure' : ''}`;
        
        // Handle redirect after login immediately (no delay)
        const from = searchParams.get('from');
        const apply = searchParams.get('apply');
        
        if (apply) {
          // If user was trying to apply, redirect to application form
          // Extract jobId from the 'from' URL or use 'apply' as jobId
          let jobId = apply;
          if (from && from.includes('/jobs/')) {
            const match = from.match(/\/jobs\/([^/?]+)/);
            if (match) jobId = match[1];
          }
          router.push(`/candidate/apply/${jobId}`);
        } else if (from) {
          // Redirect back to the page they came from (could be /job-search or other pages)
          router.push(from);
        } else {
          // Default redirect to dashboard
          router.push('/candidate/dashboard');
        }
      } else if (result.requiresVerification) {
        // Clear old data before setting new verification data
        const keysToRemove = [
          'candidateUser',
          'candidateData',
          'authToken',
          'candidateAuthToken',
          'token',
          'profileCompletionPercent',
          'profileData',
          'candidateProfile'
        ];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove ${key} from localStorage:`, e);
          }
        });
        
        // User exists but email not verified - redirect to verification
        const userData = {
          id: result.candidate?.id,
          firstName: result.candidate?.first_name,
          middleName: result.candidate?.middle_name,
          surname: result.candidate?.surname,
          email: result.email,
          phone: result.candidate?.phone,
          gender: result.candidate?.gender,
          isAuthenticated: true,
          isVerified: false
        };
        localStorage.setItem('candidateUser', JSON.stringify(userData));
        router.push('/candidate/verification');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) {
      setError('');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - Image with Text */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden shadow-2xl">
        <Image
          src="/Business-professionals-shaking-hands-during-a-meeting-in-a-modern-office-with-laptop-and-documents-portrait.jpg"
          alt="Professional workspace"
          fill
          className="object-cover"
          priority
        />
        {/* Brand color gradient from bottom (opaque) to top (transparent) - like transparent gradient mask */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{
            background: 'linear-gradient(to top, rgba(17, 67, 115, 0.95) 0%, rgba(17, 67, 115, 0.85) 15%, rgba(17, 67, 115, 0.65) 30%, rgba(17, 67, 115, 0.4) 45%, rgba(17, 67, 115, 0.2) 60%, rgba(17, 67, 115, 0.1) 75%, rgba(17, 67, 115, 0.05) 85%, rgba(17, 67, 115, 0) 100%)'
          }}
        ></div>
        
        {/* Text Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end">
          <div 
            className="w-full p-8 pb-12 shadow-2xl"
            style={{
              background: 'linear-gradient(to top, rgba(17, 67, 115, 0.85) 0%, rgba(17, 67, 115, 0.65) 25%, rgba(17, 67, 115, 0.5) 50%, rgba(17, 67, 115, 0.35) 70%, rgba(17, 67, 115, 0.15) 85%, rgba(17, 67, 115, 0.05) 100%)'
            }}
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 leading-tight text-white">
                Welcome Back
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Continue your career journey with us. Access your profile, track applications, and discover new opportunities.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Track your job applications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Get personalized job recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Manage your professional profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col justify-center py-4 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link href="/" className="flex items-center">
              <img src="/logo11.png" alt="Axia HR Advisory" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-outfit-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-lg text-gray-600 font-outfit-regular">
              Sign in to your candidate account
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-xl p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm font-outfit-medium text-red-700">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent transition-all font-outfit-regular text-gray-900 placeholder-gray-400"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={loginData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent transition-all font-outfit-regular text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[#114373] to-[#1a3658] text-white rounded-xl font-outfit-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 font-outfit-regular">
                Don't have an account?{' '}
                <Link href="/candidate/register" className="text-[#114373] hover:text-[#0d3559] font-outfit-semibold transition-colors">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
      </div>
    }>
      <CandidateLoginContent />
    </Suspense>
  );
}
