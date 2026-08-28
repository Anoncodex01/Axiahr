'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Building2,
  Briefcase,
  Award,
  BookOpen,
  Eye,
  Download,
  Plus,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Star,
  ChevronRight,
  UserCircle
} from 'lucide-react';

interface CandidateLayoutProps {
  children: React.ReactNode;
}

export default function CandidateLayout({ children }: CandidateLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [completionPercent, setCompletionPercent] = useState<number>(0);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check if current page is public (doesn't require authentication)
  const isPublicPage = false; // No public pages in candidate portal anymore

  const fetchCandidateProfile = async (token: string) => {
    try {
      // Get candidate ID from token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const candidateId = payload?.sub || payload?.candidateId || payload?.id;
        
        if (candidateId) {
          const response = await fetch(`/api/candidates/profile?candidateId=${candidateId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // Handle both response structures: data.profile or data.data.profile
            const profile = data.data?.profile || data.profile;
            if (profile) {
              console.log('Profile loaded:', { photo_url: profile.photo_url, profile_picture: profile.profile_picture });
              setCandidateProfile(profile);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
    }
  };

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    // For public pages, still try to load user data if available, but don't require login
    if (isPublicPage) {
      let token = localStorage.getItem('authToken');
      if (!token) {
        const cookieToken = getCookie('authToken');
        if (cookieToken) {
          token = cookieToken;
          try {
            localStorage.setItem('authToken', cookieToken);
          } catch {}
        }
      }

      // If token exists, validate and load user data
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload?.exp && payload.exp >= Math.floor(Date.now() / 1000)) {
              const storedCandidateData = localStorage.getItem('candidateData');
              const candidateUser = localStorage.getItem('candidateUser');

              if (storedCandidateData) {
                setCandidateData(JSON.parse(storedCandidateData));
              } else if (candidateUser) {
                const userData = JSON.parse(candidateUser);
                setCandidateData({
                  first_name: userData.firstName,
                  surname: userData.surname,
                  email: userData.email,
                  phone: userData.phone
                });
              }

              const cp = Number(localStorage.getItem('profileCompletionPercent') || '0');
              if (!Number.isNaN(cp)) setCompletionPercent(cp);
            }
          }
        } catch (_) {
          // Invalid token, but don't redirect on public page
        }
      }
      setAuthChecked(true);
      return;
    }

    // For protected pages, require authentication
    let token = localStorage.getItem('authToken');
    if (!token) {
      const cookieToken = getCookie('authToken');
      if (cookieToken) {
        token = cookieToken;
        try {
          localStorage.setItem('authToken', cookieToken);
        } catch {}
      }
    }

    if (!token) {
      router.replace('/candidate/login');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload?.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          handleLogout();
          return;
        }
      }
    } catch (_) {
      handleLogout();
      return;
    }

    const storedCandidateData = localStorage.getItem('candidateData');
    const candidateUser = localStorage.getItem('candidateUser');

    if (storedCandidateData) {
      setCandidateData(JSON.parse(storedCandidateData));
    } else if (candidateUser) {
      const userData = JSON.parse(candidateUser);
      setCandidateData({
        first_name: userData.firstName,
        surname: userData.surname,
        email: userData.email,
        phone: userData.phone
      });
    }

    const cp = Number(localStorage.getItem('profileCompletionPercent') || '0');
    if (!Number.isNaN(cp)) setCompletionPercent(cp);
    
    // Fetch candidate profile with photo
    if (token) {
      fetchCandidateProfile(token);
    }
    
    setAuthChecked(true);
  }, [isPublicPage, router]);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/candidate/dashboard',
      icon: <User className="w-5 h-5" />,
      current: pathname === '/candidate/dashboard'
    },
    {
      name: 'Profile',
      href: '/candidate/profile',
      icon: <UserCircle className="w-5 h-5" />,
      current: pathname === '/candidate/profile' || pathname.startsWith('/candidate/profile/')
    },
    {
      name: 'CV Builder',
      href: '/candidate/cv-builder',
      icon: <BookOpen className="w-5 h-5" />,
      current: pathname === '/candidate/cv-builder'
    },
    {
      name: 'Career Counselling',
      href: '/candidate/career-counselling',
      icon: <BookOpen className="w-5 h-5" />,
      current: pathname === '/candidate/career-counselling'
    },
    {
      name: 'Job search',
      href: '/job-search',
      icon: <Search className="w-5 h-5" />,
      current: pathname === '/job-search'
    },
    {
      name: 'Saved Jobs',
      href: '/candidate/saved-jobs',
      icon: <Star className="w-5 h-5" />,
      current: pathname === '/candidate/saved-jobs'
    },
    {
      name: 'My Application',
      href: '/candidate/applications',
      icon: <FileText className="w-5 h-5" />,
      current: pathname === '/candidate/applications'
    },
    {
      name: 'Offer Letters',
      href: '/candidate/offers',
      icon: <Award className="w-5 h-5" />,
      current: pathname === '/candidate/offers' || pathname.startsWith('/candidate/offers/')
    }
  ];

  const GATE_THRESHOLD = 80; // Changed to 80% as per requirement
  const isGated = (name: string) => {
    // Gate these until profile completion threshold reached
    const gated = ['Job search', 'My Application', 'Al CV builder'];
    return completionPercent < GATE_THRESHOLD && gated.includes(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('candidateData');
    localStorage.removeItem('candidateUser');
    // Clear auth cookie for middleware
    document.cookie = 'authToken=; Max-Age=0; Path=/; SameSite=Lax';
    router.replace('/candidate/login');
  };

  // For public pages, show content immediately even if auth not checked
  if (!authChecked && !isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-[#114373] to-[#1a4d7a]">
            <h1 className="text-lg font-bold text-white">Candidate Portal</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-[#114373] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-2">
            <Link
              href="/job-search"
              className="flex items-center gap-3 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Search className="w-5 h-5" />
              Find Jobs
            </Link>
          </div>

          {/* User section with photo */}
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              {(candidateProfile?.photo_url || candidateProfile?.profile_picture) ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={candidateProfile.photo_url || candidateProfile.profile_picture}
                    alt={`${candidateData?.first_name || 'Candidate'} ${candidateData?.surname || ''}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-12 h-12 bg-gradient-to-br from-[#114373] to-[#1a4d7a] rounded-full items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-semibold text-base">
                      {candidateData?.first_name?.charAt(0) || 'U'}
                      {candidateData?.surname?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-[#114373] to-[#1a4d7a] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-semibold text-base">
                    {candidateData?.first_name?.charAt(0) || 'U'}
                    {candidateData?.surname?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {candidateData?.first_name || 'User'} {candidateData?.surname || 'Name'}
                </p>
                <p className="text-xs text-gray-600 truncate">{candidateData?.email || 'user@email.com'}</p>
                {candidateProfile?.resume_headline && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{candidateProfile.resume_headline}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-64">
        {/* Mobile menu button - only on mobile */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/255622551047"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group hover:scale-110 cursor-pointer"
        title="Contact us on WhatsApp"
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        <Image
          src="/whatsapp.png"
          alt="WhatsApp"
          width={64}
          height={64}
          className="object-contain rounded-full"
          unoptimized
        />
      </a>
    </div>
  );
}
