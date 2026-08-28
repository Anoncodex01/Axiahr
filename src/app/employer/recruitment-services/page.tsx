'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  FileText,
  Award,
  Clock,
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';

interface SelectedService {
  id: string;
  serviceType: string;
  serviceName: string;
  status: string;
  selectedAt: string;
}

export default function RecruitmentServicesPage() {
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSelectedService, setHasSelectedService] = useState(false);

  useEffect(() => {
    fetchSelectedService();
  }, []);

  const fetchSelectedService = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      
      if (!authToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/employers/selected-service', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHasSelectedService(data.hasSelectedService);
          setSelectedService(data.selectedService);
        }
      }
    } catch (error) {
      console.error('Error fetching selected service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (hasSelectedService) {
      return; // Don't allow if already selected
    }
    setShowAgreementModal(true);
  };

  const handleAgreementAccept = () => {
    if (agreementAccepted) {
      setShowAgreementModal(false);
      // Navigate to agreements page with End-to-End service type
      window.location.href = '/employer/agreements?serviceType=end-to-end';
    }
  };

  return (
    <EmployerLayout>
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4">
              <Link href="/employer/dashboard" className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all duration-200">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Recruitment Services</h1>
                <p className="text-lg text-gray-600 mt-1">Choose the recruitment service that best fits your needs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Options */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Axia End-to-End Recruitment Assistance */}
            <div className={`group bg-white rounded-2xl shadow-lg border transition-all duration-300 overflow-hidden ${
              hasSelectedService && selectedService?.serviceType !== 'end-to-end'
                ? 'border-gray-200 opacity-60'
                : hasSelectedService && selectedService?.serviceType === 'end-to-end'
                ? 'border-green-300 border-2'
                : 'border-gray-100 hover:shadow-2xl hover:border-blue-200 transform hover:-translate-y-2'
            }`}>
              <div className="p-8 text-center">
                {hasSelectedService && selectedService?.serviceType === 'end-to-end' && (
                  <div className="mb-4 flex items-center justify-center">
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Currently Selected
                    </span>
                  </div>
                )}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform duration-300 ${
                  hasSelectedService && selectedService?.serviceType === 'end-to-end'
                    ? 'bg-gradient-to-br from-green-100 to-green-200'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200 group-hover:scale-110'
                }`}>
                  <Users className={`w-10 h-10 ${
                    hasSelectedService && selectedService?.serviceType === 'end-to-end'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Axia End-to-End Recruitment Assistance</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-justify">
                  Let Axia HR advisory manage your recruitments end to end from job briefing and sourcing to screening interviews and final selection
                </p>
                {hasSelectedService && selectedService?.serviceType === 'end-to-end' ? (
                  <button
                    disabled
                    className="inline-flex items-center px-8 py-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-semibold"
                  >
                    Already Selected
                    <CheckCircle2 className="w-5 h-5 ml-2" />
                  </button>
                ) : hasSelectedService ? (
                  <button
                    disabled
                    className="inline-flex items-center px-8 py-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-semibold"
                  >
                    Service Already Selected
                    <Clock className="w-5 h-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                )}
              </div>
            </div>

            {/* Free Jobs Post */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden opacity-75">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Free Jobs Post</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-justify">
                  Post your own job openings for free and manage applicants directly from your dashboard
                </p>
                <button
                  disabled
                  className="inline-flex items-center px-8 py-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-semibold"
                >
                  Coming Soon
                  <Clock className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>

            {/* Premium Job Post */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden opacity-75">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Premium Job Post</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-justify">
                  Get your job highlighted and attract more qualified candidates with a premium post
                </p>
                <button
                  disabled
                  className="inline-flex items-center px-8 py-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed font-semibold"
                >
                  Coming Soon
                  <Clock className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Modal */}
        {showAgreementModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxWidth: '32rem',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Service Agreement</h3>
                </div>
                <button
                  onClick={() => setShowAgreementModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Important Notice</h4>
                    <p className="text-blue-800 text-sm text-justify">
                      Please read and accept the following terms before proceeding with our End-to-End Recruitment Service.
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-gray-700 text-justify">
                    <p>
                      <strong>Service Exclusivity Agreement:</strong>
                    </p>
                    <p>
                      If the Client engages Axia HR Advisory for its End-to-End Recruitment Service for any position, and Axia HR Advisory has posted the respective job on its portal, the Client shall not be eligible to use the Free Job Posting service for the same position without prior written approval from Axia HR Advisory.
                    </p>
                    <p>
                      In the event that the Client has already utilized the Free Job Posting service for the same position and the post remains active, Axia HR Advisory reserves the right to deactivate or remove the listing from the portal without prior notice.
                    </p>
                    <p>
                      The Free Job Posting service, which permits the Client to advertise a vacancy, shall not apply to any position already managed under the End-to-End Recruitment Service.
                    </p>
                  </div>

                  {/* Agreement Checkbox */}
                  <div className="border-t pt-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreementAccepted}
                        onChange={(e) => setAgreementAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">I understand and agree to the terms</span>
                        <p className="text-gray-600 mt-1 text-justify">
                          By checking this box, I acknowledge that I have read, understood, and agree to the service exclusivity terms outlined above.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAgreementModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAgreementAccept}
                  disabled={!agreementAccepted}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    agreementAccepted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
