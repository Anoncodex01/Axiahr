'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';
import LoadingState from '@/components/LoadingState';
import { checkForBarredWords, WordCheckResult } from '@/utils/wordChecker';
import WordCheckWarning from '@/components/WordCheckWarning';

interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  region: string;
  country: string;
  type: string;
  status: 'draft' | 'pending' | 'published' | 'paused' | 'closed' | 'expired' | 'rejected';
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
  description: string;
  requirements: string[];
  benefits: string[];
  adminNotes?: string;
}

// Function to capitalize education qualifications
function formatEducation(education: string | null | undefined): string {
  if (!education) return '';
  
  // Convert to lowercase first, then capitalize first letter
  const lowercased = education.toLowerCase().trim();
  
  // Capitalize first letter
  const capitalized = lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  
  return capitalized;
}

function EmployerJobPostingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [hasAgreement, setHasAgreement] = useState<boolean | null>(null);
  const [checkingAgreement, setCheckingAgreement] = useState(true);
  const [wordCheckResult, setWordCheckResult] = useState<WordCheckResult | null>(null);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [designations, setDesignations] = useState<string[]>([]);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(true);
  const [titleSearchTerm, setTitleSearchTerm] = useState('');
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // Location states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [regionSearchTerm, setRegionSearchTerm] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    region: '',
    country: '',
    type: 'full-time',
    salary: {
      min: '',
      max: '',
      currency: 'TZS'
    },
    experience: '',
    yearsOfExperience: '',
    education: '',
    certification: '',
    customCertification: '',
    deadline: '',
    description: '',
    requirements: '',
    benefits: '',
    priority: 'medium',
    skills: ''
  });
  const [skillsArray, setSkillsArray] = useState<string[]>([]);

  // Check for signed agreement
  useEffect(() => {
    const checkAgreement = async () => {
      try {
        setCheckingAgreement(true);
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) {
          router.push('/employer/login');
          return;
        }

        const response = await fetch('/api/employers/agreements', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.agreements) {
            // Check if there's at least one signed agreement
            const signedAgreement = data.agreements.find((agreement: any) => 
              agreement.status === 'signed' || agreement.status === 'approved'
            );
            setHasAgreement(!!signedAgreement);
          } else {
            setHasAgreement(false);
          }
        } else {
          setHasAgreement(false);
        }
      } catch (error) {
        console.error('Error checking agreement:', error);
        setHasAgreement(false);
      } finally {
        setCheckingAgreement(false);
      }
    };

    checkAgreement();
  }, [router]);

  // Load company information
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        setLoadingCompany(true);
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) {
          router.push('/employer/login');
          return;
        }

        const response = await fetch('/api/employers/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCompanyInfo(data.data);
            // Pre-fill location from company profile
            setFormData(prev => ({
              ...prev,
              country: data.data.country || '',
              region: data.data.state || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadCompanyInfo();
  }, [router]);

  // Load designations
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        setIsLoadingDesignations(true);
        const response = await fetch('/api/designations');
        
        if (response.ok) {
          const csvContent = await response.text();
          const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
          const designationsList: string[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('---') && line !== 'Designation') {
              const designation = line.replace(/^["']|["']$/g, '').trim();
              if (designation && designation.length > 0) {
                designationsList.push(designation);
              }
            }
          }
          setDesignations(designationsList);
        }
      } catch (error) {
        console.error('Error loading designations:', error);
        setDesignations([
          'Software Engineer',
          'Senior Software Engineer',
          'Full Stack Developer',
          'Frontend Developer',
          'Backend Developer',
          'Data Scientist',
          'Product Manager',
          'Marketing Manager',
          'Sales Manager',
          'HR Manager'
        ]);
      } finally {
        setIsLoadingDesignations(false);
      }
    };

    loadDesignations();
  }, []);

  // Load countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const response = await fetch('/api/locations');
        
        if (!response.ok) {
          throw new Error(`Failed to load countries: ${response.status}`);
        }
        
        const data = await response.json();
        setCountries(data.countries);
      } catch (error) {
        console.error('Error loading countries:', error);
        // Fallback to some common countries
        setCountries([
          { code: 'TZ', name: 'Tanzania', phoneCode: '+255' },
          { code: 'KE', name: 'Kenya', phoneCode: '+254' },
          { code: 'UG', name: 'Uganda', phoneCode: '+256' },
          { code: 'US', name: 'United States', phoneCode: '+1' },
          { code: 'GB', name: 'United Kingdom', phoneCode: '+44' }
        ]);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Load states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!selectedCountry) {
        setStates([]);
        return;
      }

      try {
        setIsLoadingStates(true);
        const response = await fetch(`/api/locations/states?countryCode=${selectedCountry.code}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load states: ${response.status}`);
        }
        
        const data = await response.json();
        setStates(data.states);
      } catch (error) {
        console.error('Error loading states:', error);
        setStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };

    loadStates();
  }, [selectedCountry]);

  // Initialize country/region from company info
  useEffect(() => {
    if (companyInfo && companyInfo.country) {
      // Find country in countries list
      const countryObj = countries.find(c => c.name === companyInfo.country);
      if (countryObj) {
        setSelectedCountry(countryObj);
        setCountrySearchTerm(countryObj.name);
        setFormData(prev => ({ ...prev, country: countryObj.name }));
      }
    }
    if (companyInfo && companyInfo.state) {
      setRegionSearchTerm(companyInfo.state);
      setFormData(prev => ({ ...prev, region: companyInfo.state }));
    }
  }, [companyInfo, countries]);

  // Filter designations based on search term
  const filteredDesignations = designations.filter(designation =>
    designation.toLowerCase().includes(titleSearchTerm.toLowerCase())
  ).slice(0, 10);

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  ).slice(0, 10);

  // Filter states based on search term
  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(regionSearchTerm.toLowerCase())
  ).slice(0, 10);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) return;

      const response = await fetch(`/api/employers/jobs?status=${statusFilter === 'all' ? '' : statusFilter}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, searchTerm]);

  // Helper function to clear edit parameter from URL
  const clearEditParam = () => {
    if (searchParams.get('edit')) {
      router.replace('/employer/job-posting');
    }
  };

  // Handle edit query parameter - fetch job immediately
  useEffect(() => {
    const editJobId = searchParams.get('edit');
    if (editJobId) {
      // First try to find in existing jobs list
      if (jobs.length > 0) {
        const jobToEdit = jobs.find(job => job.id === editJobId);
        if (jobToEdit) {
          handleEditJob(jobToEdit);
          return;
        }
      }
      
      // If not found in list, fetch directly from API
      const fetchJobForEdit = async () => {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) return;

        try {
          const response = await fetch(`/api/employers/jobs/${editJobId}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.job) {
              const fullJob = data.job;
              const skillsString = fullJob.skills && fullJob.skills.length > 0 ? fullJob.skills.join(', ') : '';
              
              setFormData({
                title: fullJob.title,
                region: fullJob.region || '',
                country: fullJob.country || '',
                type: fullJob.type || 'full-time',
                salary: {
                  min: fullJob.salary?.min?.toString() || '',
                  max: fullJob.salary?.max?.toString() || '',
                  currency: fullJob.salary?.currency || 'TZS'
                },
                experience: fullJob.experience || '',
                yearsOfExperience: fullJob.yearsOfExperience || '',
                education: fullJob.education || '',
                certification: fullJob.certification || '',
                customCertification: fullJob.certification || '',
                deadline: fullJob.deadline ? new Date(fullJob.deadline).toISOString().split('T')[0] : '',
                description: fullJob.description || '',
                requirements: fullJob.requirements?.join('\n') || '',
                benefits: fullJob.benefits?.join('\n') || '',
                priority: 'medium',
                skills: skillsString
              });
              
              setSkillsArray(fullJob.skills || []);
              setTitleSearchTerm(fullJob.title || '');
              setCountrySearchTerm(fullJob.country || '');
              setRegionSearchTerm(fullJob.region || '');
              
              // Set selected country and region
              const countryObj = countries.find(c => c.name === fullJob.country);
              if (countryObj) {
                setSelectedCountry(countryObj);
              }
              
              // Create a job object for editingJob state
              setEditingJob({
                id: fullJob.id,
                title: fullJob.title,
                companyName: fullJob.companyName,
                region: fullJob.region,
                country: fullJob.country,
                type: fullJob.type,
                status: fullJob.status as any,
                salary: fullJob.salary,
                experience: fullJob.experience,
                yearsOfExperience: fullJob.yearsOfExperience,
                education: fullJob.education,
                certification: fullJob.certification,
                postedDate: fullJob.postedDate,
                deadline: fullJob.deadline,
                applicationsCount: fullJob.applicationsCount,
                description: fullJob.description,
                requirements: fullJob.requirements,
                benefits: fullJob.benefits,
                adminNotes: fullJob.adminNotes
              });
              
              setShowCreateModal(true);
            }
          }
        } catch (error) {
          console.error('Error loading job for edit:', error);
        }
      };

      fetchJobForEdit();
    }
  }, [searchParams, jobs, countries]);

  const handleEditJob = async (job: JobPosting) => {
    setEditingJob(job);
    
    // Fetch full job details if needed
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
    if (!authToken) return;

    try {
      const response = await fetch(`/api/employers/jobs/${job.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.job) {
          const fullJob = data.job;
          const skillsString = fullJob.skills && fullJob.skills.length > 0 ? fullJob.skills.join(', ') : '';
          
          setFormData({
            title: fullJob.title,
            region: fullJob.region || '',
            country: fullJob.country || '',
            type: fullJob.type || 'full-time',
            salary: {
              min: fullJob.salary?.min?.toString() || '',
              max: fullJob.salary?.max?.toString() || '',
              currency: fullJob.salary?.currency || 'TZS'
            },
            experience: fullJob.experience || '',
            yearsOfExperience: fullJob.yearsOfExperience || '',
            education: fullJob.education || '',
            certification: fullJob.certification || '',
            customCertification: fullJob.certification || '',
            deadline: fullJob.deadline ? new Date(fullJob.deadline).toISOString().split('T')[0] : '',
            description: fullJob.description || '',
            requirements: fullJob.requirements?.join('\n') || '',
            benefits: fullJob.benefits?.join('\n') || '',
            priority: 'medium',
            skills: skillsString
          });
          
          setSkillsArray(fullJob.skills || []);
          setTitleSearchTerm(fullJob.title || '');
          setCountrySearchTerm(fullJob.country || '');
          setRegionSearchTerm(fullJob.region || '');
          
          // Set selected country and region
          const countryObj = countries.find(c => c.name === fullJob.country);
          if (countryObj) {
            setSelectedCountry(countryObj);
          }
          
          setShowCreateModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading job for edit:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTextAreaChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check for barred words
    const result = checkForBarredWords(value);
    setWordCheckResult(result);
    setShowWordWarning(result.hasBarredWords);
  };

  const handleSalaryChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
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
        return 'bg-blue-100 text-blue-800';
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

  const formatSalary = (salary: JobPosting['salary'] | null | undefined) => {
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

  const handlePreview = () => {
    // Validate required fields
    if (!titleSearchTerm.trim()) {
      setModalMessage('Please select a job title');
      setShowErrorModal(true);
      return;
    }
    if (!countrySearchTerm.trim()) {
      setModalMessage('Please select a country');
      setShowErrorModal(true);
      return;
    }
    if (!regionSearchTerm.trim()) {
      setModalMessage('Please select a region');
      setShowErrorModal(true);
      return;
    }
    
    // Check for barred words in all text fields
    const combinedText = `${formData.description} ${formData.requirements} ${formData.benefits}`;
    const wordCheck = checkForBarredWords(combinedText);
    
    if (wordCheck.hasBarredWords) {
      setWordCheckResult(wordCheck);
      setShowWordWarning(true);
      setModalMessage(`Please review the content. Found potentially discriminatory terms: ${wordCheck.foundWords.join(', ')}`);
      setShowErrorModal(true);
      return;
    }
    
    setShowPreviewModal(true);
  };

  const handleFinalSubmit = async () => {
    // Final word check before submission
    const combinedText = `${formData.description} ${formData.requirements} ${formData.benefits}`;
    const wordCheck = checkForBarredWords(combinedText);
    
    if (wordCheck.hasBarredWords) {
      setModalMessage(`Cannot submit job posting. Found potentially discriminatory terms: ${wordCheck.foundWords.join(', ')}`);
      setShowErrorModal(true);
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.country || !formData.region) {
      setModalMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        router.push('/employer/login');
        return;
      }

      if (!companyInfo || !companyInfo.id) {
        setModalMessage('Company information not loaded. Please refresh the page.');
        setShowErrorModal(true);
        return;
      }

      // Parse skills from comma-separated string
      const skills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const jobData = {
        title: formData.title,
        companyId: companyInfo.id,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        benefits: formData.benefits.split('\n').filter(benefit => benefit.trim()),
        region: formData.region,
        country: formData.country,
        salary: {
          min: Number(formData.salary.min) || 0,
          max: Number(formData.salary.max) || 0,
          currency: formData.salary.currency
        },
        type: formData.type,
        experience: formData.experience,
        yearsOfExperience: formData.yearsOfExperience,
        education: formData.education,
        certification: formData.certification === 'other' ? formData.customCertification : formData.certification,
        deadline: formData.deadline,
        priority: formData.priority || 'medium',
        skills: skills
      };

      let response;
      if (editingJob) {
        // Update existing job
        response = await fetch(`/api/employers/jobs/${editingJob.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(jobData),
        });
      } else {
        // Create new job
        response = await fetch('/api/employers/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(jobData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || editingJob ? 'Failed to update job' : 'Failed to create job');
      }

      if (data.success) {
        setModalMessage(editingJob ? 'Job updated successfully!' : 'Job posted successfully! It will be reviewed by admin before being published.');
        setShowSuccessModal(true);
        await fetchJobs();
        setShowCreateModal(false);
        setShowPreviewModal(false);
        setEditingJob(null);
        // Reset form
        setFormData({
          title: '',
          region: companyInfo?.state || '',
          country: companyInfo?.country || '',
          type: 'full-time',
          salary: { min: '', max: '', currency: 'TZS' },
          experience: '',
          yearsOfExperience: '',
          education: '',
          certification: '',
          customCertification: '',
          deadline: '',
          description: '',
          requirements: '',
          benefits: '',
          priority: 'medium',
          skills: ''
        });
        setSkillsArray([]);
        setTitleSearchTerm('');
        setCountrySearchTerm(companyInfo?.country || '');
        setRegionSearchTerm(companyInfo?.state || '');
        setShowTitleDropdown(false);
        setShowCountryDropdown(false);
        setShowRegionDropdown(false);
        setWordCheckResult(null);
        setShowWordWarning(false);
        // Clear edit parameter from URL
        clearEditParam();
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      setModalMessage(error.message || 'Failed to create job. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handlePreview();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (checkingAgreement || (loading && jobs.length === 0)) {
    return (
      <EmployerLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState message="Loading..." size="lg" />
        </div>
      </EmployerLayout>
    );
  }

  // Check if agreement is required
  if (hasAgreement === false) {
    return (
      <EmployerLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Agreement Required
                  </h3>
                  <p className="text-sm text-yellow-700 mb-4">
                    You must sign a recruitment services agreement before you can post jobs. 
                    Please complete the agreement process first.
                  </p>
                  <Link
                    href="/employer/recruitment-services"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                  >
                    Go to Recruitment Services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/employer/dashboard" className="p-2 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Posting</h1>
              <p className="text-gray-600 mt-1">Create and manage your job postings</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'pending').length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status === 'published').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0)}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Job Postings</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No job postings found</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.region && job.country ? `${job.region}, ${job.country}` : (job.region || job.country || 'N/A')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatSalary(job.salary)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(job.postedDate)}
                        </span>
                      </div>
                      {/* Admin Notes for Draft Status (Revision Requested) */}
                      {job.status === 'draft' && job.adminNotes && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-yellow-900 mb-1">Revision Requested</h4>
                              <p className="text-sm text-yellow-800 whitespace-pre-wrap">{job.adminNotes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {job.applicationsCount > 0 && (
                        <p className="text-sm text-gray-600">
                          {job.applicationsCount} application{job.applicationsCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/employer/jobs/${job.id}`}
                        className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-2xl font-bold text-gray-900">{editingJob ? 'Edit Job' : 'Post New Job'}</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingJob(null);
                      clearEditParam();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-6 h-6" />
                  </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                {/* Company Info Display */}
                {companyInfo && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Company Information</h4>
                    <p className="text-sm text-blue-700">
                      <strong>Company:</strong> {companyInfo.companyName || 'N/A'}
                      {companyInfo.industry && ` • Industry: ${companyInfo.industry}`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div className="relative lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={titleSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value;
                          setTitleSearchTerm(value);
                          setFormData(prev => ({ ...prev, title: value }));
                          setShowTitleDropdown(true);
                        }}
                        onFocus={() => setShowTitleDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingDesignations ? "Loading..." : "Search job titles..."}
                        required
                      />
                      {titleSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setTitleSearchTerm('');
                            setFormData(prev => ({ ...prev, title: '' }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {showTitleDropdown && titleSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredDesignations.length > 0 ? (
                          filteredDesignations.map((designation, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setTitleSearchTerm(designation);
                                setFormData(prev => ({ ...prev, title: designation }));
                                setShowTitleDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100"
                            >
                              {designation}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">No designations found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Country */}
                  <div className="relative country-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={countrySearchTerm}
                        onChange={(e) => {
                          setCountrySearchTerm(e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingCountries ? "Loading countries..." : "Search countries..."}
                        required
                      />
                      {countrySearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setCountrySearchTerm('');
                            setSelectedCountry(null);
                            setSelectedRegion(null);
                            setRegionSearchTerm('');
                            setFormData(prev => ({ ...prev, country: '', region: '' }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {showCountryDropdown && countrySearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setCountrySearchTerm(country.name);
                                setSelectedCountry(country);
                                setFormData(prev => ({ ...prev, country: country.name }));
                                setShowCountryDropdown(false);
                                // Reset region when country changes
                                setRegionSearchTerm('');
                                setSelectedRegion(null);
                                setFormData(prev => ({ ...prev, region: '' }));
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {country.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No countries found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Region */}
                  <div className="relative region-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Region *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={regionSearchTerm}
                        onChange={(e) => {
                          setRegionSearchTerm(e.target.value);
                          setShowRegionDropdown(true);
                        }}
                        onFocus={() => setShowRegionDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingStates ? "Loading regions..." : "Search regions..."}
                        required
                        disabled={!selectedCountry}
                      />
                      {regionSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setRegionSearchTerm('');
                            setSelectedRegion(null);
                            setFormData(prev => ({ ...prev, region: '' }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {showRegionDropdown && regionSearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((state, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setRegionSearchTerm(state.name);
                                setSelectedRegion(state);
                                setFormData(prev => ({ ...prev, region: state.name }));
                                setShowRegionDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {state.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            {selectedCountry ? 'No regions found' : 'Please select a country first'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                      <option value="project-based">Project-based</option>
                      <option value="internship">Internship</option>
                      <option value="remote">Remote Work</option>
                    </select>
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Salary *
                    </label>
                    <input
                      type="number"
                      value={formData.salary.min}
                      onChange={(e) => handleSalaryChange('min', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., 5000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Salary *
                    </label>
                    <input
                      type="number"
                      value={formData.salary.max}
                      onChange={(e) => handleSalaryChange('max', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., 8000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.salary.currency}
                      onChange={(e) => handleSalaryChange('currency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="TZS">TZS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Level *
                    </label>
                    <select
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                      <option value="manager">Manager</option>
                      <option value="director">Director</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <select
                      value={formData.yearsOfExperience}
                      onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-2">1-2 years</option>
                      <option value="2-3">2-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-7">5-7 years</option>
                      <option value="7-10">7-10 years</option>
                      <option value="10-15">10-15 years</option>
                      <option value="15+">15+ years</option>
                    </select>
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Education Level *
                    </label>
                    <select
                      value={formData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="high-school">High School</option>
                      <option value="certificate">Certificate</option>
                      <option value="diploma">Diploma</option>
                      <option value="associate">Associate Degree</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">PhD</option>
                      <option value="professional">Professional Certification</option>
                    </select>
                  </div>

                  {/* Certification */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certification
                    </label>
                    <select
                      value={formData.certification}
                      onChange={(e) => handleInputChange('certification', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="">Select (optional)</option>
                      <option value="cpa">CPA</option>
                      <option value="pmp">PMP</option>
                      <option value="cissp">CISSP</option>
                      <option value="aws">AWS Certified</option>
                      <option value="microsoft">Microsoft Certified</option>
                      <option value="other">Other</option>
                    </select>
                    {formData.certification === 'other' && (
                      <input
                        type="text"
                        value={formData.customCertification}
                        onChange={(e) => handleInputChange('customCertification', e.target.value)}
                        className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="Specify certification"
                      />
                    )}
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleTextAreaChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Describe the role, responsibilities..."
                      required
                    />
                    {showWordWarning && wordCheckResult && (
                      <WordCheckWarning 
                        result={wordCheckResult} 
                        onDismiss={() => setShowWordWarning(false)}
                        className="mt-3"
                      />
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Requirements * (one per line)
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => handleTextAreaChange('requirements', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="List requirements (one per line)..."
                      required
                    />
                  </div>

                  {/* Benefits */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Benefits * (one per line)
                    </label>
                    <textarea
                      value={formData.benefits}
                      onChange={(e) => handleTextAreaChange('benefits', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="List benefits (one per line)..."
                      required
                    />
                  </div>

                  {/* Skills */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Required Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, skills: value }));
                        // Update skills array for display
                        const skills = value.split(',').map(s => s.trim()).filter(s => s);
                        setSkillsArray(skills);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., JavaScript, React, Node.js, TypeScript"
                    />
                    {skillsArray.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skillsArray.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-500">Enter skills separated by commas</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="px-6 py-3 border border-[#114373] text-[#114373] rounded-xl hover:bg-[#114373] hover:text-white transition-colors font-semibold flex items-center"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Preview Job
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingJob(null);
                        clearEditParam();
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Save className="w-5 h-5 mr-2" />
                          Create Job Post
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Job Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Job Preview Content */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{formData.title}</h2>
                      <p className="text-lg text-gray-600 mb-1">{companyInfo?.companyName || 'N/A'}</p>
                      <p className="text-gray-500">{formData.region}, {formData.country}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                        {formData.type.charAt(0).toUpperCase() + formData.type.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Salary Range</h3>
                      <p className="text-gray-600">
                        {formData.salary.min && formData.salary.max 
                          ? `${Number(formData.salary.min).toLocaleString()} - ${Number(formData.salary.max).toLocaleString()} ${formData.salary.currency}`
                          : 'Not specified'
                        }
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Experience Level</h3>
                      <p className="text-gray-600">{formData.experience || 'Not specified'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
                      <p className="text-gray-600">{formData.education ? formatEducation(formData.education) : 'Not specified'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Years of Experience</h3>
                      <p className="text-gray-600">{formData.yearsOfExperience || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  {formData.certification && formData.certification !== 'none' && (
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Certification</h3>
                      <p className="text-gray-600">
                        {formData.certification === 'other' ? formData.customCertification : formData.certification}
                      </p>
                    </div>
                  )}
                  
                  {formData.description && (
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{formData.description}</p>
                    </div>
                  )}
                  
                  {formData.requirements && (
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                      <ul className="text-gray-600 list-disc list-inside space-y-1">
                        {formData.requirements.split('\n').filter(req => req.trim()).map((req, index) => (
                          <li key={index}>{req.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {formData.benefits && (
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                      <ul className="text-gray-600 list-disc list-inside space-y-1">
                        {formData.benefits.split('\n').filter(benefit => benefit.trim()).map((benefit, index) => (
                          <li key={index}>{benefit.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {skillsArray.length > 0 && (
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillsArray.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Application Deadline</h3>
                    <p className="text-gray-600">{formData.deadline || 'Not specified'}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-5 h-5 mr-2" />
                        Publish Job
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-center text-gray-600 mb-6">
                  {modalMessage}
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setModalMessage('');
                  }}
                  className="w-full px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Error</h3>
                <p className="text-center text-gray-600 mb-6">
                  {modalMessage}
                </p>
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setModalMessage('');
                  }}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}

export default function EmployerJobPosting() {
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
      <EmployerJobPostingContent />
    </Suspense>
  );
}

