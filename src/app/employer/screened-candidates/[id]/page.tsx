'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EmployerLayout from '@/components/EmployerLayout';
import LoadingState from '@/components/LoadingState';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Upload,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  ExternalLink,
  UserCheck,
  UserX,
  Shield,
  Code,
  Trophy,
  DollarSign,
  Target,
  Building2,
  Star,
  User,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Phone,
  Eye,
  Download
} from 'lucide-react';

interface Candidate {
  id: string;
  firstName: string;
  middleName?: string;
  surname: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  whatsapp?: string;
  gender: string;
  status: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  location: string;
  currentLocation: {
    city: string;
    state: string;
    country: string;
  };
  permanentLocation: {
    city: string;
    state: string;
    country: string;
  };
  currentAddress?: {
    houseNo?: string;
    streetName?: string;
    landmark?: string;
    postalCode?: string;
  };
  permanentAddress?: {
    houseNo?: string;
    streetName?: string;
    landmark?: string;
    postalCode?: string;
  };
  nationality: string;
  origin?: string;
  maritalStatus?: string;
  dateOfBirth: string | null;
  profilePicture: string | null;
  resumeHeadline: string;
  profileSummary: string;
  experienceType: string;
  totalExperienceYears: number;
  totalExperienceMonths: number;
  isOpenForRelocation: boolean;
  preferredLocations: string[];
  skills: Array<{
    name?: string;
    skill_name?: string;
    proficiency?: string;
  }>;
  experiences: any[];
  education: any[];
  languages: any[];
  salary: any;
  references: any[];
  projects: any[];
  accomplishments: any[];
  certifications: any[];
  onlinePresence: any;
  jobPreferences: any;
  resume: any;
}

interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  coverLetter: string;
  resumeUrl: string;
  expectedSalary: string;
  noticePeriod: string;
  appliedDate: string;
  jobTitle: string;
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

export default function EmployerCandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const candidateId = searchParams.get('candidateId');
  const jobId = searchParams.get('jobId');

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'reject' | 'select' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewType, setInterviewType] = useState<'online' | 'in_person'>('online');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewLink, setInterviewLink] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null);
  const [offerLetterData, setOfferLetterData] = useState({
    offerAmount: '',
    startDate: '',
    positionTitle: '',
    expiryDate: ''
  });
  const [uploadingOffer, setUploadingOffer] = useState(false);
  const [existingInterviews, setExistingInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (candidateId && applicationId) {
      fetchData();
    }
  }, [candidateId, applicationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidate profile
      const candidateResponse = await fetch(`/api/candidates/profile?candidateId=${candidateId}`);
      const candidateData = await candidateResponse.json();
      
      if (candidateData.success && candidateData.data) {
        const profile = candidateData.data.profile || {};
        const candidateInfo = candidateData.data.candidate || {};
        
        setCandidate({
          id: candidateInfo.id?.toString() || '',
          firstName: candidateInfo.firstName || '',
          middleName: candidateInfo.middleName || '',
          surname: candidateInfo.surname || '',
          email: candidateInfo.email || '',
          phone: candidateInfo.phone || '',
          alternatePhone: candidateInfo.alternatePhone || '',
          whatsapp: candidateInfo.whatsapp || '',
          gender: candidateInfo.gender || '',
          status: candidateInfo.status || 'active',
          emailVerified: candidateInfo.emailVerified || false,
          profileCompleted: candidateInfo.profileCompleted || false,
          location: profile.current_location ? 
            `${profile.current_location.city || ''}, ${profile.current_location.state || ''}, ${profile.current_location.country || ''}`.replace(/^,\s*|,\s*$/g, '') : 'N/A',
          currentLocation: profile.current_location || { city: '', state: '', country: '' },
          permanentLocation: profile.permanent_location || { city: '', state: '', country: '' },
          currentAddress: profile.current_address || undefined,
          permanentAddress: profile.permanent_address || undefined,
          nationality: profile.nationality || '',
          origin: profile.origin || '',
          maritalStatus: profile.marital_status || '',
          dateOfBirth: profile.date_of_birth || null,
          profilePicture: profile.photo_url || profile.profile_picture || null,
          resumeHeadline: profile.resume_headline || '',
          profileSummary: profile.profile_summary || '',
          experienceType: profile.experience_type || 'fresher',
          totalExperienceYears: profile.total_experience_years || 0,
          totalExperienceMonths: profile.total_experience_months || 0,
          isOpenForRelocation: profile.isOpenForRelocation === 'yes' || profile.is_open_for_relocation === 'yes',
          preferredLocations: profile.preferredLocations || profile.preferred_locations || [],
          skills: candidateData.data.skills || [],
          experiences: candidateData.data.experience || [],
          education: candidateData.data.education || [],
          languages: candidateData.data.languages || [],
          salary: candidateData.data.salary || null,
          references: candidateData.data.references || [],
          projects: candidateData.data.projects || [],
          accomplishments: candidateData.data.accomplishments || [],
          certifications: candidateData.data.certifications || [],
          onlinePresence: candidateData.data.onlinePresence || {},
          jobPreferences: candidateData.data.jobPreferences || {},
          resume: candidateData.data.resume || null
        });
      }

      // Fetch application details
      const appResponse = await fetch(`/api/applications?candidateId=${candidateId}&jobId=${jobId}`);
      const appData = await appResponse.json();
      
      if (appData.success && appData.applications) {
        const app = appData.applications.find((a: any) => a.id.toString() === applicationId);
        if (app) {
          setApplication({
            id: app.id.toString(),
            candidateId: app.candidate_id?.toString() || '',
            jobId: app.job_id?.toString() || '',
            status: app.status || 'pending',
            coverLetter: app.cover_letter || '',
            resumeUrl: app.resume_url || '',
            expectedSalary: app.expected_salary || '',
            noticePeriod: app.notice_period || '',
            appliedDate: app.applied_date || app.created_at || '',
            jobTitle: app.job_title || ''
          });
        }
      }

      // Fetch evaluation
      const evalResponse = await fetch(`/api/evaluations?applicationId=${applicationId}`);
      const evalData = await evalResponse.json();
      if (evalData.success && evalData.data && evalData.data.length > 0) {
        setEvaluation(evalData.data[0]);
      }

      // Fetch interviews for this application
      const token = localStorage.getItem('employerAuthToken');
      if (token) {
        try {
          const interviewsResponse = await fetch(`/api/employers/interviews?applicationId=${applicationId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const interviewsData = await interviewsResponse.json();
          if (interviewsData.success && interviewsData.interviews) {
            setExistingInterviews(interviewsData.interviews);
          }
        } catch (interviewError) {
          console.error('Error fetching interviews:', interviewError);
          // Don't fail the whole fetch if interviews fail
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCandidateAction = async (action: 'interview_again' | 'reject' | 'select', notes?: string, interviewData?: any) => {
    if (!application) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/employer/candidate-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id,
          action,
          notes: notes || actionNotes,
          interviewData
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Candidate ${action === 'interview_again' ? 'interview scheduled' : action === 'select' ? 'selected' : 'rejected'} successfully!`);
        setShowSuccessModal(true);
        setShowInterviewModal(false);
        setShowConfirmModal(false);
        setActionNotes('');
        setInterviewDate('');
        setInterviewTime('');
        setInterviewLocation('');
        setInterviewLink('');
        // Update application status immediately if selected
        if (action === 'select' && application) {
          setApplication({ ...application, status: 'selected' });
        }
        // Refresh data to get updated status
        await fetchData();
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (action === 'select') {
            // Force re-render by updating state again
            fetchData();
          }
        }, 100);
      } else {
        setErrorMessage(data.error || `Failed to ${action} candidate`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error processing candidate action:', error);
      setErrorMessage(`Failed to ${action} candidate. Please try again.`);
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfferLetterSubmit = async () => {
    if (!application || !offerLetterFile) {
      setErrorMessage('Please upload an offer letter file');
      setShowErrorModal(true);
      return;
    }

    if (!offerLetterData.offerAmount || !offerLetterData.startDate || !offerLetterData.positionTitle) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    setUploadingOffer(true);
    try {
      const token = localStorage.getItem('employerAuthToken');
      if (!token) {
        setErrorMessage('Please login to continue');
        setShowErrorModal(true);
        router.push('/employer/login');
        return;
      }

      // First upload the file
      const formData = new FormData();
      formData.append('file', offerLetterFile);
      formData.append('applicationId', application.id);

      const uploadResponse = await fetch('/api/employers/offer-letters/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload offer letter file');
      }

      // Get employer ID from token (decode it)
      let employerId: string | null = null;
      try {
        // Get employer ID from profile API
        const profileResponse = await fetch('/api/employers/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.data && profileData.data.id) {
          employerId = profileData.data.id.toString();
        }
      } catch (profileError) {
        console.error('Error fetching employer profile:', profileError);
        // Try to get from token directly
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            employerId = payload.sub?.toString() || null;
          }
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
        }
      }

      if (!employerId) {
        throw new Error('Failed to get employer information. Please try again.');
      }

      // Create offer letter record
      const offerResponse = await fetch('/api/offer-letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id,
          employerId: employerId,
          offerFileUrl: uploadData.data.offerFileUrl,
          offerAmount: offerLetterData.offerAmount,
          startDate: offerLetterData.startDate,
          positionTitle: offerLetterData.positionTitle,
          expiryDate: offerLetterData.expiryDate || null
        })
      });

      const offerData = await offerResponse.json();

      if (!offerResponse.ok || !offerData.success) {
        // Use the message field if available, otherwise use error field
        const errorMessage = offerData.message || offerData.error || 'Failed to create offer letter';
        throw new Error(errorMessage);
      }

      setSuccessMessage('Offer letter uploaded and sent to candidate successfully!');
      setShowSuccessModal(true);
      setShowOfferLetterModal(false);
      setOfferLetterFile(null);
      setOfferLetterData({
        offerAmount: '',
        startDate: '',
        positionTitle: '',
        expiryDate: ''
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error submitting offer letter:', error);
      // Show more detailed error message
      let errorMsg = error.message || 'Failed to submit offer letter. Please try again.';
      
      // If it's a duplicate offer error, make sure the message is clear
      if (errorMsg.includes('already been sent') || errorMsg.includes('cannot send')) {
        // Message already includes contact info, use as is
      } else if (errorMsg.includes('active offer')) {
        errorMsg = 'An active offer letter already exists for this candidate. You cannot send another offer letter until the candidate responds. If the candidate has not responded, please contact Axia Admin for assistance.';
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      // Also close the offer letter modal if it's open
      setShowOfferLetterModal(false);
    } finally {
      setUploadingOffer(false);
    }
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingState message="Loading candidate profile..." size="lg" />
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (!candidate || !application) {
    return (
      <EmployerLayout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
            <p className="text-gray-600 mb-6">The candidate profile you're looking for doesn't exist.</p>
            <Link
              href="/employer/screened-candidates"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Screened Candidates
            </Link>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  const fullName = `${candidate.firstName} ${candidate.middleName || ''} ${candidate.surname}`.trim();
  const initials = `${candidate.firstName[0] || ''}${candidate.surname[0] || ''}`.toUpperCase();

  return (
    <EmployerLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/employer/screened-candidates"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Candidate Profile</h1>
              <p className="text-base sm:text-lg text-gray-600 mt-1">{application.jobTitle}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Candidate Actions</h2>
              <p className="text-sm text-gray-600">Take action on this candidate</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInterviewModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                disabled={actionLoading}
              >
                <Calendar className="w-5 h-5" />
                {existingInterviews.length > 0 ? 'Interview Again' : 'Interview'}
              </button>
              <button
                onClick={() => {
                  setSelectedAction('reject');
                  setShowConfirmModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                disabled={actionLoading}
              >
                <UserX className="w-5 h-5" />
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedAction('select');
                  setShowConfirmModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                disabled={actionLoading}
              >
                <CheckCircle className="w-5 h-5" />
                Select
              </button>
              <button
                onClick={() => {
                  // Check current application status
                  const currentStatus = application?.status;
                  if (currentStatus !== 'selected') {
                    setErrorMessage('Please select the candidate first before sending an offer letter. Click the "Select" button above.');
                    setShowErrorModal(true);
                    return;
                  }
                  setShowOfferLetterModal(true);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                  application?.status === 'selected'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                }`}
                disabled={actionLoading || uploadingOffer || application?.status !== 'selected'}
                title={application?.status !== 'selected' ? 'Please select the candidate first' : 'Send offer letter to candidate'}
              >
                <FileText className="w-5 h-5" />
                Send Offer Letter
              </button>
            </div>
          </div>
        </div>

        {/* Candidate Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {candidate.profilePicture ? (
                <img
                  src={candidate.profilePicture}
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center border-4 border-gray-200">
                  <span className="text-2xl font-semibold text-white">{initials}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{fullName}</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                      {candidate.status}
                    </span>
                    {candidate.emailVerified && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Email Verified
                      </span>
                    )}
                  </div>
                  {candidate.resumeHeadline && (
                    <p className="text-lg text-gray-700 mb-3">{candidate.resumeHeadline}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Contact through Axia</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{candidate.nationality || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Summary */}
        {evaluation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Evaluation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Overall Score</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{evaluation.overall_score || evaluation.overallScore || 'N/A'}/10</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Recommendation</span>
                </div>
                <p className="text-lg font-semibold text-green-900 capitalize">
                  {(evaluation.recommendation || '').replace('_', ' ')}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Status</span>
                </div>
                <p className="text-lg font-semibold text-purple-900 capitalize">
                  {application.status}
                </p>
              </div>
            </div>
            {evaluation.strengths && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Strengths</h4>
                <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  {evaluation.strengths}
                </p>
              </div>
            )}
            {evaluation.weaknesses && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Areas for Improvement</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  {evaluation.weaknesses}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Personal Information - Hidden contact details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{fullName}</p>
            </div>
            {candidate.gender && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Gender</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{candidate.gender}</p>
              </div>
            )}
            {candidate.dateOfBirth && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(candidate.dateOfBirth)}</p>
              </div>
            )}
            {candidate.maritalStatus && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Marital Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{candidate.maritalStatus}</p>
              </div>
            )}
            {candidate.nationality && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Nationality</p>
                <p className="text-sm font-medium text-gray-900">{candidate.nationality}</p>
              </div>
            )}
            {candidate.origin && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Origin</p>
                <p className="text-sm font-medium text-gray-900">{candidate.origin}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        {(candidate.currentLocation.city || candidate.currentLocation.country || candidate.permanentLocation.city || candidate.permanentLocation.country) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Location Information</h3>
            {(candidate.currentLocation.city || candidate.currentLocation.state || candidate.currentLocation.country) && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {candidate.currentLocation.city && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">City</p>
                      <p className="text-sm font-medium text-gray-900">{candidate.currentLocation.city}</p>
                    </div>
                  )}
                  {candidate.currentLocation.state && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">State</p>
                      <p className="text-sm font-medium text-gray-900">{candidate.currentLocation.state}</p>
                    </div>
                  )}
                  {candidate.currentLocation.country && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Country</p>
                      <p className="text-sm font-medium text-gray-900">{candidate.currentLocation.country}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {candidate.isOpenForRelocation && (
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <MapPin className="w-4 h-4 mr-1" />
                  Open for Relocation
                </span>
              </div>
            )}
          </div>
        )}

        {/* Professional Summary */}
        {candidate.profileSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Summary</h3>
            <p className="text-gray-700 leading-relaxed">{candidate.profileSummary}</p>
          </div>
        )}

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill.name || skill.skill_name || ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {candidate.experiences && candidate.experiences.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Work Experience</h3>
            <div className="space-y-6">
              {candidate.experiences.map((exp: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-lg font-semibold text-gray-900">{exp.job_title || exp.jobTitle || 'N/A'}</h4>
                  <p className="text-base text-gray-700 font-medium">{exp.company_name || exp.companyName || 'N/A'}</p>
                  {exp.company_description && (
                    <p className="text-sm text-gray-600 mt-1">{exp.company_description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {exp.start_date && (
                      <span>
                        {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                      </span>
                    )}
                    {exp.industry && (
                      <span className="capitalize">{exp.industry}</span>
                    )}
                  </div>
                  {exp.key_achievements && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Key Achievements:</p>
                      <p className="text-sm text-gray-600">{exp.key_achievements}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {candidate.education && candidate.education.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Education</h3>
            <div className="space-y-6">
              {candidate.education.map((edu: any, index: number) => {
                const degree = edu.degree || edu.degree_name || edu.qualification || edu.category;
                const institution = edu.institution || edu.institution_name || edu.institute || edu.university;
                
                // Only show if we have at least degree or institution
                if (!degree && !institution) return null;
                
                return (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    {degree && (
                      <h4 className="text-lg font-semibold text-gray-900">{formatEducation(degree)}</h4>
                    )}
                    {institution && (
                      <p className="text-base text-gray-700 font-medium">{institution}</p>
                    )}
                    {(edu.field_of_study || edu.specialization) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {edu.field_of_study || edu.specialization}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {edu.start_date && (
                        <span>
                          {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                        </span>
                      )}
                      {edu.country && (
                        <span>{edu.country}</span>
                      )}
                    </div>
                    {edu.description && (
                      <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Languages */}
        {candidate.languages && candidate.languages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Languages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.languages.map((lang: any, index: number) => {
                const languageName = lang.language || lang.language_name;
                const proficiency = lang.proficiency || lang.proficiency_level;
                
                // Only show if we have at least language name
                if (!languageName) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{languageName}</span>
                    {proficiency && (
                      <span className="text-sm text-gray-600 capitalize">{proficiency}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects */}
        {candidate.projects && candidate.projects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Projects</h3>
            <div className="space-y-6">
              {candidate.projects.map((project: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-lg font-semibold text-gray-900">{project.title || project.project_title || 'N/A'}</h4>
                  {project.client && (
                    <p className="text-base text-gray-700 font-medium">Client: {project.client}</p>
                  )}
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                  )}
                  {project.tools_technologies && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Tools & Technologies:</p>
                      <p className="text-sm text-gray-600">{project.tools_technologies}</p>
                    </div>
                  )}
                  {project.start_date && (
                    <div className="mt-2 text-sm text-gray-500">
                      {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                    </div>
                  )}
                  {project.project_url && (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {candidate.certifications && candidate.certifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Certifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.certifications.map((cert: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900">{cert.name || cert.certification_name || 'N/A'}</h4>
                  {cert.issuing_body && (
                    <p className="text-sm text-gray-600 mt-1">{cert.issuing_body}</p>
                  )}
                  {cert.year_of_completion && (
                    <p className="text-xs text-gray-500 mt-1">Completed: {cert.year_of_completion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accomplishments */}
        {candidate.accomplishments && candidate.accomplishments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Accomplishments</h3>
            <div className="space-y-4">
              {candidate.accomplishments.map((acc: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-base font-semibold text-gray-900">{acc.title || acc.accomplishment_title || 'N/A'}</h4>
                  {acc.type && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mt-1">
                      {acc.type}
                    </span>
                  )}
                  {acc.description && (
                    <p className="text-sm text-gray-600 mt-2">{acc.description}</p>
                  )}
                  {acc.year && (
                    <p className="text-xs text-gray-500 mt-1">Year: {acc.year}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume/CV Section */}
        {(application?.resumeUrl || candidate?.resume?.resume_url) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#114373]" />
              Resume / CV
            </h3>
            <div className="flex gap-3">
              <a
                href={application?.resumeUrl || candidate?.resume?.resume_url || ''}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
              <a
                href={application?.resumeUrl || candidate?.resume?.resume_url || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </a>
            </div>
          </div>
        )}

        {/* Interview Modal */}
        {showInterviewModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
                <p className="text-sm text-gray-600 mt-1">{fullName}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent appearance-none"
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent text-gray-900 bg-white"
                        required
                        style={{ 
                          paddingRight: '2.5rem',
                          colorScheme: 'light',
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield'
                        }}
                      />
                      <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type *</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value as 'online' | 'in_person')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  >
                    <option value="online">Online</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                
                {interviewType === 'online' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link</label>
                    <input
                      type="url"
                      value={interviewLink}
                      onChange={(e) => setInterviewLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    />
                  </div>
                )}
                
                {interviewType === 'in_person' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                      placeholder="Office address..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Add any additional notes..."
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowInterviewModal(false);
                      setInterviewDate('');
                      setInterviewTime('');
                      setInterviewLink('');
                      setInterviewLocation('');
                      setActionNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!interviewDate || !interviewTime) {
                        setErrorMessage('Please fill in all required fields');
                        setShowErrorModal(true);
                        return;
                      }
                      handleCandidateAction('interview_again', actionNotes, {
                        date: interviewDate,
                        time: interviewTime,
                        type: interviewType,
                        location: interviewLocation,
                        link: interviewLink
                      });
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Scheduling...' : 'Schedule Interview'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Action Modal */}
        {showConfirmModal && selectedAction && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedAction === 'select' ? 'Select Candidate' : 'Reject Candidate'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{fullName}</p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Add any notes about this decision..."
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedAction(null);
                      setActionNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCandidateAction(selectedAction, actionNotes)}
                    disabled={actionLoading}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg transition-colors disabled:opacity-50 ${
                      selectedAction === 'select' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : selectedAction === 'select' ? 'Select Candidate' : 'Reject Candidate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">Success</h3>
                    <p className="text-sm text-gray-600 mt-1">{successMessage}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/employer/screened-candidates');
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#114373] rounded-lg hover:bg-[#0d3559] transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {errorMessage.includes('already been sent') || errorMessage.includes('cannot send') 
                        ? 'Cannot Send Offer Letter' 
                        : 'Error'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{errorMessage}</p>
                    {errorMessage.includes('contact Axia Admin') && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>Need Help?</strong> Contact Axia Admin at admin@axia.com or call our support line.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offer Letter Modal */}
        {showOfferLetterModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Send Offer Letter</h2>
                <button
                  onClick={() => {
                    setShowOfferLetterModal(false);
                    setOfferLetterFile(null);
                    setOfferLetterData({
                      offerAmount: '',
                      startDate: '',
                      positionTitle: '',
                      expiryDate: ''
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offer Letter File (PDF, DOC, DOCX) *
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 10MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                setErrorMessage('File size must be less than 10MB');
                                setShowErrorModal(true);
                                return;
                              }
                              setOfferLetterFile(file);
                            }
                          }}
                        />
                      </label>
                      {offerLetterFile && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FileText className="w-5 h-5" />
                          <span>{offerLetterFile.name}</span>
                          <button
                            onClick={() => setOfferLetterFile(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position Title *
                      </label>
                      <input
                        type="text"
                        value={offerLetterData.positionTitle}
                        onChange={(e) => setOfferLetterData({ ...offerLetterData, positionTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Amount *
                      </label>
                      <input
                        type="text"
                        value={offerLetterData.offerAmount}
                        onChange={(e) => setOfferLetterData({ ...offerLetterData, offerAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        placeholder="e.g., $120,000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={offerLetterData.startDate}
                        onChange={(e) => setOfferLetterData({ ...offerLetterData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={offerLetterData.expiryDate}
                        onChange={(e) => setOfferLetterData({ ...offerLetterData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowOfferLetterModal(false);
                      setOfferLetterFile(null);
                      setOfferLetterData({
                        offerAmount: '',
                        startDate: '',
                        positionTitle: '',
                        expiryDate: ''
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOfferLetterSubmit}
                    disabled={uploadingOffer}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
                  >
                    {uploadingOffer ? 'Uploading...' : 'Send Offer Letter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}

