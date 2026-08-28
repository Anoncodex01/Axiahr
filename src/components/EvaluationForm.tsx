'use client';

import { useState } from 'react';
import { X, User, Calendar, Briefcase, FileText, Star, Loader2 } from 'lucide-react';

export interface EvaluationData {
  // Basic Information
  overallScore: number;
  strengths: string;
  weaknesses: string;
  notes: string;
  recommendation: 'does_not_meet' | 'partially_meets' | 'meets' | 'exceeds';
  
  // Detailed Criteria with Rating Categories
  communicationSkills: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  technicalSkills: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  experience: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  culturalFit: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  leadership: 'outstanding' | 'above_satisfactory' | 'satisfactory' | 'below_satisfactory' | 'unsatisfactory';
  
  // Additional Information
  currentSalary: string;
  expectedSalary: string;
  availability: string;
  interviewerNotes: string;
  additionalNotes?: string;
}

interface EvaluationFormProps {
  candidateName: string;
  position: string;
  interviewDate: string;
  interviewerName: string;
  onSubmit: (data: EvaluationData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EvaluationForm({ 
  candidateName, 
  position, 
  interviewDate, 
  interviewerName, 
  onSubmit, 
  onCancel,
  isLoading = false
}: EvaluationFormProps) {
  const [formData, setFormData] = useState<EvaluationData>({
    overallScore: 5,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: 'meets',
    communicationSkills: 'satisfactory',
    technicalSkills: 'satisfactory',
    experience: 'satisfactory',
    culturalFit: 'satisfactory',
    leadership: 'satisfactory',
    currentSalary: '',
    expectedSalary: '',
    availability: '',
    interviewerNotes: '',
    additionalNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateFormData = (field: keyof EvaluationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'outstanding': return 'text-green-600 bg-green-50 border-green-200';
      case 'above_satisfactory': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'satisfactory': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'below_satisfactory': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'unsatisfactory': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingDescription = (rating: string) => {
    switch (rating) {
      case 'outstanding': return 'Applicant has performed similar functions very well and met high performance standards for similar functions. Exceeds level required for job.';
      case 'above_satisfactory': return 'Applicant has successfully performed the function in the past and demonstrated record of performance that meets the level required for job.';
      case 'satisfactory': return 'Applicant has successfully performed the function or related activities in the past, and expresses a willingness to do so.';
      case 'below_satisfactory': return 'Applicant does not suggest ability to perform the function. However, he/she expresses willingness to do so.';
      case 'unsatisfactory': return 'Applicant has been unsuccessful with similar functions or states an unwillingness to perform function.';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Interview Evaluation</h2>
              <p className="text-blue-100">Candidate Assessment Form</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Candidate Information */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Candidate Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name</label>
              <div className="text-sm text-gray-900 font-medium">{candidateName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <div className="text-sm text-gray-900 font-medium">{position}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
              <div className="text-sm text-gray-900 font-medium">{interviewDate}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
              <div className="text-sm text-gray-900 font-medium">{interviewerName}</div>
            </div>
          </div>
        </div>

        {/* Rating Category Guide */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Rating Category Guide</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Outstanding</span>
              <p className="text-sm text-blue-800">Applicant has performed similar functions very well and met high performance standards for similar functions. Exceeds level required for job.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Above Satisfactory</span>
              <p className="text-sm text-blue-800">Applicant has successfully performed the function in the past and demonstrated record of performance that meets the level required for job.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Satisfactory</span>
              <p className="text-sm text-blue-800">Applicant has successfully performed the function or related activities in the past, and expresses a willingness to do so.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">Below Satisfactory</span>
              <p className="text-sm text-blue-800">Applicant does not suggest ability to perform the function. However, he/she expresses willingness to do so.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Unsatisfactory</span>
              <p className="text-sm text-blue-800">Applicant has been unsuccessful with similar functions or states an unwillingness to perform function.</p>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Overall Assessment
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Overall Score (1-10) *
              </label>
              <select
                value={formData.overallScore}
                onChange={(e) => updateFormData('overallScore', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recommendation *
              </label>
              <select
                value={formData.recommendation}
                onChange={(e) => updateFormData('recommendation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="does_not_meet">Does Not Meet Requirements</option>
                <option value="partially_meets">Partially Meets Requirements</option>
                <option value="meets">Meets Requirements</option>
                <option value="exceeds">Exceeds Requirements</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Criteria */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Evaluation</h3>
          <p className="text-sm text-gray-600 mb-6 italic">Please check the appropriate rating for each of the categories below:</p>
          
          <div className="space-y-6">
            {/* Communication Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Communication Skills
                </label>
                <select
                  value={formData.communicationSkills}
                  onChange={(e) => updateFormData('communicationSkills', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="above_satisfactory">Above Satisfactory</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="below_satisfactory">Below Satisfactory</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Technical Skills
                </label>
                <select
                  value={formData.technicalSkills}
                  onChange={(e) => updateFormData('technicalSkills', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="above_satisfactory">Above Satisfactory</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="below_satisfactory">Below Satisfactory</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Experience
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => updateFormData('experience', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="above_satisfactory">Above Satisfactory</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="below_satisfactory">Below Satisfactory</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cultural Fit
                </label>
                <select
                  value={formData.culturalFit}
                  onChange={(e) => updateFormData('culturalFit', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="above_satisfactory">Above Satisfactory</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="below_satisfactory">Below Satisfactory</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leadership
                </label>
                <select
                  value={formData.leadership}
                  onChange={(e) => updateFormData('leadership', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="outstanding">Outstanding</option>
                  <option value="above_satisfactory">Above Satisfactory</option>
                  <option value="satisfactory">Satisfactory</option>
                  <option value="below_satisfactory">Below Satisfactory</option>
                  <option value="unsatisfactory">Unsatisfactory</option>
                </select>
              </div>
              <div></div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback & Notes</h3>
          
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Strengths *
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) => updateFormData('strengths', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What are the candidate's key strengths?"
                required
              />
            </div>

            {/* Weaknesses */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Areas for Improvement *
              </label>
              <textarea
                value={formData.weaknesses}
                onChange={(e) => updateFormData('weaknesses', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What areas need improvement?"
                required
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional observations or comments..."
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="space-y-6">
            {/* Interviewer Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interviewer's Notes
              </label>
              <textarea
                value={formData.interviewerNotes}
                onChange={(e) => updateFormData('interviewerNotes', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional observations and notes about the candidate..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Salary
                </label>
                <input
                  type="text"
                  value={formData.currentSalary}
                  onChange={(e) => updateFormData('currentSalary', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $75,000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Salary
                </label>
                <input
                  type="text"
                  value={formData.expectedSalary}
                  onChange={(e) => updateFormData('expectedSalary', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., $85,000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How soon can the Candidate Join?
              </label>
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => updateFormData('availability', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2 weeks notice, immediate"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Saving...' : 'Submit Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}