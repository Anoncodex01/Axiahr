'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
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
  Briefcase,
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
  User,
  Users,
  Building2,
  DollarSign,
  Shield,
  MessageSquare,
  Globe,
  BookOpen,
  Sparkles,
  X,
  LayoutDashboard,
  ClipboardList,
  Building,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageCircleIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Plus as PlusIcon,
  UserPlus as UserPlusIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  Calendar as CalendarIcon,
  Award as AwardIcon,
  MapPin as MapPinIcon,
  GraduationCap as GraduationCapIcon,
  Briefcase as BriefcaseIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  RefreshCw as RefreshCwIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Share2 as Share2Icon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  User as UserIcon,
  Users as UsersIcon,
  Building2 as Building2Icon,
  DollarSign as DollarSignIcon,
  Shield as ShieldIcon,
  MessageSquare as MessageSquareIcon,
  Globe as GlobeIcon,
  BookOpen as BookOpenIcon,
  Sparkles as SparklesIcon,
  X as XIcon,
  LayoutDashboard as LayoutDashboardIcon,
  ClipboardList as ClipboardListIcon,
  Building as BuildingIcon,
  Mail as MailIcon2,
  Phone as PhoneIcon2,
  MessageCircle as MessageCircleIcon2,
  Download as DownloadIcon2,
  Upload as UploadIcon2,
  Plus as PlusIcon2,
  UserPlus as UserPlusIcon2,
  UserCheck as UserCheckIcon2,
  UserX as UserXIcon2,
  Calendar as CalendarIcon2,
  Award as AwardIcon2,
  MapPin as MapPinIcon2,
  GraduationCap as GraduationCapIcon2,
  Briefcase as BriefcaseIcon2,
  Star as StarIcon2,
  Clock as ClockIcon2,
  ChevronLeft as ChevronLeftIcon2,
  ChevronRight as ChevronRightIcon2,
  ChevronDown as ChevronDownIcon2,
  ChevronUp as ChevronUpIcon2,
  CheckCircle as CheckCircleIcon2,
  XCircle as XCircleIcon2,
  AlertCircle as AlertCircleIcon2,
  Info as InfoIcon2,
  Target as TargetIcon2,
  Zap as ZapIcon2,
  RefreshCw as RefreshCwIcon2,
  Bell as BellIcon2,
  Settings as SettingsIcon2,
  Archive as ArchiveIcon2,
  Share2 as Share2Icon2,
  Copy as CopyIcon2,
  ExternalLink as ExternalLinkIcon2,
  BarChart3 as BarChart3Icon2,
  PieChart as PieChartIcon2,
  Activity as ActivityIcon2,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon2,
  User as UserIcon2,
  Users as UsersIcon2,
  Building2 as Building2Icon2,
  DollarSign as DollarSignIcon2,
  Shield as ShieldIcon2,
  MessageSquare as MessageSquareIcon2,
  Globe as GlobeIcon2,
  BookOpen as BookOpenIcon2,
  Sparkles as SparklesIcon2,
  X as XIcon2,
  LayoutDashboard as LayoutDashboardIcon2,
  ClipboardList as ClipboardListIcon2,
  Building as BuildingIcon2
} from 'lucide-react';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'interviewed' | 'selected' | 'hired';
  appliedDate: string;
  lastActivity: string;
  experience: string;
  skills: string[];
  expectedSalary: string;
  noticePeriod: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
  matchScore: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function EmployerApplications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'shortlist' | 'reject' | 'interview'>('shortlist');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState<'in-person' | 'video' | 'phone'>('video');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'incomplete'>('incomplete');
  const itemsPerPage = 10;

  // Check profile status on mount
  useEffect(() => {
    const employerData = localStorage.getItem('employerData');
    const profileComplete = localStorage.getItem('employerProfileComplete');
    
    if (employerData) {
      try {
        const parsed = JSON.parse(employerData);
        if (parsed.profileStatus === 'pending' || profileComplete === 'pending') {
          setProfileStatus('pending');
        } else if (parsed.profileStatus === 'approved' || profileComplete === 'approved') {
          setProfileStatus('approved');
        }
      } catch (e) {
        console.error('Error parsing employerData:', e);
      }
    } else if (profileComplete === 'pending') {
      setProfileStatus('pending');
    } else if (profileComplete === 'approved') {
      setProfileStatus('approved');
    }
  }, []);

  // Mock data - in real app, this would come from API
  const applications: Application[] = [
    {
      id: '1',
      candidateId: '1',
      candidateName: 'John Doe',
      candidateEmail: 'john.doe@email.com',
      candidatePhone: '+1 (555) 123-4567',
      jobId: '1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      status: 'pending',
      appliedDate: '2024-01-15',
      lastActivity: '2024-01-20',
      experience: '5 years',
      skills: ['React', 'Node.js', 'Python', 'JavaScript'],
      expectedSalary: '$120,000',
      noticePeriod: '30 days',
      coverLetter: 'I am excited to apply for the Senior Software Engineer position at Tech Corp...',
      resumeUrl: '/resumes/john-doe-resume.pdf',
      portfolioUrl: 'https://johndoe.dev',
      matchScore: 95,
      priority: 'high'
    },
    {
      id: '2',
      candidateId: '2',
      candidateName: 'Jane Smith',
      candidateEmail: 'jane.smith@email.com',
      candidatePhone: '+1 (555) 987-6543',
      jobId: '2',
      jobTitle: 'Product Manager',
      companyName: 'Tech Corp',
      status: 'shortlisted',
      appliedDate: '2024-01-14',
      lastActivity: '2024-01-19',
      experience: '7 years',
      skills: ['Product Management', 'Agile', 'User Research', 'Analytics'],
      expectedSalary: '$130,000',
      noticePeriod: '2 weeks',
      coverLetter: 'With my extensive experience in product management...',
      resumeUrl: '/resumes/jane-smith-resume.pdf',
      matchScore: 88,
      priority: 'medium'
    },
    {
      id: '3',
      candidateId: '3',
      candidateName: 'Mike Johnson',
      candidateEmail: 'mike.johnson@email.com',
      candidatePhone: '+1 (555) 456-7890',
      jobId: '1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      status: 'interviewed',
      appliedDate: '2024-01-13',
      lastActivity: '2024-01-18',
      experience: '6 years',
      skills: ['Java', 'Spring Boot', 'Microservices', 'AWS'],
      expectedSalary: '$115,000',
      noticePeriod: '1 month',
      coverLetter: 'I am passionate about building scalable applications...',
      resumeUrl: '/resumes/mike-johnson-resume.pdf',
      matchScore: 92,
      priority: 'high'
    }
  ];

  const jobs = [
    { id: '1', title: 'Senior Software Engineer', company: 'Tech Corp' },
    { id: '2', title: 'Product Manager', company: 'Tech Corp' },
    { id: '3', title: 'UX Designer', company: 'Tech Corp' }
  ];

  const stats = [
    { title: 'Total Applications', value: applications.length, color: 'bg-blue-500' },
    { title: 'Pending Review', value: applications.filter(a => a.status === 'pending').length, color: 'bg-yellow-500' },
    { title: 'Shortlisted', value: applications.filter(a => a.status === 'shortlisted').length, color: 'bg-green-500' },
    { title: 'Interviewed', value: applications.filter(a => a.status === 'interviewed').length, color: 'bg-purple-500' },
    { title: 'Selected', value: applications.filter(a => a.status === 'selected').length, color: 'bg-indigo-500' },
    { title: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: 'bg-red-500' }
  ];

  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(a => a.id));
    }
  };

  const handleReviewApplication = (application: any, action: 'shortlist' | 'reject' | 'interview') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedApplication) return;
    
    // In real app, this would make an API call
    console.log(`Reviewing application ${selectedApplication.id} with action ${reviewAction}`, {
      notes: reviewNotes,
      action: reviewAction
    });
    
    setShowReviewModal(false);
    setSelectedApplication(null);
    setReviewNotes('');
  };

  const handleScheduleInterview = (application: any) => {
    setSelectedApplication(application);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewType('video');
    setInterviewLocation('');
    setShowInterviewModal(true);
  };

  const handleSubmitInterview = () => {
    if (!selectedApplication) return;
    
    // In real app, this would make an API call
    console.log(`Scheduling interview for application ${selectedApplication.id}`, {
      date: interviewDate,
      time: interviewTime,
      type: interviewType,
      location: interviewLocation
    });
    
    setShowInterviewModal(false);
    setSelectedApplication(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'selected': return 'bg-indigo-100 text-indigo-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    const matchesJob = jobFilter === 'all' || application.jobId === jobFilter;
    
    return matchesSearch && matchesStatus && matchesJob;
  });

  const router = useRouter();

  // Redirect to dashboard if profile is pending
  useEffect(() => {
    if (profileStatus === 'pending') {
      router.push('/employer/dashboard');
    }
  }, [profileStatus, router]);

  // Show nothing while checking or redirecting
  if (profileStatus === 'pending') {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
          <p className="text-lg text-gray-600">Review and manage job applications from candidates</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
            <Download className="w-5 h-5 mr-2" />
            Export Applications
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Applications</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by candidate, job, or company..."
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
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="interviewed">Interviewed</option>
              <option value="selected">Selected</option>
              <option value="hired">Hired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Position</label>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
              <span className="text-sm text-gray-500">{filteredApplications.length} applications</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {selectedApplications.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedApplications.length} selected</span>
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
                    checked={selectedApplications.length === applications.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedApplications.includes(application.id)}
                      onChange={() => handleSelectApplication(application.id)}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{application.candidateName}</div>
                        <div className="text-sm text-gray-500">{application.candidateEmail}</div>
                        <div className="text-xs text-gray-400">{application.experience}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{application.jobTitle}</div>
                      <div className="text-sm text-gray-500">{application.companyName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${application.matchScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{application.matchScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                      {application.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.appliedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReviewApplication(application, 'shortlist')}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Shortlist Candidate"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReviewApplication(application, 'reject')}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject Application"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleScheduleInterview(application)}
                        className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Schedule Interview"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/employer/applications/${application.id}`}
                        className="p-2 text-gray-500 hover:text-[#114373] rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">1</span> to <span className="font-semibold">{filteredApplications.length}</span> of{' '}
          <span className="font-semibold">{applications.length}</span> results
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

      {/* Review Application Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {reviewAction === 'shortlist' && 'Shortlist Candidate'}
                {reviewAction === 'reject' && 'Reject Application'}
                {reviewAction === 'interview' && 'Schedule Interview'}
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Candidate: <span className="font-semibold">{selectedApplication.candidateName}</span></p>
                <p className="text-sm text-gray-600">Job: <span className="font-semibold">{selectedApplication.jobTitle}</span></p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="Add your review notes..."
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors ${
                    reviewAction === 'shortlist' ? 'bg-blue-600 hover:bg-blue-700' :
                    reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {reviewAction === 'shortlist' && 'Shortlist Candidate'}
                  {reviewAction === 'reject' && 'Reject Application'}
                  {reviewAction === 'interview' && 'Schedule Interview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Candidate: <span className="font-semibold">{selectedApplication.candidateName}</span></p>
                <p className="text-sm text-gray-600">Job: <span className="font-semibold">{selectedApplication.jobTitle}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as 'in-person' | 'video' | 'phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                >
                  <option value="video">Video Call</option>
                  <option value="in-person">In-Person</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
              {interviewType === 'in-person' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Enter interview location"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInterview}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
