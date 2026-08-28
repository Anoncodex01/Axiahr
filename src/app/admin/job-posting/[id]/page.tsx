'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  DollarSign,
  Shield,
  Target,
  GraduationCap,
  Award,
  Users,
  Building2,
  Edit,
  Trash2,
  Star,
  Sparkles,
  MessageSquare
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

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      setLogoError(false);
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setLogoError(false);
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const data = await response.json();

      if (data.success && data.job) {
        setJob(data.job);
      } else {
        router.push('/admin/job-posting');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      router.push('/admin/job-posting');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!job) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/job-posting');
      } else {
        alert(data.error || 'Failed to move job to trash');
      }
    } catch (error: any) {
      console.error('Error moving job to trash:', error);
      alert(error.message || 'Failed to move job to trash');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
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
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    const min = salary.min.toLocaleString();
    const max = salary.max.toLocaleString();
    return `${salary.currency || 'TZS'} ${min} - ${max}`;
  };

  const formatPhone = (phone: string, countryCode: string) => {
    if (!phone) return 'N/A';
    return countryCode ? `${countryCode} ${phone}` : phone;
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
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-amber-100 text-amber-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingState message="Loading job details..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/admin/job-posting"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Job Postings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/admin/job-posting"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#114373] transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Back to Job Postings
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                      {job.featured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Featured
                        </span>
                      )}
                      {job.aiEnhanced && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Enhanced
                        </span>
                      )}
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
                  href={`/admin/job-posting?edit=${job.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Requirements ({job.requirements.length})</h2>
                  </div>
                  <ul className="space-y-3">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-orange-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 flex-1 pt-1">{req}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Benefits ({job.benefits.length})</h2>
                  </div>
                  <ul className="space-y-3">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 flex-1">{benefit}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Required Skills ({job.skills.length})</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 rounded-full text-sm font-semibold border border-purple-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {job.adminNotes && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg border border-amber-200 p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Notes</h2>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Details */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Job Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Location</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold">{formatLocation(job.companyCity || '', job.region || '', job.country || '')}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Job Type</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold capitalize">{job.type?.replace('-', ' ') || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Salary Range</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold">{formatSalary(job.salary)}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Experience Level</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold capitalize">{job.experience || 'N/A'}</span>
                    </div>
                  </div>
                  {job.yearsOfExperience && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Years of Experience</label>
                      <div className="text-sm font-semibold text-gray-900">{job.yearsOfExperience}</div>
                    </div>
                  )}
                  {job.education && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Education</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold">{job.education}</span>
                      </div>
                    </div>
                  )}
                  {job.certification && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Certification</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold">{job.certification}</span>
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Posted Date</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold">{formatDate(job.postedDate)}</span>
                    </div>
                  </div>
                  {job.deadline && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Application Deadline</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-semibold">{formatDate(job.deadline)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Status Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Applications</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold">{job.applicationsCount || 0}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Shortlisted</label>
                    <div className="text-sm font-semibold text-gray-900">{job.shortlistedCount || 0}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Hires</label>
                    <div className="text-sm font-semibold text-gray-900">{job.currentHires || 0} / {job.maxHires || 1}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Priority</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        job.priority === 'high' ? 'bg-red-100 text-red-700' :
                        job.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {job.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </div>
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
                    <p className="text-sm font-semibold text-gray-900">{job.companyName || 'N/A'}</p>
                  </div>
                  {job.industry && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Industry</label>
                      <p className="text-sm font-semibold text-gray-900">{job.industry}</p>
                    </div>
                  )}
                  {job.companyBrief && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Company Brief</label>
                      <p className="text-gray-700 text-sm leading-relaxed">{job.companyBrief}</p>
                    </div>
                  )}
                  {job.companyWebsite && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Website</label>
                      <a 
                        href={job.companyWebsite.startsWith('http') ? job.companyWebsite : `https://${job.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#114373] hover:underline flex items-center gap-1 text-sm font-semibold"
                      >
                        <Globe className="w-4 h-4" />
                        {job.companyWebsite}
                      </a>
                    </div>
                  )}
                  {(job.companyCity || job.companyRegion || job.companyCountry) && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Location</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {formatLocation(job.companyCity || '', job.companyRegion || '', job.companyCountry || '')}
                      </div>
                    </div>
                  )}
                  {(job.companyContactPerson || (job.companyContactFirstName && job.companyContactLastName)) && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Person</label>
                      <div className="text-sm font-semibold text-gray-900">
                        {job.companyContactPerson || `${job.companyContactFirstName || ''} ${job.companyContactLastName || ''}`.trim()}
                        {job.companyContactJobTitle && (
                          <span className="text-gray-500 ml-2 font-normal">({job.companyContactJobTitle})</span>
                        )}
                      </div>
                    </div>
                  )}
                  {job.companyEmail && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                      <a 
                        href={`mailto:${job.companyEmail}`}
                        className="text-[#114373] hover:underline flex items-center gap-2 text-sm font-semibold"
                      >
                        <Mail className="w-4 h-4" />
                        {job.companyEmail}
                      </a>
                    </div>
                  )}
                  {job.companyMobilePhone && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Phone</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {formatPhone(job.companyMobilePhone, job.companyMobileCountryCode || '')}
                      </div>
                    </div>
                  )}
                  {job.companyLandlinePhone && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Landline Phone</label>
                      <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {formatPhone(job.companyLandlinePhone, job.companyLandlineCountryCode || '')}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/admin/employers/${job.companyId}`}
                    className="inline-flex items-center gap-2 text-[#114373] hover:text-[#0d3559] text-sm font-semibold mt-4 pt-4 border-t border-gray-200 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Full Company Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Move Job to Trash</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Move this job posting to Job Trash? It will close immediately while the posting and application data remain available for 90 days.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                disabled={deleting}
              >
                {deleting ? 'Moving...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
