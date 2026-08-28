'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Download,
  File,
  Image as ImageIcon
} from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';
import LocationSelector from '@/components/LocationSelector';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';
import LoadingState from '@/components/LoadingState';

interface CompanyProfileForm {
  // Company Details
  companyName: string;
  businessType: string;
  customBusinessType: string;
  industry: string;
  foundedYear: string;
  employeeCount: string;
  annualRevenue: string;
  companyStage: string;
  website: string;
  companyBrief: string;
  // Address fields
  plotNo: string;
  streetName: string;
  landmark: string;
  postalCode: string;
  // Location fields
  country: string;
  state: string;
  city: string;
  // Phone fields
  landlinePhone: string;
  landlineCountryCode: string;
  mobilePhone: string;
  mobileCountryCode: string;
  // Google location
  googleLocationLink: string;
  // Online presence
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  otherSocialMedia: string;
  
  // Legal & Tax Information
  tin: string;
  vrn: string;
  registrationNumber: string;
  taxOffice: string;
  businessLicense: string;
  legalEntityName: string;
  registeredAddress: string;
}

interface UploadedFiles {
  businessLicense: File | null;
  taxCertificate: File | null;
  registrationCertificate: File | null;
  companyLogo: File | null;
  companyProfile: File | null;
}

export default function CompanyProfile() {
  const router = useRouter();
  
  // Get user data from localStorage
  const [userData, setUserData] = useState<any>({});
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileStatus, setProfileStatus] = useState<'pending' | 'approved' | 'incomplete'>('incomplete');
  const [isProfileDisabled, setIsProfileDisabled] = useState(false);
  const [showTin, setShowTin] = useState(false);
  const [showVrn, setShowVrn] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
  const [industrySearchTerm, setIndustrySearchTerm] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [selectedIndustryIndex, setSelectedIndustryIndex] = useState(-1);

  const [form, setForm] = useState<CompanyProfileForm>({
    // Company Details
    companyName: '',
    businessType: '',
    customBusinessType: '',
    industry: '',
    foundedYear: '',
    employeeCount: '',
    annualRevenue: '',
    companyStage: '',
    website: '',
    companyBrief: '',
    // Address fields
    plotNo: '',
    streetName: '',
    landmark: '',
    postalCode: '',
    // Location fields
    country: '',
    state: '',
    city: '',
    // Phone fields
    landlinePhone: '',
    landlineCountryCode: '+1',
    mobilePhone: '',
    mobileCountryCode: '+1',
    // Google location
    googleLocationLink: '',
    // Online presence
    linkedinUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    otherSocialMedia: '',
    
    // Legal & Tax Information
    tin: '',
    vrn: '',
    registrationNumber: '',
    taxOffice: '',
    businessLicense: '',
    legalEntityName: '',
    registeredAddress: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    businessLicense: null,
    taxCertificate: null,
    registrationCertificate: null,
    companyLogo: null,
    companyProfile: null
  });
  
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [documentUrls, setDocumentUrls] = useState<{
    companyProfile?: string;
    businessLicense?: string;
    taxCertificate?: string;
    registrationCertificate?: string;
  }>({});

  useEffect(() => {
    // Check if email is verified from employerData (new database auth) or localStorage (old auth)
    const employerData = localStorage.getItem('employerData');
    const emailVerified = localStorage.getItem('employerEmailVerified');
    const profileComplete = localStorage.getItem('employerProfileComplete');
    
    let isEmailVerified = false;
    let status: 'pending' | 'approved' | 'incomplete' = 'incomplete';
    
    if (employerData) {
      // New database authentication - check emailVerified and profileStatus from employerData
      try {
        const parsed = JSON.parse(employerData);
        isEmailVerified = parsed.emailVerified === true || parsed.emailVerified === 1;
        
        // Check profile status
        if (parsed.profileStatus === 'pending' || profileComplete === 'pending') {
          status = 'pending';
        } else if (parsed.profileStatus === 'approved' || profileComplete === 'approved') {
          status = 'approved';
        }
      } catch (e) {
        console.error('Error parsing employerData:', e);
      }
    } else if (emailVerified) {
      // Old authentication - check localStorage flag
      isEmailVerified = emailVerified === 'true';
    }
    
    // Check profile status from localStorage
    if (profileComplete === 'pending') {
      status = 'pending';
    } else if (profileComplete === 'approved') {
      status = 'approved';
    }
    
    setProfileStatus(status);
    // Disable editing if profile is pending or approved
    setIsProfileDisabled(status === 'pending' || status === 'approved');
    
    // If email is not verified, redirect to email verification page
    if (!isEmailVerified) {
      router.push('/employer/verify-email');
      return;
    }

    const storedUserData = localStorage.getItem('userData');
    const storedEmployerData = localStorage.getItem('employerData');
    
    // Use employerData if available (new auth), otherwise use userData (old auth)
    if (storedEmployerData) {
      try {
        const parsed = JSON.parse(storedEmployerData);
        setUserData(parsed);
        
        // Pre-fill form with registration data
        setForm(prev => ({
          ...prev,
          companyName: parsed.companyName || '',
          mobilePhone: parsed.phone || parsed.mobilePhone || '',
          // Extract phone number and country code if available
          ...(parsed.phone && {
            mobilePhone: parsed.phone.replace(/^\+?\d{1,4}/, ''),
            mobileCountryCode: parsed.phone.match(/^\+?\d{1,4}/)?.[0] || '+255'
          })
        }));
      } catch (e) {
        console.error('Error parsing employerData:', e);
      }
    } else if (storedUserData) {
      const parsed = JSON.parse(storedUserData);
      setUserData(parsed);
      setForm(prev => ({
        ...prev,
        companyName: parsed.companyName || ''
      }));
    }

    // Load existing profile data from API
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) {
          setIsLoadingProfile(false);
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
            const profile = data.data;
            
            // Determine which step to show based on saved data
            let savedStep = 1;
            if (profile.companyName && profile.industry && profile.country) {
              savedStep = 2; // Step 1 complete, move to step 2
            }
            if (profile.tin || profile.vrn || profile.registrationNumber) {
              savedStep = 3; // Step 2 complete, move to step 3
            }
            if (profile.companyProfileDocument || profile.businessLicenseDocument || profile.taxCertificateDocument || profile.registrationCertificateDocument) {
              savedStep = 4; // Step 3 complete, move to step 4
            }
            
            setCurrentStep(savedStep);
            
            // Load saved form data
            setForm(prev => ({
              ...prev,
              // Company Details
              companyName: profile.companyName || prev.companyName,
              industry: profile.industry || prev.industry,
              website: profile.website || prev.website,
              companyBrief: profile.companyBrief || prev.companyBrief,
              foundedYear: profile.foundedYear || prev.foundedYear,
              employeeCount: profile.employeeCount || prev.employeeCount,
              annualRevenue: profile.annualRevenue || prev.annualRevenue,
              companyStage: profile.companyStage || prev.companyStage,
              businessType: profile.businessType || prev.businessType,
              // Address fields
              plotNo: profile.plotNo || prev.plotNo,
              streetName: profile.streetName || prev.streetName,
              landmark: profile.landmark || prev.landmark,
              postalCode: profile.postalCode || prev.postalCode,
              city: profile.city || prev.city,
              country: profile.country || prev.country,
              state: profile.state || profile.region || prev.state,
              // Contact Information
              landlinePhone: profile.landlinePhone || prev.landlinePhone,
              landlineCountryCode: profile.landlineCountryCode || prev.landlineCountryCode || '+255',
              mobilePhone: profile.mobilePhone || prev.mobilePhone,
              mobileCountryCode: profile.mobileCountryCode || prev.mobileCountryCode || '+255',
              // Google Location
              googleLocationLink: profile.googleLocationLink || prev.googleLocationLink,
              // Online Presence
              linkedinUrl: profile.linkedinUrl || prev.linkedinUrl,
              instagramUrl: profile.instagramUrl || prev.instagramUrl,
              facebookUrl: profile.facebookUrl || prev.facebookUrl,
              otherSocialMedia: profile.otherSocialMedia || prev.otherSocialMedia,
              // Legal & Tax
              tin: profile.tin || prev.tin,
              vrn: profile.vrn || prev.vrn,
              registrationNumber: profile.registrationNumber || prev.registrationNumber,
              taxOffice: profile.taxOffice || prev.taxOffice,
              businessLicense: profile.businessLicense || prev.businessLicense,
              legalEntityName: profile.legalEntityName || prev.legalEntityName,
              registeredAddress: profile.registeredAddress || prev.registeredAddress
            }));
            
            // Load company logo URL if it exists
            if (profile.companyLogo) {
              setCompanyLogoUrl(profile.companyLogo);
            }
            
            // Load document URLs if they exist
            if (profile.companyProfileDocument || profile.businessLicenseDocument || profile.taxCertificateDocument || profile.registrationCertificateDocument) {
              setDocumentUrls({
                companyProfile: profile.companyProfileDocument || undefined,
                businessLicense: profile.businessLicenseDocument || undefined,
                taxCertificate: profile.taxCertificateDocument || undefined,
                registrationCertificate: profile.registrationCertificateDocument || undefined
              });
            }
            
            // Check profile status from API response
            if (profile.profileStatus === 'pending' || profile.profileStatus === 'approved') {
              setProfileStatus(profile.profileStatus);
              setIsProfileDisabled(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    // Helper function to parse address
    const parseAddress = (address: string) => {
      const parts: any = {};
      const plotMatch = address.match(/Plot No:\s*([^,]+)/i);
      const postalMatch = address.match(/Postal Code:\s*([^,]+)/i);
      const landmarkMatch = address.match(/Near\s*([^,]+)/i);
      
      if (plotMatch) parts.plotNo = plotMatch[1].trim();
      if (postalMatch) parts.postalCode = postalMatch[1].trim();
      if (landmarkMatch) parts.landmark = landmarkMatch[1].trim();
      
      // Extract street name (everything that's not plot, postal, or landmark)
      const streetParts = address.split(',').filter(part => 
        !part.match(/Plot No:/i) && 
        !part.match(/Postal Code:/i) && 
        !part.match(/Near/i)
      );
      if (streetParts.length > 0) {
        parts.streetName = streetParts[0].trim();
      }
      
      return parts;
    };

    // Helper function to parse phone
    const parsePhone = (phone: string) => {
      const parts: any = {};
      const match = phone.match(/^(\+?\d{1,4})(.+)$/);
      if (match) {
        parts.mobileCountryCode = match[1];
        parts.mobilePhone = match[2];
      } else {
        parts.mobilePhone = phone;
        parts.mobileCountryCode = '+255';
      }
      return parts;
    };

    loadProfile();
  }, []);

  // Load industries from CSV
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        setIsLoadingIndustries(true);
        const response = await fetch('/api/industries-designations');
        if (response.ok) {
          const data = await response.json();
          const industriesList: string[] = data.data
            .replace(/\r\n/g, '\n') // Handle Windows line endings
            .split('\n')
            .slice(1) // Skip header row
            .map((line: string) => {
              const [industry] = line.split(',');
              return industry?.trim().replace(/"/g, '') || '';
            })
            .filter((industry: string) => Boolean(industry));
          
          // Get unique industries and sort them
          const uniqueIndustries = [...new Set(industriesList)].sort();
          setIndustries(uniqueIndustries);
        } else {
          console.error('Failed to fetch industries');
          // Fallback to hardcoded list if API fails
          setIndustries([
            'Agriculture & Agribusiness',
            'Automotive & Transport',
            'Banking & Financial Services',
            'Construction & Real Estate',
            'Consulting & Advisory',
            'Education & Training',
            'Energy, Oil & Gas',
            'Engineering & Manufacturing',
            'Entertainment, Media & Advertising',
            'FMCG (Fast-Moving Consumer Goods)',
            'Healthcare & Pharmaceuticals',
            'Hospitality, Travel & Tourism',
            'Information Technology & Software',
            'Logistics & Supply Chain',
            'Mining & Metals',
            'NGO & Non-Profit Organizations',
            'Professional Services (Legal, Audit, Accounting)',
            'Public Sector & Government',
            'Real Estate & Property',
            'Retail & E-commerce',
            'Technology & Telecommunications',
            'Transportation & Logistics',
            'Utilities & Energy',
            'Wholesale & Distribution'
          ]);
        }
      } catch (error) {
        console.error('Error loading industries:', error);
        // Fallback to hardcoded list on error
        setIndustries([
          'Agriculture & Agribusiness',
          'Automotive & Transport',
          'Banking & Financial Services',
          'Construction & Real Estate',
          'Consulting & Advisory',
          'Education & Training',
          'Energy, Oil & Gas',
          'Engineering & Manufacturing',
          'Entertainment, Media & Advertising',
          'FMCG (Fast-Moving Consumer Goods)',
          'Healthcare & Pharmaceuticals',
          'Hospitality, Travel & Tourism',
          'Information Technology & Software',
          'Logistics & Supply Chain',
          'Mining & Metals',
          'NGO & Non-Profit Organizations',
          'Professional Services (Legal, Audit, Accounting)',
          'Public Sector & Government',
          'Real Estate & Property',
          'Retail & E-commerce',
          'Technology & Telecommunications',
          'Transportation & Logistics',
          'Utilities & Energy',
          'Wholesale & Distribution'
        ]);
      } finally {
        setIsLoadingIndustries(false);
      }
    };

    loadIndustries();
  }, []);

  // Filter industries based on search term
  const filteredIndustries = industrySearchTerm 
    ? industries.filter(industry => 
        industry.toLowerCase().includes(industrySearchTerm.toLowerCase())
      )
    : industries;

  const handleInputChange = (field: keyof CompanyProfileForm, value: string | boolean) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Clear custom business type when business type changes to something other than "Other"
      if (field === 'businessType' && value !== 'Other') {
        newForm.customBusinessType = '';
      }
      
      return newForm;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.industry-dropdown-container')) {
        setShowIndustryDropdown(false);
      }
    };

    if (showIndustryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showIndustryDropdown]);

  const handleFileUpload = async (field: keyof UploadedFiles, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [field]: file }));
    
    // If it's a company logo, upload it immediately
    if (field === 'companyLogo') {
      try {
        const logoUrl = await uploadCompanyLogo(file);
        setCompanyLogoUrl(logoUrl);
      } catch (error) {
        console.error('Error uploading company logo:', error);
        // Keep the file selected even if upload fails - user can retry
      }
    } else {
      // Upload other documents (business license, tax certificate, registration certificate)
      try {
        const documentUrl = await uploadDocument(file, field);
        // Update documentUrls state to show uploaded status
        setDocumentUrls(prev => ({
          ...prev,
          [field === 'companyProfile' ? 'companyProfile' :
           field === 'businessLicense' ? 'businessLicense' : 
           field === 'taxCertificate' ? 'taxCertificate' : 
           'registrationCertificate']: documentUrl
        }));
      } catch (error) {
        console.error(`Error uploading ${field}:`, error);
        // Keep the file selected even if upload fails - user can retry
      }
    }
  };

  // Upload document (business license, tax certificate, registration certificate)
  const uploadDocument = async (file: File, field: keyof UploadedFiles) => {
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      // Map field name to document type
      const documentTypeMap: { [key: string]: string } = {
        'companyProfile': 'company_profile',
        'businessLicense': 'business_license',
        'taxCertificate': 'tax_certificate',
        'registrationCertificate': 'registration_certificate'
      };

      const documentType = documentTypeMap[field];
      if (!documentType) {
        throw new Error(`Unknown document type for field: ${field}`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/employers/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      return data.data.documentUrl;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  // Upload company logo
  const uploadCompanyLogo = async (file: File) => {
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/employers/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      return data.data.logoUrl;
    } catch (error: any) {
      console.error('Error uploading company logo:', error);
      throw error;
    }
  };

  // Save current step to database
  const saveStep = async (stepNumber: number) => {
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        console.error('No auth token found');
        return false;
      }

      // Company logo is uploaded immediately when selected, so we don't need to upload it here
      // But we can verify it was uploaded successfully

      // Prepare form data for current step
      const profileData: any = {
        step: stepNumber
      };

      // Add fields based on current step
      if (stepNumber === 1) {
        // Step 1: Company Details
        profileData.companyName = form.companyName;
        profileData.industry = form.industry;
        profileData.website = form.website;
        profileData.companyBrief = form.companyBrief;
        profileData.foundedYear = form.foundedYear;
        profileData.employeeCount = form.employeeCount;
        profileData.annualRevenue = form.annualRevenue;
        profileData.companyStage = form.companyStage;
        profileData.businessType = form.businessType === 'Other' ? form.customBusinessType : form.businessType;
        profileData.plotNo = form.plotNo;
        profileData.streetName = form.streetName;
        profileData.landmark = form.landmark;
        profileData.postalCode = form.postalCode;
        profileData.country = form.country;
        profileData.state = form.state;
        profileData.city = form.city;
        profileData.landlinePhone = form.landlinePhone;
        profileData.landlineCountryCode = form.landlineCountryCode;
        profileData.mobilePhone = form.mobilePhone;
        profileData.mobileCountryCode = form.mobileCountryCode;
        profileData.googleLocationLink = form.googleLocationLink;
        profileData.linkedinUrl = form.linkedinUrl;
        profileData.instagramUrl = form.instagramUrl;
        profileData.facebookUrl = form.facebookUrl;
        profileData.otherSocialMedia = form.otherSocialMedia;
      } else if (stepNumber === 2) {
        // Step 2: Legal & Tax Information
        profileData.tin = form.tin;
        profileData.vrn = form.vrn;
        profileData.registrationNumber = form.registrationNumber;
        profileData.taxOffice = form.taxOffice;
        profileData.legalEntityName = form.legalEntityName;
        profileData.registeredAddress = form.registeredAddress;
        profileData.businessLicense = form.businessLicense;
      } else if (stepNumber === 3) {
        // Step 3: Document Upload (files are handled separately)
        // For now, we'll just save the file names/references
        // In a real implementation, you'd upload files to storage first
      } else if (stepNumber === 4) {
        // Step 4: Final submission - include all data
        profileData.companyName = form.companyName;
        profileData.industry = form.industry;
        profileData.website = form.website;
        profileData.companyBrief = form.companyBrief;
        profileData.foundedYear = form.foundedYear;
        profileData.employeeCount = form.employeeCount;
        profileData.annualRevenue = form.annualRevenue;
        profileData.companyStage = form.companyStage;
        profileData.businessType = form.businessType === 'Other' ? form.customBusinessType : form.businessType;
        profileData.plotNo = form.plotNo;
        profileData.streetName = form.streetName;
        profileData.landmark = form.landmark;
        profileData.postalCode = form.postalCode;
        profileData.country = form.country;
        profileData.state = form.state;
        profileData.city = form.city;
        profileData.landlinePhone = form.landlinePhone;
        profileData.landlineCountryCode = form.landlineCountryCode;
        profileData.mobilePhone = form.mobilePhone;
        profileData.mobileCountryCode = form.mobileCountryCode;
        profileData.googleLocationLink = form.googleLocationLink;
        profileData.linkedinUrl = form.linkedinUrl;
        profileData.instagramUrl = form.instagramUrl;
        profileData.facebookUrl = form.facebookUrl;
        profileData.otherSocialMedia = form.otherSocialMedia;
        profileData.tin = form.tin;
        profileData.vrn = form.vrn;
        profileData.registrationNumber = form.registrationNumber;
        profileData.taxOffice = form.taxOffice;
        profileData.legalEntityName = form.legalEntityName;
        profileData.registeredAddress = form.registeredAddress;
        profileData.businessLicense = form.businessLicense;
      }

      // Submit step data to API
      const response = await fetch('/api/employers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save step');
      }

      return data.success;
    } catch (error: any) {
      console.error('Error saving step:', error);
      return false;
    }
  };

  // Handle next step - save current step before moving
  const handleNextStep = async () => {
    if (currentStep < 4) {
      setIsSavingStep(true);
      try {
        // Save current step before moving to next
        const saved = await saveStep(currentStep);
        if (saved) {
          setCurrentStep(currentStep + 1);
        } else {
          alert('Failed to save current step. Please try again.');
        }
      } catch (error) {
        console.error('Error saving step:', error);
        alert('Failed to save current step. Please try again.');
      } finally {
        setIsSavingStep(false);
      }
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Final submission - save step 4 with all data
      const saved = await saveStep(4);
      
      if (!saved) {
        throw new Error('Failed to save profile');
      }

      // Update employerData in localStorage
      const employerData = localStorage.getItem('employerData');
      if (employerData) {
        try {
          const parsed = JSON.parse(employerData);
          parsed.profileStatus = 'pending';
          localStorage.setItem('employerData', JSON.stringify(parsed));
        } catch (e) {
          console.error('Error updating employerData:', e);
        }
      }

      // Set profile as pending for admin review
      localStorage.setItem('employerProfileComplete', 'pending');
      localStorage.setItem('employerProfileData', JSON.stringify(form));
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Profile submission error:', error);
      alert(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Company Details', description: 'Basic company information and structure' },
    { number: 2, title: 'Legal & Tax Information', description: 'TIN, VRN, and business registration' },
    { number: 3, title: 'Document Upload', description: 'Upload required documents for verification' },
    { number: 4, title: 'Review & Submit', description: 'Review and submit for verification' }
  ];

  const businessTypes = [
    'Private Limited Company',
    'Public Limited Company',
    'Partnership',
    'Sole Proprietorship',
    'Non-Profit Organization',
    'Government Agency',
    'Other'
  ];



  const employeeCounts = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const annualRevenueRanges = [
    'Under $100K',
    '$100K - $500K',
    '$500K - $1M',
    '$1M - $5M',
    '$5M - $10M',
    '$10M - $50M',
    '$50M - $100M',
    '$100M+'
  ];

  const companyStages = [
    'Startup',
    'Early Stage',
    'Growth Stage',
    'Established',
    'Mature',
    'Enterprise'
  ];

  // Show loading state while fetching profile data
  if (isLoadingProfile) {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <LoadingState message="Fetching your company information..." size="lg" />
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete your company profile to start posting jobs
            </h1>
            <p className="text-gray-600">
              Provide your company details to get verified and start hiring
            </p>
          </div>

          {/* Modern Progress Steps */}
          <div className="mb-12">
            <div className="flex items-start justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-[#114373] transition-all duration-500 ease-in-out"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
              
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
                  {/* Step Circle */}
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-[#114373] border-[#114373] shadow-lg scale-110'
                      : currentStep === step.number
                      ? 'bg-[#114373] border-[#114373] shadow-lg scale-110 ring-4 ring-[#114373]/20'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
                    ) : (
                      <span className={`text-sm font-semibold ${
                        currentStep === step.number ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step.number}
                      </span>
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="mt-4 text-center max-w-[200px]">
                    <h3 className={`text-sm font-semibold mb-1 transition-colors ${
                      currentStep === step.number 
                        ? 'text-[#114373]' 
                        : currentStep > step.number
                        ? 'text-gray-700'
                        : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs leading-tight transition-colors ${
                      currentStep === step.number 
                        ? 'text-gray-600' 
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Show message if profile is pending or approved */}
          {isProfileDisabled && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    {profileStatus === 'pending' ? 'Profile Pending Verification' : 'Profile Approved'}
                  </h3>
                  <p className="text-sm text-yellow-800">
                    {profileStatus === 'pending' 
                      ? 'Your profile has been submitted and is under review. Editing is disabled until verification is complete.'
                      : 'Your profile has been approved. Please contact support if you need to make changes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
                <p className="text-gray-600 mb-6">Basic company information and structure</p>
                
                {/* Company Logo - Centered Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo *
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    {uploadedFiles.companyLogo ? (
                      <img 
                        src={URL.createObjectURL(uploadedFiles.companyLogo)} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-contain rounded-full border border-gray-200 shadow-sm"
                      />
                    ) : companyLogoUrl ? (
                      <img 
                        src={companyLogoUrl} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-contain rounded-full border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="text-center">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.svg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('companyLogo', file);
                        }}
                        className="hidden"
                        id="companyLogo"
                        required
                      />
                      <label htmlFor="companyLogo" className="cursor-pointer">
                        <span className="text-[#114373] hover:text-[#0d3559] font-medium">
                          {uploadedFiles.companyLogo ? 'Change Logo' : 'Choose file'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, SVG files up to 5MB</p>
                      {uploadedFiles.companyLogo && (
                        <p className="text-xs text-gray-600 mt-1">{uploadedFiles.companyLogo.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Enter your company name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type *
                    </label>
                    <select
                      value={form.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {form.businessType === 'Other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specify Business Type *
                      </label>
                      <input
                        type="text"
                        value={form.customBusinessType}
                        onChange={(e) => handleInputChange('customBusinessType', e.target.value)}
                        placeholder="Please specify your business type"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        required
                      />
                    </div>
                  )}

                  <div className="relative industry-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={industrySearchTerm || form.industry}
                        onChange={(e) => {
                          const value = e.target.value;
                          setIndustrySearchTerm(value);
                          setShowIndustryDropdown(true);
                          setSelectedIndustryIndex(-1);
                          // Clear the form industry when user starts typing
                          if (form.industry && value !== form.industry) {
                            handleInputChange('industry', '');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!showIndustryDropdown) return;
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedIndustryIndex(prev => 
                              prev < filteredIndustries.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedIndustryIndex(prev => 
                              prev > 0 ? prev - 1 : filteredIndustries.length - 1
                            );
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (selectedIndustryIndex >= 0 && selectedIndustryIndex < filteredIndustries.length) {
                              const selectedIndustry = filteredIndustries[selectedIndustryIndex];
                              handleInputChange('industry', selectedIndustry);
                              setIndustrySearchTerm('');
                              setShowIndustryDropdown(false);
                              setSelectedIndustryIndex(-1);
                            }
                          } else if (e.key === 'Escape') {
                            setShowIndustryDropdown(false);
                            setSelectedIndustryIndex(-1);
                          }
                        }}
                        onFocus={() => setShowIndustryDropdown(true)}
                        placeholder={isLoadingIndustries ? 'Loading industries...' : 'Search and select industry'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        required
                        disabled={isLoadingIndustries}
                      />
                      {form.industry && !industrySearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('industry', '');
                            setIndustrySearchTerm('');
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                      {showIndustryDropdown && !isLoadingIndustries && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredIndustries.length > 0 ? (
                            filteredIndustries.map((industry, index) => (
                              <div
                                key={industry}
                                className={`px-4 py-2 cursor-pointer text-gray-900 ${
                                  index === selectedIndustryIndex 
                                    ? 'bg-[#114373] text-white' 
                                    : 'hover:bg-gray-100'
                                }`}
                                onClick={() => {
                                  handleInputChange('industry', industry);
                                  setIndustrySearchTerm('');
                                  setShowIndustryDropdown(false);
                                  setSelectedIndustryIndex(-1);
                                }}
                              >
                                {industry}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No industries found matching "{industrySearchTerm}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      value={form.foundedYear}
                      onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., 2020"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Employees *
                    </label>
                    <select
                      value={form.employeeCount}
                      onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select employee count</option>
                      {employeeCounts.map(count => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Revenue *
                    </label>
                    <select
                      value={form.annualRevenue}
                      onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      required
                    >
                      <option value="">Select revenue range</option>
                      {annualRevenueRanges.map(revenue => (
                        <option key={revenue} value={revenue}>{revenue}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Stage
                    </label>
                    <select
                      value={form.companyStage}
                      onChange={(e) => handleInputChange('companyStage', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="">Select company stage</option>
                      {companyStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://www.example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Company Brief */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Brief / About Us *
                    </label>
                    <textarea
                      value={form.companyBrief}
                      onChange={(e) => handleInputChange('companyBrief', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Describe your company, its mission, values, and what makes it unique..."
                      rows={5}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide a brief description of your company (minimum 50 characters)</p>
                  </div>

                  {/* Address Fields */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plot No/Block No *
                    </label>
                    <input
                      type="text"
                      value={form.plotNo}
                      onChange={(e) => handleInputChange('plotNo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., Plot 123, Block A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Name *
                    </label>
                    <input
                      type="text"
                      value={form.streetName}
                      onChange={(e) => handleInputChange('streetName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., Main Street"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={form.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., Near Central Mall"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., 12345"
                      required
                    />
                  </div>

                  {/* Location Fields */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
                  </div>

                  <div className="md:col-span-2">
                    <LocationSelector
                      selectedCountry={form.country}
                      selectedState={form.state}
                      selectedCity={form.city}
                      onCountryChange={(code) => handleInputChange('country', code)}
                      onStateChange={(code) => handleInputChange('state', code)}
                      onCityChange={(city) => handleInputChange('city', city)}
                      showLabels={true}
                    />
                  </div>

                  {/* Phone Fields */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landline Phone
                    </label>
                    <PhoneNumberSelector
                      countryCode={form.landlineCountryCode}
                      phoneNumber={form.landlinePhone}
                      onCountryCodeChange={(code) => handleInputChange('landlineCountryCode', code)}
                      onPhoneNumberChange={(number) => handleInputChange('landlinePhone', number)}
                      placeholder="Enter landline number"
                      required={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Phone *
                    </label>
                    <PhoneNumberSelector
                      countryCode={form.mobileCountryCode}
                      phoneNumber={form.mobilePhone}
                      onCountryCodeChange={(code) => handleInputChange('mobileCountryCode', code)}
                      onPhoneNumberChange={(number) => handleInputChange('mobilePhone', number)}
                      placeholder="Enter mobile number"
                      required={true}
                    />
                  </div>

                  {/* Google Location Link */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Location Link
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={form.googleLocationLink}
                        onChange={(e) => handleInputChange('googleLocationLink', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>

                  {/* Online Presence */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Online Presence</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={form.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={form.instagramUrl}
                        onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="url"
                        value={form.facebookUrl}
                        onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Social Media
                    </label>
                    <textarea
                      value={form.otherSocialMedia}
                      onChange={(e) => handleInputChange('otherSocialMedia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="List other social media profiles (Facebook, Twitter, etc.)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Legal & Tax Information */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal & Tax Information</h2>
                <p className="text-gray-600 mb-6">TIN, VRN, and business registration</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TIN (Tax Identification Number) *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={form.tin}
                        onChange={(e) => handleInputChange('tin', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="Enter TIN"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your TIN will be securely stored and encrypted</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VRN (VAT Registration Number)
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={form.vrn}
                        onChange={(e) => handleInputChange('vrn', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="Enter VRN (if applicable)"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Required if your business is VAT registered</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Registration Number *
                    </label>
                    <input
                      type="text"
                      value={form.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Enter registration number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Office *
                    </label>
                    <input
                      type="text"
                      value={form.taxOffice}
                      onChange={(e) => handleInputChange('taxOffice', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="e.g., IRS, HMRC"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legal Entity Name
                    </label>
                    <input
                      type="text"
                      value={form.legalEntityName}
                      onChange={(e) => handleInputChange('legalEntityName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Legal entity name (if different from company name)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business License Number
                    </label>
                    <input
                      type="text"
                      value={form.businessLicense}
                      onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Enter license number (if applicable)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registered Address
                    </label>
                    <textarea
                      value={form.registeredAddress}
                      onChange={(e) => handleInputChange('registeredAddress', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="Legal registered address (if different from business address)"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Identity Verification</h4>
                      <p className="text-sm text-blue-700">
                        Your TIN and business registration information will be verified by our team to ensure 
                        compliance and authenticity. This process typically takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Document Upload</h2>
                <p className="text-gray-600 mb-6">Upload required documents for verification</p>
                
                <div className="space-y-6">

                  {/* Company Profile Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Profile Document *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploadedFiles.companyProfile 
                          ? uploadedFiles.companyProfile.name 
                          : documentUrls.companyProfile 
                            ? 'Company Profile uploaded ✓' 
                            : 'Upload company profile document'}
                      </p>
                      {documentUrls.companyProfile && !uploadedFiles.companyProfile && (
                        <p className="text-xs text-green-600 mb-2">Document already uploaded</p>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('companyProfile', file);
                        }}
                        className="hidden"
                        id="companyProfile"
                        required={!documentUrls.companyProfile}
                      />
                      <label htmlFor="companyProfile" className="cursor-pointer">
                        <span className="text-[#114373] hover:text-[#0d3559] font-medium">
                          {documentUrls.companyProfile ? 'Change file' : 'Choose file'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, PPT, PPTX files up to 10MB</p>
                    </div>
                    {/* Display uploaded Company Profile document */}
                    {(uploadedFiles.companyProfile || documentUrls.companyProfile) && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-[#114373]" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedFiles.companyProfile 
                                  ? uploadedFiles.companyProfile.name 
                                  : documentUrls.companyProfile?.split('/').pop() || 'Company Profile'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Company Profile Document</p>
                            </div>
                          </div>
                          {documentUrls.companyProfile && (
                            <a
                              href={documentUrls.companyProfile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              View/Download
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business License *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploadedFiles.businessLicense 
                          ? uploadedFiles.businessLicense.name 
                          : documentUrls.businessLicense 
                            ? 'Business License uploaded ✓' 
                            : 'Upload business license'}
                      </p>
                      {documentUrls.businessLicense && !uploadedFiles.businessLicense && (
                        <p className="text-xs text-green-600 mb-2">Document already uploaded</p>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('businessLicense', file);
                        }}
                        className="hidden"
                        id="businessLicense"
                        required={!documentUrls.businessLicense}
                      />
                      <label htmlFor="businessLicense" className="cursor-pointer">
                        <span className="text-[#114373] hover:text-[#0d3559] font-medium">
                          {documentUrls.businessLicense ? 'Change file' : 'Choose file'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG files up to 10MB</p>
                    </div>
                    {/* Display uploaded Business License document */}
                    {(uploadedFiles.businessLicense || documentUrls.businessLicense) && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {documentUrls.businessLicense && documentUrls.businessLicense.match(/\.(jpg|jpeg|png)$/i) ? (
                              <div className="relative">
                                <img 
                                  src={documentUrls.businessLicense} 
                                  alt="Business License" 
                                  className="w-16 h-16 object-cover rounded border border-gray-300"
                                />
                              </div>
                            ) : (
                              <FileText className="w-8 h-8 text-[#114373]" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedFiles.businessLicense 
                                  ? uploadedFiles.businessLicense.name 
                                  : documentUrls.businessLicense?.split('/').pop() || 'Business License'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Business License Document</p>
                            </div>
                          </div>
                          {documentUrls.businessLicense && (
                            <a
                              href={documentUrls.businessLicense}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              View/Download
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Certificate *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploadedFiles.taxCertificate 
                          ? uploadedFiles.taxCertificate.name 
                          : documentUrls.taxCertificate 
                            ? 'Tax Certificate uploaded ✓' 
                            : 'Upload tax certificate'}
                      </p>
                      {documentUrls.taxCertificate && !uploadedFiles.taxCertificate && (
                        <p className="text-xs text-green-600 mb-2">Document already uploaded</p>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('taxCertificate', file);
                        }}
                        className="hidden"
                        id="taxCertificate"
                        required={!documentUrls.taxCertificate}
                      />
                      <label htmlFor="taxCertificate" className="cursor-pointer">
                        <span className="text-[#114373] hover:text-[#0d3559] font-medium">
                          {documentUrls.taxCertificate ? 'Change file' : 'Choose file'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG files up to 10MB</p>
                    </div>
                    {/* Display uploaded Tax Certificate document */}
                    {(uploadedFiles.taxCertificate || documentUrls.taxCertificate) && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {documentUrls.taxCertificate && documentUrls.taxCertificate.match(/\.(jpg|jpeg|png)$/i) ? (
                              <div className="relative">
                                <img 
                                  src={documentUrls.taxCertificate} 
                                  alt="Tax Certificate" 
                                  className="w-16 h-16 object-cover rounded border border-gray-300"
                                />
                              </div>
                            ) : (
                              <FileText className="w-8 h-8 text-[#114373]" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedFiles.taxCertificate 
                                  ? uploadedFiles.taxCertificate.name 
                                  : documentUrls.taxCertificate?.split('/').pop() || 'Tax Certificate'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Tax Certificate Document</p>
                            </div>
                          </div>
                          {documentUrls.taxCertificate && (
                            <a
                              href={documentUrls.taxCertificate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              View/Download
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Certificate *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {uploadedFiles.registrationCertificate 
                          ? uploadedFiles.registrationCertificate.name 
                          : documentUrls.registrationCertificate 
                            ? 'Registration Certificate uploaded ✓' 
                            : 'Upload registration certificate'}
                      </p>
                      {documentUrls.registrationCertificate && !uploadedFiles.registrationCertificate && (
                        <p className="text-xs text-green-600 mb-2">Document already uploaded</p>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('registrationCertificate', file);
                        }}
                        className="hidden"
                        id="registrationCertificate"
                        required={!documentUrls.registrationCertificate}
                      />
                      <label htmlFor="registrationCertificate" className="cursor-pointer">
                        <span className="text-[#114373] hover:text-[#0d3559] font-medium">
                          {documentUrls.registrationCertificate ? 'Change file' : 'Choose file'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG files up to 10MB</p>
                    </div>
                    {/* Display uploaded Registration Certificate document */}
                    {(uploadedFiles.registrationCertificate || documentUrls.registrationCertificate) && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {documentUrls.registrationCertificate && documentUrls.registrationCertificate.match(/\.(jpg|jpeg|png)$/i) ? (
                              <div className="relative">
                                <img 
                                  src={documentUrls.registrationCertificate} 
                                  alt="Registration Certificate" 
                                  className="w-16 h-16 object-cover rounded border border-gray-300"
                                />
                              </div>
                            ) : (
                              <FileText className="w-8 h-8 text-[#114373]" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {uploadedFiles.registrationCertificate 
                                  ? uploadedFiles.registrationCertificate.name 
                                  : documentUrls.registrationCertificate?.split('/').pop() || 'Registration Certificate'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Registration Certificate Document</p>
                            </div>
                          </div>
                          {documentUrls.registrationCertificate && (
                            <a
                              href={documentUrls.registrationCertificate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              View/Download
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">File Requirements</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Company Logo: JPG, PNG, SVG format (max 5MB)</li>
                        <li>• Company Profile: PDF, DOC, DOCX, PPT, PPTX format (max 10MB)</li>
                        <li>• Business License: PDF, JPG, or PNG format (max 10MB)</li>
                        <li>• Tax Certificate: PDF, JPG, or PNG format (max 10MB)</li>
                        <li>• Registration Certificate: PDF, JPG, or PNG format (max 10MB)</li>
                        <li>• All files must be clearly legible and up-to-date</li>
                        <li>• All files will be securely stored and encrypted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-gray-200">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
                  <p className="text-gray-600 text-lg">Review your information and submit for verification</p>
                </div>
                
                <div className="space-y-6">
                  {/* Company Details Card - Full Width */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Company Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {form.annualRevenue && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Revenue</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.annualRevenue}</p>
                        </div>
                      )}
                      {form.foundedYear && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Founded Year</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.foundedYear}</p>
                        </div>
                      )}
                      {form.companyStage && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Stage</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.companyStage}</p>
                        </div>
                      )}
                      {form.companyBrief && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80 md:col-span-2 lg:col-span-4">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Brief</span>
                          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{form.companyBrief}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Address Information Card - Full Width */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Address Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {form.plotNo && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plot No/Block</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.plotNo}</p>
                        </div>
                      )}
                      {form.streetName && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Street Name</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.streetName}</p>
                        </div>
                      )}
                      {form.landmark && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Landmark</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.landmark}</p>
                        </div>
                      )}
                      {form.postalCode && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Postal Code</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.postalCode}</p>
                        </div>
                      )}
                      {(form.city || form.state || form.country) && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">
                            {[form.city, form.state, form.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                      {form.googleLocationLink && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Google Location</span>
                          <p className="text-base mt-1.5">
                            <a href={form.googleLocationLink} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:text-[#0d3559] font-semibold inline-flex items-center gap-2 transition-colors">
                              <Globe className="w-4 h-4" />
                              View on Google Maps
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Contact Information Card - Full Width */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {form.landlinePhone && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Landline</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.landlineCountryCode} {form.landlinePhone}</p>
                        </div>
                      )}
                      {form.mobilePhone && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.mobileCountryCode} {form.mobilePhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Online Presence Card - Full Width */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Online Presence</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {form.linkedinUrl && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">LinkedIn</span>
                          <p className="text-base mt-1.5">
                            <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:text-[#0d3559] font-semibold inline-flex items-center gap-2 transition-colors">
                              <Globe className="w-4 h-4" />
                              <span className="truncate">{form.linkedinUrl}</span>
                            </a>
                          </p>
                        </div>
                      )}
                      {form.instagramUrl && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instagram</span>
                          <p className="text-base mt-1.5">
                            <a href={form.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:text-[#0d3559] font-semibold inline-flex items-center gap-2 transition-colors">
                              <Globe className="w-4 h-4" />
                              <span className="truncate">{form.instagramUrl}</span>
                            </a>
                          </p>
                        </div>
                      )}
                      {form.facebookUrl && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Facebook</span>
                          <p className="text-base mt-1.5">
                            <a href={form.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:text-[#0d3559] font-semibold inline-flex items-center gap-2 transition-colors">
                              <Globe className="w-4 h-4" />
                              <span className="truncate">{form.facebookUrl}</span>
                            </a>
                          </p>
                        </div>
                      )}
                      {form.otherSocialMedia && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Other Social Media</span>
                          <p className="text-base mt-1.5">
                            <a href={form.otherSocialMedia} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:text-[#0d3559] font-semibold inline-flex items-center gap-2 transition-colors">
                              <Globe className="w-4 h-4" />
                              <span className="truncate">{form.otherSocialMedia}</span>
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Legal & Tax Information Card - Full Width */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Legal & Tax Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {form.tin && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TIN</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.tin}</p>
                        </div>
                      )}
                      {form.vrn && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">VRN</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.vrn}</p>
                        </div>
                      )}
                      {form.registrationNumber && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Number</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.registrationNumber}</p>
                        </div>
                      )}
                      {form.taxOffice && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/80">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Office</span>
                          <p className="text-base text-gray-900 font-semibold mt-1.5">{form.taxOffice}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Uploaded Files Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200 mt-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-[#114373] rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Uploaded Files</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/80 flex items-center gap-3">
                          {companyLogoUrl ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Logo</span>
                            <p className="text-sm text-gray-900 font-medium mt-1">
                              {companyLogoUrl ? 'Uploaded ✓' : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/80 flex items-center gap-3">
                          {(uploadedFiles.companyProfile || documentUrls.companyProfile) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Profile</span>
                            <p className="text-sm text-gray-900 font-medium mt-1 truncate">
                              {uploadedFiles.companyProfile 
                                ? uploadedFiles.companyProfile.name 
                                : documentUrls.companyProfile 
                                  ? documentUrls.companyProfile.split('/').pop() || 'Uploaded ✓'
                                  : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/80 flex items-center gap-3">
                          {(uploadedFiles.businessLicense || documentUrls.businessLicense) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business License</span>
                            <p className="text-sm text-gray-900 font-medium mt-1 truncate">
                              {uploadedFiles.businessLicense 
                                ? uploadedFiles.businessLicense.name 
                                : documentUrls.businessLicense 
                                  ? documentUrls.businessLicense.split('/').pop() || 'Uploaded ✓'
                                  : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/80 flex items-center gap-3">
                          {(uploadedFiles.taxCertificate || documentUrls.taxCertificate) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax Certificate</span>
                            <p className="text-sm text-gray-900 font-medium mt-1 truncate">
                              {uploadedFiles.taxCertificate 
                                ? uploadedFiles.taxCertificate.name 
                                : documentUrls.taxCertificate 
                                  ? documentUrls.taxCertificate.split('/').pop() || 'Uploaded ✓'
                                  : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/80 flex items-center gap-3">
                          {(uploadedFiles.registrationCertificate || documentUrls.registrationCertificate) ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Certificate</span>
                            <p className="text-sm text-gray-900 font-medium mt-1 truncate">
                              {uploadedFiles.registrationCertificate 
                                ? uploadedFiles.registrationCertificate.name 
                                : documentUrls.registrationCertificate 
                                  ? documentUrls.registrationCertificate.split('/').pop() || 'Uploaded ✓'
                                  : 'Not uploaded'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Verification Process</h4>
                    <p className="text-sm text-blue-700">
                      Your company profile will be reviewed by our verification team. This process typically takes 1-2 business days.
                      You will receive an email notification once your profile is approved and you can start posting jobs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-4">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSavingStep || isProfileDisabled}
                    className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingStep ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      'Next'
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isProfileDisabled}
                    className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Profile Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your profile is pending verification. You will be notified once it's approved.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>What's Next:</strong> Our team will review your profile and verify your company information. This usually takes 1-2 business days.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // Use window.location for reliable navigation
                  setTimeout(() => {
                    window.location.href = '/employer/dashboard';
                  }, 150);
                }}
                className="w-full px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployerLayout>
  );
}
