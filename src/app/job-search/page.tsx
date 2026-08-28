'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign,
  Banknote, 
  Clock, 
  Building2, 
  Star, 
  Bookmark, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  RefreshCw,
  Globe,
  Briefcase,
  GraduationCap,
  Building,
  Share2
} from 'lucide-react';

interface JobFilters {
  keywords: string;
  location: string;
  experience: string;
  experienceMin: number;
  experienceMax: number;
  salaryMin: number;
  salaryMax: number;
  jobType: string[];
  workMode: string[]; // 'office', 'remote', 'hybrid'
  industry: string;
  functionalArea: string[];
  education: string;
  roleLevel: string;
  companyType: string;
  postedDate: string;
  remoteWork: boolean;
  locations: string[]; // Selected locations
  salaryRanges: string[]; // Selected salary ranges
}

export default function JobSearchPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    keywords: '',
    location: '',
    experience: '',
    experienceMin: 0,
    experienceMax: 30,
    salaryMin: 0,
    salaryMax: 200000,
    jobType: [],
    workMode: [],
    industry: '',
    functionalArea: [],
    education: '',
    roleLevel: '',
    companyType: '',
    postedDate: '',
    remoteWork: false,
    locations: [],
    salaryRanges: []
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [jobCategories, setJobCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showMoreLocations, setShowMoreLocations] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    employmentTypes: { value: string; label: string; count: number }[];
    experienceLevels: { value: string; label: string; count: number }[];
    educationLevels: { value: string; label: string; count: number }[];
    regions: { value: string; label: string; count: number }[];
    countries: { value: string; label: string; count: number }[];
  }>({
    employmentTypes: [],
    experienceLevels: [],
    educationLevels: [],
    regions: [],
    countries: []
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle quick apply
  const handleQuickApply = (jobId: string) => {
    if (!isLoggedIn) {
      router.push(`/candidate/login?from=/job-search&apply=true`);
      return;
    }
    // Check profile completion
    const completionPercent = Number(localStorage.getItem('profileCompletionPercent') || '0');
    if (completionPercent < 80) {
      localStorage.setItem('pendingApply', `/candidate/apply/${jobId}`);
      router.push(`/candidate/profile?incomplete=true&required=80&current=${completionPercent}`);
      return;
    }
    router.push(`/candidate/apply/${jobId}`);
  };

  // Fetch jobs, categories, and filter options from API on component mount
  useEffect(() => {
    fetchJobs();
    fetchJobCategories();
    fetchFilterOptions();
  }, []);

  // Auto-apply filters when they change (with debounce to avoid too many calls)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (jobs.length > 0) {
        applyFilters();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.workMode.length, filters.functionalArea.length, filters.locations.length, filters.salaryRanges.length, filters.experienceMin, filters.experienceMax, filters.jobType.length]);

  const fetchJobCategories = async () => {
    try {
      const response = await fetch('/api/jobs/categories');
      const data = await response.json();
      
      if (data.success && data.categories) {
        setJobCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching job categories:', error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/jobs/filters');
      const data = await response.json();
      
      if (data.success && data.filters) {
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/jobs');
      const data = await response.json();
      
      if (data.success && data.jobs) {
        // Map API response to match the expected job format
        const formattedJobs = data.jobs.map((job: any) => ({
          ...job,
          isSaved: false, // Will be checked from saved jobs if user is logged in
          isRemote: job.jobType === 'remote' || job.location?.toLowerCase().includes('remote')
        }));
        setJobs(formattedJobs);
        setFilteredJobs(formattedJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter options - now using database-driven options
  const workModeOptions = filterOptions.employmentTypes.length > 0 
    ? filterOptions.employmentTypes 
    : [
        { value: 'full-time', label: 'Full Time', count: 0 },
        { value: 'part-time', label: 'Part Time', count: 0 },
        { value: 'contract', label: 'Contract', count: 0 }
      ];

  const locationOptions = filterOptions.regions.length > 0
    ? filterOptions.regions
    : [
        { value: 'Dar es Salaam', label: 'Dar es Salaam', count: 0 },
        { value: 'Arusha', label: 'Arusha', count: 0 },
        { value: 'Mwanza', label: 'Mwanza', count: 0 }
      ];
  
  const experienceLevelOptions = filterOptions.experienceLevels.length > 0
    ? filterOptions.experienceLevels
    : [
        { value: 'entry', label: 'Entry', count: 0 },
        { value: 'mid', label: 'Mid', count: 0 },
        { value: 'senior', label: 'Senior', count: 0 }
      ];
  
  const educationOptions = filterOptions.educationLevels.length > 0
    ? filterOptions.educationLevels.map(opt => ({ value: opt.value, label: opt.label, count: opt.count }))
    : [
        { value: 'high school', label: 'High School', count: 0 },
        { value: 'diploma', label: 'Diploma', count: 0 },
        { value: 'bachelor', label: 'Bachelor', count: 0 }
      ];

  const salaryRangeOptions = [
    { value: '0-500k', label: '0 - 500K TZS', min: 0, max: 500000, count: 0 },
    { value: '500k-1m', label: '500K - 1M TZS', min: 500000, max: 1000000, count: 0 },
    { value: '1m-2m', label: '1M - 2M TZS', min: 1000000, max: 2000000, count: 0 },
    { value: '2m-5m', label: '2M - 5M TZS', min: 2000000, max: 5000000, count: 0 },
    { value: '5m+', label: '5M+ TZS', min: 5000000, max: Infinity, count: 0 }
  ];

  const jobTypeOptions = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const industryOptions = [
    'Information Technology',
    'Finance & Banking',
    'Healthcare',
    'Manufacturing',
    'Retail & E-commerce',
    'Education',
    'Consulting',
    'Media & Entertainment',
    'Real Estate',
    'Transportation & Logistics',
    'Energy & Utilities',
    'Government & Public Sector',
    'Non-profit',
    'Other'
  ];

  const functionalAreaOptions = [
    'Human Resources',
    'Marketing & Sales',
    'Operations',
    'Engineering',
    'Finance & Accounting',
    'Customer Service',
    'Research & Development',
    'Quality Assurance',
    'Project Management',
    'Legal',
    'Administration',
    'Other'
  ];

  const roleLevelOptions = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Manager',
    'Director',
    'Executive',
  ];

  const companyTypeOptions = [
    'Startup',
    'MNC',
    'Private Limited',
    'Public Limited',
    'Government',
    'PSU',
    'NGO',
    'Other'
  ];

  const postedDateOptions = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '3d', label: 'Last 3 days' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' }
  ];

  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);

  const handleFilterChange = (field: keyof JobFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleJobType = (jobType: string) => {
    setFilters(prev => ({
      ...prev,
      jobType: prev.jobType.includes(jobType)
        ? prev.jobType.filter(type => type !== jobType)
        : [...prev.jobType, jobType]
    }));
  };

  // Calculate filter counts from jobs
  useEffect(() => {
    if (jobs.length > 0) {
      // Calculate work mode counts
      const workModeCounts = {
        office: jobs.filter(j => !j.isRemote && j.type !== 'hybrid').length,
        remote: jobs.filter(j => j.isRemote || j.type === 'remote').length,
        hybrid: jobs.filter(j => j.type === 'hybrid').length
      };

      // Calculate location counts
      const locationCounts: Record<string, number> = {};
      jobs.forEach(job => {
        const loc = job.location || job.region || job.country || '';
        locationOptions.forEach(opt => {
          if (loc.toLowerCase().includes(opt.value.toLowerCase())) {
            locationCounts[opt.value] = (locationCounts[opt.value] || 0) + 1;
          }
        });
      });

      // Calculate salary range counts
      const salaryCounts: Record<string, number> = {};
      jobs.forEach(job => {
        salaryRangeOptions.forEach(opt => {
          if (job.salary && job.salary.min >= opt.min && (opt.max === Infinity || job.salary.max <= opt.max)) {
            salaryCounts[opt.value] = (salaryCounts[opt.value] || 0) + 1;
          }
        });
      });
    }

    // Calculate active filter count
    let count = 0;
    if (filters.keywords) count++;
    if (filters.location) count++;
    if (filters.experienceMin > 0 || filters.experienceMax < 30) count++;
    if (filters.workMode.length > 0) count++;
    if (filters.functionalArea.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.salaryRanges.length > 0) count++;
    if (filters.jobType.length > 0) count++;
    setActiveFilterCount(count);
  }, [jobs, filters]);

  const applyFilters = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      let filtered = [...jobs];

      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        filtered = filtered.filter(job =>
          job.title.toLowerCase().includes(keywords) ||
          (job.industry && job.industry.toLowerCase().includes(keywords)) ||
          job.description.toLowerCase().includes(keywords)
        );
      }

      if (filters.location) {
        const location = filters.location.toLowerCase();
        filtered = filtered.filter(job =>
          job.location.toLowerCase().includes(location)
        );
      }

      // Experience range filter - using years_of_experience from database
      if (filters.experienceMin > 0 || filters.experienceMax < 30) {
        filtered = filtered.filter(job => {
          // Parse years_of_experience (could be "2-3" or a number)
          const yearsExp = job.years_of_experience || job.yearsOfExperience || '0';
          let minExp = 0, maxExp = 0;
          
          if (typeof yearsExp === 'string' && yearsExp.includes('-')) {
            const parts = yearsExp.split('-');
            minExp = parseInt(parts[0]) || 0;
            maxExp = parseInt(parts[1]) || 0;
          } else {
            const exp = parseInt(yearsExp) || 0;
            minExp = exp;
            maxExp = exp;
          }
          
          // Check if job's experience range overlaps with filter range
          return maxExp >= filters.experienceMin && minExp <= filters.experienceMax;
        });
      }

      // Employment type filter (work mode) - using employment_type from database
      if (filters.workMode.length > 0) {
        filtered = filtered.filter(job => {
          const jobEmploymentType = (job.employment_type || job.type || '').replace('_', '-');
          return filters.workMode.some(mode => {
            const modeValue = mode.replace('_', '-');
            return jobEmploymentType === modeValue || 
                   (mode === 'remote' && (job.isRemote || jobEmploymentType === 'remote')) ||
                   (mode === 'hybrid' && jobEmploymentType === 'hybrid') ||
                   (mode === 'office' && jobEmploymentType === 'full-time' && !job.isRemote);
          });
        });
      }

      // Job type filter - using employment_type from database
      if (filters.jobType.length > 0) {
        filtered = filtered.filter(job => {
          const jobEmploymentType = (job.employment_type || job.type || '').replace('_', '-');
          return filters.jobType.includes(jobEmploymentType);
        });
      }

      if (filters.industry) {
        filtered = filtered.filter(job => job.industry === filters.industry);
      }

      if (filters.functionalArea.length > 0) {
        filtered = filtered.filter(job => 
          filters.functionalArea.some(area => 
            job.industry && job.industry.toLowerCase().includes(area.toLowerCase())
          )
        );
      }

      // Location filter (multiple) - using region and country from database
      if (filters.locations.length > 0) {
        filtered = filtered.filter(job => {
          const jobRegion = (job.region || '').toLowerCase();
          const jobCountry = (job.country || '').toLowerCase();
          const jobLocation = (job.location || '').toLowerCase();
          return filters.locations.some(loc => {
            const locLower = loc.toLowerCase();
            return jobRegion.includes(locLower) || 
                   jobCountry.includes(locLower) || 
                   jobLocation.includes(locLower);
          });
        });
      }

      // Salary range filter (multiple) - using salary_min and salary_max from database
      if (filters.salaryRanges.length > 0) {
        filtered = filtered.filter(job => {
          return filters.salaryRanges.some(range => {
            const opt = salaryRangeOptions.find(o => o.value === range);
            if (!opt) return false;
            
            // Use salary_min and salary_max from database
            const jobMin = job.salary_min || job.salary?.min || 0;
            const jobMax = job.salary_max || job.salary?.max || 0;
            
            if (jobMin === 0 && jobMax === 0) return false; // No salary info
            
            // Check if job salary range overlaps with filter range
            return jobMax >= opt.min && (opt.max === Infinity || jobMin <= opt.max);
          });
        });
      }

      // Education filter - using education column from database
      if (filters.education) {
        filtered = filtered.filter(job => {
          const jobEducation = (job.education || '').toLowerCase();
          return jobEducation === filters.education.toLowerCase() || 
                 jobEducation.includes(filters.education.toLowerCase());
        });
      }

      // Experience level filter - using experience_level from database
      if (filters.roleLevel) {
        filtered = filtered.filter(job => {
          const jobExpLevel = (job.experience_level || '').toLowerCase();
          return jobExpLevel === filters.roleLevel.toLowerCase();
        });
      }

      if (filters.companyType) {
        filtered = filtered.filter(job => job.companyType === filters.companyType);
      }

      setFilteredJobs(filtered);
      setIsLoading(false);
    }, 500);
  };

  const clearFilters = () => {
    setFilters({
      keywords: '',
      location: '',
      experience: '',
      experienceMin: 0,
      experienceMax: 30,
      salaryMin: 0,
      salaryMax: 200000,
      jobType: [],
      workMode: [],
      industry: '',
      functionalArea: [],
      education: '',
      roleLevel: '',
      companyType: '',
      postedDate: '',
      remoteWork: false,
      locations: [],
      salaryRanges: []
    });
    setFilteredJobs(jobs);
  };

  const toggleWorkMode = (mode: string) => {
    setFilters(prev => ({
      ...prev,
      workMode: prev.workMode.includes(mode)
        ? prev.workMode.filter(m => m !== mode)
        : [...prev.workMode, mode]
    }));
  };

  const toggleLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const toggleSalaryRange = (range: string) => {
    setFilters(prev => ({
      ...prev,
      salaryRanges: prev.salaryRanges.includes(range)
        ? prev.salaryRanges.filter(r => r !== range)
        : [...prev.salaryRanges, range]
    }));
  };

  const toggleDepartment = (dept: string) => {
    setFilters(prev => ({
      ...prev,
      functionalArea: prev.functionalArea.includes(dept)
        ? prev.functionalArea.filter(d => d !== dept)
        : [...prev.functionalArea, dept]
    }));
  };

  const handleCategoryClick = (jobTitle: string) => {
    const newSelected = selectedCategory === jobTitle ? '' : jobTitle;
    setSelectedCategory(newSelected);
    // Set the job title as the search keyword
    setFilters(prev => ({
      ...prev,
      keywords: newSelected ? jobTitle : '',
      industry: '' // Clear industry filter when selecting a job title
    }));
  };

  const handleSaveJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
    ));
    setFilteredJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
    ));
  };

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    if (!salary || !salary.min || !salary.max) return 'Not Disclosed';
    const currency = salary.currency || 'TZS';
    
    // Format TZS with proper formatting
    if (currency === 'TZS') {
      const formatTZS = (amount: number) => {
        if (amount >= 1000000) {
          return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
          return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toLocaleString();
      };
      return `${currency} ${formatTZS(salary.min)} - ${formatTZS(salary.max)}`;
    }
    
    return `${currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    const now = new Date();
    const posted = new Date(dateString);
    
    // Validate date
    if (isNaN(posted.getTime())) return 'Recently';
    
    const diffTime = now.getTime() - posted.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    if (diffYears === 1) return '1 year ago';
    return `${diffYears} years ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Job Title Categories */}
          {jobCategories.length > 0 && (
            <div className="mb-6">
              <div className="bg-orange-50 rounded-xl p-4 overflow-x-auto">
                <div className="flex gap-3 items-center">
                  {jobCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => handleCategoryClick(category.name)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        selectedCategory === category.name
                          ? 'bg-[#114373] text-white shadow-md'
                          : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {category.name}
                      {category.count > 0 && (
                        <span className={`ml-2 text-xs ${selectedCategory === category.name ? 'text-white/80' : 'text-gray-500'}`}>
                          ({category.count})
                        </span>
                      )}
                    </button>
                  ))}
                  {jobCategories.length > 7 && (
                    <button className="flex-shrink-0 w-10 h-10 rounded-full bg-[#114373] text-white flex items-center justify-center hover:bg-[#0d3559] transition-colors">
                      <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, keywords..."
                    value={filters.keywords}
                    onChange={(e) => handleFilterChange('keywords', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={applyFilters}
                className="bg-[#114373] text-white px-6 py-2.5 rounded-lg hover:bg-[#0d3559] transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">All Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-1 bg-[#114373] text-white text-xs font-medium rounded-full">
                      ({activeFilterCount})
                    </span>
                  )}
                </div>

                {/* Experience Slider */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Experience</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>{filters.experienceMin} Yrs</span>
                      <span>{filters.experienceMax} Yrs</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={filters.experienceMax}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFilters(prev => {
                          const newState = { ...prev, experienceMax: value };
                          if (value < prev.experienceMin) {
                            newState.experienceMin = value;
                          }
                          return newState;
                        });
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#114373]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={filters.experienceMin}
                        onChange={(e) => {
                          const value = Math.max(0, Math.min(30, parseInt(e.target.value) || 0));
                          setFilters(prev => {
                            const newState = { ...prev, experienceMin: value };
                            if (value > prev.experienceMax) {
                              newState.experienceMax = value;
                            }
                            return newState;
                          });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      />
                      <span className="self-center text-gray-500">-</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={filters.experienceMax}
                        onChange={(e) => {
                          const value = Math.max(0, Math.min(30, parseInt(e.target.value) || 30));
                          setFilters(prev => {
                            const newState = { ...prev, experienceMax: value };
                            if (value < prev.experienceMin) {
                              newState.experienceMin = value;
                            }
                            return newState;
                          });
                        }}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Type (Work Mode) */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Employment Type</label>
                  <div className="space-y-2">
                    {workModeOptions.map(option => (
                      <label key={option.value} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.workMode.includes(option.value)}
                          onChange={() => toggleWorkMode(option.value)}
                          className="w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373] cursor-pointer"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          {option.label}
                        </span>
                        {option.count > 0 && (
                          <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                {experienceLevelOptions.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Experience Level</label>
                    <div className="space-y-2">
                      {experienceLevelOptions.map(option => (
                        <label key={option.value} className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="experienceLevel"
                            checked={filters.roleLevel === option.value}
                            onChange={() => handleFilterChange('roleLevel', option.value)}
                            className="w-4 h-4 text-[#114373] border-gray-300 focus:ring-[#114373] cursor-pointer"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                            {option.label}
                          </span>
                          {option.count > 0 && (
                            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {educationOptions.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">Education</label>
                    <div className="space-y-2">
                      {educationOptions.map(option => (
                        <label key={option.value} className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="education"
                            checked={filters.education === option.value}
                            onChange={() => handleFilterChange('education', option.value)}
                            className="w-4 h-4 text-[#114373] border-gray-300 focus:ring-[#114373] cursor-pointer"
                          />
                          <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                            {option.label}
                          </span>
                          {option.count > 0 && (
                            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Location</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {locationOptions.slice(0, showMoreLocations ? locationOptions.length : 4).map(option => (
                      <label key={option.value} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.locations.includes(option.value)}
                          onChange={() => toggleLocation(option.value)}
                          className="w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373] cursor-pointer"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          {option.label}
                        </span>
                        {option.count > 0 && (
                          <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}
                    {locationOptions.length > 4 && (
                      <button
                        onClick={() => setShowMoreLocations(!showMoreLocations)}
                        className="text-sm text-[#114373] hover:text-[#0d3559] font-medium mt-2"
                      >
                        {showMoreLocations ? 'View Less' : 'View More'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Salary */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Salary</label>
                  <div className="space-y-2">
                    {salaryRangeOptions.map(option => (
                      <label key={option.value} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.salaryRanges.includes(option.value)}
                          onChange={() => toggleSalaryRange(option.value)}
                          className="w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373] cursor-pointer"
                        />
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                          {option.label}
                        </span>
                        {option.count > 0 && (
                          <span className="ml-auto text-xs text-gray-500">({option.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full mt-4 px-4 py-2 text-sm font-medium text-[#114373] border border-[#114373] rounded-lg hover:bg-[#114373] hover:text-white transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content - Job Listings */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filteredJobs.length > 0 
                      ? `1 - ${Math.min(20, filteredJobs.length)} of ${filteredJobs.length} Jobs`
                      : '0 Jobs'
                    }
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent">
                    <option>Relevance</option>
                    <option>Date Posted</option>
                    <option>Salary: High to Low</option>
                    <option>Salary: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading jobs...</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                      filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                            {job.companyLogo ? (
                              <img src={job.companyLogo} alt={job.companyName || 'Company'} className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full bg-[#114373] flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-[#114373] cursor-pointer">
                                <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">{job.companyName || job.industry || 'N/A'}</p>
                            </div>
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('authToken');
                                if (!token) {
                                  router.push(`/candidate/login?from=/job-search`);
                                  return;
                                }
                                handleSaveJob(job.id);
                              }}
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-[#114373] transition-colors"
                              title={job.isSaved ? 'Saved' : 'Save job'}
                            >
                              <Bookmark className={`w-5 h-5 ${job.isSaved ? 'fill-current text-[#114373]' : ''}`} />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span className="capitalize">{job.type?.replace('-', ' ') || 'Full Time'}</span>
                            </div>
                            {job.experience && (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                <span>{job.experience}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">
                                {(() => {
                                  // If location is already a joined string from API, use it but deduplicate
                                  if (job.location && typeof job.location === 'string') {
                                    // Split by comma and deduplicate
                                    const parts = job.location.split(',').map((p: string) => p.trim()).filter(Boolean);
                                    const uniqueParts: string[] = [];
                                    
                                    for (const part of parts) {
                                      // Check if this part is not already contained in any existing unique part
                                      const isDuplicate = uniqueParts.some(existing => 
                                        existing.toLowerCase() === part.toLowerCase() ||
                                        existing.toLowerCase().includes(part.toLowerCase()) ||
                                        part.toLowerCase().includes(existing.toLowerCase())
                                      );
                                      
                                      if (!isDuplicate) {
                                        uniqueParts.push(part);
                                      }
                                    }
                                    
                                    return uniqueParts.length > 0 ? uniqueParts.join(', ') : 'N/A';
                                  }
                                  
                                  // Fallback: construct from separate fields with deduplication
                                  const parts: string[] = [];
                                  const normalize = (str: string) => str.trim().toLowerCase();
                                  
                                  if (job.location) {
                                    const loc = job.location.trim();
                                    if (!parts.some(p => normalize(p) === normalize(loc) || normalize(p).includes(normalize(loc)) || normalize(loc).includes(normalize(p)))) {
                                      parts.push(loc);
                                    }
                                  }
                                  
                                  if (job.region) {
                                    const reg = job.region.trim();
                                    const isDuplicate = parts.some(p => 
                                      normalize(p) === normalize(reg) || 
                                      normalize(p).includes(normalize(reg)) || 
                                      normalize(reg).includes(normalize(p))
                                    );
                                    if (!isDuplicate) {
                                      parts.push(reg);
                                    }
                                  }
                                  
                                  if (job.country) {
                                    const cnt = job.country.trim();
                                    const isDuplicate = parts.some(p => 
                                      normalize(p) === normalize(cnt) || 
                                      normalize(p).includes(normalize(cnt)) || 
                                      normalize(cnt).includes(normalize(p))
                                    );
                                    if (!isDuplicate) {
                                      parts.push(cnt);
                                    }
                                  }
                                  
                                  return parts.length > 0 ? parts.join(', ') : 'N/A';
                                })()}
                              </span>
                            </div>
                            {job.salary && (
                              <div className="flex items-center gap-1">
                                <Banknote className="w-4 h-4" />
                                <span>{formatSalary(job.salary)}</span>
                              </div>
                            )}
                            {job.postedDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{getTimeAgo(job.postedDate)}</span>
                              </div>
                            )}
                          </div>

                          {job.description && (
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>
                          )}

                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {job.skills.slice(0, 5).map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-sm font-medium text-[#114373] hover:text-[#0d3559] transition-colors"
                            >
                              View Details →
                            </Link>
                            {isLoggedIn && (
                              <button
                                onClick={() => handleQuickApply(job.id)}
                                className="px-4 py-2 bg-gradient-to-r from-[#114373] to-[#1e5a8a] text-white text-sm font-medium rounded-lg hover:from-[#0d3559] hover:to-[#114373] transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                Apply Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

