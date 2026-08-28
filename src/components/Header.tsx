"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Menu, X, User, LogOut, UserCircle, Briefcase, FileText, Star, Award } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [servicesDropdown, setServicesDropdown] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);

  // Refs for dropdown containers
  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const candidateUser = localStorage.getItem('candidateUser');
      const candidateDataStr = localStorage.getItem('candidateData');
      
      if (token && (candidateUser || candidateDataStr)) {
        setIsLoggedIn(true);
        try {
          if (candidateUser) {
            setCandidateData(JSON.parse(candidateUser));
          } else if (candidateDataStr) {
            setCandidateData(JSON.parse(candidateDataStr));
          }
        } catch (e) {
          console.error('Error parsing candidate data:', e);
        }
      } else {
        setIsLoggedIn(false);
        setCandidateData(null);
      }
    };

    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case localStorage is updated directly
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname]); // Re-check when route changes

  // Handle scroll to change header style
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        setServicesDropdown(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setCompanyDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
    };

    if (servicesDropdown || companyDropdown || profileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [servicesDropdown, companyDropdown, profileDropdown]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileServicesOpen(false);
    setMobileCompanyOpen(false);
  };

  const handleAuthClick = (type: 'login' | 'register') => {
    setMobileMenuOpen(false);
    router.push(`/auth?type=${type}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('candidateUser');
    localStorage.removeItem('candidateData');
    localStorage.removeItem('profileCompletionPercent');
    setIsLoggedIn(false);
    setCandidateData(null);
    setProfileDropdown(false);
    router.push('/');
  };

  const getCandidateName = () => {
    if (!candidateData) return 'Profile';
    if (candidateData.firstName && candidateData.surname) {
      return `${candidateData.firstName} ${candidateData.surname}`;
    }
    if (candidateData.first_name && candidateData.surname) {
      return `${candidateData.first_name} ${candidateData.surname}`;
    }
    return candidateData.email?.split('@')[0] || 'Profile';
  };

  // Determine header style based on scroll
  // Glassmorphism effect - glass-like appearance with backdrop blur
  const headerBg = isScrolled 
    ? 'bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/20' 
    : 'bg-white/60 backdrop-blur-xl border-b border-white/10';
  const textColor = 'text-gray-900';
  const hoverColor = 'hover:text-[#114373]';
  const borderColor = 'border-white/30';
  const buttonBg = 'bg-white/20 backdrop-blur-sm border border-white/40 text-gray-900 hover:bg-white/40 hover:text-[#114373]';
  const registerButton = 'border-[#114373]/50 text-[#114373] hover:bg-[#114373]/10 hover:border-[#114373]';
  const separatorColor = 'bg-gray-300/50';

  return (
    <div className={`relative z-50 transition-all duration-300 ${headerBg}`} style={{ position: 'relative' }}>
      <header className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
              <img 
                src="/logo11.png" 
                alt="Axia HR Logo" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <Link 
                href="/" 
                className={`${buttonBg} border ${borderColor} transition-colors font-lufga-medium text-sm px-4 py-2 rounded-lg`}
              >
                Home
              </Link>
              
              {/* Services Dropdown */}
              <div className="relative" ref={servicesDropdownRef}>
                <button
                  onClick={() => {
                    setServicesDropdown(!servicesDropdown);
                    setCompanyDropdown(false);
                  }}
                  className={`flex items-center gap-1 ${textColor} ${hoverColor} transition-colors font-lufga-medium text-sm`}
                >
                  Services
                  <ChevronDown className={`w-3 h-3 transition-transform ${servicesDropdown ? 'rotate-180' : ''}`} />
                </button>
                {servicesDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-[700px] bg-white rounded-lg shadow-xl border border-gray-200 py-4 z-50 max-h-[600px] overflow-y-auto">
                    {/* All Solutions - Full Width */}
                    <Link 
                      href="/solutions"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-b border-gray-100 mb-2"
                      onClick={() => setServicesDropdown(false)}
                    >
                      <div className="font-medium">All Solutions</div>
                      <div className="text-sm text-gray-500">Complete HR services overview</div>
                    </Link>
                    
                    {/* Services in 2 Columns */}
                    <div className="grid grid-cols-2 gap-0">
                      <Link 
                        href="/services/recruitment-retention"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                        onClick={() => setServicesDropdown(false)}
                      >
                        <div className="font-medium">Employee Recruitment, Selection & Retention</div>
                        <div className="text-sm text-gray-500">Connect with top talent</div>
                      </Link>
                      <Link 
                        href="/services/hr-advisory"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setServicesDropdown(false)}
                      >
                        <div className="font-medium">HR Advisory & Strategy</div>
                        <div className="text-sm text-gray-500">Expert guidance & optimization</div>
                      </Link>
                      <Link 
                        href="/services/organizational-design"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                        onClick={() => setServicesDropdown(false)}
                      >
                        <div className="font-medium">Organizational Structuring & Restructuring</div>
                        <div className="text-sm text-gray-500">Design & realign teams</div>
                    </Link>
                    <Link 
                        href="/services/job-analysis"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setServicesDropdown(false)}
                    >
                        <div className="font-medium">Job Description, Evaluation & Salary Survey</div>
                        <div className="text-sm text-gray-500">Ensure clarity & fairness</div>
                      </Link>
                      <Link 
                        href="/services/training-development"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                        onClick={() => setServicesDropdown(false)}
                      >
                        <div className="font-medium">Training & Development</div>
                        <div className="text-sm text-gray-500">Upskill employees</div>
                    </Link>
                    <Link 
                      href="/services/performance-management"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setServicesDropdown(false)}
                    >
                      <div className="font-medium">Performance Management</div>
                        <div className="text-sm text-gray-500">Align goals with objectives</div>
                      </Link>
                      <Link 
                        href="/services/hr-audits"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                        onClick={() => setServicesDropdown(false)}
                      >
                        <div className="font-medium">HR Audits</div>
                        <div className="text-sm text-gray-500">Identify gaps & ensure compliance</div>
                    </Link>
                    <Link 
                        href="/services/policies-procedures"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setServicesDropdown(false)}
                    >
                        <div className="font-medium">HR Policies & Procedures</div>
                        <div className="text-sm text-gray-500">Promote consistency & governance</div>
                    </Link>
                    <Link 
                        href="/services/visa-permits"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                      onClick={() => setServicesDropdown(false)}
                    >
                        <div className="font-medium">Visas & Work Permits</div>
                        <div className="text-sm text-gray-500">Immigration & compliance</div>
                    </Link>
                    <Link 
                        href="/services/due-diligence"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setServicesDropdown(false)}
                    >
                        <div className="font-medium">Due Diligence</div>
                        <div className="text-sm text-gray-500">Evaluate human capital</div>
                    </Link>
                    <Link 
                        href="/services/reference-checks"
                        className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-r border-gray-100"
                      onClick={() => setServicesDropdown(false)}
                    >
                        <div className="font-medium">Independent Reference Checks</div>
                        <div className="text-sm text-gray-500">Validate candidate backgrounds</div>
                    </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link 
                href="/job-search" 
                className={`${textColor} ${hoverColor} transition-colors font-lufga-medium text-sm`}
              >
                Find Jobs
              </Link>
              
              {/* Company Dropdown */}
              <div className="relative" ref={companyDropdownRef}>
                <button
                  onClick={() => {
                    setCompanyDropdown(!companyDropdown);
                    setServicesDropdown(false);
                  }}
                  className={`flex items-center gap-1 ${textColor} ${hoverColor} transition-colors font-lufga-medium text-sm`}
                >
                  Company
                  <ChevronDown className={`w-3 h-3 transition-transform ${companyDropdown ? 'rotate-180' : ''}`} />
                </button>
                {companyDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <Link 
                      href="/about"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors border-b border-gray-100"
                      onClick={() => setCompanyDropdown(false)}
                    >
                      <div className="font-medium">About Us</div>
                      <div className="text-sm text-gray-500">Our story & mission</div>
                    </Link>
                    <Link 
                      href="/vision-mission"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setCompanyDropdown(false)}
                    >
                      <div className="font-medium">Vision, Mission & Values</div>
                      <div className="text-sm text-gray-500">Our guiding principles</div>
                    </Link>
                    <Link 
                      href="/culture"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setCompanyDropdown(false)}
                    >
                      <div className="font-medium">Our Culture</div>
                      <div className="text-sm text-gray-500">Innovation, teamwork & growth</div>
                    </Link>
                    <Link 
                      href="/solutions"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setCompanyDropdown(false)}
                    >
                      <div className="font-medium">Our Services</div>
                      <div className="text-sm text-gray-500">Comprehensive HR solutions</div>
                    </Link>
                    <Link 
                      href="/contact"
                      className="block px-4 py-3 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                      onClick={() => setCompanyDropdown(false)}
                    >
                      <div className="font-medium">Contact</div>
                      <div className="text-sm text-gray-500">Get in touch</div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Desktop Login/Register or Profile */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              /* Profile Dropdown */
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => {
                    setProfileDropdown(!profileDropdown);
                    setServicesDropdown(false);
                    setCompanyDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#114373] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {candidateData?.firstName?.[0] || candidateData?.first_name?.[0] || candidateData?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className={`${textColor} font-lufga-medium text-sm hidden lg:block`}>
                    {getCandidateName()}
                  </span>
                  <ChevronDown className={`w-4 h-4 ${textColor} transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
                </button>
                {profileDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{getCandidateName()}</p>
                      <p className="text-xs text-gray-500 truncate">{candidateData?.email || ''}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/candidate/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <Link
                        href="/candidate/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link
                        href="/candidate/applications"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">My Applications</span>
                      </Link>
                      <Link
                        href="/candidate/saved-jobs"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <Star className="w-4 h-4" />
                        <span className="text-sm">Saved Jobs</span>
                      </Link>
                      <Link
                        href="/candidate/offers"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-[#114373]/5 hover:text-[#114373] transition-colors"
                        onClick={() => setProfileDropdown(false)}
                      >
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Offer Letters</span>
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Login Button */}
                <button
                  onClick={() => handleAuthClick('login')}
                  className={`${textColor} ${hoverColor} transition-colors font-lufga-medium text-sm`}
                >
                  Login
                </button>
                
                {/* Separator */}
                <div className={`w-px h-4 ${separatorColor}`}></div>
                
                {/* Register Button */}
                <button
                  onClick={() => handleAuthClick('register')}
                  className={`border ${registerButton} px-4 py-2 rounded-lg transition-colors font-lufga-medium text-sm`}
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileMenuOpen(prev => !prev);
            }}
            className={`md:hidden p-2 ${textColor} ${hoverColor} transition-colors relative`}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9998]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={closeMobileMenu}
          />
          {/* Menu Panel */}
          <div 
            className="fixed inset-0 h-dvh w-screen bg-[#114373] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              zIndex: 9999,
              display: 'block',
              visibility: 'visible'
            }}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header - White background */}
              <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#114373] rounded"></div>
                  <h2 className="text-lg font-semibold text-[#114373]">Menu</h2>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 border-2 border-orange-500 rounded text-gray-500 hover:text-gray-700 hover:border-orange-600 transition-colors"
                  aria-label="Close menu"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation - Dark blue background */}
              <div className="flex-1 overflow-y-auto py-4 bg-[#114373]">
                <nav className="space-y-1 px-4">
                  {/* Home */}
                  <Link
                    href="/"
                    className="block py-3 text-gray-300 hover:text-white transition-colors font-medium border-b border-white/10"
                    onClick={closeMobileMenu}
                  >
                    Home
                  </Link>

                  {/* Services */}
                  <div className="border-b border-white/10 pb-2">
                    <button
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      className="flex items-center justify-between w-full py-3 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      Services
                      <ChevronDown className={`w-4 h-4 transition-transform text-gray-300 ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileServicesOpen && (
                      <div className="pl-4 space-y-1 mt-2">
                        <Link
                          href="/solutions"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          All Solutions
                        </Link>
                        <Link
                          href="/services/recruitment-retention"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Employee Recruitment, Selection & Retention
                        </Link>
                        <Link
                          href="/services/hr-advisory"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          HR Advisory & Strategy
                        </Link>
                        <Link
                          href="/services/organizational-design"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Organizational Structuring & Restructuring
                        </Link>
                        <Link
                          href="/services/job-analysis"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Job Description, Evaluation & Salary Survey
                        </Link>
                        <Link
                          href="/services/training-development"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Training & Development
                        </Link>
                        <Link
                          href="/services/performance-management"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Performance Management
                        </Link>
                        <Link
                          href="/services/hr-audits"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          HR Audits
                        </Link>
                        <Link
                          href="/services/policies-procedures"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          HR Policies & Procedures
                        </Link>
                        <Link
                          href="/services/visa-permits"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Visas & Work Permits
                        </Link>
                        <Link
                          href="/services/due-diligence"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Due Diligence
                        </Link>
                        <Link
                          href="/services/reference-checks"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Independent Reference Checks
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Find Jobs */}
                  <Link
                    href="/job-search"
                    className="block py-3 text-gray-300 hover:text-white transition-colors font-medium border-b border-white/10"
                    onClick={closeMobileMenu}
                  >
                    Find Jobs
                  </Link>

                  {/* Company */}
                  <div className="border-b border-white/10 pb-2">
                    <button
                      onClick={() => setMobileCompanyOpen(!mobileCompanyOpen)}
                      className="flex items-center justify-between w-full py-3 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      Company
                      <ChevronDown className={`w-4 h-4 transition-transform text-gray-300 ${mobileCompanyOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileCompanyOpen && (
                      <div className="pl-4 space-y-1 mt-2">
                        <Link
                          href="/about"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          About Us
                        </Link>
                        <Link
                          href="/vision-mission"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Vision, Mission & Values
                        </Link>
                        <Link
                          href="/culture"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Our Culture
                        </Link>
                        <Link
                          href="/solutions"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Our Services
                        </Link>
                        <Link
                          href="/contact"
                          className="block py-2 text-gray-400 hover:text-white transition-colors text-sm"
                          onClick={closeMobileMenu}
                        >
                          Contact
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              {/* Mobile Authentication */}
              <div className="border-t border-white/20 p-4 bg-[#114373]">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg mb-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                        {candidateData?.firstName?.[0] || candidateData?.first_name?.[0] || candidateData?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{getCandidateName()}</p>
                        <p className="text-white/70 text-xs truncate">{candidateData?.email || ''}</p>
                      </div>
                    </div>
                    <Link
                      href="/candidate/dashboard"
                      className="block w-full bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm text-center"
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/candidate/profile"
                      className="block w-full bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm text-center"
                      onClick={closeMobileMenu}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="w-full bg-red-500/20 text-white px-4 py-3 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm text-center border border-red-500/30"
                      type="button"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAuthClick('register')}
                      className="flex-1 bg-[#6db99f] text-white px-4 py-3 rounded-lg border border-[#6db99f] hover:bg-[#5aa88a] transition-colors font-medium text-sm text-center flex items-center justify-center gap-2"
                      type="button"
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Register</span>
                    </button>
                    <button
                      onClick={() => handleAuthClick('login')}
                      className="flex-1 bg-white text-[#114373] px-4 py-3 rounded-lg border border-[#114373] hover:bg-gray-50 transition-colors font-medium text-sm text-center"
                      type="button"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
