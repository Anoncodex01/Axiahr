'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';

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

interface InterviewOutcomeModalProps {
  event: InterviewEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onOutcomeSelected: (event: InterviewEvent, outcome: 'screened' | 'rejected') => void;
}

export default function InterviewOutcomeModal({ 
  event, 
  isOpen, 
  onClose, 
  onOutcomeSelected 
}: InterviewOutcomeModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'screened' | 'rejected' | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!event || !selectedOutcome) return;
    
    onOutcomeSelected(event, selectedOutcome);
    setSelectedOutcome(null);
    setNotes('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedOutcome(null);
    setNotes('');
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Interview Outcome</h2>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Candidate Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.candidateName}</h3>
            <p className="text-gray-600">{event.jobTitle}</p>
            <p className="text-sm text-gray-500">Interview conducted on {new Date(event.date).toLocaleDateString()}</p>
          </div>

          {/* Outcome Selection */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Select Interview Outcome</h4>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="outcome"
                  value="screened"
                  checked={selectedOutcome === 'screened'}
                  onChange={(e) => setSelectedOutcome(e.target.value as 'screened')}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedOutcome === 'screened' 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedOutcome === 'screened' && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="flex items-center">
                  <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Screened</div>
                    <div className="text-sm text-gray-600">Candidate passed the interview and will be evaluated</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="outcome"
                  value="rejected"
                  checked={selectedOutcome === 'rejected'}
                  onChange={(e) => setSelectedOutcome(e.target.value as 'rejected')}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedOutcome === 'rejected' 
                    ? 'border-red-500 bg-red-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedOutcome === 'rejected' && <XCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="flex items-center">
                  <UserX className="w-5 h-5 text-red-600 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Rejected</div>
                    <div className="text-sm text-gray-600">Candidate did not meet requirements</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the interview..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedOutcome}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Outcome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
