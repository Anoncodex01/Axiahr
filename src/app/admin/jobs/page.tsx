'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingState from '@/components/LoadingState';
// AdminLayout is now provided by RoleBasedAdminLayout in the root layout
import {
  Briefcase,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Download,
  Upload,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  Award,
  MapPin,
  GraduationCap,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Target,
  Zap,
  RefreshCw,
  Bell,
  Settings,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileText,
  DollarSign,
  Shield,
  MessageSquare,
  Globe,
  BookOpen,
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
  ArrowRight,
  ArrowLeft,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Bell as BellIcon,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon,
  Target as TargetIcon2,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon,
  User,
  CheckSquare as CheckSquareIcon,
  XCircle as XCircleIcon,
  ThumbsUp,
  ThumbsDown,
  Send,
  Save,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  region: string;
  country: string;
  type: string;
  status: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  experience: string;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string | null;
  deadline: string | null;
  applicationsCount: number;
  viewsCount: number;
  shortlistedCount: number;
  interviewedCount: number;
  hiredCount: number;
  priority: string;
  featured: boolean;
  aiEnhanced: boolean;
  adminNotes: string;
  location: string;
}

export default function JobsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);

  // Fetch jobs from database
  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, [statusFilter, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/jobs?status=${statusFilter === 'all' ? '' : statusFilter}&search=${searchTerm}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/employers?status=active&profileStatus=approved');
      const data = await response.json();
      if (data.success && data.employers) {
        setCompanies(data.employers);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'internship':
        return 'bg-yellow-100 text-yellow-800';
      case 'remote':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: Job['salary'] | null | undefined) => {
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    const min = salary.min.toLocaleString();
    const max = salary.max.toLocaleString();
    return `${salary.currency || 'TZS'} ${min} - ${max}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(j => j.id));
    }
  };

  const handleStatusUpdate = (jobId: string, newStatus: string) => {
    // In real app, this would make an API call
    console.log(`Updating job ${jobId} to status ${newStatus}`);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.companyName && job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.region && job.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.country && job.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.skills && job.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    const matchesCompany = companyFilter === 'all' || job.companyId === companyFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCompany;
  });

  const stats = [
    { title: 'Total Jobs', value: jobs.length, color: 'bg-blue-500' },
    { title: 'Published', value: jobs.filter(j => j.status === 'published').length, color: 'bg-green-500' },
    { title: 'Draft', value: jobs.filter(j => j.status === 'draft').length, color: 'bg-yellow-500' },
    { title: 'Closed', value: jobs.filter(j => j.status === 'closed').length, color: 'bg-red-500' },
    { title: 'Featured', value: jobs.filter(j => j.featured).length, color: 'bg-purple-500' }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading jobs..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
            <p className="text-lg text-gray-600">Manage and track all job postings and applications</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/job-posting"
              className="inline-flex items-center px-4 py-2 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </Link>
            <button 
              onClick={fetchJobs}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg`}>
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Jobs</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, company, location, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
                <option value="filled">Filled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
                <option value="project_based">Project-based</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName || company.name || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">All Jobs ({filteredJobs.length})</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {selectedJobs.length === jobs.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedJobs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedJobs.length} selected</span>
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                      Bulk Actions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedJobs.length === jobs.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Briefcase className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No jobs found</p>
                        <p className="text-gray-400 text-sm mt-2">
                          {searchTerm ? 'Try adjusting your search criteria' : 'No jobs in the database yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.id)}
                        onChange={() => handleSelectJob(job.id)}
                        className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                          <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{job.title || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            {job.region && job.country ? `${job.region}, ${job.country}` : (job.region || job.country || job.location || 'N/A')}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {job.featured && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </span>
                            )}
                            {job.aiEnhanced && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Enhanced
                              </span>
                            )}
                            {job.type === 'remote' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{job.companyName || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                        {job.type ? job.type.replace('_', ' ').replace('-', ' ') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSalary(job.salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-600 font-semibold">{job.applicationsCount || 0}</span>
                        {job.viewsCount > 0 && (
                          <>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{job.viewsCount} views</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/job-posting/${job.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                          title="View Job"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <div className="relative">
                          <button className="p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {/* Dropdown menu would go here */}
                        </div>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">1</span> to <span className="font-semibold">{filteredJobs.length}</span> of{' '}
            <span className="font-semibold">{jobs.length}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="px-3 py-2 bg-[#114373] text-white rounded-lg font-semibold">1</button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">2</button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">3</button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
  );
}
