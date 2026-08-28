'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CandidateLayout from '@/components/CandidateLayout';
import { 
  FileText, 
  CheckCircle, 
  Calendar, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  DollarSign,
  Award,
  Download,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Building2,
  Sparkles
} from 'lucide-react';

interface OfferLetter {
  id: string;
  applicationId: string;
  jobTitle: string;
  jobLocation: string;
  employmentType: string;
  offerFileUrl: string;
  offerAmount: string | null;
  startDate: string | null;
  positionTitle: string;
  status: 'sent' | 'accepted' | 'rejected' | 'expired';
  candidateResponse?: 'accepted' | 'rejected';
  rejectionReason?: string;
  responseDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  appliedDate: string | null;
  status: string;
  location: string;
  salary: string;
  employmentType: string;
}

interface DashboardStats {
  totalApplications: number;
  shortlisted: number;
  selected: number;
  interviews: number;
  applicationsChange: number;
  shortlistedChange: number;
}

export default function CandidateDashboard() {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    shortlisted: 0,
    selected: 0,
    interviews: 0,
    applicationsChange: 0,
    shortlistedChange: 0
  });
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [currentResourceSlide, setCurrentResourceSlide] = useState(0);
  const [resources, setResources] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
    fetchOfferLetters();
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/candidates/resources');
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        setResources(result.data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  // Auto-rotate resource carousel
  useEffect(() => {
    if (resources.length > 1) {
      const interval = setInterval(() => {
        setCurrentResourceSlide((prev) => (prev + 1) % resources.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [resources.length]);

  const loadDashboardData = async () => {
      try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
      
      if (!token) {
        router.push('/candidate/login');
        return;
      }

      const response = await fetch('/api/candidates/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        setCandidateData(data.data.candidate);
        setStats(data.data.statistics);
        setApplications(data.data.recentApplications || []);
      } else {
        console.error('Failed to load dashboard data:', data.error);
        }
      } catch (error) {
      console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

  const fetchOfferLetters = async () => {
    try {
      setLoadingOffers(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
      if (!token) {
        return;
      }

      const response = await fetch('/api/candidates/offer-letters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.offerLetters) {
        setOfferLetters(data.offerLetters);
      }
    } catch (error) {
      console.error('Error fetching offer letters:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications.toString(),
      change: stats.applicationsChange >= 0 ? `+${stats.applicationsChange}` : stats.applicationsChange.toString(),
      icon: <FileText className="w-6 h-6" />,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: stats.applicationsChange >= 0 ? 'up' : 'down'
    },
    {
      title: 'Shortlisted',
      value: stats.shortlisted.toString(),
      change: stats.shortlistedChange >= 0 ? `+${stats.shortlistedChange}` : stats.shortlistedChange.toString(),
      icon: <CheckCircle className="w-6 h-6" />,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: stats.shortlistedChange >= 0 ? 'up' : 'down'
    },
    {
      title: 'Selected',
      value: stats.selected.toString(),
      change: '+0',
      icon: <Award className="w-6 h-6" />,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      trend: 'up'
    },
    {
      title: 'Interviews',
      value: stats.interviews.toString(),
      change: '+0',
      icon: <Calendar className="w-6 h-6" />,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: 'up'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interviewed':
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'selected':
      case 'screened':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
      case 'pending':
        return <FileText className="w-4 h-4" />;
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      case 'interviewed':
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'selected':
      case 'screened':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <CandidateLayout>
        <div className="w-full space-y-6">
          {/* Welcome Header Shimmer */}
          <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <div className="h-8 w-64 bg-white/20 rounded-lg mb-3 animate-shimmer"></div>
              <div className="h-6 w-96 bg-white/15 rounded-lg animate-shimmer"></div>
            </div>
          </div>

          {/* Stats Grid Shimmer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-shimmer"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions & Resources Shimmer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Shimmer */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-shimmer"></div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div className="h-3 w-20 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources and Hub Shimmer */}
            <div className="bg-gradient-to-br from-[#114373] to-[#1a4d7a] rounded-2xl shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="h-6 w-40 bg-white/20 rounded-lg mb-3 animate-shimmer"></div>
                <div className="h-4 w-full bg-white/15 rounded-lg mb-4 animate-shimmer"></div>
                <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                  <div className="w-full h-48 bg-white/10 animate-shimmer"></div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="w-2 h-2 bg-white/40 rounded-full animate-shimmer"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications Shimmer */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Offer Letters Shimmer */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-56 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-28 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="w-full space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {candidateData?.firstName || candidateData?.first_name || 'Candidate'}! 👋
              </h1>
              <p className="text-white/90 text-lg">Track your applications and manage your career journey</p>
            </div>
            <button
              onClick={() => {
                loadDashboardData();
                fetchOfferLetters();
              }}
              disabled={isLoading || loadingOffers}
              className="hidden md:flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(isLoading || loadingOffers) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <div key={index} className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Info Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#114373]" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/job-search"
                className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Browse Jobs</span>
                </div>
                <p className="text-xs text-gray-600">Find new opportunities</p>
              </Link>
              <Link
                href="/candidate/profile"
                className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all border border-green-200 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Update Profile</span>
                </div>
                <p className="text-xs text-gray-600">Complete your profile</p>
              </Link>
              <Link
                href="/candidate/applications"
                className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">My Applications</span>
                </div>
                <p className="text-xs text-gray-600">Track all applications</p>
              </Link>
              <Link
                href="/candidate/cv-builder"
                className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all border border-orange-200 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">CV Builder</span>
                </div>
                <p className="text-xs text-gray-600">Build your resume</p>
              </Link>
            </div>
          </div>

          {/* Resources and Hub */}
          <div className="bg-gradient-to-br from-[#114373] to-[#1a4d7a] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Resources and Hub
              </h3>
              <p className="text-white/90 mb-4 text-sm">
                Access helpful resources, guides, and tools to enhance your career journey and connect with top employers.
              </p>
              
              {/* Resource Content Carousel */}
              <div className="relative">
                {resources.length > 0 ? (
                  <>
                    <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                      <div className="relative w-full h-48">
                        {resources[currentResourceSlide] && (
                          <>
                            {resources[currentResourceSlide].image_url ? (
                              <Image
                                src={resources[currentResourceSlide].image_url}
                                alt={resources[currentResourceSlide].title}
                                fill
                                className="object-cover transition-opacity duration-500"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#114373] to-[#1a4d7a]"></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#114373]/90 via-[#114373]/50 to-transparent flex flex-col justify-end p-4">
                              <div className="transition-opacity duration-500">
                                <h4 className="text-base font-semibold mb-1">{resources[currentResourceSlide].title}</h4>
                                <p className="text-xs text-white/90">
                                  {resources[currentResourceSlide].description}
                                </p>
                                {resources[currentResourceSlide].link_url && (
                                  <a
                                    href={resources[currentResourceSlide].link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-xs font-medium text-white underline hover:text-white/80"
                                  >
                                    {resources[currentResourceSlide].link_text || 'Learn More'} →
                                  </a>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Dots Navigation */}
                    {resources.length > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {resources.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentResourceSlide(index)}
                            className={`transition-all duration-300 rounded-full ${
                              currentResourceSlide === index
                                ? 'w-8 h-2 bg-white'
                                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                    <div className="relative w-full h-48 bg-gradient-to-br from-[#114373] to-[#1a4d7a] flex items-center justify-center">
                      <div className="text-center p-4">
                        <h4 className="text-base font-semibold mb-1 text-white">Resources and Hub</h4>
                        <p className="text-xs text-white/90">
                          Access helpful resources, guides, and tools to enhance your career journey and connect with top employers.
                        </p>
                </div>
                </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Offer Letters Section */}
        {offerLetters.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#114373]/10 rounded-lg">
                  <Award className="w-6 h-6 text-[#114373]" />
                  </div>
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900">Offer Letters</h3>
                    <p className="text-sm text-gray-600">{offerLetters.length} active offer{offerLetters.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Link 
                  href="/candidate/offers" 
                  className="text-[#114373] hover:text-[#0d3559] text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {offerLetters.slice(0, 3).map((offer) => (
                <div key={offer.id} className="p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#114373] transition-colors">
                          {offer.positionTitle || offer.jobTitle}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getOfferStatusColor(offer.status)}`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{offer.jobLocation}</span>
                        </div>
                        {offer.offerAmount && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{offer.offerAmount}</span>
                          </div>
                        )}
                        {offer.startDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Start: {formatDate(offer.startDate)}</span>
                          </div>
                        )}
                        {offer.expiryDate && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Deadline: {formatDate(offer.expiryDate)}</span>
                          </div>
                        )}
                      </div>
                      {offer.candidateResponse && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm">
                            {offer.candidateResponse === 'accepted' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={offer.candidateResponse === 'accepted' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              You {offer.candidateResponse} this offer {offer.responseDate ? `on ${formatDate(offer.responseDate)}` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {offer.offerFileUrl && (
                      <a
                        href={offer.offerFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                          className="p-2.5 text-[#114373] hover:bg-[#114373]/10 rounded-lg transition-colors"
                        title="Download Offer Letter"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      )}
                      <Link
                        href="/candidate/offers"
                        className="p-2.5 text-gray-400 hover:text-[#114373] hover:bg-[#114373]/10 rounded-lg transition-colors"
                        title="View All Offers"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                  <p className="text-sm text-gray-600">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link 
                href="/candidate/applications" 
                className="text-[#114373] hover:text-[#0d3559] text-sm font-medium flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {applications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h4>
                <p className="text-gray-600 mb-6">Start your job search journey by applying to positions that match your skills.</p>
                <Link 
                  href="/job-search" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-medium shadow-lg hover:shadow-xl"
                >
                  Browse Jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 group-hover:text-[#114373] transition-colors">
                          {application.jobTitle}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-[#114373] font-medium mb-3">{application.company}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{application.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>{application.salary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>Applied {formatDate(application.appliedDate)}</span>
                      </div>
                      </div>
                    </div>
                    <Link
                      href={`/candidate/applications/${application.id}`}
                      className="p-2.5 text-gray-400 hover:text-[#114373] hover:bg-[#114373]/10 rounded-lg transition-colors ml-4"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
