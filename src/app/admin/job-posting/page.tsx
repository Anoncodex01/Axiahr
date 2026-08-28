'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// AdminLayout is now provided by RoleBasedAdminLayout in the root layout
import {
  Briefcase,
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
  Users,
  Building2,
  FileText,
  DollarSign,
  Shield,
  MessageSquare,
  Globe,
  BookOpen,
  Sparkles,
  X,
  Save,
  Send,
  Play,
  Pause
} from 'lucide-react';
import { checkForBarredWords, WordCheckResult } from '@/utils/wordChecker';
import WordCheckWarning from '@/components/WordCheckWarning';
import LoadingState from '@/components/LoadingState';
import { getCountryOptions, getStateOptions } from '@/utils/locationData';

interface JobPosting {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  industry: string;
  companyBrief: string;
  region: string;
  country: string;
  type: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'project-based' | 'internship' | 'remote';
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
  postedDate: string;
  deadline: string;
  applicationsCount: number;
  shortlistedCount: number;
  aiEnhanced: boolean;
  featured: boolean;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  adminNotes?: string;
}

export default function JobPostingManagement() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [wordCheckResult, setWordCheckResult] = useState<WordCheckResult | null>(null);
  const [showWordWarning, setShowWordWarning] = useState(false);
  const [designations, setDesignations] = useState<string[]>([]);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(true);
  const [titleSearchTerm, setTitleSearchTerm] = useState('');
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  
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
  
  // Company states
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    companyId: '',
    industry: '',
    companyBrief: '',
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
    featured: false,
    priority: 'medium',
    skills: ''
  });
  const [skillsArray, setSkillsArray] = useState<string[]>([]);

  // Load designations from CSV
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        setIsLoadingDesignations(true);
        const response = await fetch('/api/designations');
        
        if (!response.ok) {
          throw new Error(`Failed to load designations: ${response.status}`);
        }
        
        const csvContent = await response.text();
        const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
        
        // Skip header row and filter out section headers
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
      } catch (error) {
        console.error('Error loading designations:', error);
        // Fallback to some common job titles
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

  // Load companies from database
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        // Fetch only approved employers for job posting
        const response = await fetch('/api/admin/employers?status=active&profileStatus=approved');
        
        if (!response.ok) {
          throw new Error(`Failed to load companies: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.employers) {
          // Map employers to companies format, ensuring we have both name and companyName
          const mappedCompanies = data.employers.map((emp: any) => ({
            id: emp.id,
            name: emp.companyName || emp.name || '',
            companyName: emp.companyName || emp.name || '',
            industry: emp.industry || '',
            brief: emp.companyBrief || emp.brief || '',
            companyBrief: emp.companyBrief || emp.brief || '',
            email: emp.email || '',
            contactPerson: emp.contactPerson || emp.contact_person || '',
            ...emp
          }));
          setCompanies(mappedCompanies);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies();
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

  // Filter designations based on search term
  const filteredDesignations = designations.filter(designation =>
    designation.toLowerCase().includes(titleSearchTerm.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  // Filter states based on search term
  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(regionSearchTerm.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company =>
    (company?.companyName || company?.name) && companySearchTerm && 
    (company.companyName || company.name || '').toLowerCase().includes(companySearchTerm.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.designation-dropdown')) {
        setShowTitleDropdown(false);
      }
      if (!target.closest('.country-dropdown')) {
        setShowCountryDropdown(false);
      }
      if (!target.closest('.region-dropdown')) {
        setShowRegionDropdown(false);
      }
      if (!target.closest('.company-dropdown')) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch jobs from database
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/jobs?status=${statusFilter === 'all' ? '' : statusFilter}&search=${searchTerm}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.jobs) {
        setRecentJobs(data.jobs);
      } else {
        setRecentJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setRecentJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load jobs on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [statusFilter, searchTerm]);

  // Helper function to clear edit parameter from URL
  const clearEditParam = () => {
    if (searchParams.get('edit')) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  // Handle edit query parameter - fetch job immediately
  useEffect(() => {
    const editJobId = searchParams.get('edit');
    if (editJobId) {
      // First try to find in existing jobs list
      if (recentJobs.length > 0) {
        const jobToEdit = recentJobs.find(job => job.id === editJobId);
        if (jobToEdit) {
          handleEditJob(jobToEdit);
          return;
        }
      }
      
      // If not found in list, fetch directly from API
      const fetchJobForEdit = async () => {
        try {
          const response = await fetch(`/api/admin/jobs/${editJobId}`);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.job) {
              const fullJob = data.job;
              const skillsString = fullJob.skills && fullJob.skills.length > 0 ? fullJob.skills.join(', ') : '';
              
              setFormData({
                title: fullJob.title,
                companyName: fullJob.companyName,
                companyId: fullJob.companyId,
                industry: fullJob.industry,
                companyBrief: fullJob.companyBrief,
                region: fullJob.region,
                country: fullJob.country,
                type: fullJob.type,
                salary: {
                  min: fullJob.salary.min.toString(),
                  max: fullJob.salary.max.toString(),
                  currency: fullJob.salary.currency
                },
                experience: fullJob.experience,
                yearsOfExperience: fullJob.yearsOfExperience,
                education: fullJob.education,
                certification: fullJob.certification,
                customCertification: fullJob.certification,
                deadline: fullJob.deadline,
                description: fullJob.description,
                requirements: fullJob.requirements.join('\n'),
                benefits: fullJob.benefits.join('\n'),
                featured: fullJob.featured,
                priority: 'medium',
                skills: skillsString
              });
              
              setSkillsArray(fullJob.skills || []);
              
              // Set editing job
              setEditingJob(fullJob);
              setShowEditModal(true);
            }
          }
        } catch (error) {
          console.error('Error loading job for edit:', error);
        }
      };

      fetchJobForEdit();
    }
  }, [searchParams, recentJobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatSalary = (salary: JobPosting['salary'] | null | undefined) => {
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    const min = salary.min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const max = salary.max.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const formatLocation = (region: string, country: string) => {
    const parts: string[] = [];
    
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkWords = (text: string) => {
    const result = checkForBarredWords(text);
    setWordCheckResult(result);
    setShowWordWarning(result.hasBarredWords);
  };

  const handleTextAreaChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Check for barred words in real-time
    checkWords(value);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    const skillsString = job.skills && job.skills.length > 0 ? job.skills.join(', ') : '';
    setFormData({
      title: job.title,
      companyName: job.companyName,
      companyId: job.companyId,
      industry: job.industry,
      companyBrief: job.companyBrief,
      region: job.region,
      country: job.country,
      type: job.type,
      salary: {
        min: job.salary.min.toString(),
        max: job.salary.max.toString(),
        currency: job.salary.currency
      },
      experience: job.experience,
      yearsOfExperience: job.yearsOfExperience,
      education: job.education,
      certification: job.certification,
      customCertification: job.certification,
      deadline: job.deadline,
      description: job.description,
      requirements: job.requirements.join('\n'),
      benefits: job.benefits.join('\n'),
      featured: job.featured,
      priority: 'medium',
      skills: skillsString
    });
    setSkillsArray(job.skills || []);
    setShowEditModal(true);
  };

  const handleCloseJob = (jobId: string) => {
    setRecentJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'closed' as const }
          : job
      )
    );
  };

  const handleDeleteJob = (jobId: string) => {
    const job = recentJobs.find(j => j.id === jobId);
    if (job) {
      setJobToDelete(job);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to move job to trash');
      }

      if (data.success) {
        // Refresh jobs list
        await fetchJobs();
        setShowDeleteModal(false);
        setJobToDelete(null);
      }
    } catch (error: any) {
      console.error('Error deleting job:', error);
      alert(error.message || 'Failed to move job to trash. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    
    setIsSubmitting(true);
    
    try {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      
      // Parse skills from comma-separated string
      const skills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const updateData = {
        title: formData.title,
        companyId: formData.companyId,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        benefits: formData.benefits.split('\n').filter(benefit => benefit.trim()),
        location: `${formData.region}, ${formData.country}`,
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
        featured: formData.featured,
        priority: formData.priority || 'medium',
        skills: skills,
        status: editingJob.status // Keep current status unless explicitly changed
      };

      const response = await fetch(`/api/admin/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job');
      }

      if (data.success) {
        // Refresh jobs list
        await fetchJobs();
        // Reset form and close modal
        setFormData({
          title: '',
          companyName: '',
          companyId: '',
          industry: '',
          companyBrief: '',
          region: '',
          country: '',
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
          featured: false,
          priority: 'medium',
          skills: ''
        });
        setSkillsArray([]);
        setTitleSearchTerm('');
        setCompanySearchTerm('');
        setCountrySearchTerm('');
        setRegionSearchTerm('');
        setSelectedCompany(null);
        setSelectedCountry(null);
        setSelectedRegion(null);
        setShowTitleDropdown(false);
        setShowCompanyDropdown(false);
        setShowCountryDropdown(false);
        setShowRegionDropdown(false);
        setShowEditModal(false);
        setEditingJob(null);
        // Clear edit parameter from URL
        clearEditParam();
      }
    } catch (error: any) {
      console.error('Error updating job:', error);
      alert(error.message || 'Failed to update job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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

  const handlePreview = () => {
    // Validate required fields
    if (!titleSearchTerm.trim()) {
      alert('Please select a job title');
      return;
    }
    if (!countrySearchTerm.trim()) {
      alert('Please select a country');
      return;
    }
    if (!regionSearchTerm.trim()) {
      alert('Please select a region');
      return;
    }
    
    // Check for barred words in all text fields
    const combinedText = `${formData.description} ${formData.requirements} ${formData.benefits}`;
    const wordCheck = checkForBarredWords(combinedText);
    
    if (wordCheck.hasBarredWords) {
      setWordCheckResult(wordCheck);
      setShowWordWarning(true);
      alert(`Please review the content. Found potentially discriminatory terms: ${wordCheck.foundWords.join(', ')}`);
      return;
    }
    
    setShowPreviewModal(true);
  };

  const handleFinalSubmit = async () => {
    // Final word check before submission
    const combinedText = `${formData.description} ${formData.requirements} ${formData.benefits}`;
    const wordCheck = checkForBarredWords(combinedText);
    
    if (wordCheck.hasBarredWords) {
      alert(`Cannot submit job posting. Found potentially discriminatory terms: ${wordCheck.foundWords.join(', ')}`);
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.companyId) {
      alert('Please fill in all required fields (Title and Company)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      
      // Parse skills from comma-separated string
      const skills = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const jobData = {
        title: formData.title,
        companyId: formData.companyId,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        benefits: formData.benefits.split('\n').filter(benefit => benefit.trim()),
        location: `${formData.region}, ${formData.country}`,
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
        status: 'published',
        featured: formData.featured,
        priority: formData.priority || 'medium',
        skills: skills
      };

      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job');
      }

      if (data.success) {
        // Refresh jobs list
        await fetchJobs();
        
        // Reset form and close modals
        setFormData({
          title: '',
          companyName: '',
          companyId: '',
          industry: '',
          companyBrief: '',
          region: '',
          country: '',
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
          featured: false,
          priority: 'medium',
          skills: ''
        });
        setSkillsArray([]);
        setTitleSearchTerm('');
        setCompanySearchTerm('');
        setCountrySearchTerm('');
        setRegionSearchTerm('');
        setSelectedCompany(null);
        setSelectedCountry(null);
        setSelectedRegion(null);
        setShowTitleDropdown(false);
        setShowCompanyDropdown(false);
        setShowCountryDropdown(false);
        setShowRegionDropdown(false);
        setShowCreateModal(false);
        setShowPreviewModal(false);
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      alert(error.message || 'Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handlePreview();
  };

  const filteredJobs = recentJobs.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.companyName && job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.region && job.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.country && job.country.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all'
      || job.status === statusFilter
      || (statusFilter === 'trash' && job.adminNotes?.includes('[JOB_TRASH_UNTIL:'));
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading job postings..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Axia Job Posting Management</h1>
          <p className="text-lg text-gray-600">Create, manage, and approve job postings for internal and external employers</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500 text-white">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.filter(j => j.status === 'draft').length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-500 text-white">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.filter(j => j.status === 'published').length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-500 text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.filter(j => j.status === 'draft').length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-500 text-white">
                <Edit className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.filter(j => j.status === 'closed').length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-red-500 text-white">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{recentJobs.filter(j => j.featured).length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500 text-white">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Job Postings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Job Postings</h2>
              <p className="text-gray-600">Create and manage job postings</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Job Post
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
                <option value="trash">Job Trash</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            <button className="p-3 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Job Postings ({filteredJobs.length})</h2>
                <button
                  onClick={fetchJobs}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applications</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Briefcase className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg font-medium">No job postings found</p>
                          <p className="text-gray-400 text-sm mt-2">
                            {searchTerm ? 'Try adjusting your search criteria' : 'No job postings in the database yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{job.title || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{job.companyName || 'N/A'}</div>
                          {job.industry && (
                            <div className="text-xs text-gray-500 mt-1">{job.industry}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatLocation(job.region, job.country)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium capitalize">
                            {job.type ? job.type.replace('-', ' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {job.salary && job.salary.min > 0 && job.salary.max > 0 
                              ? formatSalary(job.salary) 
                              : 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            <span className="capitalize">{job.status || 'draft'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {job.applicationsCount || 0} Applications
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {job.postedDate ? formatDate(job.postedDate) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/job-posting/${job.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
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

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Create New Job Posting</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative designation-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={titleSearchTerm}
                        onChange={(e) => {
                          setTitleSearchTerm(e.target.value);
                          setShowTitleDropdown(true);
                        }}
                        onFocus={() => setShowTitleDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingDesignations ? "Loading designations..." : "Search job titles..."}
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
                              className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {designation}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No designations found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative company-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companySearchTerm}
                        onChange={(e) => {
                          setCompanySearchTerm(e.target.value);
                          setShowCompanyDropdown(true);
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingCompanies ? "Loading companies..." : "Search companies..."}
                        required
                      />
                      {companySearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanySearchTerm('');
                            setSelectedCompany(null);
                            setFormData(prev => ({ 
                              ...prev, 
                              companyName: '', 
                              companyId: '', 
                              industry: '', 
                              companyBrief: '' 
                            }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {showCompanyDropdown && companySearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company, index) => {
                            const companyName = company?.companyName || company?.name || '';
                            const companyId = company?.id || company?.id || '';
                            const companyIndustry = company?.industry || '';
                            const companyBrief = company?.companyBrief || company?.brief || '';
                            
                            if (!companyName) return null;
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setCompanySearchTerm(companyName);
                                  setSelectedCompany(company);
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    companyName: companyName,
                                    companyId: companyId.toString(),
                                    industry: companyIndustry,
                                    companyBrief: companyBrief
                                  }));
                                  setShowCompanyDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                <div>
                                  <div className="font-semibold">{companyName}</div>
                                  <div className="text-gray-500 text-xs">{companyIndustry || 'N/A'}</div>
                                </div>
                              </button>
                            );
                          }).filter(Boolean)
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No companies found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Auto-filled fields from selected company */}
                  {selectedCompany && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Industry (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.industry}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company Brief
                        </label>
                        <textarea
                          value={formData.companyBrief}
                          readOnly
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                        />
                      </div>
                    </>
                  )}

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

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
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
                      <option value="">Select experience level</option>
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
                      <option value="">Select years of experience</option>
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
                      <option value="">Select education level</option>
                      <option value="high-school">High School</option>
                      <option value="certificate">Certificate</option>
                      <option value="diploma">Diploma</option>
                      <option value="associate">Associate Degree</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">PhD</option>
                      <option value="professional">Professional Certification</option>
                      <option value="vocational">Vocational Training</option>
                      <option value="trade-school">Trade School</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Certification
                    </label>
                    <select
                      value={formData.certification}
                      onChange={(e) => handleInputChange('certification', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="">Select certification (optional)</option>
                      <option value="cpa">CPA (Certified Public Accountant)</option>
                      <option value="pmp">PMP (Project Management Professional)</option>
                      <option value="cissp">CISSP (Certified Information Systems Security Professional)</option>
                      <option value="aws">AWS Certified</option>
                      <option value="microsoft">Microsoft Certified</option>
                      <option value="google">Google Certified</option>
                      <option value="salesforce">Salesforce Certified</option>
                      <option value="cfa">CFA (Chartered Financial Analyst)</option>
                      <option value="cma">CMA (Certified Management Accountant)</option>
                      <option value="prince2">PRINCE2</option>
                      <option value="itil">ITIL</option>
                      <option value="scrum">Scrum Master</option>
                      <option value="six-sigma">Six Sigma</option>
                      <option value="other">Other</option>
                    </select>
                    
                    {formData.certification === 'other' && (
                      <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Specify Certification *
                        </label>
                        <input
                          type="text"
                          value={formData.customCertification}
                          onChange={(e) => handleInputChange('customCertification', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                          placeholder="e.g., Certified Ethical Hacker (CEH)"
                          required
                        />
                      </div>
                    )}
                  </div>

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
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Summary *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleTextAreaChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Write a clear, professional summary of the role..."
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

                {/* Responsibilities and Qualifications */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Responsibilities & Qualifications *
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleTextAreaChange('requirements', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="List responsibilities and qualifications. Use one line per point to preserve formatting..."
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

                {/* Benefits */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Benefits *
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => handleTextAreaChange('benefits', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="List the benefits and perks (one per line)..."
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

                {/* Skills */}
                <div className="mt-6">
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

                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700">
                      Featured Job
                    </label>
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
                      onClick={() => setShowCreateModal(false)}
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
                      <p className="text-lg text-gray-600 mb-1">{formData.companyName}</p>
                      <p className="text-gray-500">{formData.region}, {formData.country}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-2">
                        {formData.type.charAt(0).toUpperCase() + formData.type.slice(1).replace('-', ' ')}
                      </span>
                      {formData.featured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 ml-2">
                          Featured
                        </span>
                      )}
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
                      <p className="text-gray-600">{formData.education || 'Not specified'}</p>
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

        {/* Edit Modal */}
        {showEditModal && editingJob && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit Job Posting</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingJob(null);
                    clearEditParam();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateJob} className="p-6">
                {/* Same form fields as create modal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Title */}
                  <div className="relative designation-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={titleSearchTerm}
                        onChange={(e) => {
                          setTitleSearchTerm(e.target.value);
                          setShowTitleDropdown(true);
                        }}
                        onFocus={() => setShowTitleDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingDesignations ? "Loading designations..." : "Search job titles..."}
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
                              className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {designation}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No designations found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="relative company-dropdown">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={companySearchTerm}
                        onChange={(e) => {
                          setCompanySearchTerm(e.target.value);
                          setShowCompanyDropdown(true);
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder={isLoadingCompanies ? "Loading companies..." : "Search companies..."}
                        required
                      />
                      {companySearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanySearchTerm('');
                            setSelectedCompany(null);
                            setFormData(prev => ({ 
                              ...prev, 
                              companyName: '', 
                              companyId: '', 
                              industry: '', 
                              companyBrief: '' 
                            }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {showCompanyDropdown && companySearchTerm && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company, index) => {
                            const companyName = company?.companyName || company?.name || '';
                            const companyId = company?.id || company?.id || '';
                            const companyIndustry = company?.industry || '';
                            const companyBrief = company?.companyBrief || company?.brief || '';
                            
                            if (!companyName) return null;
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setCompanySearchTerm(companyName);
                                  setSelectedCompany(company);
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    companyName: companyName,
                                    companyId: companyId.toString(),
                                    industry: companyIndustry,
                                    companyBrief: companyBrief
                                  }));
                                  setShowCompanyDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                <div>
                                  <div className="font-semibold">{companyName}</div>
                                  <div className="text-gray-500 text-xs">{companyIndustry || 'N/A'}</div>
                                </div>
                              </button>
                            );
                          }).filter(Boolean)
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No companies found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Auto-filled fields from selected company */}
                  {selectedCompany && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Industry (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.industry}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company Brief
                        </label>
                        <textarea
                          value={formData.companyBrief}
                          readOnly
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700"
                        />
                      </div>
                    </>
                  )}

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

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Minimum Salary *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.salary.min}
                        onChange={(e) => handleSalaryChange('min', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="e.g., 5000000"
                        required
                      />
                      <select
                        value={formData.salary.currency}
                        onChange={(e) => handleSalaryChange('currency', e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      >
                        <option value="TZS">TZS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Maximum Salary *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.salary.max}
                        onChange={(e) => handleSalaryChange('max', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="e.g., 8000000"
                        required
                      />
                      <select
                        value={formData.salary.currency}
                        onChange={(e) => handleSalaryChange('currency', e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      >
                        <option value="TZS">TZS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  {/* Experience Level */}
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
                      <option value="">Select experience level</option>
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
                      <option value="">Select years of experience</option>
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

                  {/* Education Level */}
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
                      <option value="">Select education level</option>
                      <option value="high-school">High School</option>
                      <option value="certificate">Certificate</option>
                      <option value="diploma">Diploma</option>
                      <option value="associate">Associate Degree</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">PhD</option>
                      <option value="professional">Professional Certification</option>
                      <option value="vocational">Vocational Training</option>
                      <option value="trade-school">Trade School</option>
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
                      <option value="">Select certification (optional)</option>
                      <option value="cpa">CPA (Certified Public Accountant)</option>
                      <option value="pmp">PMP (Project Management Professional)</option>
                      <option value="cissp">CISSP (Certified Information Systems Security Professional)</option>
                      <option value="aws">AWS Certified</option>
                      <option value="microsoft">Microsoft Certified</option>
                      <option value="google">Google Certified</option>
                      <option value="salesforce">Salesforce Certified</option>
                      <option value="cfa">CFA (Chartered Financial Analyst)</option>
                      <option value="cma">CMA (Certified Management Accountant)</option>
                      <option value="prince2">PRINCE2</option>
                      <option value="itil">ITIL</option>
                      <option value="scrum">Scrum Master</option>
                      <option value="six-sigma">Six Sigma</option>
                      <option value="other">Other</option>
                    </select>
                    
                    {formData.certification === 'other' && (
                      <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Specify Certification *
                        </label>
                        <input
                          type="text"
                          value={formData.customCertification}
                          onChange={(e) => handleInputChange('customCertification', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                          placeholder="e.g., Certified Ethical Hacker (CEH)"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Application Deadline */}
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
                </div>

                {/* Job Description */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Summary *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleTextAreaChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Write a clear, professional summary of the role..."
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

                {/* Responsibilities and Qualifications */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Responsibilities & Qualifications *
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleTextAreaChange('requirements', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="List responsibilities and qualifications. Use one line per point to preserve formatting..."
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

                {/* Benefits */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Benefits *
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => handleTextAreaChange('benefits', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="List the benefits and perks (one per line)..."
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

                {/* Skills */}
                <div className="mt-6">
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

                {/* Featured Job */}
                <div className="mt-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373]"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm font-semibold text-gray-700">
                      Featured Job
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
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
                    className="px-6 py-3 bg-[#114373] text-white rounded-xl hover:bg-[#0d3559] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-5 h-5 mr-2" />
                        Update Job Post
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && jobToDelete && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
              {/* Icon Header */}
              <div className="flex flex-col items-center pt-8 pb-6 px-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Job Posting</h3>
                <p className="text-center text-gray-600 mb-4">
                  Move this job posting to Job Trash?
                </p>
              </div>

              {/* Job Info */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{jobToDelete.title}</p>
                      <p className="text-sm text-gray-600 truncate">{jobToDelete.companyName}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {jobToDelete.region}, {jobToDelete.country}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Warning</p>
                      <p className="text-sm text-amber-800">
                        This job will move to Job Trash and close immediately. The posting and candidate application data will remain available for 90 days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
