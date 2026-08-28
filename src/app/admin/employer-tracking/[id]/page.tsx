'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Award,
  Briefcase,
  FileText,
  Eye,
  Download,
  MessageSquare,
  AlertCircle,
  Info,
  ChevronRight,
  Activity
} from 'lucide-react';

interface ActionFlow {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerEmail: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  actions: Array<{
    id: string;
    type: string;
    date: string;
    status: string;
    notes?: string;
    metadata?: any;
  }>;
  responses: Array<{
    id: string;
    type: string;
    date: string;
    data?: any;
    rejectionReason?: string;
  }>;
  offerLetter?: {
    id: string;
    offerAmount: string;
    startDate: string;
    positionTitle: string;
    status: string;
    candidateResponse?: string;
    expiryDate: string;
    offerFileUrl: string;
  };
}

export default function EmployerTrackingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const actionId = searchParams.get('actionId');
  const responseId = searchParams.get('responseId');

  const [flow, setFlow] = useState<ActionFlow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string | null>(actionId || null);

  useEffect(() => {
    fetchFlowDetails();
  }, [applicationId]);

  const fetchFlowDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch all actions for this application
      const actionsResponse = await fetch('/api/admin/employer-actions');
      const actionsData = await actionsResponse.json();
      
      // Fetch all responses
      const responsesResponse = await fetch('/api/admin/candidate-responses');
      const responsesData = await responsesResponse.json();

      // Filter actions and responses for this application
      const applicationActions = (actionsData.actions || []).filter(
        (a: any) => a.applicationId === applicationId
      );
      
      // Filter responses by matching applicationId
      const applicationResponses = (responsesData.responses || []).filter(
        (r: any) => r.applicationId === applicationId
      );

      if (applicationActions.length > 0) {
        const firstAction = applicationActions[0];
        
        const flowData: ActionFlow = {
          applicationId: firstAction.applicationId,
          jobId: firstAction.jobId,
          jobTitle: firstAction.jobTitle,
          employerId: firstAction.employerId,
          employerName: firstAction.employerName,
          employerEmail: firstAction.employerEmail,
          candidateId: firstAction.candidateId,
          candidateName: firstAction.candidateName,
          candidateEmail: firstAction.candidateEmail,
          actions: applicationActions.map((a: any) => ({
            id: a.id,
            type: a.actionType,
            date: a.actionDate,
            status: a.status,
            notes: a.notes,
            metadata: a.metadata
          })),
          responses: applicationResponses.map((r: any) => ({
            id: r.id,
            type: r.responseType,
            date: r.responseDate,
            data: r.responseData,
            rejectionReason: r.rejectionReason
          }))
        };
        
        setFlow(flowData);

        // Fetch offer letter if exists
        try {
          const offerResponse = await fetch(`/api/offer-letters?applicationId=${applicationId}`);
          const offerData = await offerResponse.json();
          if (offerData.success && offerData.data && offerData.data.length > 0) {
            const offer = offerData.data[0];
            setFlow((prev: any) => ({
              ...prev,
              offerLetter: {
                id: offer.id.toString(),
                offerAmount: offer.offer_amount ? `$${parseFloat(offer.offer_amount).toLocaleString()}` : 'Not specified',
                startDate: offer.start_date,
                positionTitle: offer.position_title || offer.job_title,
                status: offer.status,
                candidateResponse: offer.candidate_response,
                expiryDate: offer.expiry_date,
                offerFileUrl: offer.offer_file_url
              }
            }));
          }
        } catch (error) {
          console.error('Error fetching offer letter:', error);
        }
      } else {
        // If no actions found, try to get basic info from responses
        const relatedResponse = (responsesData.responses || []).find(
          (r: any) => r.jobId === applicationId
        );
        if (relatedResponse) {
          // We have a response but no actions - show what we can
          setFlow({
            applicationId: applicationId,
            jobId: relatedResponse.jobId,
            jobTitle: relatedResponse.jobTitle,
            employerId: '',
            employerName: 'Unknown',
            employerEmail: '',
            candidateId: relatedResponse.candidateId,
            candidateName: relatedResponse.candidateName,
            candidateEmail: relatedResponse.candidateEmail,
            actions: [],
            responses: [relatedResponse].map((r: any) => ({
              id: r.id,
              type: r.responseType,
              date: r.responseDate,
              data: r.responseData,
              rejectionReason: r.rejectionReason
            }))
          });
        }
      }
    } catch (error) {
      console.error('Error fetching flow details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'select': return 'bg-green-100 text-green-800 border-green-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      case 'offer_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'offer_accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'offer_rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'interview_confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interview_cancelled': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading flow details...</p>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="p-6">
        <Link
          href="/admin/employer-tracking"
          className="inline-flex items-center gap-2 text-[#114373] hover:text-[#0d3559] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tracking
        </Link>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Flow details not found</p>
        </div>
      </div>
    );
  }

  // Combine and sort all events chronologically
  const allEvents = [
    ...flow.actions.map(a => ({ ...a, eventType: 'action' as const })),
    ...flow.responses.map(r => ({ ...r, eventType: 'response' as const }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/employer-tracking"
          className="inline-flex items-center gap-2 text-[#114373] hover:text-[#0d3559] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tracking
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Action Flow Details</h1>
        <p className="text-gray-600 mt-1">Complete timeline for this application</p>
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Employer</p>
              <p className="font-semibold text-gray-900">{flow.employerName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{flow.employerEmail}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Candidate</p>
              <p className="font-semibold text-gray-900">{flow.candidateName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{flow.candidateEmail}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Job Position</p>
              <p className="font-semibold text-gray-900">{flow.jobTitle}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Application ID: {flow.applicationId}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Timeline</h2>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {allEvents.map((event, index) => (
              <div key={event.id} className="relative pl-14">
                {/* Timeline dot */}
                <div className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white ${
                  event.eventType === 'action' 
                    ? getActionTypeColor(event.type).split(' ')[0].replace('bg-', 'bg-')
                    : getResponseTypeColor(event.type).split(' ')[0].replace('bg-', 'bg-')
                }`}></div>
                
                {/* Event card */}
                <div className={`border-l-4 rounded-lg p-4 ${
                  event.eventType === 'action'
                    ? getActionTypeColor(event.type)
                    : getResponseTypeColor(event.type)
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          event.eventType === 'action'
                            ? getActionTypeColor(event.type)
                            : getResponseTypeColor(event.type)
                        }`}>
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {event.eventType === 'action' && event.status && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            event.status === 'completed' ? 'bg-green-100 text-green-800' :
                            event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {event.eventType === 'action' 
                          ? `${flow.employerName} performed this action`
                          : `${flow.candidateName} responded`
                        }
                      </p>
                      {event.eventType === 'action' && event.notes && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-white bg-opacity-50 rounded">
                          <span className="font-medium">Notes:</span> {event.notes}
                        </p>
                      )}
                      {event.eventType === 'response' && event.rejectionReason && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-white bg-opacity-50 rounded">
                          <span className="font-medium">Rejection Reason:</span> {event.rejectionReason}
                        </p>
                      )}
                      {event.eventType === 'action' && event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-600">
                          {event.metadata.interviewType && (
                            <p><span className="font-medium">Interview Type:</span> {event.metadata.interviewType}</p>
                          )}
                          {event.metadata.scheduledDate && (
                            <p><span className="font-medium">Scheduled:</span> {formatDate(event.metadata.scheduledDate)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(event.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offer Letter Section */}
      {flow.offerLetter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Offer Letter Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="font-semibold text-gray-900">{flow.offerLetter.positionTitle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Offer Amount</p>
              <p className="font-semibold text-gray-900">{flow.offerLetter.offerAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-semibold text-gray-900">
                {flow.offerLetter.startDate ? formatDate(flow.offerLetter.startDate) : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                flow.offerLetter.status === 'accepted' ? 'bg-green-100 text-green-800' :
                flow.offerLetter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {flow.offerLetter.status}
              </span>
            </div>
            {flow.offerLetter.offerFileUrl && (
              <div className="md:col-span-2">
                <a
                  href={flow.offerLetter.offerFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#114373] hover:text-[#0d3559]"
                >
                  <Download className="w-4 h-4" />
                  Download Offer Letter
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 flex items-center gap-4">
        <Link
          href={`/admin/application-management/${flow.applicationId}`}
          className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
        >
          View Application
        </Link>
        <Link
          href={`/admin/candidates/${flow.candidateId}`}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Candidate Profile
        </Link>
        <Link
          href={`/admin/job-posting/${flow.jobId}`}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Job Posting
        </Link>
      </div>
    </div>
  );
}

