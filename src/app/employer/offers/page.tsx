'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit, 
  Save, 
  X,
  Plus,
  Eye,
  Send,
  AlertCircle
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
}

export default function EmployerOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, { reason: string; additionalComments?: string }>>({});
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({
    title: '',
    body: '',
    salary: '',
    startDate: '',
    applicationId: '',
    candidateName: '',
    jobTitle: '',
    companyName: ''
  });

  useEffect(() => {
    try { 
      const storedOffers = JSON.parse(localStorage.getItem('offers') || '[]');
      
      // If no offers exist, add some sample data
      if (storedOffers.length === 0) {
        const sampleOffers = [
          {
            id: 'offer-1',
            applicationId: '1',
            employerId: 'demo-employer',
            status: 'issued' as const,
            title: 'Employment Offer - Senior Software Engineer',
            body: 'Dear Candidate,\n\nWe are pleased to offer you the position of Senior Software Engineer at our company. We were impressed by your technical skills and experience during the interview process.\n\nWe believe you will be a valuable addition to our team and look forward to working with you.\n\nBest regards,\nHiring Team',
            salary: '$120,000',
            startDate: '2024-02-15',
            createdAt: new Date().toISOString(),
            candidateName: 'John Doe',
            jobTitle: 'Senior Software Engineer',
            companyName: 'Tech Corp'
          },
          {
            id: 'offer-2',
            applicationId: '2',
            employerId: 'demo-employer',
            status: 'accepted' as const,
            title: 'Employment Offer - Product Manager',
            body: 'Dear Candidate,\n\nCongratulations! We are excited to offer you the position of Product Manager. Your strategic thinking and leadership skills stood out during our discussions.\n\nWe are confident you will drive our product vision forward.\n\nWelcome to the team!\n\nBest regards,\nHiring Team',
            salary: '$95,000',
            startDate: '2024-02-01',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            candidateName: 'Sarah Johnson',
            jobTitle: 'Product Manager',
            companyName: 'Tech Corp'
          },
          {
            id: 'offer-3',
            applicationId: '3',
            employerId: 'demo-employer',
            status: 'rejected' as const,
            title: 'Employment Offer - UX Designer',
            body: 'Dear Candidate,\n\nWe are pleased to offer you the position of UX Designer at our company. Your creative portfolio and user-centered approach impressed our design team.\n\nWe believe you will bring fresh perspectives to our design process.\n\nBest regards,\nHiring Team',
            salary: '$85,000',
            startDate: '2024-02-20',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            candidateName: 'Mike Chen',
            jobTitle: 'UX Designer',
            companyName: 'Tech Corp'
          }
        ];
        setOffers(sampleOffers);
        localStorage.setItem('offers', JSON.stringify(sampleOffers));
      } else {
        setOffers(storedOffers);
      }

      // Load rejection reasons
      const rejections = JSON.parse(localStorage.getItem('offerRejections') || '[]');
      const reasonsMap: Record<string, { reason: string; additionalComments?: string }> = {};
      rejections.forEach((rejection: any) => {
        reasonsMap[rejection.offerId] = {
          reason: rejection.reason,
          additionalComments: rejection.additionalComments
        };
      });
      
      // Add sample rejection reason for demo rejected offer
      if (storedOffers.length === 0) {
        const sampleRejections = [
          {
            offerId: 'offer-3',
            reason: 'salary_too_low',
            additionalComments: 'The salary offered is below market rate for this position in my area.',
            rejectedAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        localStorage.setItem('offerRejections', JSON.stringify(sampleRejections));
        reasonsMap['offer-3'] = {
          reason: 'salary_too_low',
          additionalComments: 'The salary offered is below market rate for this position in my area.'
        };
      }
      
      setRejectionReasons(reasonsMap);
    } catch {}
  }, []);

  const save = (list: Offer[]) => {
    setOffers(list);
    localStorage.setItem('offers', JSON.stringify(list));
  };

  const updateOffer = (id: string, patch: Partial<Offer>) => {
    const updated = offers.map(o => o.id === id ? { ...o, ...patch } : o);
    save(updated);
  };

  const createOffer = () => {
    if (!newOffer.title || !newOffer.body || !newOffer.applicationId) {
      alert('Please fill in all required fields');
      return;
    }

    const offer: Offer = {
      id: `offer-${Date.now()}`,
      applicationId: newOffer.applicationId!,
      employerId: 'demo-employer',
      status: 'issued',
      title: newOffer.title!,
      body: newOffer.body!,
      salary: newOffer.salary,
      startDate: newOffer.startDate,
      createdAt: new Date().toISOString(),
      candidateName: newOffer.candidateName,
      jobTitle: newOffer.jobTitle,
      companyName: newOffer.companyName
    };

    const updated = [offer, ...offers];
    save(updated);
    setShowCreateModal(false);
    setNewOffer({
      title: '',
      body: '',
      salary: '',
      startDate: '',
      applicationId: '',
      candidateName: '',
      jobTitle: '',
      companyName: ''
    });
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

  const formatRejectionReason = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'salary_too_low': 'Salary is too low',
      'location_not_suitable': 'Location is not suitable',
      'found_better_opportunity': 'Found a better opportunity',
      'company_culture': 'Company culture doesn\'t fit',
      'job_responsibilities': 'Job responsibilities don\'t match expectations',
      'career_growth': 'Limited career growth opportunities',
      'work_life_balance': 'Work-life balance concerns',
      'benefits_package': 'Benefits package is insufficient',
      'timing_issues': 'Timing doesn\'t work for me',
      'other': 'Other reason'
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employment Offers</h1>
              <p className="text-gray-600 mt-2">Manage and track employment offers sent to candidates</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </button>
              <Link 
                href="/employer/review" 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Back to Review
              </Link>
            </div>
          </div>
        </div>

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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers created yet</h3>
              <p className="text-gray-600 mb-4">Create your first employment offer to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {offers.map(offer => (
                <div key={offer.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                          {getStatusIcon(offer.status)}
                          <span className="ml-1 capitalize">{offer.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{offer.candidateName || `Candidate ${offer.applicationId}`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>Application {offer.applicationId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(offer.createdAt)}</span>
                        </div>
                      </div>

                      {/* Show rejection reason if offer was rejected */}
                      {offer.status === 'rejected' && rejectionReasons[offer.id] && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                              <p className="text-sm text-red-700 mt-1">
                                {formatRejectionReason(rejectionReasons[offer.id].reason)}
                              </p>
                              {rejectionReasons[offer.id].additionalComments && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-red-900">Additional Comments:</p>
                                  <p className="text-sm text-red-700 mt-1 italic">
                                    "{rejectionReasons[offer.id].additionalComments}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingOffer(editingOffer === offer.id ? null : offer.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Offer Letter</h4>
                      {editingOffer === offer.id ? (
                        <textarea
                          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={offer.body}
                          onChange={(e) => updateOffer(offer.id, { body: e.target.value })}
                        />
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{offer.body}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                        {editingOffer === offer.id ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g., $120,000"
                            value={offer.salary || ''}
                            onChange={(e) => updateOffer(offer.id, { salary: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>{offer.salary || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                        {editingOffer === offer.id ? (
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={offer.startDate || ''}
                            onChange={(e) => updateOffer(offer.id, { startDate: e.target.value })}
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{offer.startDate ? formatDate(offer.startDate) : 'Not specified'}</span>
                          </div>
                        )}
                      </div>

                      {editingOffer === offer.id && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setEditingOffer(null)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setEditingOffer(null)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Offer Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Create New Offer</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Application ID *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 1"
                      value={newOffer.applicationId || ''}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, applicationId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Candidate Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., John Doe"
                      value={newOffer.candidateName || ''}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, candidateName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Title *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Employment Offer - Senior Software Engineer"
                    value={newOffer.title || ''}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Letter *</label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write your offer letter here..."
                    value={newOffer.body || ''}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, body: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., $120,000"
                      value={newOffer.salary || ''}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, salary: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={newOffer.startDate || ''}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createOffer}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Offer
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
              <p className="text-sm font-medium text-blue-900">Important Note</p>
              <p className="text-sm text-blue-700 mt-1">
                Candidates can accept or reject offers from their portal. Offer status will automatically update here when they respond.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
