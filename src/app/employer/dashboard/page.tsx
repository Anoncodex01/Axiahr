'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  Eye,
  Plus,
  ArrowRight,
  CheckSquare,
  XCircle,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Bell,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';
import LoadingState from '@/components/LoadingState';

interface DashboardActivity {
  id: string;
  type: 'job_submitted' | 'job_approved' | 'application_received' | 'candidate_shortlisted' | 'interview_scheduled' | 'placement_made' | 'invoice_sent';
  title: string;
  description: string;
  timestamp: Date;
  relatedId: string;
}

interface EmployerDashboard {
  totalJobRequirements: number;
  pendingApprovals: number;
  activeJobPostings: number;
  totalApplications: number;
  shortlistedCandidates: number;
  interviewsScheduled: number;
  placements: number;
  outstandingInvoices: number;
  totalRevenue: number;
  recentActivity: DashboardActivity[];
}

export default function EmployerDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<EmployerDashboard>({
    totalJobRequirements: 0,
    pendingApprovals: 0,
    activeJobPostings: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    interviewsScheduled: 0,
    placements: 0,
    outstandingInvoices: 0,
    totalRevenue: 0,
    recentActivity: []
  });


  const [accountStatus, setAccountStatus] = useState<'pending' | 'approved' | 'suspended'>('approved');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [hasSelectedService, setHasSelectedService] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [checkingAgreement, setCheckingAgreement] = useState(true);
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'incomplete' | 'rejected' | 'loading'>('loading');
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [employerInfo, setEmployerInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Check if employer has a signed agreement
  const checkAgreementStatus = async () => {
    try {
      setCheckingAgreement(true);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) return;

      // Check for signed/approved agreements
      const response = await fetch('/api/employers/agreements', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.agreements) {
          const signedAgreement = data.agreements.find((agreement: any) => 
            agreement.status === 'signed' || agreement.status === 'approved'
          );
          setAgreementSigned(!!signedAgreement);
          if (signedAgreement) {
            setHasSelectedService(true);
            setSelectedServiceType(signedAgreement.serviceType);
          }
        }
      }

      // Also check selected service status
      const serviceResponse = await fetch('/api/employers/selected-service', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        if (serviceData.success && serviceData.hasSelectedService) {
          setHasSelectedService(true);
          setSelectedServiceType(serviceData.selectedService?.serviceType || null);
        }
      }
    } catch (error) {
      console.error('Error checking agreement status:', error);
    } finally {
      setCheckingAgreement(false);
    }
  };

  // Handle Complete Profile button click - check if agreement needs to be signed first
  const handleCompleteProfileClick = (e: React.MouseEvent) => {
    // If user has selected a service but hasn't signed agreement, redirect to agreements
    if (hasSelectedService && !agreementSigned && selectedServiceType) {
      e.preventDefault();
      router.push(`/employer/agreements?serviceType=${selectedServiceType}`);
    }
    // Otherwise, let the link proceed to company-profile as normal
  };

  // No redirect - always show dashboard with message if profile is incomplete

  // Load employer data from localStorage and fetch latest profile status from API
  useEffect(() => {
    const loadProfileStatus = async () => {
      try {
        // First, load from localStorage for quick display
        const employerData = localStorage.getItem('employerData');
        const profileComplete = localStorage.getItem('employerProfileComplete');
        
        if (employerData) {
          try {
            const parsed = JSON.parse(employerData);
            
            // Set last login
            if (parsed.lastLogin) {
              const loginDate = new Date(parsed.lastLogin);
              const now = new Date();
              const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
              
              if (diffInHours < 1) {
                setLastLogin('Just now');
              } else if (diffInHours < 24) {
                setLastLogin(`${diffInHours} hours ago`);
              } else {
                const diffInDays = Math.floor(diffInHours / 24);
                setLastLogin(`${diffInDays} days ago`);
              }
            }
            
            // Set initial status from localStorage
            if (parsed.profileStatus === 'pending' || profileComplete === 'pending') {
              setProfileStatus('pending');
            } else if (parsed.profileStatus === 'approved' || profileComplete === 'approved') {
              setProfileStatus('approved');
            } else if (parsed.profileStatus === 'rejected' || profileComplete === 'rejected') {
              setProfileStatus('rejected');
            } else {
              if (profileComplete === 'pending') {
                setProfileStatus('pending');
              } else if (profileComplete === 'rejected') {
                setProfileStatus('rejected');
              } else if (profileComplete === 'incomplete') {
                setProfileStatus('incomplete');
              } else if (!parsed.profileStatus && !profileComplete) {
                setProfileStatus('incomplete');
              } else {
                setProfileStatus('pending');
              }
            }
          } catch (e) {
            console.error('Error parsing employerData:', e);
            setProfileStatus('incomplete');
          }
        } else if (profileComplete === 'pending') {
          setProfileStatus('pending');
        } else if (profileComplete === 'approved') {
          setProfileStatus('approved');
        } else if (profileComplete === 'rejected') {
          setProfileStatus('rejected');
        } else {
          setProfileStatus('incomplete');
        }

        // Fetch latest profile status from API to ensure it's up-to-date
        const response = await fetch('/api/employers/profile', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const latestStatus = data.data.profileStatus || 'incomplete';
            
            // Update profile status with latest from database (handle all statuses including rejected)
            if (latestStatus === 'pending' || latestStatus === 'approved' || latestStatus === 'incomplete' || latestStatus === 'rejected') {
              setProfileStatus(latestStatus);
            } else {
              setProfileStatus('incomplete');
            }
            
            // Update localStorage with latest status
            if (employerData) {
              try {
                const parsed = JSON.parse(employerData);
                parsed.profileStatus = latestStatus;
                localStorage.setItem('employerData', JSON.stringify(parsed));
              } catch (e) {
                console.error('Error updating employerData:', e);
              }
            }
            
            // Update profileComplete localStorage
            localStorage.setItem('employerProfileComplete', latestStatus);
          }
        }
      } catch (error) {
        console.error('Error fetching profile status:', error);
        // Keep the status from localStorage if API call fails
      }
    };

    loadProfileStatus();
    loadEmployerInfo();
    loadDashboardStats();
    checkAgreementStatus();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoadingDashboard(true);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      
      if (!authToken) {
        setLoadingDashboard(false);
        return;
      }

      const response = await fetch('/api/employers/dashboard', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDashboard(prev => ({
            ...prev,
            totalJobRequirements: data.data.totalJobRequirements || 0,
            pendingApprovals: data.data.pendingApprovals || 0,
            activeJobPostings: data.data.activeJobPostings || 0,
            totalApplications: data.data.totalApplications || 0,
            shortlistedCandidates: data.data.shortlistedCandidates || 0,
            interviewsScheduled: data.data.interviewsScheduled || 0,
            placements: data.data.placements || 0,
            outstandingInvoices: data.data.outstandingInvoices || 0,
            totalRevenue: data.data.totalRevenue || 0,
            recentActivity: (data.data.recentActivity || []).map((activity: any) => ({
              ...activity,
              timestamp: new Date(activity.timestamp)
            }))
          }));
          // Reset to first page when new activities are loaded
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadEmployerInfo = async () => {
    try {
      setLoadingInfo(true);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      
      if (!authToken) {
        setLoadingInfo(false);
        return;
      }

      const response = await fetch('/api/employers/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEmployerInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading employer info:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `TZS ${formatted}`;
  };

  const stats = [
    {
      title: "Job Requirements",
      value: dashboard.totalJobRequirements,
      icon: <FileText className="w-6 h-6" />,
      color: "bg-blue-500",
      link: "/employer/job-postings"
    },
    {
      title: "Pending Approvals",
      value: dashboard.pendingApprovals,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-yellow-500",
      link: "/employer/job-postings"
    },
    {
      title: "Total Applications",
      value: dashboard.totalApplications,
      icon: <Users className="w-6 h-6" />,
      color: "bg-purple-500",
      link: "/employer/applications"
    },
    {
      title: "Outstanding Invoices",
      value: dashboard.outstandingInvoices,
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-red-500",
      link: "/employer/invoices"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(dashboard.totalRevenue),
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-emerald-500",
      link: "/employer/invoices"
    }
  ];

  const getActivityIcon = (type: DashboardActivity['type']) => {
    switch (type) {
      case 'job_submitted':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'job_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'application_received':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'candidate_shortlisted':
        return <UserCheck className="w-5 h-5 text-indigo-500" />;
      case 'interview_scheduled':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'placement_made':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'invoice_sent':
        return <DollarSign className="w-5 h-5 text-red-500" />;
      default:
        return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };


  // Show approval pending message if account is not approved
  if (accountStatus === 'pending') {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
            <p className="text-gray-600 mb-6">
              Your employer account is currently under review. You'll receive an email notification once your account is approved.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Next Steps:</strong> Sign the agreement to complete your account activation.
              </p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  // Show suspended message if account is suspended
  if (accountStatus === 'suspended') {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Suspended</h2>
            <p className="text-gray-600 mb-6">
              Your employer account has been suspended. Please contact our support team for assistance.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Contact:</strong> support@axiahr.com or call +255 123 456 789
              </p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  // Show loading state while checking profile status
  if (profileStatus === 'loading') {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingState message="Loading dashboard..." size="lg" />
        </div>
      </EmployerLayout>
    );
  }

  // Show pending approval message if profile is pending
  if (profileStatus === 'pending') {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Awaiting Approval</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your company profile has been submitted and is currently under review.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-base text-blue-900 mb-2">
                <strong>What's Happening:</strong>
              </p>
              <p className="text-sm text-blue-800 mb-4">
                Our verification team is reviewing your company profile and documents. This process typically takes 1-2 business days.
              </p>
              <p className="text-sm text-blue-800">
                <strong>You will receive an email notification</strong> once your profile is approved and you can start using all features.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Most features are temporarily unavailable until your profile is approved. You can still view your dashboard.
              </p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  // Show rejected message if profile is rejected
  if (profileStatus === 'rejected') {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Profile Rejected</h2>
            <p className="text-lg text-gray-600 mb-6">
              Your company profile has been rejected. Please review and update your information.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-base text-red-900 mb-2">
                <strong>What to do next:</strong>
              </p>
              <p className="text-sm text-red-800 mb-4">
                Please review your company profile and make the necessary corrections. You can update your profile and resubmit for verification.
              </p>
              <p className="text-sm text-red-800">
                <strong>Contact support</strong> if you have any questions about the rejection.
              </p>
            </div>
            <Link
              href="/employer/company-profile"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Update Company Profile
            </Link>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div>
        {/* Incomplete Profile Message */}
        {profileStatus === 'incomplete' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Complete Your Company Information
                  </h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    To get verified and start using all features, please complete your company profile information.
                  </p>
                  <Link
                    href="/employer/company-profile"
                    onClick={handleCompleteProfileClick}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Complete Company Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agreement Required Message - Show if service selected but agreement not signed */}
        {hasSelectedService && !agreementSigned && !checkingAgreement && profileStatus !== 'incomplete' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    Complete Your Agreement
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    You have selected a recruitment service. Please complete and sign the agreement to start using our services.
                  </p>
                  <Link
                    href={`/employer/agreements?serviceType=${selectedServiceType || 'end-to-end'}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Complete Agreement
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loadingDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-shimmer"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded mb-1 animate-shimmer"></div>
                      <div className="w-12 h-1 bg-gray-200 rounded-full animate-shimmer"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {stats.map((stat, index) => (
                <Link
                  key={index}
                  href={stat.link}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                      <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                    <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Recent Activity */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="space-y-8">
            {/* Recent Activity */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-600 mt-1">Latest updates from your recruitment pipeline</p>
                </div>
                <div className="p-6">
                  {loadingDashboard ? (
                    <div className="space-y-6">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-shimmer"></div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="h-5 w-48 bg-gray-200 rounded animate-shimmer"></div>
                            <div className="h-4 w-64 bg-gray-200 rounded animate-shimmer"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dashboard.recentActivity.length > 0 ? (
                    <>
                      {/* Paginated Activities */}
                      {(() => {
                        const totalPages = Math.ceil(dashboard.recentActivity.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedActivities = dashboard.recentActivity.slice(startIndex, endIndex);

                        return (
                          <>
                            <div className="space-y-6">
                              {paginatedActivities.map((activity, index) => (
                                <div key={activity.id} className="flex items-start space-x-4 group">
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                      {getActivityIcon(activity.type)}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{activity.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">{formatTimeAgo(activity.timestamp)}</p>
                                  </div>
                                  {index < paginatedActivities.length - 1 && (
                                    <div className="absolute left-8 top-12 w-0.5 h-8 bg-gradient-to-b from-blue-200 to-transparent"></div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                      disabled={currentPage === 1}
                                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                          key={page}
                                          onClick={() => setCurrentPage(page)}
                                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            currentPage === page
                                              ? 'bg-blue-600 text-white'
                                              : 'text-gray-600 hover:bg-gray-100'
                                          }`}
                                        >
                                          {page}
                                        </button>
                                      ))}
                                    </div>

                                    <button
                                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                      disabled={currentPage === totalPages}
                                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                  </div>

                                  <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1}-{Math.min(endIndex, dashboard.recentActivity.length)} of {dashboard.recentActivity.length}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No recent activity</p>
                      <p className="text-sm text-gray-500 mt-2">Your recent recruitment activities will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </EmployerLayout>
  );

  // Fallback return for other conditions
  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    </EmployerLayout>
  );
}