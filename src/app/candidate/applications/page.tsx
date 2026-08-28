'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CandidateLayout from '@/components/CandidateLayout';
import LoadingState from '@/components/LoadingState';
import { 
  FileText, 
  CheckCircle, 
  Calendar, 
  Eye, 
  MapPin,
  DollarSign,
  MoreHorizontal,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Filter,
  Search,
  Download,
  Mail,
  Phone,
  ExternalLink,
  Briefcase,
  X
} from 'lucide-react';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyIndustry: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'screened' | 'selected' | 'rejected' | 'withdrawn';
  location: string;
  salary: string;
  jobType: string;
  description: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get candidate ID from localStorage
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
        console.error('No candidate ID found');
        setLoading(false);
        return;
      }

      // Fetch applications for this candidate
      const response = await fetch(`/api/applications?candidateId=${candidateId}`);
      const data = await response.json();

      if (data.success && data.applications) {
        // Map API response to UI format
        const mappedApplications = data.applications.map((app: any) => {
          // Format salary - prefer job salary range, fallback to expected salary
          let salaryDisplay = 'Not specified';
          if (app.job_salary_min && app.job_salary_max) {
            const currency = app.job_salary_currency || 'TZS';
            salaryDisplay = `${currency} ${app.job_salary_min.toLocaleString()} - ${app.job_salary_max.toLocaleString()}`;
          } else if (app.expected_salary) {
            salaryDisplay = `${app.expected_salary} ${app.salary_currency || 'TZS'}`;
          }

          // Format job type
          const jobType = app.job_employment_type 
            ? app.job_employment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : 'Full-time';

          return {
            id: app.id.toString(),
            jobId: app.job_id?.toString() || '',
            jobTitle: app.job_title || 'N/A',
            company: app.company_name || 'N/A',
            companyIndustry: app.company_industry || '',
            appliedDate: app.applied_date || app.created_at || '',
            status: app.status || 'pending',
            location: app.job_location || 'N/A',
            salary: salaryDisplay,
            jobType: jobType,
            description: app.cover_letter || app.description || '',
            coverLetter: app.cover_letter || '',
            resumeUrl: app.resume_url || ''
          };
        });
        
        setApplications(mappedApplications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-indigo-100 text-indigo-800';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'screened':
        return 'bg-cyan-100 text-cyan-800';
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
        return <FileText className="w-4 h-4" />;
      case 'shortlisted':
        return <CheckSquare className="w-4 h-4" />;
      case 'interviewed':
        return <Calendar className="w-4 h-4" />;
      case 'screened':
        return <CheckCircle className="w-4 h-4" />;
      case 'selected':
        return <ThumbsUp className="w-4 h-4" />;
      case 'rejected':
        return <ThumbsDown className="w-4 h-4" />;
      case 'withdrawn':
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'reviewed':
        return 'Reviewed';
      case 'shortlisted':
        return 'Shortlisted';
      case 'interviewed':
        return 'Interviewed';
      case 'screened':
        return 'Screened';
      case 'selected':
        return 'Selected';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatSalary = (salary: string) => {
    if (!salary || salary === 'Not specified') return 'Not specified';
    return salary;
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.companyIndustry?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    selected: applications.filter(app => app.status === 'selected').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div className="w-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingState message="Loading your applications..." />
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600">Track and manage your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{application.jobTitle}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {getStatusLabel(application.status)}
                      </div>
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-[#114373] font-medium">{application.company}</p>
                    {application.companyIndustry && (
                      <p className="text-sm text-gray-500">{application.companyIndustry}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {application.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      {formatSalary(application.salary)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Applied {formatDate(application.appliedDate)}
                    </div>
                  </div>

                  <div className="text-sm mb-4">
                    <span className="font-medium text-gray-700">Job Type:</span> <span className="text-gray-900 capitalize">{application.jobType?.replace('-', ' ') || 'N/A'}</span>
                  </div>

                  {application.coverLetter && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{application.coverLetter}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {application.jobId && (
                      <Link
                        href={`/jobs/${application.jobId}`}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-[#114373] hover:bg-[#114373] hover:text-white border border-[#114373] rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Job
                      </Link>
                    )}
                    {application.resumeUrl && (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        View Resume
                      </a>
                    )}
                    {(application.status === 'shortlisted' || application.status === 'interviewed') && (
                      <button className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:bg-green-50 border border-green-300 rounded-md transition-colors">
                        <Mail className="w-4 h-4" />
                        Contact HR
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'You haven\'t applied to any jobs yet.'
              }
            </p>
            <Link
              href="/job-search"
              className="inline-block bg-[#114373] text-white px-4 py-2 rounded-md hover:bg-[#0d3559] transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
