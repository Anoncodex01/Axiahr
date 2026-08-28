'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Evaluation {
  id: string;
  applicationId: string;
  score: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  recommendation: 'send_to_employer' | 'hold' | 'reject';
  createdAt: string;
}

interface EmployerPackage { id: string; applicationId: string; sentAt: string }

export default function EmployerReviewPage() {
  const [packages, setPackages] = useState<EmployerPackage[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    body: '',
    salary: '',
    startDate: ''
  });

  useEffect(() => {
    try {
      const packages = JSON.parse(localStorage.getItem('employerPackages') || '[]');
      const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      const offers = JSON.parse(localStorage.getItem('offers') || '[]');
      
      // If no data exists, add some sample data for demonstration
      if (packages.length === 0) {
        const samplePackages = [
          { id: 'pkg-1', applicationId: '1', sentAt: new Date().toISOString() },
          { id: 'pkg-2', applicationId: '2', sentAt: new Date(Date.now() - 86400000).toISOString() }
        ];
        setPackages(samplePackages);
        localStorage.setItem('employerPackages', JSON.stringify(samplePackages));
      } else {
        setPackages(packages);
      }
      
      if (evaluations.length === 0) {
        const sampleEvaluations: Evaluation[] = [
          {
            id: 'eval-1',
            applicationId: '1',
            score: 8,
            strengths: 'Strong technical skills, excellent communication, good cultural fit',
            weaknesses: 'Limited experience with specific technologies',
            recommendation: 'send_to_employer',
            createdAt: new Date().toISOString()
          },
          {
            id: 'eval-2',
            applicationId: '2',
            score: 6,
            strengths: 'Good problem-solving abilities',
            weaknesses: 'Needs improvement in team collaboration',
            recommendation: 'hold',
            createdAt: new Date().toISOString()
          }
        ];
        setEvaluations(sampleEvaluations);
        localStorage.setItem('evaluations', JSON.stringify(sampleEvaluations));
      } else {
        setEvaluations(evaluations);
      }
      
      setOffers(offers);
    } catch {}
  }, []);

  const evalByApp = useMemo(() => Object.fromEntries(evaluations.map(e => [e.applicationId, e])), [evaluations]);

  const saveDecision = (applicationId: string, decision: 'reject' | 'more_interview' | 'selected', comment?: string) => {
    const decisions = JSON.parse(localStorage.getItem('employerDecisions') || '[]');
    const payload = { id: `dec-${applicationId}`, applicationId, employerId: 'demo-employer', decision, comment: comment || '', decidedAt: new Date().toISOString() };
    const idx = decisions.findIndex((d: any) => d.applicationId === applicationId);
    if (idx >= 0) decisions[idx] = payload; else decisions.push(payload);
    localStorage.setItem('employerDecisions', JSON.stringify(decisions));
    alert(`Decision saved: ${decision}`);
  };

  const issueOffer = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setOfferForm({
      title: `Employment Offer for Application ${applicationId}`,
      body: `Dear Candidate,\n\nWe are pleased to offer you a position at our company. We were impressed by your qualifications and believe you would be a valuable addition to our team.\n\nPlease review the details below and let us know your decision.\n\nBest regards,\nHiring Team`,
      salary: '',
      startDate: new Date().toISOString().slice(0,10)
    });
    setShowOfferModal(true);
  };

  const handleOfferSubmit = () => {
    if (!selectedApplicationId) return;
    
    if (!offerForm.title.trim() || !offerForm.body.trim() || !offerForm.salary.trim() || !offerForm.startDate.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const offer = {
      id: `offer-${selectedApplicationId}-${Date.now()}`,
      applicationId: selectedApplicationId,
      employerId: 'demo-employer',
      status: 'issued',
      title: offerForm.title,
      body: offerForm.body,
      salary: offerForm.salary,
      startDate: offerForm.startDate,
      createdAt: new Date().toISOString(),
      candidateName: `Candidate ${selectedApplicationId}`,
      jobTitle: 'Position Title',
      companyName: 'Your Company'
    };
    
    const updated = [offer, ...offers.filter(o => o.applicationId !== selectedApplicationId)];
    setOffers(updated);
    localStorage.setItem('offers', JSON.stringify(updated));
    
    setShowOfferModal(false);
    setSelectedApplicationId(null);
    setOfferForm({ title: '', body: '', salary: '', startDate: '' });
    
    alert('Offer created and sent successfully!');
  };

  const moreInterview = (applicationId: string) => {
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]');
    const ev = {
      id: `emp-${applicationId}-${Date.now()}`,
      applicationId,
      candidateName: `Candidate ${applicationId}`,
      jobTitle: 'Interview (Employer)',
      date: new Date().toISOString().slice(0,10),
      time: '10:00',
      type: 'online',
      link: '',
      ownerId: 'employer-team',
      ownerName: 'Employer Team',
      status: 'scheduled'
    };
    localStorage.setItem('interviews', JSON.stringify([ev, ...interviews]));
    saveDecision(applicationId, 'more_interview');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with proper contrast */}
        <div className="bg-white border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employer Review</h1>
              <p className="text-gray-600 mt-2">Review candidate evaluations and make hiring decisions</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/admin/interview-feedback" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Back to Feedback
              </Link>
              <Link 
                href="/employer/offers" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                Offers
              </Link>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="divide-y divide-gray-200">
            {packages.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates sent to employer yet</h3>
                <p className="text-gray-600">Candidates will appear here once they are sent for employer review.</p>
              </div>
            )}
            {packages.map(p => (
              <div key={p.id} className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Application Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Application {p.applicationId}</h3>
                      <p className="text-sm text-gray-600">Sent: {new Date(p.sentAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Under Review
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Details */}
                  {evalByApp[p.applicationId] && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Evaluation Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Evaluation Score</div>
                          <div className="text-lg font-bold text-gray-900">{evalByApp[p.applicationId].score}/10</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Recommendation</div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {evalByApp[p.applicationId].recommendation.replace('_',' ')}
                          </div>
                        </div>
                      </div>
                      
                      {evalByApp[p.applicationId].strengths && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-900 mb-1">Strengths</div>
                          <div className="text-sm text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                            {evalByApp[p.applicationId].strengths}
                          </div>
                        </div>
                      )}
                      
                      {evalByApp[p.applicationId].weaknesses && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">Weaknesses</div>
                          <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                            {evalByApp[p.applicationId].weaknesses}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => saveDecision(p.applicationId, 'reject')} 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => moreInterview(p.applicationId)} 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      More Interview
                    </button>
                    <button 
                      onClick={() => saveDecision(p.applicationId, 'selected')} 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Selected
                    </button>
                    <button 
                      onClick={() => issueOffer(p.applicationId)} 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Issue Offer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offer Creation Modal */}
      {showOfferModal && selectedApplicationId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create Employment Offer</h3>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setSelectedApplicationId(null);
                    setOfferForm({ title: '', body: '', salary: '', startDate: '' });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Create a detailed offer for Application {selectedApplicationId}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Offer Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Employment Offer - Senior Software Engineer"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Salary *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., $120,000 per year"
                  value={offerForm.salary}
                  onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={offerForm.startDate}
                  onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                />
              </div>

              {/* Offer Letter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Offer Letter *
                </label>
                <textarea
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your offer letter here..."
                  value={offerForm.body}
                  onChange={(e) => setOfferForm({ ...offerForm, body: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include details about the position, benefits, company culture, and next steps.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowOfferModal(false);
                  setSelectedApplicationId(null);
                  setOfferForm({ title: '', body: '', salary: '', startDate: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOfferSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create & Send Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
