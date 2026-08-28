'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, Briefcase, MapPin, Video, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingState from '@/components/LoadingState';

interface InterviewEvent {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobTitle: string;
  companyName: string;
  scheduledDate: string;
  interviewType: 'phone' | 'video' | 'in_person';
  meetingLink?: string;
  location?: string;
  interviewerId: string;
  interviewerName: string;
  status: 'scheduled' | 'conducted' | 'cancelled' | 'rescheduled';
  outcome?: 'conducted_screened' | 'conducted_rejected' | 'not_conducted';
  durationMinutes: number;
}

export default function InterviewCalendarPage() {
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewEvent | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'conducted_screened' | 'conducted_rejected' | 'not_conducted' | ''>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interviews?limit=100');
      const data = await response.json();
      
      if (data.success && data.data) {
        const mappedEvents: InterviewEvent[] = data.data.map((interview: any) => ({
          id: interview.id.toString(),
          applicationId: interview.application_id?.toString() || '',
          candidateId: interview.candidate_id?.toString() || '',
          candidateName: `${interview.first_name || ''} ${interview.last_name || ''}`.trim(),
          candidateEmail: interview.candidate_email || '',
          candidatePhone: interview.candidate_phone || '',
          jobTitle: interview.job_title || '',
          companyName: interview.company_name || '',
          scheduledDate: interview.scheduled_date || '',
          interviewType: interview.interview_type || 'video',
          meetingLink: interview.meeting_link || undefined,
          location: interview.location || undefined,
          interviewerId: interview.interviewer_id?.toString() || '',
          interviewerName: `${interview.interviewer_first_name || ''} ${interview.interviewer_last_name || ''}`.trim() || 'Unassigned',
          status: interview.status || 'scheduled',
          outcome: interview.outcome || undefined,
          durationMinutes: interview.duration_minutes || 60
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOutcome = async () => {
    if (!selectedInterview || !selectedOutcome) return;

    setUpdatingStatus(selectedInterview.id);
    try {
      const response = await fetch(`/api/interviews?id=${selectedInterview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'conducted',
          outcome: selectedOutcome
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchInterviews();
        setShowOutcomeModal(false);
        setSelectedInterview(null);
        setSelectedOutcome('');
        setSuccessMessage('Interview outcome updated successfully!');
        setShowSuccessModal(true);
      } else {
        setErrorMessage(`Failed to update interview: ${data.error || 'Unknown error'}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error updating interview:', error);
      setErrorMessage('Failed to update interview outcome. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDateTime = (dateTimeString: string): { date: string; time: string } => {
    if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conducted':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getOutcomeLabel = (outcome?: string) => {
    switch (outcome) {
      case 'conducted_screened':
        return 'Conducted and Screened';
      case 'conducted_rejected':
        return 'Conducted and Rejected';
      case 'not_conducted':
        return 'Not Conducted';
      default:
        return 'Pending';
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'conducted_screened':
        return 'bg-green-100 text-green-700';
      case 'conducted_rejected':
        return 'bg-red-100 text-red-700';
      case 'not_conducted':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const groups = events.reduce<Record<string, InterviewEvent[]>>((acc, ev) => {
    const key = ev.interviewerName || 'Unassigned';
    acc[key] = acc[key] || [];
    acc[key].push(ev);
    return acc;
  }, {});

  const owners = Object.keys(groups).sort();

  // Filter events for table view
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.interviewerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort by scheduled date (upcoming first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading interviews..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Schedule</h1>
          <p className="text-gray-600">View and manage scheduled interviews</p>
        </div>
        <Link 
          href="/admin/application-management" 
          className="text-sm text-[#114373] hover:text-[#0d3559] font-medium"
        >
          Back to Applications
        </Link>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by candidate, job, company, or interviewer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="conducted">Conducted</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#114373] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#114373] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No interviews scheduled yet.</p>
          <Link 
            href="/admin/application-management" 
            className="text-[#114373] hover:text-[#0d3559] font-medium mt-2 inline-block"
          >
            Go to Applications to schedule interviews
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Interviewer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Scheduled Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No interviews found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((event) => {
                    const { date, time } = formatDateTime(event.scheduledDate);
                    return (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.candidateName}</div>
                              <div className="text-xs text-gray-500">{event.candidateEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.companyName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.interviewerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{date}</div>
                          <div className="text-xs text-gray-500">{time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {event.interviewType === 'video' ? (
                              <>
                                <Video className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900 capitalize">Video</span>
                              </>
                            ) : event.interviewType === 'phone' ? (
                              <>
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900 capitalize">Phone</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-900 capitalize">In Person</span>
                              </>
                            )}
                          </div>
                          {event.meetingLink && (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#114373] hover:text-[#0d3559] hover:underline mt-1 block"
                            >
                              Join Meeting
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.outcome ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(event.outcome)}`}>
                              {getOutcomeLabel(event.outcome)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {event.status === 'scheduled' ? (
                            <button
                              onClick={() => {
                                setSelectedInterview(event);
                                setShowOutcomeModal(true);
                              }}
                              disabled={updatingStatus === event.id}
                              className="px-3 py-1 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50 text-xs"
                            >
                              {updatingStatus === event.id ? 'Updating...' : 'Update Status'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {owners.map(owner => (
            <div key={owner} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-800">{owner}</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {groups[owner]
                  .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                  .map(ev => {
                    const { date, time } = formatDateTime(ev.scheduledDate);
                    return (
                      <div key={ev.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="space-y-2">
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {ev.candidateName}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Briefcase className="w-3 h-3" />
                              {ev.jobTitle}
                            </div>
                            {ev.companyName && (
                              <div className="text-xs text-gray-500 mt-1">{ev.companyName}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {ev.interviewType === 'video' ? (
                              <Video className="w-3 h-3" />
                            ) : ev.interviewType === 'phone' ? (
                              <Phone className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            <span className="capitalize">{ev.interviewType.replace('_', ' ')}</span>
                          </div>

                          {ev.meetingLink && (
                            <a 
                              href={ev.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-[#114373] hover:text-[#0d3559] hover:underline inline-flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              Join Google Meet
                            </a>
                          )}

                          {ev.location && (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ev.status)}`}>
                              {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                            </span>
                            {ev.outcome && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOutcomeColor(ev.outcome)}`}>
                                {getOutcomeLabel(ev.outcome)}
                              </span>
                            )}
                          </div>

                          {ev.status === 'scheduled' && (
                            <button
                              onClick={() => {
                                setSelectedInterview(ev);
                                setShowOutcomeModal(true);
                              }}
                              disabled={updatingStatus === ev.id}
                              className="w-full mt-2 px-3 py-2 text-xs bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
                            >
                              {updatingStatus === ev.id ? 'Updating...' : 'Update Interview Status'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outcome Modal */}
      {showOutcomeModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Update Interview Status
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Candidate:</span> {selectedInterview.candidateName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Job:</span> {selectedInterview.jobTitle}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Outcome <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                required
              >
                <option value="">Select outcome</option>
                <option value="conducted_screened">Conducted and Screened</option>
                <option value="conducted_rejected">Conducted and Rejected</option>
                <option value="not_conducted">Not Conducted</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdateOutcome}
                disabled={!selectedOutcome || updatingStatus === selectedInterview.id}
                className="flex-1 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
              >
                {updatingStatus === selectedInterview.id ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => {
                  setShowOutcomeModal(false);
                  setSelectedInterview(null);
                  setSelectedOutcome('');
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
