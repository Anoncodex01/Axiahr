'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Award,
  Briefcase,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface EmployerAction {
  id: string;
  employerId: string;
  employerName: string;
  employerEmail: string;
  actionType: 'interview' | 'select' | 'reject' | 'offer_sent' | 'offer_updated';
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  actionDate: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  metadata?: any;
}

interface CandidateResponse {
  id: string;
  applicationId?: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  responseType: 'offer_accepted' | 'offer_rejected' | 'interview_confirmed' | 'interview_cancelled';
  offerLetterId?: string;
  interviewId?: string;
  jobId: string;
  jobTitle: string;
  responseDate: string;
  responseData?: any;
  rejectionReason?: string;
}

export default function EmployerTrackingPage() {
  const [employerActions, setEmployerActions] = useState<EmployerAction[]>([]);
  const [candidateResponses, setCandidateResponses] = useState<CandidateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'actions' | 'responses' | 'overview'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
    
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'actions' || tabParam === 'responses') {
      setActiveTab(tabParam);
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch employer actions
      const actionsResponse = await fetch('/api/admin/employer-actions');
      const actionsData = await actionsResponse.json();
      if (actionsData.success) {
        setEmployerActions(actionsData.actions || []);
      }

      // Fetch candidate responses
      const responsesResponse = await fetch('/api/admin/candidate-responses');
      const responsesData = await responsesResponse.json();
      if (responsesData.success) {
        setCandidateResponses(responsesData.responses || []);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'select': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'offer_sent': return 'bg-blue-100 text-blue-800';
      case 'offer_updated': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'offer_accepted': return 'bg-green-100 text-green-800';
      case 'offer_rejected': return 'bg-red-100 text-red-800';
      case 'interview_confirmed': return 'bg-blue-100 text-blue-800';
      case 'interview_cancelled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group actions by application/job
  const groupedByApplication = employerActions.reduce((acc: any, action) => {
    const key = action.applicationId;
    if (!acc[key]) {
      acc[key] = {
        applicationId: action.applicationId,
        jobId: action.jobId,
        jobTitle: action.jobTitle,
        employerId: action.employerId,
        employerName: action.employerName,
        employerEmail: action.employerEmail,
        actions: [],
        lastActivityDate: action.actionDate,
        actionCounts: {
          interview: 0,
          select: 0,
          reject: 0,
          offer_sent: 0
        }
      };
    }
    acc[key].actions.push(action);
    const actionType = action.actionType as 'interview' | 'select' | 'reject' | 'offer_sent';
    if (actionType in acc[key].actionCounts) {
      acc[key].actionCounts[actionType]++;
    }
    if (new Date(action.actionDate) > new Date(acc[key].lastActivityDate)) {
      acc[key].lastActivityDate = action.actionDate;
    }
    return acc;
  }, {});

  const groupedApplications = Object.values(groupedByApplication) as any[];

  // Group responses by application/job
  const groupedResponsesByApplication = candidateResponses.reduce((acc: any, response) => {
    const key = response.applicationId || response.jobId;
    if (!acc[key]) {
      acc[key] = {
        applicationId: response.applicationId || response.jobId,
        jobId: response.jobId,
        jobTitle: response.jobTitle,
        responses: [],
        lastActivityDate: response.responseDate,
        responseCounts: {
          offer_accepted: 0,
          offer_rejected: 0,
          interview_confirmed: 0,
          interview_cancelled: 0
        }
      };
    }
    acc[key].responses.push(response);
    if (response.responseType in acc[key].responseCounts) {
      const responseType = response.responseType as 'offer_accepted' | 'offer_rejected' | 'interview_confirmed' | 'interview_cancelled';
      acc[key].responseCounts[responseType]++;
    }
    if (new Date(response.responseDate) > new Date(acc[key].lastActivityDate)) {
      acc[key].lastActivityDate = response.responseDate;
    }
    return acc;
  }, {});

  const groupedResponseApplications = Object.values(groupedResponsesByApplication) as any[];

  // Filter grouped applications
  const filteredGroupedApplications = groupedApplications.filter((group: any) => {
    const matchesSearch = searchTerm === '' ||
      group.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredGroupedResponses = groupedResponseApplications.filter((group: any) => {
    const matchesSearch = searchTerm === '' ||
      group.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(
    (activeTab === 'actions' ? filteredGroupedApplications.length : filteredGroupedResponses.length) / itemsPerPage
  );
  const paginatedData = activeTab === 'actions'
    ? filteredGroupedApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredGroupedResponses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Stats
  const stats = {
    totalActions: employerActions.length,
    totalResponses: candidateResponses.length,
    interviewsScheduled: employerActions.filter(a => a.actionType === 'interview').length,
    candidatesSelected: employerActions.filter(a => a.actionType === 'select').length,
    offersAccepted: candidateResponses.filter(r => r.responseType === 'offer_accepted').length,
    offersRejected: candidateResponses.filter(r => r.responseType === 'offer_rejected').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employer & Candidate Tracking</h1>
          <p className="text-gray-600 mt-1">Track all employer actions and candidate responses</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalActions}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalResponses}</p>
            </div>
            <Mail className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Interviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.interviewsScheduled}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Selected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.candidatesSelected}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Offers Accepted</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.offersAccepted}</p>
            </div>
            <Award className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Offers Rejected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.offersRejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('overview'); setCurrentPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#114373] text-[#114373]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab('actions'); setCurrentPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'actions'
                  ? 'border-[#114373] text-[#114373]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Employer Actions ({employerActions.length})
            </button>
            <button
              onClick={() => { setActiveTab('responses'); setCurrentPage(1); }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'responses'
                  ? 'border-[#114373] text-[#114373]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Candidate Responses ({candidateResponses.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                />
              </div>
            </div>
            {activeTab === 'actions' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Job Postings</h3>
                  <Link 
                    href="/admin/employer-tracking?tab=actions"
                    className="text-sm text-[#114373] hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {groupedApplications.slice(0, 5).map((group: any) => (
                    <Link
                      key={group.applicationId}
                      href={`/admin/employer-tracking/${group.applicationId}`}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#114373] hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{group.jobTitle}</p>
                          <p className="text-sm text-gray-600 truncate">{group.employerName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              {group.actions.length} {group.actions.length === 1 ? 'action' : 'actions'}
                            </span>
                            {group.actionCounts.interview > 0 && (
                              <span className="text-xs text-purple-600">• {group.actionCounts.interview} interview{group.actionCounts.interview !== 1 ? 's' : ''}</span>
                            )}
                            {group.actionCounts.select > 0 && (
                              <span className="text-xs text-green-600">• {group.actionCounts.select} selected</span>
                            )}
                            {group.actionCounts.offer_sent > 0 && (
                              <span className="text-xs text-blue-600">• {group.actionCounts.offer_sent} offer{group.actionCounts.offer_sent !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(group.lastActivityDate)}</span>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                  {groupedApplications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No job postings with actions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              {paginatedData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No job postings with actions found</p>
                </div>
              ) : (
                paginatedData.map((group: any) => (
                  <Link
                    key={group.applicationId}
                    href={`/admin/employer-tracking/${group.applicationId}`}
                    className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#114373] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 text-lg">{group.jobTitle}</h4>
                          <p className="text-sm text-gray-600 mb-3">{group.employerName}</p>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {group.actionCounts.interview > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {group.actionCounts.interview} Interview{group.actionCounts.interview !== 1 ? 's' : ''}
                              </span>
                            )}
                            {group.actionCounts.select > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {group.actionCounts.select} Selected
                              </span>
                            )}
                            {group.actionCounts.reject > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {group.actionCounts.reject} Rejected
                              </span>
                            )}
                            {group.actionCounts.offer_sent > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {group.actionCounts.offer_sent} Offer{group.actionCounts.offer_sent !== 1 ? 's' : ''} Sent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Total: {group.actions.length} {group.actions.length === 1 ? 'action' : 'actions'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(group.lastActivityDate)}</span>
                        <button className="text-[#114373] hover:text-[#0d3559] p-1 rounded hover:bg-gray-100">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'responses' && (
            <div className="space-y-4">
              {paginatedData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No job postings with candidate responses found</p>
                </div>
              ) : (
                paginatedData.map((group: any) => (
                  <Link
                    key={group.applicationId}
                    href={`/admin/employer-tracking/${group.applicationId}`}
                    className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-[#114373] hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mail className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1 text-lg">{group.jobTitle}</h4>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {group.responseCounts.offer_accepted > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {group.responseCounts.offer_accepted} Accepted
                              </span>
                            )}
                            {group.responseCounts.offer_rejected > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {group.responseCounts.offer_rejected} Rejected
                              </span>
                            )}
                            {group.responseCounts.interview_confirmed > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {group.responseCounts.interview_confirmed} Confirmed
                              </span>
                            )}
                            {group.responseCounts.interview_cancelled > 0 && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {group.responseCounts.interview_cancelled} Cancelled
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Total: {group.responses.length} {group.responses.length === 1 ? 'response' : 'responses'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(group.lastActivityDate)}</span>
                        <button className="text-[#114373] hover:text-[#0d3559] p-1 rounded hover:bg-gray-100">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 inline mr-2" />
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
                <ChevronRight className="w-4 h-4 inline ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

