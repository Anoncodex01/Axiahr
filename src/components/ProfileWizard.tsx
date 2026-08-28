'use client';

import { useState, useEffect, useRef } from 'react';
import LocationSelector from '@/components/LocationSelector';
import { getCountryOptions, getStateOptions, getCityOptions, State } from '@/utils/locationData';
import { ChevronLeft, ChevronRight, CheckCircle, User, MapPin, Briefcase, GraduationCap, FileText, Globe, DollarSign, Users, FolderOpen, Award, Badge as Certificate, Code, Target, Edit, Trash2, Plus } from 'lucide-react';
import { searchNationalities } from '@/utils/jobData';
import ExperienceModal from '@/components/ExperienceModal';
import EducationModal from '@/components/EducationModal';
import LanguageModal from '@/components/LanguageModal';
import ReferenceModal from '@/components/ReferenceModal';
import ProjectModal from '@/components/ProjectModal';
import AccomplishmentModal from '@/components/AccomplishmentModal';
import CertificationModal from '@/components/CertificationModal';
import PhoneNumberSelector from '@/components/PhoneNumberSelector';

interface ProfileWizardProps {
  candidateId: string;
  onComplete: () => void;
}

const steps = [
  { id: 'personal', title: 'Personal Information', icon: User, description: 'Basic personal details' },
  { id: 'photo', title: 'Profile Photo', icon: User, description: 'Upload your profile picture' },
  { id: 'contact', title: 'Contact Information', icon: MapPin, description: 'Phone numbers and contact details' },
  { id: 'location', title: 'Location Information', icon: MapPin, description: 'Address and location details' },
  { id: 'professional', title: 'Professional Summary', icon: FileText, description: 'Resume headline and profile summary' },
  { id: 'employment', title: 'Employment Details', icon: Briefcase, description: 'Work experience and internships' },
  { id: 'experience', title: 'Work Experience', icon: Briefcase, description: 'Professional work history' },
  { id: 'education', title: 'Education', icon: GraduationCap, description: 'Educational background' },
  { id: 'projects', title: 'Projects', icon: FolderOpen, description: 'Professional projects and work' },
  { id: 'accomplishments', title: 'Accomplishments', icon: Award, description: 'Awards, publications, and achievements' },
  { id: 'certifications', title: 'Certifications', icon: Certificate, description: 'Professional certifications and licenses' },
  { id: 'online-presence', title: 'Online Presence', icon: Globe, description: 'LinkedIn, GitHub, and portfolio links' },
  { id: 'skills', title: 'Skills', icon: Code, description: 'Professional skills and competencies' },
  { id: 'job-preferences', title: 'Job Preferences', icon: Target, description: 'Job type, work mode, and preferences' },
  { id: 'language', title: 'Languages', icon: Globe, description: 'Language skills and proficiency' },
  { id: 'salary', title: 'Salary Information', icon: DollarSign, description: 'Salary expectations and requirements' },
  { id: 'references', title: 'Professional References', icon: Users, description: 'Professional references (at least 3)' },
  { id: 'resume', title: 'Resume', icon: FileText, description: 'Upload your resume document' },
  { id: 'review', title: 'Review & Complete', icon: FileText, description: 'Review all information' }
];

export default function ProfileWizard({ candidateId, onComplete }: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profileData, setProfileData] = useState<any>({});
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const hasLoadedRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);
  const stepsScrollRef = useRef<HTMLDivElement>(null);

  // Load existing profile data
  useEffect(() => {
    if (!candidateId) {
      setIsLoadingData(false);
      return;
    }

    // Only load if we have a candidateId and haven't loaded for this candidateId yet
    if (hasLoadedRef.current !== candidateId) {
      hasLoadedRef.current = candidateId;
      
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Safety timeout: if loading takes more than 15 seconds, force stop loading
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ ProfileWizard: Loading timeout reached (15s), forcing loading state to false');
        setIsLoadingData(false);
        loadingTimeoutRef.current = null;
      }, 15000);
      
      loadProfileData().finally(() => {
        // Clear timeout on completion
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      });
      
      return () => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      };
    }
    // Only depend on candidateId to prevent re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  const loadProfileData = async () => {
    // Prevent concurrent loads using ref (more reliable than state)
    if (isLoadingRef.current) {
      console.log('⏸️ ProfileWizard: Already loading, skipping duplicate request');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoadingData(true);
      
      // First, try to get candidateId from token (most reliable)
      let actualCandidateId = candidateId;
      const token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') || localStorage.getItem('token') || '') : '';
      
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const tokenCandidateId = String(payload.candidateId || payload.id || payload.sub || '');
            if (tokenCandidateId && tokenCandidateId !== candidateId) {
              console.log(`🔄 CandidateId mismatch detected. Using token candidateId: ${tokenCandidateId} instead of ${candidateId}`);
              actualCandidateId = tokenCandidateId;
            }
          }
        } catch (error) {
          console.warn('Failed to decode token:', error);
        }
      }
      
      const response = await fetch(`/api/candidates/profile?candidateId=${encodeURIComponent(actualCandidateId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If response is not JSON, initialize with empty data
        result = { success: false, error: 'Invalid response from server' };
      }
      
      // If API returned a different candidateId (mismatch correction), update it
      if (response.ok && result.success && result.data && result.candidateId && result.candidateId !== actualCandidateId) {
        console.log(`🔄 CandidateId corrected by API: ${actualCandidateId} -> ${result.candidateId}`);
        actualCandidateId = String(result.candidateId);
        
        // Update localStorage with correct candidateId
        const candidateUserStr = typeof window !== 'undefined' ? localStorage.getItem('candidateUser') : null;
        const candidateDataStr = typeof window !== 'undefined' ? localStorage.getItem('candidateData') : null;
        
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
      
      // Handle both success and error cases
      if (response.ok && result.success && result.data) {
        // Log the actual data structure for debugging
        console.log('📦 ProfileWizard: Received data structure:', {
          hasCandidate: !!result.data.candidate,
          hasProfile: !!result.data.profile,
          hasExperience: Array.isArray(result.data.experience),
          experienceCount: result.data.experience?.length || 0,
          hasEducation: Array.isArray(result.data.education),
          educationCount: result.data.education?.length || 0,
          dataKeys: Object.keys(result.data),
          candidateId: result.candidateId,
          candidateKeys: result.data.candidate ? Object.keys(result.data.candidate) : [],
          profileKeys: result.data.profile ? Object.keys(result.data.profile) : []
        });
        
        // Check if API returned minimal/empty data
        const dataKeys = Object.keys(result.data);
        const hasMinimalData = dataKeys.length <= 2 && result.data.candidateId === actualCandidateId;
        if (hasMinimalData) {
          console.warn('⚠️ ProfileWizard: API returned minimal data, profile might be new/empty.');
        }
        
        // Validate that we have at least candidate data
        if (!result.data.candidate) {
          console.error('❌ ProfileWizard: API response missing candidate data. Full response:', result);
          // Don't throw - initialize with empty data instead
          setProfileData({
            candidate: {
              id: actualCandidateId,
              firstName: '',
              middleName: '',
              surname: '',
              email: '',
              phone: '',
              gender: '',
              emailVerified: false,
              status: 'active'
            },
            profile: null,
            experience: [],
            education: [],
            languages: [],
            salary: null,
            references: [],
            projects: [],
            accomplishments: [],
            certifications: [],
            onlinePresence: null,
            skills: [],
            jobPreferences: null,
            resume: null,
            preferredLocations: []
          });
          return; // Exit early, finally block will set loading to false
        }
        
        // Normalize candidate data field names for consistency
        const normalizedData = {
          ...result.data,
          candidate: {
            ...result.data.candidate,
            // Ensure both camelCase and snake_case are available
            firstName: result.data.candidate.firstName || result.data.candidate.first_name || '',
            middleName: result.data.candidate.middleName || result.data.candidate.middle_name || '',
            surname: result.data.candidate.surname || result.data.candidate.last_name || '',
            email: result.data.candidate.email || '',
            phone: result.data.candidate.phone || '',
            gender: result.data.candidate.gender || ''
          }
        };
        
        console.log('💾 ProfileWizard: Setting profileData state', {
          candidateId: normalizedData.candidate?.id,
          candidateFirstName: normalizedData.candidate?.firstName,
          hasProfile: !!normalizedData.profile,
          dataKeys: Object.keys(normalizedData)
        });
        
        // Set profile data first
        setProfileData(normalizedData);
        
        // Use a small delay to ensure state update completes before clearing loading
        // This ensures the component re-renders with the new data
        setTimeout(() => {
          setIsLoadingData(false);
          console.log('✅ ProfileWizard: Profile data set, loading state cleared');
        }, 50);
        
        // If already completed, exit wizard immediately
        if (result.data.profile?.status === 'completed') {
          // Use setTimeout to ensure state updates complete before calling onComplete
          setTimeout(() => {
          onComplete();
          }, 200);
        }
        // Determine completed steps based on existing data
        const completed: string[] = [];
        
        // Personal Information - check for required fields
        if (result.data.profile?.date_of_birth && result.data.candidate?.firstName && result.data.candidate?.surname) {
          completed.push('personal');
        }
        
        // Profile Photo - check for photo URL
        if (result.data.profile?.photo_url) {
          completed.push('photo');
        }
        
        // Contact Information - check for phone number
        if (result.data.candidate?.phone) {
          completed.push('contact');
        }
        
        // Location Information - check for current address
        if (result.data.profile?.current_address || result.data.profile?.current_location) {
          completed.push('location');
        }
        
        // Professional Summary - check for resume headline and profile summary
        if (result.data.profile?.resume_headline && result.data.profile?.profile_summary) {
          completed.push('professional');
        }
        
        // Employment Details - check for experience type and total experience
        if (result.data.profile?.experience_type) {
          completed.push('employment');
        }
        
        // Work Experience - check for experience entries
        if (result.data.experience?.length > 0) {
          completed.push('experience');
        }
        
        // Education - check for education entries
        if (result.data.education?.length > 0) {
          completed.push('education');
        }
        
        // Projects - check for project entries
        if (result.data.projects?.length > 0) {
          completed.push('projects');
        }
        
        // Accomplishments - check for accomplishment entries
        if (result.data.accomplishments?.length > 0) {
          completed.push('accomplishments');
        }
        
        // Certifications - check for certification entries
        if (result.data.certifications?.length > 0) {
          completed.push('certifications');
        }
        
        // Online Presence - check for any online presence data
        if (result.data.onlinePresence?.linkedin || result.data.onlinePresence?.github || result.data.onlinePresence?.portfolio) {
          completed.push('online-presence');
        }
        
        // Skills - check for skill entries
        if (result.data.skills?.length > 0) {
          completed.push('skills');
        }
        
        // Job Preferences - check for job preferences data
        if (result.data.jobPreferences?.jobType && result.data.jobPreferences?.workMode && result.data.jobPreferences?.shiftTiming) {
          completed.push('job-preferences');
        }
        
        // Resume - check for resume data
        if (result.data.resume?.resumeUrl) {
          completed.push('resume');
        }
        
        // Languages - check for language entries
        if (result.data.languages?.length > 0) {
          completed.push('language');
        }
        
        // Salary Information - check for salary data
        if (result.data.salary?.expected_salary || result.data.salary?.currency) {
          completed.push('salary');
        }
        
        // Professional References - check if any references exist
        if (result.data.references?.length > 0) {
          completed.push('references');
        }
        
        setCompletedSteps(completed);
        
        // Start from the first incomplete step, or if all are complete, go to review step
        // This allows users to continue where they left off after refresh
        const stepIds = steps.map(step => step.id);
        const firstIncompleteStep = stepIds.find(stepId => !completed.includes(stepId));
        if (firstIncompleteStep) {
          const stepIndex = stepIds.indexOf(firstIncompleteStep);
          setCurrentStep(stepIndex);
        } else {
          // All steps completed, go to review step
          const reviewStepIndex = stepIds.findIndex(stepId => stepId === 'review');
          if (reviewStepIndex !== -1) {
            setCurrentStep(reviewStepIndex);
          } else {
            setCurrentStep(0);
          }
        }
      } else {
        // Handle error cases (404, 400, etc.)
        console.error('Error loading profile:', result.error || 'Unknown error', 'Status:', response.status);
        
        // If 404, the candidate doesn't exist - this is a serious error
        if (response.status === 404) {
          console.error('❌ Candidate not found. This may indicate a data mismatch. User should log out and log in again.');
          // Still initialize with empty data to allow profile creation
          // But log the error for debugging
        }
        
        // Initialize with empty profile data structure
        // This allows the wizard to work even if the profile doesn't exist yet
        const emptyProfileData = {
          candidate: {
            id: candidateId,
            firstName: '',
            middleName: '',
            surname: '',
            email: '',
            phone: '',
            alternatePhone: '',
            whatsapp: '',
            gender: '',
            emailVerified: false,
            status: 'active'
          },
          profile: null,
          experience: [],
          education: [],
          languages: [],
          salary: null,
          references: [],
          projects: [],
          accomplishments: [],
          certifications: [],
          onlinePresence: null,
          skills: [],
          jobPreferences: null,
          resume: null,
          preferredLocations: []
        };
        
        setProfileData(emptyProfileData);
        
        // Use a small delay to ensure state update completes before clearing loading
        setTimeout(() => {
          setIsLoadingData(false);
          console.log('✅ ProfileWizard: Empty profile data initialized, loading state cleared');
        }, 50);
        
        // Start from the first step since no data exists
        setCompletedSteps([]);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // Initialize with empty data on error
      setProfileData({
        candidate: {
          id: candidateId,
          firstName: '',
          middleName: '',
          surname: '',
          email: '',
          phone: '',
          alternatePhone: '',
          whatsapp: '',
          gender: '',
          emailVerified: false,
          status: 'active'
        },
        profile: null,
        experience: [],
        education: [],
        languages: [],
        salary: null,
        references: [],
        projects: [],
        accomplishments: [],
        certifications: [],
        onlinePresence: null,
        skills: [],
        jobPreferences: null,
        resume: null,
        preferredLocations: []
      });
      setCompletedSteps([]);
      setCurrentStep(0);
      
      // Ensure loading is cleared even on error
      setTimeout(() => {
      setIsLoadingData(false);
        console.log('✅ ProfileWizard: Error handled, loading state cleared');
      }, 50);
    } finally {
      isLoadingRef.current = false;
      // Note: setIsLoadingData(false) is now called in the success/error handlers above
      // to ensure it happens after state updates complete
      console.log('✅ ProfileWizard: loadProfileData finally block executed');
    }
  };

  const handleStepComplete = async (stepData: any) => {
    setIsLoading(true);
    try {
      // Handle review step completion
      if (steps[currentStep].id === 'review' && stepData.status === 'completed') {
        // Persist completion status to DB
        try {
          await fetch('/api/candidates/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileData: { status: 'completed' } })
          });
        } catch (error) {
          console.error('Error updating profile status:', error);
        }

        // Mark review step as completed locally (only if not already added)
        const newCompletedSteps = [...completedSteps];
        if (!newCompletedSteps.includes('review')) {
          newCompletedSteps.push('review');
        }
        setCompletedSteps(newCompletedSteps);
        // Reset loading state before closing wizard
        setIsLoading(false);
        // Profile is complete, close wizard and show main profile
        onComplete();
        return;
      }

      // Normalize payload to what API expects
      const payload: any = {};
      // Normalize enum casing for candidate.gender -> 'Male'|'Female'|'Other'
      if (stepData?.candidate?.gender) {
        const g = String(stepData.candidate.gender || '').toLowerCase();
        stepData.candidate.gender = g === 'male' ? 'Male' : g === 'female' ? 'Female' : 'Other';
      }
      if (stepData?.candidate) payload.candidateData = stepData.candidate;
      if (stepData?.profile) payload.profileData = stepData.profile;
      // Backward compatibility: if direct fields were passed, send as profileData
      if (!payload.profileData && !payload.candidateData) {
        payload.profileData = stepData;
      }

      const response = await fetch('/api/candidates/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newCompletedSteps = [...completedSteps];
        const currentStepId = steps[currentStep].id;
        // Only add if not already in the array to prevent duplicates
        if (!newCompletedSteps.includes(currentStepId)) {
          newCompletedSteps.push(currentStepId);
        }
        setCompletedSteps(newCompletedSteps);
        
        // Update profileData while preserving the existing structure (especially candidate.id)
        setProfileData((prev: any) => {
          // Ensure we maintain the candidate structure with id
          const updated: any = {
            ...prev,
            candidate: {
              ...prev.candidate,
              ...(stepData.candidate || {}),
              // Always preserve the candidate id
              id: prev.candidate?.id || candidateId
            }
          };
          
          // Merge profile data if provided
          if (stepData.profile) {
            updated.profile = {
              ...prev.profile,
              ...stepData.profile
            };
          } else if (prev.profile) {
            updated.profile = prev.profile;
          }
          
          // Merge other top-level fields (experience, education, etc.)
          Object.keys(stepData).forEach(key => {
            if (key !== 'candidate' && key !== 'profile') {
              // For arrays, replace them; for objects, merge them
              if (Array.isArray(stepData[key])) {
                updated[key] = stepData[key];
              } else if (typeof stepData[key] === 'object' && stepData[key] !== null) {
                updated[key] = { ...prev[key], ...stepData[key] };
              } else {
                updated[key] = stepData[key];
              }
            }
          });
          
          return updated;
        });
        
        // Reset loading state BEFORE navigating to next step
        setIsLoading(false);
        
        // Small delay to ensure state updates complete before navigation
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Always go to the next sequential step, don't skip any steps
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // All steps completed - go to review step
          const reviewStepIndex = steps.findIndex(step => step.id === 'review');
          if (reviewStepIndex !== -1) {
            setCurrentStep(reviewStepIndex);
          } else {
            // If no review step, complete the wizard
            onComplete();
          }
        }
      } else {
        // If save failed, still reset loading
        setIsLoading(false);
        const errorData = await response.json();
        console.error('Failed to save step:', errorData);
        alert(errorData.error || 'Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving step:', error);
      setIsLoading(false);
      alert('An error occurred while saving. Please try again.');
    }
  };

  const handleNext = () => {
    // Always go to the next step sequentially, don't skip any steps
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepComponent = () => {
    // Log what data is being passed to step components for debugging
    const stepId = steps[currentStep].id;
    if (stepId === 'personal') {
      console.log('🎯 ProfileWizard: Rendering PersonalInfoStep with data', {
        hasProfileData: !!profileData,
        hasCandidate: !!profileData?.candidate,
        candidateId: profileData?.candidate?.id,
        candidateFirstName: profileData?.candidate?.firstName,
        profileDataKeys: profileData ? Object.keys(profileData) : []
      });
    }
    
    switch (stepId) {
      case 'personal':
        return <PersonalInfoStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'photo':
        return <PhotoStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'contact':
        return <ContactInfoStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'location':
        return <LocationInfoStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'professional':
        return <ProfessionalSummaryStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'employment':
        return <EmploymentDetailsStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'experience':
        return <ExperienceStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'education':
        return <EducationStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'projects':
        return <ProjectsStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'accomplishments':
        return <AccomplishmentsStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'certifications':
        return <CertificationsStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'online-presence':
        return <OnlinePresenceStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'skills':
        return <SkillsStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'job-preferences':
        return <JobPreferencesStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'resume':
        return <ResumeStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'language':
        return <LanguageStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'salary':
        return <SalaryInfoStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'references':
        return <ReferencesStep data={profileData} candidateId={candidateId} onComplete={handleStepComplete} isLoading={isLoading} />;
      case 'review':
        return <ReviewStep data={profileData} onComplete={handleStepComplete} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  // Show loading screen while data is being fetched
  // For new profiles, profile will be null, but candidate should exist
  // So we only check for candidate existence, not profile
  const hasValidData = profileData?.candidate && profileData.candidate.id;
  const shouldShowLoading = isLoadingData || !hasValidData;
  
  if (shouldShowLoading) {
    console.log('⏳ ProfileWizard: Showing loading screen', {
      isLoadingData,
      hasProfileData: !!profileData,
      hasCandidate: !!profileData?.candidate,
      hasCandidateId: !!profileData?.candidate?.id,
      hasProfile: !!profileData?.profile,
      isNewProfile: !profileData?.profile, // New profiles have null profile
      profileDataKeys: profileData ? Object.keys(profileData) : [],
      profileDataLength: profileData ? Object.keys(profileData).length : 0
    });
    
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#114373] to-[#1e5a8a] rounded-full mb-4 animate-pulse">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Profile Data</h2>
              <p className="text-gray-600 mb-4">Please wait while we fetch your profile information...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('✅ ProfileWizard: Loading complete, rendering wizard', {
    hasProfileData: !!profileData,
    hasCandidate: !!profileData?.candidate,
    candidateId: profileData?.candidate?.id,
    candidateFirstName: profileData?.candidate?.firstName,
    hasProfile: !!profileData?.profile,
    isNewProfile: !profileData?.profile // New profiles have null profile, that's OK
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[#114373] to-[#1e5a8a] rounded-full mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-base sm:text-lg text-gray-600">
            Your profile is <span className="font-semibold text-[#114373]">{Math.min(100, Math.round((completedSteps.length / steps.length) * 100))}%</span> complete. Let's finish it step by step!
          </p>
        </div>

        {/* Modern Progress Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={() => {
                if (stepsScrollRef.current) {
                  stepsScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-[#114373]" />
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => {
                if (stepsScrollRef.current) {
                  stepsScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-[#114373]" />
            </button>
            
            <div ref={stepsScrollRef} className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 mb-6 scrollbar-hide px-8 sm:px-12">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            
            return (
                <div key={step.id} className="flex flex-col items-center group flex-shrink-0 min-w-[80px] sm:min-w-[100px]">
                  <button
                    onClick={() => {
                      // Allow navigation to:
                      // 1. Any completed step (can jump to any completed step)
                      // 2. Current step
                      // 3. Steps before current step
                      // Cannot skip ahead to incomplete steps
                      if (isCompleted || index <= currentStep) {
                        setCurrentStep(index);
                      }
                    }}
                    disabled={!isCompleted && index > currentStep}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 transition-all duration-300 transform
                      ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer' 
                        : isCurrent 
                        ? 'bg-gradient-to-r from-[#114373] to-[#1e5a8a] text-white shadow-lg scale-105' 
                        : index < currentStep
                        ? 'bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed group-hover:bg-gray-200'
                      }
                    `}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                  <div className="text-center w-full">
                    <p className={`text-xs font-semibold transition-colors leading-tight ${
                      isCurrent ? 'text-[#114373]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </p>
                  {isCompleted && (
                    <p className="text-xs text-green-500 mt-0.5">✓</p>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full h-2 bg-gray-200 rounded-full"></div>
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-green-500 via-[#114373] to-[#1e5a8a] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (completedSteps.length / steps.length) * 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-[#114373] to-[#1e5a8a] rounded-full animate-pulse opacity-75"></div>
            </div>
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-semibold text-[#114373] bg-white px-3 py-1 rounded-md shadow-sm">
              {Math.min(100, Math.round((completedSteps.length / steps.length) * 100))}% Complete
            </span>
        </div>
      </div>

      {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {getStepComponent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
          Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function PersonalInfoStep({ data, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    nationality: '',
    origin: '',
    experienceType: 'experienced'
  });
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-nationality')) setShowNationalityDropdown(false);
      if (!target.closest('.dropdown-origin')) setShowOriginDropdown(false);
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  // Sync form when API data arrives/changes
  useEffect(() => {
    console.log('🔍 PersonalInfoStep: Data prop changed', {
      hasData: !!data,
      hasCandidate: !!data?.candidate,
      hasProfile: !!data?.profile,
      candidateKeys: data?.candidate ? Object.keys(data.candidate) : [],
      profileKeys: data?.profile ? Object.keys(data.profile) : [],
      candidateFirstName: data?.candidate?.firstName || data?.candidate?.first_name,
      candidateSurname: data?.candidate?.surname || data?.candidate?.last_name,
      profileDateOfBirth: data?.profile?.date_of_birth,
      profileNationality: data?.profile?.nationality
    });
    
    if (data && data.candidate) {
      // Format date for HTML date input (yyyy-MM-dd)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        try {
        const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
        } catch (e) {
          console.warn('Failed to parse date:', dateString, e);
          return '';
        }
      };

      // For new profiles, profile will be null - that's expected and OK
      // We should still populate candidate data even if profile is null
      const newFormData = {
        firstName: data.candidate?.firstName || data.candidate?.first_name || '',
        middleName: data.candidate?.middleName || data.candidate?.middle_name || '',
        surname: data.candidate?.surname || data.candidate?.last_name || data.candidate?.surname_name || '',
        // For new profiles, profile is null, so these will be empty strings (which is correct)
        dateOfBirth: formatDateForInput(data.profile?.date_of_birth) || '',
        gender: (data.candidate?.gender || 'male').toLowerCase(),
        maritalStatus: data.profile?.marital_status || 'single',
        nationality: data.profile?.nationality || '',
        origin: data.profile?.origin || '',
        experienceType: data.profile?.experience_type || 'experienced'
      };
      
      console.log('📝 PersonalInfoStep: Setting form data', {
        ...newFormData,
        isNewProfile: !data.profile, // Log if this is a new profile
        hasProfileData: !!data.profile
      });
      setFormData(newFormData);
    } else {
      console.warn('⚠️ PersonalInfoStep: No candidate data available', { data });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    if (!formData.dateOfBirth) nextErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) nextErrors.gender = 'Gender is required';
    if (!formData.maritalStatus) nextErrors.maritalStatus = 'Marital status is required';
    if (!formData.nationality?.trim()) nextErrors.nationality = 'Nationality is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onComplete({
      candidate: {
        gender: formData.gender
      },
      profile: {
        date_of_birth: formData.dateOfBirth,
        marital_status: formData.maritalStatus,
        nationality: formData.nationality,
        origin: formData.origin,
        gender: (formData.gender || '').toLowerCase()
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 text-gray-900"
              placeholder="Enter first name"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input
              type="text"
              value={formData.middleName}
              onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 text-gray-900"
              placeholder="Enter middle name"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Surname *</label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 text-gray-900"
              placeholder="Enter surname"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              required
            />
            {errors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status *</label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => setFormData((prev: typeof formData) => ({ ...prev, maritalStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
            <div className="relative dropdown-nationality">
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => {
                  setFormData((prev: typeof formData) => ({ ...prev, nationality: e.target.value }));
                  setShowNationalityDropdown(true);
                }}
                onFocus={() => setShowNationalityDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="Search nationality"
                required
              />
              {errors.nationality && <p className="text-xs text-red-600 mt-1">{errors.nationality}</p>}
              {showNationalityDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {searchNationalities(formData.nationality || '').map((n) => (
                    <button
                      type="button"
                      key={n}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData((prev: typeof formData) => ({ ...prev, nationality: n }));
                        setShowNationalityDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-900"
                    >
                      {n}
                    </button>
                  ))}
                  {searchNationalities(formData.nationality || '').length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
            <div className="relative dropdown-origin">
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => {
                  setFormData((prev: typeof formData) => ({ ...prev, origin: e.target.value }));
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="Search origin"
              />
              {showOriginDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {searchNationalities(formData.origin || '').map((o) => (
                    <button
                      type="button"
                      key={o}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData((prev: typeof formData) => ({ ...prev, origin: o }));
                        setShowOriginDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-900"
                    >
                      {o}
                    </button>
                  ))}
                  {searchNationalities(formData.origin || '').length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No results</div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ContactInfoStep({ data, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    phone: {
      countryCode: '+1',
      number: ''
    },
    alternatePhone: {
      countryCode: '+1',
      number: ''
    },
    whatsapp: {
      countryCode: '+1',
      number: ''
    }
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Sync form when API data arrives/changes
  useEffect(() => {
    if (data && data.candidate) {
      setFormData(prev => {
        const splitPhone = (v?: string) => {
          if (!v) return { code: prev.phone.countryCode, num: '' } as any;
          if (v.startsWith('+')) {
            const m = v.match(/^\+(\d{1,3})\s*(.*)$/);
            if (m) return { code: `+${m[1]}`, num: (m[2] || '').replace(/\s+/g, '') };
          }
          return { code: prev.phone.countryCode, num: v.replace(/\s+/g, '') };
        };

        const p = splitPhone(data.candidate?.phone);
        const ap = splitPhone(data.candidate?.alternatePhone);
        const wa = splitPhone(data.candidate?.whatsapp);

        return {
          ...prev,
          phone: { countryCode: p.code, number: p.num },
          alternatePhone: { countryCode: ap.code, number: ap.num },
          whatsapp: { countryCode: wa.code, number: wa.num }
        };
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    if (!formData.phone.number) nextErrors.phone = 'Phone number is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const full = (code: string, num: string) => `${code}${num.replace(/\s+/g, '')}`;
    onComplete({
      candidate: {
        phone: full(formData.phone.countryCode, formData.phone.number),
        alternatePhone: formData.alternatePhone.number ? full(formData.alternatePhone.countryCode, formData.alternatePhone.number) : '',
        whatsapp: formData.whatsapp.number ? full(formData.whatsapp.countryCode, formData.whatsapp.number) : '',
      }
    });
  };



  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Phone Numbers Only */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <PhoneNumberSelector
                  countryCode={formData.phone.countryCode}
                  phoneNumber={formData.phone.number}
                  onCountryCodeChange={(code) => setFormData(prev => ({ 
                    ...prev, 
                    phone: { ...prev.phone, countryCode: code } 
                  }))}
                  onPhoneNumberChange={(number) => setFormData(prev => ({ 
                    ...prev, 
                    phone: { ...prev.phone, number } 
                  }))}
                  label="Phone Number *"
                  placeholder="123456789"
                  required={true}
                />
              </div>

              <div>
                <PhoneNumberSelector
                  countryCode={formData.alternatePhone.countryCode}
                  phoneNumber={formData.alternatePhone.number}
                  onCountryCodeChange={(code) => setFormData(prev => ({ 
                    ...prev, 
                    alternatePhone: { ...prev.alternatePhone, countryCode: code } 
                  }))}
                  onPhoneNumberChange={(number) => setFormData(prev => ({ 
                    ...prev, 
                    alternatePhone: { ...prev.alternatePhone, number } 
                  }))}
                  label="Alternate Phone"
                  placeholder="123456789"
                  required={false}
                />
              </div>

              <div>
                <PhoneNumberSelector
                  countryCode={formData.whatsapp.countryCode}
                  phoneNumber={formData.whatsapp.number}
                  onCountryCodeChange={(code) => setFormData(prev => ({ 
                    ...prev, 
                    whatsapp: { ...prev.whatsapp, countryCode: code } 
                  }))}
                  onPhoneNumberChange={(number) => setFormData(prev => ({ 
                    ...prev, 
                    whatsapp: { ...prev.whatsapp, number } 
                  }))}
                  label="WhatsApp"
                  placeholder="123456789"
                  required={false}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function LocationInfoStep({ data, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    currentAddress: {
      houseNo: '',
      streetName: '',
      landmark: '',
      postalCode: '',
      country: '',
      state: '',
      city: ''
    },
    permanentAddress: {
      houseNo: '',
      streetName: '',
      landmark: '',
      postalCode: '',
      country: '',
      state: '',
      city: ''
    },
    isSameAsCurrentAddress: false,
    isOpenForRelocation: 'no',
    preferredLocations: [] as string[]
  });
  const [newPreferredLocation, setNewPreferredLocation] = useState({
    country: '',
    state: '',
    city: ''
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Sync form when API data arrives/changes
  useEffect(() => {
    if (data && data.profile) {
      setFormData(prev => ({
        ...prev,
        currentAddress: {
          houseNo: data.profile?.current_address?.houseNo || '',
          streetName: data.profile?.current_address?.streetName || '',
          landmark: data.profile?.current_address?.landmark || '',
          postalCode: data.profile?.current_address?.postalCode || '',
          country: data.profile?.current_location?.country || '',
          state: data.profile?.current_location?.state || '',
          city: data.profile?.current_location?.city || ''
        },
        permanentAddress: {
          houseNo: data.profile?.permanent_address?.houseNo || '',
          streetName: data.profile?.permanent_address?.streetName || '',
          landmark: data.profile?.permanent_address?.landmark || '',
          postalCode: data.profile?.permanent_address?.postalCode || '',
          country: data.profile?.permanent_location?.country || '',
          state: data.profile?.permanent_location?.state || '',
          city: data.profile?.permanent_location?.city || ''
        },
        isSameAsCurrentAddress: data.profile?.isSameAsCurrentAddress || false,
        isOpenForRelocation: data.profile?.isOpenForRelocation || 'no',
        preferredLocations: data.profile?.preferred_locations || []
      }));
    }
  }, [data]);

  const handleCurrentAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      currentAddress: {
        ...prev.currentAddress,
        [field]: value
      }
    }));
  };

  const handlePermanentAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      permanentAddress: {
        ...prev.permanentAddress,
        [field]: value
      }
    }));
  };

  const handleSameAsCurrentChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isSameAsCurrentAddress: checked,
      permanentAddress: checked ? prev.currentAddress : prev.permanentAddress
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    
    // Phase 1 location capture: Country -> Region/State -> District/City.
    // House number, street, landmark, postal code, and admin numbers are optional.
    if (!formData.currentAddress.country) nextErrors.currentCountry = 'Country is required';
    
    // Validate permanent address if not same as current
    if (!formData.isSameAsCurrentAddress) {
      if (!formData.permanentAddress.country) nextErrors.permanentCountry = 'Country is required';
    }
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Scroll to top of form to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onComplete({
      profile: {
        current_address: formData.currentAddress,
        permanent_address: formData.isSameAsCurrentAddress ? formData.currentAddress : formData.permanentAddress,
        current_location: {
          country: formData.currentAddress.country,
          state: formData.currentAddress.state,
          city: formData.currentAddress.city
        },
        permanent_location: {
          country: formData.isSameAsCurrentAddress ? formData.currentAddress.country : formData.permanentAddress.country,
          state: formData.isSameAsCurrentAddress ? formData.currentAddress.state : formData.permanentAddress.state,
          city: formData.isSameAsCurrentAddress ? formData.currentAddress.city : formData.permanentAddress.city
        },
        isSameAsCurrentAddress: formData.isSameAsCurrentAddress,
        isOpenForRelocation: formData.isOpenForRelocation,
        preferredLocations: formData.preferredLocations
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact & Location</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Current Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Location</h3>
            <div className="mb-6">
              <LocationSelector
                selectedCountry={formData.currentAddress.country}
                selectedState={formData.currentAddress.state}
                selectedCity={formData.currentAddress.city}
                onCountryChange={(code) => handleCurrentAddressChange('country', code)}
                onStateChange={(code) => handleCurrentAddressChange('state', code)}
                onCityChange={(city) => handleCurrentAddressChange('city', city)}
                showLabels={true}
                error={errors.currentCountry || errors.currentState || errors.currentCity}
              />
            </div>
          </div>

          {/* Permanent Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Permanent Location</h3>
            
            {/* Same as Current Location Checkbox */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isSameAsCurrentAddress}
                  onChange={(e) => handleSameAsCurrentChange(e.target.checked)}
                  className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Same as Current Location</span>
              </label>
            </div>

            <div className={`mb-6 ${formData.isSameAsCurrentAddress ? 'opacity-50' : ''}`}>
              <LocationSelector
                selectedCountry={formData.permanentAddress.country}
                selectedState={formData.permanentAddress.state}
                selectedCity={formData.permanentAddress.city}
                onCountryChange={(code) => handlePermanentAddressChange('country', code)}
                onStateChange={(code) => handlePermanentAddressChange('state', code)}
                onCityChange={(city) => handlePermanentAddressChange('city', city)}
                showLabels={true}
                error={errors.permanentCountry || errors.permanentState || errors.permanentCity}
              />
            </div>
          </div>

          {/* Relocation Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Are you open for relocation?</h3>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="relocation"
                  value="yes"
                  checked={formData.isOpenForRelocation === 'yes'}
                  onChange={(e) => {
                    const value = e.target.value as 'yes' | 'no';
                    setFormData(prev => ({ 
                      ...prev, 
                      isOpenForRelocation: value,
                      preferredLocations: value === 'no' ? [] : prev.preferredLocations
                    }));
                  }}
                  className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="relocation"
                  value="no"
                  checked={formData.isOpenForRelocation === 'no'}
                  onChange={(e) => {
                    const value = e.target.value as 'yes' | 'no';
                    setFormData(prev => ({ 
                      ...prev, 
                      isOpenForRelocation: value,
                      preferredLocations: value === 'no' ? [] : prev.preferredLocations
                    }));
                  }}
                  className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Preferred Work Locations - Only show if relocation is Yes */}
          {formData.isOpenForRelocation === 'yes' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferred Work Locations (Maximum 3 locations)</h3>
              <div className="space-y-3">
                {/* Current Preferred Locations as chips */}
                <div className="flex flex-wrap gap-2">
                  {formData.preferredLocations.map((location, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                      {location}
                      <button
                        type="button"
                        onClick={() => {
                          const newLocations = formData.preferredLocations.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, preferredLocations: newLocations }));
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add New Preferred Location */}
                {formData.preferredLocations.length < 3 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Preferred Location</h4>
                    <LocationSelector
                      selectedCountry={newPreferredLocation.country}
                      selectedState={newPreferredLocation.state}
                      selectedCity={newPreferredLocation.city}
                      onCountryChange={(country) => setNewPreferredLocation(prev => ({ ...prev, country }))}
                      onStateChange={(state) => setNewPreferredLocation(prev => ({ ...prev, state }))}
                      onCityChange={(city) => setNewPreferredLocation(prev => ({ ...prev, city }))}
                      showLabels={false}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          // Allow adding location with just country, or country+state, or country+state+city
                          if (newPreferredLocation.country) {
                            // Get proper country name from locationData
                            const { locationData } = require('@/utils/locationData');
                            const countryName = locationData.getCountryByCode(newPreferredLocation.country)?.name || newPreferredLocation.country;
                            
                            let locationString = '';
                            
                            if (newPreferredLocation.city && newPreferredLocation.state) {
                              // Full location: City, State, Country
                              const states = locationData.getStatesByCountry(newPreferredLocation.country);
                              const stateObj = states.find((s: State) => s.code === newPreferredLocation.state);
                              const stateName = stateObj?.name || newPreferredLocation.state;
                              locationString = `${newPreferredLocation.city}, ${stateName}, ${countryName}`;
                            } else if (newPreferredLocation.state) {
                              // State and Country: State, Country
                              const states = locationData.getStatesByCountry(newPreferredLocation.country);
                              const stateObj = states.find((s: State) => s.code === newPreferredLocation.state);
                              const stateName = stateObj?.name || newPreferredLocation.state;
                              locationString = `${stateName}, ${countryName}`;
                            } else {
                              // Just Country
                              locationString = countryName;
                            }
                            
                            if (!formData.preferredLocations.includes(locationString)) {
                              setFormData(prev => ({
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
                        }}
                        disabled={!newPreferredLocation.country}
                        className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Add Location
                      </button>
                    </div>
                  </div>
                )}

                {formData.preferredLocations.length >= 3 && (
                  <p className="text-xs text-gray-500">Maximum of 3 preferred locations reached.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Summary at Bottom */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {errors.currentCountry && <li>Current Location: {errors.currentCountry}</li>}
                  {errors.currentState && <li>Current Location: {errors.currentState}</li>}
                  {errors.currentCity && <li>Current Location: {errors.currentCity}</li>}
                  {errors.permanentCountry && <li>Permanent Location: {errors.permanentCountry}</li>}
                  {errors.permanentState && <li>Permanent Location: {errors.permanentState}</li>}
                  {errors.permanentCity && <li>Permanent Location: {errors.permanentCity}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfessionalSummaryStep({ data, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    resumeHeadline: '',
    profileSummary: ''
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Sync form when API data arrives/changes
  useEffect(() => {
    if (data && data.profile) {
      setFormData(prev => ({
        ...prev,
        resumeHeadline: data.profile?.resume_headline || '',
        profileSummary: data.profile?.profile_summary || ''
      }));
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    
    // Validate required fields
    if (!formData.resumeHeadline.trim()) {
      nextErrors.resumeHeadline = 'Resume headline is required';
    }
    if (!formData.profileSummary.trim()) {
      nextErrors.profileSummary = 'Profile summary is required';
    }
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onComplete({
      profile: {
        resume_headline: formData.resumeHeadline,
        profile_summary: formData.profileSummary
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Summary</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Resume Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Headline *
            </label>
            <input
              type="text"
              value={formData.resumeHeadline}
              onChange={(e) => setFormData(prev => ({ ...prev, resumeHeadline: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              placeholder="e.g., Senior Software Engineer with 5+ years experience"
              required
            />
            {errors.resumeHeadline && <p className="text-red-500 text-sm mt-1">{errors.resumeHeadline}</p>}
            <p className="text-xs text-gray-500 mt-1">
              A concise, impactful statement that highlights your key qualifications
            </p>
          </div>

          {/* Profile Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Summary *
            </label>
                <textarea
              value={formData.profileSummary}
              onChange={(e) => setFormData(prev => ({ ...prev, profileSummary: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent resize-none"
              placeholder="Describe your professional background, skills, and career objectives..."
              required
            />
            {errors.profileSummary && <p className="text-red-500 text-sm mt-1">{errors.profileSummary}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Provide a detailed summary of your professional experience, skills, and career goals
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function EmploymentDetailsStep({ data, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    experienceType: '',
    totalExperienceYears: 0,
    totalExperienceMonths: 0
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Sync form when API data arrives/changes
  useEffect(() => {
    if (data && data.profile) {
      setFormData(prev => ({
        ...prev,
        experienceType: data.profile?.experience_type || 'fresher',
        totalExperienceYears: data.profile?.total_experience_years || 0,
        totalExperienceMonths: data.profile?.total_experience_months || 0
      }));
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    
    // Validate experience type selection
    if (!formData.experienceType) {
      nextErrors.experienceType = 'Please select your experience level';
    }
    
    // Validate total experience if experienced
    if (formData.experienceType === 'experienced') {
      if (formData.totalExperienceYears === 0 && formData.totalExperienceMonths === 0) {
        nextErrors.totalExperience = 'Please enter your total experience';
      }
    }
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onComplete({
      profile: {
        experience_type: formData.experienceType,
        total_experience_years: formData.experienceType === 'experienced' ? formData.totalExperienceYears : null,
        total_experience_months: formData.experienceType === 'experienced' ? formData.totalExperienceMonths : null
      }
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Employment Details</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Experience Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Experience Type *</label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="experienceType"
                  value="fresher"
                  checked={formData.experienceType === 'fresher'}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceType: e.target.value }))}
                  className="mr-2 h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                />
                <span className="text-sm text-gray-700">Fresher</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="experienceType"
                  value="experienced"
                  checked={formData.experienceType === 'experienced'}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceType: e.target.value }))}
                  className="mr-2 h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300"
                />
                <span className="text-sm text-gray-700">Experienced</span>
              </label>
            </div>
            {errors.experienceType && (
              <p className="mt-1 text-sm text-red-600">{errors.experienceType}</p>
            )}
          </div>

          {/* Total Experience - Only show for experienced */}
          {formData.experienceType === 'experienced' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.totalExperienceYears}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalExperienceYears: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="0"
                    min="0"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Experience (Months)</label>
                  <input
                    type="number"
                    value={formData.totalExperienceMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalExperienceMonths: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max="11"
                  />
            </div>
          </div>
              {errors.totalExperience && <p className="text-red-500 text-sm mt-1">{errors.totalExperience}</p>}
            </div>
          )}

          {/* Information about next steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Next Steps
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  {formData.experienceType === 'fresher' ? (
                    <p>You can add internships and volunteering experiences in the next step.</p>
                  ) : (
                    <p>You can add your work experience details in the next step.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ExperienceStep({ data, candidateId, onComplete, isLoading }: any) {
  const [experiences, setExperiences] = useState<any[]>(data.experience || []);
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  // Get experience type from profile data (same as main profile page)
  const experienceType = data.profile?.experience_type || 'experienced';

  // Update experiences when data changes
  useEffect(() => {
    if (data.experience) {
      setExperiences(data.experience);
    }
  }, [data.experience]);

  // Function to refetch experience data from database
  const refetchExperiences = async () => {
    try {
      setIsRefetching(true);
      const response = await fetch(`/api/candidates/experience?candidateId=${candidateId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setExperiences(result.data);
          console.log('✅ Refetched experiences from database:', result.data.length, 'items');
        } else {
          console.warn('⚠️ Refetch returned no data:', result);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to refetch experiences:', errorData);
      }
    } catch (error) {
      console.error('Error refetching experiences:', error);
    } finally {
      setIsRefetching(false);
    }
  };

  const handleAddExperience = async (experienceData: any) => {
    try {
      // ExperienceModal sends startDate/endDate, but we need to check multiple sources
      // Extract dates from multiple possible field names
      const startDate = experienceData.startDate 
        || experienceData.start_date 
        || experienceData.fromDate 
        || experienceData.from_date 
        || '';
      
      const endDate = experienceData.endDate 
        || experienceData.end_date 
        || experienceData.toDate 
        || experienceData.to_date 
        || null;
      
      console.log('🔍 ProfileWizard - Extracting dates from experienceData:', {
        rawData: experienceData,
        allKeys: Object.keys(experienceData),
        startDate,
        endDate,
        hasStartDate: !!experienceData.startDate,
        hasFromDate: !!experienceData.fromDate
      });
      
      // Validate startDate is present
      if (!startDate || startDate.trim() === '') {
        console.error('❌ CRITICAL: startDate is missing in ProfileWizard handleAddExperience!', experienceData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      // Map the form data to API expected format
      const apiData = {
        companyName: experienceData.companyName,
        jobTitle: experienceData.jobTitle,
        designation: experienceData.designation,
        startDate: startDate,  // Use extracted startDate
        endDate: endDate,      // Use extracted endDate
        isCurrent: experienceData.isCurrent,
        industry: experienceData.industry,
        level: experienceData.level,
        companyProfile: experienceData.companyProfile,
        rolesResponsibilities: experienceData.rolesResponsibilities || '',
        keyAchievements: experienceData.keyAchievements,
        experienceType: experienceType === 'fresher' ? 'internship' : 'work'
      };
      
      // Final validation before sending
      if (!apiData.startDate || apiData.startDate.trim() === '') {
        console.error('❌ CRITICAL: startDate is missing from apiData after mapping!', apiData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      console.log('📤 ProfileWizard - Sending experience data to API:', JSON.stringify(apiData, null, 2));

      const response = await fetch('/api/candidates/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          experienceData: apiData
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Experience added successfully:', result);
        setShowModal(false);
        // Refetch experiences from database to get the complete data
        await refetchExperiences();
      } else {
        const errorData = await response.json();
        console.error('Failed to add experience:', errorData);
        alert(errorData.error || 'Failed to add experience. Please try again.');
      }
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const handleEditExperience = async (experienceData: any) => {
    if (!editingExperience) return;
    
    try {
      // ExperienceModal sends startDate/endDate, but we need to check multiple sources
      // Extract dates from multiple possible field names
      const startDate = experienceData.startDate 
        || experienceData.start_date 
        || experienceData.fromDate 
        || experienceData.from_date 
        || '';
      
      const endDate = experienceData.endDate 
        || experienceData.end_date 
        || experienceData.toDate 
        || experienceData.to_date 
        || null;
      
      console.log('🔍 ProfileWizard - Extracting dates for edit:', {
        rawData: experienceData,
        startDate,
        endDate
      });
      
      // Validate startDate is present
      if (!startDate || startDate.trim() === '') {
        console.error('❌ CRITICAL: startDate is missing in ProfileWizard handleEditExperience!', experienceData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      // Map the form data to API expected format
      const apiData = {
        companyName: experienceData.companyName,
        jobTitle: experienceData.jobTitle,
        designation: experienceData.designation,
        startDate: startDate,  // Use extracted startDate
        endDate: endDate,      // Use extracted endDate
        isCurrent: experienceData.isCurrent,
        industry: experienceData.industry,
        level: experienceData.level,
        companyProfile: experienceData.companyProfile,
        rolesResponsibilities: experienceData.rolesResponsibilities || '',
        keyAchievements: experienceData.keyAchievements,
        experienceType: experienceType === 'fresher' ? 'internship' : 'work'
      };
      
      // Final validation before sending
      if (!apiData.startDate || apiData.startDate.trim() === '') {
        console.error('❌ CRITICAL: startDate is missing from apiData after mapping!', apiData);
        alert('Start date is required. Please select a start date.');
        return;
      }
      
      console.log('📤 ProfileWizard - Sending updated experience data to API:', JSON.stringify(apiData, null, 2));

      const response = await fetch('/api/candidates/experience', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: editingExperience.id,
          experienceData: apiData
        })
      });

      if (response.ok) {
        console.log('✅ Experience updated successfully');
        setShowModal(false);
        setEditingExperience(null);
        // Refetch experiences from database to get the complete updated data
        await refetchExperiences();
      } else {
        const errorData = await response.json();
        console.error('Failed to update experience:', errorData);
        alert(errorData.error || 'Failed to update experience. Please try again.');
      }
    } catch (error) {
      console.error('Error updating experience:', error);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/experience?experienceId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Experience deleted successfully');
        // Refetch experiences from database to get the updated list
        await refetchExperiences();
      } else {
        console.error('Failed to delete experience');
        alert('Failed to delete experience. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ experiences });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {experienceType === 'fresher' ? 'Internships / Volunteering' : 'Work Experience'}
      </h2>
      
      {isRefetching && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">Refreshing experience list...</span>
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        {experiences.map((exp: any) => (
          <div key={exp.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Job Title - Most prominent */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{exp.job_title || exp.designation}</h3>
                
                {/* Company Name */}
                <p className="text-[#114373] font-semibold text-base mb-2">{exp.company_name}</p>
                
                {/* Employment Period */}
                <p className="text-sm text-gray-600 mb-3">
                  {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { 
                    month: 'numeric', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A'} - {exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { 
                    month: 'numeric', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A')}
                </p>
                
                {/* Company Description */}
                {exp.company_profile && (
                  <p className="text-sm text-gray-700 mb-3">{exp.company_profile}</p>
                )}
                
                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Industry:</span>
                    <span className="text-gray-800">{exp.industry || 'Not specified'}</span>
              </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Designation:</span>
                    <span className="text-gray-800">{exp.job_title || exp.designation}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Level:</span>
                    <span className="text-gray-800">{exp.level || 'Not specified'}</span>
                  </div>
                  {exp.location && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Location:</span>
                      <span className="text-gray-800">
                        {exp.location.city}
                        {exp.location.country_code && (
                          <>, {exp.location.country_name}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Roles & Responsibilities */}
                {(exp.roles_responsibilities || exp.rolesResponsibilities) && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600 text-sm">Roles & Responsibilities:</span>
                    <ul className="text-sm text-gray-800 mt-1 list-disc list-inside space-y-1">
                      {(exp.roles_responsibilities || exp.rolesResponsibilities || '')
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string, idx: number) => (
                          <li key={idx} className="ml-2">{line.trim()}</li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {/* Key Achievements */}
                {(exp.key_achievements || exp.keyAchievements || exp.achievements) && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600 text-sm">Key Achievements:</span>
                    <ul className="text-sm text-gray-800 mt-1 list-disc list-inside space-y-1">
                      {(exp.key_achievements || exp.keyAchievements || exp.achievements || '')
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string, idx: number) => (
                          <li key={idx} className="ml-2">{line.trim()}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingExperience(exp);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Experience"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Experience"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setEditingExperience(null);
          setShowModal(true);
        }}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors"
      >
        {experienceType === 'fresher' ? '+ Add Internship / Volunteering' : '+ Add Work Experience'}
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Experience Modal */}
      <ExperienceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExperience(null);
        }}
        experience={editingExperience}
        onSave={editingExperience ? handleEditExperience : handleAddExperience}
      />
    </div>
  );
}

function EducationStep({ data, candidateId, onComplete, isLoading }: any) {
  const [education, setEducation] = useState<any[]>(data.education || []);
  const [showModal, setShowModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any | null>(null);
  const [isAddingEducation, setIsAddingEducation] = useState(false);

  // Load education data when component mounts
  useEffect(() => {
    const loadEducationData = async () => {
      try {
        const response = await fetch(`/api/candidates/education?candidateId=${candidateId}`);
        const result = await response.json();
        if (result.success) {
          setEducation(result.data);
        }
      } catch (error) {
        console.error('Error loading education data:', error);
      }
    };
    
    loadEducationData();
  }, [candidateId]);

  const handleAddEducation = async (educationData: any) => {
    try {
      setIsAddingEducation(true);
      // Map the form data to API expected format
      const apiData = {
        country: educationData.country,
        category: educationData.category,
        degree: educationData.degree,
        specialization: educationData.specialization,
        institute: educationData.institute,
        startDate: educationData.startDate,
        endDate: educationData.endDate,
        description: educationData.description
      };

      const response = await fetch('/api/candidates/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          educationData: apiData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Fetch the complete education data from the API to get all fields
        const fetchResponse = await fetch(`/api/candidates/education?candidateId=${candidateId}`);
        const fetchResult = await fetchResponse.json();
        if (fetchResult.success) {
          setEducation(fetchResult.data);
        }
        setShowModal(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to add education:', errorData);
        alert(errorData.error || 'Failed to add education. Please check all required fields.');
      }
    } catch (error) {
      console.error('Error adding education:', error);
    } finally {
      setIsAddingEducation(false);
    }
  };

  const handleEditEducation = async (educationData: any) => {
    if (!editingEducation) return;
    
    try {
      // Map the form data to API expected format
      const apiData = {
        country: educationData.country,
        category: educationData.category,
        degree: educationData.degree,
        specialization: educationData.specialization,
        institute: educationData.institute,
        startDate: educationData.startDate,
        endDate: educationData.endDate,
        description: educationData.description
      };

      const response = await fetch('/api/candidates/education', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          educationId: editingEducation.id,
          educationData: apiData
        })
      });

      if (response.ok) {
        // Fetch the complete education data from the API to get all fields
        const fetchResponse = await fetch(`/api/candidates/education?candidateId=${candidateId}`);
        const fetchResult = await fetchResponse.json();
        if (fetchResult.success) {
          setEducation(fetchResult.data);
        }
        setShowModal(false);
        setEditingEducation(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to update education:', errorData);
        alert(errorData.error || 'Failed to update education. Please check all required fields.');
      }
    } catch (error) {
      console.error('Error updating education:', error);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/education?educationId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
    setEducation((prev: any[]) => prev.filter(edu => edu.id !== id));
      } else {
        console.error('Failed to delete education');
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ education });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
      
      <div className="space-y-4 mb-6">
        {education.map((edu: any) => (
          <div key={edu.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Degree/Qualification - Most prominent */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{edu.qualification || edu.degree}</h3>
                
                {/* Institution Name */}
                <p className="text-[#114373] font-semibold text-base mb-2">{edu.institution || edu.institute}</p>
                
                {/* Country and Category */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {edu.country && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {edu.country}
                    </span>
                  )}
                  {edu.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {edu.category}
                    </span>
                  )}
                </div>
                
                {/* Field of Study */}
                {(edu.field_of_study || edu.specialization) && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Field of Study:</span> {edu.field_of_study || edu.specialization}
                  </p>
                )}
                
                {/* GPA/Achievement */}
                {(edu.description || edu.gpa_achievement) && (
                  <div className="mb-3">
                    <span className="font-medium text-sm text-gray-600">GPA/Achievement:</span>
                    <ul className="text-sm text-gray-800 mt-1 list-disc list-inside space-y-1">
                      {(edu.description || edu.gpa_achievement || '')
                        .split('\n')
                        .filter((line: string) => line.trim())
                        .map((line: string, idx: number) => (
                          <li key={idx} className="ml-2">{line.trim()}</li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {/* Education Period / Graduation Year */}
                <div className="mb-3">
                  <span className="font-medium text-sm text-gray-600">Graduation Year:</span>
                  <p className="text-sm text-gray-800 mt-1">
                    {edu.start_date ? new Date(edu.start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'Not specified'} - {edu.end_date ? new Date(edu.end_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'Present'}
                  </p>
                </div>
                
                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Institution:</span>
                    <span className="text-gray-800">{edu.institution || edu.institute}</span>
                  </div>
                  {edu.specialization && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Field of Study:</span>
                      <span className="text-gray-800">{edu.specialization}</span>
                    </div>
                  )}
                  {edu.category && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Category:</span>
                      <span className="text-gray-800">{edu.category}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingEducation(edu);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Education"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEducation(edu.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Education"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setEditingEducation(null);
          setShowModal(true);
        }}
        disabled={isAddingEducation}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingEducation ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            Adding Education...
          </>
        ) : (
          '+ Add Education'
        )}
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Education Modal */}
      <EducationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEducation(null);
        }}
        education={editingEducation}
        onSave={editingEducation ? handleEditEducation : handleAddEducation}
      />
    </div>
  );
}

function LanguageStep({ data, candidateId, onComplete, isLoading }: any) {
  const [languages, setLanguages] = useState<any[]>(data.languages || []);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<any | null>(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  const handleAddLanguage = async (languageData: any) => {
    setIsAddingLanguage(true);
    try {
      const response = await fetch('/api/candidates/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          languageData
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newLanguageId = result.data.id;
        
        // Fetch the newly added language to get the proper database format
        const fetchResponse = await fetch(`/api/candidates/languages?candidateId=${candidateId}`);
        if (fetchResponse.ok) {
          const fetchResult = await fetchResponse.json();
          const newLanguage = fetchResult.data.find((lang: any) => lang.id === newLanguageId);
          if (newLanguage) {
            setLanguages((prev: any[]) => [...prev, newLanguage]);
          } else {
            // Fallback: transform the data to match database format
            setLanguages((prev: any[]) => [...prev, {
              id: newLanguageId,
              language_name: languageData.languageName,
              proficiency_level: languageData.proficiencyLevel,
              certification: languageData.certification || null,
              is_native: languageData.isNative || false
            }]);
          }
        } else {
          // Fallback: transform the data to match database format
          setLanguages((prev: any[]) => [...prev, {
            id: newLanguageId,
            language_name: languageData.languageName,
            proficiency_level: languageData.proficiencyLevel,
            certification: languageData.certification || null,
            is_native: languageData.isNative || false
          }]);
        }
        
        setShowModal(false);
        return Promise.resolve();
      } else {
        const errorData = await response.json();
        console.error('Failed to add language:', errorData);
        return Promise.reject(new Error('Failed to add language'));
      }
    } catch (error) {
      console.error('Error adding language:', error);
      return Promise.reject(error);
    } finally {
      setIsAddingLanguage(false);
    }
  };

  const handleEditLanguage = async (languageData: any) => {
    if (!editingLanguage) return;
    
    try {
      const response = await fetch('/api/candidates/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageId: editingLanguage.id,
          languageData
        })
      });

      if (response.ok) {
        // Fetch the updated language to get the proper database format
        const fetchResponse = await fetch(`/api/candidates/languages?candidateId=${candidateId}`);
        if (fetchResponse.ok) {
          const fetchResult = await fetchResponse.json();
          const updatedLanguage = fetchResult.data.find((lang: any) => lang.id === editingLanguage.id);
          if (updatedLanguage) {
        setLanguages((prev: any[]) => prev.map(lang => 
              lang.id === editingLanguage.id ? updatedLanguage : lang
            ));
          } else {
            // Fallback: transform the data to match database format
            setLanguages((prev: any[]) => prev.map(lang => 
              lang.id === editingLanguage.id ? {
                ...lang,
                language_name: languageData.languageName,
                proficiency_level: languageData.proficiencyLevel,
                certification: languageData.certification || null,
                is_native: languageData.isNative || false
              } : lang
            ));
          }
        } else {
          // Fallback: transform the data to match database format
          setLanguages((prev: any[]) => prev.map(lang => 
            lang.id === editingLanguage.id ? {
              ...lang,
              language_name: languageData.languageName,
              proficiency_level: languageData.proficiencyLevel,
              certification: languageData.certification || null,
              is_native: languageData.isNative || false
            } : lang
        ));
        }
        
        setShowModal(false);
        setEditingLanguage(null);
        return Promise.resolve();
      } else {
        const errorData = await response.json();
        console.error('Failed to update language:', errorData);
        return Promise.reject(new Error('Failed to update language'));
      }
    } catch (error) {
      console.error('Error updating language:', error);
      return Promise.reject(error);
    }
  };

  const handleDeleteLanguage = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/languages?languageId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLanguages((prev: any[]) => prev.filter(lang => lang.id !== id));
      } else {
        console.error('Failed to delete language');
      }
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ languages });
  };

  return (
              <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Languages</h2>
      
      <div className="space-y-4 mb-6">
        {languages.map((lang: any) => (
          <div key={lang.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Language Name - Most prominent */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{lang.language_name || lang.language || 'Unknown Language'}</h3>
                
                {/* Proficiency Level */}
                <p className="text-[#114373] font-semibold text-base mb-2">
                  Proficiency: {lang.proficiency_level || lang.proficiency || 'Not specified'}
                </p>
                
                {/* Native Language Badge */}
                {lang.is_native && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                    Native Language
                  </div>
                )}
                
                {/* Certification */}
                {lang.certification && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Certification:</span> {lang.certification}
                  </p>
                )}
                
                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Language:</span>
                    <span className="text-gray-800">{lang.language_name || lang.language || 'Unknown Language'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Proficiency:</span>
                    <span className="text-gray-800 capitalize">{lang.proficiency_level || lang.proficiency || 'Not specified'}</span>
                  </div>
                  {lang.certification && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Certification:</span>
                      <span className="text-gray-800">{lang.certification}</span>
                    </div>
                  )}
                  {lang.is_native && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Native Language:</span>
                      <span className="text-gray-800">Yes</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingLanguage(lang);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Language"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLanguage(lang.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Language"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setEditingLanguage(null);
          setShowModal(true);
        }}
        disabled={isAddingLanguage}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingLanguage ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
            Adding Language...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add Language
          </>
        )}
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Language Modal */}
      <LanguageModal
        key={`language-modal-${showModal}-${editingLanguage?.id || 'new'}`}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingLanguage(null);
        }}
        language={editingLanguage}
        onSave={editingLanguage ? handleEditLanguage : handleAddLanguage}
      />
    </div>
  );
}

function SalaryInfoStep({ data, candidateId, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    expectedSalary: '',
    currency: 'USD',
    salaryType: 'annual',
    isNegotiable: false,
    benefits: '',
    noticePeriod: ''
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Sync form when API data arrives/changes
  useEffect(() => {
    if (data && data.salary) {
      setFormData(prev => ({
        ...prev,
        expectedSalary: data.salary?.expected_salary || '',
        currency: data.salary?.currency || 'USD',
        salaryType: data.salary?.salary_type || 'annual',
        isNegotiable: data.salary?.is_negotiable || false,
        benefits: data.salary?.benefits || '',
        noticePeriod: data.salary?.notice_period || ''
      }));
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    
    // Validate required fields
    if (!formData.expectedSalary.trim()) {
      nextErrors.expectedSalary = 'Expected salary is required';
    }
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const response = await fetch('/api/candidates/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          salaryData: {
            expected_salary: formData.expectedSalary,
            currency: formData.currency,
            salary_type: formData.salaryType,
            is_negotiable: formData.isNegotiable,
            benefits: formData.benefits,
            notice_period: formData.noticePeriod
          }
        })
      });

      if (response.ok) {
        onComplete({ salary: formData });
      } else {
        const errorData = await response.json();
        console.error('Failed to save salary information:', errorData);
      }
    } catch (error) {
      console.error('Error saving salary information:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Salary Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
          {/* Expected Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Salary *
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                value={formData.expectedSalary}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                placeholder="Enter expected salary"
                required
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TZS">TZS</option>
              </select>
              <select
                value={formData.salaryType}
                onChange={(e) => setFormData(prev => ({ ...prev, salaryType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="annual">Per Year</option>
                <option value="monthly">Per Month</option>
                <option value="hourly">Per Hour</option>
              </select>
            </div>
            {errors.expectedSalary && <p className="text-red-500 text-sm mt-1">{errors.expectedSalary}</p>}
          </div>

          {/* Negotiable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isNegotiable"
              checked={formData.isNegotiable}
              onChange={(e) => setFormData(prev => ({ ...prev, isNegotiable: e.target.checked }))}
              className="h-4 w-4 text-[#114373] focus:ring-[#114373] border-gray-300 rounded"
            />
            <label htmlFor="isNegotiable" className="ml-2 block text-sm text-gray-700">
              Salary is negotiable
            </label>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Benefits
            </label>
            <textarea
              value={formData.benefits}
              onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent resize-none"
              placeholder="e.g., Health insurance, retirement plan, flexible hours..."
            />
          </div>

          {/* Notice Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Period
            </label>
            <select
              value={formData.noticePeriod}
              onChange={(e) => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="">Select notice period</option>
              <option value="immediate">Immediate</option>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="3 months">3 months</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ReferencesStep({ data, candidateId, onComplete, isLoading }: any) {
  const [references, setReferences] = useState<any[]>(data.references || []);
  const [showModal, setShowModal] = useState(false);
  const [editingReference, setEditingReference] = useState<any | null>(null);
  const [isAddingReference, setIsAddingReference] = useState(false);

  // Update references when data changes
  useEffect(() => {
    if (data.references) {
      setReferences(data.references);
    }
  }, [data.references]);

  const handleAddReference = async (referenceData: any) => {
    setIsAddingReference(true);
    try {
      const response = await fetch('/api/candidates/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          referenceData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Map the referenceData to match the expected field names for display
        const newReference = {
          id: result.data.id,
          name: referenceData.fullName || referenceData.full_name,
          designation: referenceData.designation,
          company: referenceData.organization,
          email: referenceData.email,
          phone: referenceData.phone,
          relationship: referenceData.relationship,
          linkedinProfile: referenceData.linkedinProfile,
          verification_status: 'pending'
        };
        setReferences((prev: any[]) => [...prev, newReference]);
        setShowModal(false);
        
        // Email is already sent by the API route, no need to send again
      } else {
        const errorData = await response.json();
        console.error('Failed to add reference:', errorData);
      }
    } catch (error) {
      console.error('Error adding reference:', error);
    } finally {
      setIsAddingReference(false);
    }
  };

  const handleEditReference = async (referenceData: any) => {
    if (!editingReference) return;
    
    try {
      const response = await fetch('/api/candidates/references', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: editingReference.id,
          referenceData
        })
      });

      if (response.ok) {
        // Map the referenceData to match the expected field names for display
        const updatedReference = {
          id: editingReference.id,
          name: referenceData.fullName || referenceData.full_name,
          designation: referenceData.designation,
          company: referenceData.organization,
          email: referenceData.email,
          phone: referenceData.phone,
          relationship: referenceData.relationship,
          linkedinProfile: referenceData.linkedinProfile,
          verification_status: editingReference.verification_status || 'pending'
        };
        setReferences((prev: any[]) => prev.map(ref => 
          ref.id === editingReference.id ? updatedReference : ref
        ));
        setShowModal(false);
        setEditingReference(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to update reference:', errorData);
      }
    } catch (error) {
      console.error('Error updating reference:', error);
    }
  };

  const handleDeleteReference = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/references?referenceId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReferences((prev: any[]) => prev.filter(ref => ref.id !== id));
      } else {
        console.error('Failed to delete reference');
      }
    } catch (error) {
      console.error('Error deleting reference:', error);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ references });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional References</h2>
      
      {/* Reference guidance notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              3 References Recommended
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>We recommend adding 3 professional references to strengthen your profile. References should be people who can vouch for your work experience and character.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {references.map((ref: any) => (
          <div key={ref.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Reference Name - Most prominent */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{ref.name || 'Name not specified'}</h3>
                
                {/* Professional Details */}
                <div className="mb-4">
                  <p className="text-[#114373] font-semibold text-lg mb-1">{ref.designation || 'Designation not specified'}</p>
                  <p className="text-gray-700 font-medium">{ref.company || 'Company not specified'}</p>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 w-16">Email:</span>
                    <a href={`mailto:${ref.email}`} className="text-sm text-[#114373] hover:underline">
                      {ref.email}
                    </a>
                  </div>
                  {ref.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-16">Phone:</span>
                      <a href={`tel:${ref.phone}`} className="text-sm text-[#114373] hover:underline">
                        {ref.phone}
                      </a>
                    </div>
                  )}
                  {(ref.linkedinProfile || ref.linkedin_profile) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 w-16">LinkedIn:</span>
                      <a 
                        href={ref.linkedinProfile || ref.linkedin_profile} 
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
                      {ref.relationship}
                    </span>
                  </div>
                  {ref.verification_status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ref.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 
                      ref.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ref.verification_status === 'verified' ? '✓ Verified' : 
                       ref.verification_status === 'pending' ? '⏳ Pending' : 
                       'Unverified'}
                    </span>
                  )}
                </div>
                
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingReference(ref);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Reference"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteReference(ref.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Reference"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        
      <button
        onClick={() => {
          setEditingReference(null);
          setShowModal(true);
        }}
        disabled={isAddingReference}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingReference ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
            Adding Reference...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add Reference
          </>
        )}
      </button>

      {/* Progress indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">References added:</span>
          <span className={`font-medium ${references.length >= 3 ? 'text-green-600' : 'text-blue-600'}`}>
            {references.length}/3 recommended
          </span>
            </div>
        {references.length < 3 && (
          <p className="text-xs text-blue-600 mt-1">
            Consider adding {3 - references.length} more reference{3 - references.length > 1 ? 's' : ''} to strengthen your profile.
          </p>
        )}
          </div>
          
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
            </div>

      {/* Reference Modal */}
      <ReferenceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReference(null);
        }}
        reference={editingReference}
        onSave={editingReference ? handleEditReference : handleAddReference}
      />
          </div>
  );
}

function ProjectsStep({ data, candidateId, onComplete, isLoading }: any) {
  const [projects, setProjects] = useState<any[]>(data.projects || []);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Update projects when data changes
  useEffect(() => {
    if (data.projects) {
      console.log('Projects data:', data.projects);
      setProjects(data.projects);
    }
  }, [data.projects]);

  const handleSaveProject = async (projectData: any) => {
    try {
      setIsAddingProject(true);
      if (editingProject) {
        // Update existing project
        const response = await fetch('/api/candidates/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: editingProject.id,
            projectData
          })
        });

        if (response.ok) {
          setProjects((prev: any[]) => prev.map(proj => 
            proj.id === editingProject.id ? { ...projectData, id: proj.id } : proj
          ));
          setShowModal(false);
          setEditingProject(null);
        } else {
          const errorData = await response.json();
          console.error('Failed to update project:', errorData);
        }
      } else {
        // Add new project
        const response = await fetch('/api/candidates/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId,
            projectData
          })
        });

        if (response.ok) {
          const result = await response.json();
          setProjects((prev: any[]) => [...prev, { ...projectData, id: result.data.id }]);
          setShowModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to add project:', errorData);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsAddingProject(false);
    }
  };


  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/projects?projectId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProjects((prev: any[]) => prev.filter(proj => proj.id !== id));
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ projects });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Projects</h2>
      
      <div className="space-y-4 mb-6">
        {projects.map((project: any, index: number) => {
          console.log(`Project ${index}:`, project);
          return (
          <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Project Title - Most prominent */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                
                {/* Client/Organization */}
                {project.client && (
                  <p className="text-[#114373] font-semibold text-base mb-2">{project.client}</p>
                )}
                
                {/* Project Duration */}
                {(project.start_date || project.end_date) && (
                  <p className="text-sm text-gray-600 mb-3">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 'N/A'} - {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 'Present'}
                  </p>
                )}
                
                {/* Project Description */}
                {project.description && (
                  <p className="text-sm text-gray-700 mb-3">{project.description}</p>
                )}
                
                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Project:</span>
                    <span className="text-gray-800">{project.title}</span>
                  </div>
                  {project.client && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Client:</span>
                      <span className="text-gray-800">{project.client}</span>
                    </div>
                  )}
                  {project.tools_technologies && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Technologies:</span>
                      <span className="text-gray-800">{project.tools_technologies}</span>
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Duration:</span>
                      <span className="text-gray-800">
                        {project.start_date ? new Date(project.start_date).getFullYear() : 'N/A'} - {project.end_date ? new Date(project.end_date).getFullYear() : 'Present'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Project"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          setEditingProject(null);
          setShowModal(true);
        }}
        disabled={isAddingProject}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingProject ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#114373]"></div>
            Adding Project...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add Project
          </>
        )}
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <ProjectModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSave={handleSaveProject}
      />
    </div>
  );
}

function AccomplishmentsStep({ data, candidateId, onComplete, isLoading }: any) {
  const [accomplishments, setAccomplishments] = useState<any[]>(data.accomplishments || []);
  const [showModal, setShowModal] = useState(false);
  const [editingAccomplishment, setEditingAccomplishment] = useState<any | null>(null);
  const [isAddingAccomplishment, setIsAddingAccomplishment] = useState(false);

  // Update accomplishments when data changes
  useEffect(() => {
    if (data.accomplishments) {
      setAccomplishments(data.accomplishments);
    }
  }, [data.accomplishments]);

  const handleSaveAccomplishment = async (accomplishmentData: any) => {
    try {
      setIsAddingAccomplishment(true);
      if (editingAccomplishment) {
        // Update existing accomplishment
        const response = await fetch('/api/candidates/accomplishments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accomplishmentId: editingAccomplishment.id,
            accomplishmentData
          })
        });

        if (response.ok) {
          setAccomplishments((prev: any[]) => prev.map(acc => 
            acc.id === editingAccomplishment.id ? { ...accomplishmentData, id: acc.id } : acc
          ));
          setShowModal(false);
          setEditingAccomplishment(null);
        } else {
          const errorData = await response.json();
          console.error('Failed to update accomplishment:', errorData);
        }
      } else {
        // Add new accomplishment
        const response = await fetch('/api/candidates/accomplishments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId,
            accomplishmentData
          })
        });

        if (response.ok) {
          const result = await response.json();
          setAccomplishments((prev: any[]) => [...prev, { ...accomplishmentData, id: result.data.id }]);
          setShowModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to add accomplishment:', errorData);
        }
      }
    } catch (error) {
      console.error('Error saving accomplishment:', error);
    } finally {
      setIsAddingAccomplishment(false);
    }
  };


  const handleDeleteAccomplishment = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/accomplishments?accomplishmentId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAccomplishments((prev: any[]) => prev.filter(acc => acc.id !== id));
      } else {
        console.error('Failed to delete accomplishment');
      }
    } catch (error) {
      console.error('Error deleting accomplishment:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ accomplishments });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Accomplishments</h2>
      
      <div className="space-y-4 mb-6">
        {accomplishments.map((accomplishment: any) => (
          <div key={accomplishment.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{accomplishment.title}</h3>
                <p className="text-sm text-gray-500 capitalize">{accomplishment.type}</p>
                {accomplishment.year && (
                  <p className="text-sm text-gray-500">{accomplishment.year}</p>
                )}
                {accomplishment.description && (
                  <p className="text-sm text-gray-600 mt-2">{accomplishment.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingAccomplishment(accomplishment);
                    setShowModal(true);
                  }}
                  className="text-[#114373] hover:text-[#0d3559]"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAccomplishment(accomplishment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setEditingAccomplishment(null);
          setShowModal(true);
        }}
        disabled={isAddingAccomplishment}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAddingAccomplishment ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#114373]"></div>
            Adding Accomplishment...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add Accomplishment
          </>
        )}
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <AccomplishmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAccomplishment(null);
        }}
        accomplishment={editingAccomplishment}
        onSave={handleSaveAccomplishment}
      />
    </div>
  );
}

function CertificationsStep({ data, candidateId, onComplete, isLoading }: any) {
  const [certifications, setCertifications] = useState<any[]>(data.certifications || []);
  const [showModal, setShowModal] = useState(false);
  const [editingCertification, setEditingCertification] = useState<any | null>(null);

  // Update certifications when data changes
  useEffect(() => {
    if (data.certifications) {
      setCertifications(data.certifications);
    }
  }, [data.certifications]);

  const handleSaveCertification = async (certificationData: any) => {
    try {
      if (editingCertification) {
        // Update existing certification
        const response = await fetch('/api/candidates/certifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certificationId: editingCertification.id,
            certificationData
          })
        });

        if (response.ok) {
          setCertifications(prev => prev.map(cert => 
            cert.id === editingCertification.id ? { ...certificationData, id: cert.id } : cert
          ));
          setShowModal(false);
          setEditingCertification(null);
        } else {
          const errorData = await response.json();
          console.error('Failed to update certification:', errorData);
        }
      } else {
        // Add new certification
        const response = await fetch('/api/candidates/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId,
            certificationData
          })
        });

        if (response.ok) {
          const result = await response.json();
          setCertifications(prev => [...prev, { ...certificationData, id: result.data.id }]);
          setShowModal(false);
        } else {
          const errorData = await response.json();
          console.error('Failed to add certification:', errorData);
        }
      }
    } catch (error) {
      console.error('Error saving certification:', error);
    }
  };


  const handleDeleteCertification = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/certifications?certificationId=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCertifications(prev => prev.filter(cert => cert.id !== id));
      } else {
        console.error('Failed to delete certification');
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ certifications });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications</h2>
      
      <div className="space-y-4 mb-6">
        {certifications.map((certification: any) => (
          <div key={certification.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Certification Name - Most prominent */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{certification.name}</h3>
                
                {/* Issuing Body */}
                {certification.issuing_body && (
                  <p className="text-[#114373] font-semibold text-base mb-2">{certification.issuing_body}</p>
                )}
                
                {/* Year of Completion */}
                {certification.year_of_completion && (
                  <p className="text-sm text-gray-600 mb-3">
                    Completed: {certification.year_of_completion}
                  </p>
                )}
                
                {/* Validity Period - Only show if it's a reasonable year */}
                {certification.validity && certification.validity !== '1950' && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Valid until:</span> {certification.validity}
                  </p>
                )}
                
                {/* Detailed Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Certification:</span>
                    <span className="text-gray-800">{certification.name}</span>
                  </div>
                  {certification.issuing_body && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Issuing Body:</span>
                      <span className="text-gray-800">{certification.issuing_body}</span>
                    </div>
                  )}
                  {certification.year_of_completion && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Year of Completion:</span>
                      <span className="text-gray-800">{certification.year_of_completion}</span>
                    </div>
                  )}
                  {certification.validity && certification.validity !== '1950' && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Validity Period:</span>
                      <span className="text-gray-800">{certification.validity}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingCertification(certification);
                    setShowModal(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Certification"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCertification(certification.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Certification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
        
      <button
        onClick={() => {
          setEditingCertification(null);
          setShowModal(true);
        }}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:border-[#114373] hover:text-[#114373] transition-colors"
      >
        + Add Certification
      </button>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <CertificationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCertification(null);
        }}
        certification={editingCertification}
        onSave={handleSaveCertification}
      />
    </div>
  );
}

function SkillsStep({ data, candidateId, onComplete, isLoading }: any) {
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update skills when API data changes
  useEffect(() => {
    if (data.skills) {
      setSkills(data.skills);
    }
  }, [data.skills]);

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      setErrors({ skill: 'Skill name is required' });
      return;
    }

    // Check if skill already exists
    if (skills.some(skill => skill.skill_name.toLowerCase() === newSkill.trim().toLowerCase())) {
      setErrors({ skill: 'Skill already exists' });
      return;
    }

    try {
      const response = await fetch('/api/candidates/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          skillName: newSkill.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSkills(prev => [...prev, { id: result.data.id, skill_name: newSkill.trim() }]);
        setNewSkill('');
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({ skill: errorData.error || 'Failed to add skill' });
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      setErrors({ skill: 'Failed to add skill' });
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    try {
      const response = await fetch(`/api/candidates/skills?skillId=${skillId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSkills(prev => prev.filter(skill => skill.id !== skillId));
      } else {
        console.error('Failed to remove skill');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (skills.length > 0) {
      onComplete({ skills });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Skills
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => {
                setNewSkill(e.target.value);
                if (errors.skill) setErrors({});
              }}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                errors.skill ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., JavaScript, React, Python"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-[#114373] text-white rounded-md hover:bg-[#0d3559]"
            >
              Add
            </button>
            </div>
          {errors.skill && <p className="text-red-500 text-sm mt-1">{errors.skill}</p>}
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Skills ({skills.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.id} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2">
                {skill.skill_name}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
            type="submit"
          disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function JobPreferencesStep({ data, candidateId, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    jobType: '',
    workMode: '',
    shiftTiming: '',
    relocationPreference: '',
    noticePeriod: '',
    industries: [] as string[],
    roles: [] as string[]
  });
  const [newIndustry, setNewIndustry] = useState('');
  const [newRole, setNewRole] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [industries, setIndustries] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [showIndustriesDropdown, setShowIndustriesDropdown] = useState(false);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [industriesSearchTerm, setIndustriesSearchTerm] = useState('');
  const [rolesSearchTerm, setRolesSearchTerm] = useState('');

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowIndustriesDropdown(false);
        setShowRolesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load industries and roles data
  useEffect(() => {
    const loadIndustriesAndRoles = async () => {
      try {
        // Load industries
        const industriesResponse = await fetch('/api/industries-designations');
        if (industriesResponse.ok) {
          const industriesData = await industriesResponse.json();
          const industriesList: string[] = industriesData.data
            .replace(/\r\n/g, '\n')
            .split('\n')
            .slice(1)
            .map((line: string) => {
              const [industry] = line.split(',');
              return industry?.trim().replace(/"/g, '');
            })
            .filter((item: string | undefined): item is string => Boolean(item));
          const uniqueIndustries: string[] = [...new Set(industriesList)];
          setIndustries(uniqueIndustries);
        }

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
        console.error('Error loading industries and roles:', error);
      }
    };

    loadIndustriesAndRoles();
  }, []);


  // Update form data when API data changes
  useEffect(() => {
    if (data.jobPreferences) {
      setFormData(prev => ({
        ...prev,
        jobType: data.jobPreferences.jobType || '',
        workMode: data.jobPreferences.workMode || '',
        shiftTiming: data.jobPreferences.shiftTiming || '',
        relocationPreference: data.jobPreferences.relocationPreference || (data.jobPreferences.travelFlexibility ? 'yes' : 'no'),
        noticePeriod: data.jobPreferences.noticePeriod || '',
        industries: data.jobPreferences.industries || [],
        roles: data.jobPreferences.roles || []
      }));
    }
  }, [data.jobPreferences]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddIndustry = () => {
    if (newIndustry.trim() && !formData.industries.includes(newIndustry.trim())) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, newIndustry.trim()]
      }));
      setNewIndustry('');
    }
  };

  const handleRemoveIndustry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      industries: prev.industries.filter((_, i) => i !== index)
    }));
  };

  const handleAddRole = () => {
    if (newRole.trim() && !formData.roles.includes(newRole.trim())) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, newRole.trim()]
      }));
      setNewRole('');
    }
  };

  const handleRemoveRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index)
    }));
  };

  // Filter industries and roles based on search term
  const filteredIndustries = industries.filter(industry =>
    industry.toLowerCase().includes(industriesSearchTerm.toLowerCase())
  ).slice(0, 10);

  const filteredRoles = roles.filter(role =>
    role.toLowerCase().includes(rolesSearchTerm.toLowerCase())
  ).slice(0, 10);

  const handleAddIndustryFromList = (industry: string) => {
    if (!formData.industries.includes(industry)) {
      setFormData(prev => ({
        ...prev,
        industries: [...prev.industries, industry]
      }));
    }
    setShowIndustriesDropdown(false);
    setIndustriesSearchTerm('');
  };

  const handleAddRoleFromList = (role: string) => {
    if (!formData.roles.includes(role)) {
      setFormData(prev => ({
        ...prev,
        roles: [...prev.roles, role]
      }));
    }
    setShowRolesDropdown(false);
    setRolesSearchTerm('');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.jobType) newErrors.jobType = 'Job Type is required';
    if (!formData.workMode) newErrors.workMode = 'Work Mode is required';
    if (!formData.shiftTiming) newErrors.shiftTiming = 'Shift Timing is required';
    if (!formData.relocationPreference) newErrors.relocationPreference = 'Relocation Preference is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Save job preferences
      const preferencesPayload = {
        candidateId,
        preferencesData: {
          jobType: formData.jobType,
          workMode: formData.workMode,
          shiftTiming: formData.shiftTiming,
          noticePeriod: formData.noticePeriod,
          relocationPreference: formData.relocationPreference,
          travelFlexibility: formData.relocationPreference === 'yes',
          industries: formData.industries,
          roles: formData.roles
        }
      };

      const response = await fetch('/api/candidates/job-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencesPayload)
      });

      const responseData = await response.json();

      if (response.ok) {
        onComplete({ jobPreferences: formData });
      } else {
        console.error('❌ ProfileWizard - Failed to save job preferences:', responseData);
        alert(`Failed to save job preferences: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ ProfileWizard - Error saving job preferences:', error);
      alert(`Error saving job preferences: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Preferences</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
              <select
                value={formData.jobType}
                onChange={(e) => handleChange('jobType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.jobType ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Job Type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="fixed-term">Fixed-term</option>
              </select>
              {errors.jobType && <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift Timing *</label>
              <select
                value={formData.shiftTiming}
                onChange={(e) => handleChange('shiftTiming', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.shiftTiming ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Shift Timing</option>
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="flexible">Flexible</option>
              </select>
              {errors.shiftTiming && <p className="text-red-500 text-sm mt-1">{errors.shiftTiming}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
              <select
                value={formData.noticePeriod}
                onChange={(e) => handleChange('noticePeriod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373]"
              >
                <option value="">Select Notice Period</option>
                <option value="Immediate">Immediate</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="Negotiable">Negotiable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Industries</label>
              <div className="space-y-2">
                {formData.industries.map((industry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                      {industry}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustry(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="relative">
                  <input
                    type="text"
                    value={industriesSearchTerm}
                    onChange={(e) => {
                      setIndustriesSearchTerm(e.target.value);
                      setShowIndustriesDropdown(true);
                    }}
                    onFocus={() => setShowIndustriesDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373]"
                    placeholder="Search industries..."
                  />
                  {showIndustriesDropdown && filteredIndustries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredIndustries.map((industry, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddIndustryFromList(industry)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-900 font-medium"
                        >
                          {industry}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Roles</label>
              <div className="space-y-2">
                {formData.roles.map((role, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                      {role}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="relative">
                  <input
                    type="text"
                    value={rolesSearchTerm}
                    onChange={(e) => {
                      setRolesSearchTerm(e.target.value);
                      setShowRolesDropdown(true);
                    }}
                    onFocus={() => setShowRolesDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373]"
                    placeholder="Search roles..."
                  />
                  {showRolesDropdown && filteredRoles.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredRoles.map((role, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddRoleFromList(role)}
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
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode *</label>
              <select
                value={formData.workMode}
                onChange={(e) => handleChange('workMode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.workMode ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Work Mode</option>
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {errors.workMode && <p className="text-red-500 text-sm mt-1">{errors.workMode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relocation Preference *</label>
              <select
                value={formData.relocationPreference}
                onChange={(e) => handleChange('relocationPreference', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.relocationPreference ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select Relocation Preference</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {errors.relocationPreference && <p className="text-red-500 text-sm mt-1">{errors.relocationPreference}</p>}
            </div>

          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ResumeStep({ data, candidateId, onComplete, isLoading }: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [existingResume, setExistingResume] = useState<any>(null);

  // Update existing resume data when API data changes
  useEffect(() => {
    if (data.resume) {
      setExistingResume(data.resume);
    }
  }, [data.resume]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: 'Please upload a PDF or Word document' });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors({ file: 'File size must be less than 10MB' });
        return;
      }

      setSelectedFile(file);
      setErrors({});
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrors({ file: 'Please select a file to upload' });
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('candidateId', candidateId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to server
      const response = await fetch('/api/candidates/upload-resume', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('success');
        setExistingResume(result.data);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('resume-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setUploadStatus('error');
      setErrors({ file: error instanceof Error ? error.message : 'Failed to upload resume. Please try again.' });
    }
  };

  const handleRemoveFile = async () => {
    try {
      const response = await fetch(`/api/candidates/resume?candidateId=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setExistingResume(null);
      } else {
        console.error('Failed to remove resume');
      }
    } catch (error) {
      console.error('Error removing resume:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingResume) {
      onComplete({ resume: existingResume });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {!existingResume ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="resume-file"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {selectedFile ? selectedFile.name : 'Choose file to upload'}
                </p>
                <p className="text-sm text-gray-500">
                  PDF or Word documents only (max 10MB)
                </p>
              </label>
        </div>
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}

            {selectedFile && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploadStatus === 'uploading'}
                    className="px-4 py-2 bg-[#114373] text-white rounded-md hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Resume'}
                  </button>
            </div>
                
                {uploadStatus === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#114373] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
          </div>
                )}

                {uploadStatus === 'success' && (
                  <p className="text-green-600 text-sm mt-2">✓ Resume uploaded successfully!</p>
                )}

                {uploadStatus === 'error' && (
                  <p className="text-red-600 text-sm mt-2">✗ Upload failed. Please try again.</p>
                )}
            </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Resume
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{existingResume.resumeFilename}</p>
                    <p className="text-sm text-gray-500">
                      {(existingResume.resumeSize / 1024 / 1024).toFixed(2)} MB
                    </p>
        </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={existingResume.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Supported formats: PDF, DOC, DOCX. Maximum file size: 10MB.
          </p>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
            type="submit"
            disabled={isLoading || !existingResume}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function OnlinePresenceStep({ data, candidateId, onComplete, isLoading }: any) {
  const [formData, setFormData] = useState({
    linkedin: '',
    github: '',
    portfolio: '',
    otherProfiles: [] as string[]
  });
  const [newProfile, setNewProfile] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update form data when API data changes
  useEffect(() => {
    if (data.onlinePresence) {
      setFormData({
        linkedin: data.onlinePresence.linkedin || '',
        github: data.onlinePresence.github || '',
        portfolio: data.onlinePresence.portfolio || '',
        otherProfiles: data.onlinePresence.otherProfiles || []
      });
    }
  }, [data.onlinePresence]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddProfile = () => {
    const trimmedProfile = newProfile.trim();
    if (!trimmedProfile) return;
    
    // Validate URL - allow https://, http://, or www.
    // More flexible validation that accepts various URL formats
    const trimmedLower = trimmedProfile.toLowerCase();
    // Accept if it starts with http://, https://, or www.
    // OR if it contains a dot (likely a domain)
    if (!trimmedLower.startsWith('http://') && 
        !trimmedLower.startsWith('https://') && 
        !trimmedLower.startsWith('www.') &&
        !trimmedLower.includes('.')) {
      setErrors({ otherProfiles: 'Please enter a valid URL (https://, http://, or www.)' });
      return;
    }
    
    if (!formData.otherProfiles.includes(trimmedProfile)) {
      setFormData(prev => ({
        ...prev,
        otherProfiles: [...prev.otherProfiles, trimmedProfile]
      }));
      setNewProfile('');
      setErrors(prev => ({ ...prev, otherProfiles: '' }));
    }
  };

  const handleRemoveProfile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      otherProfiles: prev.otherProfiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Validate URLs - allow https://, http://, or www.
    // More flexible validation that accepts various URL formats
    const validateUrl = (url: string) => {
      if (!url || !url.trim()) return true; // Empty is valid (optional fields)
      const trimmed = url.trim().toLowerCase();
      // Accept if it starts with http://, https://, or www.
      // OR if it contains a dot (likely a domain)
      return trimmed.startsWith('http://') || 
             trimmed.startsWith('https://') || 
             trimmed.startsWith('www.') ||
             trimmed.includes('.');
    };

    if (formData.linkedin && !validateUrl(formData.linkedin)) {
      newErrors.linkedin = 'Please enter a valid URL (https://, http://, or www.)';
    }
    if (formData.github && !validateUrl(formData.github)) {
      newErrors.github = 'Please enter a valid URL (https://, http://, or www.)';
    }
    if (formData.portfolio && !validateUrl(formData.portfolio)) {
      newErrors.portfolio = 'Please enter a valid URL (https://, http://, or www.)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const response = await fetch('/api/candidates/online-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          onlinePresenceData: formData
        })
      });

      if (response.ok) {
        onComplete({ onlinePresence: formData });
      } else {
        const errorData = await response.json();
        console.error('Failed to save online presence:', errorData);
      }
    } catch (error) {
      console.error('Error saving online presence:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Online Presence</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <input
            type="text"
            value={formData.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
              errors.linkedin ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://linkedin.com/in/yourprofile or www.linkedin.com/in/yourprofile"
          />
          {errors.linkedin && <p className="text-red-500 text-sm mt-1">{errors.linkedin}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile
          </label>
          <input
            type="text"
            value={formData.github}
            onChange={(e) => handleChange('github', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
              errors.github ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://github.com/yourusername or www.github.com/yourusername"
          />
          {errors.github && <p className="text-red-500 text-sm mt-1">{errors.github}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Website
          </label>
          <input
            type="text"
            value={formData.portfolio}
            onChange={(e) => handleChange('portfolio', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
              errors.portfolio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://yourportfolio.com or www.yourportfolio.com"
          />
          {errors.portfolio && <p className="text-red-500 text-sm mt-1">{errors.portfolio}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Profiles
          </label>
          <div className="space-y-2">
            {formData.otherProfiles.map((profile, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {profile}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveProfile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newProfile}
                onChange={(e) => {
                  setNewProfile(e.target.value);
                  if (errors.otherProfiles) setErrors(prev => ({ ...prev, otherProfiles: '' }));
                }}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#114373] ${
                  errors.otherProfiles ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/yourprofile or www.example.com/yourprofile"
              />
              <button
                type="button"
                onClick={handleAddProfile}
                className="px-4 py-2 bg-[#114373] text-white rounded-md hover:bg-[#0d3559]"
              >
                Add
              </button>
            </div>
            {errors.otherProfiles && <p className="text-red-500 text-sm mt-1">{errors.otherProfiles}</p>}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
          disabled={isLoading}
            className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function PhotoStep({ data, candidateId, onComplete, isLoading }: any) {
  const [photo, setPhoto] = useState<string | null>(data?.profile?.photo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateId', candidateId);

      const response = await fetch('/api/candidates/photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Do not advance to next step automatically; wait for explicit Save
        setPhoto(result.data.photoUrl);
      } else {
        setError(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const response = await fetch(`/api/candidates/photo?candidateId=${candidateId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Just update local state; do not advance automatically
        setPhoto(null);
      } else {
        setError(result.error || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      setError('Failed to remove photo');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Photo</h2>
      
      <div className="space-y-6">
        {/* Current Photo Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
              {photo ? (
                <img 
                  src={photo} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#114373] rounded-full flex items-center justify-center mb-2 mx-auto">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Upload Photo</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {photo ? 'Your profile photo' : 'Upload a professional profile photo'}
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="photo-upload"
                className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    {photo ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </label>
              
              {photo && (
                <button
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Photo Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a professional, clear photo</li>
            <li>• Face should be clearly visible</li>
            <li>• Good lighting and neutral background</li>
            <li>• File size: Maximum 5MB</li>
            <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => onComplete({ photoUrl: photo })}
          disabled={isLoading || isUploading}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ReviewStep({ data, onComplete, isLoading }: any) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // First, ensure the profile status is saved to database
      try {
        await fetch('/api/candidates/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData: { status: 'completed' } })
        });
      } catch (error) {
        console.error('Error updating profile status:', error);
      }
      
      // Small delay to ensure database update completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then call onComplete
      onComplete({ status: 'completed' });
    } catch (error) {
      console.error('Error completing profile:', error);
      setIsCompleting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Profile</h2>
      
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">Profile Complete!</h3>
          <p className="text-green-700 text-lg">
            Your profile has been successfully created. You can now view your complete profile and make updates as needed.
          </p>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <button
          onClick={handleComplete}
          disabled={isLoading || isCompleting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isCompleting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Preparing your profile...
            </>
          ) : isLoading ? (
            'Completing...'
          ) : (
            <>
              Review Profile
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
