'use client';

import { useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Phone, Shield, Lock, ArrowRight } from 'lucide-react';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';
import Image from 'next/image';

function CandidateRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    gender: '',
    email: '',
    phone: '',
    countryCode: '+255',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRequestIdRef = useRef<string | null>(null);


  const origins = [
    'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'South Sudan',
    'United States', 'United Kingdom', 'Germany', 'France', 'Australia',
    'India', 'China', 'South Africa', 'Nigeria', 'Egypt', 'Ghana',
    'Ethiopia', 'Morocco', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }

    // Middle Name validation (optional)
    if (formData.middleName.trim() && formData.middleName.trim().length < 2) {
      newErrors.middleName = 'Middle name must be at least 2 characters';
    } else if (formData.middleName.trim() && !/^[a-zA-Z\s]+$/.test(formData.middleName.trim())) {
      newErrors.middleName = 'Middle name can only contain letters and spaces';
    }

    // Surname validation
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    } else if (formData.surname.trim().length < 2) {
      newErrors.surname = 'Surname must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.surname.trim())) {
      newErrors.surname = 'Surname can only contain letters and spaces';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 7-15 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Retry function with exponential backoff
  const retryRequest = async (
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // If successful or client error (4xx), don't retry
          if (response.ok || (response.status >= 400 && response.status < 500)) {
            return response;
          }
          
          // For server errors (5xx), retry
          if (response.status >= 500 && attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          return response;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        lastError = error;
        
        // Network errors - retry
        if (attempt < maxRetries && (
          error.name === 'TypeError' || // Network error
          error.name === 'AbortError' || // Timeout
          error.message?.includes('fetch') ||
          error.message?.includes('network')
        )) {
          const delay = retryDelay * Math.pow(2, attempt);
          console.log(`Network error, retrying (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Registration already in progress, ignoring duplicate request');
      return;
    }

    // Clear ALL old localStorage data to prevent showing wrong user's data
    // This ensures a fresh start for new registrations
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
      'employerUser'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key} from localStorage:`, e);
      }
    });

    // Generate unique request ID for this submission
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    submitRequestIdRef.current = requestId;
    setIsSubmitting(true);
    setIsLoading(true);
    setErrors({});

    try {
      const fullPhone = `${formData.countryCode}${formData.phone.replace(/\s+/g, '')}`;
      const requestBody = {
        ...formData,
        phone: fullPhone,
        requestId // Include request ID to help with deduplication on server
      };

      // Use retry logic for network resilience
      const response = await retryRequest('/api/candidates/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Check if this is still the current request (prevent race conditions)
      if (submitRequestIdRef.current !== requestId) {
        console.log('Request superseded by newer request, ignoring response');
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Handle unverified account case - redirect to verification
          if (result.unverified || result.requiresVerification) {
            // New OTP has been sent, redirect to verification
            const userData = {
              id: result.candidate?.id,
              firstName: result.candidate?.first_name || formData.firstName,
              middleName: result.candidate?.middle_name || formData.middleName,
              surname: result.candidate?.surname || formData.surname,
              gender: result.candidate?.gender || formData.gender,
              email: result.email || formData.email,
              phone: result.candidate?.phone || fullPhone,
              isAuthenticated: true,
              isVerified: false,
              registrationDate: new Date().toISOString()
            };
            localStorage.setItem('candidateUser', JSON.stringify(userData));
            router.push('/candidate/verification');
            return;
          } else {
            setErrors({ submit: result.error || 'An account with this email or phone already exists' });
          }
        } else if (response.status === 400) {
          setErrors({ submit: result.error || 'Please check your input and try again' });
        } else {
          setErrors({ submit: result.error || 'Registration failed. Please try again.' });
        }
        return;
      }

      // Handle success case (including unverified redirect)
      if (result.success) {
        // Check if this is an unverified account redirect
        if (result.unverified || result.requiresVerification) {
          const userData = {
            id: result.candidate?.id || result.data?.candidateId,
            firstName: result.candidate?.first_name || formData.firstName,
            middleName: result.candidate?.middle_name || formData.middleName,
            surname: result.candidate?.surname || formData.surname,
            gender: result.candidate?.gender || formData.gender,
            email: result.email || result.candidate?.email || formData.email,
            phone: result.candidate?.phone || fullPhone,
            isAuthenticated: true,
            isVerified: false,
            registrationDate: new Date().toISOString()
          };
          localStorage.setItem('candidateUser', JSON.stringify(userData));
          router.push('/candidate/verification');
          return;
        }
        const fullPhoneLocal = fullPhone;
        const userData = {
          id: result.data.candidateId,
          firstName: formData.firstName,
          middleName: formData.middleName,
          surname: formData.surname,
          gender: formData.gender,
          email: formData.email,
          phone: fullPhoneLocal,
          isAuthenticated: true,
          isVerified: false,
          registrationDate: new Date().toISOString()
        };
        
        localStorage.setItem('candidateUser', JSON.stringify(userData));
        
        // Check if user came from apply flow
        const from = searchParams.get('from');
        const apply = searchParams.get('apply');
        
        if (apply && from) {
          // User registered to apply - redirect to verification first, then they can apply after verification
          // Store the apply intent
          localStorage.setItem('pendingApply', from);
          router.push('/candidate/verification');
        } else {
          // Normal registration flow
          router.push('/candidate/verification');
        }
      } else {
        setErrors({ submit: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error: any) {
      // Check if this is still the current request
      if (submitRequestIdRef.current !== requestId) {
        return;
      }

      console.error('Registration error:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        setErrors({ submit: 'Request timed out. Please check your internet connection and try again.' });
      } else if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
        setErrors({ submit: 'Network error. Please check your internet connection and try again. If the problem persists, your registration may have been successful - please check your email.' });
      } else {
        setErrors({ submit: 'Registration failed. Please check your connection and try again. If you continue to see this error, your account may have been created - please try logging in or contact support.' });
      }
    } finally {
      // Only reset if this is still the current request
      if (submitRequestIdRef.current === requestId) {
        setIsLoading(false);
        setIsSubmitting(false);
        submitRequestIdRef.current = null;
      }
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
                Start Your Career Journey
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Join thousands of professionals who have found their dream jobs through our platform. 
                Get matched with top companies and accelerate your career growth.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">AI-powered job matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Free CV builder with professional templates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Direct access to top employers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 flex flex-col justify-center py-4 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <div className="w-10 h-10 bg-[#114373] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-base text-gray-600">
              Join thousands of candidates finding their dream jobs
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 sm:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Row 1 - First Name and Middle Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="group">
                <label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  First Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                      errors.firstName 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                    }`}
                    placeholder="Enter your first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Middle Name */}
              <div className="group">
                <label htmlFor="middleName" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Middle Name
                  <span className="ml-1 text-xs text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                      errors.middleName 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                    }`}
                    placeholder="Enter your middle name"
                  />
                </div>
                {errors.middleName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.middleName}
                  </p>
                )}
              </div>
            </div>

              {/* Row 2 - Surname and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Surname */}
              <div className="group">
                <label htmlFor="surname" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Surname *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                      errors.surname 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                    }`}
                    placeholder="Enter your surname"
                  />
                </div>
                {errors.surname && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.surname}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="group">
                <label htmlFor="gender" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Gender *
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                      errors.gender 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                    }`}
                  >
                    <option value="">Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3 - Email and Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="group">
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                      errors.email 
                        ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="group">
                <PhoneNumberSelector
                  countryCode={formData.countryCode}
                  phoneNumber={formData.phone}
                  onCountryCodeChange={(code) => setFormData(prev => ({ ...prev, countryCode: code }))}
                  onPhoneNumberChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                  label="Phone Number"
                  placeholder="123456789"
                  required={true}
                  error={errors.phone}
                />
              </div>
            </div>

            {/* Row 5 - Password Fields */}
            <div className="group">
              <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Lock className="w-4 h-4 mr-2 text-gray-400" />
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 text-sm pr-12 border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                    errors.password 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {formData.password && !errors.password && (
                  <CheckCircle className="absolute right-16 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.password && (
                <p className="mt-0.5 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Row 6 - Confirm Password Field */}
            <div className="group">
              <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                <Shield className="w-4 h-4 mr-2 text-gray-400" />
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-5 py-3.5 text-sm pr-12 border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
                    errors.confirmPassword 
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373]'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute right-16 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-0.5 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="group pt-2">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                      className="h-5 w-5 text-[#114373] focus:ring-[#114373] border-2 border-gray-300 rounded-xl transition-all duration-200 cursor-pointer"
                    />
                  </div>
                <label htmlFor="acceptTerms" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link href="/candidate-terms" target="_blank" className="text-[#114373] hover:text-[#0d3559] underline font-medium transition-colors">
                    Candidate Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-[#114373] hover:text-[#0d3559] underline font-medium transition-colors">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.acceptTerms}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-5 shadow-sm">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {errors.submit}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-[#114373] to-[#1e5a8a] hover:from-[#0d3559] hover:to-[#114373] focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Creating your account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>
          </div>

          {/* Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-600 font-outfit-medium">Already have an account?</span>
              </div>
            </div>
            <div className="mt-6">
              <a
                href="/candidate/login"
                className="w-full flex justify-center items-center gap-2 py-3.5 px-6 border-2 border-gray-200 rounded-2xl text-sm font-outfit-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <User className="w-5 h-5 text-gray-600" />
                Sign in to your account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateRegister() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
      </div>
    }>
      <CandidateRegisterContent />
    </Suspense>
  );
}