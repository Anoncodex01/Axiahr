'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Building2,
  MapPin,
  Video,
  Phone,
  Users,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  MessageCircle,
  Mail,
  Download,
  RefreshCw,
  Bell,
  Settings,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  FileText,
  Award,
  Target,
  Zap,
  Info,
  Shield,
  DollarSign,
  MessageSquare,
  Globe,
  BookOpen,
  Sparkles,
  X,
  LayoutDashboard,
  ClipboardList,
  Building,
  GraduationCap,
  Briefcase,
  Clock as ClockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Eye as EyeIcon,
  MessageCircle as MessageCircleIcon,
  Mail as MailIcon,
  Download as DownloadIcon,
  RefreshCw as RefreshCwIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
  Share2 as Share2Icon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  Activity as ActivityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FileText as FileTextIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Info as InfoIcon,
  Shield as ShieldIcon,
  DollarSign as DollarSignIcon,
  MessageSquare as MessageSquareIcon,
  Globe as GlobeIcon,
  BookOpen as BookOpenIcon,
  Sparkles as SparklesIcon,
  X as XIcon,
  LayoutDashboard as LayoutDashboardIcon,
  ClipboardList as ClipboardListIcon,
  Building as BuildingIcon,
  GraduationCap as GraduationCapIcon,
  Briefcase as BriefcaseIcon
} from 'lucide-react';

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  type: 'in-person' | 'video' | 'phone';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  notes?: string;
  evaluation?: {
    technicalScore: number;
    communicationScore: number;
    culturalFitScore: number;
    overallScore: number;
    feedback: string;
    recommendation: 'hire' | 'no-hire' | 'maybe';
  };
  createdAt: string;
  updatedAt: string;
}

export default function InterviewManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInterviews, setSelectedInterviews] = useState<string[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [evaluationData, setEvaluationData] = useState({
    technicalScore: 0,
    communicationScore: 0,
    culturalFitScore: 0,
    feedback: '',
    recommendation: 'maybe' as 'hire' | 'no-hire' | 'maybe'
  });
  const itemsPerPage = 10;

  // Mock data - in real app, this would come from API
  const interviews: Interview[] = [
    {
      id: '1',
      candidateId: '1',
      candidateName: 'John Doe',
      candidateEmail: 'john.doe@email.com',
      candidatePhone: '+1 (555) 123-4567',
      jobId: '1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      interviewerId: '1',
      interviewerName: 'Sarah Johnson',
      interviewerEmail: 'sarah.johnson@techcorp.com',
      scheduledDate: '2024-01-25',
      scheduledTime: '10:00',
      duration: 60,
      type: 'video',
      meetingLink: 'https://meet.google.com/abc-def-ghi',
      status: 'scheduled',
      notes: 'Technical interview focusing on React and Node.js',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      candidateId: '2',
      candidateName: 'Jane Smith',
      candidateEmail: 'jane.smith@email.com',
      candidatePhone: '+1 (555) 987-6543',
      jobId: '2',
      jobTitle: 'Product Manager',
      companyName: 'Tech Corp',
      interviewerId: '2',
      interviewerName: 'Mike Chen',
      interviewerEmail: 'mike.chen@techcorp.com',
      scheduledDate: '2024-01-24',
      scheduledTime: '14:00',
      duration: 90,
      type: 'in-person',
      location: 'Tech Corp Office, Conference Room A',
      status: 'completed',
      notes: 'Product strategy and leadership discussion',
      evaluation: {
        technicalScore: 8,
        communicationScore: 9,
        culturalFitScore: 8,
        overallScore: 8.3,
        feedback: 'Excellent candidate with strong product vision and leadership skills.',
        recommendation: 'hire'
      },
      createdAt: '2024-01-19',
      updatedAt: '2024-01-24'
    },
    {
      id: '3',
      candidateId: '3',
      candidateName: 'Mike Johnson',
      candidateEmail: 'mike.johnson@email.com',
      candidatePhone: '+1 (555) 456-7890',
      jobId: '1',
      jobTitle: 'Senior Software Engineer',
      companyName: 'Tech Corp',
      interviewerId: '1',
      interviewerName: 'Sarah Johnson',
      interviewerEmail: 'sarah.johnson@techcorp.com',
      scheduledDate: '2024-01-23',
      scheduledTime: '15:30',
      duration: 60,
      type: 'phone',
      status: 'cancelled',
      notes: 'Candidate cancelled due to personal emergency',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-23'
    }
  ];

  const stats = [
    { title: 'Total Interviews', value: interviews.length, color: 'bg-blue-500' },
    { title: 'Scheduled', value: interviews.filter(i => i.status === 'scheduled').length, color: 'bg-yellow-500' },
    { title: 'Completed', value: interviews.filter(i => i.status === 'completed').length, color: 'bg-green-500' },
    { title: 'Cancelled', value: interviews.filter(i => i.status === 'cancelled').length, color: 'bg-red-500' },
    { title: 'This Week', value: interviews.filter(i => {
      const interviewDate = new Date(i.scheduledDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return interviewDate >= today && interviewDate <= weekFromNow;
    }).length, color: 'bg-purple-500' },
    { title: 'Pending Evaluation', value: interviews.filter(i => i.status === 'completed' && !i.evaluation).length, color: 'bg-orange-500' }
  ];

  const handleSelectInterview = (interviewId: string) => {
    setSelectedInterviews(prev => 
      prev.includes(interviewId) 
        ? prev.filter(id => id !== interviewId)
        : [...prev, interviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInterviews.length === interviews.length) {
      setSelectedInterviews([]);
    } else {
      setSelectedInterviews(interviews.map(i => i.id));
    }
  };

  const handleEvaluateInterview = (interview: any) => {
    setSelectedInterview(interview);
    setEvaluationData({
      technicalScore: 0,
      communicationScore: 0,
      culturalFitScore: 0,
      feedback: '',
      recommendation: 'maybe'
    });
    setShowEvaluationModal(true);
  };

  const handleSubmitEvaluation = () => {
    if (!selectedInterview) return;
    
    const overallScore = (evaluationData.technicalScore + evaluationData.communicationScore + evaluationData.culturalFitScore) / 3;
    
    // In real app, this would make an API call
    console.log(`Evaluating interview ${selectedInterview.id}`, {
      ...evaluationData,
      overallScore: Math.round(overallScore * 10) / 10
    });
    
    setShowEvaluationModal(false);
    setSelectedInterview(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'in-person': return <MapPin className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.interviewerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesType = typeFilter === 'all' || interview.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      const interviewDate = new Date(interview.scheduledDate);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = interviewDate.toDateString() === today.toDateString();
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          matchesDate = interviewDate.toDateString() === tomorrow.toDateString();
          break;
        case 'this-week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDate = interviewDate >= today && interviewDate <= weekFromNow;
          break;
        case 'this-month':
          matchesDate = interviewDate.getMonth() === today.getMonth() && interviewDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
          <p className="text-lg text-gray-600">Schedule, manage, and evaluate candidate interviews</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[#114373] text-white rounded-xl hover:bg-[#0f3a5f] transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Schedule Interview
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
            <Download className="w-5 h-5 mr-2" />
            Export Interviews
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Interviews</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by candidate, interviewer, or job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interviews Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Interviews</h2>
              <span className="text-sm text-gray-500">{filteredInterviews.length} interviews</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Filter className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {selectedInterviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedInterviews.length} selected</span>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                    Bulk Actions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedInterviews.length === interviews.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Interviewer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInterviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedInterviews.includes(interview.id)}
                      onChange={() => handleSelectInterview(interview.id)}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{interview.candidateName}</div>
                        <div className="text-sm text-gray-500">{interview.candidateEmail}</div>
                        <div className="text-xs text-gray-400">{interview.candidatePhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{interview.jobTitle}</div>
                      <div className="text-sm text-gray-500">{interview.companyName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{interview.interviewerName}</div>
                      <div className="text-sm text-gray-500">{interview.interviewerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{formatDate(interview.scheduledDate)}</div>
                      <div className="text-sm text-gray-500">{formatTime(interview.scheduledTime)}</div>
                      <div className="text-xs text-gray-400">{interview.duration} min</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(interview.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{interview.type}</span>
                    </div>
                    {interview.location && (
                      <div className="text-xs text-gray-500 mt-1">{interview.location}</div>
                    )}
                    {interview.meetingLink && (
                      <div className="text-xs text-blue-600 mt-1">
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1">
                      {interview.status === 'completed' && !interview.evaluation && (
                        <button
                          onClick={() => handleEvaluateInterview(interview)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Evaluate Interview"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Interview">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-[#114373] rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Interview">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-semibold">1</span> to <span className="font-semibold">{filteredInterviews.length}</span> of{' '}
          <span className="font-semibold">{interviews.length}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="px-3 py-2 bg-[#114373] text-white rounded-lg font-semibold">1</button>
          <button className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">2</button>
          <button className="px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">3</button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interview Evaluation Modal */}
      {showEvaluationModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Interview Evaluation</h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Candidate: <span className="font-semibold">{selectedInterview.candidateName}</span></p>
                <p className="text-sm text-gray-600 mb-2">Job: <span className="font-semibold">{selectedInterview.jobTitle}</span></p>
                <p className="text-sm text-gray-600">Interviewer: <span className="font-semibold">{selectedInterview.interviewerName}</span></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Technical Skills (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationData.technicalScore}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, technicalScore: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Communication (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationData.communicationScore}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, communicationScore: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cultural Fit (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={evaluationData.culturalFitScore}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, culturalFitScore: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Recommendation</label>
                <select
                  value={evaluationData.recommendation}
                  onChange={(e) => setEvaluationData(prev => ({ ...prev, recommendation: e.target.value as 'hire' | 'no-hire' | 'maybe' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                >
                  <option value="maybe">Maybe</option>
                  <option value="hire">Hire</option>
                  <option value="no-hire">No Hire</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Feedback</label>
                <textarea
                  value={evaluationData.feedback}
                  onChange={(e) => setEvaluationData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="Provide detailed feedback about the candidate's performance..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEvaluation}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Submit Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
