'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Download,
  Upload,
  Plus,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  Award,
  MapPin,
  GraduationCap,
  Briefcase,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Info,
  Target,
  Zap,
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
  Users,
  Building2,
  DollarSign,
  Shield,
  MessageSquare,
  Globe,
  BookOpen,
  User,
  ThumbsUp,
  ThumbsDown,
  Send,
  Save,
  Play,
  Pause,
  Square as SquareIcon,
  CheckSquare as CheckSquareIcon,
  XCircle as XCircleIcon,
  ArrowRight,
  ArrowLeft,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Bell as BellIcon,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon,
  Target as TargetIcon2,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  AlertTriangle,
  CheckSquare,
  Square,
  Video,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  CreditCard,
  Receipt,
  FileCheck,
  FileX,
  Timer,
  CheckCircle2
} from 'lucide-react';

interface OfferLetter {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  offerAmount: string;
  startDate: string;
  positionTitle: string;
  offerFileUrl: string;
  status: 'sent' | 'accepted' | 'rejected' | 'expired';
  candidateResponse?: 'accepted' | 'rejected';
  rejectionReason?: string;
  responseDate?: string;
  expiryDate: string;
  createdAt: string;
  payment?: {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amount: string;
    paymentDate?: string;
    paymentLink?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: 'generated' | 'sent' | 'paid' | 'overdue';
    amount: string;
    generatedDate: string;
  };
}

export default function OfferLetterManagement() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilterState, setStatusFilterState] = useState(statusFilter || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseAction, setResponseAction] = useState<'accept' | 'reject'>('accept');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load offer letters
  useEffect(() => {
    loadOfferLetters();
  }, []);

  const loadOfferLetters = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app, fetch from API
      const mockOffers: OfferLetter[] = [
        {
          id: '1',
          applicationId: 'a1',
          candidateId: 'c1',
          candidateName: 'John Doe',
          candidateEmail: 'john.doe@email.com',
          jobTitle: 'Senior Software Engineer',
          companyName: 'Tech Corp',
          offerAmount: '$120,000',
          startDate: '2024-02-15',
          positionTitle: 'Senior Software Engineer',
          offerFileUrl: '/offers/john-doe-offer.pdf',
          status: 'sent',
          expiryDate: '2024-02-10',
          createdAt: '2024-01-30T10:00:00Z'
        },
        {
          id: '2',
          applicationId: 'a2',
          candidateId: 'c2',
          candidateName: 'Sarah Johnson',
          candidateEmail: 'sarah.j@email.com',
          jobTitle: 'Full Stack Developer',
          companyName: 'Startup Inc',
          offerAmount: '$95,000',
          startDate: '2024-02-20',
          positionTitle: 'Full Stack Developer',
          offerFileUrl: '/offers/sarah-johnson-offer.pdf',
          status: 'accepted',
          candidateResponse: 'accepted',
          responseDate: '2024-01-31T14:30:00Z',
          expiryDate: '2024-02-05',
          createdAt: '2024-01-28T16:00:00Z',
          payment: {
            id: 'p1',
            status: 'pending',
            amount: '$9,500',
            paymentLink: 'https://payment.axia.com/pay/p1'
          }
        },
        {
          id: '3',
          applicationId: 'a3',
          candidateId: 'c3',
          candidateName: 'Mike Chen',
          candidateEmail: 'mike.chen@email.com',
          jobTitle: 'React Developer',
          companyName: 'Digital Agency',
          offerAmount: '$85,000',
          startDate: '2024-02-25',
          positionTitle: 'React Developer',
          offerFileUrl: '/offers/mike-chen-offer.pdf',
          status: 'rejected',
          candidateResponse: 'rejected',
          rejectionReason: 'Salary expectations not met',
          responseDate: '2024-01-29T09:15:00Z',
          expiryDate: '2024-02-03',
          createdAt: '2024-01-27T11:30:00Z'
        },
        {
          id: '4',
          applicationId: 'a4',
          candidateId: 'c4',
          candidateName: 'Emily Rodriguez',
          candidateEmail: 'emily.r@email.com',
          jobTitle: 'UI/UX Designer',
          companyName: 'Design Studio',
          offerAmount: '$75,000',
          startDate: '2024-03-01',
          positionTitle: 'UI/UX Designer',
          offerFileUrl: '/offers/emily-rodriguez-offer.pdf',
          status: 'accepted',
          candidateResponse: 'accepted',
          responseDate: '2024-01-30T16:45:00Z',
          expiryDate: '2024-02-08',
          createdAt: '2024-01-29T14:20:00Z',
          payment: {
            id: 'p2',
            status: 'completed',
            amount: '$7,500',
            paymentDate: '2024-01-31T10:30:00Z'
          },
          invoice: {
            id: 'i1',
            invoiceNumber: 'INV-2024-001',
            status: 'paid',
            amount: '$7,500',
            generatedDate: '2024-01-31T10:35:00Z'
          }
        }
      ];

      setOfferLetters(mockOffers);
    } catch (error) {
      console.error('Error loading offer letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'expired': return <Timer className="w-4 h-4" />;
      default: return <Send className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOfferResponse = async (offerId: string, response: 'accept' | 'reject', reason?: string) => {
    try {
      // Update offer status
      setOfferLetters(prev => prev.map(offer => 
        offer.id === offerId 
          ? { 
              ...offer, 
              status: response === 'accept' ? 'accepted' : 'rejected',
              candidateResponse: response === 'accept' ? 'accepted' : 'rejected',
              rejectionReason: reason,
              responseDate: new Date().toISOString()
            }
          : offer
      ));

      // If accepted, create payment record
      if (response === 'accept') {
        const offer = offerLetters.find(o => o.id === offerId);
        if (offer) {
          const commissionAmount = Math.round(parseInt(offer.offerAmount.replace(/[$,]/g, '')) * 0.1);
          setOfferLetters(prev => prev.map(o => 
            o.id === offerId 
              ? { 
                  ...o, 
                  payment: {
                    id: `p${Date.now()}`,
                    status: 'pending',
                    amount: `$${commissionAmount.toLocaleString()}`,
                    paymentLink: `https://payment.axia.com/pay/p${Date.now()}`
                  }
                }
              : o
          ));
        }
      }

      // Close modal
      setShowResponseModal(false);
      setSelectedOffer(null);
    } catch (error) {
      console.error('Error processing offer response:', error);
    }
  };

  const handlePaymentCompletion = async (offerId: string) => {
    try {
      // Update payment status
      setOfferLetters(prev => prev.map(offer => 
        offer.id === offerId && offer.payment
          ? { 
              ...offer, 
              payment: {
                ...offer.payment,
                status: 'completed',
                paymentDate: new Date().toISOString()
              },
              invoice: {
                id: `i${Date.now()}`,
                invoiceNumber: `INV-${Date.now()}`,
                status: 'generated',
                amount: offer.payment.amount,
                generatedDate: new Date().toISOString()
              }
            }
          : offer
      ));

      // Close modal
      setShowPaymentModal(false);
      setSelectedOffer(null);
    } catch (error) {
      console.error('Error completing payment:', error);
    }
  };

  const filteredOffers = offerLetters.filter(offer => {
    if (statusFilterState !== 'all' && offer.status !== statusFilterState) return false;
    if (searchTerm && !offer.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !offer.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !offer.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !offer.companyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const offersPerPage = 10;
  const totalPages = Math.ceil(filteredOffers.length / offersPerPage);
  const startIndex = (currentPage - 1) * offersPerPage;
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + offersPerPage);

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Offer Letter Management</h1>
          <p className="text-base sm:text-lg text-gray-600">Manage offer letters, candidate responses, and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/application-management"
            className="inline-flex items-center px-4 py-2 text-sm bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Send Offer Letter
          </Link>
          <button 
            onClick={loadOfferLetters}
            className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sent Offers</p>
              <p className="text-2xl font-bold text-gray-900">{offerLetters.filter(o => o.status === 'sent').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-bold text-gray-900">{offerLetters.filter(o => o.status === 'accepted').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{offerLetters.filter(o => o.payment?.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Receipt className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{offerLetters.filter(o => o.payment?.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilterState}
              onChange={(e) => setStatusFilterState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount">Offer Amount</option>
              <option value="expiry">Expiry Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Offer Letters ({filteredOffers.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedOffers.length === paginatedOffers.length && paginatedOffers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOffers(paginatedOffers.map(offer => offer.id));
                      } else {
                        setSelectedOffers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOffers.includes(offer.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOffers(prev => [...prev, offer.id]);
                        } else {
                          setSelectedOffers(prev => prev.filter(id => id !== offer.id));
                        }
                      }}
                      className="rounded border-gray-300 text-[#114373] focus:ring-[#114373]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{offer.candidateName}</div>
                        <div className="text-sm text-gray-500">{offer.candidateEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{offer.jobTitle}</div>
                      <div className="text-sm text-gray-500">{offer.companyName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{offer.offerAmount}</div>
                    <div className="text-sm text-gray-500">Start: {new Date(offer.startDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                      {getStatusIcon(offer.status)}
                      <span className="ml-1">{offer.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {offer.payment ? (
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(offer.payment.status)}`}>
                          {offer.payment.status}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">{offer.payment.amount}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(offer.expiryDate).toLocaleDateString()}</div>
                    {isExpired(offer.expiryDate) && offer.status === 'sent' && (
                      <div className="text-xs text-red-600 font-medium">Expired</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setShowOfferModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {offer.status === 'sent' && !isExpired(offer.expiryDate) && (
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowResponseModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Respond to Offer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      {offer.payment?.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowPaymentModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Process Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      
                      <a
                        href={offer.offerFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                        title="Download Offer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + offersPerPage, filteredOffers.length)} of {filteredOffers.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Offer Details Modal */}
      {showOfferModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Offer Letter Details</h2>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setSelectedOffer(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900">{selectedOffer.candidateName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Email:</span>
                      <p className="text-sm text-gray-900">{selectedOffer.candidateEmail}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Position:</span>
                      <p className="text-sm text-gray-900">{selectedOffer.positionTitle}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Company:</span>
                      <p className="text-sm text-gray-900">{selectedOffer.companyName}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Offer Amount:</span>
                      <p className="text-sm text-gray-900 font-semibold">{selectedOffer.offerAmount}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedOffer.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Expiry Date:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedOffer.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getStatusColor(selectedOffer.status)}`}>
                        {getStatusIcon(selectedOffer.status)}
                        <span className="ml-1">{selectedOffer.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedOffer.candidateResponse && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Response</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOffer.status)}`}>
                        {selectedOffer.candidateResponse}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedOffer.responseDate && new Date(selectedOffer.responseDate).toLocaleString()}
                      </span>
                    </div>
                    {selectedOffer.rejectionReason && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Reason:</span> {selectedOffer.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedOffer.payment && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-blue-800">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${getPaymentStatusColor(selectedOffer.payment.status)}`}>
                          {selectedOffer.payment.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Amount:</span>
                        <span className="ml-2 text-sm text-blue-700">{selectedOffer.payment.amount}</span>
                      </div>
                      {selectedOffer.payment.paymentDate && (
                        <div>
                          <span className="text-sm font-medium text-blue-800">Payment Date:</span>
                          <span className="ml-2 text-sm text-blue-700">{new Date(selectedOffer.payment.paymentDate).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOffer.payment.paymentLink && (
                        <div>
                          <span className="text-sm font-medium text-blue-800">Payment Link:</span>
                          <a href={selectedOffer.payment.paymentLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-blue-600 hover:text-blue-800">
                            View Payment Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedOffer.invoice && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-green-800">Invoice Number:</span>
                        <span className="ml-2 text-sm text-green-700">{selectedOffer.invoice.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Status:</span>
                        <span className="ml-2 text-sm text-green-700">{selectedOffer.invoice.status}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Amount:</span>
                        <span className="ml-2 text-sm text-green-700">{selectedOffer.invoice.amount}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Generated:</span>
                        <span className="ml-2 text-sm text-green-700">{new Date(selectedOffer.invoice.generatedDate).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Respond to Offer</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedOffer.candidateName} - {selectedOffer.jobTitle}</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Response</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="accept"
                      checked={responseAction === 'accept'}
                      onChange={(e) => setResponseAction(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Accept Offer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reject"
                      checked={responseAction === 'reject'}
                      onChange={(e) => setResponseAction(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Reject Offer</span>
                  </label>
                </div>
              </div>
              
              {responseAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    placeholder="Please provide a reason for rejecting this offer..."
                    required
                  />
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedOffer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOfferResponse(selectedOffer.id, responseAction, rejectionReason)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors"
                >
                  {responseAction === 'accept' ? 'Accept Offer' : 'Reject Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOffer && selectedOffer.payment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedOffer.candidateName} - {selectedOffer.jobTitle}</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <input
                  type="text"
                  value={selectedOffer.payment.amount}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedOffer.payment.paymentLink || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      if (selectedOffer.payment?.paymentLink) {
                        window.open(selectedOffer.payment.paymentLink, '_blank');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Once payment is completed, an invoice will be automatically generated.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOffer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePaymentCompletion(selectedOffer.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#114373] border border-transparent rounded-lg hover:bg-[#0d3559] transition-colors"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
