'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Briefcase,
  ArrowLeft,
  MapPin,
  Banknote,
  Clock,
  FileText,
  CheckCircle,
  Star,
  GraduationCap,
  Award,
  Users,
  Calendar,
  Bookmark,
  Share2,
  ExternalLink,
  Building2
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import { getCountryOptions, getStateOptions } from '@/utils/locationData';
import { isProfileComplete, getProfileCompletionPercent, PROFILE_COMPLETION_THRESHOLD } from '@/utils/profileCompletion';

interface Job {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  industry: string;
  companyBrief: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyContactPerson?: string;
  companyContactFirstName?: string;
  companyContactLastName?: string;
  companyContactJobTitle?: string;
  companyEmail?: string;
  companyMobilePhone?: string;
  companyMobileCountryCode?: string;
  companyLandlinePhone?: string;
  companyLandlineCountryCode?: string;
  companyCity?: string;
  companyRegion?: string;
  companyCountry?: string;
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
  yearsOfExperience: string;
  education: string;
  certification: string;
  postedDate: string | null;
  deadline: string | null;
  featured: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
}

interface SimilarJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  isEndToEnd?: boolean;
  location: string;
  jobType: string;
  experience: string;
  yearsOfExperience?: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    range?: string | null;
  };
  postedDate: string | null;
  applicationsCount: number;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      setLogoError(false);
      checkSavedStatus();
      fetchSimilarJobs();
      if (typeof window !== 'undefined') {
        setShareUrl(`${window.location.origin}/jobs/${jobId}`);
      }
    }
  }, [jobId]);

  // Check authentication status and update in real-time
  useEffect(() => {
    const checkAuthentication = () => {
      if (typeof window === 'undefined') return false;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('candidateAuthToken');
      const candidateUser = localStorage.getItem('candidateUser');
      const candidateData = localStorage.getItem('candidateData');
      const isAuth = !!(token && (candidateUser || candidateData));
      setIsAuthenticated(isAuth);
      return isAuth;
    };

    // Check immediately on mount
    checkAuthentication();
    
    // Check periodically to catch login/logout events (every 500ms)
    const interval = setInterval(checkAuthentication, 500);
    
    // Listen for storage changes (cross-tab sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuthentication);
    }
    
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', checkAuthentication);
      }
    };
  }, [pathname]); // Re-check when pathname changes

  const fetchJob = async () => {
    if (!jobId) {
      setLoading(false);
      router.push('/job-search');
      return;
    }

    try {
      setLoading(true);
      setLogoError(false);
      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch job:', response.status, response.statusText);
        setLoading(false);
        setJob(null);
        return;
      }

      const data = await response.json();

      if (data.success && data.job) {
        setJob(data.job);
      } else {
        console.error('Job not found or invalid response:', data);
        setJob(null);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
    if (!token) {
      setIsSaved(false);
      return;
    }

    try {
      const response = await fetch('/api/candidates/saved-jobs');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.savedJobs) {
          const saved = data.savedJobs.some((savedJob: any) => savedJob.id === jobId);
          setIsSaved(saved);
          // Store all saved job IDs for similar jobs
          const savedIds = new Set<string>(data.savedJobs.map((sj: any) => sj.id as string));
          setSavedJobIds(savedIds);
        }
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const fetchSimilarJobs = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/similar`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.similarJobs) {
          setSimilarJobs(data.similarJobs);
        }
      }
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const handleSaveSimilarJob = async (similarJobId: string) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
    if (!token) {
      router.push(`/candidate/login?from=/jobs/${similarJobId}`);
      return;
    }

    const isCurrentlySaved = savedJobIds.has(similarJobId);
    
    try {
      if (isCurrentlySaved) {
        // Unsave
        const response = await fetch(`/api/candidates/saved-jobs?jobId=${similarJobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setSavedJobIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(similarJobId);
            return newSet;
          });
        }
      } else {
        // Save
        const response = await fetch('/api/candidates/saved-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId: similarJobId }),
        });

        if (response.ok) {
          setSavedJobIds(prev => new Set(prev).add(similarJobId));
        }
      }
    } catch (error) {
      console.error('Error saving similar job:', error);
    }
  };

  const handleSaveJob = async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
    if (!token) {
      router.push(`/candidate/login?from=/jobs/${jobId}`);
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        // Unsave the job
        const response = await fetch(`/api/candidates/saved-jobs?jobId=${jobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
        setIsSaved(false);
        } else {
          console.error('Failed to unsave job');
        }
      } else {
        // Save the job
        const response = await fetch('/api/candidates/saved-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId }),
        });

        if (response.ok) {
        setIsSaved(true);
        } else {
          console.error('Failed to save job');
        }
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    // You could show a toast notification here
    alert('Link copied to clipboard!');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this job: ${job?.title}`);
    const body = encodeURIComponent(`I found this job opportunity that might interest you:\n\n${job?.title}\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out this job: ${job?.title} - ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out this job: ${job?.title}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleApply = async () => {
    if (!job) return;

    const deadlineDate = job.deadline ? new Date(job.deadline) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineHasPassed = !!deadlineDate && deadlineDate < today;
    const jobUnavailable = ['closed', 'expired', 'filled', 'paused', 'rejected'].includes(job.status) || deadlineHasPassed;

    if (jobUnavailable) {
      return;
    }

    // Re-check authentication status
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('candidateAuthToken');
    const candidateUser = localStorage.getItem('candidateUser');
    const candidateData = localStorage.getItem('candidateData');
    
    if (!token || (!candidateUser && !candidateData)) {
      // Not authenticated - redirect to register (create account)
      router.push(`/candidate/register?from=/jobs/${jobId}&apply=true`);
      return;
    }

    // Check if token is valid by trying to get candidate data
    try {
      const candidateDataStr = localStorage.getItem('candidateData');
      const candidateUserStr = localStorage.getItem('candidateUser');
      
      let candidateId: string | null = null;
      
      if (candidateDataStr) {
        try {
          const data = JSON.parse(candidateDataStr);
          candidateId = data.id || data.candidateId;
        } catch {}
      }
      
      if (!candidateId && candidateUserStr) {
        try {
          const data = JSON.parse(candidateUserStr);
          candidateId = data.id;
        } catch {}
      }

      if (!candidateId) {
        // Token exists but no candidate ID - redirect to login
        router.push(`/candidate/login?from=/jobs/${jobId}&apply=true`);
        return;
      }

      // Check profile completion before allowing application
      if (!isProfileComplete()) {
        // Store the job ID to redirect back after profile completion
        localStorage.setItem('pendingApply', `/candidate/apply/${jobId}`);
        // Redirect to profile page with a message
        router.push(`/candidate/profile?incomplete=true&required=${PROFILE_COMPLETION_THRESHOLD}&current=${getProfileCompletionPercent()}`);
        return;
      }

      // User is logged in and profile is complete - go to application form
      router.push(`/candidate/apply/${jobId}`);
    } catch (error) {
      // Error checking auth - redirect to login
      router.push(`/candidate/login?from=/jobs/${jobId}&apply=true`);
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

  const formatSalary = (salary: Job['salary']) => {
    if (!salary || (salary.min === 0 && salary.max === 0)) {
      return 'Salary not specified';
    }
    const currency = salary.currency || 'TZS';
    if (salary.min === salary.max) {
      return `${currency} ${salary.min.toLocaleString()}`;
    }
    return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const formatLocation = (city: string, region: string, country: string) => {
    const parts: string[] = [];
    
    if (city) parts.push(city);
    
    if (region) {
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      if (countryObj) {
        const states = getStateOptions(countryObj.value);
        const stateObj = states.find(s => s.value === region || s.label === region);
        parts.push(stateObj ? stateObj.label : region);
      } else {
        parts.push(region);
      }
    }
    
    if (country) {
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      parts.push(countryObj ? countryObj.label : country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
          </div>

          {/* Main Header Card Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-200 animate-shimmer"></div>
                  <div className="flex-1">
                    <div className="h-8 w-3/4 bg-gray-200 rounded mb-2 animate-shimmer"></div>
                    <div className="h-5 w-1/2 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-32 bg-gray-200 rounded-xl animate-shimmer"></div>
                <div className="h-12 w-24 bg-gray-200 rounded-xl animate-shimmer"></div>
                <div className="h-12 w-24 bg-gray-200 rounded-xl animate-shimmer"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Description Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-48 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-4/5 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>

              {/* Requirements Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-40 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5 animate-shimmer"></div>
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-32 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5 animate-shimmer"></div>
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-44 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-24 bg-gray-200 rounded-lg animate-shimmer"></div>
                  ))}
                </div>
              </div>

              {/* Job Overview Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-40 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded mt-0.5 animate-shimmer"></div>
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-1 animate-shimmer"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-shimmer"></div>
                  <div className="h-7 w-24 bg-gray-200 rounded animate-shimmer"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Similar Jobs Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-shimmer"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 animate-shimmer"></div>
                        <div className="flex-1">
                          <div className="h-5 w-3/4 bg-gray-200 rounded mb-2 animate-shimmer"></div>
                          <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-shimmer"></div>
                          <div className="flex gap-2 mb-2">
                            <div className="h-5 w-16 bg-gray-200 rounded animate-shimmer"></div>
                            <div className="h-5 w-16 bg-gray-200 rounded animate-shimmer"></div>
                          </div>
                          <div className="h-3 w-24 bg-gray-200 rounded animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/job-search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors"
            >
              Go to Job Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deadlineDate = job.deadline ? new Date(job.deadline) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineHasPassed = !!deadlineDate && deadlineDate < today;
  const jobUnavailable = ['closed', 'expired', 'filled', 'paused', 'rejected'].includes(job.status) || deadlineHasPassed;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md flex-shrink-0 bg-white flex items-center justify-center">
                  <img 
                    src="/logo11.png" 
                    alt="Axia HR"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center gap-3 mb-2">
                    {job.industry && (
                      <span className="text-lg font-semibold text-gray-700">{job.industry}</span>
                    )}
                    {job.featured && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{formatLocation(job.companyCity || '', job.region || '', job.country || '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-gray-400" />
                  <span>{formatSalary(job.salary)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{job.postedDate ? getTimeAgo(job.postedDate) : 'Recently'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span className="capitalize">{job.type?.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {jobUnavailable ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-600 rounded-lg font-semibold shadow-sm cursor-not-allowed"
                >
                  <Calendar className="w-5 h-5" />
                  {deadlineHasPassed || job.status === 'expired' ? 'Applications Closed' : 'Vacancy Closed'}
                </button>
              ) : isAuthenticated ? (
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-all font-semibold shadow-sm hover:shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  Apply Now
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push(`/candidate/register?from=/jobs/${jobId}&apply=true`)}
                    className="px-6 py-3 bg-white text-[#114373] border-2 border-[#114373] rounded-lg hover:bg-[#114373]/5 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    Register to apply
                  </button>
                  <button
                    onClick={() => router.push(`/candidate/login?from=/jobs/${jobId}&apply=true`)}
                    className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    Login to apply
                  </button>
                </>
              )}
              
              {/* Icon-only buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveJob}
                  disabled={saving}
                  className={`p-3 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSaved
                      ? 'bg-[#114373] text-white'
                      : 'bg-white text-[#114373] border-2 border-gray-300 hover:border-[#114373]'
                  }`}
                  title={isSaved ? 'Saved' : 'Save job'}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                  title="Share job"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#114373]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Benefits</h2>
                </div>
                <ul className="space-y-3">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Required Skills</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Job Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Job Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{job.type?.replace('-', ' ')}</p>
                  </div>
                </div>
                {job.experience && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Experience Level</p>
                      <p className="font-semibold text-gray-900 capitalize">{job.experience}</p>
                    </div>
                  </div>
                )}
                {job.yearsOfExperience && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Years of Experience</p>
                      <p className="font-semibold text-gray-900">{job.yearsOfExperience}</p>
                    </div>
                  </div>
                )}
                {job.education && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Education</p>
                      <p className="font-semibold text-gray-900">{job.education}</p>
                    </div>
                  </div>
                )}
                {job.postedDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Posted Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(job.postedDate)}</p>
                    </div>
                  </div>
                )}
                {job.deadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Application Deadline</p>
                      <p className="font-semibold text-gray-900">{formatDate(job.deadline)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About Company */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">About</h2>
              </div>
              <div className="space-y-4">
                {job.companyBrief && (
                  <p className="text-sm text-gray-700 leading-relaxed">{job.companyBrief}</p>
                )}
                {job.industry && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Industry</p>
                    <p className="text-sm font-semibold text-gray-900">{job.industry}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Similar Jobs</h3>
                <div className="space-y-4">
                  {similarJobs.map((similarJob) => {
                    const isSaved = savedJobIds.has(similarJob.id);
                    const formatSalary = (salary: SimilarJob['salary']) => {
                      if (!salary || (salary.min === 0 && salary.max === 0)) {
                        return null;
                      }
                      const currency = salary.currency || 'TZS';
                      if (salary.range) return salary.range;
                      if (salary.min === salary.max) {
                        return `${currency} ${salary.min.toLocaleString()}`;
                      }
                      return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
                    };

                    const getTimeAgo = (dateString: string | null) => {
                      if (!dateString) return 'Recently';
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                      
                      if (diffInSeconds < 60) return 'Just now';
                      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
                      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
                      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
                      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
                      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
                    };

                    return (
                      <Link
                        key={similarJob.id}
                        href={`/jobs/${similarJob.id}`}
                        className="block p-4 border border-gray-200 rounded-xl hover:border-[#114373] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Company Logo */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
                            {similarJob.isEndToEnd ? (
                              <img
                                src="/logo11.png"
                                alt="Axia HR Advisory"
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : similarJob.companyLogo ? (
                              <img
                                src={similarJob.companyLogo}
                                alt={similarJob.company}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${similarJob.isEndToEnd || similarJob.companyLogo ? 'hidden' : ''} w-full h-full bg-gradient-to-br from-[#114373] to-[#1a4d7a] flex items-center justify-center`}>
                              <span className="text-white font-bold text-sm">
                                {similarJob.company.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-[#114373] transition-colors line-clamp-1">
                                {similarJob.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSaveSimilarJob(similarJob.id);
                                }}
                                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Bookmark
                                  className={`w-4 h-4 ${
                                    isSaved
                                      ? 'fill-[#114373] text-[#114373]'
                                      : 'text-gray-400'
                                  }`}
                                />
                              </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {similarJob.company} • {similarJob.location}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md capitalize">
                                {similarJob.jobType?.replace('-', ' ')}
                              </span>
                              {similarJob.experience && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md capitalize">
                                  {similarJob.experience}
                                </span>
                              )}
                              {similarJob.yearsOfExperience && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md">
                                  {similarJob.yearsOfExperience}
                                </span>
                              )}
                            </div>

                            {/* Footer Info */}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{getTimeAgo(similarJob.postedDate)}</span>
                              {similarJob.applicationsCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{similarJob.applicationsCount} Applicants</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Share Job</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* URL Copy */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
                >
                  Copy
                </button>
              </div>

              {/* Social Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareViaEmail}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Email
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={shareViaLinkedIn}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
                <button
                  onClick={shareViaTwitter}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
