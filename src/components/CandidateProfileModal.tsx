'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, Star, FileText, Download } from 'lucide-react';

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
  notes: string;
  recommendation: 'does_not_meet' | 'partially_meets' | 'meets' | 'exceeds';
  createdAt: string;
}

interface CandidateProfileModalProps {
  candidate: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateProfileModal({ candidate, isOpen, onClose }: CandidateProfileModalProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    if (candidate) {
      try {
        const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
        const candidateEvaluation = evaluations.find((evaluation: Evaluation) => evaluation.applicationId === candidate.id);
        setEvaluation(candidateEvaluation || null);
      } catch (error) {
        console.error('Failed to load evaluation:', error);
      }
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'screened': return 'bg-green-100 text-green-800';
      case 'shortlisted': return 'bg-blue-100 text-blue-800';
      case 'interviewed': return 'bg-purple-100 text-purple-800';
      case 'selected': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Candidate Profile & Evaluation</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Candidate Basic Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {candidate.candidateName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{candidate.candidateName}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(candidate.priority)}`}>
                    {candidate.priority} Priority
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {candidate.candidateEmail}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {candidate.candidatePhone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {candidate.experience} experience
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Applied: {new Date(candidate.appliedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Job Title</label>
                <p className="text-gray-900">{candidate.jobTitle}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Company</label>
                <p className="text-gray-900">{candidate.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                <p className="text-gray-900">{candidate.jobLocation}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Expected Salary</label>
                <p className="text-gray-900">{candidate.expectedSalary}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h4>
            <p className="text-gray-700 leading-relaxed">{candidate.coverLetter}</p>
          </div>

          {/* Admin Notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Admin Notes</h4>
            <p className="text-gray-700 leading-relaxed">{candidate.adminNotes}</p>
          </div>

          {/* Evaluation Section */}
          {evaluation ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900">Interview Evaluation</h4>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(evaluation.recommendation)}`}>
                    {evaluation.recommendation.replace('_', ' ')}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <Star className="w-4 h-4 mr-1" />
                    {evaluation.score}/10
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Strengths</h5>
                  <p className="text-gray-700">{evaluation.strengths}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Weaknesses</h5>
                  <p className="text-gray-700">{evaluation.weaknesses}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h5 className="font-semibold text-gray-900 mb-2">Additional Notes</h5>
                <p className="text-gray-700">{evaluation.notes}</p>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                Evaluated on: {new Date(evaluation.createdAt).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-yellow-600" />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-800">No Evaluation Yet</h4>
                  <p className="text-yellow-700">This candidate hasn't been evaluated yet.</p>
                </div>
              </div>
            </div>
          )}

          {/* Resume Download */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume</h4>
            {candidate.resumeUrl ? (
              <div className="flex gap-3">
                <a
                  href={candidate.resumeUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Details
                </a>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No resume available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
