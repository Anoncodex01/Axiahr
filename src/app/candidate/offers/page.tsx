'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CandidateLayout from '@/components/CandidateLayout';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Star,
  MapPin,
  User,
  Briefcase,
  Download,
  Eye
} from 'lucide-react';

interface Offer {
  id: string;
  applicationId: string;
  employerId: string;
  status: 'issued' | 'accepted' | 'rejected';
  title: string;
  body: string;
  salary?: string;
  startDate?: string;
  createdAt: string;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
  companyLocation?: string;
}

export default function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [banner, setBanner] = useState<string>('');
  const [bannerType, setBannerType] = useState<'success' | 'error' | 'info'>('success');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingOfferId, setRejectingOfferId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOfferLetters();
  }, []);

  const fetchOfferLetters = async () => {
    try {
      const token = localStorage.getItem('candidateAuthToken') || localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      const response = await fetch('/api/candidates/offer-letters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.offerLetters) {
        // Map API data to Offer interface
        const mappedOffers = data.offerLetters.map((offer: any) => ({
          id: offer.id,
          applicationId: offer.applicationId,
          employerId: '', // Not provided in API
          status: offer.status === 'sent' ? 'issued' as const : 
                 offer.status === 'accepted' ? 'accepted' as const : 
                 offer.status === 'rejected' ? 'rejected' as const : 'issued' as const,
          title: `Employment Offer - ${offer.positionTitle || offer.jobTitle}`,
          body: `Offer for ${offer.positionTitle || offer.jobTitle} position.`,
          salary: offer.offerAmount || 'Not specified',
          startDate: offer.startDate || '',
          createdAt: offer.createdAt,
          candidateName: '', // Not needed for candidate view
          jobTitle: offer.jobTitle,
          companyName: '', // Not provided (as per requirements)
          companyLocation: offer.jobLocation || '',
          // Additional fields from API
          offerFileUrl: offer.offerFileUrl,
          expiryDate: offer.expiryDate,
          candidateResponse: offer.candidateResponse,
          rejectionReason: offer.rejectionReason
        }));
        setOffers(mappedOffers);
      }
    } catch (error) {
      console.error('Error fetching offer letters:', error);
      // Fallback to localStorage if API fails
      try {
        const storedOffers = JSON.parse(localStorage.getItem('offers') || '[]');
        if (storedOffers.length > 0) {
          setOffers(storedOffers);
        }
      } catch {}
    }
  };

  const saveOffers = (data: Offer[]) => {
    setOffers(data);
    localStorage.setItem('offers', JSON.stringify(data));
  };

  const accept = async (id: string) => {
    try {
      setLoading(id);
      const token = localStorage.getItem('candidateAuthToken') || localStorage.getItem('authToken');
      if (!token) {
        setBanner('Please login to accept offers.');
        setBannerType('error');
        setTimeout(() => setBanner(''), 5000);
        return;
      }

      // Call API to accept the offer
      const response = await fetch(`/api/offer-letters?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          response: 'accepted'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept offer');
      }

      // Update local state
      const updated = offers.map(o => o.id === id ? { ...o, status: 'accepted' as const, candidateResponse: 'accepted' } : o);
      setOffers(updated);
      saveOffers(updated);
      
      setBanner('🎉 Congratulations! Offer accepted. Employer has been notified.');
      setBannerType('success');
      setTimeout(() => setBanner(''), 5000);

      // Refresh offer letters from API
      await fetchOfferLetters();
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      setBanner(error.message || 'Failed to accept offer. Please try again.');
      setBannerType('error');
      setTimeout(() => setBanner(''), 5000);
    } finally {
      setLoading(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingOfferId(id);
    setRejectReason('');
    setAdditionalComments('');
    setShowRejectModal(true);
  };

  const reject = async () => {
    if (!rejectingOfferId) return;
    
    if (!rejectReason.trim()) {
      setBanner('Please provide a reason for rejecting the offer.');
      setBannerType('error');
      setTimeout(() => setBanner(''), 5000);
      return;
    }

    try {
      setLoading(rejectingOfferId);
      const token = localStorage.getItem('candidateAuthToken') || localStorage.getItem('authToken');
      if (!token) {
        setBanner('Please login to reject offers.');
        setBannerType('error');
        setTimeout(() => setBanner(''), 5000);
        return;
      }

      // Call API to reject the offer
      const response = await fetch(`/api/offer-letters?id=${rejectingOfferId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          response: 'rejected',
          rejectionReason: rejectReason.trim() + (additionalComments.trim() ? `\n\nAdditional Comments: ${additionalComments.trim()}` : '')
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject offer');
      }

      // Update local state
      const updated = offers.map(o => o.id === rejectingOfferId ? { 
        ...o, 
        status: 'rejected' as const, 
        candidateResponse: 'rejected',
        rejectionReason: rejectReason.trim()
      } : o);
      setOffers(updated);
      saveOffers(updated);
      
      setShowRejectModal(false);
      setRejectingOfferId(null);
      setRejectReason('');
      setAdditionalComments('');
      
      setBanner('Offer rejected. Admin and employer have been notified.');
      setBannerType('info');
      setTimeout(() => setBanner(''), 5000);

      // Refresh offer letters from API
      await fetchOfferLetters();
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
      setBanner(error.message || 'Failed to reject offer. Please try again.');
      setBannerType('error');
      setTimeout(() => setBanner(''), 5000);
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <CandidateLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Employment Offers</h1>
              <p className="text-gray-600 mt-2">Review and respond to employment offers from companies</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/candidate/applications" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                My Applications
              </Link>
              <Link 
                href="/candidate/dashboard" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div className={`mb-6 p-4 rounded-lg border ${
            bannerType === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            bannerType === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {bannerType === 'success' && <CheckCircle className="w-5 h-5" />}
              {bannerType === 'error' && <XCircle className="w-5 h-5" />}
              {bannerType === 'info' && <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{banner}</span>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Offers</p>
                <p className="text-2xl font-bold text-gray-900">{offers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{offers.filter(o => o.status === 'issued').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{offers.filter(o => o.status === 'accepted').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{offers.filter(o => o.status === 'rejected').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {offers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers received yet</h3>
              <p className="text-gray-600 mb-4">Employment offers will appear here once companies extend them to you.</p>
              <Link
                href="/candidate/applications"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                View My Applications
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {offers.map(offer => (
                <div key={offer.id} className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{offer.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(offer.status)}`}>
                          {getStatusIcon(offer.status)}
                          <span className="ml-2 capitalize">{offer.status}</span>
                        </span>
                      </div>
                      
                      {/* Company Info */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{offer.companyName || 'Company'}</span>
                        </div>
                        {offer.companyLocation && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{offer.companyLocation}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Received {formatDate(offer.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Offer Letter */}
                    <div className="lg:col-span-2">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Offer Letter</h4>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offer.body}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Offer Terms */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Offer Terms</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Annual Salary</p>
                              <p className="text-lg font-bold text-blue-900">{offer.salary || 'To be discussed'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Start Date</p>
                              <p className="text-lg font-bold text-green-900">
                                {offer.startDate ? formatDate(offer.startDate) : 'To be discussed'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">Position</p>
                              <p className="text-lg font-bold text-purple-900">{offer.jobTitle || 'Position'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {offer.status === 'issued' && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="space-y-3">
                            <button
                              onClick={() => accept(offer.id)}
                              disabled={loading === offer.id}
                              className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              {loading === offer.id ? 'Processing...' : 'Accept Offer'}
                            </button>
                            <button
                              onClick={() => openRejectModal(offer.id)}
                              className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-5 h-5 mr-2" />
                              Reject Offer
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-3 text-center">
                            Please review the offer carefully before making your decision.
                          </p>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-green-900">Offer Accepted</p>
                            <p className="text-xs text-gray-500 mt-1">Congratulations! You've accepted this offer.</p>
                          </div>
                        </div>
                      )}

                      {offer.status === 'rejected' && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <p className="text-sm font-medium text-red-900">Offer Rejected</p>
                            <p className="text-xs text-gray-500 mt-1">You have declined this offer.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Offer Modal */}
        {showRejectModal && rejectingOfferId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Reject Offer</h3>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectingOfferId(null);
                      setRejectReason('');
                      setAdditionalComments('');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Please provide a reason for rejecting this offer. This feedback will help the employer understand your decision and may improve future opportunities.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Rejection *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    >
                      <option value="">Select a reason...</option>
                      <option value="salary_too_low">Salary is too low</option>
                      <option value="location_not_suitable">Location is not suitable</option>
                      <option value="found_better_opportunity">Found a better opportunity</option>
                      <option value="company_culture">Company culture doesn't fit</option>
                      <option value="job_responsibilities">Job responsibilities don't match expectations</option>
                      <option value="career_growth">Limited career growth opportunities</option>
                      <option value="work_life_balance">Work-life balance concerns</option>
                      <option value="benefits_package">Benefits package is insufficient</option>
                      <option value="timing_issues">Timing doesn't work for me</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Comments (Optional)
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please provide any additional details about your decision..."
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectingOfferId(null);
                    setRejectReason('');
                    setAdditionalComments('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={reject}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Offer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Important Information</p>
              <p className="text-sm text-blue-700 mt-1">
                Once you accept an offer, the employer will be notified and invoiced. If you reject an offer, please provide a reason to help improve future opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
