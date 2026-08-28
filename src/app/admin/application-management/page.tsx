'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import EvaluationForm, { type EvaluationData } from '@/components/EvaluationForm';
import BatchEvaluation from '@/components/BatchEvaluation';
import LoadingState from '@/components/LoadingState';
// AdminLayout is now provided by RoleBasedAdminLayout in the root layout
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
  X,
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
  Save
} from 'lucide-react';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateProfilePicture?: string;
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  companyName: string;
  companyIndustry: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'screened' | 'selected' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastActivity: string;
  experience: string;
  skills: string[];
  expectedSalary: string;
  noticePeriod: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  interviewScheduled?: string;
  interviewNotes?: string;
  adminNotes: string;
  priority: 'low' | 'medium' | 'high';
  source: 'direct' | 'referral' | 'job_board' | 'social_media';
}

export default function ApplicationManagement() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'shortlist' | 'interview'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState<'in-person' | 'online'>('online');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [interviewDetailsById, setInterviewDetailsById] = useState<Record<string, { date: string; time: string; type: 'in-person' | 'online'; location?: string; link?: string }>>({});
  const [interviewStatusById, setInterviewStatusById] = useState<Record<string, 'scheduled' | 'conducted' | 'not_done'>>({});
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [shortlistNotes, setShortlistNotes] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluatingApplication, setEvaluatingApplication] = useState<Application | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch applications from database
  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, [statusFilter, jobId, jobFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let url = `/api/applications?page=${currentPage}&limit=100`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (jobId) {
        url += `&jobId=${jobId}`;
      } else if (jobFilter !== 'all') {
        url += `&jobId=${jobFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Map API response to Application interface
        const mappedApplications: Application[] = data.data.map((app: any) => {
          // Parse skills from JSON if it's a string
          let skills: string[] = [];
          try {
            if (app.skills) {
              skills = typeof app.skills === 'string' ? JSON.parse(app.skills) : app.skills;
            }
          } catch (e) {
            console.error('Error parsing skills:', e);
          }

          return {
            id: app.id.toString(),
            candidateId: app.candidate_id?.toString() || '',
            candidateName: `${app.first_name || ''} ${app.surname || ''}`.trim() || 'Unknown Candidate',
            candidateEmail: app.candidate_email || '',
            candidatePhone: app.candidate_phone || '',
            candidateProfilePicture: app.photo_url || app.profile_picture || null,
            jobId: app.job_id?.toString() || '',
            jobTitle: app.job_title || 'Unknown Job',
            jobLocation: app.job_location || '',
            companyName: app.company_name || '',
            companyIndustry: app.company_industry || '',
            status: app.status || 'pending',
            appliedDate: app.applied_date || app.created_at || new Date().toISOString(),
            lastActivity: app.last_activity || app.updated_at || app.created_at || new Date().toISOString(),
            experience: app.experience_years ? `${app.experience_years} years` : '',
            skills: skills,
            expectedSalary: app.expected_salary ? `${app.expected_salary}` : '',
            noticePeriod: app.notice_period || '',
            coverLetter: app.cover_letter || '',
            resumeUrl: app.resume_url || '',
            portfolioUrl: app.portfolio_url || '',
            linkedinUrl: app.linkedin_url || '',
            githubUrl: app.github_url || '',
            adminNotes: app.admin_notes || '',
            priority: app.priority || 'medium',
            source: app.source || 'direct'
          };
        });
        setApplications(mappedApplications);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/jobs?status=published');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Load interview statuses from localStorage
  useEffect(() => {
    try {
      const key = 'interviews';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const statusMap: Record<string, 'scheduled' | 'conducted' | 'not_done'> = {};
      existing.forEach((event: any) => {
        if (event.applicationId) {
          statusMap[event.applicationId] = event.status || 'scheduled';
        }
      });
      setInterviewStatusById(statusMap);
    } catch (e) {
      console.error('Failed to load interview statuses from localStorage', e);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openDropdown && !target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);


  const { user } = useUser();
  // Mock assignees (calendar owners) - replace with users from API later
  const assignees = [
    { id: user?.id || 'me', name: user ? `${user.firstName} ${user.lastName}` : 'Me (Current User)' },
    { id: 'admin1', name: 'Admin Team' },
    { id: 'hr1', name: 'HR Team' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-indigo-100 text-indigo-800';
      case 'selected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewed':
        return <Eye className="w-4 h-4" />;
      case 'shortlisted':
        return <UserCheck className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'selected':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'withdrawn':
        return <UserX className="w-4 h-4" />;
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


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications?id=${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh applications after status update
        await fetchApplications();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  const handleReviewApplication = (application: any, action: 'approve' | 'reject' | 'shortlist' | 'interview') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;
    
    try {
      let newStatus = '';
      if (reviewAction === 'approve') {
        newStatus = 'reviewed';
      } else if (reviewAction === 'reject') {
        newStatus = 'rejected';
      } else if (reviewAction === 'shortlist') {
        newStatus = 'shortlisted';
      } else if (reviewAction === 'interview') {
        newStatus = 'interviewed';
      }

      const response = await fetch(`/api/applications?id=${selectedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          adminNotes: reviewNotes 
        }),
      });

      if (response.ok) {
        await fetchApplications();
        setShowReviewModal(false);
        setSelectedApplication(null);
        setReviewNotes('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update application');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleScheduleInterview = (application: any) => {
    setSelectedApplication(application);
    setInterviewDate('');
    setInterviewTime('');
    setInterviewType('online');
    setInterviewLocation('');
    setGoogleMeetLink('');
    setAssigneeId(user?.id || 'me');
    setShowInterviewModal(true);
  };

  const handleSubmitInterview = () => {
    if (!selectedApplication) return;
    
    // In real app, this would make an API call
    setInterviewDetailsById(prev => ({
      ...prev,
      [selectedApplication.id]: {
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        location: interviewType === 'in-person' ? interviewLocation : undefined,
        link: interviewType === 'online' ? googleMeetLink : undefined,
      }
    }));
    // Write to localStorage for Interview Calendar (basic implementation)
    try {
      const key = 'interviews';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const owner = assignees.find(a => a.id === assigneeId) || assignees[0];
      const event = {
        id: `${selectedApplication.id}-${Date.now()}`,
        applicationId: selectedApplication.id,
        candidateName: selectedApplication.candidateName,
        jobTitle: selectedApplication.jobTitle,
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        link: interviewType === 'online' ? googleMeetLink : undefined,
        location: interviewType === 'in-person' ? interviewLocation : undefined,
        ownerId: owner.id,
        ownerName: owner.name,
        status: 'scheduled',
      };
      localStorage.setItem(key, JSON.stringify([event, ...existing]));
    } catch (e) {
      console.error('Failed to persist interview event', e);
    }
    setInterviewStatusById(prev => ({ ...prev, [selectedApplication.id]: 'scheduled' }));
    setShowInterviewModal(false);
    setSelectedApplication(null);
  };

  const handleShortlistCandidate = (application: any) => {
    setSelectedApplication(application);
    setShortlistNotes('');
    setShowShortlistModal(true);
  };

  const handleViewApplication = (application: Application) => {
    setViewingApplication(application);
    setShowViewModal(true);
  };

  const handleEvaluateCandidate = (application: Application) => {
    setEvaluatingApplication(application);
    setShowEvaluationModal(true);
  };

  const handleEvaluationSubmit = async (data: EvaluationData) => {
    if (!evaluatingApplication) return;
    
    try {
      // Submit evaluation to API
      const response = await fetch('/api/evaluations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: evaluatingApplication.id,
          candidateName: evaluatingApplication.candidateName,
          jobTitle: evaluatingApplication.jobTitle,
          companyName: evaluatingApplication.companyName,
          evaluationData: data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit evaluation');
      }

      const result = await response.json();
      
      // Update interview status to conducted
      setInterviewStatusById(prev => ({ ...prev, [evaluatingApplication.id]: 'conducted' }));
      
      // Update interview status in localStorage
      try {
        const key = 'interviews';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = existing.map((event: any) => 
          event.applicationId === evaluatingApplication.id 
            ? { ...event, status: 'conducted', evaluationId: result.evaluationId }
            : event
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update interview status in localStorage', e);
      }
      
      // Update application status based on recommendation
      if (data.recommendation === 'exceeds' || data.recommendation === 'meets') {
        // In real app, update application status to 'selected'
        console.log('Candidate meets or exceeds requirements');
      } else if (data.recommendation === 'does_not_meet') {
        // In real app, update application status to 'rejected'
        console.log('Candidate does not meet requirements');
      } else if (data.recommendation === 'partially_meets') {
        // In real app, update application status to 'hold'
        console.log('Candidate partially meets requirements');
      }
      
      setShowEvaluationModal(false);
      setEvaluatingApplication(null);
      
      // Show success message
      alert(`Evaluation submitted successfully! Evaluation ID: ${result.evaluationId}. Employer has been notified.`);
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Failed to submit evaluation. Please try again.');
    }
  };


  const handleSubmitShortlist = async () => {
    if (!selectedApplication) return;
    
    try {
      const response = await fetch(`/api/applications?id=${selectedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'shortlisted',
          adminNotes: shortlistNotes 
        }),
      });

      if (response.ok) {
        await fetchApplications();
        setShowShortlistModal(false);
        // Immediately proceed to schedule interview after shortlisting
        const app = selectedApplication;
        setTimeout(() => {
          handleScheduleInterview(app);
        }, 0);
        setSelectedApplication(null);
        setShortlistNotes('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to shortlist application');
      }
    } catch (error) {
      console.error('Error shortlisting application:', error);
      alert('Failed to shortlist application. Please try again.');
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || application.priority === priorityFilter;
    const matchesJob = jobFilter === 'all' || application.jobId === jobFilter;
    const matchesJobId = !jobId || application.jobId === jobId;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesJob && matchesJobId;
  });

  // Get selected job details from fetched jobs
  const selectedJob = jobId ? jobs.find(job => job.id === jobId) : null;
  
  // Calculate job statistics from applications
  // Note: 'interviewed' includes applications that have been shortlisted (and may have interviews scheduled)
  // or have status 'screened' (after interview conducted and screened)
  const jobStats = jobId ? {
    totalApplications: applications.filter(a => a.jobId === jobId).length,
    pendingReview: applications.filter(a => a.jobId === jobId && a.status === 'pending').length,
    shortlisted: applications.filter(a => a.jobId === jobId && a.status === 'shortlisted').length,
    interviewed: applications.filter(a => 
      a.jobId === jobId && 
      (a.status === 'shortlisted' || a.status === 'screened' || a.status === 'interviewed')
    ).length,
    selected: applications.filter(a => a.jobId === jobId && a.status === 'selected').length,
    rejected: applications.filter(a => a.jobId === jobId && a.status === 'rejected').length,
    screened: applications.filter(a => a.jobId === jobId && a.status === 'screened').length
  } : null;

  const stats = [
    { title: 'Total Applications', value: applications.length, color: 'bg-blue-500' },
    { title: 'Pending Review', value: applications.filter(a => a.status === 'pending').length, color: 'bg-yellow-500' },
    { title: 'Shortlisted', value: applications.filter(a => a.status === 'shortlisted').length, color: 'bg-purple-500' },
    { title: 'Interviewed', value: applications.filter(a => 
      a.status === 'shortlisted' || a.status === 'screened' || a.status === 'interviewed'
    ).length, color: 'bg-indigo-500' },
    { title: 'Screened', value: applications.filter(a => a.status === 'screened').length, color: 'bg-teal-500' },
    { title: 'Selected', value: applications.filter(a => a.status === 'selected').length, color: 'bg-green-500' },
    { title: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading applications..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
            <p className="text-lg text-gray-600 mt-2">Review and manage all job applications</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md">
              <Download className="w-5 h-5 mr-2" />
              Export Applications
            </button>
            <button 
              onClick={() => fetchApplications()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
              title="Refresh applications"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Job-Specific Applications Section */}
        {selectedJob && (
          <div className="mb-8">
            {/* Job Specific Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedJob?.title || 'Job'} Applications</h2>
                <p className="text-gray-600 mt-1">{selectedJob?.companyName || 'Company'} • {selectedJob?.location || selectedJob?.region || 'Location'}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/application-management"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to All Jobs
                </Link>
              </div>
            </div>
            
            {/* Job Statistics */}
            {jobStats && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{jobStats.totalApplications}</div>
                    <div className="text-sm font-semibold text-gray-700">Total Applications</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">{jobStats.pendingReview}</div>
                    <div className="text-sm font-semibold text-gray-700">Pending Review</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{jobStats.shortlisted}</div>
                    <div className="text-sm font-semibold text-gray-700">Shortlisted</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{jobStats.interviewed}</div>
                    <div className="text-sm font-semibold text-gray-700">Interviewed</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">{jobStats.screened}</div>
                    <div className="text-sm font-semibold text-gray-700">Screened</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">{jobStats.selected}</div>
                    <div className="text-sm font-semibold text-gray-700">Selected</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Screened Candidates Section */}
            <BatchEvaluation 
              jobId={jobId}
              onEvaluateCandidate={handleEvaluateCandidate}
              onScheduleInterview={handleScheduleInterview}
              onBatchSendToEmployer={async () => {
                if (!jobId) return;
                
                try {
                  // Fetch evaluations from API
                  const evalResponse = await fetch(`/api/evaluations?jobId=${jobId}`);
                  const evalData = await evalResponse.json();
                  const evaluations = evalData.success ? evalData.data : [];
                  
                  // Filter qualified candidates (meets or exceeds recommendation) that haven't been sent yet
                  const qualifiedEvaluations = evaluations.filter((evaluation: any) => 
                    (evaluation.recommendation === 'meets' || evaluation.recommendation === 'exceeds') &&
                    !evaluation.sent_to_employer
                  );

                  if (qualifiedEvaluations.length === 0) {
                    setErrorMessage('No qualified candidates to send to employer. All qualified candidates may have already been sent.');
                    setShowErrorModal(true);
                    return;
                  }

                  // Get evaluation IDs
                  const evaluationIds = qualifiedEvaluations.map((e: any) => e.id);

                  // Send to employer via API
                  const sendResponse = await fetch('/api/evaluations/send-to-employer', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      jobId: jobId,
                      evaluationIds: evaluationIds
                    }),
                  });

                  const sendData = await sendResponse.json();

                  if (!sendResponse.ok || !sendData.success) {
                    throw new Error(sendData.error || 'Failed to send candidates to employer');
                  }

                  // Refresh applications after update
                  await fetchApplications();

                  // Success will be handled by BatchEvaluation component's modal
                  // No need to show alert here
                  
                } catch (error: any) {
                  console.error('Error sending batch to employer:', error);
                  // Error will be handled by BatchEvaluation component's modal
                  throw error; // Re-throw to let BatchEvaluation handle it
                }
              }}
            />
            
            {/* Search and Filter for Selected Job */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Search Applications</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by candidate name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">New Application</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table for Selected Job */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        CANDIDATE
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        JOB TITLE
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        COMPANY
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        STATUS
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        APPLIED
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50/50 transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 relative">
                              {application.candidateProfilePicture ? (
                                <>
                                  <img
                                    src={application.candidateProfilePicture}
                                    alt={application.candidateName}
                                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                        fallback.classList.add('flex');
                                      }
                                    }}
                                  />
                                  <div 
                                    className="fallback-avatar h-12 w-12 rounded-full bg-blue-600 items-center justify-center hidden absolute inset-0"
                                    style={{ display: 'none' }}
                                  >
                                    <span className="text-sm font-semibold text-white">
                                      {application.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-white">
                                    {application.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{application.candidateName}</div>
                              <div className="text-sm text-gray-500">{application.candidateEmail}</div>
                              <div className="text-xs text-gray-400">{application.experience}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{application.jobTitle}</div>
                            <div className="text-sm text-gray-500">{application.jobLocation}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{application.companyName}</div>
                            <div className="text-sm text-gray-500">{application.companyIndustry}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            {application.status === 'pending' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                          {formatDate(application.appliedDate)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/application-management/${application.id}?candidateId=${application.candidateId}&jobId=${application.jobId}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[#114373] hover:bg-[#0d3559] rounded-lg transition-all duration-200 hover:shadow-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Company Job Statistics Grid - Only show when no specific job is selected */}
        {!selectedJob && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
            {stats.map((stat, index) => {
              const IconComponent = 
                stat.title === 'Total Applications' ? FileText :
                stat.title === 'Pending Review' ? Clock :
                stat.title === 'Shortlisted' ? Star :
                stat.title === 'Interviewed' ? Calendar :
                stat.title === 'Screened' ? UserCheck :
                stat.title === 'Selected' ? CheckCircle :
                XCircle;
              
              return (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters and Search - Only show when no specific job is selected */}
        {!selectedJob && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <option value="interviewed">Interviewed</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job</label>
              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        )}

        {/* Company Job Applications Overview - Only show when no specific job is selected */}
        {!selectedJob && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Job Applications Overview</h2>
          
          {/* Jobs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      JOB TITLE
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      COMPANY
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      LOCATION
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      TOTAL APPLICATIONS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      PENDING REVIEW
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SHORTLISTED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      INTERVIEWED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      SELECTED
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Briefcase className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg font-medium">No jobs found</p>
                          <p className="text-gray-400 text-sm mt-2">No published jobs available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => {
                      const jobApplications = applications.filter(a => a.jobId === job.id);
                      // Count interviewed: applications with status 'shortlisted' that have interviews, or status 'screened'
                      // We'll need to check interviews table, but for now count 'screened' as interviewed candidates
                      const jobStats = {
                        totalApplications: jobApplications.length,
                        pendingReview: jobApplications.filter(a => a.status === 'pending').length,
                        shortlisted: jobApplications.filter(a => a.status === 'shortlisted').length,
                        interviewed: jobApplications.filter(a => 
                          a.status === 'shortlisted' || 
                          a.status === 'screened' || 
                          a.status === 'interviewed'
                        ).length,
                        selected: jobApplications.filter(a => a.status === 'selected').length,
                        rejected: jobApplications.filter(a => a.status === 'rejected').length,
                        screened: jobApplications.filter(a => a.status === 'screened').length
                      };
                      
                      return (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.companyName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{job.location || (job.region && job.country ? `${job.region}, ${job.country}` : job.region || job.country || 'N/A')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full border ${
                          job.status === 'published' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-blue-600">{jobStats.totalApplications}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-yellow-600">{jobStats.pendingReview}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">{jobStats.shortlisted}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-purple-600">{jobStats.interviewed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-indigo-600">{jobStats.selected}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Link
                            href={`/admin/application-management?jobId=${job.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150 border border-blue-200 whitespace-nowrap"
                            title="View Job Applications"
                          >
                            <Eye className="w-4 h-4 mr-1 flex-shrink-0" />
                            View Job
                          </Link>
                        </div>
                      </td>
                    </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* Review Application Modal */}
        {showReviewModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {reviewAction === 'approve' && 'Approve Application'}
                  {reviewAction === 'reject' && 'Reject Application'}
                  {reviewAction === 'shortlist' && 'Shortlist Candidate'}
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
                      reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      reviewAction === 'shortlist' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {reviewAction === 'approve' && 'Approve Application'}
                    {reviewAction === 'reject' && 'Reject Application'}
                    {reviewAction === 'shortlist' && 'Shortlist Candidate'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  >
                    {assignees.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value as 'in-person' | 'online')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  >
                    <option value="online">Online Meeting</option>
                    <option value="in-person">Personal (In-Person)</option>
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
                {interviewType === 'online' && (
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Google Meet Link</label>
                      <input
                        type="url"
                        value={googleMeetLink}
                        onChange={(e) => setGoogleMeetLink(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://meet.google.com/xxxx-xxxx-xxx"
                      />
                      <p className="mt-2 text-xs text-gray-500">Go to Google Meet and create a meeting at the selected time, then paste the link here.</p>
                    </div>
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
                    disabled={!interviewDate || !interviewTime || (interviewType === 'online' && !googleMeetLink)}
                    className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors ${(!interviewDate || !interviewTime || (interviewType === 'online' && !googleMeetLink)) ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    Schedule Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shortlist Candidate Modal */}
        {showShortlistModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Shortlist Candidate</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Candidate: <span className="font-semibold">{selectedApplication.candidateName}</span></p>
                  <p className="text-sm text-gray-600">Job: <span className="font-semibold">{selectedApplication.jobTitle}</span></p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shortlist Notes
                  </label>
                  <textarea
                    value={shortlistNotes}
                    onChange={(e) => setShortlistNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Add notes about why this candidate is being shortlisted..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowShortlistModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitShortlist}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Shortlist Candidate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Application Modal */}
        {showViewModal && viewingApplication && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                      <Eye className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                      <p className="text-sm text-gray-600">Job ID: {viewingApplication.jobId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Candidate Information */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mr-3">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Candidate Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.candidateName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.candidateEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.candidatePhone}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <Award className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Experience</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.experience}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                          <Target className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Expected Salary</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.expectedSalary}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Notice Period</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.noticePeriod}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Job Information</h4>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Job Title</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.jobTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Building2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Company</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.jobLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <Building2 className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Industry</p>
                          <p className="text-gray-900 font-semibold">{viewingApplication.companyIndustry}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Applied Date</p>
                          <p className="text-gray-900 font-semibold">{formatDate(viewingApplication.appliedDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingApplication.status)}`}>
                            {getStatusIcon(viewingApplication.status)}
                            <span className="ml-1 capitalize">{viewingApplication.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mr-3">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Skills & Expertise</h4>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex flex-wrap gap-3">
                      {viewingApplication.skills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                          <Award className="w-4 h-4 mr-2 text-blue-500" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>


                {/* Links */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mr-3">
                      <ExternalLink className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Portfolio & Links</h4>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {viewingApplication.portfolioUrl && (
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Portfolio</p>
                            <a href={viewingApplication.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                              View Portfolio
                            </a>
                          </div>
                        </div>
                      )}
                      {viewingApplication.linkedinUrl && (
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                            <a href={viewingApplication.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                      {viewingApplication.githubUrl && (
                        <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">GitHub</p>
                            <a href={viewingApplication.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                              View Repositories
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mr-3">
                      <MessageCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Admin Notes</h4>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                        <MessageCircle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Internal Notes</p>
                        <p className="text-gray-700 leading-relaxed">{viewingApplication.adminNotes}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <Info className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Application ID: {viewingApplication.id}</p>
                      <p className="text-xs text-gray-400">Job ID: {viewingApplication.jobId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleShortlistCandidate(viewingApplication);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Shortlist Candidate
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleScheduleInterview(viewingApplication);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Modal */}
        {showEvaluationModal && evaluatingApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <EvaluationForm
                candidateName={evaluatingApplication.candidateName}
                position={evaluatingApplication.jobTitle}
                interviewDate={interviewDetailsById[evaluatingApplication.id]?.date || new Date().toISOString().split('T')[0]}
                interviewerName={user ? `${user.firstName} ${user.lastName}` : 'Interviewer'}
                onSubmit={handleEvaluationSubmit}
                onCancel={() => {
                  setShowEvaluationModal(false);
                  setEvaluatingApplication(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Success!
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  {successMessage}
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Error
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  {errorMessage}
                </p>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
