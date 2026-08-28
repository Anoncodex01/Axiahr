'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import EmployerLayout from '@/components/EmployerLayout';
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
  User,
  ThumbsUp,
  ThumbsDown,
  Send,
  Save,
  Play,
  Pause,
  Square as SquareIcon,
  CheckSquare as CheckSquareIcon,
  XCircle as XCircleIcon,
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
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  AlertTriangle,
  CheckSquare,
  Square,
  Video,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon
} from 'lucide-react';

interface ScreenedCandidate {
  id: string;
  candidateId: string;
  candidateName: string;
  // Contact details hidden from employer
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  appliedDate: string;
  experience: string;
  resumeUrl: string;
  profilePicture?: string;
  resumeHeadline?: string;
  profileSummary?: string;
  nationality?: string;
  currentLocation?: string;
  skills?: string[];
  expectedSalary?: string;
  noticePeriod?: string;
  evaluation: {
    id: string;
    score: number;
    recommendation: 'does_not_meet' | 'partially_meets' | 'meets' | 'exceeds';
    strengths: string;
    weaknesses: string;
    communicationSkills?: string;
    technicalSkills?: string;
    experience?: string;
    culturalFit?: string;
    leadership?: string;
    currentSalary?: string;
    expectedSalary?: string;
    availability?: string;
    interviewerNotes?: string;
    additionalNotes?: string;
    interviewerName?: string;
    submittedAt: string;
    interviewDate?: string;
  };
  status: 'pending_review' | 'interview_again' | 'rejected' | 'selected' | 'screened';
  employerNotes?: string;
  coverLetter?: string;
  interviewScheduled?: {
    date: string;
    time: string;
    type: 'online' | 'in_person';
    location?: string;
    link?: string;
  };
}

function EmployerReviewPortalContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ScreenedCandidate | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState<'online' | 'in_person'>('online');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [employerNotes, setEmployerNotes] = useState('');
  const [action, setAction] = useState<'interview_again' | 'reject' | 'select'>('interview_again');
  const [screenedCandidates, setScreenedCandidates] = useState<ScreenedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Array<{
    id: string;
    title: string;
    candidateCount: number;
    location?: string;
    region?: string;
    country?: string;
    type?: string;
    salary?: { min: number; max: number; currency: string };
    experience?: string;
    postedDate?: string;
    applicationsCount?: number;
    status?: string;
  }>>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobId || null);
  const [viewMode, setViewMode] = useState<'jobs' | 'candidates'>('jobs');

  // Load jobs and screened candidates
  useEffect(() => {
    const initialize = async () => {
      await loadJobs();
      await loadScreenedCandidates();
    };
    initialize();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      // Get employer ID from localStorage
      const employerDataStr = localStorage.getItem('employerData');
      if (!employerDataStr) {
        setIsLoading(false);
        return;
      }

      const employerData = JSON.parse(employerDataStr);
      const employerId = employerData.id || employerData.employerId;
      if (!employerId) {
        setIsLoading(false);
        return;
      }

      // Fetch jobs for this employer
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      const response = await fetch('/api/employers/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobs) {
          // First, load all candidates to get counts per job
          try {
            const allCandidatesResponse = await fetch(`/api/employer/screened-candidates?employerId=${employerId}`);
            const allCandidatesData = await allCandidatesResponse.json();
            
            const candidatesByJob: Record<string, number> = {};
            if (allCandidatesData.success && allCandidatesData.data) {
              allCandidatesData.data.forEach((c: any) => {
                const jId = c.jobId || 'unknown';
                candidatesByJob[jId] = (candidatesByJob[jId] || 0) + 1;
              });
            }
            
            setJobs(data.jobs.map((job: any) => ({
              id: job.id,
              title: job.title,
              candidateCount: candidatesByJob[job.id] || 0,
              location: job.location || job.region || job.country || '',
              region: job.region || '',
              country: job.country || '',
              type: job.type || job.employment_type || '',
              salary: job.salary || null,
              experience: job.experience || job.experience_level || '',
              postedDate: job.postedDate || '',
              applicationsCount: job.applicationsCount || 0,
              status: job.status || ''
            })));
          } catch (candidateError) {
            console.error('Error loading candidate counts:', candidateError);
            // Still set jobs even if candidate count fails
            setJobs(data.jobs.map((job: any) => ({
              id: job.id,
              title: job.title,
              candidateCount: 0,
              location: job.location || job.region || job.country || '',
              region: job.region || '',
              country: job.country || '',
              type: job.type || job.employment_type || '',
              salary: job.salary || null,
              experience: job.experience || job.experience_level || '',
              postedDate: job.postedDate || '',
              applicationsCount: job.applicationsCount || 0,
              status: job.status || ''
            })));
          }
        } else {
          setJobs([]);
        }
      } else {
        console.error('Failed to fetch jobs:', response.statusText);
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScreenedCandidates = async () => {
    setIsLoading(true);
    try {
      // Get employer ID from localStorage
      const employerDataStr = localStorage.getItem('employerData');
      if (!employerDataStr) {
        console.error('No employer data found');
        setScreenedCandidates([]);
        return;
      }

      const employerData = JSON.parse(employerDataStr);
      const employerId = employerData.id || employerData.employerId;

      if (!employerId) {
        console.error('No employer ID found');
        setScreenedCandidates([]);
        return;
      }

      // Build API URL - always fetch all candidates, we'll filter on frontend
      // This allows the job filter dropdown to show correct counts
      let apiUrl = `/api/employer/screened-candidates?employerId=${employerId}`;
      // Don't filter by jobId in API - we'll filter on frontend for better UX

      // Fetch from API
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.details || 'Failed to load screened candidates';
        console.error('API Error:', data);
        throw new Error(errorMsg);
      }

      // Map API response to ScreenedCandidate interface
      const mappedCandidates: ScreenedCandidate[] = (data.data || []).map((c: any) => ({
        id: c.id || '',
        candidateId: c.candidateId || '',
        candidateName: c.candidateName || '',
        jobId: c.jobId || '',
        jobTitle: c.jobTitle || '',
        jobLocation: c.jobLocation || '',
        appliedDate: c.appliedDate || '',
        experience: c.experience || 'Not specified',
        resumeUrl: c.resumeUrl || '',
        profilePicture: c.profilePicture || '',
        resumeHeadline: c.resumeHeadline || '',
        profileSummary: c.profileSummary || '',
        nationality: c.nationality || '',
        currentLocation: c.currentLocation || '',
        skills: c.skills || [],
        expectedSalary: c.evaluation?.expectedSalary || '',
        noticePeriod: c.evaluation?.availability || '',
        evaluation: {
          id: c.evaluation?.id || '',
          score: c.evaluation?.score || 0,
          recommendation: c.evaluation?.recommendation || 'partially_meets',
          strengths: c.evaluation?.strengths || '',
          weaknesses: c.evaluation?.weaknesses || '',
          communicationSkills: c.evaluation?.communicationSkills || '',
          technicalSkills: c.evaluation?.technicalSkills || '',
          experience: c.evaluation?.experience || '',
          culturalFit: c.evaluation?.culturalFit || '',
          leadership: c.evaluation?.leadership || '',
          currentSalary: c.evaluation?.currentSalary || '',
          expectedSalary: c.evaluation?.expectedSalary || '',
          availability: c.evaluation?.availability || '',
          interviewerNotes: c.evaluation?.interviewerNotes || '',
          additionalNotes: c.evaluation?.additionalNotes || '',
          interviewerName: c.evaluation?.interviewerName || '',
          submittedAt: c.evaluation?.submittedAt || '',
          interviewDate: c.evaluation?.interviewDate || ''
        },
        status: c.status || 'pending_review',
        coverLetter: c.coverLetter || ''
      }));

      setScreenedCandidates(mappedCandidates);
    } catch (error: any) {
      console.error('Error loading screened candidates:', error);
      setScreenedCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'exceeds': return 'bg-green-100 text-green-800';
      case 'meets': return 'bg-blue-100 text-blue-800';
      case 'partially_meets': return 'bg-yellow-100 text-yellow-800';
      case 'does_not_meet': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-blue-100 text-blue-800';
      case 'interview_again': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'selected': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string | undefined) => {
    if (!rating) return 'text-gray-600 bg-gray-50 border-gray-200';
    switch (rating) {
      case 'outstanding': return 'text-green-600 bg-green-50 border-green-200';
      case 'above_satisfactory': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'satisfactory': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'below_satisfactory': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unsatisfactory': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleCandidateAction = async (candidateId: string, action: 'interview_again' | 'reject' | 'select', notes?: string, interviewData?: any) => {
    try {
      // Send action to API
      const response = await fetch('/api/employer/candidate-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: candidateId,
          action,
          notes,
          interviewData
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process action');
      }

      // Update candidate status locally
      setScreenedCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { 
              ...candidate, 
              status: action === 'interview_again' ? 'interview_again' : action === 'reject' ? 'rejected' : 'selected',
              employerNotes: notes,
              interviewScheduled: interviewData
            }
          : candidate
      ));

      // Close modals
      setShowCandidateModal(false);
      setSelectedCandidate(null);
      setShowInterviewModal(false);

      // Show success message
      alert(`Candidate ${action === 'interview_again' ? 'scheduled for interview' : action === 'reject' ? 'rejected' : 'selected'} successfully!`);
      
      // Reload data to get latest status
      await loadScreenedCandidates();
    } catch (error: any) {
      console.error('Error processing candidate action:', error);
      alert(`Failed to process action: ${error.message || 'Please try again.'}`);
    }
  };

  // Group candidates by job
  const candidatesByJob = screenedCandidates.reduce((acc, candidate) => {
    const jobKey = candidate.jobId || 'unknown';
    if (!acc[jobKey]) {
      acc[jobKey] = {
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        candidates: []
      };
    }
    acc[jobKey].candidates.push(candidate);
    return acc;
  }, {} as Record<string, { jobId: string; jobTitle: string; candidates: ScreenedCandidate[] }>);

  // Filter candidates based on selected job and filters
  const getFilteredCandidates = (candidates: ScreenedCandidate[]) => {
    return candidates.filter(candidate => {
      if (statusFilter !== 'all' && candidate.status !== statusFilter) return false;
      if (searchTerm && !candidate.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  // Get candidates to display - only show candidates when a job is selected
  const filteredCandidates = selectedJobId 
    ? getFilteredCandidates(candidatesByJob[selectedJobId]?.candidates || [])
    : [];

  const candidatesPerPage = 10;
  const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);
  const startIndex = (currentPage - 1) * candidatesPerPage;
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + candidatesPerPage);

  return (
    <EmployerLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {viewMode === 'jobs' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900">Screened Candidates</h1>
              <p className="text-lg text-gray-600">Select a job to view screened candidates</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => {
                    setSelectedJobId(null);
                    setViewMode('jobs');
                    setCurrentPage(1);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Screened Candidates</h1>
              </div>
              <p className="text-lg text-gray-600">
                {jobs.find(j => j.id === selectedJobId)?.title || 'Review evaluated candidates and make hiring decisions'}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {viewMode === 'candidates' && (
            <button
              onClick={loadScreenedCandidates}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Jobs List View */}
      {viewMode === 'jobs' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`job-skeleton-${index}`} className="animate-pulse">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                        <div className="h-5 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : jobs.filter(j => j.candidateCount > 0).length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs with Screened Candidates</h3>
              <p className="text-gray-600">There are no screened candidates available for your jobs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Experience</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.filter(j => j.candidateCount > 0).map((job) => {
                    const formatSalary = () => {
                      if (!job.salary || (!job.salary.min && !job.salary.max)) return null;
                      const currency = job.salary.currency || 'TZS';
                      if (job.salary.min && job.salary.max) {
                        return `${currency} ${Number(job.salary.min).toLocaleString()} - ${Number(job.salary.max).toLocaleString()}`;
                      }
                      if (job.salary.min) return `${currency} ${Number(job.salary.min).toLocaleString()}+`;
                      if (job.salary.max) return `Up to ${currency} ${Number(job.salary.max).toLocaleString()}`;
                      return null;
                    };

                    const formatDate = (dateString?: string) => {
                      if (!dateString) return null;
                      try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      } catch {
                        return null;
                      }
                    };

                    const formatJobType = (type?: string) => {
                      if (!type) return null;
                      return type.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase());
                    };

                    const location = job.location || `${job.region || ''}${job.region && job.country ? ', ' : ''}${job.country || ''}`.trim() || 'N/A';

                    return (
                      <tr
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setViewMode('candidates');
                          setCurrentPage(1);
                        }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#114373] flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">{job.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 capitalize">{formatJobType(job.type) || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-medium">{formatSalary() || 'Not specified'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 capitalize">{job.experience || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDate(job.postedDate) ? `Posted ${formatDate(job.postedDate)}` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#114373] flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {job.candidateCount} {job.candidateCount === 1 ? 'candidate' : 'candidates'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[#114373] font-medium text-sm flex items-center gap-1 hover:text-[#0d3559] transition-colors">
                            View
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Candidates View */}
      {viewMode === 'candidates' && selectedJobId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Screened</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCandidates.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCandidates.filter(c => c.status === 'pending_review' || c.status === 'screened').length}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCandidates.filter(c => c.status === 'selected').length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interview Again</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredCandidates.filter(c => c.status === 'interview_again').length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by candidate name, job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="interview_again">Interview Again</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Evaluation Score</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Evaluation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                // Shimmer loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                        </div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-9 w-20 bg-gray-200 rounded-lg"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <User className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
                      <p className="text-gray-600">No candidates match your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {candidate.profilePicture ? (
                          <img
                            src={candidate.profilePicture}
                            alt={candidate.candidateName}
                            className="h-8 w-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`fallback-avatar h-8 w-8 rounded-full bg-blue-600 items-center justify-center ${candidate.profilePicture ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-xs font-semibold text-white">
                            {candidate.candidateName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{candidate.candidateName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{candidate.jobTitle}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        {candidate.status === 'screened' ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Screened
                          </>
                        ) : (
                          <span className="capitalize">{candidate.status.replace('_', ' ')}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900">{candidate.evaluation.score}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {new Date(candidate.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/employer/screened-candidates/${candidate.id}?candidateId=${candidate.candidateId}&jobId=${candidate.jobId}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Candidate Action Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Candidate Review</h2>
                <button
                  onClick={() => {
                    setShowCandidateModal(false);
                    setSelectedCandidate(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedCandidate.candidateName}</h3>
                <p className="text-sm text-gray-600">{selectedCandidate.jobTitle}</p>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Evaluation Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
                    <p className="text-sm text-green-800">{selectedCandidate.evaluation.strengths}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-medium text-yellow-900 mb-2">Areas for Improvement</h5>
                    <p className="text-sm text-yellow-800">{selectedCandidate.evaluation.weaknesses}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Your Decision</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="select">Select Candidate</option>
                      <option value="interview_again">Interview Again</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={employerNotes}
                      onChange={(e) => setEmployerNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Add your notes about this candidate..."
                    />
                  </div>
                  
                  {action === 'interview_again' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Schedule Additional Interview</h5>
                      <button
                        onClick={() => {
                          setShowInterviewModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Calendar className="w-4 h-4 mr-2 inline" />
                        Schedule Interview
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCandidateModal(false);
                    setSelectedCandidate(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCandidateAction(selectedCandidate.id, action, employerNotes)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors"
                >
                  {action === 'select' ? 'Select Candidate' : 
                   action === 'interview_again' ? 'Schedule Interview' : 'Reject Candidate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interview Scheduling Modal */}
      {showInterviewModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Schedule Additional Interview</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedCandidate.candidateName}</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                >
                  <option value="online">Online</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>
              
              {interviewType === 'online' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                  <input
                    type="url"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              )}
              
              {interviewType === 'in_person' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    placeholder="Office address..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCandidateAction(selectedCandidate.id, 'interview_again', employerNotes, {
                      date: interviewDate,
                      time: interviewTime,
                      type: interviewType,
                      location: interviewLocation,
                      link: interviewLink
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </EmployerLayout>
  );
}

export default function EmployerReviewPortal() {
  return (
    <Suspense fallback={
      <EmployerLayout>
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </EmployerLayout>
    }>
      <EmployerReviewPortalContent />
    </Suspense>
  );
}
