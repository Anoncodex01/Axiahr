'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  User,
  Briefcase,
  DollarSign,
  Shield,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import LoadingState from '@/components/LoadingState';
import { getCountryOptions, getStateOptions } from '@/utils/locationData';

interface Employer {
  id: string;
  companyName: string;
  contactPerson: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  industry: string;
  businessType: string;
  companyBrief: string;
  companyLogo: string;
  website: string;
  foundedYear: string;
  employeeCount: string;
  annualRevenue: string;
  companyStage: string;
  companySize: string;
  // Address
  plotNo: string;
  streetName: string;
  landmark: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  googleLocationLink: string;
  // Contact
  landlinePhone: string;
  landlineCountryCode: string;
  mobilePhone: string;
  mobileCountryCode: string;
  // Online Presence
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  otherSocialMedia: string;
  // Legal & Tax
  tin: string;
  vrn: string;
  registrationNumber: string;
  taxOffice: string;
  businessLicense: string;
  legalEntityName: string;
  registeredAddress: string;
  // Documents
  companyProfileDocument: string;
  businessLicenseDocument: string;
  taxCertificateDocument: string;
  registrationCertificateDocument: string;
  // Status
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  profileStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export default function EmployerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employerId = params.id as string;

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (employerId) {
      fetchEmployer();
    }
  }, [employerId]);

  const fetchEmployer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/employers?id=${employerId}`);
      const data = await response.json();

      if (data.success && data.employers && data.employers.length > 0) {
        setEmployer(data.employers[0]);
      } else {
        setErrorMessage('Employer not found');
        setShowErrorModal(true);
        setTimeout(() => {
          router.push('/admin/employers');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching employer:', error);
      setErrorMessage('Failed to load employer information');
      setShowErrorModal(true);
      setTimeout(() => {
        router.push('/admin/employers');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveModal(false);
    try {
      setApproving(true);
      const response = await fetch(`/api/admin/employers/${employerId}/approve`, {
        method: 'PUT'
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Employer profile approved successfully!');
        setShowSuccessModal(true);
        await fetchEmployer();
      } else {
        setErrorMessage(`Failed to approve: ${data.error}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error approving employer:', error);
      setErrorMessage('Failed to approve employer profile');
      setShowErrorModal(true);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = () => {
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage('Please provide a reason for rejection');
      setShowErrorModal(true);
      return;
    }

    setShowRejectModal(false);
    try {
      setRejecting(true);
      const response = await fetch(`/api/admin/employers/${employerId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Employer profile rejected successfully!');
        setShowSuccessModal(true);
        await fetchEmployer();
      } else {
        setErrorMessage(`Failed to reject: ${data.error}`);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error rejecting employer:', error);
      setErrorMessage('Failed to reject employer profile');
      setShowErrorModal(true);
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhone = (phone: string, countryCode: string) => {
    if (!phone) return 'N/A';
    return countryCode ? `${countryCode} ${phone}` : phone;
  };

  const formatLocation = (city: string, region: string, country: string) => {
    const parts: string[] = [];
    
    if (city) parts.push(city);
    
    if (region) {
      // Try to convert region code to name if it's a code
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      if (countryObj) {
        const states = getStateOptions(countryObj.value);
        const stateObj = states.find(s => s.value === region || s.label === region);
        parts.push(stateObj ? stateObj.label : region);
      } else {
        parts.push(region);
      }
    }
    
    if (country) {
      // Try to convert country code to name if it's a code
      const countries = getCountryOptions();
      const countryObj = countries.find(c => c.value === country || c.label === country);
      parts.push(countryObj ? countryObj.label : country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading employer information..." size="lg" />
        </div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Employer not found</p>
          <Link href="/admin/employers" className="text-[#114373] hover:underline mt-4 inline-block">
            Back to Employers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/employers"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employers
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {employer.companyLogo ? (
              <img 
                src={employer.companyLogo} 
                alt={employer.companyName} 
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{employer.companyName}</h1>
              <p className="text-lg text-gray-600">{employer.industry || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              employer.profileStatus === 'approved' ? 'bg-green-100 text-green-800' :
              employer.profileStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              employer.profileStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {employer.profileStatus === 'pending' && <Clock className="w-4 h-4 mr-1" />}
              {employer.profileStatus === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
              {employer.profileStatus === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
              {employer.profileStatus === 'incomplete' && <AlertCircle className="w-4 h-4 mr-1" />}
              {employer.profileStatus}
            </span>
            {employer.profileStatus === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {approving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {rejecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Reject
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Company Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#114373]" />
              Company Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Industry</label>
                <p className="text-sm text-gray-900 mt-1">{employer.industry || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Business Type</label>
                <p className="text-sm text-gray-900 mt-1">{employer.businessType || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Founded Year</label>
                <p className="text-sm text-gray-900 mt-1">{employer.foundedYear || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Employee Count</label>
                <p className="text-sm text-gray-900 mt-1">{employer.employeeCount || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Annual Revenue</label>
                <p className="text-sm text-gray-900 mt-1">{employer.annualRevenue || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company Stage</label>
                <p className="text-sm text-gray-900 mt-1">{employer.companyStage || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company Size</label>
                <p className="text-sm text-gray-900 mt-1">
                  {employer.companySize 
                    ? employer.companySize.charAt(0).toUpperCase() + employer.companySize.slice(1)
                    : 'N/A'}
                </p>
              </div>
              {employer.website && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <p className="text-sm text-gray-900 mt-1">
                    <a href={employer.website.startsWith('http') ? employer.website : `https://${employer.website}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-[#114373] hover:underline flex items-center gap-1">
                      {employer.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              )}
            </div>
            {employer.companyBrief && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Company Brief</label>
                <p className="text-sm text-gray-900 mt-1">{employer.companyBrief}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#114373]" />
              Contact Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-sm text-gray-900 mt-1">{employer.contactPerson || 'N/A'}</p>
              </div>
              {employer.jobTitle && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Job Title</label>
                  <p className="text-sm text-gray-900 mt-1">{employer.jobTitle}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {employer.email}
                </p>
              </div>
              {employer.mobilePhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Mobile Phone</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {formatPhone(employer.mobilePhone, employer.mobileCountryCode)}
                  </p>
                </div>
              )}
              {employer.landlinePhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Landline Phone</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {formatPhone(employer.landlinePhone, employer.landlineCountryCode)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#114373]" />
              Address Information
            </h2>
            <div className="space-y-3">
              {(employer.plotNo || employer.streetName) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Street Address</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {employer.plotNo && `${employer.plotNo} `}
                    {employer.streetName}
                  </p>
                </div>
              )}
              {employer.landmark && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Landmark</label>
                  <p className="text-sm text-gray-900 mt-1">{employer.landmark}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatLocation(employer.city, employer.region, employer.country)}
                </p>
              </div>
              {employer.postalCode && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Postal Code</label>
                  <p className="text-sm text-gray-900 mt-1">{employer.postalCode}</p>
                </div>
              )}
              {employer.googleLocationLink && (
                <div>
                  <a 
                    href={employer.googleLocationLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-[#114373] hover:underline flex items-center gap-1 mt-2"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Online Presence */}
          {(employer.linkedinUrl || employer.facebookUrl || employer.instagramUrl || employer.otherSocialMedia) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#114373]" />
                Online Presence
              </h2>
              <div className="space-y-2">
                {employer.linkedinUrl && (
                  <a href={employer.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#114373] hover:underline flex items-center gap-1">
                    LinkedIn
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {employer.facebookUrl && (
                  <a href={employer.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#114373] hover:underline flex items-center gap-1">
                    Facebook
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {employer.instagramUrl && (
                  <a href={employer.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#114373] hover:underline flex items-center gap-1">
                    Instagram
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {employer.otherSocialMedia && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Other Social Media</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.otherSocialMedia}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legal & Tax Information */}
          {(employer.tin || employer.vrn || employer.registrationNumber || employer.businessLicense) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#114373]" />
                Legal & Tax Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {employer.tin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">TIN</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.tin}</p>
                  </div>
                )}
                {employer.vrn && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">VRN</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.vrn}</p>
                  </div>
                )}
                {employer.registrationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.registrationNumber}</p>
                  </div>
                )}
                {employer.taxOffice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tax Office</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.taxOffice}</p>
                  </div>
                )}
                {employer.businessLicense && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business License</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.businessLicense}</p>
                  </div>
                )}
                {employer.legalEntityName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Legal Entity Name</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.legalEntityName}</p>
                  </div>
                )}
                {employer.registeredAddress && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Registered Address</label>
                    <p className="text-sm text-gray-900 mt-1">{employer.registeredAddress}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {(employer.companyProfileDocument || employer.businessLicenseDocument || employer.taxCertificateDocument || employer.registrationCertificateDocument) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#114373]" />
                Documents
              </h2>
              <div className="space-y-3">
                {employer.companyProfileDocument && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">Company Profile Document</span>
                    </div>
                    <a 
                      href={employer.companyProfileDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#114373] hover:underline flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {employer.businessLicenseDocument && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">Business License</span>
                    </div>
                    <a 
                      href={employer.businessLicenseDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#114373] hover:underline flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {employer.taxCertificateDocument && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">Tax Certificate</span>
                    </div>
                    <a 
                      href={employer.taxCertificateDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#114373] hover:underline flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {employer.registrationCertificateDocument && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-900">Registration Certificate</span>
                    </div>
                    <a 
                      href={employer.registrationCertificateDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#114373] hover:underline flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Status</label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{employer.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Profile Status</label>
                <p className="text-sm text-gray-900 mt-1 capitalize">{employer.profileStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email Verified</label>
                <p className="text-sm text-gray-900 mt-1">
                  {employer.emailVerified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Not Verified
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Joined Date</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(employer.createdAt)}
                </p>
              </div>
              {employer.lastLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Login</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(employer.lastLogin)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(employer.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Approve Employer Profile?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to approve this employer profile? Once approved, the employer will be able to access all features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {approving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    'Approve'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Reject Employer Profile?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Please provide a reason for rejecting this employer profile.
              </p>
              <div className="mb-6">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
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
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
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

