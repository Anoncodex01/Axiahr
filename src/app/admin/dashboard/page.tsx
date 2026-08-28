'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// AdminLayout is now provided by RoleBasedAdminLayout in the root layout
import {
  Users,
  Building2,
  FileText,
  Calendar,
  Award,
  Receipt,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  UserX,
  UserPlus,
  User,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Download,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  Zap,
  RefreshCw,
  Bell,
  Star,
  Briefcase,
  GraduationCap,
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Globe,
  BookOpen,
  Search,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Users as UsersIcon,
  Building as BuildingIcon,
  FileText as FileTextIcon,
  Award as AwardIcon,
  DollarSign as DollarSignIcon,
  Clock as ClockIcon,
  AlertTriangle,
  CheckSquare,
  Square,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Upload,
  Camera,
  Save,
  Eye as EyeIcon2,
  EyeOff as EyeOffIcon2,
  ArrowRight,
  ArrowLeft,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Bell as BellIcon,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon,
  Target as TargetIcon2,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon
} from 'lucide-react';

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactElement;
  color: string;
  link?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: {
    countryCode: string;
    number: string;
  };
  whatsapp?: {
    countryCode: string;
    number: string;
  };
  status: 'new' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected' | 'placed';
  appliedDate: string;
  lastActivity: string;
  skills: string[];
  experience: string;
  location: string;
  avatar?: string;
  nationality: string;
  currentCompany?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  education: Array<{
    degree: string;
    specialization: string;
    institute: string;
    yearOfPassing: string;
    isHighestQualification: boolean;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
}

interface Employer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending' | 'verified' | 'profile_pending';
  industry: string;
  location: string;
  website: string;
  contactPerson: string;
  totalJobs: number;
  activeJobs: number;
  totalPlacements: number;
  joinedDate: string;
  lastActivity: string;
  notes: string;
  profileStatus?: 'incomplete' | 'pending' | 'approved';
  companyDetails?: {
    businessType: string;
    employeeCount: string;
    annualRevenue: string;
    foundedYear: string;
  };
}

interface Placement {
  id: string;
  candidateName: string;
  companyName: string;
  position: string;
  placementDate: string;
  salary: string;
  commission: string;
  status: 'active' | 'completed' | 'terminated';
}

interface Invoice {
  id: string;
  clientName: string;
  amount: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  placementId: string;
}

interface RecentActivity {
  id: string;
  type: 'candidate_registered' | 'employer_registered' | 'job_posted' | 'job_submitted' | 'job_approved' | 'application_submitted' | 'application_received' | 'candidate_shortlisted' | 'interview_scheduled' | 'placement_made' | 'invoice_generated' | 'invoice_sent' | 'payment_completed' | 'profile_updated';
  title: string;
  description: string;
  timestamp: Date;
  relatedId: string;
  userType?: 'candidate' | 'employer' | 'admin';
}

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [recentEmployers, setRecentEmployers] = useState<Employer[]>([]);
  const [recentOffersAndPayments, setRecentOffersAndPayments] = useState<any[]>([]);
  const [currentPageActivities, setCurrentPageActivities] = useState(1);
  const [currentPageCandidates, setCurrentPageCandidates] = useState(1);
  const [currentPageEmployers, setCurrentPageEmployers] = useState(1);
  const itemsPerPage = 3;
  const [stats, setStats] = useState<DashboardStats[]>([
    {
      title: 'Total Candidates',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      link: '/admin/candidates'
    },
    {
      title: 'Total Employers',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-green-500',
      link: '/admin/employers'
    },
    {
      title: 'Pending Applications',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-purple-500',
      link: '/admin/application-management'
    },
    {
      title: 'Total Revenue',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-emerald-500',
      link: '/admin/billing-management'
    },
    {
      title: 'Pending Payments',
      value: '0',
      change: '0%',
      trend: 'up',
      icon: <Receipt className="w-6 h-6" />,
      color: 'bg-red-500',
      link: '/admin/payment-tracking'
    }
  ]);

  // Fetch dashboard statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard/stats');
        const data = await response.json();

        if (data.success && data.stats) {
          const formatNumber = (num: number) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
          };

          const formatCurrency = (amount: number) => {
            // Format as TZS with commas, no decimal places, no currency symbol
            const formatted = new Intl.NumberFormat('en-TZ', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(amount);
            return formatted;
          };

          setStats([
            {
              title: 'Total Candidates',
              value: formatNumber(data.stats.totalCandidates || 0),
              change: '0%',
              trend: 'up',
              icon: <Users className="w-6 h-6" />,
              color: 'bg-blue-500',
              link: '/admin/candidates'
            },
            {
              title: 'Total Employers',
              value: formatNumber(data.stats.totalEmployers || 0),
              change: '0%',
              trend: 'up',
              icon: <Building2 className="w-6 h-6" />,
              color: 'bg-green-500',
              link: '/admin/employers'
            },
            {
              title: 'Pending Applications',
              value: formatNumber(data.stats.pendingApplications || 0),
              change: '0%',
              trend: 'up',
              icon: <FileText className="w-6 h-6" />,
              color: 'bg-purple-500',
              link: '/admin/application-management'
            },
            {
              title: 'Total Revenue',
              value: formatCurrency(data.stats.totalRevenue || 0),
              change: '0%',
              trend: 'up',
              icon: <DollarSign className="w-6 h-6" />,
              color: 'bg-emerald-500',
              link: '/admin/billing-management'
            },
            {
              title: 'Pending Payments',
              value: formatNumber(data.stats.pendingPayments || 0),
              change: '0%',
              trend: 'up',
              icon: <Receipt className="w-6 h-6" />,
              color: 'bg-red-500',
              link: '/admin/payment-tracking'
            }
          ]);
        }

        // Set recent candidates and employers
        if (data.recentCandidates) {
          setRecentCandidates(data.recentCandidates);
        }
        if (data.recentEmployers) {
          setRecentEmployers(data.recentEmployers);
        }
        // Set recent activities
        if (data.recentActivity) {
          setRecentActivities(data.recentActivity.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })));
          // Reset pagination to first page when new activities are loaded
          setCurrentPageActivities(1);
        }
        // Reset pagination for candidates and employers when new data is loaded
        if (data.recentCandidates) {
          setCurrentPageCandidates(1);
        }
        if (data.recentEmployers) {
          setCurrentPageEmployers(1);
        }
        // Set recent offers and payments
        if (data.recentOffersAndPayments) {
          setRecentOffersAndPayments(data.recentOffersAndPayments);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Recent Placements - Will be populated from database
  const recentPlacements: Placement[] = [];

  // Pending Invoices - Will be populated from database
  const pendingInvoices: Invoice[] = [];

  // Recent Activities - Will be populated from database
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'placed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <UserPlus className="w-4 h-4" />;
      case 'shortlisted':
        return <UserCheck className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'selected':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <UserX className="w-4 h-4" />;
      case 'placed':
        return <Award className="w-4 h-4" />;
      default:
        return <UserPlus className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'candidate_registered':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'employer_registered':
        return <Building2 className="w-4 h-4 text-green-500" />;
      case 'job_submitted':
      case 'job_posted':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'job_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'application_submitted':
      case 'application_received':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'candidate_shortlisted':
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'placement_made':
        return <Award className="w-4 h-4 text-emerald-500" />;
      case 'invoice_generated':
      case 'invoice_sent':
        return <Receipt className="w-4 h-4 text-red-500" />;
      case 'payment_completed':
        return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'profile_updated':
        return <Edit className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-base sm:text-lg text-gray-600">Comprehensive overview of recruitment pipeline and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* Statistics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-shimmer"></div>
                  <div className="h-4 w-12 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded mb-1 animate-shimmer"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                <div className="w-12 h-1 bg-gray-200 rounded-full mt-2 animate-shimmer"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link || '#'}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <div className={`flex items-center text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
              </Link>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Activities & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                  <Link href="/admin/activities" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-xl">
                        <div className="w-10 h-10 bg-gray-200 rounded-xl animate-shimmer"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 w-3/4 bg-gray-200 rounded animate-shimmer"></div>
                          <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                          <div className="h-3 w-1/3 bg-gray-200 rounded animate-shimmer"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">No recent activities</p>
                  </div>
                ) : (
                  <>
                    {/* Paginated Activities */}
                    {(() => {
                      const totalPages = Math.ceil(recentActivities.length / itemsPerPage);
                      const startIndex = (currentPageActivities - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedActivities = recentActivities.slice(startIndex, endIndex);

                      return (
                        <>
                          <div className="space-y-4">
                            {paginatedActivities.map((activity, index) => (
                              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group">
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
                            <div className="mt-6 pt-6 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setCurrentPageActivities(prev => Math.max(1, prev - 1))}
                                    disabled={currentPageActivities === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                  </button>
                                  
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPageActivities(page)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                          currentPageActivities === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => setCurrentPageActivities(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPageActivities === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  </button>
                                </div>

                                <div className="text-sm text-gray-600">
                                  Showing {startIndex + 1}-{Math.min(endIndex, recentActivities.length)} of {recentActivities.length}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>


            {/* Complete Recruitment Pipeline Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recruitment Pipeline</h2>
                  <Link href="/admin/application-management" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {/* Pipeline Flow Visualization */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Applications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Shortlisted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Interviewed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Screened</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Hired</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 via-emerald-500 via-indigo-500 to-green-500 h-2 rounded-full"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Pending Review</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                    <p className="text-xs text-blue-700">0 today</p>
                    <Link href="/admin/application-management?status=pending" className="text-xs text-blue-700 hover:text-blue-900 font-medium">
                      Review Now →
                    </Link>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Shortlisted</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">0</p>
                    <p className="text-xs text-purple-700">0 today</p>
                    <Link href="/admin/application-management?status=shortlisted" className="text-xs text-purple-700 hover:text-purple-900 font-medium">
                      Schedule Interviews →
                    </Link>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">Interviewed</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">0</p>
                    <p className="text-xs text-orange-700">0 today</p>
                    <Link href="/admin/application-management?status=interviewed" className="text-xs text-orange-700 hover:text-orange-900 font-medium">
                      Complete Evaluations →
                    </Link>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">Screened</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">0</p>
                    <p className="text-xs text-emerald-700">0 today</p>
                    <Link href="/admin/application-management?status=screened" className="text-xs text-emerald-700 hover:text-emerald-900 font-medium">
                      Send to Employers →
                    </Link>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-800">Selected</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900">0</p>
                    <p className="text-xs text-indigo-700">0 today</p>
                    <Link href="/admin/application-management?status=selected" className="text-xs text-indigo-700 hover:text-indigo-900 font-medium">
                      Upload Offers →
                    </Link>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Hired</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">0</p>
                    <p className="text-xs text-green-700">0 today</p>
                    <Link href="/admin/application-management?status=hired" className="text-xs text-green-700 hover:text-green-900 font-medium">
                      View Placements →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Candidates */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Candidates</h2>
                  <Link href="/admin/candidates" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full animate-shimmer"></div>
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer"></div>
                      </div>
                    ))}
                  </div>
                ) : recentCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">No recent candidates</p>
                  </div>
                ) : (
                  <>
                    {/* Paginated Candidates */}
                    {(() => {
                      const totalPages = Math.ceil(recentCandidates.length / itemsPerPage);
                      const startIndex = (currentPageCandidates - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedCandidates = recentCandidates.slice(startIndex, endIndex);

                      return (
                        <>
                          <div className="space-y-4">
                            {paginatedCandidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        {candidate.avatar ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-200 relative">
                            <img 
                              src={candidate.avatar} 
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget;
                                const fallback = img.nextElementSibling as HTMLElement;
                                img.style.display = 'none';
                                if (fallback) {
                                  fallback.classList.remove('hidden');
                                }
                              }}
                            />
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center absolute inset-0 hidden">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                              {candidate.status}
                            </span>
                            {candidate.location && candidate.location !== 'N/A' && (
                              <span className="text-xs text-gray-500">{candidate.location}</span>
                            )}
                            {candidate.experience && candidate.experience !== 'N/A' && (
                              <span className="text-xs text-gray-500">• {candidate.experience}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Contact Buttons */}
                        <a
                          href={`mailto:${candidate.email}`}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        {candidate.phone && (
                          <a
                            href={`tel:${(candidate.phone.number || '').replace(/\D/g, '')}`}
                            className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/candidates/${candidate.id}`}
                          className="p-2 text-gray-500 hover:text-[#114373] rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setCurrentPageCandidates(prev => Math.max(1, prev - 1))}
                                    disabled={currentPageCandidates === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                  </button>
                                  
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPageCandidates(page)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                          currentPageCandidates === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => setCurrentPageCandidates(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPageCandidates === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  </button>
                                </div>

                                <div className="text-sm text-gray-600">
                                  Showing {startIndex + 1}-{Math.min(endIndex, recentCandidates.length)} of {recentCandidates.length}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Recent Employers */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Employers</h2>
                  <Link href="/admin/employers" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full animate-shimmer"></div>
                          <div className="space-y-2">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer"></div>
                      </div>
                    ))}
                  </div>
                ) : recentEmployers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm">No recent employers</p>
                  </div>
                ) : (
                  <>
                    {/* Paginated Employers */}
                    {(() => {
                      const totalPages = Math.ceil(recentEmployers.length / itemsPerPage);
                      const startIndex = (currentPageEmployers - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedEmployers = recentEmployers.slice(startIndex, endIndex);

                      return (
                        <>
                          <div className="space-y-4">
                            {paginatedEmployers.map((employer: any) => (
                    <div key={employer.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        {employer.logo ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-green-200 relative">
                            <img 
                              src={employer.logo} 
                              alt={employer.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget;
                                const fallback = img.nextElementSibling as HTMLElement;
                                img.style.display = 'none';
                                if (fallback) {
                                  fallback.classList.remove('hidden');
                                }
                              }}
                            />
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center absolute inset-0 hidden">
                              <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{employer.name}</h3>
                          <p className="text-sm text-gray-600">{employer.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              employer.status === 'active' ? 'bg-green-100 text-green-800' :
                              employer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {employer.status}
                            </span>
                            <span className="text-xs text-gray-500">{employer.industry}</span>
                            {employer.location && (
                              <span className="text-xs text-gray-500">• {employer.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${employer.email}`}
                          className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        {employer.phone && employer.phone !== 'N/A' && (
                          <a
                            href={`tel:${employer.phone.replace(/\D/g, '')}`}
                            className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/admin/employers/${employer.id}`}
                          className="p-2 text-gray-500 hover:text-[#114373] rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setCurrentPageEmployers(prev => Math.max(1, prev - 1))}
                                    disabled={currentPageEmployers === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                  </button>
                                  
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPageEmployers(page)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                          currentPageEmployers === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => setCurrentPageEmployers(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPageEmployers === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  </button>
                                </div>

                                <div className="text-sm text-gray-600">
                                  Showing {startIndex + 1}-{Math.min(endIndex, recentEmployers.length)} of {recentEmployers.length}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Recent Data */}
          <div className="space-y-6">

            {/* Offer Letters & Payment Tracking */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Offers & Payments</h2>
                  <Link href="/admin/billing-management" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                          <div className="h-6 w-24 bg-gray-200 rounded-full animate-shimmer"></div>
                        </div>
                        <div className="h-4 w-48 bg-gray-200 rounded mb-1 animate-shimmer"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-shimmer"></div>
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded animate-shimmer"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentOffersAndPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent offers or payments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOffersAndPayments.slice(0, 3).map((item) => {
                      const formatCurrency = (amount: number, currency: string = 'TZS') => {
                        const formatted = new Intl.NumberFormat('en-TZ', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(amount);
                        return `${currency} ${formatted}`;
                      };

                      const getDaysUntilExpiry = (expiryDate: string | Date | null) => {
                        if (!expiryDate) return null;
                        const expiry = new Date(expiryDate);
                        const now = new Date();
                        const diffTime = expiry.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays;
                      };

                      const getStatusInfo = () => {
                        if (!item.candidate_response || item.candidate_response === 'pending') {
                          const daysLeft = getDaysUntilExpiry(item.expiry_date);
                          return {
                            label: daysLeft !== null && daysLeft > 0 ? `Expires: ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Pending Response',
                            bgColor: 'bg-yellow-100',
                            textColor: 'text-yellow-800',
                            cardBg: 'bg-indigo-50',
                            cardBorder: 'border-indigo-200'
                          };
                        } else if (item.candidate_response === 'accepted') {
                          const paymentStatus = item.payment_status === 'completed' ? 'Paid' : 
                                             item.invoice_status === 'paid' ? 'Paid' : 'Payment Pending';
                          return {
                            label: paymentStatus,
                            bgColor: paymentStatus === 'Paid' ? 'bg-emerald-100' : 'bg-green-100',
                            textColor: paymentStatus === 'Paid' ? 'text-emerald-800' : 'text-green-800',
                            cardBg: 'bg-green-50',
                            cardBorder: 'border-green-200'
                          };
                        } else if (item.candidate_response === 'rejected') {
                          return {
                            label: 'Rejected',
                            bgColor: 'bg-red-100',
                            textColor: 'text-red-800',
                            cardBg: 'bg-red-50',
                            cardBorder: 'border-red-200'
                          };
                        }
                        return {
                          label: 'Unknown',
                          bgColor: 'bg-gray-100',
                          textColor: 'text-gray-800',
                          cardBg: 'bg-gray-50',
                          cardBorder: 'border-gray-200'
                        };
                      };

                      const statusInfo = getStatusInfo();

                      return (
                        <div key={item.id} className={`p-4 ${statusInfo.cardBg} rounded-xl border ${statusInfo.cardBorder}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{item.candidate_name || 'Unknown Candidate'}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{item.position_title || 'Position'}</p>
                          <p className="text-sm text-gray-600 mb-2">{item.company_name || 'Company'}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Offer: {formatCurrency(item.offer_amount || 0, item.currency || 'TZS')}</span>
                            {item.candidate_response === 'accepted' && item.payment_status !== 'completed' && item.invoice_status !== 'paid' && (
                              <span className="text-green-600 font-semibold">Payment Pending</span>
                            )}
                            {item.candidate_response === 'accepted' && (item.payment_status === 'completed' || item.invoice_status === 'paid') && (
                              <span className="text-emerald-600 font-semibold">Paid</span>
                            )}
                            {(!item.candidate_response || item.candidate_response === 'pending') && (
                              <span className="text-indigo-600 font-semibold">
                                {getDaysUntilExpiry(item.expiry_date) !== null && getDaysUntilExpiry(item.expiry_date)! > 0
                                  ? `Expires: ${getDaysUntilExpiry(item.expiry_date)} day${getDaysUntilExpiry(item.expiry_date)! !== 1 ? 's' : ''}`
                                  : 'Pending Response'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Placements */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Placements</h2>
                  <Link href="/admin/placements" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPlacements.map((placement) => (
                    <div key={placement.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{placement.candidateName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          placement.status === 'active' ? 'bg-green-100 text-green-800' :
                          placement.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {placement.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{placement.position}</p>
                      <p className="text-sm text-gray-600 mb-2">{placement.companyName}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Salary: {placement.salary}</span>
                        <span className="text-green-600 font-semibold">Commission: {placement.commission}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Invoices */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Pending Invoices</h2>
                  <Link href="/admin/billing-management" className="text-[#114373] hover:text-[#0d3559] text-sm font-semibold">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {pendingInvoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{invoice.clientName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-1">{invoice.amount}</p>
                      <p className="text-sm text-gray-600">Due: {formatDate(invoice.dueDate)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        {/* Resources & Hub Quick Access */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#114373] to-[#1a4d7a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Resources & Hub</h2>
                  <p className="text-sm text-white/90">Manage dashboard resources for candidates</p>
                </div>
              </div>
              <Link
                href="/admin/resources"
                className="px-4 py-2 bg-white text-[#114373] rounded-lg hover:bg-white/90 font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Manage Resources
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Total Resources</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">0</p>
                <Link href="/admin/resources" className="text-xs text-blue-700 hover:text-blue-900 font-medium mt-2 inline-block">
                  View All →
                </Link>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Active Resources</span>
                </div>
                <p className="text-2xl font-bold text-green-900">0</p>
                <Link href="/admin/resources?is_active=true" className="text-xs text-green-700 hover:text-green-900 font-medium mt-2 inline-block">
                  View Active →
                </Link>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Last Updated</span>
                </div>
                <p className="text-sm font-bold text-purple-900">Never</p>
                <Link href="/admin/resources" className="text-xs text-purple-700 hover:text-purple-900 font-medium mt-2 inline-block">
                  Manage →
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}
