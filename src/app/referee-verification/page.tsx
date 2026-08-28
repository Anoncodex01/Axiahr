'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface RefereeFormData {
  fullName: string;
  email: string;
  organization: string;
  position: string;
  relationship: string;
  howLongKnown: string;
  workQuality: string;
  communicationSkills: string;
  leadershipSkills: string;
  teamwork: string;
  reliability: string;
  overallRating: string;
  strengths: string;
  areasForImprovement: string;
  wouldRecommend: string;
  additionalComments: string;
}

function RefereeVerificationPageContent() {
  const searchParams = useSearchParams();
  const refId = searchParams.get('ref');
  const candidateName = searchParams.get('candidate');
  
  const [formData, setFormData] = useState<RefereeFormData>({
    fullName: '',
    email: '',
    organization: '',
    position: '',
    relationship: '',
    howLongKnown: '',
    workQuality: '',
    communicationSkills: '',
    leadershipSkills: '',
    teamwork: '',
    reliability: '',
    overallRating: '',
    strengths: '',
    areasForImprovement: '',
    wouldRecommend: '',
    additionalComments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showRegistrationChoice, setShowRegistrationChoice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save referee verification to database
      const response = await fetch('/api/referee-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refId,
          candidateName,
          formData,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Referee verification saved:', result);
        
        // Send confirmation email to referee
        await sendConfirmationEmail();
        
        setIsSubmitted(true);
        setShowRegistrationChoice(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to save referee verification:', errorData);
        alert('There was an error submitting your response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting referee verification:', error);
      alert('There was an error submitting your response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to send confirmation email to referee
  const sendConfirmationEmail = async () => {
    try {
      const response = await fetch('/api/send-referee-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refereeEmail: formData.email,
          refereeName: formData.fullName,
          candidateName: candidateName || 'the candidate'
        }),
      });

      if (response.ok) {
        console.log('Confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-[#114373] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Your reference verification for <strong className="text-[#114373]">{candidateName}</strong> has been submitted successfully.
          </p>
          <p className="text-gray-500 mb-8">
            We appreciate you taking the time to provide this valuable feedback.
          </p>

          {showRegistrationChoice && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Our Platform</h2>
              <p className="text-gray-600 mb-6">
                Would you like to register on our platform as an employee or employer?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/candidate/register'}
                  className="px-8 py-4 bg-[#114373] text-white rounded-xl hover:bg-[#0d3560] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Register as Employee
                </button>
                <button
                  onClick={() => window.location.href = '/employer/register'}
                  className="px-8 py-4 bg-white text-[#114373] border-2 border-[#114373] rounded-xl hover:bg-[#114373] hover:text-white transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Register as Employer
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="text-gray-500 hover:text-[#114373] transition-colors duration-200 underline"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-[#114373] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Reference Verification</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thank you for agreeing to provide a reference for <strong className="text-[#114373]">{candidateName}</strong>. 
              Please fill out the form below to help us verify their professional background.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Information */}
            <div className="bg-gradient-to-r from-[#114373] to-[#0d3560] rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Position/Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Relationship to Candidate *</label>
                  <select
                    required
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  >
                    <option value="">Select relationship</option>
                    <option value="manager">Manager/Supervisor</option>
                    <option value="colleague">Colleague</option>
                    <option value="client">Client</option>
                    <option value="mentor">Mentor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">How long have you known them? *</label>
                  <select
                    required
                    value={formData.howLongKnown}
                    onChange={(e) => setFormData(prev => ({ ...prev, howLongKnown: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-2">1-2 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="more-than-10">More than 10 years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Performance Ratings */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-[#114373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Assessment
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'workQuality', label: 'Quality of Work' },
                  { key: 'communicationSkills', label: 'Communication Skills' },
                  { key: 'leadershipSkills', label: 'Leadership Skills' },
                  { key: 'teamwork', label: 'Teamwork' },
                  { key: 'reliability', label: 'Reliability' }
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label} *</label>
                    <select
                      required
                      value={formData[key as keyof RefereeFormData]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                    >
                      <option value="">Select rating</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="satisfactory">Satisfactory</option>
                      <option value="needs-improvement">Needs Improvement</option>
                      <option value="not-observed">Not Observed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="bg-gradient-to-r from-[#114373] to-[#0d3560] rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Overall Assessment
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Overall Rating *</label>
                  <select
                    required
                    value={formData.overallRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, overallRating: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  >
                    <option value="">Select overall rating</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="needs-improvement">Needs Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Would you recommend this person? *</label>
                  <select
                    required
                    value={formData.wouldRecommend}
                    onChange={(e) => setFormData(prev => ({ ...prev, wouldRecommend: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                  >
                    <option value="">Select recommendation</option>
                    <option value="strongly-recommend">Strongly Recommend</option>
                    <option value="recommend">Recommend</option>
                    <option value="recommend-with-reservations">Recommend with Reservations</option>
                    <option value="not-recommend">Not Recommend</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Comments */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-[#114373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Additional Comments
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
                  <textarea
                    value={formData.strengths}
                    onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                    placeholder="Please describe the candidate's key strengths..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Improvement</label>
                  <textarea
                    value={formData.areasForImprovement}
                    onChange={(e) => setFormData(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                    placeholder="Please describe any areas where the candidate could improve..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments</label>
                  <textarea
                    value={formData.additionalComments}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-[#114373] transition-all duration-200"
                    placeholder="Any additional comments about the candidate..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-4 bg-[#114373] text-white rounded-xl hover:bg-[#0d3560] focus:ring-2 focus:ring-[#114373] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Reference'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RefereeVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
      </div>
    }>
      <RefereeVerificationPageContent />
    </Suspense>
  );
}
