'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Sparkles,
  X,
  Send,
  Play,
  Pause,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  MessageSquare as MessageSquareIcon,
  User,
  Building,
  AlertTriangle
} from 'lucide-react';

interface PendingJob {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  employerName: string;
  employerEmail: string;
  employerPhone: string;
  region: string;
  country: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  experience: string;
  education: string;
  submittedDate: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  priority: 'low' | 'medium' | 'high';
  featured: boolean;
  remote: boolean;
  adminNotes: string;
  reviewNotes: string;
  reviewerId: string;
  reviewerName: string;
  reviewedDate: string;
  revisionCount: number;
  lastRevisionDate: string;
}

export default function JobReviews() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch pending jobs from API
  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      setLoading(true);
      // Fetch jobs with pending, draft, and rejected status for review
      const response = await fetch('/api/admin/jobs?status=pending');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobs) {
          // Map API jobs to PendingJob format
          const mappedJobs: PendingJob[] = data.jobs.map((job: any) => ({
            id: job.id.toString(),
            title: job.title,
            companyName: job.companyName || '',
            companyId: job.companyId || '',
            employerName: job.companyContactPerson || job.companyName || '',
            employerEmail: job.companyEmail || '',
            employerPhone: job.companyMobilePhone || '',
            region: job.region || '',
            country: job.country || '',
            type: job.type || 'full-time',
            status: job.status === 'pending' ? 'pending_review' : 
                   job.status === 'draft' ? 'needs_revision' :
                   job.status === 'rejected' ? 'rejected' : 'pending_review',
            salary: {
              min: job.salary?.min || 0,
              max: job.salary?.max || 0,
              currency: job.salary?.currency || 'TZS'
            },
            experience: job.experience || '',
            education: job.education || '',
            submittedDate: job.createdAt || job.postedDate || new Date().toISOString(),
            deadline: job.deadline || '',
            description: job.description || '',
            requirements: Array.isArray(job.requirements) ? job.requirements : [],
            benefits: Array.isArray(job.benefits) ? job.benefits : [],
            skills: Array.isArray(job.skills) ? job.skills : [],
            priority: job.priority || 'medium',
            featured: job.featured || false,
            remote: job.type === 'remote',
            adminNotes: job.adminNotes || '',
            reviewNotes: '',
            reviewerId: '',
            reviewerName: '',
            reviewedDate: '',
            revisionCount: 0,
            lastRevisionDate: ''
          }));
          setPendingJobs(mappedJobs);
        }
      }
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
    } finally {
      setLoading(false);
    }
  };


  // Mock data for pending job reviews (fallback)
  const mockPendingJobs: PendingJob[] = [
    {
      id: '1',
      title: 'Senior Software Engineer',
      companyName: 'Tech Solutions Ltd',
      companyId: '1',
      employerName: 'Sarah Johnson',
      employerEmail: 'sarah@techsolutions.com',
      employerPhone: '+255 123 456 789',
      region: 'Dar es Salaam',
      country: 'Tanzania',
      type: 'full-time',
      status: 'pending_review',
      salary: {
        min: 5000000,
        max: 8000000,
        currency: 'TZS'
      },
      experience: 'senior',
      education: 'bachelor',
      submittedDate: '2024-01-15',
      deadline: '2024-02-15',
      description: 'We are looking for a Senior Software Engineer to join our growing team...',
      requirements: [
        'Bachelor\'s degree in Computer Science',
        '5+ years of software development experience',
        'Strong knowledge of React and Node.js'
      ],
      benefits: [
        'Competitive salary',
        'Health insurance',
        'Flexible working hours'
      ],
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      priority: 'high',
      featured: false,
      remote: false,
      adminNotes: '',
      reviewNotes: '',
      reviewerId: '',
      reviewerName: '',
      reviewedDate: '',
      revisionCount: 0,
      lastRevisionDate: ''
    },
    {
      id: '2',
      title: 'Marketing Manager',
      companyName: 'Digital Agency Co',
      companyId: '2',
      employerName: 'Mike Chen',
      employerEmail: 'mike@digitalagency.com',
      employerPhone: '+255 987 654 321',
      region: 'Arusha',
      country: 'Tanzania',
      type: 'remote',
      status: 'under_review',
      salary: {
        min: 3000000,
        max: 5000000,
        currency: 'TZS'
      },
      experience: 'mid-level',
      education: 'bachelor',
      submittedDate: '2024-01-18',
      deadline: '2024-02-18',
      description: 'Join our marketing team to drive growth and brand awareness...',
      requirements: [
        'Bachelor\'s degree in Marketing or related field',
        '3+ years of marketing experience',
        'Strong analytical skills'
      ],
      benefits: [
        'Remote work option',
        'Professional development',
        'Performance bonuses'
      ],
      skills: ['Digital Marketing', 'SEO', 'Social Media', 'Analytics'],
      priority: 'medium',
      featured: true,
      remote: true,
      adminNotes: 'Good job description, needs salary range clarification',
      reviewNotes: 'Please provide more specific salary range',
      reviewerId: 'admin-1',
      reviewerName: 'Admin User',
      reviewedDate: '2024-01-19',
      revisionCount: 1,
      lastRevisionDate: '2024-01-19'
    },
    {
      id: '3',
      title: 'Data Analyst',
      companyName: 'Finance Corp',
      companyId: '3',
      employerName: 'Emily Rodriguez',
      employerEmail: 'emily@financecorp.com',
      employerPhone: '+255 456 789 012',
      region: 'Mwanza',
      country: 'Tanzania',
      type: 'full-time',
      status: 'needs_revision',
      salary: {
        min: 4000000,
        max: 6000000,
        currency: 'TZS'
      },
      experience: 'mid-level',
      education: 'bachelor',
      submittedDate: '2024-01-20',
      deadline: '2024-02-20',
      description: 'We need a Data Analyst to help us make data-driven decisions...',
      requirements: [
        'Bachelor\'s degree in Statistics or related field',
        '2+ years of data analysis experience',
        'Proficiency in Python and SQL'
      ],
      benefits: [
        'Competitive salary',
        'Health insurance',
        'Learning opportunities'
      ],
      skills: ['Python', 'SQL', 'Excel', 'Statistics'],
      priority: 'medium',
      featured: false,
      remote: false,
      adminNotes: 'Job description too vague, requirements need more detail',
      reviewNotes: 'Please provide more detailed job description and specific technical requirements',
      reviewerId: 'admin-1',
      reviewerName: 'Admin User',
      reviewedDate: '2024-01-21',
      revisionCount: 2,
      lastRevisionDate: '2024-01-21'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_revision':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Clock className="w-4 h-4" />;
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'needs_revision':
        return <Edit className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const formatSalary = (salary: PendingJob['salary']) => {
    const min = salary.min.toLocaleString();
    const max = salary.max.toLocaleString();
    return `${salary.currency} ${min} - ${max}`;
  };

  const formatDate = (dateString: string) => {
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
    if (selectedJobs.length === pendingJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(pendingJobs.map(j => j.id));
    }
  };

  const handleReviewJob = (job: PendingJob, action: 'approve' | 'reject' | 'revision') => {
    setSelectedJob(job);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedJob) return;
    
    setSubmitting(true);
    try {
      let endpoint = '';
      if (reviewAction === 'approve') {
        endpoint = `/api/admin/jobs/${selectedJob.id}/approve`;
      } else if (reviewAction === 'reject') {
        endpoint = `/api/admin/jobs/${selectedJob.id}/reject`;
      } else if (reviewAction === 'revision') {
        endpoint = `/api/admin/jobs/${selectedJob.id}/request-revision`;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: reviewNotes })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the jobs list
        await fetchPendingJobs();
        setShowReviewModal(false);
        setSelectedJob(null);
        setReviewNotes('');
      } else {
        alert(`Failed to ${reviewAction} job: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(`Failed to ${reviewAction} job. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };


  const filteredJobs = pendingJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    const matchesCompany = companyFilter === 'all' || job.companyId === companyFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCompany && matchesPriority;
  });

  const stats = [
    { title: 'Pending Review', value: pendingJobs.filter(j => j.status === 'pending_review').length, color: 'bg-yellow-500' },
    { title: 'Under Review', value: pendingJobs.filter(j => j.status === 'under_review').length, color: 'bg-blue-500' },
    { title: 'Needs Revision', value: pendingJobs.filter(j => j.status === 'needs_revision').length, color: 'bg-orange-500' },
    { title: 'Approved', value: pendingJobs.filter(j => j.status === 'approved').length, color: 'bg-green-500' },
    { title: 'Rejected', value: pendingJobs.filter(j => j.status === 'rejected').length, color: 'bg-red-500' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Reviews</h1>
            <p className="text-lg text-gray-600">Review and approve employer job submissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:text-gray-700">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Jobs</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, company, employer, or location..."
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
                <option value="pending_review">Pending Review</option>
                <option value="under_review">Under Review</option>
                <option value="needs_revision">Needs Revision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
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
                <option value="1">Tech Solutions Ltd</option>
                <option value="2">Digital Agency Co</option>
                <option value="3">Finance Corp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pending Job Reviews ({filteredJobs.length})</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  {selectedJobs.length === pendingJobs.length ? 'Deselect All' : 'Select All'}
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
                      checked={selectedJobs.length === pendingJobs.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job) => (
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
                          <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.region}, {job.country}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {job.featured && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </span>
                            )}
                            {job.remote && (
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
                        <div className="text-sm font-semibold text-gray-900">{job.companyName}</div>
                        <div className="text-sm text-gray-500">{job.employerName}</div>
                        <div className="text-sm text-gray-500">{job.employerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.type === 'remote' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.type.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSalary(job.salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(job.submittedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/job-reviews/${job.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[#114373] bg-white border border-[#114373] rounded-lg hover:bg-[#114373] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedJob && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {reviewAction === 'approve' && 'Approve Job'}
                  {reviewAction === 'reject' && 'Reject Job'}
                  {reviewAction === 'revision' && 'Request Revision'}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedJob.title}</h4>
                  <p className="text-gray-600">{selectedJob.companyName} - {selectedJob.region}, {selectedJob.country}</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Notes *
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder={`Add notes for ${reviewAction === 'approve' ? 'approval' : reviewAction === 'reject' ? 'rejection' : 'revision request'}...`}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting || (reviewAction !== 'approve' && !reviewNotes.trim())}
                    className={`px-6 py-2 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                      reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {reviewAction === 'approve' && 'Approve Job'}
                        {reviewAction === 'reject' && 'Reject Job'}
                        {reviewAction === 'revision' && 'Request Revision'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
