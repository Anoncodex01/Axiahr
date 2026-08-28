'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  User,
  DollarSign,
  Shield,
  FileCheck,
  ExternalLink,
  Edit,
  Trash2,
  Star,
  Sparkles,
  Target,
  GraduationCap,
  Award,
  Users,
  Building2,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import { getCountryOptions, getStateOptions } from '@/utils/locationData';

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
  applicationsCount: number;
  shortlistedCount: number;
  aiEnhanced: boolean;
  featured: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
  maxHires: number;
  currentHires: number;
  priority: string;
  adminNotes: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function JobReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      setLogoError(false); // Reset logo error when fetching new job
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setLogoError(false); // Reset logo error when fetching new job
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          setJob(data.job);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (action: 'approve' | 'reject' | 'revision') => {
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!job) return;
    
    setSubmitting(true);
    try {
      let endpoint = '';
      if (reviewAction === 'approve') {
        endpoint = `/api/admin/jobs/${job.id}/approve`;
      } else if (reviewAction === 'reject') {
        endpoint = `/api/admin/jobs/${job.id}/reject`;
      } else if (reviewAction === 'revision') {
        endpoint = `/api/admin/jobs/${job.id}/request-revision`;
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
        // Refresh job data
        await fetchJob();
        setShowReviewModal(false);
        setReviewNotes('');
        // Optionally redirect back to job reviews list
        // router.push('/admin/job-reviews');
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

  const formatSalary = (salary: Job['salary']) => {
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

  const formatLocation = (city: string, region: string, country: string) => {
    const parts: string[] = [];
    
    if (city) parts.push(city);
    
    if (region) {
      // Try to convert region code to name if it's a code
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
      // Try to convert country code to name if it's a code
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      parts.push(countryObj ? countryObj.label : country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingState />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/admin/job-reviews"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Job Reviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link
            href="/admin/job-reviews"
            className="inline-flex items-center gap-2 text-[#114373] hover:text-[#0d3559] mb-6 transition-colors font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Job Reviews
          </Link>
        </div>

        {/* Main Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {job.companyLogo && !logoError ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md flex-shrink-0 relative">
                    <img 
                      src={job.companyLogo} 
                      alt={job.companyName}
                      className="w-full h-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#114373]" />
                  </div>
                  <span className="font-medium text-gray-900">{job.companyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span>{formatLocation(job.companyCity || '', job.region || '', job.country || '')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/job-posting/${job.id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              {job.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReview('approve')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview('revision')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <FileText className="w-4 h-4" />
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleReview('reject')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {job.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleReview('approve')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview('reject')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Requirements</h2>
                </div>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#114373] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700 leading-relaxed flex-1">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Benefits</h2>
                </div>
                <ul className="space-y-3">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 leading-relaxed flex-1">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Required Skills</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-100 hover:shadow-md transition-shadow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes (if exists) */}
            {job.adminNotes && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg border-2 border-amber-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-amber-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Admin Notes</h2>
                </div>
                <div className="bg-white/60 rounded-xl p-6 border border-amber-200">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{job.adminNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Job Details</h3>
              </div>
              <div className="space-y-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Salary Range</label>
                  <p className="text-lg font-bold text-gray-900">{formatSalary(job.salary)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Job Type</label>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{job.type.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Experience</label>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{job.experience || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Education</label>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{job.education || 'Not specified'}</p>
                </div>
                {job.yearsOfExperience && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Years of Experience</label>
                    <p className="text-sm font-semibold text-gray-900">{job.yearsOfExperience}</p>
                  </div>
                )}
                {job.certification && job.certification !== 'none' && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Certification</label>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{job.certification}</p>
                  </div>
                )}
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Application Deadline</label>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(job.deadline)}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500">Priority</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    job.priority === 'high' ? 'bg-red-100 text-red-700' :
                    job.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {job.priority?.toUpperCase() || 'MEDIUM'}
                  </span>
                </div>
                {job.featured && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                    <Star className="w-5 h-5 text-yellow-600 fill-current" />
                    <span className="text-sm font-semibold text-yellow-800">Featured Job</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                {job.companyLogo && !logoError ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                    <img 
                      src={job.companyLogo} 
                      alt={job.companyName}
                      className="w-full h-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">Company Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Company Name</label>
                  <p className="text-sm font-semibold text-gray-900">{job.companyName}</p>
                </div>
                {job.industry && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Industry</label>
                    <p className="text-sm font-semibold text-gray-900">{job.industry}</p>
                  </div>
                )}
                {job.companyContactPerson && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Person</label>
                    <p className="text-sm font-semibold text-gray-900">{job.companyContactPerson}</p>
                  </div>
                )}
                {job.companyEmail && (
                  <a href={`mailto:${job.companyEmail}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-gray-500 block">Email</label>
                      <p className="text-sm font-semibold text-[#114373] truncate">{job.companyEmail}</p>
                    </div>
                  </a>
                )}
                {job.companyMobilePhone && (
                  <a href={`tel:${job.companyMobilePhone}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-semibold text-gray-500 block">Phone</label>
                      <p className="text-sm font-semibold text-green-700">{job.companyMobilePhone}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Job Status Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Status Information</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Created</label>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(job.createdAt)}</p>
                </div>
                {job.postedDate && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Posted</label>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(job.postedDate)}</p>
                  </div>
                )}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Last Updated</label>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(job.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
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
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h4>
                <p className="text-gray-600">{job.companyName} - {job.region}, {job.country}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {reviewAction === 'approve' ? 'Notes (Optional)' : 'Notes *'}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder={`Add notes for ${reviewAction === 'approve' ? 'approval' : reviewAction === 'reject' ? 'rejection' : 'revision request'}...`}
                  required={reviewAction !== 'approve'}
                />
                {reviewAction === 'revision' && (
                  <p className="mt-2 text-xs text-gray-500">
                    These notes will be visible to the employer to help them make the necessary revisions.
                  </p>
                )}
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
    </>
  );
}

