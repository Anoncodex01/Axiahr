'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function EmployerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check for verification success message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.');
      // Clear the query parameter
      window.history.replaceState({}, '', '/employer/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/employers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.error || 'Too many login attempts. Please try again later.');
        } else if (response.status === 403) {
          if (data.emailNotVerified) {
            setError(data.error || 'Please verify your email address before logging in.');
            // Optionally redirect to verification page
            setTimeout(() => {
              router.push('/employer/verify-email');
            }, 2000);
          } else {
            setError(data.error || 'Your account is not active. Please contact support.');
          }
        } else if (response.status === 401) {
          setError(data.error || 'Invalid email or password');
        } else {
          setError(data.error || 'Login failed. Please try again.');
        }
        return;
      }

      if (data.success && data.employer && data.token) {
        // Store authentication data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('employerAuthToken', data.token);
        localStorage.setItem('userType', 'employer');
        localStorage.setItem('employerData', JSON.stringify(data.employer));
        
        // Always redirect to dashboard after login
        // Dashboard will show a message if profile is incomplete
        router.push('/employer/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left side - Image with Text */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden shadow-2xl">
        <Image
          src="/iStock-1294958620-1536x1024.jpg"
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
                Continue managing your recruitment process. Access your dashboard, post jobs, and find the best talent.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Post and manage job listings</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Review candidate applications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Access your company dashboard</span>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Employer Portal
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to manage your recruitment process
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-outfit-medium text-green-700">{successMessage}</p>
                </div>
              </div>
            )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all font-outfit-regular text-gray-900 placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-outfit-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all font-outfit-regular text-gray-900 placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-outfit-medium text-red-700">{error}</p>
              </div>
            )}

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

            {/* Additional Links */}
            <div className="mt-6 text-center">
              <Link href="/employer/forgot-password" className="text-[#114373] hover:text-[#0d3559] text-sm font-outfit-medium transition-colors">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600 text-sm font-outfit-regular">
                Don't have an employer account?{' '}
                <Link href="/employer/register" className="text-[#114373] hover:text-[#0d3559] font-outfit-semibold transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
