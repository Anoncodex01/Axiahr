'use client';

import { useState, useEffect } from 'react';
import { UserCheck, UserX, Calendar, Star, CheckCircle, XCircle, FileText, X, RefreshCw, Briefcase, User } from 'lucide-react';
import CandidateProfileModal from './CandidateProfileModal';
import EvaluationForm, { EvaluationData } from './EvaluationForm';

interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  companyName: string;
  companyIndustry: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'screened' | 'selected' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastActivity: string;
  experience: string;
  skills: string[];
  expectedSalary: string;
  noticePeriod: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  interviewScheduled?: string;
  interviewNotes?: string;
  adminNotes: string;
  priority: 'low' | 'medium' | 'high';
  source: 'direct' | 'referral' | 'job_board' | 'social_media';
}

interface Evaluation {
  id: string;
  applicationId: string;
  score: number;
  strengths: string;
  weaknesses: string;
  recommendation: 'does_not_meet' | 'partially_meets' | 'meets' | 'exceeds';
  createdAt: string;
  communicationSkills?: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  technicalSkills?: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  experience?: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  culturalFit?: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  leadership?: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  additionalNotes?: string;
  currentSalary?: string;
  expectedSalary?: string;
  availability?: string;
  interviewerNotes?: string;
  interviewerFirstName?: string;
  interviewerLastName?: string;
  interviewDate?: string;
  sentToEmployer?: boolean;
}

interface BatchEvaluationProps {
  jobId: string | null;
  onEvaluateCandidate: (application: Application) => void;
  onScheduleInterview: (application: Application) => void;
  onBatchSendToEmployer: () => void;
}

export default function BatchEvaluation({ 
  jobId, 
  onEvaluateCandidate, 
  onScheduleInterview, 
  onBatchSendToEmployer 
}: BatchEvaluationProps) {
  const [shortlistedCandidates, setShortlistedCandidates] = useState<Application[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [interviewStatuses, setInterviewStatuses] = useState<Record<string, string>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [evaluatingCandidate, setEvaluatingCandidate] = useState<Application | null>(null);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sendingToEmployer, setSendingToEmployer] = useState(false);

  const loadData = async () => {
    if (!jobId) return;
    
    try {
      // Load screened applications from database
      const response = await fetch(`/api/applications?jobId=${jobId}&status=screened&limit=100`);
      const data = await response.json();
      
      let screenedApps: Application[] = [];
      
      if (data.success && data.data) {
        screenedApps = data.data.map((app: any) => ({
          id: app.id.toString(),
          candidateId: app.candidate_id?.toString() || '',
          candidateName: `${app.first_name || ''} ${app.surname || ''}`.trim(),
          candidateEmail: app.email || '',
          candidatePhone: app.phone || '',
          jobId: app.job_id?.toString() || '',
          jobTitle: app.job_title || '',
          jobLocation: app.job_location || '',
          companyName: app.company_name || '',
          companyIndustry: app.company_industry || '',
          status: app.status || 'screened',
          appliedDate: app.applied_date || app.created_at || '',
          lastActivity: app.last_activity || app.updated_at || '',
          experience: app.experience_years ? `${app.experience_years} years` : 'N/A',
          skills: typeof app.skills === 'string' ? JSON.parse(app.skills || '[]') : (app.skills || []),
          expectedSalary: app.expected_salary || '',
          noticePeriod: app.notice_period || '',
          coverLetter: app.cover_letter || '',
          resumeUrl: app.resume_url || '',
          portfolioUrl: app.portfolio_url || '',
          linkedinUrl: app.linkedin_url || '',
          githubUrl: app.github_url || '',
          adminNotes: app.admin_notes || '',
          priority: app.priority || 'medium',
          source: app.source || 'direct'
        }));
        setShortlistedCandidates(screenedApps);
      } else {
        setShortlistedCandidates([]);
      }

      // Load evaluations from database
      const evalResponse = await fetch(`/api/evaluations?jobId=${jobId}&limit=100`);
      const evalData = await evalResponse.json();
      
      if (evalData.success && evalData.data) {
        const mappedEvals: Evaluation[] = evalData.data.map((evaluation: any) => ({
          id: evaluation.id.toString(),
          applicationId: evaluation.application_id?.toString() || '',
          score: evaluation.overall_score || 0,
          strengths: evaluation.strengths || '',
          weaknesses: evaluation.weaknesses || '',
          recommendation: evaluation.recommendation || 'partially_meets',
          createdAt: evaluation.created_at || '',
          communicationSkills: evaluation.communication_skills,
          technicalSkills: evaluation.technical_skills,
          experience: evaluation.experience,
          culturalFit: evaluation.cultural_fit,
          leadership: evaluation.leadership,
          additionalNotes: evaluation.additional_notes || '',
          currentSalary: evaluation.current_salary || '',
          expectedSalary: evaluation.expected_salary || '',
          availability: evaluation.availability || '',
          interviewerNotes: evaluation.interviewer_notes || '',
          interviewerFirstName: evaluation.interviewer_first_name || '',
          interviewerLastName: evaluation.interviewer_last_name || '',
          interviewDate: evaluation.interview_date || '',
          sentToEmployer: evaluation.sent_to_employer || false
        }));
        setEvaluations(mappedEvals);
        console.log('Loaded evaluations:', mappedEvals.length, mappedEvals);
      } else {
        console.log('No evaluations found or error:', evalData);
        setEvaluations([]);
      }

      // Load interview statuses from database for all applications in this job
      // We'll fetch all interviews and filter by application IDs
      const interviewResponse = await fetch(`/api/interviews?limit=1000`);
      const interviewData = await interviewResponse.json();
      
      if (interviewData.success && interviewData.data && screenedApps.length > 0) {
        const applicationIds = screenedApps.map(app => app.id);
        const statusMap: Record<string, string> = {};
        interviewData.data.forEach((interview: any) => {
          const appId = interview.application_id?.toString();
          if (appId && applicationIds.includes(appId)) {
            statusMap[appId] = interview.status || 'scheduled';
          }
        });
        setInterviewStatuses(statusMap);
      } else {
        setInterviewStatuses({});
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setShortlistedCandidates([]);
      setEvaluations([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  const getEvaluationForCandidate = (applicationId: string) => {
    return evaluations.find(evaluation => evaluation.applicationId === applicationId);
  };

  const evaluatedCandidates = shortlistedCandidates.filter(candidate => 
    getEvaluationForCandidate(candidate.id)
  );

  const qualifiedCandidates = evaluatedCandidates.filter(candidate => {
    const evaluation = getEvaluationForCandidate(candidate.id);
    return evaluation && (evaluation.recommendation === 'meets' || evaluation.recommendation === 'exceeds');
  });

  // Filter qualified candidates that haven't been sent to employer yet
  const unsentQualifiedCandidates = qualifiedCandidates.filter(candidate => {
    const evaluation = getEvaluationForCandidate(candidate.id);
    // Check if evaluation has been sent - we'll need to add this to the Evaluation interface
    return evaluation && !(evaluation as any).sentToEmployer;
  });

  const pendingEvaluation = shortlistedCandidates.filter(candidate => 
    !getEvaluationForCandidate(candidate.id)
  );

  const hasEvaluatedCandidates = () => qualifiedCandidates.length > 0;

  const handleViewProfile = (candidate: Application) => {
    setSelectedCandidate(candidate);
    setShowProfileModal(true);
  };

  const handleViewEvaluation = (candidate: Application) => {
    const evaluation = getEvaluationForCandidate(candidate.id);
    if (evaluation) {
      setSelectedCandidate(candidate);
      setViewingEvaluation(evaluation);
      setShowEvaluationModal(true);
    }
  };

  const handleEvaluateClick = (candidate: Application) => {
    setEvaluatingCandidate(candidate);
    setShowEvaluationForm(true);
  };

  const handleEvaluationSubmit = async (data: EvaluationData) => {
    if (!evaluatingCandidate) return;
    
    setSavingEvaluation(true);
    try {
      // Get interviewer ID from localStorage or use a default
      const authData = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      let interviewerId = '1'; // Default, should be from auth context
      
      // Find interview ID for this application
      const interviewResponse = await fetch(`/api/interviews?limit=1000`);
      const interviewData = await interviewResponse.json();
      let interviewId = null;
      
      if (interviewData.success && interviewData.data) {
        const interview = interviewData.data.find((i: any) => 
          i.application_id?.toString() === evaluatingCandidate.id
        );
        if (interview) {
          interviewId = interview.id;
          interviewerId = interview.interviewer_id?.toString() || interviewerId;
        }
      }

      // Submit evaluation to API
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: evaluatingCandidate.id,
          interviewerId: interviewerId,
          interviewId: interviewId,
          overallScore: data.overallScore,
          communicationSkills: data.communicationSkills,
          technicalSkills: data.technicalSkills,
          experience: data.experience,
          culturalFit: data.culturalFit,
          leadership: data.leadership,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          additionalNotes: data.notes,
          recommendation: data.recommendation,
          currentSalary: data.currentSalary,
          expectedSalary: data.expectedSalary,
          availability: data.availability,
          interviewerNotes: data.interviewerNotes
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit evaluation');
      }

      // Reload data to refresh evaluations
      await loadData();
      
      setShowEvaluationForm(false);
      setEvaluatingCandidate(null);
      
      setSuccessMessage('Evaluation saved successfully!');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      setErrorMessage(`Failed to save evaluation: ${error.message || 'Please try again.'}`);
      setShowErrorModal(true);
    } finally {
      setSavingEvaluation(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'exceeds': return 'bg-green-100 text-green-800';
      case 'meets': return 'bg-blue-100 text-blue-800';
      case 'partially_meets': return 'bg-yellow-100 text-yellow-800';
      case 'does_not_meet': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'outstanding': return 'bg-green-100 text-green-800 border border-green-200';
      case 'above_satisfactory': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'satisfactory': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'below_satisfactory': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'unsatisfactory': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getInterviewStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'conducted': return 'bg-green-100 text-green-800';
      case 'not_done': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!jobId) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Screened Candidates & Send to Employer</h3>
          <p className="text-sm text-gray-600 mt-1">Review screened candidates and send qualified ones to employer</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={async () => {
              setSendingToEmployer(true);
              try {
                await onBatchSendToEmployer();
                // Show success message
                setSuccessMessage(`Successfully sent ${unsentQualifiedCandidates.length} qualified candidate(s) to employer!`);
                setShowSuccessModal(true);
                // Reload data to refresh the list
                await loadData();
              } catch (error: any) {
                console.error('Error sending to employer:', error);
                setErrorMessage(error.message || 'Failed to send candidates to employer. Please try again.');
                setShowErrorModal(true);
              } finally {
                setSendingToEmployer(false);
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasEvaluatedCandidates() || sendingToEmployer}
          >
            {sendingToEmployer ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Send Qualified Candidates to Employer ({unsentQualifiedCandidates.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Shortlisted Candidates List */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Screened Candidates ({shortlistedCandidates.length})</h4>
        {shortlistedCandidates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserX className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No screened candidates for this job</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {shortlistedCandidates.map((candidate) => {
              const evaluation = getEvaluationForCandidate(candidate.id);
              const interviewStatus = interviewStatuses[candidate.id];
              
              return (
                <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {candidate.candidateName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{candidate.candidateName}</h5>
                        <p className="text-sm text-gray-600">{candidate.candidateEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getInterviewStatusColor(interviewStatus || 'not_scheduled')}`}>
                            {interviewStatus || 'Not Scheduled'}
                          </span>
                          {evaluation && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRecommendationColor(evaluation.recommendation)}`}>
                              {evaluation.recommendation.replace('_', ' ')}
                            </span>
                          )}
                          {evaluation && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Star className="w-3 h-3 mr-1" />
                              {evaluation.score}/10
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {evaluation ? (
                        <button
                          onClick={() => handleViewEvaluation(candidate)}
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Evaluation
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEvaluateClick(candidate)}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Evaluate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Summary */}
      {shortlistedCandidates.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{shortlistedCandidates.length}</div>
              <div className="text-sm text-gray-600">Total Screened</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{evaluatedCandidates.length}</div>
              <div className="text-sm text-gray-600">Evaluated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{qualifiedCandidates.length}</div>
              <div className="text-sm text-gray-600">Qualified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{pendingEvaluation.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedCandidate(null);
        }}
      />
      
      {/* Evaluation Form Modal */}
      {showEvaluationForm && evaluatingCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Evaluate Candidate</h2>
              <button
                onClick={() => {
                  setShowEvaluationForm(false);
                  setEvaluatingCandidate(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EvaluationForm
                candidateName={evaluatingCandidate.candidateName}
                position={evaluatingCandidate.jobTitle}
                interviewDate={new Date().toISOString()}
                interviewerName="Admin"
                onSubmit={handleEvaluationSubmit}
                onCancel={() => {
                  setShowEvaluationForm(false);
                  setEvaluatingCandidate(null);
                }}
                isLoading={savingEvaluation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Evaluation View Modal */}
      {showEvaluationModal && viewingEvaluation && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Interview Evaluation</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const candidateToReevaluate = selectedCandidate;
                    setShowEvaluationModal(false);
                    setViewingEvaluation(null);
                    setSelectedCandidate(null);
                    // Allow re-evaluation by opening the form
                    if (candidateToReevaluate) {
                      handleEvaluateClick(candidateToReevaluate);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Re-evaluate
                </button>
                <button
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setViewingEvaluation(null);
                    setSelectedCandidate(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Evaluation Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Evaluation Details</h3>
                  <p className="text-sm text-gray-600">Interview conducted on {new Date(viewingEvaluation.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(viewingEvaluation.recommendation)}`}>
                    {viewingEvaluation.recommendation.replace('_', ' ')}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <Star className="w-4 h-4 mr-1" />
                    {viewingEvaluation.score}/10
                  </span>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Strengths
                  </h4>
                  <p className="text-green-800">{viewingEvaluation.strengths}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    Weaknesses
                  </h4>
                  <p className="text-red-800">{viewingEvaluation.weaknesses}</p>
                </div>
              </div>

              {/* Skill Ratings */}
              {(viewingEvaluation.communicationSkills || viewingEvaluation.technicalSkills || viewingEvaluation.experience || viewingEvaluation.culturalFit || viewingEvaluation.leadership) && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Skill Ratings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingEvaluation.communicationSkills && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Communication Skills:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRatingColor(viewingEvaluation.communicationSkills)}`}>
                          {viewingEvaluation.communicationSkills.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {viewingEvaluation.technicalSkills && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Technical Skills:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRatingColor(viewingEvaluation.technicalSkills)}`}>
                          {viewingEvaluation.technicalSkills.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {viewingEvaluation.experience && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Experience:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRatingColor(viewingEvaluation.experience)}`}>
                          {viewingEvaluation.experience.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {viewingEvaluation.culturalFit && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Cultural Fit:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRatingColor(viewingEvaluation.culturalFit)}`}>
                          {viewingEvaluation.culturalFit.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {viewingEvaluation.leadership && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Leadership:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getRatingColor(viewingEvaluation.leadership)}`}>
                          {viewingEvaluation.leadership.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {viewingEvaluation.additionalNotes && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Additional Notes
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingEvaluation.additionalNotes}</p>
                </div>
              )}

              {/* Salary & Availability Information */}
              {(viewingEvaluation.currentSalary || viewingEvaluation.expectedSalary || viewingEvaluation.availability) && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Salary & Availability
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {viewingEvaluation.currentSalary && (
                      <div>
                        <span className="font-medium text-purple-800">Current Salary:</span>
                        <p className="text-purple-700 mt-1">{viewingEvaluation.currentSalary}</p>
                      </div>
                    )}
                    {viewingEvaluation.expectedSalary && (
                      <div>
                        <span className="font-medium text-purple-800">Expected Salary:</span>
                        <p className="text-purple-700 mt-1">{viewingEvaluation.expectedSalary}</p>
                      </div>
                    )}
                    {viewingEvaluation.availability && (
                      <div>
                        <span className="font-medium text-purple-800">Availability:</span>
                        <p className="text-purple-700 mt-1">{viewingEvaluation.availability}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interviewer Notes */}
              {viewingEvaluation.interviewerNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Interviewer Notes
                  </h4>
                  <p className="text-blue-800 whitespace-pre-wrap">{viewingEvaluation.interviewerNotes}</p>
                  {viewingEvaluation.interviewerFirstName && (
                    <p className="text-xs text-blue-600 mt-2">
                      - {viewingEvaluation.interviewerFirstName} {viewingEvaluation.interviewerLastName || ''}
                    </p>
                  )}
                </div>
              )}

              {/* Evaluation Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-4">Evaluation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Overall Score:</span>
                    <span className="ml-2 text-blue-700 font-semibold">{viewingEvaluation.score}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Recommendation:</span>
                    <span className="ml-2 text-blue-700 capitalize font-semibold">{viewingEvaluation.recommendation.replace('_', ' ')}</span>
                  </div>
                  {viewingEvaluation.interviewDate && (
                    <div>
                      <span className="font-medium text-blue-800">Interview Date:</span>
                      <span className="ml-2 text-blue-700">{new Date(viewingEvaluation.interviewDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-blue-800">Evaluated On:</span>
                    <span className="ml-2 text-blue-700">{new Date(viewingEvaluation.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
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