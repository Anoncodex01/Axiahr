'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EvaluationForm, { type EvaluationData } from '@/components/EvaluationForm';
import InterviewOutcomeModal from '@/components/InterviewOutcomeModal';

interface InterviewEvent {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  date: string;
  time: string;
  type: 'in-person' | 'online';
  link?: string;
  location?: string;
  ownerId: string;
  ownerName: string;
  status: 'scheduled' | 'conducted' | 'not_done';
  feedback?: string;
}

export default function InterviewFeedbackPage() {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluatingEvent, setEvaluatingEvent] = useState<InterviewEvent | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeEvent, setOutcomeEvent] = useState<InterviewEvent | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('interviews') || '[]');
      setEvents(stored);
    } catch {}
  }, []);

  const saveAll = (updated: InterviewEvent[]) => {
    setEvents(updated);
    localStorage.setItem('interviews', JSON.stringify(updated));
  };

  const handleEvaluateCandidate = (event: InterviewEvent) => {
    setEvaluatingEvent(event);
    setShowEvaluationModal(true);
  };

  const handleSelectOutcome = (event: InterviewEvent) => {
    setOutcomeEvent(event);
    setShowOutcomeModal(true);
  };

  const handleOutcomeSelected = (event: InterviewEvent, outcome: 'screened' | 'rejected') => {
    try {
      // Update application status based on outcome
      const applications = JSON.parse(localStorage.getItem('applications') || '[]');
      const updatedApplications = applications.map((app: any) => {
        if (app.id === event.applicationId) {
          return { ...app, status: outcome };
        }
        return app;
      });
      localStorage.setItem('applications', JSON.stringify(updatedApplications));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('applicationsUpdated'));
      
      alert(`Candidate marked as ${outcome}. ${outcome === 'screened' ? 'You can now evaluate them.' : 'They will not proceed further.'}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update candidate status. Please try again.');
    }
  };

  const handleEvaluationSubmit = async (data: EvaluationData) => {
    if (!evaluatingEvent) return;
    
    try {
      // Submit evaluation to API
      const response = await fetch('/api/evaluations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: evaluatingEvent.applicationId,
          candidateName: evaluatingEvent.candidateName,
          jobTitle: evaluatingEvent.jobTitle,
          companyName: 'Your Company',
          evaluationData: data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit evaluation');
      }

      const result = await response.json();
      
      // Update interview status to conducted
      const updated = events.map(e => 
        e.id === evaluatingEvent.id ? { ...e, status: 'conducted' as const } : e
      );
    saveAll(updated);
      
      // Save evaluation to localStorage (don't change application status here)
    const evals = JSON.parse(localStorage.getItem('evaluations') || '[]');
      const existingIndex = evals.findIndex((evaluation: any) => evaluation.applicationId === evaluatingEvent.applicationId);
    const payload = {
        id: `eval-${evaluatingEvent.applicationId}`,
        applicationId: evaluatingEvent.applicationId,
        score: data.overallScore,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        notes: data.notes,
        recommendation: data.recommendation,
      createdAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) evals[existingIndex] = payload; else evals.push(payload);
    localStorage.setItem('evaluations', JSON.stringify(evals));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('evaluationsUpdated'));
      
      setShowEvaluationModal(false);
      setEvaluatingEvent(null);
      
      alert('Evaluation submitted successfully!');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Failed to submit evaluation. Please try again.');
    }
  };

  // Check if evaluation exists for an event
  const hasEvaluation = (applicationId: string) => {
    try {
      const evals = JSON.parse(localStorage.getItem('evaluations') || '[]');
      return evals.some((e: any) => e.applicationId === applicationId);
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Interview Feedback</h1>
        <div className="flex gap-2">
          <Link href="/admin/interview-calendar" className="px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Calendar</Link>
          <Link href="/admin/billing-management" className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Offers & Invoices</Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No interviews yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
          {events.map(ev => (
              <div key={ev.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ev.candidateName} • {ev.jobTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {ev.date} {ev.time} • {ev.type === 'online' ? 'Online' : 'In-person'}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ev.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        ev.status === 'conducted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Show Select Outcome button for conducted interviews without outcome */}
                    {ev.status === 'conducted' && !hasEvaluation(ev.applicationId) && (
                      <button
                        onClick={() => handleSelectOutcome(ev)}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Select Outcome
                      </button>
                    )}
                    
                    {/* Show Evaluate button only for screened candidates */}
                    {ev.status === 'conducted' && hasEvaluation(ev.applicationId) && (
                      <button
                        onClick={() => handleEvaluateCandidate(ev)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Evaluate Candidate
                      </button>
                    )}
                    
                    {/* Show evaluation complete only if interview is conducted AND evaluation exists */}
                    {ev.status === 'conducted' && hasEvaluation(ev.applicationId) && (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ Evaluation Complete
                      </span>
                    )}
                    
                    {/* Show not conducted message */}
                    {ev.status === 'not_done' && (
                      <span className="text-sm text-red-600 font-medium">
                        ✗ Interview Not Conducted
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {showEvaluationModal && evaluatingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <EvaluationForm
              candidateName={evaluatingEvent.candidateName}
              position={evaluatingEvent.jobTitle}
              interviewDate={evaluatingEvent.date}
              interviewerName={evaluatingEvent.ownerName}
              onSubmit={handleEvaluationSubmit}
              onCancel={() => {
                setShowEvaluationModal(false);
                setEvaluatingEvent(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Interview Outcome Modal */}
      <InterviewOutcomeModal
        event={outcomeEvent}
        isOpen={showOutcomeModal}
        onClose={() => {
          setShowOutcomeModal(false);
          setOutcomeEvent(null);
        }}
        onOutcomeSelected={handleOutcomeSelected}
      />
    </div>
  );
}