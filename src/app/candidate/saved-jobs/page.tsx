'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CandidateLayout from '@/components/CandidateLayout';
import { 
  Bookmark, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Star, 
  ExternalLink,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface SavedJob {
  id: string;
  savedJobId: number;
  savedAt: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  industry?: string;
  location: string;
  region?: string;
  country?: string;
  jobType: string;
  experience?: string;
  yearsOfExperience?: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    range?: string | null;
  };
  postedDate: string | null;
  deadline: string | null;
  featured: boolean;
  description: string;
  skills: string[];
}

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
      
      if (!token) {
        router.push('/candidate/login?from=/candidate/saved-jobs');
        return;
      }

      const response = await fetch('/api/candidates/saved-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.savedJobs) {
          setSavedJobs(data.savedJobs);
        }
      } else if (response.status === 401) {
        router.push('/candidate/login?from=/candidate/saved-jobs');
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId: string) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('candidateAuthToken');
    if (!token) {
      router.push('/candidate/login');
      return;
    }

    setRemoving(jobId);
    try {
      const response = await fetch(`/api/candidates/saved-jobs?jobId=${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      } else {
        console.error('Failed to remove saved job');
        alert('Failed to remove job. Please try again.');
      }
    } catch (error) {
      console.error('Error removing saved job:', error);
      alert('Failed to remove job. Please try again.');
    } finally {
      setRemoving(null);
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

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Recently';
    const now = new Date();
    const posted = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const formatSalary = (salary: SavedJob['salary']) => {
    if (!salary || (salary.min === 0 && salary.max === 0)) {
      return 'Salary not specified';
    }
    const currency = salary.currency || 'TZS';
    if (salary.range) {
      return salary.range;
    }
    if (salary.min === salary.max) {
      return `${currency} ${salary.min.toLocaleString()}`;
    }
    return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const formatLocation = (job: SavedJob) => {
    const parts: string[] = [];
    if (job.location) parts.push(job.location);
    if (job.region) parts.push(job.region);
    if (job.country) parts.push(job.country);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const filteredJobs = savedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJobType = !filterJobType || job.jobType === filterJobType;
    const locationStr = formatLocation(job).toLowerCase();
    const matchesLocation = !filterLocation || locationStr.includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesJobType && matchesLocation;
  });

  if (loading) {
    return (
      <CandidateLayout>
        <div className="w-full flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#114373]" />
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-gray-600">Your bookmarked job opportunities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{savedJobs.length}</div>
              <div className="text-sm text-gray-600">Total Saved</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {savedJobs.filter(job => (job as any).isRemote || (job as any).workMode === 'remote').length}
              </div>
              <div className="text-sm text-gray-600">Remote Jobs</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {savedJobs.filter(job => job.jobType === 'Full-time').length}
              </div>
              <div className="text-sm text-gray-600">Full-time</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search saved jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
                <input
                  type="text"
                  placeholder="Location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredJobs.length} saved job{filteredJobs.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#114373] focus:border-transparent">
              <option value="saved">Date Saved</option>
              <option value="posted">Date Posted</option>
              <option value="salary">Salary</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>

        {/* Saved Jobs List */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    {((job as any).isRemote || (job as any).workMode === 'remote') && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Remote
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[#114373] font-medium mb-3">{job.company}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {formatLocation(job)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      {formatSalary(job.salary)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {job.postedDate ? getTimeAgo(job.postedDate) : 'Recently'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span className="capitalize">{job.jobType?.replace('-', ' ')}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{job.description}</p>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 4).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          +{job.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>Saved on {formatDate(job.savedAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/candidate/apply/${job.id}`}
                      className="bg-[#114373] text-white px-4 py-2 rounded-md hover:bg-[#0d3559] transition-colors"
                    >
                      Apply Now
                    </Link>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Details
                    </Link>
                    <button 
                      onClick={() => handleRemoveJob(job.id)}
                      disabled={removing === job.id}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {removing === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {savedJobs.length === 0 ? 'No saved jobs yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {savedJobs.length === 0 
                ? 'Start saving jobs you\'re interested in to see them here.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {savedJobs.length === 0 && (
              <Link
                href="/job-search"
                className="bg-[#114373] text-white px-4 py-2 rounded-md hover:bg-[#0d3559] transition-colors inline-block"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
