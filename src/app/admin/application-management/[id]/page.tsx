'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
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
  Send
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';

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
  companyName: string;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const candidateId = searchParams.get('candidateId');
  const jobId = searchParams.get('jobId');

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'shortlisted' | 'selected' | 'rejected' | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [interviewers, setInterviewers] = useState<Array<{id: string, name: string}>>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [loadingInterviewers, setLoadingInterviewers] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (candidateId && applicationId) {
      fetchData();
      fetchInterviewers();
    }
  }, [candidateId, applicationId]);

  const fetchInterviewers = async () => {
    try {
      setLoadingInterviewers(true);
      console.log('Fetching interviewers from API...');
      
      // Fetch all active users (admins and recruiters can be interviewers)
      const response = await fetch('/api/admin/users?status=active&limit=100');
      const data = await response.json();
      
      console.log('API Response:', { success: data.success, usersCount: data.users?.length, data });
      
      if (data.success && data.users && Array.isArray(data.users)) {
        // Filter for admin, recruiter, and HR roles
        // Note: API returns camelCase (firstName, lastName) not snake_case
        const filteredUsers = data.users.filter((u: any) => {
          const role = u.role?.toLowerCase();
          return role === 'admin' || 
                 role === 'super_admin' || 
                 role === 'recruiter' || 
                 role === 'hr' || 
                 role === 'hr_manager';
        });
        
        console.log('Filtered users by role:', filteredUsers.length, filteredUsers);
        
        const mappedInterviewers = filteredUsers.map((u: any) => ({
          id: u.id.toString(),
          // API returns camelCase: firstName, lastName
          name: `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim() || 'Unnamed User'
        })).filter((u: {id: string, name: string}) => u.name !== 'Unnamed User');
        
        console.log('Mapped interviewers:', mappedInterviewers);
        setInterviewers(mappedInterviewers);
        
        if (mappedInterviewers.length === 0) {
          console.warn('No interviewers found. Available roles:', data.users.map((u: any) => u.role));
        }
      } else {
        console.warn('No users found or invalid response:', data);
        setInterviewers([]);
      }
    } catch (error) {
      console.error('Error fetching interviewers:', error);
      setInterviewers([]);
    } finally {
      setLoadingInterviewers(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch candidate profile
      const candidateResponse = await fetch(`/api/candidates/profile?candidateId=${candidateId}`);
      const candidateData = await candidateResponse.json();
      
      if (candidateData.success && candidateData.data) {
        // Map the API response to match our interface
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
            jobTitle: app.job_title || '',
            companyName: app.company_name || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'shortlisted' | 'selected' | 'rejected') => {
    if (!application) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/applications?id=${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action,
          adminNotes: actionNotes,
          changedBy: 1 // TODO: Get from auth context
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh data
        await fetchData();
        setShowActionModal(false);
        setActionNotes('');
        setSelectedAction(null);
        setSuccessMessage(`Application ${action} successfully!`);
        setShowSuccessModal(true);
      } else {
        setErrorMessage(`Failed to ${action} application: ${data.error || 'Unknown error'}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      setErrorMessage('Failed to update application status. Please try again.');
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!application || !interviewDate || !interviewTime || !interviewerId) {
      setErrorMessage('Please fill in all required fields (Date, Time, and Interviewer)');
      setShowErrorModal(true);
      return;
    }

    setInterviewLoading(true);
    try {
      // Combine date and time into datetime string
      const scheduledDateTime = `${interviewDate}T${interviewTime}:00`;
      
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: application.id,
          interviewerId: interviewerId,
          interviewType: 'video', // Default to video for online interviews
          scheduledDate: scheduledDateTime,
          meetingLink: googleMeetLink || null,
          durationMinutes: 60
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send email notification to candidate
        if (candidate && candidate.email) {
          try {
            const { date, time } = formatDateTime(scheduledDateTime);
            const selectedInterviewer = interviewers.find(i => i.id === interviewerId);
            
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: candidate.email,
                subject: `Interview Scheduled - ${application.jobTitle}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #114373, #0d3559); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Axia HR Advisory</h1>
                      <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Interview Scheduled</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
                      <h2 style="color: #114373; margin-top: 0; font-size: 20px;">Congratulations, ${candidate.firstName}!</h2>
                    
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
                      Your application for <strong>${application.jobTitle}</strong> has been shortlisted, and we're excited to schedule an interview with you!
                    </p>
                    
                    <div style="background: white; border-left: 4px solid #114373; padding: 20px; margin: 25px 0; border-radius: 8px;">
                      <h3 style="color: #114373; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📅 Interview Details</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Date:</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${date}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time:</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${time}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Interviewer:</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>${selectedInterviewer?.name || 'TBA'}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Type:</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 15px;"><strong>Video Interview</strong></td>
                        </tr>
                      </table>
                    </div>
                    
                    ${googleMeetLink ? `
                    <div style="background: linear-gradient(135deg, #114373, #0d3559); border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
                      <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🔗 Join Interview</h3>
                      <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 14px;">
                        Click the button below to join the interview at the scheduled time:
                      </p>
                      <a href="${googleMeetLink}" 
                         style="background: white; color: #114373; padding: 14px 28px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        🎥 Join Google Meet
                      </a>
                      <p style="color: rgba(255,255,255,0.8); margin: 15px 0 0 0; font-size: 12px; word-break: break-all;">
                        Or copy this link: ${googleMeetLink}
                      </p>
                    </div>
                    ` : ''}
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Interview Tips:</h4>
                      <ul style="color: #856404; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                        <li>Test your internet connection and camera/microphone beforehand</li>
                        <li>Join the meeting 5 minutes early</li>
                        <li>Find a quiet, well-lit space for the interview</li>
                        <li>Have your resume and any relevant documents ready</li>
                        <li>Prepare questions about the role and company</li>
                      </ul>
                    </div>
                    
                    <p style="color: #64748b; margin: 30px 0 0; font-size: 14px; line-height: 1.6;">
                      If you need to reschedule or have any questions, please contact us as soon as possible.
                    </p>
                    
                    <p style="color: #64748b; margin: 20px 0 0; font-size: 14px; line-height: 1.6;">
                      We look forward to speaking with you!
                    </p>
                  </div>
                  
                  <div style="background: #1e293b; color: white; padding: 25px; text-align: center; border-radius: 0 0 12px 12px; margin-top: -1px;">
                    <p style="margin: 0 0 10px; font-size: 14px; font-weight: 500;">Best regards,<br>The Axia HR Advisory Team</p>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">© 2024 Axia HR Advisory. All rights reserved.</p>
                  </div>
                  </div>
                `
              }),
            });
          } catch (emailError) {
            console.error('Failed to send interview email:', emailError);
            // Don't fail the interview scheduling if email fails
          }
        }

        // Refresh data (API already handles status update if needed)
        await fetchData();
        setShowInterviewModal(false);
        setInterviewDate('');
        setInterviewTime('');
        setInterviewerId('');
        setGoogleMeetLink('');
        setSuccessMessage('Interview scheduled successfully! An email notification has been sent to the candidate.');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(`Failed to schedule interview: ${data.error || 'Unknown error'}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setErrorMessage('Failed to schedule interview. Please try again.');
      setShowErrorModal(true);
    } finally {
      setInterviewLoading(false);
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

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading application details..." size="lg" />
        </div>
      </div>
    );
  }

  if (!candidate || !application) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-6">The application you're looking for doesn't exist.</p>
          <Link
            href="/admin/application-management"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/application-management"
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {candidate.firstName} {candidate.surname}
            </h1>
            <p className="text-lg text-gray-600">Application for {application.jobTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Status</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
              application.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
              application.status === 'selected' ? 'bg-green-100 text-green-800' :
              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {application.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
              {application.status === 'shortlisted' && <Star className="w-4 h-4 mr-1" />}
              {application.status === 'selected' && <CheckCircle className="w-4 h-4 mr-1" />}
              {application.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedAction('shortlisted');
                setShowActionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              disabled={application.status === 'shortlisted' || actionLoading}
            >
              <Star className="w-4 h-4" />
              Shortlist
            </button>
            <button
              onClick={() => {
                // Only allow interview if status is shortlisted
                if (application.status === 'shortlisted') {
                  setShowInterviewModal(true);
                } else {
                  setErrorMessage('Please shortlist the candidate first before scheduling an interview.');
                  setShowErrorModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              disabled={application.status !== 'shortlisted' || actionLoading}
            >
              <Calendar className="w-4 h-4" />
              Interview
            </button>
            <button
              onClick={() => {
                setSelectedAction('selected');
                setShowActionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={application.status === 'selected' || actionLoading}
            >
              <CheckCircle className="w-4 h-4" />
              Select
            </button>
            <button
              onClick={() => {
                setSelectedAction('rejected');
                setShowActionModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              disabled={application.status === 'rejected' || actionLoading}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Application Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Job Title</label>
            <p className="text-gray-900">{application.jobTitle}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Applied Date</label>
            <p className="text-gray-900">{formatDate(application.appliedDate)}</p>
          </div>
          {application.expectedSalary && (
            <div>
              <label className="text-sm font-medium text-gray-700">Expected Salary</label>
              <p className="text-gray-900">{application.expectedSalary}</p>
            </div>
          )}
          {application.noticePeriod && (
            <div>
              <label className="text-sm font-medium text-gray-700">Notice Period</label>
              <p className="text-gray-900">{application.noticePeriod}</p>
            </div>
          )}
          {application.coverLetter && (
            <div>
              <label className="text-sm font-medium text-gray-700">Cover Letter</label>
              <p className="text-gray-900 whitespace-pre-wrap">{application.coverLetter}</p>
            </div>
          )}
          {application.resumeUrl && (
            <div>
              <label className="text-sm font-medium text-gray-700">Resume</label>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#114373] hover:underline"
              >
                <FileText className="w-4 h-4" />
                View Resume
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-6">
          {candidate.profilePicture ? (
            <img
              src={candidate.profilePicture}
              alt={`${candidate.firstName} ${candidate.surname}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-gray-100">
              <User className="w-12 h-12 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {candidate.firstName} {candidate.surname}
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                candidate.status === 'active' ? 'bg-green-100 text-green-800' :
                candidate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                candidate.status === 'suspended' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {candidate.status === 'active' && <CheckCircle className="w-4 h-4 mr-1" />}
                {candidate.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                {candidate.status === 'suspended' && <XCircle className="w-4 h-4 mr-1" />}
                {candidate.status}
              </span>
              {candidate.emailVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </span>
              )}
            </div>
            {candidate.resumeHeadline && (
              <p className="text-lg text-gray-700 mb-4">{candidate.resumeHeadline}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-5 h-5" />
                <span className="text-sm">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm">{candidate.phone}</span>
                </div>
              )}
              {candidate.location && candidate.location !== 'N/A' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              )}
              {candidate.nationality && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">{candidate.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-[#114373]" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-500">First Name</label>
            <p className="text-gray-900 font-medium">{candidate.firstName || 'N/A'}</p>
          </div>
          {candidate.middleName && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Middle Name</label>
              <p className="text-gray-900">{candidate.middleName}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-gray-500">Surname</label>
            <p className="text-gray-900 font-medium">{candidate.surname || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500">Email Address</label>
            <p className="text-gray-900">{candidate.email || 'N/A'}</p>
          </div>
          {candidate.gender && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Gender</label>
              <p className="text-gray-900 capitalize">{candidate.gender}</p>
            </div>
          )}
          {candidate.dateOfBirth && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{formatDate(candidate.dateOfBirth)}</p>
            </div>
          )}
          {candidate.maritalStatus && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Marital Status</label>
              <p className="text-gray-900 capitalize">{candidate.maritalStatus}</p>
            </div>
          )}
          {candidate.origin && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Origin</label>
              <p className="text-gray-900">{candidate.origin}</p>
            </div>
          )}
          {candidate.nationality && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Nationality</label>
              <p className="text-gray-900">{candidate.nationality}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-6 h-6 text-[#114373]" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidate.phone && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Phone Number</label>
              <p className="text-gray-900">{candidate.phone}</p>
            </div>
          )}
          {candidate.alternatePhone && (
            <div>
              <label className="text-sm font-semibold text-gray-500">Alternate Phone</label>
              <p className="text-gray-900">{candidate.alternatePhone}</p>
            </div>
          )}
          {candidate.whatsapp && (
            <div>
              <label className="text-sm font-semibold text-gray-500">WhatsApp Number</label>
              <p className="text-gray-900">{candidate.whatsapp}</p>
            </div>
          )}
          {!candidate.phone && !candidate.alternatePhone && !candidate.whatsapp && (
            <p className="text-gray-500 text-sm">No contact information available</p>
          )}
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#114373]" />
          Location Information
        </h3>
        <div className="space-y-6">
          {/* Current Address */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(candidate.currentAddress?.houseNo || candidate.currentAddress?.streetName || candidate.currentAddress?.landmark || candidate.currentAddress?.postalCode) ? (
                <>
                  {candidate.currentAddress.houseNo && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">House No</label>
                      <p className="text-gray-900">{candidate.currentAddress.houseNo}</p>
                    </div>
                  )}
                  {candidate.currentAddress.streetName && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Street Name</label>
                      <p className="text-gray-900">{candidate.currentAddress.streetName}</p>
                    </div>
                  )}
                  {candidate.currentAddress.landmark && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Landmark</label>
                      <p className="text-gray-900">{candidate.currentAddress.landmark}</p>
                    </div>
                  )}
                  {candidate.currentAddress.postalCode && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Postal Code</label>
                      <p className="text-gray-900">{candidate.currentAddress.postalCode}</p>
                    </div>
                  )}
                </>
              ) : null}
              <div>
                <label className="text-sm font-semibold text-gray-500">Country</label>
                <p className="text-gray-900">{candidate.currentLocation.country || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">State/Province</label>
                <p className="text-gray-900">{candidate.currentLocation.state || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">City</label>
                <p className="text-gray-900">{candidate.currentLocation.city || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Permanent Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(candidate.permanentAddress?.houseNo || candidate.permanentAddress?.streetName || candidate.permanentAddress?.landmark || candidate.permanentAddress?.postalCode) ? (
                <>
                  {candidate.permanentAddress.houseNo && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">House No</label>
                      <p className="text-gray-900">{candidate.permanentAddress.houseNo}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.streetName && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Street Name</label>
                      <p className="text-gray-900">{candidate.permanentAddress.streetName}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.landmark && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Landmark</label>
                      <p className="text-gray-900">{candidate.permanentAddress.landmark}</p>
                    </div>
                  )}
                  {candidate.permanentAddress.postalCode && (
                    <div>
                      <label className="text-sm font-semibold text-gray-500">Postal Code</label>
                      <p className="text-gray-900">{candidate.permanentAddress.postalCode}</p>
                    </div>
                  )}
                </>
              ) : null}
              <div>
                <label className="text-sm font-semibold text-gray-500">Country</label>
                <p className="text-gray-900">{candidate.permanentLocation.country || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">State/Province</label>
                <p className="text-gray-900">{candidate.permanentLocation.state || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-500">City</label>
                <p className="text-gray-900">{candidate.permanentLocation.city || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Relocation and Preferred Locations */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-500">Open for Relocation</label>
                <p className="text-gray-900">{candidate.isOpenForRelocation ? 'Yes' : 'No'}</p>
              </div>
              {candidate.preferredLocations && candidate.preferredLocations.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-500">Preferred Work Locations (Maximum 3)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {candidate.preferredLocations.map((location, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employment Details and Skills & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Employment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#114373]" />
            Employment Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-500">Experience Type</label>
              <p className="text-gray-900 font-medium capitalize">{candidate.experienceType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500">Experience Records</label>
              <p className="text-gray-900 font-medium">{candidate.experiences?.length || 0} records</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-500">Education Records</label>
              <p className="text-gray-900 font-medium">{candidate.education?.length || 0} records</p>
            </div>
          </div>
        </div>

        {/* Skills & Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#114373]" />
            Skills & Summary
          </h3>
          <div className="space-y-4">
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.skill_name || skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {candidate.profileSummary && (
              <div>
                <label className="text-sm font-semibold text-gray-500 mb-2 block">Profile Summary</label>
                <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">{candidate.profileSummary}</p>
              </div>
            )}
            {(!candidate.skills || candidate.skills.length === 0) && !candidate.profileSummary && (
              <p className="text-gray-500 text-sm">No skills or summary available</p>
            )}
          </div>
        </div>
      </div>

      {/* Work Experience */}
      {candidate.experiences && candidate.experiences.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#114373]" />
            Work Experience ({candidate.experiences.length})
          </h3>
          <div className="space-y-6">
            {candidate.experiences.map((exp: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{exp.job_title || exp.designation || 'N/A'}</h4>
                    <p className="text-[#114373] font-semibold text-base mt-1">{exp.company_name || 'N/A'}</p>
                    {exp.company_profile && (
                      <p className="text-sm text-gray-600 mt-2">{exp.company_profile}</p>
                    )}
                    {exp.description && (
                      <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                    )}
                    {exp.achievements && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500">Key Achievements:</p>
                        <p className="text-sm text-gray-700">{exp.achievements}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">
                      {exp.start_date ? formatDate(exp.start_date) : 'N/A'} - {exp.is_current || exp.end_date === null ? 'Present' : (exp.end_date ? formatDate(exp.end_date) : 'N/A')}
                    </p>
                    {exp.industry && (
                      <p className="text-xs text-gray-500 mt-1">{exp.industry}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {candidate.education && candidate.education.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#114373]" />
            Education ({candidate.education.length})
          </h3>
          <div className="space-y-6">
            {candidate.education.map((edu: any, index: number) => {
              const qualification = edu.qualification || edu.degree || edu.category;
              const institution = edu.institution || edu.institute || edu.university;
              
              // Only show if we have at least qualification or institution
              if (!qualification && !institution) return null;
              
              return (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    {qualification && (
                      <h4 className="text-lg font-semibold text-gray-900">
                        {qualification}
                      </h4>
                    )}
                    {institution && (
                      <p className="text-[#114373] font-semibold text-base mt-1">
                        {institution}
                      </p>
                    )}
                    {(edu.field_of_study || edu.specialization) && (
                      <p className="text-sm text-gray-600 mt-2">
                        Field of Study: {edu.field_of_study || edu.specialization}
                      </p>
                    )}
                    {edu.country && (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {edu.country}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {edu.start_date && (
                      <p className="text-sm text-gray-600">
                        {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Languages */}
      {candidate.languages && candidate.languages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#114373]" />
            Languages ({candidate.languages.length})
          </h3>
          <div className="space-y-4">
            {candidate.languages.map((lang: any, index: number) => {
              const languageName = lang.language_name || lang.language;
              
              // Only show if we have language name
              if (!languageName) return null;
              
              return (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{languageName}</span>
                  {lang.is_native && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Native</span>
                  )}
                </div>
                {lang.proficiency_level && (
                  <p className="text-sm text-gray-600 mt-1">Proficiency: {lang.proficiency_level}</p>
                )}
                {lang.certification && (
                  <p className="text-xs text-gray-500 mt-1">Certification: {lang.certification}</p>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {candidate.projects && candidate.projects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-[#114373]" />
            Projects ({candidate.projects.length})
          </h3>
          <div className="space-y-6">
            {candidate.projects.map((project: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{project.title || 'N/A'}</h4>
                    {project.client && (
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {project.client}
                      </p>
                    )}
                    {project.project_url && (
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#114373] hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                    {project.description && (
                      <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                    )}
                    {project.tools_technologies && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500">Tools & Technologies:</p>
                        <p className="text-sm text-gray-700">{project.tools_technologies}</p>
                      </div>
                    )}
                  </div>
                  {project.start_date && (
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {candidate.certifications && candidate.certifications.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#114373]" />
            Certifications ({candidate.certifications.length})
          </h3>
          <div className="space-y-4">
            {candidate.certifications.map((cert: any, index: number) => (
              <div key={index}>
                <h4 className="font-semibold text-gray-900">{cert.name || 'N/A'}</h4>
                {cert.issuing_body && <p className="text-sm text-gray-600 mt-1">Issued by: {cert.issuing_body}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {cert.year_of_completion && <span>Year: {cert.year_of_completion}</span>}
                  {cert.validity && <span>Valid until: {cert.validity}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accomplishments */}
      {candidate.accomplishments && candidate.accomplishments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#114373]" />
            Accomplishments ({candidate.accomplishments.length})
          </h3>
          <div className="space-y-4">
            {candidate.accomplishments.map((acc: any, index: number) => (
              <div key={index} className="border-l-4 border-[#114373] pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{acc.title || 'N/A'}</h4>
                    <p className="text-sm text-gray-600 mt-1">{acc.type || acc.other_type || 'N/A'}</p>
                    {acc.description && (
                      <p className="text-sm text-gray-700 mt-2">{acc.description}</p>
                    )}
                  </div>
                  {acc.year && <span className="text-sm font-semibold text-gray-600">{acc.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {candidate.references && candidate.references.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#114373]" />
            References ({candidate.references.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidate.references.map((ref: any, index: number) => {
              const verificationStatus = ref.verification_status || ref.verificationStatus || 'pending';
              const getVerificationColor = (status: string) => {
                switch (status) {
                  case 'verified':
                    return 'bg-green-100 text-green-800 border-green-200';
                  case 'rejected':
                    return 'bg-red-100 text-red-800 border-red-200';
                  case 'pending':
                  default:
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                }
              };
              
              const getVerificationIcon = (status: string) => {
                switch (status) {
                  case 'verified':
                    return <CheckCircle className="w-4 h-4" />;
                  case 'rejected':
                    return <XCircle className="w-4 h-4" />;
                  case 'pending':
                  default:
                    return <Clock className="w-4 h-4" />;
                }
              };
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ref.name || 'N/A'}</h4>
                      {ref.designation && <p className="text-sm text-gray-600 mt-1">{ref.designation}</p>}
                      {ref.company && <p className="text-sm text-gray-600">{ref.company}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getVerificationColor(verificationStatus)}`}>
                      {getVerificationIcon(verificationStatus)}
                      <span className="capitalize">{verificationStatus}</span>
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 pt-3 border-t border-gray-200">
                    {ref.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{ref.email}</span>
                      </div>
                    )}
                    {ref.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{ref.phone}</span>
                      </div>
                    )}
                    {ref.relationship && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <span>Relationship: <span className="font-medium capitalize">{ref.relationship}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Online Presence */}
      {candidate.onlinePresence && (candidate.onlinePresence.linkedin || candidate.onlinePresence.linkedin_url || candidate.onlinePresence.github || candidate.onlinePresence.github_url || candidate.onlinePresence.portfolio || candidate.onlinePresence.portfolio_url || (candidate.onlinePresence.otherProfiles && candidate.onlinePresence.otherProfiles.length > 0) || (candidate.onlinePresence.other_profiles)) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#114373]" />
            Online Presence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(candidate.onlinePresence.linkedin || candidate.onlinePresence.linkedin_url) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">LinkedIn</label>
                <a href={candidate.onlinePresence.linkedin || candidate.onlinePresence.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.linkedin || candidate.onlinePresence.linkedin_url}
                </a>
              </div>
            )}
            {(candidate.onlinePresence.github || candidate.onlinePresence.github_url) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">GitHub</label>
                <a href={candidate.onlinePresence.github || candidate.onlinePresence.github_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.github || candidate.onlinePresence.github_url}
                </a>
              </div>
            )}
            {(candidate.onlinePresence.portfolio || candidate.onlinePresence.portfolio_url) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Portfolio</label>
                <a href={candidate.onlinePresence.portfolio || candidate.onlinePresence.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline flex items-center gap-1 mt-1">
                  <ExternalLink className="w-4 h-4" />
                  {candidate.onlinePresence.portfolio || candidate.onlinePresence.portfolio_url}
                </a>
              </div>
            )}
            {(() => {
              let otherProfiles: string[] = [];
              if (candidate.onlinePresence.other_profiles) {
                try {
                  otherProfiles = typeof candidate.onlinePresence.other_profiles === 'string' 
                    ? JSON.parse(candidate.onlinePresence.other_profiles) 
                    : candidate.onlinePresence.other_profiles;
                } catch (e) {
                  console.error('Error parsing other_profiles:', e);
                }
              } else if (candidate.onlinePresence.otherProfiles) {
                otherProfiles = Array.isArray(candidate.onlinePresence.otherProfiles) 
                  ? candidate.onlinePresence.otherProfiles 
                  : [];
              }
              
              return otherProfiles.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-500">Other Profiles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {otherProfiles.map((profile: string, index: number) => (
                      <a key={index} href={profile} target="_blank" rel="noopener noreferrer" className="text-[#114373] hover:underline text-sm flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {profile}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Salary Information */}
      {candidate.salary && (candidate.salary.current_salary || candidate.salary.expected_salary || candidate.salary.salary_type || candidate.salary.notice_period || candidate.salary.benefits || candidate.salary.negotiable !== null) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#114373]" />
            Salary Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidate.salary.current_salary && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Current Salary</label>
                <p className="text-gray-900">{candidate.salary.current_salary} {candidate.salary.currency || ''}</p>
              </div>
            )}
            {candidate.salary.expected_salary && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Expected Salary</label>
                <p className="text-gray-900">{candidate.salary.expected_salary} {candidate.salary.currency || ''}</p>
              </div>
            )}
            {candidate.salary.salary_type && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Salary Type</label>
                <p className="text-gray-900">{candidate.salary.salary_type}</p>
              </div>
            )}
            {candidate.salary.notice_period && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Notice Period</label>
                <p className="text-gray-900">{candidate.salary.notice_period}</p>
              </div>
            )}
            {candidate.salary.benefits && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Benefits</label>
                <p className="text-gray-900">{candidate.salary.benefits}</p>
              </div>
            )}
            {candidate.salary.negotiable !== null && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Negotiable</label>
                <p className="text-gray-900">{candidate.salary.negotiable ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Preferences */}
      {candidate.jobPreferences && (candidate.jobPreferences.job_type || candidate.jobPreferences.jobType || candidate.jobPreferences.work_mode || candidate.jobPreferences.workMode || candidate.jobPreferences.shift_timing || candidate.jobPreferences.shiftTiming || candidate.jobPreferences.relocation_preference || candidate.jobPreferences.travelFlexibility || candidate.jobPreferences.notice_period || candidate.jobPreferences.noticePeriod || candidate.jobPreferences.preferred_industries || candidate.jobPreferences.industries || candidate.jobPreferences.preferred_roles || candidate.jobPreferences.roles) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-[#114373]" />
            Job Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(candidate.jobPreferences.job_type || candidate.jobPreferences.jobType) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Job Type</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.job_type || candidate.jobPreferences.jobType}</p>
              </div>
            )}
            {(candidate.jobPreferences.work_mode || candidate.jobPreferences.workMode) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Work Mode</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.work_mode || candidate.jobPreferences.workMode}</p>
              </div>
            )}
            {(candidate.jobPreferences.shift_timing || candidate.jobPreferences.shiftTiming) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Shift Timing</label>
                <p className="text-gray-900 capitalize">{candidate.jobPreferences.shift_timing || candidate.jobPreferences.shiftTiming}</p>
              </div>
            )}
            {(candidate.jobPreferences.relocation_preference || candidate.jobPreferences.travelFlexibility !== undefined) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Relocation</label>
                <p className="text-gray-900 capitalize">
                  {candidate.jobPreferences.relocation_preference || (candidate.jobPreferences.travelFlexibility ? 'Yes' : 'No')}
                </p>
              </div>
            )}
            {(candidate.jobPreferences.notice_period || candidate.jobPreferences.noticePeriod) && (
              <div>
                <label className="text-sm font-semibold text-gray-500">Notice Period</label>
                <p className="text-gray-900">{candidate.jobPreferences.notice_period || candidate.jobPreferences.noticePeriod}</p>
              </div>
            )}
            {((candidate.jobPreferences.preferred_industries || candidate.jobPreferences.industries) && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Preferred Industries</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    try {
                      const industries = candidate.jobPreferences.industries || candidate.jobPreferences.preferred_industries;
                      const parsed = typeof industries === 'string' 
                        ? JSON.parse(industries) 
                        : industries;
                      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map((ind: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{ind}</span>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            ))}
            {((candidate.jobPreferences.preferred_roles || candidate.jobPreferences.roles) && (
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-500">Preferred Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(() => {
                    try {
                      const roles = candidate.jobPreferences.roles || candidate.jobPreferences.preferred_roles;
                      const parsed = typeof roles === 'string' 
                        ? JSON.parse(roles) 
                        : roles;
                      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map((role: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{role}</span>
                      )) : null;
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume */}
      {candidate.resume && (candidate.resume.resume_url || candidate.resume.resumeUrl) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#114373]" />
            Resume
          </h3>
          <div className="flex items-center gap-4">
            <a
              href={candidate.resume.resume_url || candidate.resume.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Resume
            </a>
            {(candidate.resume.resume_filename || candidate.resume.resumeFilename) && (
              <span className="text-sm text-gray-600">{candidate.resume.resume_filename || candidate.resume.resumeFilename}</span>
            )}
            {(candidate.resume.resume_size || candidate.resume.resumeSize) && (
              <span className="text-xs text-gray-500">
                ({((candidate.resume.resume_size || candidate.resume.resumeSize) / 1024).toFixed(2)} KB)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Application
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                rows={4}
                placeholder="Add any notes about this action..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(selectedAction)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setActionNotes('');
                  setSelectedAction(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Scheduling Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Schedule Interview
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Candidate:</span> {candidate.firstName} {candidate.surname}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Job:</span> {application.jobTitle}
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Time <span className="text-red-500">*</span>
                  </label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Interviewer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={interviewerId}
                    onChange={(e) => setInterviewerId(e.target.value)}
                    disabled={loadingInterviewers}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent appearance-none bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">
                      {loadingInterviewers ? 'Loading interviewers...' : 'Select an interviewer'}
                    </option>
                    {interviewers.length > 0 && interviewers.map((interviewer) => (
                      <option key={interviewer.id} value={interviewer.id}>
                        {interviewer.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    {loadingInterviewers ? (
                      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
                {loadingInterviewers && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading interviewers from user management...
                  </p>
                )}
                {!loadingInterviewers && interviewers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No interviewers found. Please ensure there are active admin, recruiter, or HR users in the system.
                  </p>
                )}
                {!loadingInterviewers && interviewers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {interviewers.length} interviewer{interviewers.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Meet Link
                </label>
                <input
                  type="url"
                  value={googleMeetLink}
                  onChange={(e) => setGoogleMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Add Google Meet link for online interviews
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleScheduleInterview}
                disabled={interviewLoading}
                className="flex-1 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
              >
                {interviewLoading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
              <button
                onClick={() => {
                  setShowInterviewModal(false);
                  setInterviewDate('');
                  setInterviewTime('');
                  setInterviewerId('');
                  setGoogleMeetLink('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Success!
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Error
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

