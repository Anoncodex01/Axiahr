'use client';

import { useState, useEffect, useRef } from 'react';
import CandidateLayout from '@/components/CandidateLayout';
import { locationData, getCountryOptions, State } from '@/utils/locationData';
import { getQualificationLevels, searchUniversities, getCommonFieldsOfStudy } from '@/utils/universities';
import { searchSpecializations, getAllSpecializations, getAllCategories, getQualificationsByCategory, getSpecializationsForQualification } from '@/utils/qualifications';
import { getAllIndustries, getDesignationsForIndustry, getAllLevels } from '@/utils/industriesDesignations';
import { getAllDesignations, searchDesignations } from '@/utils/designations';
import { 
  getAllCountries, 
  getRegionsByCountry, 
  getCitiesByRegion, 
  getAllCities,
  formatLocation,
  searchLocations,
  searchCountries,
  searchRegionsByCountry,
  searchCitiesByRegion
} from '@/utils/globalData';
import { 
  getAllLanguages, 
  getLanguageProficiencyLevels, 
  searchLanguages,
  LanguageProficiency
} from '@/utils/languageData';
import { 
  countryCodes, 
  searchCountryCodes, 
  CountryCode 
} from '@/utils/countryCodes';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';
import LocationSelector from '@/components/LocationSelector';
import ExperienceModal from '@/components/ExperienceModal';
import ProfileWizard from '@/components/ProfileWizard';
import { 
  searchNationalities,
  getAllJobTitles,
  getJobCategories,
  searchJobTitlesAsync
} from '@/utils/jobData';
import { normalizeAny, formatInternational, toE164 } from '@/utils/phone';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Upload,
  Globe,
  Home,
  Heart,
  Flag,
  Building,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Download,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  Clock,
  Star,
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  DollarSign,
  Type,
  Monitor,
  Code,
  Trophy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';

interface Experience {
  id: string;
  companyName: string;
  designation: string;
  fromDate: string;
  toDate: string;
  isCurrent: boolean;
  companyProfile: string;
  rolesResponsibilities: string;
  keyAchievements: string;
  industry: string;
  level: string;
  location?: {
    countryCode: string;
    stateCode: string;
    city: string;
  };
}

interface Accomplishment {
  id: string;
  type: 'award' | 'certification' | 'publication' | 'patent' | 'other';
  title: string;
  description: string;
  year: string;
  otherType?: string;
}

interface OnlinePresence {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  otherProfiles?: string[];
}

interface JobPreferences {
  jobType: 'full-time' | 'part-time' | 'on-site' | 'remote' | 'hybrid' | 'contract' | 'freelance' | 'fixed-term';
  workMode: 'on-site' | 'remote' | 'hybrid';
  shiftTiming: 'day' | 'night' | 'flexible';
  travelFlexibility: boolean;
  noticePeriod?: string;
  industries?: string[];
  roles?: string[];
}

interface Education {
  id: string;
  degree: string;
  qualification?: string; // Add qualification field
  specialization: string;
  fieldOfStudy: string; // Add fieldOfStudy for display
  institute: string;
  institution: string; // Add institution for display
  yearOfPassing: string;
  graduationYear: string; // Add graduationYear for display
  startDate?: string;
  endDate?: string;
  country?: string; // Add country field
  category?: string; // Add category field
  description?: string;
  isHighestQualification: boolean;
  otherLevel?: string;
}

interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  yearOfCompletion: string;
  validity?: string;
}

interface Project {
  id: string;
  title: string;
  client: string;
  startDate: string;
  endDate: string;
  description: string;
  toolsTechnologies: string;
}

interface ITSkill {
  id: string;
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'expert';
  yearsOfExperience: number;
}

interface Skill {
  id: string;
  name: string;
}

interface Language {
  id: string;
  language: string;
  proficiency: 'Native / Bilingual Proficiency' | 'Full Professional Proficiency' | 'Professional Working Proficiency' | 'Limited Working Proficiency' | 'Elementary Proficiency';
  certification?: string;
  isNative?: boolean;
}

interface Reference {
  id: string;
  fullName: string;
  designation: string;
  organization: string;
  email: string;
  phone?: string;
  linkedinProfile?: string;
  relationship: 'manager' | 'colleague' | 'client' | 'mentor' | 'supervisor' | 'other';
  relationshipOther?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unreachable';
  verificationDate?: string;
  verificationComments?: string;
  isAuthorized: boolean;
  consentToContact: boolean;
}

interface CandidateProfile {
  // Personal Information
  fullName: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  age: number;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  
  // Contact Details
  email: string;
  phone: {
    countryCode: string;
    number: string;
  };
  alternatePhone?: {
    countryCode: string;
    number: string;
  };
  whatsapp?: {
    countryCode: string;
    number: string;
  };
  
  // Location Information
  currentLocation: any;
  permanentLocation: any;
  currentAddress?: string;
  permanentAddress?: string;
  isOpenForRelocation: 'yes' | 'no';
  preferredLocations: string[];
  isSameAsCurrentAddress?: boolean;
  
  // Address
  address: {
    houseNo: string;
    streetName: string;
    landmark: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Nationality
  nationality: string;
  origin: string;
  
  // Experience Details
  experienceType: 'fresher' | 'experienced';
  totalExperienceYears?: number;
  totalExperienceMonths?: number;
  currentExperience?: Experience;
  previousExperiences: Experience[];
  internships: Experience[];
  
  // Education Details
  education: Education[];
  certifications: Certification[];
  
  // Salary Information moved to salaryInfo below
  
  // Profile Content
  resumeHeadline: string;
  profileSummary: string;
  
  // Projects
  projects: Project[];
  
  // Skills
  skills: Skill[];
  languages: Language[];
  
  // Accomplishments
  accomplishments: Accomplishment[];
  
  // Online Presence
  onlinePresence: OnlinePresence;
  
  // Job Preferences
  jobPreferences: JobPreferences;
  
  // References
  references: Reference[];
  
  // Salary Information
  salaryInfo: {
    current?: string;
    expected?: string;
    currency: 'USD' | 'TZS' | 'EUR';
    salaryType?: string;
    negotiable?: boolean;
    benefits?: string;
    noticePeriod?: string;
  };
  
  // Additional Information
  photoUrl?: string;
  photo?: {
    photoUrl: string;
    filename: string;
    size: number;
  } | null;
  resumeUrl?: string;
  coverLetter?: string;
  resume?: {
    resumeUrl: string;
    resumeFilename: string;
    resumeSize: number;
  } | null;
  
  // Privacy Settings
  isProfilePublic: boolean;
  allowContactFromEmployers: boolean;
  
  // Profile Completion
  profileCompletion: {
    personalInfo: boolean;
    employment: boolean;
    education: boolean;
    salary: boolean;
    profileContent: boolean;
    skills: boolean;
    preferences: boolean;
    references: boolean;
  };
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [experienceContext, setExperienceContext] = useState<'work' | 'internship'>('work');
  // Reference phone (modal) local state
  const [referencePhoneCode, setReferencePhoneCode] = useState<string>('+1');
  const [referencePhoneNumber, setReferencePhoneNumber] = useState<string>('');

  const [profile, setProfile] = useState<CandidateProfile>({
    fullName: '',
    firstName: '',
    middleName: '',
    surname: '',
    gender: 'male',
    dateOfBirth: '',
    age: 0,
    maritalStatus: 'single',
    email: '',
    phone: {
      countryCode: '+1',
      number: ''
    },
    alternatePhone: {
      countryCode: '+255',
      number: ''
    },
    whatsapp: {
      countryCode: '+255',
      number: ''
    },
    currentLocation: {
      city: '',
      state: '',
      country: '',
      houseNo: '',
      streetName: '',
      landmark: '',
      postalCode: ''
    },
    permanentLocation: {
      city: '',
      state: '',
      country: '',
      houseNo: '',
      streetName: '',
      landmark: '',
      postalCode: ''
    },
    isOpenForRelocation: 'yes',
    preferredLocations: [],
    isSameAsCurrentAddress: false,
    address: {
      houseNo: '',
      streetName: '',
      landmark: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    nationality: '',
    origin: '',
    experienceType: 'experienced',
    totalExperienceYears: 0,
    totalExperienceMonths: 0,
    currentExperience: undefined,
    previousExperiences: [],
    education: [],
    internships: [],
    certifications: [],
    salaryInfo: {
      currency: 'USD',
      current: undefined,
      expected: undefined
    },
    resumeHeadline: '',
    profileSummary: '',
    projects: [],
    skills: [],
    languages: [],
    references: [],
    accomplishments: [],
    onlinePresence: {
      linkedin: '',
      github: '',
      portfolio: '',
      otherProfiles: []
    },
    jobPreferences: {
      jobType: 'full-time',
      workMode: 'hybrid',
      shiftTiming: 'day',
      travelFlexibility: true,
      noticePeriod: '30 days',
      industries: ['Technology'],
      roles: ['Software Engineer']
    },
    photoUrl: '/logo.png',
    resumeUrl: '/resume.pdf',
    coverLetter: 'Experienced software engineer with 5+ years in full-stack development...',
    isProfilePublic: true,
    allowContactFromEmployers: true,
    profileCompletion: {
      personalInfo: true,
      employment: true,
      education: false,
      salary: false,
      profileContent: false,
      skills: false,
      preferences: false,
      references: true
    }
  });
  const [referenceError, setReferenceError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Profile completion is now calculated using profileCompletion flags
  // This ensures consistency across the entire page
  // The calculation is done above using unifiedCompletionPercent

  // Check if profile is incomplete (less than 80%)
  // Use the unified completion percent for consistency
  const isProfileIncomplete = () => {
    const completionKeys = Object.values(profile.profileCompletion);
    const percent = Math.round((completionKeys.filter(Boolean).length / completionKeys.length) * 100);
    return percent < 80;
  };

  // Photo upload handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!candidateId) {
      alert('Please wait for your profile to finish loading before uploading a photo.');
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateId', candidateId || '');

      const response = await fetch('/api/candidates/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const photoUrl = `${result.data.photoUrl}?v=${Date.now()}`;
        // Update profile state with new photo data
        setProfile(prev => ({
          ...prev,
          photo: {
            photoUrl,
            filename: result.data.filename,
            size: result.data.size
          },
          photoUrl
        }));
        alert(result.warning || 'Photo uploaded successfully!');
      } else {
        alert(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) return;

    try {
      const response = await fetch(`/api/candidates/photo?candidateId=${candidateId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Update profile state to remove photo
        setProfile(prev => ({
          ...prev,
          photo: null,
          photoUrl: ''
        }));
        alert('Photo deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  // Load candidate data from database
  useEffect(() => {
    const loadCandidateData = async () => {
      try {
        // First, try to get candidateId from token (most reliable)
        let candidateId: string | null = null;
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              candidateId = String(payload.candidateId || payload.id || payload.sub || '');
            }
          } catch (error) {
            console.warn('Failed to decode token:', error);
          }
        }

        // Fallback to localStorage if token doesn't have candidateId
        if (!candidateId) {
        const candidateUserStr = localStorage.getItem('candidateUser');
        const candidateDataStr = localStorage.getItem('candidateData');

        let parsed: any = null;
        try { parsed = candidateUserStr ? JSON.parse(candidateUserStr) : null; } catch {}
        if (!parsed) {
          try { parsed = candidateDataStr ? JSON.parse(candidateDataStr) : null; } catch {}
        }

          if (parsed?.id) {
            candidateId = String(parsed.id);
          }
        }

        if (!candidateId) {
          console.log('❌ No candidateId found in token or localStorage');
          setIsLoadingProfile(false);
          return;
        }

        console.log('🔍 Using candidateId:', candidateId);
        setCandidateId(candidateId);

        // Validate candidateId matches token before making request
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              const tokenCandidateId = String(payload.candidateId || payload.id || payload.sub || '');
              
              // If candidateId from localStorage doesn't match token, clear localStorage and use token candidateId
              if (tokenCandidateId && candidateId !== tokenCandidateId) {
                console.warn(`⚠️ CandidateId mismatch detected. Token has ${tokenCandidateId}, localStorage has ${candidateId}. Clearing localStorage and using token candidateId.`);
                
                // Clear conflicting localStorage data
                const keysToRemove = [
                  'candidateUser',
                  'candidateData',
                  'profileCompletionPercent',
                  'profileData',
                  'candidateProfile'
                ];
                keysToRemove.forEach(key => {
                  try {
                    localStorage.removeItem(key);
                  } catch (e) {
                    console.warn(`Failed to remove ${key}:`, e);
                  }
                });
                
                // Use token candidateId instead
                candidateId = tokenCandidateId;
                setCandidateId(candidateId);
              }
            }
          } catch (error) {
            console.warn('Failed to validate token candidateId:', error);
          }
        }

        // Fetch profile data from API (API will validate candidateId matches token)
        const response = await fetch(`/api/candidates/profile?candidateId=${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        });
        
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          result = { success: false, error: 'Invalid response from server' };
        }

        console.log('🔍 API Response:', result);

        // Handle authentication/authorization errors
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error('❌ Authentication/Authorization error:', result.error || 'Access denied');
            
            // Clear all localStorage and cookies
            const keysToRemove = [
              'candidateUser',
              'candidateData',
              'authToken',
              'candidateAuthToken',
              'token',
              'profileCompletionPercent',
              'profileData',
              'candidateProfile',
              'userType'
            ];
            keysToRemove.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.warn(`Failed to remove ${key}:`, e);
              }
            });
            
            // Clear cookies
            document.cookie = 'authToken=; Max-Age=0; Path=/';
            document.cookie = 'candidateAuthToken=; Max-Age=0; Path=/';
            document.cookie = 'axia_candidate_token=; Max-Age=0; Path=/';
            
            setIsLoadingProfile(false);
            window.location.href = '/candidate/login';
            return;
          }
          
          // For other errors, redirect to wizard
          console.error('❌ Error loading profile:', result.error || 'Unknown error');
          setIsLoadingProfile(false);
          window.location.href = '/candidate/profile-wizard';
          return;
        }

        // If API returned a different candidateId (mismatch correction), update localStorage
        if (response.ok && result.success && result.data && result.candidateId && result.candidateId !== candidateId) {
          console.log(`🔄 CandidateId mismatch corrected: ${candidateId} -> ${result.candidateId}. Updating localStorage...`);
          candidateId = String(result.candidateId);
          setCandidateId(candidateId);
          
          // Update localStorage with correct candidateId
          const candidateUserStr = localStorage.getItem('candidateUser');
          const candidateDataStr = localStorage.getItem('candidateData');
          
          if (candidateUserStr) {
            try {
              const userData = JSON.parse(candidateUserStr);
              userData.id = result.candidateId;
              localStorage.setItem('candidateUser', JSON.stringify(userData));
            } catch (e) {
              console.warn('Failed to update candidateUser:', e);
            }
          }
          
          if (candidateDataStr) {
            try {
              const data = JSON.parse(candidateDataStr);
              data.id = result.candidateId;
              localStorage.setItem('candidateData', JSON.stringify(data));
            } catch (e) {
              console.warn('Failed to update candidateData:', e);
            }
          }
        }

        // Handle successful response
        if (response.ok && result.success && result.data) {
          const { 
            candidate, 
            profile: profileData, 
            experience, 
            education, 
            references,
            languages,
            salary,
            projects,
            accomplishments,
            certifications,
            onlinePresence,
            skills,
            jobPreferences,
            resume
          } = result.data;
          
          console.log('🔍 Profile Data:', profileData);
          console.log('🔍 Candidate Data:', candidate);

          // Check profile status - redirect to wizard if incomplete
          const profileStatus = profileData?.status;
          if (profileStatus !== 'completed') {
            // Profile is incomplete, redirect to wizard
            setIsLoadingProfile(false);
            window.location.href = '/candidate/profile-wizard';
            return;
          }

          // Handle new candidates with no profile data
          if (!profileData) {
            console.log('🔍 New candidate - no profile data, setting up basic profile');
            // New candidate with no profile - redirect to wizard
            setIsLoadingProfile(false);
            window.location.href = '/candidate/profile-wizard';
            return;
          }

          // Update profile with real data
          setProfile(prev => ({
            ...prev,
            fullName: `${candidate.firstName} ${candidate.surname}`,
            firstName: candidate.firstName || '',
            middleName: candidate.middleName || '',
            surname: candidate.surname || '',
            email: candidate.email,
            phone: (() => {
              const parsed = splitPhoneNumber(candidate.phone, '+255');
              return { countryCode: parsed.countryCode, number: parsed.number };
            })(),
            alternatePhone: (() => {
              const parsed = splitPhoneNumber(candidate.alternatePhone, '+255');
              return { countryCode: parsed.countryCode, number: parsed.number };
            })(),
            whatsapp: (() => {
              const parsed = splitPhoneNumber(candidate.whatsapp, '+255');
              return { countryCode: parsed.countryCode, number: parsed.number };
            })(),
            gender: candidate.gender?.toLowerCase() || 'male',
            // Add other fields from profileData if available
            ...(profileData && {
              dateOfBirth: profileData.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '',
              nationality: profileData.nationality || '',
              origin: profileData.origin || '',
              maritalStatus: profileData.marital_status || '',
              resumeHeadline: profileData.resume_headline || '',
              profileSummary: profileData.profile_summary || '',
              experienceType: profileData.experience_type || 'fresher',
              totalExperienceYears: profileData.total_experience_years || 0,
              totalExperienceMonths: profileData.total_experience_months || 0,
              photoUrl: profileData.photo_url || '',
              photo: profileData.photo_url ? {
                photoUrl: profileData.photo_url.startsWith('http') ? profileData.photo_url : `${window.location.origin}${profileData.photo_url}`,
                filename: profileData.photo_url.split('/').pop() || '',
                size: 0
              } : null,
              // Debug photo data
              ...(profileData.photo_url && {
                photoDebug: {
                  photo_url: profileData.photo_url,
                  photoUrl: profileData.photo_url,
                  filename: profileData.photo_url.split('/').pop() || ''
                }
              }),
              currentLocation: (() => {
                console.log('🔍 Parsing current_address:', profileData.current_address);
                const parseObj = (v: any) => {
                  if (!v) return null as any;
                  if (typeof v === 'string') {
                    try { 
                      const j = JSON.parse(v); 
                      console.log('✅ Parsed JSON:', j);
                      if (j && typeof j === 'object') return j; 
                    } catch (e) {
                      console.error('❌ JSON parse error:', e);
                    }
                    return null as any;
                  }
                  return v as any;
                };
                const parseLoc = (v: any) => {
                  if (!v) return {} as any;
                  if (typeof v === 'string') {
                    try { const j = JSON.parse(v); if (j && typeof j === 'object') return j; } catch {}
                    const parts = v.split(',').map((s: string) => s.trim());
                    return { city: parts[0] || '', state: parts.length === 3 ? parts[1] || '' : '', country: parts[parts.length - 1] || '' } as any;
                  }
                  return v as any;
                };
                const addr = parseObj(profileData.current_address) || {};
                const loc = parseLoc(profileData.current_location) || {};
                const result = {
                  houseNo: addr.houseNo || '',
                  streetName: addr.streetName || '',
                  landmark: addr.landmark || '',
                  postalCode: addr.postalCode || '',
                  city: addr.city || loc.city || '',
                  state: addr.state || loc.state || '',
                  country: addr.country || loc.country || ''
                } as any;
                console.log('🏠 Final currentLocation:', result);
                return result;
              })(),
              permanentLocation: (() => {
                const parseObj = (v: any) => {
                  if (!v) return null as any;
                  if (typeof v === 'string') {
                    try { const j = JSON.parse(v); if (j && typeof j === 'object') return j; } catch {}
                    return null as any;
                  }
                  return v as any;
                };
                const parseLoc = (v: any) => {
                  if (!v) return {} as any;
                  if (typeof v === 'string') {
                    try { const j = JSON.parse(v); if (j && typeof j === 'object') return j; } catch {}
                    const parts = v.split(',').map((s: string) => s.trim());
                    return { city: parts[0] || '', state: parts.length === 3 ? parts[1] || '' : '', country: parts[parts.length - 1] || '' } as any;
                  }
                  return v as any;
                };
                const addr = parseObj(profileData.permanent_address) || {};
                const loc = parseLoc(profileData.permanent_location) || {};
                return {
                  houseNo: addr.houseNo || '',
                  streetName: addr.streetName || '',
                  landmark: addr.landmark || '',
                  postalCode: addr.postalCode || '',
                  city: addr.city || loc.city || '',
                  state: addr.state || loc.state || '',
                  country: addr.country || loc.country || ''
                } as any;
              })(),
              currentAddress: (() => {
                const v = profileData.current_address;
                if (!v) return '';
                if (typeof v === 'string') return v;
                try { return JSON.stringify(v); } catch { return ''; }
              })(),
              permanentAddress: (() => {
                const v = profileData.permanent_address;
                if (!v) return '';
                if (typeof v === 'string') return v;
                try { return JSON.stringify(v); } catch { return ''; }
              })(),
              preferredLocations: (() => {
                const v = (profileData as any).preferredLocations ?? profileData.preferred_locations;
                console.log('🌍 Parsing preferred_locations:', v);
                if (!v) return [] as any[];
                if (Array.isArray(v)) {
                  console.log('✅ Preferred locations array:', v);
                  return v;
                }
                if (typeof v === 'string') { 
                  try { 
                    const parsed = JSON.parse(v); 
                    console.log('✅ Parsed preferred locations:', parsed);
                    return parsed; 
                  } catch (e) {
                    console.error('❌ Failed to parse preferred locations:', e);
                    return []; 
                  } 
                }
                return [] as any[];
              })(),
              isOpenForRelocation: (() => {
                const raw = (profileData as any).isOpenForRelocation ?? profileData.is_open_for_relocation;
                console.log('🚚 Parsing is_open_for_relocation:', raw);
                if (typeof raw === 'string') {
                  const v = raw.toLowerCase();
                  if (v === 'yes' || v === '1' || v === 'true') return 'yes' as const;
                  if (v === 'no' || v === '0' || v === 'false') return 'no' as const;
                  return v ? 'yes' as const : 'no' as const;
                }
                if (typeof raw === 'number') return raw ? 'yes' as const : 'no' as const;
                if (typeof raw === 'boolean') return raw ? 'yes' as const : 'no' as const;
                console.log('⚠️ Defaulting to no for relocation');
                return 'no' as const;
              })(),
              address: {
                houseNo: profileData.current_address || '',
                streetName: '',
                landmark: '',
                city: profileData.current_location?.city || '',
                state: profileData.current_location?.state || '',
                country: profileData.current_location?.country || '',
                postalCode: ''
              }
            }),
            // Transform experience data - filter by experience_type
            previousExperiences: experience
              .filter((exp: any) => exp.experience_type === 'work')
              .map((exp: any) => ({
                id: exp.id.toString(),
                companyName: exp.company_name,
                designation: exp.designation,
                fromDate: exp.start_date,
                toDate: exp.end_date || '',
                isCurrent: exp.is_current,
                companyProfile: exp.description || '',
                rolesResponsibilities: exp.description || '',
                keyAchievements: exp.achievements || '',
                industry: exp.industry,
                level: exp.level
              })),
            // Transform internship/volunteering data
            internships: experience
              .filter((exp: any) => exp.experience_type === 'internship' || exp.experience_type === 'volunteering')
              .map((exp: any) => ({
              id: exp.id.toString(),
              companyName: exp.company_name,
              designation: exp.designation,
              fromDate: exp.start_date,
              toDate: exp.end_date || '',
              isCurrent: exp.is_current,
              companyProfile: exp.description || '',
              rolesResponsibilities: exp.description || '',
              keyAchievements: exp.achievements || '',
              industry: exp.industry,
              level: exp.level
            })),
            // Transform education data
            education: education.map((edu: any) => ({
              id: edu.id.toString(),
              degree: edu.qualification || '',
              qualification: edu.qualification || '',
              specialization: edu.field_of_study || '',
              fieldOfStudy: edu.field_of_study || '', // Add fieldOfStudy for display
              institute: edu.institution || '',
              institution: edu.institution || '', // Add institution for display
              yearOfPassing: edu.end_date?.split('-')[0] || '',
              graduationYear: edu.end_date?.split('-')[0] || '', // Add graduationYear for display
              startDate: edu.start_date,
              endDate: edu.end_date,
              country: edu.country || '', // Add country field
              category: edu.category || '', // Add category field
              description: edu.description || '',
              isHighestQualification: false // TODO: Implement logic to determine highest qualification
            })),
            // Transform references data
            references: references.map((ref: any) => ({
              id: ref.id.toString(),
              fullName: ref.name,
              designation: ref.designation,
              organization: ref.company,
              email: ref.email,
              phone: ref.phone,
              relationship: ref.relationship,
              verificationStatus: ref.verification_status,
              isAuthorized: true
            })),
            // Transform languages data
            languages: languages.map((lang: any) => ({
              id: lang.id.toString(),
              language: lang.language_name,
              proficiency: lang.proficiency_level,
              certifications: lang.certifications || ''
            })),
            // Transform salary data
            salaryInfo: salary ? {
              current: salary.current_salary ? parseFloat(salary.current_salary) : undefined,
              expected: salary.expected_salary ? parseFloat(salary.expected_salary) : undefined,
              currency: salary.currency || 'USD',
              salaryType: salary.salary_type || 'annual',
              negotiable: salary.is_negotiable === 1 || salary.is_negotiable === true,
              benefits: salary.benefits || '',
              noticePeriod: salary.notice_period || ''
            } : {
              current: undefined,
              expected: undefined,
              currency: 'USD',
              salaryType: 'annual',
              negotiable: false,
              benefits: '',
              noticePeriod: ''
            },
            // Transform projects data
            projects: projects.map((project: any) => ({
              id: project.id.toString(),
              title: project.title,
              client: project.client || '',
              startDate: project.start_date,
              endDate: project.end_date || '',
              description: project.description || '',
              toolsTechnologies: project.tools_technologies || ''
            })),
            // Transform accomplishments data
            accomplishments: accomplishments.map((acc: any) => ({
              id: acc.id.toString(),
              type: acc.type,
              title: acc.title,
              description: acc.description || '',
              year: acc.year || '',
              otherType: acc.other_type || ''
            })),
            // Transform certifications data
            certifications: certifications.map((cert: any) => ({
              id: cert.id.toString(),
              name: cert.name,
              issuingBody: cert.issuing_body || '',
              yearOfCompletion: cert.year_of_completion || '',
              validity: cert.validity || ''
            })),
            // Transform online presence data
            onlinePresence: onlinePresence ? {
              linkedin: onlinePresence.linkedin || '',
              github: onlinePresence.github || '',
              portfolio: onlinePresence.portfolio || '',
              otherProfiles: onlinePresence.otherProfiles || []
            } : {
              linkedin: '',
              github: '',
              portfolio: '',
              otherProfiles: []
            },
            // Transform skills data
            skills: skills.map((skill: any) => ({
              id: skill.id.toString(),
              name: skill.skill_name
            })),
            // Transform job preferences data - API already returns processed object
            jobPreferences: jobPreferences || {
              jobType: 'full-time',
              workMode: 'hybrid',
              shiftTiming: 'day',
              travelFlexibility: false,
              noticePeriod: '',
              industries: [],
              roles: []
            },
            // Transform resume data - API already returns processed object
            resume: resume || {
              resumeUrl: '',
              resumeFilename: '',
              resumeSize: 0
            }
          }));
        } else {
          // Handle error cases (404, 400, etc.) - candidate not found or other errors
          console.log('⚠️ Profile not found or error loading profile:', result.error || 'Unknown error');
          // If profile doesn't exist or has error, redirect to wizard
          setIsLoadingProfile(false);
          window.location.href = '/candidate/profile-wizard';
          return;
          
          // Get candidate info from localStorage as fallback
          const candidateUserStr = localStorage.getItem('candidateUser');
          const candidateDataStr = localStorage.getItem('candidateData');
          let candidateInfo: any = null;
          
          try {
            if (candidateUserStr) {
              candidateInfo = JSON.parse(candidateUserStr as string);
            } else if (candidateDataStr) {
              candidateInfo = JSON.parse(candidateDataStr as string);
            }
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
          
          // If no candidate info found, redirect to wizard
          if (!candidateInfo) {
            setIsLoadingProfile(false);
            window.location.href = '/candidate/profile-wizard';
            return;
          }
          
          // Initialize with empty profile data structure
          setProfile(prev => ({
            ...prev,
            fullName: candidateInfo ? `${candidateInfo.firstName || candidateInfo.first_name || ''} ${candidateInfo.surname || ''}`.trim() : '',
            firstName: candidateInfo?.firstName || candidateInfo?.first_name || '',
            middleName: candidateInfo?.middleName || candidateInfo?.middle_name || '',
            surname: candidateInfo?.surname || '',
            email: candidateInfo?.email || '',
            phone: (() => {
              const parsed = splitPhoneNumber(candidateInfo?.phone, '+255');
              return { countryCode: parsed.countryCode, number: parsed.number };
            })(),
            alternatePhone: {
              countryCode: '+255',
              number: ''
            },
            whatsapp: {
              countryCode: '+255',
              number: ''
            },
            gender: (candidateInfo?.gender || 'male').toLowerCase(),
            dateOfBirth: '',
            nationality: '',
            origin: '',
            maritalStatus: 'single',
            currentLocation: {},
            permanentLocation: {},
            isOpenForRelocation: 'no',
            resumeHeadline: '',
            profileSummary: '',
            experienceType: 'fresher',
            totalExperienceYears: 0,
            totalExperienceMonths: 0,
            previousExperiences: [],
            internships: [],
            education: [],
            references: [],
            skills: [],
            languages: [],
            projects: [],
            accomplishments: [],
            certifications: [],
            onlinePresence: {
              linkedin: '',
              github: '',
              portfolio: '',
              otherProfiles: []
            },
            jobPreferences: {
              jobType: 'full-time',
              workMode: 'hybrid',
              shiftTiming: 'day',
              travelFlexibility: false,
              noticePeriod: '',
              industries: [],
              roles: []
            },
            resume: {
              resumeUrl: '',
              resumeFilename: '',
              resumeSize: 0
            },
            photoUrl: '',
            photo: null,
            salaryInfo: {
              current: undefined,
              expected: undefined,
              currency: 'USD',
              salaryType: 'annual',
              negotiable: false,
              benefits: '',
              noticePeriod: ''
            }
          }));
        }
      } catch (error) {
        console.error('Error loading candidate data:', error);
        // Initialize with empty data on error as well
        const candidateUserStr = localStorage.getItem('candidateUser');
        const candidateDataStr = localStorage.getItem('candidateData');
        let candidateInfo: any = null;
        
        try {
          if (candidateUserStr) {
            candidateInfo = JSON.parse(candidateUserStr);
          } else if (candidateDataStr) {
            candidateInfo = JSON.parse(candidateDataStr);
          }
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
        
        setProfile(prev => ({
          ...prev,
          fullName: candidateInfo ? `${candidateInfo.firstName || candidateInfo.first_name || ''} ${candidateInfo.surname || ''}`.trim() : '',
          firstName: candidateInfo?.firstName || candidateInfo?.first_name || '',
          middleName: candidateInfo?.middleName || candidateInfo?.middle_name || '',
          surname: candidateInfo?.surname || '',
          email: candidateInfo?.email || '',
          phone: (() => {
            const parsed = splitPhoneNumber(candidateInfo?.phone, '+255');
            return { countryCode: parsed.countryCode, number: parsed.number };
          })(),
          gender: (candidateInfo?.gender || 'male').toLowerCase(),
        }));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadCandidateData();
  }, []);

  // Don't auto-show wizard - let user decide when to use it
  // The profile page will always be shown, and users can click the button to open wizard if needed
  // Removed auto-show logic to prevent wizard from reopening after completion

  // Location selection state
  const [selectedCountry, setSelectedCountry] = useState(profile.currentLocation.country || 'United States');
  const [selectedRegion, setSelectedRegion] = useState(profile.currentLocation.state || '');
  const [selectedCity, setSelectedCity] = useState(profile.currentLocation.city || '');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  
  // Language management state
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [languageSearchResults, setLanguageSearchResults] = useState<string[]>([]);
  
  // Industries and designations data
  const [industries, setIndustries] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [rolesSearchTerm, setRolesSearchTerm] = useState('');
  const [designations, setDesignations] = useState<string[]>([]);
  const [levels] = useState<string[]>(['Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive']);

  // Reference management state
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [referenceFormData, setReferenceFormData] = useState<{
    fullName: string;
    designation: string;
    organization: string;
    email: string;
    phone: string;
    relationship: 'manager' | 'colleague' | 'client' | 'mentor' | 'supervisor' | 'other';
    relationshipOther?: string;
    isAuthorized: boolean;
    consentToContact: boolean;
  }>({
    fullName: '',
    designation: '',
    organization: '',
    email: '',
    phone: '',
    relationship: 'manager' as Reference['relationship'],
    relationshipOther: '',
    isAuthorized: true,
    consentToContact: false
  });

  // Skills management state
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillInput, setSkillInput] = useState('');
  // Preferences inputs
  const [industriesInput, setIndustriesInput] = useState('');
  const [rolesInput, setRolesInput] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [selectedIndustryForRoles, setSelectedIndustryForRoles] = useState('');
  // Legacy employment form state (used by an old modal block)
  const [employmentFormData, setEmploymentFormData] = useState<{
    companyName?: string;
    designation?: string;
    fromDate?: string;
    toDate: string;
    isCurrent: boolean;
    companyProfile: string;
    rolesResponsibilities: string;
    keyAchievements: string;
    industry: string;
    functionalArea: string;
  }>({
    companyName: '',
    designation: '',
    fromDate: '',
    toDate: '',
    isCurrent: false,
    companyProfile: '',
    rolesResponsibilities: '',
    keyAchievements: '',
    industry: '',
    functionalArea: ''
  });
  
  // Searchable dropdown states
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAddressCountryDropdown, setShowAddressCountryDropdown] = useState(false);
  const [showAddressStateDropdown, setShowAddressStateDropdown] = useState(false);
  const [showReferenceDesignationDropdown, setShowReferenceDesignationDropdown] = useState(false);
  const [referenceDesignationSearchTerm, setReferenceDesignationSearchTerm] = useState('');
  const [referenceDesignations, setReferenceDesignations] = useState<string[]>([]);
  const [showCustomReferenceDesignation, setShowCustomReferenceDesignation] = useState(false);
  const [customReferenceDesignation, setCustomReferenceDesignation] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [showFunctionalAreaDropdown, setShowFunctionalAreaDropdown] = useState(false);
  const [showPreferredIndustriesDropdown, setShowPreferredIndustriesDropdown] = useState(false);
  const [preferredIndustriesSearchTerm, setPreferredIndustriesSearchTerm] = useState('');
  const [showCustomPreferredIndustry, setShowCustomPreferredIndustry] = useState(false);
  const [customPreferredIndustry, setCustomPreferredIndustry] = useState('');

  // Filtered designations for reference modal
  const filteredReferenceDesignations = searchDesignations(referenceDesignations, referenceDesignationSearchTerm);
  
  // Filtered industries for preferred industries dropdown
  const filteredPreferredIndustries = preferredIndustriesSearchTerm 
    ? industries.filter(industry => 
        industry.toLowerCase().includes(preferredIndustriesSearchTerm.toLowerCase())
      ).slice(0, 10)
    : industries.slice(0, 10);
  
  // Filtered roles for preferred roles dropdown
  const filteredRoles = rolesSearchTerm 
    ? roles.filter(role => 
        role.toLowerCase().includes(rolesSearchTerm.toLowerCase())
      ).slice(0, 10)
    : roles.slice(0, 10);
  
  // Ref for designation dropdown
  const referenceDesignationDropdownRef = useRef<HTMLDivElement>(null);
  const preferredIndustriesDropdownRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowPreferredIndustriesDropdown(false);
        setShowRolesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle cleanup of object URLs when closing photo modal
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // --- Profile completion auto-compute ---
  const isValidEmail = (e?: string) => !!e && /.+@.+\..+/.test(e);

  // Helper function to split phone number into country code and number
  const splitPhoneNumber = (phone?: string, defaultCode: string = '+255') => {
    if (!phone || !phone.trim()) {
      return { countryCode: defaultCode, number: '' };
    }
    
    // Remove all spaces and normalize
    const normalized = phone.replace(/\s+/g, '').trim();
    
    // If it starts with +, try to extract country code
    if (normalized.startsWith('+')) {
      // Known 3-digit country codes (check these FIRST to avoid false matches with 4-digit pattern)
      // This is critical - we must check 3-digit codes before 4-digit codes
      // Otherwise "+255775228891" would match as "+2557" (4-digit) instead of "+255" (3-digit)
      const threeDigitCodes = ['+255', '+254', '+256', '+250', '+251', '+252', '+253', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299'];
      
      // Check 3-digit codes FIRST (before 4-digit codes)
      for (const code of threeDigitCodes) {
        if (normalized.startsWith(code) && normalized.length > code.length) {
          const number = normalized.substring(code.length);
          // Ensure we have at least 6 digits for the number part
          if (number.length >= 6 && /^\d+$/.test(number)) {
            return { countryCode: code, number: number };
          }
        }
      }
      
      // Try 1-digit codes (US/Canada +1) - check before 2-digit to avoid false matches
      let match = normalized.match(/^\+1(\d{10,})$/);
      if (match) {
        return { countryCode: '+1', number: match[1] };
      }
      
      // Try 2-digit codes (most countries) - but exclude prefixes of 3-digit codes
      match = normalized.match(/^\+(\d{2})(\d{6,})$/);
      if (match) {
        const code = `+${match[1]}`;
        // Don't match if it's the start of a known 3-digit code
        if (!['+25', '+12'].includes(code)) {
          return { countryCode: code, number: match[2] };
        }
      }
      
      // Try 4-digit codes LAST (rare, like +1242 Bahamas) - only known valid codes
      // This must be checked AFTER 3-digit codes to avoid false matches
      const fourDigitCodes = ['+1242', '+1246', '+1264', '+1268', '+1284', '+1340', '+1345', '+1441', '+1473', '+1649', '+1664', '+1670', '+1671', '+1684', '+1721', '+1758', '+1767', '+1784', '+1787', '+1809', '+1829', '+1849', '+1868', '+1869', '+1876', '+1939'];
      for (const code of fourDigitCodes) {
        if (normalized.startsWith(code) && normalized.length > code.length) {
          const number = normalized.substring(code.length);
          if (number.length >= 4 && /^\d+$/.test(number)) {
            return { countryCode: code, number: number };
          }
        }
      }
      
      // Fallback: if we can't parse, try to extract 3 digits for common codes
      // This handles edge cases
      const fallbackMatch = normalized.match(/^\+(\d{3})(.+)$/);
      if (fallbackMatch) {
        const code = `+${fallbackMatch[1]}`;
        const number = fallbackMatch[2];
        // Only use fallback if we have a reasonable number length
        if (number.length >= 6 && /^\d+$/.test(number)) {
          return { countryCode: code, number: number };
        }
      }
      
      // Last resort: return everything after + as number with default code
      return { countryCode: defaultCode, number: normalized.substring(1) };
    }
    
    // If no +, assume it's just the number
    return { countryCode: defaultCode, number: normalized };
  };

  const computeProfileCompletion = (p: CandidateProfile): CandidateProfile['profileCompletion'] => {
    const hasPersonalInfo = Boolean(
      p.fullName && p.email && p.phone?.number && p.dateOfBirth && p.gender && p.maritalStatus &&
      p.address?.city && p.address?.state && p.address?.country
    );
    const hasEmployment = p.experienceType === 'fresher'
      ? Boolean(p.internships && p.internships.length > 0)
      : Boolean(p.currentExperience || (p.previousExperiences && p.previousExperiences.length > 0));
    const hasEducation = Boolean(p.education && p.education.length > 0);
    const hasProfileContent = Boolean(p.resumeHeadline && (p.profileSummary || p.resumeUrl));
    const hasSkills = Boolean(p.skills && p.skills.length > 0);
    const hasSalary = Boolean(p.salaryInfo?.currency && (p.salaryInfo?.expected || p.salaryInfo?.current));
    const hasPreferences = Boolean(p.jobPreferences?.jobType && p.jobPreferences?.workMode && p.jobPreferences?.shiftTiming);
    const hasReferences = Boolean(p.references && p.references.length > 0 && isValidEmail(p.references[0]?.email));

    return {
      personalInfo: hasPersonalInfo,
      employment: hasEmployment,
      education: hasEducation,
      salary: hasSalary,
      profileContent: hasProfileContent,
      skills: hasSkills,
      preferences: hasPreferences,
      references: hasReferences
    };
  };

  const profileCompletionEqual = (
    a: CandidateProfile['profileCompletion'],
    b: CandidateProfile['profileCompletion']
  ) =>
    a.personalInfo === b.personalInfo &&
    a.employment === b.employment &&
    a.education === b.education &&
    a.salary === b.salary &&
    a.profileContent === b.profileContent &&
    a.skills === b.skills &&
    a.preferences === b.preferences &&
    a.references === b.references;

  useEffect(() => {
    const nextFlags = computeProfileCompletion(profile);
    if (!profileCompletionEqual(profile.profileCompletion, nextFlags)) {
      setProfile(prev => ({ ...prev, profileCompletion: nextFlags }));
    }
    // completionPercent persistence happens in a separate effect already
    // because it derives from profile.profileCompletion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.fullName, profile.email, profile.phone.number, profile.dateOfBirth, profile.gender, profile.maritalStatus,
      profile.address.city, profile.address.state, profile.address.country,
      profile.currentExperience, profile.previousExperiences, profile.education,
      profile.resumeHeadline, profile.profileSummary, profile.resumeUrl,
      profile.skills, profile.salaryInfo, profile.jobPreferences, profile.references]);

  // Section refs for jump navigation
  const personalInfoRef = useRef<HTMLDivElement | null>(null);
  const profileContentRef = useRef<HTMLDivElement | null>(null);
  const onlinePresenceRef = useRef<HTMLDivElement | null>(null);
  const salaryRef = useRef<HTMLDivElement | null>(null);
  const skillsRef = useRef<HTMLDivElement | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);
  const referencesRef = useRef<HTMLDivElement | null>(null);

  // Completion percent
  // Use the same calculation method for consistency
  // Calculate completion based on profileCompletion flags (8 sections)
  const completionKeys = Object.values(profile.profileCompletion);
  const completionPercent = Math.round((completionKeys.filter(Boolean).length / completionKeys.length) * 100);
  
  // Use the same percentage for both banner and completion section
  // This ensures consistency across the page
  const unifiedCompletionPercent = completionPercent;

  useEffect(() => {
    // Persist completion percent for layout gating
    try {
      localStorage.setItem('profileCompletionPercent', String(completionPercent));
    } catch {}
  }, [completionPercent]);

  useEffect(() => {
    // Show verification success banner if coming from email verification
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === '1') {
        setShowVerifyBanner(true);
        const t = setTimeout(() => setShowVerifyBanner(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const getRefForKey = (k: keyof CandidateProfile['profileCompletion']) => {
    switch (k) {
      case 'profileContent': return profileContentRef;
      case 'salary': return salaryRef;
      case 'skills': return skillsRef;
      case 'preferences': return preferencesRef;
      case 'references': return referencesRef;
      default: return onlinePresenceRef; // fallback
    }
  };

  const scrollToNextIncomplete = () => {
    const order: Array<keyof CandidateProfile['profileCompletion']> = [
      'personalInfo','employment','education','profileContent','skills','salary','preferences','references'
    ];
    const next = order.find(k => !profile.profileCompletion[k]);
    const ref = next ? getRefForKey(next) : null;
    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Checklist of missing items
  const [showChecklist, setShowChecklist] = useState(false);
  const missingItems = (): Array<{ label: string; ref?: React.RefObject<HTMLDivElement | null> }> => {
    const items: Array<{ label: string; ref?: React.RefObject<HTMLDivElement | null> }> = [];
    // Personal info details
    if (!profile.firstName) items.push({ label: 'Add First Name', ref: personalInfoRef });
    if (!profile.surname) items.push({ label: 'Add Surname', ref: personalInfoRef });
    if (!isValidEmail(profile.email)) items.push({ label: 'Provide a valid Email', ref: personalInfoRef });
    if (!profile.phone?.number) items.push({ label: 'Provide Phone Number', ref: personalInfoRef });
    if (!profile.dateOfBirth) items.push({ label: 'Set Date of Birth', ref: personalInfoRef });
    if (!profile.gender) items.push({ label: 'Select Gender', ref: personalInfoRef });
    if (!profile.maritalStatus) items.push({ label: 'Select Marital Status', ref: personalInfoRef });
    if (!profile.address?.city || !profile.address?.state || !profile.address?.country) items.push({ label: 'Complete Address (City/State/Country)', ref: personalInfoRef });
    // Education
    if (!profile.education?.length) items.push({ label: 'Add at least one Education' });
    // Employment
    if (profile.experienceType === 'fresher') {
      if (!profile.internships?.length) items.push({ label: 'Add Internship / Volunteering' });
    } else {
      if (!(profile.currentExperience || (profile.previousExperiences?.length || 0) > 0)) items.push({ label: 'Add Work Experience' });
    }
    // Profile content
    if (!(profile.resumeHeadline && (profile.profileSummary || profile.resumeUrl))) items.push({ label: 'Complete Resume Headline and Summary or Resume URL', ref: profileContentRef });
    // Skills
    if (!profile.skills?.length) items.push({ label: 'Add at least one Skill', ref: skillsRef });
    // Salary
    if (!(profile.salaryInfo?.currency && (profile.salaryInfo.expected || profile.salaryInfo.current))) items.push({ label: 'Fill Salary Currency and Expected/Current', ref: salaryRef });
    // Preferences
    if (!(profile.jobPreferences?.jobType && profile.jobPreferences.workMode && profile.jobPreferences.shiftTiming)) items.push({ label: 'Set Job Preferences (Type/Mode/Shift)', ref: preferencesRef });
    // References
    if (!(profile.references?.length && isValidEmail(profile.references[0]?.email))) items.push({ label: 'Add a Reference with valid Email', ref: referencesRef });
    return items;
  };

  const missingClass = (cond: boolean) => (isEditing && cond ? ' border-red-300 ring-2 ring-red-200' : '');
  
  // Education modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  
  // Salary modal states
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryFormData, setSalaryFormData] = useState({
    currency: 'USD',
    currentSalary: '',
    expectedSalary: '',
    salaryType: 'annual',
    negotiable: false,
    benefits: '',
    noticePeriod: ''
  });
  
  // Online Presence modal states
  const [showOnlinePresenceModal, setShowOnlinePresenceModal] = useState(false);
  const [onlinePresenceFormData, setOnlinePresenceFormData] = useState({
    linkedin: '',
    github: '',
    portfolio: '',
    otherProfiles: [] as string[]
  });
  const [educationFormData, setEducationFormData] = useState({
    institution: '',
    institutionISO2: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: '',
    description: '',
    otherLevel: '',
    category: '',
    qualification: ''
  });
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [institutionResults, setInstitutionResults] = useState<Array<{ iso2: string; name: string; url?: string }>>([]);
  const [educationCountry, setEducationCountry] = useState<string>('');
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [fieldResults, setFieldResults] = useState<string[]>([]);
  
  // Hierarchical education selection states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showQualificationDropdown, setShowQualificationDropdown] = useState(false);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [qualificationResults, setQualificationResults] = useState<string[]>([]);
  const [specializationResults, setSpecializationResults] = useState<string[]>([]);
  const [allSpecializationsForQualification, setAllSpecializationsForQualification] = useState<string[]>([]);
  const [showEduCountryDropdown, setShowEduCountryDropdown] = useState(false);
  const [eduCountrySearch, setEduCountrySearch] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [levelSearch, setLevelSearch] = useState('');

  // Search universities as the user types institution (debounced)
  useEffect(() => {
    let active = true;
    const q = educationFormData.institution.trim();
    const handle = setTimeout(() => {
      (async () => {
        try {
          if (!active) return;
          if (q.length < 2) {
            setInstitutionResults([]);
            return;
          }
          const res = await searchUniversities(q, educationCountry || undefined, 20);
          if (!active) return;
          setInstitutionResults(res);
        } catch (_) {
          if (!active) return;
          setInstitutionResults([]);
        }
      })();
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [educationFormData.institution, educationCountry]);

  // Search field of study using qualifications CSV (debounced)
  useEffect(() => {
    let active = true;
    const q = educationFormData.fieldOfStudy.trim();
    const handle = setTimeout(() => {
      (async () => {
        try {
          if (!active) return;
          if (q.length < 2) {
            const results = await getAllSpecializations();
            setFieldResults(results.slice(0, 20));
            return;
          }
          const results = await searchSpecializations(q, 20);
          if (!active) return;
          setFieldResults(results);
        } catch (_) {
          if (!active) return;
          setFieldResults([]);
        }
      })();
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [educationFormData.fieldOfStudy]);

  // Populate salary form data when modal opens with existing salary info
  useEffect(() => {
    if (showSalaryModal && profile.salaryInfo && (profile.salaryInfo.expected || profile.salaryInfo.currency)) {
      // Populate form with existing salary data when modal opens
      setSalaryFormData({
        currency: profile.salaryInfo.currency || 'USD',
        currentSalary: '', // Removed - no longer used
        expectedSalary: profile.salaryInfo.expected ? String(profile.salaryInfo.expected) : '',
        salaryType: profile.salaryInfo.salaryType || 'annual',
        negotiable: profile.salaryInfo.negotiable || false,
        benefits: profile.salaryInfo.benefits || '',
        noticePeriod: profile.salaryInfo.noticePeriod || '' // Ensure noticePeriod is loaded from database
      });
    }
  }, [showSalaryModal, profile.salaryInfo]);

  // Search languages as the user types (debounced)
  useEffect(() => {
    let active = true;
    const q = languageSearchQuery.trim();
    const handle = setTimeout(() => {
      (async () => {
        try {
          if (!active) return;
          if (q.length < 2) {
            setLanguageSearchResults([]);
            return;
          }
          const results = await searchLanguagesLocal(q);
          if (!active) return;
          setLanguageSearchResults(results);
        } catch (_) {
          if (!active) return;
          setLanguageSearchResults([]);
        }
      })();
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [languageSearchQuery]);

  // Load categories when education modal opens
  useEffect(() => {
    if (showEducationModal) {
      getAllCategories().then(categories => {
        setCategoryResults(categories);
      });
    }
  }, [showEducationModal]);

  // Load qualifications when category is selected
  useEffect(() => {
    if (educationFormData.category) {
      getQualificationsByCategory(educationFormData.category).then(qualifications => {
        setQualificationResults(qualifications);
      });
    }
  }, [educationFormData.category]);

  // Load specializations when qualification is selected
  useEffect(() => {
    if (educationFormData.qualification) {
      getSpecializationsForQualification(educationFormData.qualification).then(specializations => {
        setAllSpecializationsForQualification(specializations); // Store the full list
        setSpecializationResults(specializations); // Also set the display results initially to the full list
      });
    } else {
      setAllSpecializationsForQualification([]);
      setSpecializationResults([]);
    }
  }, [educationFormData.qualification]);

  // Load industries and roles data
  useEffect(() => {
    const loadIndustriesAndRolesData = async () => {
      try {
        // Load industries
        const industryList = await getAllIndustries();
        setIndustries(industryList);
        
        // Load job titles/roles
        const rolesResponse = await fetch('/api/job-titles');
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.text();
          const rolesList = rolesData
            .replace(/\r\n/g, '\n')
            .split('\n')
            .slice(1)
            .map((line: string) => {
              const [role] = line.split(',');
              return role?.trim().replace(/"/g, '');
            })
            .filter(Boolean);
          const uniqueRoles = [...new Set(rolesList)];
          setRoles(uniqueRoles);
        }
      } catch (error) {
        console.error('Error loading industries and roles data:', error);
      }
    };
    loadIndustriesAndRolesData();
  }, []);

  // Load designations data for reference modal
  useEffect(() => {
    const loadDesignationsData = async () => {
      try {
        const designationList = await getAllDesignations();
        setReferenceDesignations(designationList);
      } catch (error) {
        console.error('Error loading designations:', error);
      }
    };
    loadDesignationsData();
  }, []);

  // Handle clicks outside designation dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (referenceDesignationDropdownRef.current && !referenceDesignationDropdownRef.current.contains(event.target as Node)) {
        setShowReferenceDesignationDropdown(false);
        setReferenceDesignationSearchTerm('');
      }
      if (preferredIndustriesDropdownRef.current && !preferredIndustriesDropdownRef.current.contains(event.target as Node)) {
        setShowPreferredIndustriesDropdown(false);
        setPreferredIndustriesSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle clicks outside origin and nationality dropdowns separately
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Use a small delay to allow dropdown clicks to register first
      setTimeout(() => {
        const target = event.target as Element;
        const isClickOnDropdown = target.closest('.dropdown-container');
        
        if (!isClickOnDropdown) {
          if (showOriginDropdown) {
            setShowOriginDropdown(false);
          }
          if (showNationalityDropdown) {
            setShowNationalityDropdown(false);
          }
        }
      }, 10);
    };

    if (showOriginDropdown || showNationalityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showOriginDropdown, showNationalityDropdown]);

  // Load designations when industry is selected for roles
  useEffect(() => {
    if (selectedIndustryForRoles) {
      getDesignationsForIndustry(selectedIndustryForRoles).then(setDesignations);
    } else {
      setDesignations([]);
    }
  }, [selectedIndustryForRoles]);

  // Experience management functions
  const handleAddExperience = async (experienceData: Omit<Experience, 'id'>) => {
    try {
      // Get candidate ID from localStorage
      const candidateUser = localStorage.getItem('candidateUser');
      if (!candidateUser) {
        throw new Error('User data not found. Please login again.');
      }

      const userData = JSON.parse(candidateUser);
      const candidateId = userData.id;

      // Map experience data to API format
      // Experience interface uses fromDate/toDate, but API expects startDate/endDate
      // Check ALL possible sources - prioritize startDate/endDate if preserved, then fromDate/toDate
      const startDate = (experienceData as any).startDate 
        || (experienceData as any).fromDate 
        || (experienceData as any).from_date 
        || '';
      
      const endDate = (experienceData as any).endDate 
        || (experienceData as any).toDate 
        || (experienceData as any).to_date 
        || null;
      
      console.log('🔍 Extracting dates from experienceData:', {
        rawData: experienceData,
        allKeys: Object.keys(experienceData),
        fromDate: (experienceData as any).fromDate,
        startDate: (experienceData as any).startDate,
        toDate: (experienceData as any).toDate,
        endDate: (experienceData as any).endDate,
        extractedStartDate: startDate,
        extractedEndDate: endDate
      });
      
      if (!startDate || startDate.trim() === '') {
        console.error('❌ Start date is missing! experienceData:', experienceData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      // Build API data object - ensure startDate and endDate are ALWAYS included
      // Extract startDate/endDate from multiple possible sources as fallback
      const finalStartDate = startDate || (experienceData as any).startDate || (experienceData as any).fromDate || '';
      const finalEndDate = endDate || (experienceData as any).endDate || (experienceData as any).toDate || null;
      
      console.log('🔍 Final date extraction in handleAddExperience:', {
        extractedStartDate: startDate,
        finalStartDate,
        extractedEndDate: endDate,
        finalEndDate,
        experienceDataKeys: Object.keys(experienceData),
        hasStartDate: !!(experienceData as any).startDate,
        hasFromDate: !!(experienceData as any).fromDate
      });
      
      if (!finalStartDate || finalStartDate.trim() === '') {
        console.error('❌ CRITICAL: finalStartDate is empty in handleAddExperience!', {
          startDate,
          experienceData,
          allKeys: Object.keys(experienceData)
        });
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      const apiData: any = {
        companyName: experienceData.companyName || '',
        designation: experienceData.designation || '',
        startDate: finalStartDate,  // REQUIRED - must be present
        endDate: finalEndDate,  // Optional - can be null
        isCurrent: experienceData.isCurrent || false,
        industry: experienceData.industry || null,
        level: experienceData.level || null,
        companyProfile: experienceData.companyProfile || null,
        rolesResponsibilities: experienceData.rolesResponsibilities || '',
        keyAchievements: experienceData.keyAchievements || null,
        experienceType: experienceContext === 'internship' ? 'internship' : 'work'
      };
      
      // Triple-check startDate is present before sending
      if (!apiData.startDate || apiData.startDate.trim() === '') {
        console.error('❌ CRITICAL: startDate is missing from apiData after all checks!', apiData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      console.log('📤 Sending experience data to API:', JSON.stringify(apiData, null, 2));
      console.log('📤 startDate in apiData:', apiData.startDate);
      console.log('📤 endDate in apiData:', apiData.endDate);

      const response = await fetch('/api/candidates/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          experienceData: apiData
        })
      });

      const responseData = await response.json();
      console.log('📥 API Response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to add experience');
      }

      const newExperience: Experience = {
        companyName: experienceData.companyName,
        designation: experienceData.designation,
        fromDate: (experienceData as any).fromDate || (experienceData as any).startDate || '',
        toDate: (experienceData as any).toDate || (experienceData as any).endDate || '',
        isCurrent: experienceData.isCurrent,
        companyProfile: experienceData.companyProfile,
        rolesResponsibilities: experienceData.rolesResponsibilities,
        keyAchievements: experienceData.keyAchievements,
        industry: experienceData.industry,
        level: experienceData.level,
        id: responseData.data.id.toString()
      };

      if (experienceData.isCurrent) {
        // If this is current experience, move existing current to previous
        if (profile.currentExperience) {
          setProfile(prev => ({
            ...prev,
            currentExperience: newExperience,
            previousExperiences: [prev.currentExperience!, ...prev.previousExperiences]
          }));
        } else {
          setProfile(prev => ({
            ...prev,
            currentExperience: newExperience
          }));
        }
      } else {
        setProfile(prev => ({
          ...prev,
          previousExperiences: [...prev.previousExperiences, newExperience]
        }));
      }
      setShowExperienceModal(false);
      setEditingExperience(null);
    } catch (error) {
      console.error('Error adding experience:', error);
      alert(error instanceof Error ? error.message : 'Failed to add experience. Please try again.');
    }
  };
  
  const handleUpdateExperience = async (id: string, experienceData: Partial<Experience>) => {
    try {
      // Get candidate ID from localStorage
      const candidateUser = localStorage.getItem('candidateUser');
      if (!candidateUser) {
        throw new Error('User data not found. Please login again.');
      }

      const userData = JSON.parse(candidateUser);
      const candidateId = userData.id;

      // Find the experience to determine its type
      const existingExp = profile.currentExperience?.id === id 
        ? profile.currentExperience 
        : profile.previousExperiences.find(exp => exp.id === id);
      
      const isInternship = profile.internships.some(exp => exp.id === id);

      // Map experience data to API format
      const apiData = {
        companyName: experienceData.companyName || existingExp?.companyName,
        designation: experienceData.designation || existingExp?.designation,
        startDate: (experienceData as any).fromDate || (experienceData as any).startDate || existingExp?.fromDate,
        endDate: (experienceData as any).toDate || (experienceData as any).endDate || existingExp?.toDate || null,
        isCurrent: experienceData.isCurrent !== undefined ? experienceData.isCurrent : existingExp?.isCurrent,
        industry: experienceData.industry || existingExp?.industry || null,
        level: experienceData.level || existingExp?.level || null,
        companyProfile: experienceData.companyProfile || existingExp?.companyProfile || null,
        rolesResponsibilities: experienceData.rolesResponsibilities || existingExp?.rolesResponsibilities || '',
        keyAchievements: experienceData.keyAchievements || existingExp?.keyAchievements || null,
        experienceType: isInternship ? 'internship' : 'work'
      };

      const response = await fetch('/api/candidates/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: id,
          experienceData: apiData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update experience');
      }

      if (profile.currentExperience?.id === id) {
        setProfile(prev => ({
          ...prev,
          currentExperience: { ...prev.currentExperience!, ...experienceData }
        }));
      } else {
        setProfile(prev => ({
          ...prev,
          previousExperiences: prev.previousExperiences.map(exp => 
            exp.id === id ? { ...exp, ...experienceData } : exp
          )
        }));
      }
      
      setShowExperienceModal(false);
      setEditingExperience(null);
    } catch (error) {
      console.error('Error updating experience:', error);
      alert(error instanceof Error ? error.message : 'Failed to update experience. Please try again.');
    }
  };

  const handleDeleteExperience = (id: string) => {
    if (profile.currentExperience?.id === id) {
      setProfile(prev => ({
        ...prev,
        currentExperience: undefined
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        previousExperiences: prev.previousExperiences.filter(exp => exp.id !== id)
      }));
    }
  };
  
  // Project modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState<{
    title: string;
    client: string;
    startDate: string;
    endDate: string;
    description: string;
    toolsTechnologies: string;
    duration?: string;
  }>({
    title: '',
    client: '',
    startDate: '',
    endDate: '',
    description: '',
    toolsTechnologies: '',
    duration: ''
  });

  
  
  // Accomplishment modal states
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [editingAccomplishment, setEditingAccomplishment] = useState<Accomplishment | null>(null);
  const [accomplishmentFormData, setAccomplishmentFormData] = useState({
    type: '' as 'award' | 'certification' | 'publication' | 'patent' | 'other',
    title: '',
    description: '',
    year: '',
    otherType: ''
  });
  
  // Certification modal states
  const [showCertificationModal, setShowCertificationModal] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [certificationFormData, setCertificationFormData] = useState({
    name: '',
    issuingBody: '',
    yearOfCompletion: '',
    validity: ''
  });
  
  // Phone country code dropdown states
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [showAlternatePhoneCountryDropdown, setShowAlternatePhoneCountryDropdown] = useState(false);
  const [showWhatsappCountryDropdown, setShowWhatsappCountryDropdown] = useState(false);
  
  // Location selector states for preferred locations
  const [newPreferredLocation, setNewPreferredLocation] = useState({
    country: '',
    state: '',
    city: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      currentLocation: {
        ...prev.currentLocation,
        [field]: value
      }
    }));
  };

  const handlePermanentLocationChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      permanentLocation: {
        ...prev.permanentLocation,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  // Resume handlers
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PDF and Word documents are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateId', candidateId || '');

      const response = await fetch('/api/candidates/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Update profile state with new resume data
        setProfile(prev => ({
          ...prev,
          resume: {
            resumeUrl: result.data.resumeUrl,
            resumeFilename: result.data.resumeFilename,
            resumeSize: result.data.resumeSize
          }
        }));
        alert('Resume uploaded successfully!');
      } else {
        alert(result.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume');
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to delete your resume?')) return;

    try {
      const response = await fetch(`/api/candidates/resume?candidateId=${candidateId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Update profile state to remove resume
        setProfile(prev => ({
          ...prev,
          resume: {
            resumeUrl: '',
            resumeFilename: '',
            resumeSize: 0
          }
        }));
        alert('Resume deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get candidate ID - try state first, then token, then localStorage
      let candidateIdToUse: string | null = candidateId; // Use state variable first
      
      // If state doesn't have it, try to get candidateId from token (most reliable)
      if (!candidateIdToUse) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              candidateIdToUse = String(payload.candidateId || payload.id || payload.sub || '');
            }
          } catch (error) {
            console.warn('Failed to decode token:', error);
          }
        }
      }

      // Fallback to localStorage if still no candidateId
      if (!candidateIdToUse) {
        const candidateUserStr = localStorage.getItem('candidateUser');
        const candidateDataStr = localStorage.getItem('candidateData');

        let parsed: any = null;
        try { 
          parsed = candidateUserStr ? JSON.parse(candidateUserStr) : null; 
        } catch (e) {
          console.warn('Failed to parse candidateUser:', e);
        }
        
        if (!parsed) {
          try { 
            parsed = candidateDataStr ? JSON.parse(candidateDataStr) : null; 
          } catch (e) {
            console.warn('Failed to parse candidateData:', e);
          }
        }

        if (parsed?.id) {
          candidateIdToUse = String(parsed.id);
        }
      }

      if (!candidateIdToUse) {
        throw new Error('User data not found. Please login again.');
      }

      // Prepare profile data for API
      const profileData = {
        dateOfBirth: profile.dateOfBirth,
        nationality: profile.nationality,
        origin: profile.origin,
        maritalStatus: profile.maritalStatus,
        currentLocation: {
          country: profile.currentLocation?.country || '',
          state: profile.currentLocation?.state || '',
          city: profile.currentLocation?.city || ''
        },
        permanentLocation: {
          country: profile.permanentLocation?.country || '',
          state: profile.permanentLocation?.state || '',
          city: profile.permanentLocation?.city || ''
        },
        currentAddress: {
          houseNo: profile.currentLocation?.houseNo || '',
          streetName: profile.currentLocation?.streetName || '',
          landmark: profile.currentLocation?.landmark || '',
          postalCode: ''
        },
        permanentAddress: {
          houseNo: profile.permanentLocation?.houseNo || '',
          streetName: profile.permanentLocation?.streetName || '',
          landmark: profile.permanentLocation?.landmark || '',
          postalCode: ''
        },
        jobPreferences: profile.jobPreferences,
        preferredLocations: profile.preferredLocations,
        isOpenForRelocation: profile.isOpenForRelocation
      };

      // Call the API to save profile data
      const response = await fetch('/api/candidates/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidateIdToUse,
          profileData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      setIsEditing(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Search and filter functions
  const searchNationalitiesLocal = (query: string) => {
    return searchNationalities(query);
  };

  const searchCountriesLocal = (query: string) => {
    return searchCountries(query);
  };

  const searchRegions = (country: string, query: string) => {
    return searchRegionsByCountry(country, query);
  };

  const searchCities = (country: string, region: string, query: string) => {
    return searchCitiesByRegion(country, region, query);
  };

  const searchLanguagesLocal = async (query: string) => {
    return await searchLanguages(query);
  };


  // Language management
  const handleAddLanguage = () => {
    // Initialize with defaults so user can immediately save without typing if desired
    setEditingLanguage({ 
      id: '', 
      language: '', 
      proficiency: 'Elementary Proficiency',
      certification: '',
      isNative: false
    });
    setShowLanguageModal(true);
  };

  const handleEditLanguage = (language: Language) => {
    setEditingLanguage(language);
    setShowLanguageModal(true);
  };

  const handleUpdateLanguage = (languageData: Language) => {
    const name = (languageData.language || '').trim();
    if (!name) {
      // Do not save empty language entries
      setShowLanguageModal(false);
      setEditingLanguage(null);
      return;
    }
    setProfile(prev => {
      const existingIndex = prev.languages.findIndex(
        l => l.language.toLowerCase() === name.toLowerCase()
      );
      if (existingIndex >= 0) {
        // Update proficiency of existing language
        const copy = [...prev.languages];
        copy[existingIndex] = { ...copy[existingIndex], proficiency: languageData.proficiency };
        return { ...prev, languages: copy };
      }
      // If editing an existing item (by id), update it; otherwise add new
      if (editingLanguage && editingLanguage.id) {
        return {
          ...prev,
          languages: prev.languages.map(lang =>
            lang.id === editingLanguage.id
              ? { 
                  ...languageData, 
                  id: editingLanguage.id, 
                  language: name,
                  certification: languageData.certification || '',
                  isNative: languageData.isNative || false
                }
              : lang
          )
        };
      }
      return {
        ...prev,
        languages: [...prev.languages, { 
          ...languageData, 
          id: Date.now().toString(), 
          language: name,
          certification: languageData.certification || '',
          isNative: languageData.isNative || false
        }]
      };
    });
    setShowLanguageModal(false);
    setEditingLanguage(null);
  };

  const handleRemoveLanguage = (id: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id)
    }));
  };

  const handleAddReference = () => {
    setEditingReference(null);
    setReferenceFormData({
      fullName: '', designation: '', organization: '', email: '', phone: '', relationship: 'manager', relationshipOther: '', isAuthorized: true, consentToContact: false
    });
    setReferencePhoneCode(profile.phone?.countryCode || '+1');
    setReferencePhoneNumber('');
    setShowReferenceModal(true);
  };

  const handleEditReference = (ref: Reference) => {
    setEditingReference(ref);
    setReferenceFormData({
      fullName: ref.fullName,
      designation: ref.designation,
      organization: ref.organization,
      email: ref.email,
      phone: ref.phone || '',
      relationship: ref.relationship,
      relationshipOther: ref.relationshipOther || '',
      isAuthorized: ref.isAuthorized,
      consentToContact: ref.consentToContact || false
    });
    setReferencePhoneCode(profile.phone?.countryCode || '+1');
    setReferencePhoneNumber(ref.phone || '');
    setShowReferenceModal(true);
  };

  const handleUpdateReference = () => {
    setReferenceError('');
    // Email validation
    const emailOk = /.+@.+\..+/.test(referenceFormData.email.trim());
    if (!emailOk) {
      setReferenceError('Please enter a valid email address for the reference.');
      return;
    }
    // Relationship 'other' validation
    if (referenceFormData.relationship === 'other' && !referenceFormData.relationshipOther?.trim()) {
      setReferenceError('Please specify the relationship.');
      return;
    }

    // Phone normalization
    let normalizedPhone: string | undefined = undefined;
    if (referencePhoneNumber && referencePhoneNumber.trim() !== '') {
      const e164 = toE164(referencePhoneCode || (profile.phone?.countryCode || '+1'), referencePhoneNumber.trim());
      if (!e164) {
        setReferenceError('Please enter a valid phone number for the reference.');
        return;
      }
      normalizedPhone = e164;
    } else if (referenceFormData.phone && referenceFormData.phone.trim() !== '') {
      const norm = normalizeAny(referenceFormData.phone.trim(), profile.phone?.countryCode);
      if (!norm.valid) {
        setReferenceError('Please enter a valid phone number for the reference.');
        return;
      }
      normalizedPhone = norm.e164 || undefined;
    }

    const data = referenceFormData;
    const newRef: Reference = {
      id: editingReference ? editingReference.id : Date.now().toString(),
      fullName: data.fullName.trim(),
      designation: data.designation.trim(),
      organization: data.organization.trim(),
      email: data.email.trim(),
      phone: normalizedPhone,
      linkedinProfile: undefined, // Removed - no longer used
      relationship: data.relationship,
      relationshipOther: data.relationship === 'other' ? data.relationshipOther?.trim() : undefined,
      verificationStatus: editingReference?.verificationStatus || 'pending',
      verificationDate: editingReference?.verificationDate,
      verificationComments: editingReference?.verificationComments,
      isAuthorized: data.isAuthorized,
      consentToContact: data.consentToContact
    };

    setProfile(prev => ({
      ...prev,
      references: editingReference
        ? prev.references.map(r => (r.id === editingReference.id ? newRef : r))
        : [...prev.references, newRef]
    }));

    setShowReferenceModal(false);
    setEditingReference(null);
  };

  // Function to send referee verification email
  const sendRefereeVerificationEmail = async (reference: Reference) => {
    try {
      const verificationLink = `${window.location.origin}/referee-verification?ref=${reference.id}&candidate=${profile.fullName}`;
      
      const response = await fetch('/api/send-referee-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refereeEmail: reference.email,
          candidateName: profile.fullName,
          referenceName: reference.fullName,
          verificationLink: verificationLink
        }),
      });

      if (response.ok) {
        console.log('Referee verification email sent successfully');
        // You could show a success message to the user here
      } else {
        console.error('Failed to send referee verification email');
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error sending referee verification email:', error);
      // You could show an error message to the user here
    }
  };

const handleRemoveReference = (id: string) => {
    setProfile(prev => ({ ...prev, references: prev.references.filter(r => r.id !== id) }));
  };

  // Skills management
  const handleAddSkill = () => {
    const name = skillInput.trim();
    if (!name) return;
    setProfile(prev => ({ ...prev, skills: [...prev.skills, { id: Date.now().toString(), name }] }));
    setSkillInput('');
    setShowSkillModal(false);
  };

  const handleRemoveSkill = (id: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
  };

  // Preferences chip handlers
  const handleAddIndustry = () => {
    const val = industriesInput.trim();
    if (!val) return;
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        industries: Array.from(new Set([...(prev.jobPreferences.industries || []), val]))
      }
    }));
    setIndustriesInput('');
  };

  // New functions for searchable preferred industries dropdown
  const handleAddPreferredIndustry = (industry: string) => {
    if (!industry.trim()) return;
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        industries: Array.from(new Set([...(prev.jobPreferences.industries || []), industry]))
      }
    }));
    setShowPreferredIndustriesDropdown(false);
    setPreferredIndustriesSearchTerm('');
  };

  const handleAddAnyIndustry = () => {
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        industries: ['Any Industry']
      }
    }));
    setShowPreferredIndustriesDropdown(false);
    setPreferredIndustriesSearchTerm('');
  };

  const handleAddCustomPreferredIndustry = () => {
    if (!customPreferredIndustry.trim()) return;
    handleAddPreferredIndustry(customPreferredIndustry);
    setShowCustomPreferredIndustry(false);
    setCustomPreferredIndustry('');
  };

  const handleRemoveIndustry = (name: string) => {
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        industries: (prev.jobPreferences.industries || []).filter(i => i !== name)
      }
    }));
  };

  const handleAddRole = () => {
    const val = rolesInput.trim();
    if (!val) return;
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        roles: Array.from(new Set([...(prev.jobPreferences.roles || []), val]))
      }
    }));
    setRolesInput('');
  };

  const handleRemoveRole = (name: string) => {
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        roles: (prev.jobPreferences.roles || []).filter(r => r !== name)
      }
    }));
  };

  // Education management
  const handleAddEducation = () => {
    setEditingEducation(null);
    setEducationFormData({
      institution: '',
      institutionISO2: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: '',
      description: '',
      otherLevel: '',
      category: '',
      qualification: ''
    });
    setShowEducationModal(true);
  };

  const handleEditEducation = (education: Education) => {
    setEditingEducation(education);
    
    // Format dates for date input (YYYY-MM-DD format)
    const formatDateForInput = (dateStr: string | undefined) => {
      if (!dateStr) return '';
      // If it's already in YYYY-MM-DD format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      // If it's in YYYY format, convert to YYYY-MM-DD (use January 1st)
      if (dateStr.match(/^\d{4}$/)) {
        return `${dateStr}-01-01`;
      }
      // Try to parse other formats
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Failed to parse date:', dateStr);
      }
      return '';
    };
    
    setEducationFormData({
      institution: education.institution || '',
      institutionISO2: (education as any).institutionISO2 || '',
      degree: education.degree || '',
      fieldOfStudy: education.fieldOfStudy || education.specialization || '',
      graduationYear: formatDateForInput(education.startDate), // Start date for graduationYear field
      description: education.description || '',
      otherLevel: formatDateForInput(education.endDate), // End date for otherLevel field
      category: education.category || '',
      qualification: education.qualification || education.degree || ''
    });
    
    // Set country if available
    if (education.country && education.country.trim() !== '') {
      const countryValue = education.country;
      setEducationCountry(countryValue);
      const countryOption = getCountryOptions().find(c => c.value === countryValue || c.value.toLowerCase() === countryValue.toLowerCase());
      const countryLabel = countryOption?.label || countryValue;
      setEduCountrySearch(countryLabel);
      console.log('Setting country:', countryValue, 'Label:', countryLabel);
    } else {
      setEducationCountry('');
      setEduCountrySearch('');
    }
    setShowEducationModal(true);
  };

  const handleUpdateEducation = async (educationData: Education) => {
    try {
      if (!candidateId) {
        console.error('No candidateId available');
        return;
      }

      const payload = {
        candidateId,
        educationData: {
          country: educationData.country || '',
          category: educationData.category || '',
          institution: educationData.institution,
          qualification: (educationData as any).qualification || educationData.degree || '',
          field_of_study: educationData.fieldOfStudy || educationData.specialization,
          start_date: educationData.startDate || educationData.graduationYear,
          end_date: educationData.endDate || educationData.yearOfPassing,
          description: educationData.description || ''
        }
      };

      if (editingEducation) {
        // Update existing education
        const response = await fetch('/api/candidates/education', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            educationId: editingEducation.id,
            educationData: payload.educationData
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update education');
        }
      } else {
        // Add new education
        const response = await fetch('/api/candidates/education', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Failed to add education');
        }
      }

      // Update local state
    if (editingEducation) {
      setProfile(prev => ({
        ...prev,
        education: prev.education.map(edu => 
          edu.id === editingEducation.id ? { ...educationData, id: editingEducation.id } : edu
        )
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        education: [...prev.education, { ...educationData, id: Date.now().toString() }]
      }));
    }

    setShowEducationModal(false);
    setEditingEducation(null);
    } catch (error) {
      console.error('Error saving education:', error);
      alert('Failed to save education. Please try again.');
    }
  };

  const handleRemoveEducation = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  // Salary management
  const handleAddSalary = () => {
    setSalaryFormData({
      currency: 'USD',
      currentSalary: '',
      expectedSalary: '',
      salaryType: 'annual',
      negotiable: false,
      benefits: '',
      noticePeriod: ''
    });
    setShowSalaryModal(true);
  };

  // Populate salary form data when editing
  const handleEditSalary = () => {
    setSalaryFormData({
      currency: profile.salaryInfo.currency || 'USD',
      currentSalary: '', // Removed - no longer used
      expectedSalary: profile.salaryInfo.expected ? String(profile.salaryInfo.expected) : '',
      salaryType: profile.salaryInfo.salaryType || 'annual',
      negotiable: profile.salaryInfo.negotiable || false,
      benefits: profile.salaryInfo.benefits || '',
      noticePeriod: profile.salaryInfo.noticePeriod || '' // Ensure noticePeriod is loaded
    });
    setShowSalaryModal(true);
  };

  const handleUpdateSalary = async () => {
    try {
      const response = await fetch('/api/candidates/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          salaryData: {
            currency: salaryFormData.currency,
            current_salary: null, // Removed - no longer used
            expected_salary: salaryFormData.expectedSalary || null,
            salary_type: salaryFormData.salaryType,
            is_negotiable: salaryFormData.negotiable ? 1 : 0,
            benefits: salaryFormData.benefits,
            notice_period: salaryFormData.noticePeriod || '' // Ensure notice_period is sent to API
          }
        })
      });

      if (response.ok) {
        // Update local state
        setProfile(prev => ({
          ...prev,
          salaryInfo: {
            currency: salaryFormData.currency as 'USD' | 'TZS' | 'EUR',
            current: undefined, // Removed - no longer used
            expected: salaryFormData.expectedSalary || undefined,
            salaryType: salaryFormData.salaryType,
            negotiable: salaryFormData.negotiable,
            benefits: salaryFormData.benefits,
            noticePeriod: salaryFormData.noticePeriod || '' // Ensure noticePeriod is saved
          }
        }));
        setShowSalaryModal(false);
      } else {
        console.error('Failed to save salary information');
      }
    } catch (error) {
      console.error('Error saving salary information:', error);
    }
  };

  // Online Presence management
  const handleAddOnlinePresence = () => {
    setOnlinePresenceFormData({
      linkedin: profile.onlinePresence.linkedin || '',
      github: profile.onlinePresence.github || '',
      portfolio: profile.onlinePresence.portfolio || '',
      otherProfiles: profile.onlinePresence.otherProfiles || []
    });
    setShowOnlinePresenceModal(true);
  };

  const handleUpdateOnlinePresence = async () => {
    try {
      const response = await fetch('/api/candidates/online-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          onlinePresenceData: {
            linkedin: onlinePresenceFormData.linkedin,
            github: onlinePresenceFormData.github,
            portfolio: onlinePresenceFormData.portfolio,
            otherProfiles: onlinePresenceFormData.otherProfiles
          }
        })
      });

      if (response.ok) {
        // Update local state
        setProfile(prev => ({
          ...prev,
          onlinePresence: {
            linkedin: onlinePresenceFormData.linkedin,
            github: onlinePresenceFormData.github,
            portfolio: onlinePresenceFormData.portfolio,
            otherProfiles: onlinePresenceFormData.otherProfiles
          }
        }));
        setShowOnlinePresenceModal(false);
      } else {
        console.error('Failed to save online presence information');
      }
    } catch (error) {
      console.error('Error saving online presence information:', error);
    }
  };

  // Employment management
  const handleAddEmployment = () => {
    setEditingExperience(null);
    setEmploymentFormData({
      companyName: '',
      designation: '',
      fromDate: '',
      toDate: '',
      isCurrent: false,
      companyProfile: '',
      rolesResponsibilities: '',
      keyAchievements: '',
      industry: '',
      functionalArea: ''
    });
    setShowExperienceModal(true);
  };

  const handleEditEmployment = (employment: Experience) => {
    setEditingExperience(employment);
    setEmploymentFormData({
      companyName: employment.companyName,
      designation: employment.designation,
      fromDate: employment.fromDate,
      toDate: employment.toDate,
      isCurrent: employment.isCurrent,
      companyProfile: employment.companyProfile,
      rolesResponsibilities: employment.rolesResponsibilities,
      keyAchievements: employment.keyAchievements,
      industry: employment.industry,
      functionalArea: (employment as any).functionalArea || ''
    });
    setShowExperienceModal(true);
  };

  const handleUpdateEmployment = () => {
    const experienceData: Experience = {
      id: editingExperience?.id || Date.now().toString(),
      companyName: employmentFormData.companyName || '',
      designation: employmentFormData.designation || '',
      fromDate: employmentFormData.fromDate || '',
      toDate: employmentFormData.toDate,
      isCurrent: employmentFormData.isCurrent,
      companyProfile: employmentFormData.companyProfile,
      rolesResponsibilities: employmentFormData.rolesResponsibilities,
      keyAchievements: employmentFormData.keyAchievements,
      industry: employmentFormData.industry,
      level: ''
    };
    
    if (editingExperience) {
      setProfile(prev => ({
        ...prev,
        previousExperiences: prev.previousExperiences.map(emp => 
          emp.id === editingExperience.id ? experienceData : emp
        )
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        previousExperiences: [...prev.previousExperiences, experienceData]
      }));
    }
    setShowExperienceModal(false);
    setEditingExperience(null);
  };

  const handleRemoveEmployment = (id: string) => {
    setProfile(prev => ({
      ...prev,
      previousExperiences: prev.previousExperiences.filter(emp => emp.id !== id)
    }));
  };

  // Project management
  const handleAddProject = () => {
    setEditingProject(null);
    setProjectFormData({
      title: '',
      client: '',
      startDate: '',
      endDate: '',
      description: '',
      toolsTechnologies: ''
    });
    setShowProjectModal(true);
  };

  // Format dates for date input (YYYY-MM-DD format)
  const formatDateForInput = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const s = typeof dateStr === 'string' ? dateStr.trim() : String(dateStr).trim();
    
    // If it's already in YYYY-MM-DD format, return as is
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return s;
    }
    
    // If it includes 'T' (ISO format with time), extract date part
    if (s.includes('T')) {
      return s.split('T')[0];
    }
    
    // If it's in YYYY format, convert to YYYY-MM-DD (use January 1st)
    if (s.match(/^\d{4}$/)) {
      return `${s}-01-01`;
    }
    
    // Try to parse DD/MM/YYYY or MM/DD/YYYY format
    const ddmmyyyyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      // Assume DD/MM/YYYY format
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    // Try to parse other date formats
    try {
      const date = new Date(s);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('Failed to parse date:', s);
    }
    
    return '';
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormData({
      title: project.title,
      client: project.client,
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      description: project.description,
      toolsTechnologies: project.toolsTechnologies
    });
    setShowProjectModal(true);
  };

  const handleUpdateProject = (projectData: Project) => {
    if (editingProject) {
      setProfile(prev => ({
        ...prev,
        projects: prev.projects.map(proj => 
          proj.id === editingProject.id ? { ...projectData, id: editingProject.id } : proj
        )
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        projects: [...prev.projects, { ...projectData, id: Date.now().toString() }]
      }));
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleRemoveProject = (id: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  // Accomplishment management
  const handleAddAccomplishment = () => {
    setEditingAccomplishment(null);
    setAccomplishmentFormData({
      type: 'award',
      title: '',
      description: '',
      year: '',
      otherType: ''
    });
    setShowAccomplishmentModal(true);
  };

  const handleEditAccomplishment = (accomplishment: Accomplishment) => {
    setEditingAccomplishment(accomplishment);
    setAccomplishmentFormData({
      type: accomplishment.type,
      title: accomplishment.title,
      description: accomplishment.description,
      year: accomplishment.year,
      otherType: accomplishment.otherType || ''
    });
    setShowAccomplishmentModal(true);
  };

  const handleUpdateAccomplishment = (accomplishmentData: Accomplishment) => {
    if (editingAccomplishment) {
      setProfile(prev => ({
        ...prev,
        accomplishments: prev.accomplishments.map(acc => 
          acc.id === editingAccomplishment.id ? { ...accomplishmentData, id: editingAccomplishment.id } : acc
        )
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        accomplishments: [...prev.accomplishments, { ...accomplishmentData, id: Date.now().toString() }]
      }));
    }
    setShowAccomplishmentModal(false);
    setEditingAccomplishment(null);
  };

  const handleRemoveAccomplishment = (id: string) => {
    setProfile(prev => ({
      ...prev,
      accomplishments: prev.accomplishments.filter(acc => acc.id !== id)
    }));
  };

  // Certification management
  const handleAddCertification = () => {
    setEditingCertification(null);
    setCertificationFormData({
      name: '',
      issuingBody: '',
      yearOfCompletion: '',
      validity: ''
    });
    setShowCertificationModal(true);
  };

  const handleEditCertification = (certification: Certification) => {
    setEditingCertification(certification);
    setCertificationFormData({
      name: certification.name,
      issuingBody: certification.issuingBody,
      yearOfCompletion: certification.yearOfCompletion,
      validity: certification.validity || ''
    });
    setShowCertificationModal(true);
  };

  const handleUpdateCertification = (certificationData: Certification) => {
    if (editingCertification) {
      setProfile(prev => ({
        ...prev,
        certifications: prev.certifications.map(cert => 
          cert.id === editingCertification.id ? { ...certificationData, id: editingCertification.id } : cert
        )
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...certificationData, id: Date.now().toString() }]
      }));
    }
    setShowCertificationModal(false);
    setEditingCertification(null);
  };

  const handleRemoveCertification = (id: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  // Calculate profile completion based on actual data
  const calculateProfileCompletion = () => {
    const completion = {
      personalInfo: !!(profile.firstName && profile.surname && profile.email && profile.phone.number && profile.dateOfBirth && profile.gender),
      employment: !!(profile.currentExperience || profile.previousExperiences.length > 0 || profile.internships.length > 0),
      education: profile.education.length > 0,
      salary: !!((profile.salaryInfo.current && parseFloat(profile.salaryInfo.current) > 0) || (profile.salaryInfo.expected && parseFloat(profile.salaryInfo.expected) > 0)),
      profileContent: !!(profile.resumeHeadline && profile.profileSummary),
      skills: profile.skills.length > 0,
      preferences: !!((profile.jobPreferences.industries && profile.jobPreferences.industries.length > 0) || (profile.jobPreferences.roles && profile.jobPreferences.roles.length > 0)),
      references: profile.references.length > 0
    };
    
    return completion;
  };

  const profileCompletion = calculateProfileCompletion();
  const isProfileComplete = Object.values(profileCompletion).every(Boolean);

  // Show shimmer loading while checking profile completion in background
  if (isLoadingProfile) {
    return (
      <CandidateLayout>
        <div className="w-full space-y-6">
          {/* Header Shimmer */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded-lg animate-shimmer"></div>
              <div className="h-5 w-80 bg-gray-200 rounded-lg animate-shimmer"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-shimmer"></div>
          </div>

          {/* Profile Photo and Basic Info Shimmer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full animate-shimmer"></div>
              <div className="flex-1 space-y-3">
                <div className="h-7 w-64 bg-gray-200 rounded-lg animate-shimmer"></div>
                <div className="h-5 w-48 bg-gray-200 rounded-lg animate-shimmer"></div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Section Shimmer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg mb-4 animate-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-10 w-full bg-gray-200 rounded-lg animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Section Shimmer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-40 bg-gray-200 rounded-lg animate-shimmer"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-shimmer"></div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-56 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education Section Shimmer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-36 bg-gray-200 rounded-lg animate-shimmer"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-shimmer"></div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-64 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-48 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section Shimmer */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4 animate-shimmer"></div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-8 w-24 bg-gray-200 rounded-full animate-shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }
  // Show wizard only if user explicitly opens it (via button click)
  // Always show the main profile page, even if incomplete
  // Users can't apply until 80% complete anyway, so showing the profile is fine
  if (showWizard && candidateId) {
    return (
      <CandidateLayout>
        <div className="w-full">
          <div className="mt-2">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <ProfileWizard
                candidateId={candidateId}
                onComplete={async () => {
                  // Close wizard and return to profile page immediately
                  setShowWizard(false);
                  
                  // Reload profile data to update completion percentage (without blocking UI)
                  setIsLoadingProfile(true);
                  try {
                    // Small delay to ensure database update completes
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                     const response = await fetch(`/api/candidates/profile?candidateId=${candidateId}`);
                    const result = await response.json();
                    if (result.success && result.data) {
                      const { candidate, profile: profileData, experience, education, references, projects, accomplishments, certifications, languages, skills, onlinePresence, jobPreferences, resume } = result.data;
                      setProfile(prev => ({
                        ...prev,
                        fullName: `${candidate.firstName} ${candidate.surname}`,
                        firstName: candidate.firstName || '',
                        middleName: candidate.middleName || '',
                        surname: candidate.surname || '',
                        email: candidate.email || '',
                        phone: (() => {
                          const parsed = splitPhoneNumber(candidate.phone, '+255');
                          return { countryCode: parsed.countryCode, number: parsed.number };
                        })(),
                        alternatePhone: (() => {
                          const parsed = splitPhoneNumber(candidate.alternatePhone, '+255');
                          return { countryCode: parsed.countryCode, number: parsed.number };
                        })(),
                        whatsapp: (() => {
                          const parsed = splitPhoneNumber(candidate.whatsapp, '+255');
                          return { countryCode: parsed.countryCode, number: parsed.number };
                        })(),
                        gender: candidate.gender || '',
                        dateOfBirth: profileData?.date_of_birth ? profileData.date_of_birth.split('T')[0] : '',
                        nationality: profileData?.nationality || '',
                        maritalStatus: profileData?.marital_status || '',
                        currentLocation: profileData?.current_address || profileData?.current_location || {},
                        permanentLocation: profileData?.permanent_address || profileData?.permanent_location || {},
                        isOpenForRelocation: ((profileData as any)?.isOpenForRelocation ?? profileData?.is_open_for_relocation) || 'no',
                        resumeHeadline: profileData?.resume_headline || '',
                        profileSummary: profileData?.profile_summary || '',
                        // Filter experience data by type
                        previousExperiences: experience
                          ?.filter((exp: any) => exp.experience_type === 'work')
                          .map((exp: any) => ({
                            id: exp.id.toString(),
                            companyName: exp.company_name,
                            designation: exp.designation,
                            fromDate: exp.start_date,
                            toDate: exp.end_date || '',
                            isCurrent: exp.is_current,
                            companyProfile: exp.description || '',
                            rolesResponsibilities: exp.description || '',
                            keyAchievements: exp.achievements || '',
                            industry: exp.industry,
                            level: exp.level
                          })) || [],
                        internships: experience
                          ?.filter((exp: any) => exp.experience_type === 'internship' || exp.experience_type === 'volunteering')
                          .map((exp: any) => ({
                            id: exp.id.toString(),
                            companyName: exp.company_name,
                            designation: exp.designation,
                            fromDate: exp.start_date,
                            toDate: exp.end_date || '',
                            isCurrent: exp.is_current,
                            companyProfile: exp.description || '',
                            rolesResponsibilities: exp.description || '',
                            keyAchievements: exp.achievements || '',
                            industry: exp.industry,
                            level: exp.level
                          })) || [],
                        education: education?.map((edu: any) => ({
                          id: edu.id.toString(),
                          degree: edu.qualification,
                          specialization: edu.field_of_study,
                          fieldOfStudy: edu.field_of_study,
                          institute: edu.institution,
                          institution: edu.institution,
                          yearOfPassing: edu.end_date?.split('-')[0] || '',
                          graduationYear: edu.end_date?.split('-')[0] || '',
                          startDate: edu.start_date,
                          endDate: edu.end_date,
                          isCurrent: edu.is_current,
                          grade: edu.grade,
                          description: edu.description,
                          isHighestQualification: false
                        })) || [],
                        // Transform salary data
                        salaryInfo: result.data.salary ? {
                          current: result.data.salary.current_salary ? result.data.salary.current_salary : undefined,
                          expected: result.data.salary.expected_salary ? result.data.salary.expected_salary : undefined,
                          currency: result.data.salary.currency || 'USD',
                          salaryType: result.data.salary.salary_type || 'annual',
                          negotiable: result.data.salary.is_negotiable === 1 || result.data.salary.is_negotiable === true,
                          benefits: result.data.salary.benefits || '',
                          noticePeriod: result.data.salary.notice_period || ''
                        } : {
                          current: undefined,
                          expected: undefined,
                          currency: 'USD',
                          salaryType: 'annual',
                          negotiable: false,
                          benefits: '',
                          noticePeriod: ''
                        },
                        references: references || [],
                        skills: result.data.skills?.map((skill: any) => ({
                          id: skill.id.toString(),
                          name: skill.skill_name
                        })) || [],
                        languages: result.data.languages || [],
                        // Transform job preferences data - API already returns processed object
                        jobPreferences: result.data.jobPreferences || {
                          jobType: 'full-time',
                          workMode: 'hybrid',
                          shiftTiming: 'day',
                          travelFlexibility: false,
                          noticePeriod: '',
                          industries: [],
                          roles: []
                        },
                        // Transform resume data
                        resume: result.data.resume ? {
                          resumeUrl: result.data.resume.resumeUrl || '',
                          resumeFilename: result.data.resume.resumeFilename || '',
                          resumeSize: result.data.resume.resumeSize || 0
                        } : {
                          resumeUrl: '',
                          resumeFilename: '',
                          resumeSize: 0
                        },
                        // Transform projects data
                        projects: projects?.map((project: any) => ({
                          id: project.id.toString(),
                          title: project.title,
                          client: project.client || '',
                          startDate: project.start_date,
                          endDate: project.end_date,
                          description: project.description || '',
                          toolsTechnologies: project.tools_technologies || '',
                          url: project.url || '',
                          isCurrent: project.is_current || false
                        })) || [],
                        // Transform accomplishments data
                        accomplishments: accomplishments?.map((accomplishment: any) => ({
                          id: accomplishment.id.toString(),
                          title: accomplishment.title,
                          year: accomplishment.year,
                          description: accomplishment.description || ''
                        })) || [],
                        // Transform certifications data
                        certifications: certifications?.map((certification: any) => ({
                          id: certification.id.toString(),
                          name: certification.name,
                          issuingOrganization: certification.issuing_organization || '',
                          issueDate: certification.issue_date,
                          expiryDate: certification.expiry_date,
                          credentialId: certification.credential_id || '',
                          credentialUrl: certification.credential_url || ''
                        })) || [],
                        // Transform online presence data
                        onlinePresence: onlinePresence ? {
                          linkedin: onlinePresence.linkedin || '',
                          github: onlinePresence.github || '',
                          portfolio: onlinePresence.portfolio || '',
                          otherProfiles: onlinePresence.otherProfiles || []
                        } : {
                          linkedin: '',
                          github: '',
                          portfolio: '',
                          otherProfiles: []
                        },
                        // Transform photo data
                        photoUrl: profileData?.photo_url || '',
                        photo: profileData?.photo_url ? {
                          photoUrl: profileData.photo_url,
                          filename: profileData.photo_url.split('/').pop() || '',
                          size: 0
                        } : null,
                        // Load preferred locations from API
                        preferredLocations: result.data.preferredLocations || result.data.preferred_locations || []
                      }));
                    }
                  } catch (error) {
                    console.error('Error reloading profile:', error);
                  } finally {
                    setIsLoadingProfile(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="w-full">
        {/* Loading overlay when completing profile */}
        {isLoadingProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Completing Profile</h3>
                <p className="text-gray-600">Preparing your profile page...</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Verify banner and Profile Completion at top */}
        {showVerifyBanner && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
            Email verified. Let's complete your profile.
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion</h2>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
            <div className="h-3 rounded-full bg-[#114373]" style={{ width: `${unifiedCompletionPercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{unifiedCompletionPercent}% complete</span>
            <button type="button" onClick={scrollToNextIncomplete} className="text-[#114373] hover:underline">
              Next missing section
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            {!isEditing ? (
              // Display View - Modern, clean layout
              <div className="flex items-start gap-6">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {profile.photo?.photoUrl ? (
                      <img src={profile.photo.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="w-8 h-8 bg-[#114373] rounded-full flex items-center justify-center mb-1 mx-auto">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Axia</p>
                        <p className="text-xs text-gray-400">Engage. Transform</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Details - Display Mode */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">First Name</p>
                      <p className="text-base font-medium text-gray-900">{profile.firstName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Middle Name</p>
                      <p className="text-base font-medium text-gray-900">{profile.middleName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Surname</p>
                      <p className="text-base font-medium text-gray-900">{profile.surname || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email Address</p>
                      <p className="text-base font-medium text-gray-900">{profile.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Gender</p>
                      <p className="text-base font-medium text-gray-900 capitalize">{profile.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                      <p className="text-base font-medium text-gray-900">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Marital Status</p>
                      <p className="text-base font-medium text-gray-900 capitalize">{profile.maritalStatus || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Origin</p>
                      <p className="text-base font-medium text-gray-900">{profile.origin || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nationality</p>
                      <p className="text-base font-medium text-gray-900">{profile.nationality || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit View - Form fields
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {profile.photo?.photoUrl ? (
                      <img src={profile.photo.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <div className="w-8 h-8 bg-[#114373] rounded-full flex items-center justify-center mb-1 mx-auto">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Axia</p>
                      <p className="text-xs text-gray-400">Engage. Transform</p>
                    </div>
                  )}
                </div>
                  <div className="mt-2 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="block text-sm text-[#114373] hover:underline cursor-pointer"
                    >
                      {profile.photo?.photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    {profile.photo?.photoUrl && (
                  <button 
                        onClick={handleDeletePhoto}
                        className="block text-sm text-red-600 hover:underline"
                  >
                        Remove Photo
                  </button>
                    )}
                  </div>
              </div>

                {/* Personal Details - Edit Mode */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={profile.firstName || ''}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="First name cannot be edited. Contact support if you need to change your name."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input
                      type="text"
                      value={profile.middleName || ''}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="Middle name cannot be edited. Contact support if you need to change your name."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surname *</label>
                    <input
                      type="text"
                      value={profile.surname || ''}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="Surname cannot be edited. Contact support if you need to change your name."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled={true}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      title="Email address cannot be edited. Contact support if you need to change your email."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={profile.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                    <select
                      value={profile.maritalStatus}
                      onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                    <div className="relative dropdown-container">
                      <input
                        type="text"
                        value={profile.origin}
                        onChange={(e) => {
                          handleInputChange('origin', e.target.value);
                          setShowOriginDropdown(true);
                        }}
                        onFocus={() => setShowOriginDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                        placeholder="Enter your origin"
                      />
                        {showOriginDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchNationalitiesLocal(profile.origin).map((origin, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange('origin', origin);
                                setShowOriginDropdown(false);
                              }}
                            >
                              {origin}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                    <div className="relative dropdown-container">
                      <input
                        type="text"
                        value={profile.nationality}
                        onChange={(e) => {
                          handleInputChange('nationality', e.target.value);
                          setShowNationalityDropdown(true);
                        }}
                        onFocus={() => setShowNationalityDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                        placeholder="Enter your nationality"
                      />
                        {showNationalityDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchNationalitiesLocal(profile.nationality).map((nationality, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange('nationality', nationality);
                                setShowNationalityDropdown(false);
                              }}
                            >
                              {nationality}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            {!isEditing ? (
              // Display View - Modern, clean layout
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {profile.phone?.countryCode && profile.phone?.number 
                      ? `${profile.phone.countryCode} ${profile.phone.number}` 
                      : '—'}
                  </p>
                </div>
                {profile.alternatePhone?.number && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alternate Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.alternatePhone.countryCode} {profile.alternatePhone.number}
                    </p>
                  </div>
                )}
                {profile.whatsapp?.number && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">WhatsApp Number</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.whatsapp.countryCode} {profile.whatsapp.number}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Edit View - Form fields
            <div className="space-y-4">
              <div>
                <PhoneNumberSelector
                  countryCode={profile.phone.countryCode}
                  phoneNumber={profile.phone.number}
                  onCountryCodeChange={(code) => handleInputChange('phone', { ...profile.phone, countryCode: code })}
                  onPhoneNumberChange={(number) => handleInputChange('phone', { ...profile.phone, number })}
                  label="Phone Number"
                  placeholder="123456789"
                  required={true}
                />
              </div>

              <div>
                <PhoneNumberSelector
                  countryCode={profile.alternatePhone?.countryCode || '+1'}
                  phoneNumber={profile.alternatePhone?.number || ''}
                  onCountryCodeChange={(code) => handleInputChange('alternatePhone', { 
                    countryCode: code, 
                    number: profile.alternatePhone?.number || '' 
                  })}
                  onPhoneNumberChange={(number) => handleInputChange('alternatePhone', { 
                    countryCode: profile.alternatePhone?.countryCode || '+1', 
                    number 
                  })}
                  label="Alternate Phone"
                  placeholder="123456789"
                  required={false}
                />
              </div>

              <div>
                <PhoneNumberSelector
                  countryCode={profile.whatsapp?.countryCode || '+1'}
                  phoneNumber={profile.whatsapp?.number || ''}
                  onCountryCodeChange={(code) => handleInputChange('whatsapp', { 
                    countryCode: code, 
                    number: profile.whatsapp?.number || '' 
                  })}
                  onPhoneNumberChange={(number) => handleInputChange('whatsapp', { 
                    countryCode: profile.whatsapp?.countryCode || '+1', 
                    number 
                  })}
                  label="WhatsApp Number"
                  placeholder="123456789"
                  required={false}
                />
              </div>
            </div>
            )}
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h2>
            
            {!isEditing ? (
              // Display View
              <div className="space-y-6">
                {/* Current Location */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Current Location</h3>
                  <div className="space-y-2">
                    {(profile.currentLocation.houseNo || profile.currentLocation.streetName) && (
                      <p className="text-base text-gray-900">
                        {[profile.currentLocation.houseNo, profile.currentLocation.streetName].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {profile.currentLocation.landmark && (
                      <p className="text-sm text-gray-600">Near: {profile.currentLocation.landmark}</p>
                    )}
                    {(profile.currentLocation.city || profile.currentLocation.state || profile.currentLocation.country) && (
                      <p className="text-base text-gray-900">
                        {[profile.currentLocation.city, profile.currentLocation.state, profile.currentLocation.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {!profile.currentLocation.city && !profile.currentLocation.country && (
                      <p className="text-sm text-gray-500">No location information provided</p>
                    )}
                  </div>
                </div>

                {/* Permanent Location */}
                {!profile.isSameAsCurrentAddress && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Permanent Location</h3>
                    <div className="space-y-2">
                      {(profile.permanentLocation.houseNo || profile.permanentLocation.streetName) && (
                        <p className="text-base text-gray-900">
                          {[profile.permanentLocation.houseNo, profile.permanentLocation.streetName].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {profile.permanentLocation.landmark && (
                        <p className="text-sm text-gray-600">Near: {profile.permanentLocation.landmark}</p>
                      )}
                      {(profile.permanentLocation.city || profile.permanentLocation.state || profile.permanentLocation.country) && (
                        <p className="text-base text-gray-900">
                          {[profile.permanentLocation.city, profile.permanentLocation.state, profile.permanentLocation.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {profile.isSameAsCurrentAddress && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Permanent Location</h3>
                    <p className="text-sm text-gray-600">Same as Current Location</p>
                  </div>
                )}

                {/* Relocation */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Open for Relocation</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{profile.isOpenForRelocation || '—'}</p>
                </div>

                {/* Preferred Locations */}
                {profile.isOpenForRelocation === 'yes' && profile.preferredLocations.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Preferred Work Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferredLocations.map((location, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Edit View - Keep existing form fields
            <div className="space-y-6">
              {/* Current Location */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-4">Current Location</h3>
                <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.currentLocation.country}
                        onChange={(e) => {
                          handleLocationChange('country', e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder="Select country"
                      />
                      {showCountryDropdown && isEditing && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchCountriesLocal(profile.currentLocation.country).map((country, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handleLocationChange('country', country);
                                setShowCountryDropdown(false);
                              }}
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {profile.currentLocation.country?.toLowerCase() === 'tanzania' ? 'Region' : 'Region/State'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.currentLocation.state}
                        onChange={(e) => {
                          handleLocationChange('state', e.target.value);
                          setShowRegionDropdown(true);
                        }}
                        onFocus={() => setShowRegionDropdown(true)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder={profile.currentLocation.country?.toLowerCase() === 'tanzania' ? 'Select region' : 'Select region/state'}
                      />
                      {showRegionDropdown && isEditing && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchRegions(profile.currentLocation.country, profile.currentLocation.state).map((region, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handleLocationChange('state', region);
                                setShowRegionDropdown(false);
                              }}
                            >
                              {region}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {profile.currentLocation.country?.toLowerCase() === 'tanzania' ? 'District/City' : 'District/City'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.currentLocation.city}
                        onChange={(e) => {
                          handleLocationChange('city', e.target.value);
                          setShowCityDropdown(true);
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder="Select district/city"
                      />
                      {showCityDropdown && isEditing && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchCities(profile.currentLocation.country, profile.currentLocation.state, profile.currentLocation.city).map((city, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handleLocationChange('city', city);
                                setShowCityDropdown(false);
                              }}
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permanent Location */}
              <div>
                <h3 className="text-md font-semibold text-gray-800 mb-4">Permanent Location</h3>
                
                {/* Same as Current Location Checkbox */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={profile.isSameAsCurrentAddress || false}
                      onChange={(e) => {
                        const isSame = e.target.checked;
                        setProfile(prev => ({
                          ...prev,
                          isSameAsCurrentAddress: isSame,
                          permanentLocation: isSame ? {
                            ...prev.currentLocation
                          } : prev.permanentLocation
                        }));
                      }}
                      disabled={!isEditing}
                      className="mr-2 text-[#114373] focus:ring-[#114373]"
                    />
                    <span className="text-sm text-gray-700">Same as Current Location</span>
                  </label>
                </div>

                {/* Location Details */}
                <div className={`${profile.isSameAsCurrentAddress ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.permanentLocation.country}
                        onChange={(e) => {
                          handlePermanentLocationChange('country', e.target.value);
                          setShowCountryDropdown(true);
                        }}
                        onFocus={() => setShowCountryDropdown(true)}
                          disabled={!isEditing || profile.isSameAsCurrentAddress}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder="Select country"
                      />
                        {showCountryDropdown && isEditing && !profile.isSameAsCurrentAddress && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchCountriesLocal(profile.permanentLocation.country).map((country, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handlePermanentLocationChange('country', country);
                                setShowCountryDropdown(false);
                              }}
                            >
                              {country}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {profile.permanentLocation.country?.toLowerCase() === 'tanzania' ? 'Region' : 'Region/State'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.permanentLocation.state}
                        onChange={(e) => {
                          handlePermanentLocationChange('state', e.target.value);
                          setShowRegionDropdown(true);
                        }}
                        onFocus={() => setShowRegionDropdown(true)}
                          disabled={!isEditing || profile.isSameAsCurrentAddress}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder={profile.permanentLocation.country?.toLowerCase() === 'tanzania' ? 'Select region' : 'Select region/state'}
                      />
                        {showRegionDropdown && isEditing && !profile.isSameAsCurrentAddress && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchRegions(profile.permanentLocation.country, profile.permanentLocation.state).map((region, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handlePermanentLocationChange('state', region);
                                setShowRegionDropdown(false);
                              }}
                            >
                              {region}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District/City</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.permanentLocation.city}
                        onChange={(e) => {
                          handlePermanentLocationChange('city', e.target.value);
                          setShowCityDropdown(true);
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                          disabled={!isEditing || profile.isSameAsCurrentAddress}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent disabled:bg-gray-100 text-gray-900"
                        placeholder="Select district/city"
                      />
                        {showCityDropdown && isEditing && !profile.isSameAsCurrentAddress && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchCities(profile.permanentLocation.country, profile.permanentLocation.state, profile.permanentLocation.city).map((city, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                              onClick={() => {
                                handlePermanentLocationChange('city', city);
                                setShowCityDropdown(false);
                              }}
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Relocation Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Are you open for relocation?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="relocation"
                      value="yes"
                      checked={profile.isOpenForRelocation === 'yes'}
                      onChange={(e) => handleInputChange('isOpenForRelocation', e.target.value)}
                      disabled={!isEditing}
                      className="mr-2 text-[#114373] focus:ring-[#114373]"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="relocation"
                      value="no"
                      checked={profile.isOpenForRelocation === 'no'}
                      onChange={(e) => handleInputChange('isOpenForRelocation', e.target.value)}
                      disabled={!isEditing}
                      className="mr-2 text-[#114373] focus:ring-[#114373]"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Preferred Work Locations - Only show if relocation is Yes */}
              {profile.isOpenForRelocation === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Work Locations
                    <span className="text-xs text-gray-500 ml-1">(Maximum 3 locations)</span>
                  </label>
                  
                  {/* Current Preferred Locations */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.preferredLocations.map((location, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        {location}
                        {isEditing && (
                          <button
                            onClick={() => {
                              setProfile(prev => ({
                                ...prev,
                                preferredLocations: prev.preferredLocations.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Add New Preferred Location */}
                  {isEditing && profile.preferredLocations.length < 3 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Preferred Location</h4>
                      <LocationSelector
                        selectedCountry={newPreferredLocation.country}
                        selectedState={newPreferredLocation.state}
                        selectedCity={newPreferredLocation.city}
                        onCountryChange={(country) => setNewPreferredLocation(prev => ({ ...prev, country, state: '', city: '' }))}
                        onStateChange={(state) => setNewPreferredLocation(prev => ({ ...prev, state, city: '' }))}
                        onCityChange={(city) => setNewPreferredLocation(prev => ({ ...prev, city }))}
                        showLabels={true}
                        className="mb-4"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              // Allow adding location with just country, or country+state, or country+state+city
                              if (newPreferredLocation.country) {
                                // Get proper country name from locationData
                                const countryName = locationData.getCountryByCode(newPreferredLocation.country)?.name || newPreferredLocation.country;
                                
                                let locationString = '';
                                
                                if (newPreferredLocation.city && newPreferredLocation.state) {
                                  // Full location: City, State, Country
                                  const states = locationData.getStatesByCountry(newPreferredLocation.country);
                                  const stateObj = states.find((s: any) => s.code === newPreferredLocation.state);
                                  const stateName = stateObj?.name || newPreferredLocation.state;
                                  locationString = `${newPreferredLocation.city}, ${stateName}, ${countryName}`;
                                } else if (newPreferredLocation.state) {
                                  // State and Country: State, Country
                                  const states = locationData.getStatesByCountry(newPreferredLocation.country);
                                  const stateObj = states.find((s: any) => s.code === newPreferredLocation.state);
                                  const stateName = stateObj?.name || newPreferredLocation.state;
                                  locationString = `${stateName}, ${countryName}`;
                                } else {
                                  // Just Country
                                  locationString = countryName;
                                }
                                
                                if (!profile.preferredLocations.includes(locationString)) {
                                  setProfile(prev => ({
                                    ...prev,
                                    preferredLocations: [...prev.preferredLocations, locationString]
                                  }));
                                  setNewPreferredLocation({ country: '', state: '', city: '' });
                                } else {
                                  alert('This location is already in your preferred locations list.');
                                }
                              } else {
                                alert('Please select at least a country.');
                              }
                            } catch (error) {
                              console.error('Error adding preferred location:', error);
                              alert('An error occurred while adding the location. Please try again.');
                            }
                          }}
                          disabled={!newPreferredLocation.country}
                          className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Add Location
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPreferredLocation({ country: '', state: '', city: '' })}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {profile.preferredLocations.length >= 3 && (
                    <p className="text-sm text-gray-500 mt-1">Maximum of 3 preferred locations reached.</p>
                  )}
                </div>
              )}
            </div>
            )}
          </div>

          {/* Professional Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h2>
            
            {!isEditing ? (
              // Display View
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Resume Headline</p>
                  <p className="text-base font-medium text-gray-900">{profile.resumeHeadline || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profile Summary</p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{profile.profileSummary || '—'}</p>
                </div>
              </div>
            ) : (
              // Edit View
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume Headline</label>
                <input
                  type="text"
                  value={profile.resumeHeadline}
                  onChange={(e) => handleInputChange('resumeHeadline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="e.g., Senior Software Engineer with 5+ years experience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Summary</label>
                <textarea
                  value={profile.profileSummary}
                  onChange={(e) => handleInputChange('profileSummary', e.target.value)}
                  rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="Describe your professional background, skills, and career objectives..."
                />
              </div>
            </div>
            )}
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Employment Details</h2>
            </div>
            
            {!isEditing ? (
              // Display View
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Experience Type</p>
                  <p className="text-base font-medium text-gray-900 capitalize">{profile.experienceType || '—'}</p>
                </div>
                {profile.experienceType === 'experienced' && (profile.totalExperienceYears || profile.totalExperienceMonths) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Experience</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.totalExperienceYears ? `${profile.totalExperienceYears} year${profile.totalExperienceYears > 1 ? 's' : ''}` : ''}
                      {profile.totalExperienceYears && profile.totalExperienceMonths ? ' ' : ''}
                      {profile.totalExperienceMonths ? `${profile.totalExperienceMonths} month${profile.totalExperienceMonths > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Edit View
            <div className="space-y-6">
              {/* Experience Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Experience Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="experienceType"
                      value="fresher"
                      checked={profile.experienceType === 'fresher'}
                      onChange={(e) => handleInputChange('experienceType', e.target.value)}
                      className="mr-2 h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Fresher</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="experienceType"
                      value="experienced"
                      checked={profile.experienceType === 'experienced'}
                      onChange={(e) => handleInputChange('experienceType', e.target.value)}
                      className="mr-2 h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Experienced</span>
                  </label>
                </div>
              </div>

              {/* Total Experience */}
              {profile.experienceType === 'experienced' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience (Years)</label>
                    <input
                      type="number"
                      value={profile.totalExperienceYears || ''}
                      onChange={(e) => handleInputChange('totalExperienceYears', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience (Months)</label>
                    <input
                      type="number"
                      value={profile.totalExperienceMonths || ''}
                      onChange={(e) => handleInputChange('totalExperienceMonths', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                      placeholder="0"
                      min="0"
                      max="11"
                    />
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Work Experience (Experienced) */}
          {profile.experienceType === 'experienced' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
              {isEditing && (
                <button 
                  onClick={() => { setExperienceContext('work'); setShowExperienceModal(true); }}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Current Experience */}
              {profile.currentExperience && (
                <div className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{profile.currentExperience.designation}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Current</span>
                      </div>
                      <p className="text-[#114373] font-medium mb-1">
                        {profile.currentExperience.companyName}
                        {profile.currentExperience.location && (
                          <>
                            {' '}-{' '}
                            {profile.currentExperience.location.city}
                            {profile.currentExperience.location.countryCode && (
                              <>, {locationData.getCountryByCode(profile.currentExperience.location.countryCode)?.name}</>
                            )}
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(profile.currentExperience.fromDate).toLocaleDateString()} - Present
                      </p>
                      <p className="text-sm text-gray-700 mb-2">{profile.currentExperience.companyProfile}</p>
                      <div className="text-sm text-gray-600">
                        <p><strong>Industry:</strong> {profile.currentExperience.industry || 'Not specified'}</p>
                        <p><strong>Designation:</strong> {profile.currentExperience.designation}</p>
                        <p><strong>Level:</strong> {profile.currentExperience.level || 'Not specified'}</p>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingExperience(profile.currentExperience!);
                            setShowExperienceModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExperience(profile.currentExperience!.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Previous Experiences */}
              {profile.previousExperiences.map((experience) => (
                <div key={experience.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Title - Most prominent */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{experience.designation}</h3>
                      
                      {/* Company Name */}
                      <p className="text-[#114373] font-semibold text-base mb-2">{experience.companyName}</p>
                      
                      {/* Employment Period */}
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(experience.fromDate).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} - {experience.isCurrent ? 'Present' : new Date(experience.toDate).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                      
                      {/* Company Description */}
                      {experience.companyProfile && (
                        <p className="text-sm text-gray-700 mb-3">{experience.companyProfile}</p>
                      )}
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Industry:</span>
                          <span className="text-gray-800">{experience.industry || 'Not specified'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Designation:</span>
                          <span className="text-gray-800">{experience.designation}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Level:</span>
                          <span className="text-gray-800">{experience.level || 'Not specified'}</span>
                        </div>
                        {experience.location && (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Location:</span>
                            <span className="text-gray-800">
                              {experience.location.city}
                              {experience.location.countryCode && (
                                <>, {locationData.getCountryByCode(experience.location.countryCode)?.name}</>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Roles & Responsibilities */}
                      {experience.rolesResponsibilities && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600 text-sm">Roles & Responsibilities:</span>
                          <p className="text-sm text-gray-800 mt-1">{experience.rolesResponsibilities}</p>
                        </div>
                      )}
                      
                      {/* Key Achievements */}
                      {experience.keyAchievements && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600 text-sm">Key Achievements:</span>
                          <p className="text-sm text-gray-800 mt-1">{experience.keyAchievements}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          onClick={() => {
                            setExperienceContext('work');
                            setEditingExperience(experience);
                            setShowExperienceModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Experience"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExperience(experience.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Experience"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Internships / Volunteering (Fresher) */}
          {profile.experienceType === 'fresher' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Internships / Volunteering</h2>
              {isEditing && (
                <button 
                  onClick={() => { setExperienceContext('internship'); setShowExperienceModal(true); }}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Internship / Volunteering
                </button>
              )}
            </div>

            <div className="space-y-4">
              {profile.internships.map((experience) => (
                <div key={experience.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job Title - Most prominent */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{experience.designation}</h3>
                      
                      {/* Company Name */}
                      <p className="text-[#114373] font-semibold text-base mb-2">{experience.companyName}</p>
                      
                      {/* Employment Period */}
                      <p className="text-sm text-gray-600 mb-3">
                        {new Date(experience.fromDate).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} - {experience.isCurrent ? 'Present' : new Date(experience.toDate).toLocaleDateString('en-US', { 
                          month: 'numeric', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                      
                      {/* Company Description */}
                      {experience.companyProfile && (
                        <p className="text-sm text-gray-700 mb-3">{experience.companyProfile}</p>
                      )}
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Industry:</span>
                          <span className="text-gray-800">{experience.industry || 'Not specified'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Designation:</span>
                          <span className="text-gray-800">{experience.designation}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Level:</span>
                          <span className="text-gray-800">{experience.level || 'Not specified'}</span>
                        </div>
                        {experience.location && (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Location:</span>
                            <span className="text-gray-800">
                              {experience.location.city}
                              {experience.location.countryCode && (
                                <>, {locationData.getCountryByCode(experience.location.countryCode)?.name}</>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Roles & Responsibilities */}
                      {experience.rolesResponsibilities && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600 text-sm">Roles & Responsibilities:</span>
                          <p className="text-sm text-gray-800 mt-1">{experience.rolesResponsibilities}</p>
                        </div>
                      )}
                      
                      {/* Key Achievements */}
                      {experience.keyAchievements && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-600 text-sm">Key Achievements:</span>
                          <p className="text-sm text-gray-800 mt-1">{experience.keyAchievements}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          onClick={() => {
                            setExperienceContext('internship');
                            setEditingExperience(experience);
                            setShowExperienceModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Internship"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExperience(experience.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Internship"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Education */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Education</h2>
              {isEditing && (
                <button 
                  onClick={handleAddEducation}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className="border-l-4 border-green-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                        {edu.isHighestQualification && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Highest</span>
                        )}
                      </div>
                      <p className="text-[#114373] font-medium mb-1">
                        {edu.institution}
                        {edu.country && `, ${edu.country}`}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Field of Study:</span> {edu.fieldOfStudy || edu.specialization}
                      </p>
                      {edu.category && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Category:</span> {edu.category}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Duration:</span> {edu.startDate ? new Date(edu.startDate).getFullYear() : 'Not specified'} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                      </p>
                      {(edu as any).grade && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Grade:</span> {(edu as any).grade}
                        </p>
                      )}
                      {edu.description && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Description:</span> {edu.description}
                        </p>
                      )}
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditEducation(edu)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          

          {/* Languages */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
              {isEditing && (
                <button 
                  onClick={handleAddLanguage}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Language
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.languages.map((language) => (
                <div key={language.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Language Name - Most prominent */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{language.language}</h3>
                      
                      {/* Proficiency Level */}
                      <p className="text-[#114373] font-semibold text-base mb-2">
                        Proficiency: {language.proficiency}
                      </p>
                      
                      {/* Native Language Badge */}
                      {language.isNative && (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                          Native Language
                        </div>
                      )}
                      
                      {/* Certification */}
                      {language.certification && (
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Certification:</span> {language.certification}
                        </p>
                      )}
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Language:</span>
                          <span className="text-gray-800">{language.language}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Proficiency:</span>
                          <span className="text-gray-800 capitalize">{language.proficiency}</span>
                        </div>
                        {language.certification && (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Certification:</span>
                            <span className="text-gray-800">{language.certification}</span>
                          </div>
                        )}
                        {language.isNative && (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Native Language:</span>
                            <span className="text-gray-800">Yes</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditLanguage(language)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Language"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveLanguage(language.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Language"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Information */}
          <div ref={salaryRef} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Salary Information</h2>
              {isEditing && (
                <button 
                  onClick={handleEditSalary}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Salary
                </button>
              )}
            </div>
            
            {!isEditing ? (
              // Display View
              profile.salaryInfo.currency && profile.salaryInfo.expected ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
              <div>
                      <p className="text-sm text-gray-500 mb-1">Currency</p>
                      <p className="text-base font-medium text-gray-900">
                      {profile.salaryInfo.currency}
                      </p>
                    </div>
                    {profile.salaryInfo.expected && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Expected Salary</p>
                        <p className="text-base font-medium text-gray-900">
                          {profile.salaryInfo.currency === 'TZS' ? 'TZS' : profile.salaryInfo.currency === 'EUR' ? '€' : '$'}{typeof profile.salaryInfo.expected === 'string' ? profile.salaryInfo.expected : (profile.salaryInfo.expected as number)?.toLocaleString() || profile.salaryInfo.expected}
                        </p>
              </div>
                    )}
                  <div>
                      <p className="text-sm text-gray-500 mb-1">Negotiable</p>
                      <p className="text-base font-medium text-gray-900">
                        {profile.salaryInfo.negotiable ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Salary Type</p>
                      <p className="text-base font-medium text-gray-900 capitalize">
                      {profile.salaryInfo.salaryType || 'Annual'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notice Period</p>
                      <p className="text-base font-medium text-gray-900">
                        {profile.salaryInfo.noticePeriod || '—'}
                      </p>
                  </div>
                    {profile.salaryInfo.benefits && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Benefits</p>
                        <p className="text-base font-medium text-gray-900">
                          {profile.salaryInfo.benefits}
                        </p>
                </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No salary information provided</p>
              )
            ) : (
              // Edit View - Show form fields or modal trigger
              profile.salaryInfo.currency && profile.salaryInfo.expected ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profile.salaryInfo.currency}
                </div>
              </div>
                  {profile.salaryInfo.expected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profile.salaryInfo.currency === 'TZS' ? 'TZS' : profile.salaryInfo.currency === 'EUR' ? '€' : '$'}{typeof profile.salaryInfo.expected === 'string' ? profile.salaryInfo.expected : (profile.salaryInfo.expected as number)?.toLocaleString() || profile.salaryInfo.expected}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Negotiable</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {profile.salaryInfo.negotiable ? 'Yes' : 'No'}
                </div>
              </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 capitalize">
                        {profile.salaryInfo.salaryType || 'Annual'}
                      </div>
                    </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {profile.salaryInfo.noticePeriod || 'Not specified'}
              </div>
            </div>
                {profile.salaryInfo.benefits && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {profile.salaryInfo.benefits}
                    </div>
                  </div>
                )}
                  </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No salary information provided</p>
                  <button 
                    onClick={() => setShowSalaryModal(true)}
                    className="text-[#114373] hover:underline text-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Salary Information
                  </button>
              </div>
              )
            )}
          </div>

          {/* References */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Professional References (At least 3)</h2>
              {isEditing && (
                <button onClick={handleAddReference} className="text-[#114373] hover:underline text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Reference
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.references.map((reference) => (
                <div key={reference.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Reference Name - Most prominent */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{reference.fullName || 'Name not specified'}</h3>
                      
                      {/* Professional Details */}
                      <div className="mb-4">
                        <p className="text-[#114373] font-semibold text-lg mb-1">{reference.designation || 'Designation not specified'}</p>
                        <p className="text-gray-700 font-medium">{reference.organization || 'Company not specified'}</p>
                      </div>
                      
                      {/* Contact Information */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 w-16">Email:</span>
                          <a href={`mailto:${reference.email}`} className="text-sm text-[#114373] hover:underline">
                            {reference.email}
                          </a>
                        </div>
                        {reference.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-16">Phone:</span>
                            <a href={`tel:${reference.phone}`} className="text-sm text-[#114373] hover:underline">
                              {reference.phone}
                            </a>
                          </div>
                        )}
                        {reference.linkedinProfile && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-16">LinkedIn:</span>
                            <a 
                              href={reference.linkedinProfile} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-[#114373] hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Relationship and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">Relationship:</span>
                          <span className="text-sm text-gray-800 capitalize font-medium">
                            {reference.relationship || 'Not specified'}
                          </span>
                        </div>
                        {reference.verificationStatus && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            reference.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : 
                            reference.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {reference.verificationStatus === 'verified' ? 'Verified' : 
                             reference.verificationStatus === 'pending' ? 'Contact pending' : 
                             'Unverified'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditReference(reference)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Reference"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveReference(reference.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Reference"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Projects */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
              {isEditing && (
                <button
                  onClick={handleAddProject}
                  className="px-3 py-1 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.projects.map((project) => (
                <div key={project.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Project Title - Most prominent */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                      
                      {/* Client and Duration */}
                      <div className="mb-4">
                        <p className="text-[#114373] font-semibold text-lg mb-1">{project.client}</p>
                        <p className="text-gray-700 font-medium">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'} 
                          {project.endDate ? ` - ${new Date(project.endDate).toLocaleDateString()}` : ' - Present'}
                        </p>
                      </div>
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Project:</span>
                            <p className="text-sm text-gray-800 font-medium">{project.title}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Client:</span>
                            <p className="text-sm text-gray-800 font-medium">{project.client}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Technologies:</span>
                            <p className="text-sm text-gray-800 font-medium">{project.toolsTechnologies || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Duration:</span>
                            <p className="text-sm text-gray-800 font-medium">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not specified'} 
                              {project.endDate ? ` - ${new Date(project.endDate).toLocaleDateString()}` : ' - Present'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Project Description */}
                      {project.description && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-600 block mb-2">Description:</span>
                          <p className="text-sm text-gray-800 leading-relaxed">{project.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveProject(project.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accomplishments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Accomplishments</h2>
              {isEditing && (
                <button
                  onClick={handleAddAccomplishment}
                  className="px-3 py-1 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Accomplishment
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.accomplishments.map((accomplishment) => (
                <div key={accomplishment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Accomplishment Title - Most prominent */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{accomplishment.title}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize font-medium">
                          {accomplishment.type}
                        </span>
                      </div>
                      
                      {/* Year */}
                      <p className="text-[#114373] font-semibold text-lg mb-3">{accomplishment.year}</p>
                      
                      {/* Description */}
                      {accomplishment.description && (
                        <div className="mb-3">
                          <span className="font-medium text-gray-600 text-sm">Description:</span>
                          <p className="text-sm text-gray-800 mt-1 leading-relaxed">{accomplishment.description}</p>
                        </div>
                      )}
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Title:</span>
                          <span className="text-gray-800">{accomplishment.title}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Type:</span>
                          <span className="text-gray-800 capitalize">{accomplishment.type}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Year:</span>
                          <span className="text-gray-800">{accomplishment.year}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditAccomplishment(accomplishment)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Accomplishment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveAccomplishment(accomplishment.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Accomplishment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
              {isEditing && (
                <button
                  onClick={handleAddCertification}
                  className="px-3 py-1 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Certification
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {profile.certifications.map((certification) => (
                <div key={certification.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Certification Name - Most prominent */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{certification.name}</h3>
                      
                      {/* Issuing Body */}
                      <p className="text-[#114373] font-semibold text-lg mb-3">{certification.issuingBody}</p>
                      
                      {/* Year of Completion */}
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Year of Completion:</span> {certification.yearOfCompletion}
                      </p>
                      
                      {/* Validity Period */}
                      {certification.validity && (
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Validity:</span> {certification.validity}
                        </p>
                      )}
                      
                      {/* Detailed Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Certification:</span>
                          <span className="text-gray-800">{certification.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Issuing Body:</span>
                          <span className="text-gray-800">{certification.issuingBody}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-600">Year of Completion:</span>
                          <span className="text-gray-800">{certification.yearOfCompletion}</span>
                        </div>
                        {certification.validity && (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-600">Validity:</span>
                            <span className="text-gray-800">{certification.validity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditCertification(certification)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Certification"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveCertification(certification.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Certification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          

          

          {/* Online Presence */}
          <div ref={onlinePresenceRef} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Online Presence</h2>
              {isEditing && (
                <button 
                  onClick={handleAddOnlinePresence}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Online Presence
                </button>
              )}
            </div>
            
            {!isEditing ? (
              // Display View
              profile.onlinePresence.linkedin || profile.onlinePresence.github || profile.onlinePresence.portfolio || (profile.onlinePresence.otherProfiles && profile.onlinePresence.otherProfiles.length > 0) ? (
                <div className="space-y-4">
                  {profile.onlinePresence.linkedin && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">LinkedIn Profile</p>
                      <a 
                        href={profile.onlinePresence.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base text-[#114373] hover:underline font-medium"
                      >
                        {profile.onlinePresence.linkedin}
                      </a>
                    </div>
                  )}
                  
                  {profile.onlinePresence.github && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">GitHub Profile</p>
                      <a 
                        href={profile.onlinePresence.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base text-[#114373] hover:underline font-medium"
                      >
                        {profile.onlinePresence.github}
                      </a>
                    </div>
                  )}
                  
                  {profile.onlinePresence.portfolio && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Portfolio Website</p>
                      <a 
                        href={profile.onlinePresence.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base text-[#114373] hover:underline font-medium"
                      >
                        {profile.onlinePresence.portfolio}
                      </a>
                    </div>
                  )}
                  
                  {profile.onlinePresence.otherProfiles && profile.onlinePresence.otherProfiles.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Other Profiles</p>
                      <div className="space-y-2">
                        {profile.onlinePresence.otherProfiles.map((profileUrl, index) => (
                          <div key={index}>
                            <a 
                              href={profileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-base text-[#114373] hover:underline font-medium"
                            >
                              {profileUrl}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No online presence information provided</p>
              )
            ) : (
              // Edit View - Show modal trigger or existing edit form
              profile.onlinePresence.linkedin || profile.onlinePresence.github || profile.onlinePresence.portfolio || (profile.onlinePresence.otherProfiles && profile.onlinePresence.otherProfiles.length > 0) ? (
            <div className="space-y-4">
                {profile.onlinePresence.linkedin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <a 
                        href={profile.onlinePresence.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#114373] hover:underline"
                      >
                        {profile.onlinePresence.linkedin}
                      </a>
              </div>
                  </div>
                )}
                
                {profile.onlinePresence.github && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <a 
                        href={profile.onlinePresence.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#114373] hover:underline"
                      >
                        {profile.onlinePresence.github}
                      </a>
              </div>
                  </div>
                )}
                
                {profile.onlinePresence.portfolio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Website</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <a 
                        href={profile.onlinePresence.portfolio} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#114373] hover:underline"
                      >
                        {profile.onlinePresence.portfolio}
                      </a>
              </div>
            </div>
                )}
                
                {profile.onlinePresence.otherProfiles && profile.onlinePresence.otherProfiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Other Profiles</label>
                    <div className="space-y-2">
                        {profile.onlinePresence.otherProfiles.map((profileUrl, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <a 
                              href={profileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#114373] hover:underline"
                          >
                              {profileUrl}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No online presence information provided</p>
                  <button 
                    onClick={handleAddOnlinePresence}
                    className="text-[#114373] hover:underline text-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Online Presence
                  </button>
              </div>
              )
            )}
          </div>

       

          {/* Skills */}
          <div ref={skillsRef} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
              {isEditing && (
                <button onClick={() => { setEditingSkill(null); setSkillInput(''); setShowSkillModal(true); }} className="text-[#114373] hover:underline text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Skill
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span key={skill.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
                  {skill.name}
                  {isEditing && (
                    <button onClick={() => handleRemoveSkill(skill.id)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Job Preferences */}
          <div ref={preferencesRef} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Job Preferences</h2>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Job Preferences
                </button>
              )}
            </div>
            
            {!isEditing ? (
              // Display View - Two Column Layout
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Job Type</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.jobPreferences.jobType ? profile.jobPreferences.jobType.charAt(0).toUpperCase() + profile.jobPreferences.jobType.slice(1) : '—'}
                    </p>
                </div>
                
                <div>
                    <p className="text-sm text-gray-500 mb-1">Shift Timing</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.jobPreferences.shiftTiming ? profile.jobPreferences.shiftTiming.charAt(0).toUpperCase() + profile.jobPreferences.shiftTiming.slice(1) : '—'}
                    </p>
                </div>
                
                <div>
                    <p className="text-sm text-gray-500 mb-1">Travel Flexibility</p>
                    <p className="text-base font-medium text-gray-900">
                    {profile.jobPreferences.travelFlexibility ? 'Yes' : 'No'}
                    </p>
                </div>
                
            </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Work Mode</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.jobPreferences.workMode ? profile.jobPreferences.workMode.charAt(0).toUpperCase() + profile.jobPreferences.workMode.slice(1) : '—'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notice Period</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.jobPreferences.noticePeriod || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Relocation Preference</p>
                    <p className="text-base font-medium text-gray-900">
                      {profile.isOpenForRelocation === 'yes' ? 'Yes' : 'No'}
                    </p>
                  </div>
                  
                  {/* Preferred Industries */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preferred Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.jobPreferences.industries && profile.jobPreferences.industries.length > 0 ? (
                        profile.jobPreferences.industries.map((industry, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {industry}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No industries specified</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Preferred Roles */}
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Preferred Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.jobPreferences.roles && profile.jobPreferences.roles.length > 0 ? (
                        profile.jobPreferences.roles.map((role, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No roles specified</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Preferred Locations - Only show if relocation is "yes" */}
                  {profile.isOpenForRelocation === 'yes' && profile.preferredLocations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Preferred Work Locations</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferredLocations.map((location, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Edit View - Only show editable fields
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select
                  value={profile.jobPreferences.jobType}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    jobPreferences: { ...prev.jobPreferences, jobType: e.target.value as any }
                  }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="fixed-term">Fixed-term</option>
                </select>
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Timing</label>
                <select
                  value={profile.jobPreferences.shiftTiming}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    jobPreferences: { ...prev.jobPreferences, shiftTiming: e.target.value as any }
                  }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                >
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                <input
                  type="text"
                  value={profile.jobPreferences.noticePeriod || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    jobPreferences: { ...prev.jobPreferences, noticePeriod: e.target.value }
                  }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="e.g., 30 days"
                />
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Industries</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile.jobPreferences.industries || []).map(ind => (
                    <span key={ind} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
                      {ind}
                      <button onClick={() => handleRemoveIndustry(ind)} className="text-gray-400 hover:text-gray-600" aria-label={`Remove ${ind}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative" ref={preferredIndustriesDropdownRef}>
                  <input
                    type="text"
                    value={preferredIndustriesSearchTerm}
                    onChange={(e) => {
                      setPreferredIndustriesSearchTerm(e.target.value);
                      setShowPreferredIndustriesDropdown(true);
                    }}
                    onFocus={() => setShowPreferredIndustriesDropdown(true)}
                    placeholder="Search industries..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  />
                  {showPreferredIndustriesDropdown && filteredPreferredIndustries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPreferredIndustries.map((industry, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            handleAddPreferredIndustry(industry);
                            setShowPreferredIndustriesDropdown(false);
                            setPreferredIndustriesSearchTerm('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-900 font-medium"
                        >
                          {industry}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Roles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile.jobPreferences.roles || []).map(role => (
                    <span key={role} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
                      {role}
                      <button onClick={() => handleRemoveRole(role)} className="text-gray-400 hover:text-gray-600" aria-label={`Remove ${role}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative" ref={rolesDropdownRef}>
                  <input
                    type="text"
                    value={rolesSearchTerm}
                    onChange={(e) => {
                      setRolesSearchTerm(e.target.value);
                      setShowRolesDropdown(true);
                    }}
                    onFocus={() => setShowRolesDropdown(true)}
                    placeholder="Search roles..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  />
                  {showRolesDropdown && filteredRoles.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredRoles.map((role, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!profile.jobPreferences.roles?.includes(role)) {
                              setProfile(prev => ({
                                ...prev,
                                jobPreferences: {
                                  ...prev.jobPreferences,
                                  roles: [...(prev.jobPreferences.roles || []), role]
                                }
                              }));
                            }
                            setShowRolesDropdown(false);
                            setRolesSearchTerm('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-900 font-medium"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
                  
          </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                    <select
                      value={profile.jobPreferences.workMode}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        jobPreferences: { ...prev.jobPreferences, workMode: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    >
                      <option value="on-site">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
        </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                    <input
                      type="text"
                      value={profile.jobPreferences.noticePeriod || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        jobPreferences: { ...prev.jobPreferences, noticePeriod: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      placeholder="e.g., 30 days"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relocation Preference</label>
                    <select
                      value={profile.isOpenForRelocation}
                      onChange={(e) => {
                        const value = e.target.value as 'yes' | 'no';
                        setProfile(prev => {
                          const updated = { ...prev, isOpenForRelocation: value };
                          // If relocation is changed to "no", clear preferred locations
                          if (value === 'no') {
                            updated.preferredLocations = [];
                          }
                          return updated;
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  
                  {/* Preferred Locations - Only show if relocation is "yes" */}
                  {profile.isOpenForRelocation === 'yes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Work Locations</label>
                      <div className="space-y-4">
                        {/* Current Preferred Locations */}
                        {profile.preferredLocations.length > 0 && (
                          <div className="space-y-2">
                            {profile.preferredLocations.map((location, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                                  {location}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfile(prev => ({
                                      ...prev,
                                      preferredLocations: prev.preferredLocations.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Preferred Location */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Preferred Location</h4>
                          <LocationSelector
                            selectedCountry={newPreferredLocation.country}
                            selectedState={newPreferredLocation.state}
                            selectedCity={newPreferredLocation.city}
                            onCountryChange={(country) => setNewPreferredLocation(prev => ({ ...prev, country, state: '', city: '' }))}
                            onStateChange={(state) => setNewPreferredLocation(prev => ({ ...prev, state, city: '' }))}
                            onCityChange={(city) => setNewPreferredLocation(prev => ({ ...prev, city }))}
                            showLabels={false}
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const { locationData } = require('@/utils/locationData');
                                const countryName = locationData.getCountryByCode(newPreferredLocation.country)?.name || newPreferredLocation.country;
                                const states = locationData.getStatesByCountry(newPreferredLocation.country);
                                const stateObj = states.find((s: State) => s.code === newPreferredLocation.state);
                                const stateName = stateObj?.name || newPreferredLocation.state;
                                
                                let locationString = '';
                                if (newPreferredLocation.city && newPreferredLocation.state) {
                                  locationString = `${newPreferredLocation.city}, ${stateName}, ${countryName}`;
                                } else if (newPreferredLocation.state) {
                                  locationString = `${stateName}, ${countryName}`;
                                } else {
                                  locationString = countryName;
                                }
                                
                                if (newPreferredLocation.country && !profile.preferredLocations.includes(locationString)) {
                                  setProfile(prev => ({
                                    ...prev,
                                    preferredLocations: [...prev.preferredLocations, locationString]
                                  }));
                                  setNewPreferredLocation({ country: '', state: '', city: '' });
                                }
                              }}
                              disabled={!newPreferredLocation.country}
                              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Add Location
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
      </div>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingLanguage && editingLanguage.id ? 'Edit Language' : 'Add Language'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowLanguageModal(false); setEditingLanguage(null); }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingLanguage?.language || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (editingLanguage) {
                        setEditingLanguage({ ...editingLanguage, language: val });
                      } else {
                        setEditingLanguage({ id: '', language: val, proficiency: 'Elementary Proficiency' });
                      }
                      setLanguageSearchQuery(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="Search languages..."
                  />
                  {languageSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {languageSearchResults.map((language, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                          onClick={() => {
                            if (editingLanguage) {
                              setEditingLanguage({ ...editingLanguage, language });
                            } else {
                              setEditingLanguage({ id: '', language, proficiency: 'Elementary Proficiency' });
                            }
                            setLanguageSearchQuery('');
                          }}
                        >
                          {language}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proficiency Level</label>
                <select
                  value={editingLanguage?.proficiency || 'Elementary Proficiency'}
                  onChange={(e) => {
                    if (editingLanguage) {
                      setEditingLanguage({ ...editingLanguage, proficiency: e.target.value as LanguageProficiency });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                >
                  {getLanguageProficiencyLevels().map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certification (Optional)</label>
                <input
                  type="text"
                  value={editingLanguage?.certification || ''}
                  onChange={(e) => {
                    if (editingLanguage) {
                      setEditingLanguage({ ...editingLanguage, certification: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="e.g., TOEFL, IELTS, DELE, etc."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNative"
                  checked={editingLanguage?.isNative || false}
                  onChange={(e) => {
                    if (editingLanguage) {
                      setEditingLanguage({ ...editingLanguage, isNative: e.target.checked });
                    }
                  }}
                  className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
                />
                <label htmlFor="isNative" className="ml-2 block text-sm text-gray-700">
                  This is my native language
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLanguageModal(false);
                  setEditingLanguage(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Always attempt to save using current editingLanguage (initialized on open)
                  if (editingLanguage) handleUpdateLanguage(editingLanguage);
                }}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]"
              >
                {editingLanguage && editingLanguage.id ? 'Update' : 'Add'} Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Modal */}
      {showReferenceModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{editingReference ? 'Edit Reference' : 'Add Reference'}</h3>
              <button type="button" onClick={() => { setShowReferenceModal(false); setEditingReference(null); }} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input type="text" value={referenceFormData.fullName} onChange={(e)=>setReferenceFormData(p=>({...p, fullName:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <div className="relative" ref={referenceDesignationDropdownRef}>
                  <input
                    type="text"
                    value={referenceFormData.designation}
                    onChange={(e) => {
                      setReferenceFormData(p => ({ ...p, designation: e.target.value }));
                      setReferenceDesignationSearchTerm(e.target.value);
                    }}
                    placeholder="Search or select designation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    onFocus={() => setShowReferenceDesignationDropdown(true)}
                  />
                  {showReferenceDesignationDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredReferenceDesignations.length > 0 ? (
                        <>
                          {filteredReferenceDesignations.map((designation, index) => (
                            <button
                              key={`${designation}-${index}`}
                              type="button"
                              onClick={() => {
                                setReferenceFormData(p => ({ ...p, designation }));
                                setShowReferenceDesignationDropdown(false);
                                setReferenceDesignationSearchTerm('');
                                setShowCustomReferenceDesignation(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                            >
                              {designation}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomReferenceDesignation(true);
                              setShowReferenceDesignationDropdown(false);
                              setReferenceDesignationSearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-gray-700 border-t border-gray-200"
                          >
                            + Others (Specify)
                          </button>
                        </>
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                          No designations found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Custom Reference Designation Input */}
              {showCustomReferenceDesignation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specify Designation</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customReferenceDesignation}
                      onChange={(e) => {
                        setCustomReferenceDesignation(e.target.value);
                        setReferenceFormData(p => ({ ...p, designation: e.target.value }));
                      }}
                      placeholder="Enter designation..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomReferenceDesignation(false);
                        setCustomReferenceDesignation('');
                        setReferenceFormData(p => ({ ...p, designation: '' }));
                      }}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <input type="text" value={referenceFormData.organization} onChange={(e)=>setReferenceFormData(p=>({...p, organization:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" value={referenceFormData.email} onChange={(e)=>setReferenceFormData(p=>({...p, email:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900" />
                {referenceError && (<p className="text-sm text-red-600 mt-1">{referenceError}</p>)}
              </div>
              <div>
                <PhoneNumberSelector
                  countryCode={referencePhoneCode}
                  phoneNumber={referencePhoneNumber}
                  onCountryCodeChange={(code) => setReferencePhoneCode(code)}
                  onPhoneNumberChange={(num) => setReferencePhoneNumber(num)}
                  label="Phone"
                  placeholder="712345678"
                  required={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select value={referenceFormData.relationship} onChange={(e)=>setReferenceFormData(p=>({...p, relationship:e.target.value as any}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900">
                  <option value="manager">Manager</option>
                  <option value="colleague">Colleague</option>
                  <option value="client">Client</option>
                  <option value="mentor">Mentor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {referenceFormData.relationship === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specify Relationship</label>
                  <input type="text" value={referenceFormData.relationshipOther || ''} onChange={(e)=>setReferenceFormData(p=>({...p, relationshipOther:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900" />
                </div>
              )}
            </div>
            
            {/* Consent Checkbox */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={referenceFormData.consentToContact || false}
                  onChange={(e) => setReferenceFormData(prev => ({ ...prev, consentToContact: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373]"
                  required
                />
                <span className="text-sm text-gray-700">
                  <strong>I confirm these professional references may be contacted by Axia HR.</strong>
                  <br />
                  <span className="text-xs text-gray-600 mt-1 block">
                    The platform will use these details for direct referee contact when needed. No separate manual verification step is required from you here.
                  </span>
                </span>
              </label>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>{setShowReferenceModal(false); setEditingReference(null);}} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleUpdateReference} className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]">{editingReference ? 'Update' : 'Add'} Reference</button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Skill</h3>
              <button type="button" onClick={() => { setShowSkillModal(false); setSkillInput(''); }} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
              <input type="text" value={skillInput} onChange={(e)=>setSkillInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900" placeholder="e.g., React, Node.js" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>{setShowSkillModal(false); setSkillInput('');}} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleAddSkill} className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]">Add Skill</button>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEducationModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEducation ? 'Edit Education' : 'Add Education'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowEducationModal(false); setEditingEducation(null); }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" onFocus={() => setShowEduCountryDropdown(true)}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={eduCountrySearch}
                    onChange={(e) => setEduCountrySearch(e.target.value)}
                    onBlur={() => setTimeout(() => setShowEduCountryDropdown(false), 200)}
                    onFocus={() => setShowEduCountryDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="Type to search country..."
                  />
                  {showEduCountryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {getCountryOptions()
                        .filter(c => c.label.toLowerCase().includes(eduCountrySearch.toLowerCase()))
                        .map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              setEducationCountry(c.value);
                              setEduCountrySearch(c.label);
                              setShowEduCountryDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${educationCountry === c.value ? 'bg-[#114373] text-white hover:bg-[#0d3559]' : 'text-gray-900 hover:text-gray-700'}`}
                          >
                            {c.label}
                          </button>
                        ))}
                    </div>
                  )}
                  {educationCountry && (
                    <p className="mt-1 text-xs text-gray-500">Selected: {getCountryOptions().find(c => c.value === educationCountry)?.label || eduCountrySearch || educationCountry}</p>
                  )}
                </div>
                <div className="relative" onFocus={() => setShowInstitutionDropdown(true)}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                  <input
                    type="text"
                    value={educationFormData.institution}
                    onChange={(e) => setEducationFormData(prev => ({ ...prev, institution: e.target.value }))}
                    onBlur={() => setTimeout(() => setShowInstitutionDropdown(false), 200)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="University or College name"
                  />
                  {showInstitutionDropdown && educationFormData.institution && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {institutionResults.length > 0 ? (
                        institutionResults.map((u) => (
                          <button
                            key={`${u.iso2}-${u.name}`}
                            type="button"
                            onClick={() => {
                              setEducationFormData(prev => ({ ...prev, institution: u.name, institutionISO2: u.iso2 }));
                              setShowInstitutionDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                          >
                            {u.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                  {educationFormData.institution && (
                    <p className="mt-1 text-xs text-gray-500">Selected: {educationFormData.institution}{educationFormData.institutionISO2 ? ` (${educationFormData.institutionISO2})` : ''}</p>
                  )}
                </div>

                

                {/* Category Selection - Row 1 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="relative">
                  <input
                    type="text"
                      value={educationFormData.category}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, category: e.target.value }))}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200"
                      placeholder="Select education category..."
                    />
                    {showCategoryDropdown && (
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {categoryResults.map((category, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setEducationFormData(prev => ({ 
                                ...prev, 
                                category, 
                                qualification: '',
                                fieldOfStudy: ''
                              }));
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                          >
                            {category}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEducationFormData(prev => ({ 
                              ...prev, 
                              category: 'Others',
                              qualification: '',
                              fieldOfStudy: ''
                            }));
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                        >
                          Others
                        </button>
                    </div>
                  )}
                  </div>
                </div>

                {/* Custom category field when "Others" is selected */}
                {educationFormData.category === 'Others' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Category *</label>
                    <input
                      type="text"
                      value={educationFormData.otherLevel || ''}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, otherLevel: e.target.value }))}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200"
                      placeholder="Enter the category name..."
                      required
                    />
                  </div>
                )}

                {/* Qualification Selection - Row 2 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={educationFormData.qualification}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, qualification: e.target.value }))}
                      onFocus={() => setShowQualificationDropdown(true)}
                      onBlur={() => setTimeout(() => setShowQualificationDropdown(false), 200)}
                      disabled={!educationFormData.category}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200 ${
                        !educationFormData.category 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder={educationFormData.category ? "Select qualification..." : "Select category first"}
                    />
                    {showQualificationDropdown && educationFormData.category && (
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {qualificationResults.map((qualification, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setEducationFormData(prev => ({ 
                                ...prev, 
                                qualification,
                                fieldOfStudy: ''
                              }));
                              setShowQualificationDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                          >
                            {qualification}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEducationFormData(prev => ({ 
                              ...prev, 
                              qualification: 'Others',
                              fieldOfStudy: ''
                            }));
                            setShowQualificationDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                        >
                          Others
                        </button>
                </div>
                  )}
                </div>

                {/* Custom qualification field when "Others" is selected */}
                {educationFormData.qualification === 'Others' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Qualification *</label>
                    <input
                      type="text"
                      value={educationFormData.otherLevel || ''}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, otherLevel: e.target.value }))}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200"
                      placeholder="Enter the qualification name..."
                      required
                    />
                  </div>
                )}
                </div>

                {/* Specialization Selection - Row 3 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <div className="relative">
                  <input
                    type="text"
                    value={educationFormData.fieldOfStudy}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setEducationFormData(prev => ({ ...prev, fieldOfStudy: inputValue }));
                        // Filter from the full list of specializations
                        const filtered = allSpecializationsForQualification.filter(s =>
                          s.toLowerCase().includes(inputValue.toLowerCase())
                        );
                        setSpecializationResults(filtered); // Update display results
                        setShowSpecializationDropdown(true);
                      }}
                      onFocus={() => {
                        setShowSpecializationDropdown(true);
                        // Show all specializations when focused
                        setSpecializationResults(allSpecializationsForQualification);
                      }}
                      onBlur={() => setTimeout(() => setShowSpecializationDropdown(false), 200)}
                      disabled={!educationFormData.qualification}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200 ${
                        !educationFormData.qualification 
                          ? 'border-gray-200 bg-gray-50 text-gray-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder={educationFormData.qualification ? "Select specialization..." : "Select qualification first"}
                    />
                    {showSpecializationDropdown && educationFormData.qualification && (
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {specializationResults.map((specialization, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setEducationFormData(prev => ({ ...prev, fieldOfStudy: specialization }));
                              setShowSpecializationDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                          >
                            {specialization}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEducationFormData(prev => ({ ...prev, fieldOfStudy: 'Others' }));
                            setShowSpecializationDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-[#114373] hover:text-white transition-colors text-base font-medium text-gray-900 hover:text-white border-b border-gray-100 last:border-b-0"
                        >
                          Others
                        </button>
                        </div>
                      )}
                    </div>
                </div>

                {/* Custom specialization field when "Others" is selected */}
                {educationFormData.fieldOfStudy === 'Others' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Specialization *</label>
                    <input
                      type="text"
                      value={educationFormData.otherLevel || ''}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, otherLevel: e.target.value }))}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-gray-900 transition-all duration-200"
                      placeholder="Enter the specialization name..."
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                      type="date"
                      value={educationFormData.graduationYear || ''}
                    onChange={(e) => setEducationFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={educationFormData.otherLevel || ''}
                      onChange={(e) => setEducationFormData(prev => ({ ...prev, otherLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={educationFormData.description}
                  onChange={(e) => setEducationFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="Additional details about your education..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEducationModal(false);
                  setEditingEducation(null);
                  // Reset country state when closing modal
                  setEducationCountry('');
                  setEduCountrySearch('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Extract year from date for yearOfPassing and graduationYear
                  const getYearFromDate = (dateStr: string) => {
                    if (!dateStr) return '';
                    // If it's in YYYY-MM-DD format, extract year
                    const match = dateStr.match(/^(\d{4})/);
                    return match ? match[1] : dateStr;
                  };
                  
                  const educationData: Education = {
                    id: editingEducation?.id || Date.now().toString(),
                    degree: educationFormData.qualification || educationFormData.degree,
                    specialization: educationFormData.fieldOfStudy,
                    fieldOfStudy: educationFormData.fieldOfStudy,
                    institute: educationFormData.institution,
                    institution: educationFormData.institution,
                    yearOfPassing: getYearFromDate(educationFormData.otherLevel || educationFormData.graduationYear),
                    graduationYear: getYearFromDate(educationFormData.otherLevel || educationFormData.graduationYear),
                    startDate: educationFormData.graduationYear || '',
                    endDate: educationFormData.otherLevel || '',
                    description: educationFormData.description,
                    isHighestQualification: false,
                    otherLevel: educationFormData.otherLevel,
                    category: educationFormData.category,
                    country: educationCountry
                  };
                  handleUpdateEducation(educationData);
                }}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]"
              >
                {editingEducation ? 'Update' : 'Add'} Education
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Salary Information</h3>
              <button
                type="button"
                onClick={() => setShowSalaryModal(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={salaryFormData.currency}
                    onChange={(e) => setSalaryFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  >
                    <option value="USD">USD</option>
                    <option value="TZS">TZS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                  <select
                    value={salaryFormData.salaryType}
                    onChange={(e) => setSalaryFormData(prev => ({ ...prev, salaryType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  >
                    <option value="annual">Annual</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {salaryFormData.currency === 'TZS' ? 'TZS' : salaryFormData.currency === 'EUR' ? '€' : '$'}
                    </span>
                    <input
                      type="number"
                      value={salaryFormData.expectedSalary}
                      onChange={(e) => setSalaryFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      placeholder="0"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                  <select
                    value={salaryFormData.noticePeriod}
                    onChange={(e) => setSalaryFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  >
                    <option value="">Select</option>
                    <option value="immediate">Immediate</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="15 days">15 days</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="negotiable"
                    checked={salaryFormData.negotiable}
                    onChange={(e) => setSalaryFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                    className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
                  />
                  <label htmlFor="negotiable" className="ml-2 text-sm text-gray-700">
                    Salary is negotiable
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                <textarea
                  value={salaryFormData.benefits}
                  onChange={(e) => setSalaryFormData(prev => ({ ...prev, benefits: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="Health insurance, retirement plan, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSalaryModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSalary}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]"
              >
                Save Salary Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Presence Modal */}
      {showOnlinePresenceModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Online Presence</h3>
              <button
                type="button"
                onClick={() => setShowOnlinePresenceModal(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                <input
                  type="url"
                  value={onlinePresenceFormData.linkedin}
                  onChange={(e) => setOnlinePresenceFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                <input
                  type="url"
                  value={onlinePresenceFormData.github}
                  onChange={(e) => setOnlinePresenceFormData(prev => ({ ...prev, github: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Website</label>
                <input
                  type="url"
                  value={onlinePresenceFormData.portfolio}
                  onChange={(e) => setOnlinePresenceFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Profiles</label>
                <div className="space-y-2">
                  {onlinePresenceFormData.otherProfiles.map((profile, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={profile}
                        onChange={(e) => {
                          const newProfiles = [...onlinePresenceFormData.otherProfiles];
                          newProfiles[index] = e.target.value;
                          setOnlinePresenceFormData(prev => ({ ...prev, otherProfiles: newProfiles }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                        placeholder="https://example.com/yourprofile"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newProfiles = onlinePresenceFormData.otherProfiles.filter((_, i) => i !== index);
                          setOnlinePresenceFormData(prev => ({ ...prev, otherProfiles: newProfiles }));
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setOnlinePresenceFormData(prev => ({
                        ...prev,
                        otherProfiles: [...prev.otherProfiles, '']
                      }));
                    }}
                    className="text-[#114373] hover:underline text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Profile
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOnlinePresenceModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOnlinePresence}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3560]"
              >
                Save Online Presence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Profile Photo</h3>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {photoPreview || profile.photoUrl ? (
                  <img
                    src={(photoPreview as string) || (profile.photoUrl as string)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setPhotoPreview((prev) => {
                        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
                        return url;
                      });
                    }
                  }}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#114373] file:text-white hover:file:bg-[#0d3559]"
                />
                <p className="text-xs text-gray-500">PNG or JPG recommended. Max ~5MB (browser-limited).</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                  setShowPhotoUpload(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (photoPreview) {
                    setProfile((prev) => ({ ...prev, photoUrl: photoPreview! }));
                  }
                  setShowPhotoUpload(false);
                }}
                disabled={!photoPreview}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal (legacy block disabled) */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Add Project'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProject(projectFormData as Project); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                    <input
                      type="text"
                      value={projectFormData.title}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                    <input
                      type="text"
                      value={projectFormData.client}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, client: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="relative">
                  <input
                    type="text"
                    value={projectFormData.duration}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, duration: e.target.value }))}
                      onFocus={() => setShowDurationDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDurationDropdown(false), 200)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      placeholder="Select or type duration..."
                    />
                    {showDurationDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        {[
                          '1 week',
                          '2 weeks',
                          '1 month',
                          '2 months',
                          '3 months',
                          '6 months',
                          '1 year',
                          '1.5 years',
                          '2 years',
                          '3+ years',
                          'Ongoing',
                          'Part-time',
                          'Full-time'
                        ].map((duration, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setProjectFormData(prev => ({ ...prev, duration }));
                              setShowDurationDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium text-gray-900 hover:text-gray-700"
                          >
                            {duration}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="Describe the project, scope, and outcomes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tools & Technologies</label>
                  <input
                    type="text"
                    value={projectFormData.toolsTechnologies}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, toolsTechnologies: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="e.g., React, Node.js, MongoDB, Stripe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={employmentFormData.industry}
                        onChange={(e) => setEmploymentFormData(prev => ({ ...prev, industry: e.target.value }))}
                        onFocus={() => setShowIndustryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                        placeholder="Search or select industry..."
                      />
                      {showIndustryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {getJobCategories()
                            .filter(industry => 
                              industry.toLowerCase().includes(employmentFormData.industry.toLowerCase()) || 
                              employmentFormData.industry === ''
                            )
                            .map(industry => (
                              <div
                                key={industry}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-gray-900"
                                onClick={() => {
                                  setEmploymentFormData(prev => ({ ...prev, industry: industry }));
                                  setShowIndustryDropdown(false);
                                }}
                              >
                                {industry}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Functional Area</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={employmentFormData.functionalArea}
                        onChange={(e) => setEmploymentFormData(prev => ({ ...prev, functionalArea: e.target.value }))}
                        onFocus={() => setShowFunctionalAreaDropdown(true)}
                        onBlur={() => setTimeout(() => setShowFunctionalAreaDropdown(false), 200)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                        placeholder="Search or select functional area..."
                      />
                      {showFunctionalAreaDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {getAllJobTitles()
                            .filter(area => 
                              area.toLowerCase().includes(employmentFormData.functionalArea.toLowerCase()) || 
                              employmentFormData.functionalArea === ''
                            )
                            .slice(0, 20)
                            .map(area => (
                              <div
                                key={area}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-gray-900"
                                onClick={() => {
                                  setEmploymentFormData(prev => ({ ...prev, functionalArea: area }));
                                  setShowFunctionalAreaDropdown(false);
                                }}
                              >
                                {area}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowExperienceModal(false);
                    setEditingExperience(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
                >
                  {editingExperience ? 'Update' : 'Add'} Employment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? 'Edit Project' : 'Add Project'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProject(projectFormData as Project); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                    <input
                      type="text"
                      value={projectFormData.title}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client/Organization</label>
                    <input
                      type="text"
                      value={projectFormData.client}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, client: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                  <input
                      type="date"
                      value={projectFormData.startDate}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={projectFormData.endDate}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="Describe the project, your role, and key features..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tools & Technologies</label>
                  <input
                    type="text"
                    value={projectFormData.toolsTechnologies}
                    onChange={(e) => setProjectFormData(prev => ({ ...prev, toolsTechnologies: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="e.g., React, Node.js, MongoDB, AWS"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
                >
                  {editingProject ? 'Update' : 'Add'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accomplishment Modal */}
      {showAccomplishmentModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAccomplishment ? 'Edit Accomplishment' : 'Add Accomplishment'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateAccomplishment(accomplishmentFormData as Accomplishment); }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={accomplishmentFormData.type}
                      onChange={(e) => setAccomplishmentFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="award">Award</option>
                      <option value="certification">Certification</option>
                      <option value="publication">Publication</option>
                      <option value="patent">Patent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      value={accomplishmentFormData.year}
                      onChange={(e) => setAccomplishmentFormData(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Conditional field for "Other" type */}
                {accomplishmentFormData.type === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Type *</label>
                    <input
                      type="text"
                      value={accomplishmentFormData.otherType}
                      onChange={(e) => setAccomplishmentFormData(prev => ({ ...prev, otherType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      placeholder="Enter the type of accomplishment..."
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={accomplishmentFormData.title}
                    onChange={(e) => setAccomplishmentFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={accomplishmentFormData.description}
                    onChange={(e) => setAccomplishmentFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    placeholder="Describe the accomplishment..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccomplishmentModal(false);
                    setEditingAccomplishment(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
                >
                  {editingAccomplishment ? 'Update' : 'Add'} Accomplishment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertificationModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCertification ? 'Edit Certification' : 'Add Certification'}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCertification(certificationFormData as Certification); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name *</label>
                  <input
                    type="text"
                    value={certificationFormData.name}
                    onChange={(e) => setCertificationFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Body *</label>
                  <input
                    type="text"
                    value={certificationFormData.issuingBody}
                    onChange={(e) => setCertificationFormData(prev => ({ ...prev, issuingBody: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year of Completion *</label>
                    <select
                      value={certificationFormData.yearOfCompletion}
                      onChange={(e) => setCertificationFormData(prev => ({ ...prev, yearOfCompletion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                      required
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Validity</label>
                    <select
                      value={certificationFormData.validity}
                      onChange={(e) => setCertificationFormData(prev => ({ ...prev, validity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900"
                    >
                      <option value="">Select Validity</option>
                      <option value="Lifetime">Lifetime</option>
                      {Array.from({ length: 101 }, (_, i) => {
                        const year = 1950 + i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCertificationModal(false);
                    setEditingCertification(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
                >
                  {editingCertification ? 'Update' : 'Add'} Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>
        
        {profile.resume && profile.resume.resumeUrl ? (
          <div className="space-y-4">
            {/* Display current resume */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{profile.resume?.resumeFilename}</p>
                    <p className="text-sm text-gray-500">
                      {((profile.resume?.resumeSize || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(profile.resume?.resumeUrl, '_blank')}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleDeleteResume}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Upload new resume */}
            {isEditing && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload New Resume</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 10MB)</p>
                  </div>
          <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="px-4 py-2 bg-[#114373] text-white text-sm rounded-lg hover:bg-[#0d2f5a] transition-colors cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">No Resume Uploaded</p>
                <p className="text-sm text-gray-500">Upload your resume to complete your profile</p>
              </div>
              {isEditing && (
                <div>
          <input
            type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload-new"
                  />
                  <label
                    htmlFor="resume-upload-new"
                    className="px-6 py-3 bg-[#114373] text-white text-sm rounded-lg hover:bg-[#0d2f5a] transition-colors cursor-pointer inline-block"
                  >
                    Upload Resume
                  </label>
        </div>
              )}
            </div>
          </div>
        )}
          </div>
      </div>

      {/* Bottom Action Bar (Edit Mode) */}
      {isEditing && (
        <div className="sticky bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Experience Modal */}
      <ExperienceModal
        isOpen={showExperienceModal}
        onClose={() => {
          setShowExperienceModal(false);
          setEditingExperience(null);
        }}
        experience={editingExperience as any}
        defaultExperienceType={experienceContext === 'internship' ? 'internship' : 'work'}
        onSave={async (experienceData) => {
          console.log('📥 ExperienceModal onSave - Raw data received:', experienceData);
          console.log('📥 All keys in experienceData:', Object.keys(experienceData));
          console.log('📥 startDate value:', (experienceData as any).startDate);
          console.log('📥 endDate value:', (experienceData as any).endDate);
          
          // ExperienceModal sends startDate/endDate in formData - PRESERVE THEM
          // Extract dates directly from what ExperienceModal sends
          const startDate = (experienceData as any).startDate 
            || (experienceData as any).start_date 
            || (experienceData as any).fromDate 
            || '';
          const endDate = (experienceData as any).endDate 
            || (experienceData as any).end_date 
            || (experienceData as any).toDate 
            || '';
          
          console.log('📅 Extracted dates - startDate:', startDate, 'endDate:', endDate);
          
          // CRITICAL: Validate startDate is provided - this should never happen if form validation works
          if (!startDate || startDate.trim() === '') {
            console.error('❌ CRITICAL ERROR: startDate is missing in onSave handler!');
            console.error('❌ Full experienceData object:', JSON.stringify(experienceData, null, 2));
            alert('Start date is required. Please select a start date.');
            return;
          }
          
          // Map to Experience interface format (fromDate/toDate) for local state
          // But also preserve startDate/endDate for API calls - CRITICAL: ensure they're always included
          const mappedData: any = {
            companyName: experienceData.companyName,
            designation: experienceData.designation,
            fromDate: startDate,  // Map to fromDate for Experience interface
            toDate: endDate,      // Map to toDate for Experience interface
            startDate: startDate, // REQUIRED: Preserve for API - must be present
            endDate: endDate || null,     // Preserve for API
            isCurrent: experienceData.isCurrent,
            companyProfile: experienceData.companyProfile,
            rolesResponsibilities: experienceData.rolesResponsibilities || '',
            keyAchievements: experienceData.keyAchievements,
            industry: experienceData.industry,
            level: experienceData.level,
            experienceType: (experienceData as any).experienceType || (experienceContext === 'internship' ? 'internship' : 'work')
          };
          
          // CRITICAL: Double-check startDate is present before proceeding
          if (!mappedData.startDate || mappedData.startDate.trim() === '') {
            console.error('❌ CRITICAL ERROR: startDate is missing in mappedData!', mappedData);
            console.error('❌ Original experienceData:', experienceData);
            alert('Start date is required. Please select a start date.');
            return;
          }
          
          console.log('📋 Mapped data for Experience interface:', mappedData);
          console.log('📋 startDate in mappedData:', mappedData.startDate);
          console.log('📋 endDate in mappedData:', mappedData.endDate);
          console.log('📋 Original experienceData keys:', Object.keys(experienceData));
          console.log('📋 Original experienceData.startDate:', (experienceData as any).startDate);
          
          // CRITICAL: Ensure startDate is ALWAYS in mappedData before passing to handlers
          if (!mappedData.startDate && (experienceData as any).startDate) {
            console.warn('⚠️ startDate missing in mappedData, adding from experienceData');
            mappedData.startDate = (experienceData as any).startDate;
          }
          if (!mappedData.endDate && (experienceData as any).endDate) {
            mappedData.endDate = (experienceData as any).endDate;
          }
          
          // Both internships and work experience should be saved to API
          // The API handles the experienceType field to distinguish between them
          if (editingExperience) {
            await handleUpdateExperience(editingExperience.id, mappedData);
          } else {
            await handleAddExperience(mappedData);
          }
          
          // Also update local state for internships to keep UI in sync
          if (experienceContext === 'internship') {
            const internshipData: Experience = {
              ...mappedData,
              id: editingExperience?.id || Date.now().toString()
            };
            if (editingExperience) {
              setProfile(prev => ({
                ...prev,
                internships: prev.internships.map(exp => 
                  exp.id === editingExperience.id ? internshipData : exp
                )
              }));
            } else {
              setProfile(prev => ({
                ...prev,
                internships: [...prev.internships, internshipData]
              }));
            }
                }
              }}
            />
          </div>
    </CandidateLayout>
  );
}
