'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  FileText,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Bell,
  Shield,
  DollarSign,
  AlertCircle,
  Search,
  Mail,
  UserCheck
} from 'lucide-react';

interface EmployerLayoutProps {
  children: ReactNode;
}

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'incomplete'>('incomplete');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [employerEmail, setEmployerEmail] = useState<string>('');
  const [employerName, setEmployerName] = useState<string>('');
  const pathname = usePathname();

  // Load employer data and profile status on component mount
  React.useEffect(() => {
    const profileComplete = localStorage.getItem('employerProfileComplete');
    const employerData = localStorage.getItem('employerData');
    
    // Check both localStorage flags and employerData
    let status: 'pending' | 'approved' | 'incomplete' = 'incomplete';
    
    if (employerData) {
      try {
        const parsed = JSON.parse(employerData);
        
        // Set profile status
        if (parsed.profileStatus === 'pending' || parsed.profileStatus === 'approved') {
          status = parsed.profileStatus;
        }
        
        // Set company name and email
        if (parsed.companyName) {
          setCompanyName(parsed.companyName);
        }
        if (parsed.email) {
          setEmployerEmail(parsed.email);
        }
        if (parsed.firstName && parsed.lastName) {
          setEmployerName(`${parsed.firstName} ${parsed.lastName}`);
        } else if (parsed.contactPerson) {
          setEmployerName(parsed.contactPerson);
        }
      } catch (e) {
        console.error('Error parsing employerData:', e);
      }
    }
    
    if (profileComplete === 'pending' || status === 'pending') {
      setProfileStatus('pending');
    } else if (profileComplete === 'approved' || status === 'approved') {
      setProfileStatus('approved');
    } else {
      // Set to approved for full access (default)
      setProfileStatus('approved');
    }
    
    // Load company logo and additional data from profile API
    const loadCompanyData = async () => {
      try {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) return;
        
        const response = await fetch('/api/employers/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.companyLogo) {
              setCompanyLogo(data.data.companyLogo);
            }
            if (data.data.companyName && !companyName) {
              setCompanyName(data.data.companyName);
            }
            // Also check for email in profile data
            if (data.data.email && !employerEmail) {
              setEmployerEmail(data.data.email);
            }
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      }
    };
    
    loadCompanyData();
  }, [companyName, employerEmail]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/employer/dashboard',
      icon: <Building2 className="w-5 h-5" />,
      current: pathname === '/employer/dashboard'
    },
    // Applications removed - end-to-end service means Axia handles all applications
    // Only admin can view applications
    {
      name: 'Recruitment Services',
      href: '/employer/recruitment-services',
      icon: <Users className="w-5 h-5" />,
      current: pathname === '/employer/recruitment-services'
    },
    {
      name: 'Agreements',
      href: '/employer/agreements',
      icon: <FileText className="w-5 h-5" />,
      current: pathname === '/employer/agreements'
    },
    {
      name: 'Job Postings',
      href: '/employer/job-posting',
      icon: <FileText className="w-5 h-5" />,
      current: pathname.includes('/employer/job')
    },
    // Hidden: Candidate Search
    // {
    //   name: 'Candidate Search',
    //   href: '/employer/candidate-search',
    //   icon: <Search className="w-5 h-5" />,
    //   current: pathname === '/employer/candidate-search'
    // },
    // Hidden: Saved Searches
    // {
    //   name: 'Saved Searches',
    //   href: '/employer/saved-searches',
    //   icon: <Search className="w-5 h-5" />,
    //   current: pathname === '/employer/saved-searches'
    // },
    {
      name: 'Interviews',
      href: '/employer/interviews',
      icon: <Calendar className="w-5 h-5" />,
      current: pathname === '/employer/interviews'
    },
    {
      name: 'Screened Candidates',
      href: '/employer/screened-candidates',
      icon: <UserCheck className="w-5 h-5" />,
      current: pathname === '/employer/screened-candidates' || pathname.startsWith('/employer/screened-candidates')
    },
    // Hidden: Placements
    // {
    //   name: 'Placements',
    //   href: '/employer/placements',
    //   icon: <CheckCircle className="w-5 h-5" />,
    //   current: pathname === '/employer/placements'
    // },
    // Hidden: Reference Check
    // {
    //   name: 'Reference Check',
    //   href: '/employer/reference-check',
    //   icon: <Shield className="w-5 h-5" />,
    //   current: pathname === '/employer/reference-check'
    // },
    {
      name: 'Invoices',
      href: '/employer/invoices',
      icon: <DollarSign className="w-5 h-5" />,
      current: pathname === '/employer/invoices'
    },
    // Hidden: Analytics
    // {
    //   name: 'Analytics',
    //   href: '/employer/analytics',
    //   icon: <TrendingUp className="w-5 h-5" />,
    //   current: pathname === '/employer/analytics'
    // },
    // Hidden: Settings
    // {
    //   name: 'Settings',
    //   href: '/employer/settings',
    //   icon: <Settings className="w-5 h-5" />,
    //   current: pathname === '/employer/settings'
    // }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('employerAuthToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    localStorage.removeItem('employerData');
    localStorage.removeItem('employerProfileComplete');
    localStorage.removeItem('employerEmailVerified');
    window.location.href = '/employer/login';
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName || 'Company Logo'} 
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-[#114373] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1 
                  className="text-base font-bold text-gray-900 truncate"
                  title={companyName || 'Employer Portal'}
                >
                  {companyName || 'Employer Portal'}
                </h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              // Disable all navigation except Dashboard and Company Profile when pending
              const isDisabled = profileStatus === 'pending' && 
                item.href !== '/employer/dashboard' && 
                item.href !== '/employer/company-profile';
              
              return (
                <Link
                  key={item.name}
                  href={isDisabled ? '#' : item.href}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDisabled
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : item.current
                      ? 'bg-[#114373] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isDisabled ? 'Please wait for profile approval' : ''}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName || 'Company Logo'} 
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0 overflow-hidden">
                <p 
                  className="text-sm font-medium text-gray-900 truncate"
                  title={employerName || 'Employer'}
                >
                  {employerName || 'Employer'}
                </p>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p 
                    className="text-xs text-gray-500 truncate"
                    title={employerEmail || 'email@example.com'}
                  >
                    {employerEmail || 'email@example.com'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile menu button */}
        <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page content - scrollable */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
