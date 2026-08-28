'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CandidateLayout from '@/components/CandidateLayout';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  DollarSign,
  Calendar,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  Globe,
  Send,
  Shield,
  Eye,
  ChevronRight
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import { getProfileCompletionPercent, PROFILE_COMPLETION_THRESHOLD } from '@/utils/profileCompletion';

interface Job {
  id: string;
  title: string;
  companyName: string;
  industry: string;
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description?: string;
  requirements?: string[];
  benefits?: string[];
  type?: string;
}

interface CandidateProfile {
  id: string;
  firstName: string;
  middleName?: string;
  surname: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  whatsapp?: string;
  gender?: string;
  experienceYears?: number;
  experienceMonths?: number;
  experienceType?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeFilename?: string;
  education?: any[];
  experience?: any[];
  projects?: any[];
  certifications?: any[];
  languages?: any[];
  resumeHeadline?: string;
  profileSummary?: string;
  currentLocation?: any;
  nationality?: string;
}

type Step = 'overview' | 'profile' | 'confirm' | 'success';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('overview');
  const [job, setJob] = useState<Job | null>(null);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [error, setError] = useState('');
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [apiCompletionPercent, setApiCompletionPercent] = useState<number | null>(null);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);

  useEffect(() => {
    if (jobId) {
      checkAuthAndLoadData();
    }
  }, [jobId]);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push(`/candidate/register?from=/candidate/apply/${jobId}&apply=true`);
        return;
      }

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
        router.push(`/candidate/login?from=/candidate/apply/${jobId}&apply=true`);
        return;
      }

      await Promise.all([
        fetchJob(),
        fetchCandidateProfile(candidateId)
      ]);

      // Keep the local percentage for display only. The submit API is the source of truth
      // and returns exact missing requirements when an application cannot proceed.
      const completionPercent = getProfileCompletionPercent();
      if (completionPercent < PROFILE_COMPLETION_THRESHOLD) {
        setApiCompletionPercent(completionPercent);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push(`/candidate/login?from=/candidate/apply/${jobId}&apply=true`);
    } finally {
      setLoading(false);
    }
  };

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const data = await response.json();
      
      if (data.success && data.job) {
        setJob(data.job);
        if (data.job.salary) {
          setExpectedSalary(`${data.job.salary.min} - ${data.job.salary.max}`);
        }
      } else {
        setError('Job not found');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
    }
  };

  const fetchCandidateProfile = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/candidates/profile?candidateId=${candidateId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const profile = data.data;
        const candidateData = {
          id: candidateId,
          firstName: profile.candidate?.firstName || profile.candidate?.first_name || '',
          middleName: profile.candidate?.middleName || profile.candidate?.middle_name || '',
          surname: profile.candidate?.surname || '',
          email: profile.candidate?.email || '',
          phone: profile.candidate?.phone || '',
          alternatePhone: profile.candidate?.alternatePhone || '',
          whatsapp: profile.candidate?.whatsapp || '',
          gender: profile.candidate?.gender || '',
          experienceYears: profile.profile?.total_experience_years || profile.profile?.years_of_experience || 0,
          experienceMonths: profile.profile?.total_experience_months || 0,
          experienceType: profile.profile?.experience_type || '',
          skills: profile.skills?.map((s: any) => s.name || s.skill_name || s.skill) || [],
          resumeUrl: profile.resume?.resumeUrl || profile.resume?.resume_url || profile.profile?.resume_url || '',
          resumeFilename: profile.resume?.resumeFilename || profile.resume?.resume_filename || '',
          education: profile.education || [],
          experience: profile.experience || [],
          projects: profile.projects || [],
          certifications: profile.certifications || [],
          languages: profile.languages || [],
          resumeHeadline: profile.profile?.resume_headline || '',
          profileSummary: profile.profile?.profile_summary || '',
          currentLocation: profile.profile?.current_location || null,
          nationality: profile.profile?.nationality || ''
        };
        
        setCandidate(candidateData);
        
        // Set resume URL from database - the API returns resumeUrl in camelCase
        if (candidateData.resumeUrl) {
          setResumeUrl(candidateData.resumeUrl);
          console.log('✅ Resume loaded from candidate_resume table:', {
            url: candidateData.resumeUrl,
            filename: candidateData.resumeFilename,
            candidateId: candidateId
          });
        } else {
          console.log('⚠️ No resume found in candidate_resume table for candidate:', candidateId);
        }
      }
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
    }
  };

  const handleResumeUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const candidateId = candidate?.id;
      if (!candidateId) throw new Error('Candidate ID not found');

      formData.append('candidateId', candidateId);

      const response = await fetch('/api/candidates/upload-resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success && data.data?.resumeUrl) {
        return data.data.resumeUrl;
      } else {
        throw new Error(data.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      setResumeFile(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!candidate || !job) {
      setError('Missing required information');
      return;
    }

    let finalResumeUrl = resumeUrl;
    if (resumeFile) {
      try {
        finalResumeUrl = await handleResumeUpload(resumeFile);
        setResumeUrl(finalResumeUrl);
        setResumeFile(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to upload resume');
        return;
      }
    }

    if (!finalResumeUrl && !resumeFile) {
      setError('Please upload a resume or CV, or use the one from your profile');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          jobId: jobId,
          experienceYears: candidate.experienceYears || 0,
          skills: candidate.skills || [],
          expectedSalary: expectedSalary ? parseFloat(expectedSalary.replace(/[^0-9.]/g, '')) : null,
          noticePeriod: noticePeriod || null,
          coverLetter: null,
          resumeUrl: finalResumeUrl,
          portfolioUrl: null,
          linkedinUrl: null,
          githubUrl: null,
          source: 'direct'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep('success');
      } else {
        if (response.status === 403 && data.completionPercentage !== undefined) {
          // Profile incomplete - show modal with API-provided percentage
          setApiCompletionPercent(data.completionPercentage);
          setMissingRequirements(data.missingRequirements || data.rejectionReasons || []);
          setShowProfileIncompleteModal(true);
          setError('');
        } else if (data.error?.includes('already exists')) {
          setError('You have already applied for this job');
        } else {
          const reasons = data.rejectionReasons?.length ? ` ${data.rejectionReasons.join(' ')}` : '';
          setError(`${data.error || 'Failed to submit application'}${reasons}`);
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 'overview', label: 'Job Overview', icon: Briefcase },
    { id: 'profile', label: 'Your Profile', icon: User },
    { id: 'confirm', label: 'Confirm & Send', icon: Send }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (loading) {
    return (
      <CandidateLayout>
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
          <LoadingState message="Loading application form..." />
        </div>
      </CandidateLayout>
    );
  }

  if (!job || !candidate) {
    return (
      <CandidateLayout>
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Application</h2>
            <p className="text-gray-600 mb-6">{error || 'Please try again later'}</p>
            <button
              onClick={() => router.push('/job-search')}
              className="bg-[#114373] text-white px-6 py-3 rounded-xl hover:bg-[#0d3559] transition-colors"
            >
              Back to Job Search
            </button>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (currentStep === 'success') {
    return (
      <CandidateLayout>
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-12 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted Successfully!</h2>
            <p className="text-lg text-gray-700 mb-2">Your profile has been sent to Axia HR for this position.</p>
            <p className="text-gray-600 mb-8">We'll review your application and get back to you soon.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/candidate/applications')}
                className="bg-[#114373] text-white px-8 py-3 rounded-xl hover:bg-[#0d3559] transition-colors font-semibold flex items-center gap-2"
              >
                View My Applications
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/job-search')}
                className="bg-white text-[#114373] border-2 border-[#114373] px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Browse More Jobs
              </button>
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      {/* Profile Incomplete Modal */}
      {showProfileIncompleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile First</h2>
              <p className="text-gray-600">
                Your profile is <span className="font-semibold text-[#114373]">{apiCompletionPercent !== null ? apiCompletionPercent : getProfileCompletionPercent()}%</span> complete.
              </p>
              <p className="text-gray-600 mt-2">
                You need at least <span className="font-semibold">{PROFILE_COMPLETION_THRESHOLD}%</span> completion to apply for jobs.
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Profile Completion</span>
                <span className="font-semibold">{apiCompletionPercent !== null ? apiCompletionPercent : getProfileCompletionPercent()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#114373] to-[#1e5a8a] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${apiCompletionPercent !== null ? apiCompletionPercent : getProfileCompletionPercent()}%` }}
                />
              </div>
            </div>

            {missingRequirements.length > 0 && (
              <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left">
                <p className="text-sm font-semibold text-yellow-900 mb-2">What to fix</p>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {missingRequirements.map((item, index) => (
                    <li key={index}>- {item}</li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-700 mt-3">
                  Profile photo, house number, landmark, postal code, and administrative numbers are optional.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowProfileIncompleteModal(false);
                  router.push('/candidate/profile');
                }}
                className="w-full bg-gradient-to-r from-[#114373] to-[#1e5a8a] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#0d3559] hover:to-[#114373] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                Complete My Profile
              </button>
              <button
                onClick={() => {
                  setShowProfileIncompleteModal(false);
                  router.back();
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStepIndex === index;
              const isCompleted = currentStepIndex > index;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-[#114373] text-white shadow-lg scale-110' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isActive ? 'text-[#114373]' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Step 1: Job Overview */}
          {currentStep === 'overview' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#114373]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Job Overview</h2>
                  <p className="text-gray-600">Review the position details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#114373]" />
                      <span className="font-semibold">{job.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#114373]" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#114373]" />
                      <span>{job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}</span>
                    </div>
                    {job.type && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#114373]" />
                        <span className="capitalize">{job.type.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {job.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                    <p className="text-gray-700 leading-relaxed">{job.description.substring(0, 300)}...</p>
                  </div>
                )}

                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Key Requirements</h4>
                    <ul className="space-y-1">
                      {job.requirements.slice(0, 5).map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <ChevronRight className="w-4 h-4 text-[#114373] mt-1 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep('profile')}
                  className="bg-[#114373] text-white px-8 py-3 rounded-xl hover:bg-[#0d3559] transition-colors font-semibold flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Your Profile */}
          {currentStep === 'profile' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
                  <p className="text-gray-600">Review the information that will be sent</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#114373]" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Full Name</label>
                      <p className="font-medium text-gray-900">{`${candidate.firstName}${candidate.middleName ? ' ' + candidate.middleName : ''} ${candidate.surname}`.trim()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium text-gray-900">{candidate.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Phone</label>
                      <p className="font-medium text-gray-900">{candidate.phone}</p>
                    </div>
                    {(candidate.experienceYears || 0) > 0 && (
                      <div>
                        <label className="text-sm text-gray-600">Experience</label>
                        <p className="font-medium text-gray-900">
                          {candidate.experienceYears} year{(candidate.experienceYears || 0) > 1 ? 's' : ''}
                          {candidate.experienceMonths ? ` ${candidate.experienceMonths} month${candidate.experienceMonths > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume Headline & Summary */}
                {(candidate.resumeHeadline || candidate.profileSummary) && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#114373]" />
                      Professional Summary
                    </h3>
                    {candidate.resumeHeadline && (
                      <div className="mb-3">
                        <label className="text-sm text-gray-600">Resume Headline</label>
                        <p className="font-medium text-gray-900">{candidate.resumeHeadline}</p>
                      </div>
                    )}
                    {candidate.profileSummary && (
                      <div>
                        <label className="text-sm text-gray-600">Profile Summary</label>
                        <p className="text-gray-700 leading-relaxed">{candidate.profileSummary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#114373]" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {candidate.experience && candidate.experience.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#114373]" />
                      Work Experience
                    </h3>
                    <div className="space-y-3">
                      {candidate.experience.slice(0, 3).map((exp: any, index: number) => (
                        <div key={index} className="border-l-4 border-[#114373] pl-4">
                          <div className="font-semibold text-gray-900">{exp.job_title || exp.designation}</div>
                          <div className="text-sm text-gray-600">{exp.company_name}</div>
                          <div className="text-xs text-gray-500">
                            {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : ''} - {exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString() : '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {candidate.education && candidate.education.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#114373]" />
                      Education
                    </h3>
                    <div className="space-y-3">
                      {candidate.education.slice(0, 3).map((edu: any, index: number) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4">
                          <div className="font-semibold text-gray-900">{edu.degree || edu.qualification}</div>
                          <div className="text-sm text-gray-600">{edu.institution || edu.school}</div>
                          {edu.field_of_study && <div className="text-xs text-gray-500">{edu.field_of_study}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#114373]" />
                    Resume/CV
                  </h3>
                  {resumeUrl ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {candidate.resumeFilename || 'Resume from your profile'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">This resume will be sent to Axia HR</p>
                      </div>
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Resume
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                        <input
                          type="file"
                          id="resume-upload"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 mb-1">
                            {resumeFile ? resumeFile.name : 'Upload your resume/CV'}
                          </span>
                          <span className="text-xs text-gray-500">PDF or Word document (Max 5MB)</span>
                        </label>
                      </div>
                      {resumeFile && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                          <span className="text-sm text-gray-700">{resumeFile.name}</span>
                          <button
                            onClick={() => setResumeFile(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 text-center">
                        No resume found in your profile. Please upload one to continue.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep('overview')}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep('confirm')}
                  className="bg-[#114373] text-white px-8 py-3 rounded-xl hover:bg-[#0d3559] transition-colors font-semibold flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Send to Axia */}
          {currentStep === 'confirm' && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Confirm & Send to Axia</h2>
                  <p className="text-gray-600">Review and confirm your application</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Axia Information Card */}
                <div className="bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <img src="/logo11.png" alt="Axia HR" className="w-12 h-12 object-contain" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Axia HR Advisory</h3>
                      <p className="text-white/80">HR Solutions | Advisory | Management</p>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed mb-4">
                    Your profile and application will be sent to Axia HR Advisory for review. 
                    Our team will carefully evaluate your qualifications and match them with this position.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Secure & Confidential</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Professional Review</span>
                    </div>
                  </div>
                </div>

                {/* Application Summary */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Application Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium text-gray-900">{job.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Industry:</span>
                      <span className="font-medium text-gray-900">{job.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Name:</span>
                      <span className="font-medium text-gray-900">{`${candidate.firstName} ${candidate.surname}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resume:</span>
                      <span className="font-medium text-gray-900">
                        {resumeUrl ? (candidate.resumeFilename || 'From Profile') : (resumeFile ? resumeFile.name : 'Not provided')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    What Happens Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Axia HR will receive your complete profile and application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Our team will review your qualifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>You'll be notified about the status of your application</span>
                    </li>
                  </ul>
                </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Salary (Optional)
                    </label>
                    <input
                      type="text"
                      value={expectedSalary}
                      onChange={(e) => setExpectedSalary(e.target.value)}
                      placeholder="e.g., 500000 - 800000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice Period (Optional)
                    </label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    >
                      <option value="">Select notice period</option>
                      <option value="immediate">Immediate</option>
                      <option value="1 week">1 Week</option>
                      <option value="2 weeks">2 Weeks</option>
                      <option value="1 month">1 Month</option>
                      <option value="2 months">2 Months</option>
                      <option value="3 months">3 Months</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep('profile')}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#114373] to-[#0d3559] text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send My Application to Axia
                    </>
                  )}
                </button>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}
