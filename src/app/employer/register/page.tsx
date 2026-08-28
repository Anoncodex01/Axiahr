'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2, AlertCircle, CheckCircle, ArrowRight, Search, X, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';

export default function EmployerRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+255', // Default to Tanzania
    companyName: '',
    industry: '',
    jobTitle: '',
    password: '',
    confirmPassword: ''
  });
  const [industries, setIndustries] = useState<string[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRequestIdRef = useRef<string | null>(null);

  // Load industries on component mount
  React.useEffect(() => {
    const loadIndustries = async () => {
      try {
        setIsLoadingIndustries(true);
        const response = await fetch('/api/industries-designations');
        if (response.ok) {
          const data = await response.json();
          const industriesList: string[] = data.data
            .replace(/\r\n/g, '\n') // Handle Windows line endings
            .split('\n')
            .slice(1) // Skip header row
            .map((line: string) => {
              const [industry] = line.split(',');
              return industry?.trim().replace(/"/g, '') || '';
            })
            .filter((industry: string) => Boolean(industry));
          
          // Get unique industries and sort them
          const uniqueIndustries = [...new Set(industriesList)].sort();
          setIndustries(uniqueIndustries);
        } else {
          console.error('Failed to fetch industries');
        }
      } catch (error) {
        console.error('Error loading industries:', error);
      } finally {
        setIsLoadingIndustries(false);
      }
    };

    loadIndustries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(event.target as Node)) {
        setIsIndustryDropdownOpen(false);
        setIndustrySearchTerm('');
      }
    };

    if (isIndustryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isIndustryDropdownOpen]);

  // Filter industries based on search term or input value
  const searchValue = industrySearchTerm || (isIndustryDropdownOpen ? formData.industry : '');
  const filteredIndustries = searchValue
    ? industries.filter(industry =>
        industry.toLowerCase().includes(searchValue.toLowerCase())
      )
    : industries;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (!formData.email.includes('@') || formData.email.includes('yahoo.com') || formData.email.includes('hotmail.com')) {
      newErrors.email = 'Please use a business email address or Gmail';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 6) {
      newErrors.phone = 'Please enter a valid phone number (at least 6 digits)';
    } else if (!/^\d{6,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must contain only digits (6-15 digits)';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

    // Generate unique request ID for this submission
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    submitRequestIdRef.current = requestId;
    setIsSubmitting(true);
    setIsLoading(true);
    setErrors({});

    try {
      const requestBody = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() ? `${formData.countryCode}${formData.phone.trim()}` : '',
        companyName: formData.companyName.trim(),
        industry: formData.industry.trim(),
        jobTitle: formData.jobTitle.trim(),
        password: formData.password,
        requestId // Include request ID to help with deduplication on server
      };

      // Use retry logic for network resilience
      const response = await retryRequest('/api/employers/register', {
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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Handle unverified account case
          if (data.unverified) {
            setErrors({ 
              email: data.error || 'An account with this email exists but is not verified. Please check your email or contact support.'
            });
          } else {
            setErrors({ email: data.error || 'An account with this email already exists' });
          }
        } else if (response.status === 400) {
          setErrors({ general: data.error || 'Please check your input and try again' });
        } else {
          setErrors({ general: data.error || 'Registration failed. Please try again.' });
        }
        return;
      }

      if (data.success) {
        // Store email for verification page
        localStorage.setItem('employerEmail', formData.email.trim().toLowerCase());
        localStorage.setItem('employerRegistration', 'pending');
        
        // Redirect to email verification page
        router.push('/employer/verify-email');
      } else {
        setErrors({ general: data.error || 'Registration failed. Please try again.' });
      }
    } catch (error: any) {
      // Check if this is still the current request
      if (submitRequestIdRef.current !== requestId) {
        return;
      }

      console.error('Registration error:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        setErrors({ general: 'Request timed out. Please check your internet connection and try again.' });
      } else if (error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('network')) {
        setErrors({ general: 'Network error. Please check your internet connection and try again. If the problem persists, your registration may have been successful - please check your email.' });
      } else {
        setErrors({ general: 'Registration failed. Please check your connection and try again. If you continue to see this error, your account may have been created - please try logging in or contact support.' });
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
                Grow Your Team with Confidence
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Connect with top talent and build your dream team. Access our network of qualified candidates and streamline your hiring process.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Access to 300,000+ qualified candidates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">AI-powered candidate matching</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90">Streamlined hiring workflow</span>
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
            <Link href="/" className="flex items-center">
              <img src="/logo11.png" alt="Axia HR Advisory" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Employer Account
            </h2>
            <p className="text-base text-gray-600">
              Join thousands of companies hiring through Axia HR
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-6 sm:p-8">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-outfit-medium text-red-700">{errors.general}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.firstName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your first name"
                    />
                    {!errors.firstName && formData.firstName && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.lastName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your last name"
                    />
                    {!errors.lastName && formData.lastName && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email and Phone Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Business Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="yourname@company.com"
                    />
                    {!errors.email && formData.email && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Please use your business email address or Gmail</p>
                </div>

                <div>
                  <PhoneNumberSelector
                    countryCode={formData.countryCode}
                    phoneNumber={formData.phone}
                    onCountryCodeChange={(code) => setFormData(prev => ({ ...prev, countryCode: code }))}
                    onPhoneNumberChange={(phone) => {
                      setFormData(prev => ({ ...prev, phone }));
                      // Clear error when user starts typing
                      if (errors.phone) {
                        setErrors(prev => ({
                          ...prev,
                          phone: ''
                        }));
                      }
                    }}
                    label="Phone Number *"
                    placeholder="123456789"
                    required={true}
                    error={errors.phone}
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                  Job Title *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                      errors.jobTitle ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="e.g., HR Manager, Recruiter"
                  />
                  {!errors.jobTitle && formData.jobTitle && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                  )}
                </div>
                {errors.jobTitle && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.jobTitle}
                  </p>
                )}
              </div>

              {/* Company Name and Industry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.companyName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Enter your company name"
                    />
                    {!errors.companyName && formData.companyName && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4" />
                    )}
                  </div>
                  {errors.companyName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Industry *
                  </label>
                  <div className="relative" ref={industryDropdownRef}>
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <input
                      type="text"
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, industry: value }));
                        setIndustrySearchTerm(value);
                        setIsIndustryDropdownOpen(true);
                        // Clear error when typing
                        if (errors.industry) {
                          setErrors(prev => ({
                            ...prev,
                            industry: ''
                          }));
                        }
                      }}
                      onFocus={() => {
                        if (!isLoadingIndustries) {
                          setIsIndustryDropdownOpen(true);
                          setIndustrySearchTerm(formData.industry);
                        }
                      }}
                      onBlur={(e) => {
                        // Close dropdown after a short delay to allow clicking on items
                        setTimeout(() => {
                          setIsIndustryDropdownOpen(false);
                        }, 200);
                      }}
                      placeholder="Type to search industries..."
                      className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all bg-white ${
                        errors.industry ? 'border-red-300' : 'border-gray-200'
                      } ${isLoadingIndustries ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isLoadingIndustries}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoadingIndustries) {
                          setIsIndustryDropdownOpen(!isIndustryDropdownOpen);
                          setIndustrySearchTerm(formData.industry);
                        }
                      }}
                      disabled={isLoadingIndustries}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {!errors.industry && formData.industry && (
                      <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 text-green-500 w-4 h-4 pointer-events-none" />
                    )}

                    {/* Dropdown Menu */}
                    {isIndustryDropdownOpen && !isLoadingIndustries && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
                        {/* Industry List */}
                        <div className="max-h-64 overflow-y-auto">
                          {filteredIndustries.length > 0 ? (
                            <>
                              {filteredIndustries.map((industry) => (
                                <button
                                  key={industry}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur
                                    setFormData(prev => ({ ...prev, industry }));
                                    setIsIndustryDropdownOpen(false);
                                    setIndustrySearchTerm('');
                                    // Clear error when selecting
                                    if (errors.industry) {
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.industry;
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#114373]/5 transition-colors ${
                                    formData.industry === industry ? 'bg-[#114373]/10 font-medium text-[#114373]' : 'text-gray-700'
                                  }`}
                                >
                                  {industry}
                                </button>
                              ))}
                              {/* Show "Add new industry" option if search term doesn't match exactly */}
                              {searchValue && 
                               searchValue.trim() &&
                               !filteredIndustries.some(ind => ind.toLowerCase() === searchValue.toLowerCase().trim()) && (
                                <div className="border-t border-gray-100">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent input blur
                                      const newIndustry = searchValue.trim();
                                      setFormData(prev => ({ ...prev, industry: newIndustry }));
                                      setIsIndustryDropdownOpen(false);
                                      setIndustrySearchTerm('');
                                      // Clear error when selecting
                                      if (errors.industry) {
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors.industry;
                                          return newErrors;
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-[#114373] hover:bg-[#114373]/5 transition-colors font-medium flex items-center gap-2"
                                  >
                                    <span>+</span>
                                    <span>Add "{searchValue.trim()}" as new industry</span>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-4">
                              {searchValue ? (
                                <>
                                  <div className="px-4 py-2 text-center text-sm text-gray-500 mb-2">
                                    No industries found matching "{searchValue}"
                                  </div>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent input blur
                                      const newIndustry = searchValue.trim();
                                      setFormData(prev => ({ ...prev, industry: newIndustry }));
                                      setIsIndustryDropdownOpen(false);
                                      setIndustrySearchTerm('');
                                      // Clear error when selecting
                                      if (errors.industry) {
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors.industry;
                                          return newErrors;
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-[#114373] hover:bg-[#114373]/5 transition-colors font-medium flex items-center gap-2 border-t border-gray-100 pt-2"
                                  >
                                    <span>+</span>
                                    <span>Add "{searchValue.trim()}" as new industry</span>
                                  </button>
                                </>
                              ) : (
                                <div className="px-4 py-8 text-center text-sm text-gray-500">
                                  Start typing to search industries...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.industry && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.industry}
                    </p>
                  )}
                  {isLoadingIndustries && (
                    <p className="mt-1 text-xs text-gray-500">Loading industries...</p>
                  )}
                </div>
              </div>

              {/* Password and Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.password ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-outfit-medium text-gray-700 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373]/20 focus:border-[#114373] transition-all ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#114373] to-[#0d3559] text-white py-3 px-6 rounded-xl text-base font-outfit-semibold hover:from-[#0d3559] hover:to-[#114373] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Employer Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>

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
                <Link
                  href="/employer/login"
                  className="w-full flex justify-center items-center gap-2 py-3 px-6 border-2 border-gray-200 rounded-xl text-sm font-outfit-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
