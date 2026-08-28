'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  PenTool,
  Shield,
  Lock,
  User,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  X
} from 'lucide-react';
import EmployerLayout from '@/components/EmployerLayout';

interface AgreementForm {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tin: string;
  vrn: string;
  registrationNumber: string;
  agreementType: string;
  startDate: string;
  endDate: string;
  termsAccepted: boolean;
  digitalSignature: string;
}

interface Agreement {
  id: string;
  title: string;
  status: 'draft' | 'pending' | 'signed' | 'approved' | 'expired';
  createdAt: string;
  signedAt?: string;
  approvedAt?: string;
  expiresAt: string;
  companyName: string;
  contactPerson: string;
}

function AgreementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [agreementGenerated, setAgreementGenerated] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<File | null>(null);

  const [form, setForm] = useState<AgreementForm>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    tin: '',
    vrn: '',
    registrationNumber: '',
    agreementType: 'End-to-End Recruitment Agreement',
    startDate: '',
    endDate: '',
    termsAccepted: false,
    digitalSignature: ''
  });

  const [agreements, setAgreements] = useState<any[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [loadingCompanyData, setLoadingCompanyData] = useState(true);
  const [profileStatus, setProfileStatus] = useState<'incomplete' | 'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setLoadingCompanyData(true);
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) {
          router.push('/employer/login');
          return;
        }

        // Fetch company profile from API
        const response = await fetch('/api/employers/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const profile = data.data;
            
            // Check profile status
            if (profile.profileStatus) {
              setProfileStatus(profile.profileStatus);
            } else {
              setProfileStatus('incomplete');
            }
            
            // Build address string from separate fields
            const addressParts = [];
            if (profile.plotNo) addressParts.push(profile.plotNo);
            if (profile.streetName) addressParts.push(profile.streetName);
            if (profile.landmark) addressParts.push(profile.landmark);
            const address = addressParts.join(', ');

            setForm(prev => ({
              ...prev,
              companyName: profile.companyName || '',
              contactPerson: profile.contactPerson || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || '',
              email: profile.email || '',
              phone: profile.mobilePhone ? `${profile.mobileCountryCode || ''}${profile.mobilePhone}` : profile.landlinePhone ? `${profile.landlineCountryCode || ''}${profile.landlinePhone}` : '',
              address: address || '',
              city: profile.city || '',
              country: profile.country || '',
              tin: profile.tin || '',
              vrn: profile.vrn || '',
              registrationNumber: profile.registrationNumber || '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
            }));
          }
        }
      } catch (error) {
        console.error('Error loading company data:', error);
      } finally {
        setLoadingCompanyData(false);
      }
    };

    loadCompanyData();

    // Handle service type parameter from URL - set agreement type based on selected service
    const serviceType = searchParams.get('serviceType');
    if (serviceType) {
      let agreementType = 'End-to-End Recruitment Agreement'; // default
      
      if (serviceType === 'end-to-end') {
        agreementType = 'End-to-End Recruitment Agreement';
      } else if (serviceType === 'free-post') {
        agreementType = 'Standard Recruitment Agreement';
      } else if (serviceType === 'premium-post') {
        agreementType = 'Premium Recruitment Agreement';
      }
      
      setForm(prev => ({
        ...prev,
        agreementType: agreementType
      }));
    }
  }, [searchParams, router]);

  // Fetch existing agreements
  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setLoadingAgreements(true);
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
        if (!authToken) return;

        const response = await fetch('/api/employers/agreements', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.agreements) {
            // Store full agreement data for viewing
            setAgreements(data.agreements);
          }
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
      } finally {
        setLoadingAgreements(false);
      }
    };

    fetchAgreements();
  }, []);

  // Initialize signature pad
  useEffect(() => {
    if (showSignaturePad && signatureMethod === 'draw') {
      const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          let isDrawing = false;
          let lastX = 0;
          let lastY = 0;

          const startDrawing = (e: MouseEvent | TouchEvent) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            lastX = clientX - rect.left;
            lastY = clientY - rect.top;
          };

          const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const currentX = clientX - rect.left;
            const currentY = clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            lastX = currentX;
            lastY = currentY;
          };

          const stopDrawing = () => {
            isDrawing = false;
          };

          // Mouse events
          canvas.addEventListener('mousedown', startDrawing);
          canvas.addEventListener('mousemove', draw);
          canvas.addEventListener('mouseup', stopDrawing);
          canvas.addEventListener('mouseout', stopDrawing);

          // Touch events
          canvas.addEventListener('touchstart', startDrawing);
          canvas.addEventListener('touchmove', draw);
          canvas.addEventListener('touchend', stopDrawing);

          return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
          };
        }
      }
    }
  }, [showSignaturePad, signatureMethod]);

  const handleInputChange = (field: keyof AgreementForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const generateAgreement = () => {
    setAgreementGenerated(true);
    setCurrentStep(2);
  };

  const signAgreement = () => {
    setAgreementSigned(true);
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call for agreement submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Set agreement as signed
      localStorage.setItem('employerAgreementSigned', 'true');
      router.push('/employer/dashboard');
    }, 2000);
  };

  const handleSignatureComplete = async (signature: string) => {
    if (!signature || signature.trim() === '') {
      alert('Please provide a valid signature');
      return;
    }

    setSignatureData(signature);
    setShowSignaturePad(false);
    
    // Save agreement immediately after signature is captured
    setIsSubmitting(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        router.push('/employer/login');
        return;
      }

      // Determine service type from agreement type
      const serviceType = form.agreementType === 'End-to-End Recruitment Agreement' ? 'end-to-end' : 'standard';

      // Prepare agreement content (the full agreement text)
      const agreementContent = JSON.stringify({
        title: form.agreementType,
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        date: new Date().toISOString()
      });

      const response = await fetch('/api/employers/agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          serviceType: serviceType,
          agreementType: form.agreementType,
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country,
          tin: form.tin,
          vrn: form.vrn,
          registrationNumber: form.registrationNumber,
          startDate: form.startDate,
          endDate: form.endDate,
          digitalSignature: signature,
          signatureMethod: signatureMethod,
          agreementContent: agreementContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit agreement');
      }

      if (data.success) {
        // Set agreement as signed
        localStorage.setItem('employerAgreementSigned', 'true');
        localStorage.setItem('employerAgreementId', data.data.agreementId);
        
        // Refresh agreements list and redirect to job posting
        const fetchAgreements = async () => {
          try {
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
            if (!authToken) return;

            const response = await fetch('/api/employers/agreements', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.agreements) {
                setAgreements(data.agreements);
              }
            }
          } catch (error) {
            console.error('Error fetching agreements:', error);
          }
        };
        
        await fetchAgreements();
        
        // Redirect to job posting after successful save
        alert('Agreement submitted successfully! You can now post jobs.');
        window.location.href = '/employer/job-posting';
      } else {
        throw new Error(data.error || 'Failed to submit agreement');
      }
    } catch (error: any) {
      console.error('Error submitting agreement:', error);
      alert(error.message || 'Failed to submit agreement. Please try again.');
      // Re-open signature pad on error
      setShowSignaturePad(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setUploadedSignature(file);
      
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSignatureData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if all pixels are transparent (empty canvas)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) { // If alpha channel is not 0, there's content
        return false;
      }
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!signatureData) {
      alert('Please provide a signature');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('employerAuthToken');
      if (!authToken) {
        router.push('/employer/login');
        return;
      }

      // Determine service type from agreement type
      const serviceType = form.agreementType === 'End-to-End Recruitment Agreement' ? 'end-to-end' : 'standard';

      // Prepare agreement content (the full agreement text)
      const agreementContent = JSON.stringify({
        title: form.agreementType,
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        date: new Date().toISOString()
      });

      const response = await fetch('/api/employers/agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          serviceType: serviceType,
          agreementType: form.agreementType,
          companyName: form.companyName,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country,
          tin: form.tin,
          vrn: form.vrn,
          registrationNumber: form.registrationNumber,
          startDate: form.startDate,
          endDate: form.endDate,
          digitalSignature: signatureData,
          signatureMethod: signatureMethod,
          agreementContent: agreementContent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit agreement');
      }

      if (data.success) {
        // Set agreement as signed
        localStorage.setItem('employerAgreementSigned', 'true');
        localStorage.setItem('employerAgreementId', data.data.agreementId);
        
        // Show success message and redirect to job posting
        // Use window.location.href for full page reload to ensure agreement check runs
        alert('Agreement submitted successfully! You can now post jobs.');
        window.location.href = '/employer/job-posting';
      } else {
        throw new Error(data.error || 'Failed to submit agreement');
      }
    } catch (error: any) {
      console.error('Error submitting agreement:', error);
      alert(error.message || 'Failed to submit agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'signed':
        return <PenTool className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <EmployerLayout>
      <div className="w-full max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/employer/dashboard" className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agreements & Digital Signatures</h1>
            <p className="text-gray-600">Generate and manage your recruitment agreements</p>
          </div>
        </div>

        {/* Profile Status Check */}
        {profileStatus === 'loading' || loadingCompanyData ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading company information...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Agreement Generation Process - Show when serviceType is in URL */}
            {(() => {
              const serviceType = searchParams.get('serviceType');
              
              // If no serviceType and profile not approved, show profile warning
              if (!serviceType && profileStatus !== 'approved') {
                return (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
                      <div className="flex items-start">
                        <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="ml-3 flex-1">
                          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                            Company Profile Not Approved
                          </h3>
                          <p className="text-sm text-yellow-700 mb-4">
                            Your company profile must be approved before you can generate agreements. 
                            {profileStatus === 'pending' && ' Your profile is currently under review.'}
                            {profileStatus === 'incomplete' && ' Please complete your company profile first.'}
                            {profileStatus === 'rejected' && ' Your profile was rejected. Please update and resubmit.'}
                          </p>
                          <Link
                            href="/employer/company-profile"
                            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                          >
                            Go to Company Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // If no serviceType, show message to go to recruitment services
              if (!serviceType) {
                return (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agreement Selected</h2>
                      <p className="text-gray-600 mb-6">
                        To generate an agreement, please select a recruitment service first.
                      </p>
                      <Link
                        href="/employer/recruitment-services"
                        className="inline-flex items-center px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
                      >
                        Go to Recruitment Services
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </div>
                  </div>
                );
              }
              
              // Show agreement generation form when serviceType is present
              return !agreementGenerated && (
                <>
                  {/* Profile Warning Banner - Show if profile not approved but serviceType is provided */}
                  {profileStatus !== 'approved' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> Your company profile is {profileStatus === 'pending' ? 'pending approval' : profileStatus === 'incomplete' ? 'incomplete' : 'rejected'}. 
                            You can sign this agreement now, but please ensure your{' '}
                            <Link href="/employer/company-profile" className="underline font-medium">company profile</Link> is completed and approved to use all features.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate New Agreement</h2>
                
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Company Information</h4>
                      <p className="text-sm text-blue-700">
                        The following information has been pre-filled from your company profile. You can edit if needed.
                      </p>
                    </div>
                  </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete company address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agreement Type *
                </label>
                <select
                  value={form.agreementType}
                  onChange={(e) => handleInputChange('agreementType', e.target.value)}
                  disabled={!!searchParams.get('serviceType')}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent ${
                    searchParams.get('serviceType') ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
                  }`}
                  required
                >
                  <option value="End-to-End Recruitment Agreement">End-to-End Recruitment Agreement</option>
                  <option value="Standard Recruitment Agreement">Standard Recruitment Agreement</option>
                  <option value="Premium Recruitment Agreement">Premium Recruitment Agreement</option>
                  <option value="Executive Search Agreement">Executive Search Agreement</option>
                  <option value="Contract Staffing Agreement">Contract Staffing Agreement</option>
                  <option value="Axia HR Advisory Agreement">Axia HR Advisory Agreement</option>
                </select>
                {searchParams.get('serviceType') && (
                  <p className="mt-2 text-sm text-gray-500">
                    Agreement type is automatically set based on your selected service.
                  </p>
                )}
              </div>

            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Agreement Security</h4>
                  <p className="text-sm text-blue-700">
                    All agreements are legally binding and will be securely stored. Once signed, 
                    agreements cannot be revoked without admin approval. A signed copy will be 
                    automatically sent to your email.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={generateAgreement}
                className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
              >
                Generate Agreement
              </button>
            </div>
          </div>
                </>
              );
            })()}

            {/* Agreement Preview */}
            {agreementGenerated && !agreementSigned && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Agreement Preview</h2>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Recruiting Services Agreement</h3>
                <p className="text-gray-600">This Agreement is made as of {form.startDate || new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-8 text-base leading-relaxed max-w-4xl mx-auto text-justify">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Between</h4>
                  <p className="text-gray-800 mb-6 leading-relaxed text-justify">
                    <strong>Axia HR Advisory Tanzania Limited</strong> (the "Agency"), an offshoot of RM Finance Consulting Limited, 
                    having its registered office at the mezzanine floor of Urban Tower, Jamhuri Street, P.O BOX 75303, Dar es Salaam, Tanzania
                  </p>
                  
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">And</h4>
                  <p className="text-gray-800 mb-6 leading-relaxed text-justify">
                    <strong>{form.companyName || '[CLIENT NAME]'}</strong>, (the "Client"), having its registered office at 
                    <strong> {form.address || '[CLIENT ADDRESS]'}</strong>, {form.city && form.country ? `${form.city}, ${form.country}` : '[CITY, COUNTRY]'}, where the Agency will source, recruit, review, and present potential employees to the Client.
                  </p>
                </div>

                {form.agreementType === 'End-to-End Recruitment Agreement' && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Service Exclusivity Agreement</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h5 className="font-medium text-blue-900 mb-2">Important Notice</h5>
                      <p className="text-sm text-blue-800">
                        This End-to-End Recruitment Service includes comprehensive recruitment management from job briefing to final selection.
                      </p>
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
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
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">1. Placement Fee:</h4>
                  
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3 text-base">a. Fee Calculation:</h5>
                      <div className="ml-6 space-y-3">
                        <p className="text-gray-800 leading-relaxed text-justify">I. The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher.</p>
                        <p className="text-gray-800 leading-relaxed text-justify">II. Fees are exclusive of VAT, which will be charged at the prevailing rate.</p>
                        <p className="text-gray-800 leading-relaxed text-justify">III. For each recruitment position assigned, a deposit of Tsh. 600,000 will be payable upfront. If a suitable candidate is identified and hired, this deposit will be deducted from the total fee due.</p>
                        <p className="text-gray-800 leading-relaxed text-justify">IV. If we do not present a suitable candidate within one (1) month, the deposit will be fully refunded. However, to be eligible for the refund, you must review all CVs we provide and conduct interviews with candidates who meet your requirements. If no interviews are conducted by you for matching candidates, the deposit will be forfeited.</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3 text-base">b. Fee Due Date and Payment Terms:</h5>
                      <div className="ml-6 space-y-3">
                        <p className="text-gray-800 leading-relaxed text-justify">I. The Client shall pay the due amount upon the Employee either joining the company or signing the employment contract, whichever occurs earlier.</p>
                        <p className="text-gray-800 leading-relaxed text-justify">II. This amount has to be paid within 15 days from the date the invoice is raised.</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3 text-base">c. Replacement and Refund Policy:</h5>
                      <div className="ml-6 space-y-3">
                        <p className="text-gray-800 leading-relaxed text-justify">I. In the event the candidate placed by the Agency leaves within the first 3 months, the Agency shall provide a replacement candidate to the client within 21 working days from the date the Agency is informed of the candidate's departure.</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3 text-base">d. Payment and Invoicing Clause:</h5>
                      <div className="ml-6 space-y-4">
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Invoice Generation:</h6>
                          <p className="text-gray-800 leading-relaxed text-justify">All invoices related to recruitment services provided under this Agreement shall be automatically generated through the Axia HR Advisory recruitment platform. The Client acknowledges and agrees that no manual invoices shall be issued outside of the Portal unless expressly authorized in writing by Axia HR Advisory.</p>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Payment Method:</h6>
                          <p className="text-gray-800 leading-relaxed text-justify">The Client shall make all payments via the payment gateway integrated into the Portal. Payments made outside the Portal, including but not limited to direct bank transfers, checks, or cash, shall not be recognized as valid payments unless prior written approval is obtained from Axia HR Advisory.</p>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Payment Obligation:</h6>
                          <p className="text-gray-800 leading-relaxed text-justify">All fees for services rendered shall be due immediately upon invoice generation on the Portal, and the Client agrees to settle each invoice in full through the Portal's payment gateway. Non-payment or delay in payment may result in suspension of services, removal of job postings, or other remedies as provided under this Agreement.</p>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">Records and Proof of Payment:</h6>
                          <p className="text-gray-800 leading-relaxed text-justify">The Portal's payment gateway shall serve as the official record of payments made. The Client may download receipts and payment confirmations directly from the Portal for their records.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">2. Service Guarantee:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    The Agency offers a three-month guarantee for placed candidates. If a candidate resigns or is terminated due to poor performance within three months of employment (without any contributing factors from the Client), the Client must notify the Agency in writing within 7 days of termination. The Agency will conduct a new search at no extra cost and provide a suitable replacement within 21 working days. This free replacement clause applies only to the first recruitment and not to the replaced candidate.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">3. Qualifications of Candidates:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    The Client has sole discretion to establish the minimum qualifications necessary for candidates applying for any positions offered.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">4. Timing:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    The initial search and identification of prospective candidates are typically completed within one to three weeks. The screening/interview process, leading to the presentation of a candidate shortlist, is also usually completed within one to three weeks. Most searches are thus completed within two to six weeks. The final selection depends on both the Client's and the candidate's availability for interviews and the Client's internal decision-making process. An estimated timeframe for completion will be provided at the outset of each assignment.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">5. Confidentiality:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    All searches conducted by the Agency are performed according to the highest standards of professionalism and confidentiality. Confidential information provided to the Agency is respected and should be treated with the same level of confidentiality by the Client regarding any candidate or general information provided.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">6. Liability Disclaimer:</h4>
                  <p className="text-gray-800 leading-relaxed mb-4 text-justify">
                    While the Agency conducts thorough candidate background checks, it is ultimately the Client's responsibility to verify a candidate's suitability for a position. The Agency cannot be held liable for any loss, damage, or injury to persons or property arising directly or indirectly from any act of a candidate introduced by the Agency.
                  </p>
                  <div className="ml-6 space-y-3">
                    <p className="text-gray-800 leading-relaxed text-justify">a) Neither Party shall be liable to the other for any indirect, consequential, incidental, or special loss; any loss of business, profits, anticipated savings, contracts, or commercial opportunities, or any other form of pure economic loss, direct or indirect.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">b) Nothing in this Agreement limits or excludes a Party's liability for fraud or fraudulent misrepresentation or in any way not permitted under applicable law.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">7. Terms and Conditions:</h4>
                  <div className="ml-6 space-y-3">
                    <p className="text-gray-800 leading-relaxed text-justify">a) Candidates presented to the Client, whether verbally or in writing, will be considered Agency Recruitment candidates for twelve (12) months from the date of introduction. If such a candidate is hired within this timeframe, the Agency's professional fees will immediately become due.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">b) The Client must notify the Agency immediately upon accepting one of the Agency's candidates.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">c) If a replacement candidate is needed, the Agency will provide a free future search for that specific candidate's replacement, provided the Agency's invoice has been settled in full within 15 days of receipt. The service guarantee can be canceled if this condition is not met.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">d) These Terms and Conditions of Business shall be effective upon execution by both parties and valid until terminated under the provisions hereof.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">e) Either party may terminate these Terms and Conditions at its sole discretion, without assigning any reason or incurring any liability to the other party, by giving one (1) month's written notice.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">f) No variation to these Terms and Conditions shall be valid unless agreed upon in writing by both the Agency and the Client.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">g) These Terms and Conditions constitute the entire agreement between the parties concerning the subject matter and supersede all prior agreements, oral or written, concerning such subject matter.</p>
                    <p className="text-gray-800 leading-relaxed text-justify">i) The Client undertakes not to poach any employees of the Agency.</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">8. Entire Agreement and Governing Law:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    The conditions contained herein constitute the entire agreement between the Client and the Agency. No variation shall be valid unless put in writing and signed by both parties. This Agreement shall be governed by and construed in accordance with the laws of Tanzania.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">9. Acknowledgement and Acceptance:</h4>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    I have read the attached letter and standard Terms and Conditions, and accept the proposal for Recruitment Services by Axia HR Advisory, an offshoot of RM Financial Consulting Limited.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Agency:</h4>
                      <p className="text-sm text-gray-600 mb-4">For and On Behalf of AXIA HR ADVISORY:</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">Axia HR Advisory Representative</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Client:</h4>
                      <p className="text-sm text-gray-600 mb-4">For and On Behalf of {form.companyName || '[CLIENT NAME]'}</p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">{form.contactPerson || '[CLIENT SIGNATURE]'}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                          <div className="border-b border-gray-300 pb-1">
                            <span className="text-sm text-gray-500">{form.endDate || '[DATE]'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => setAgreementGenerated(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Edit
              </button>
              <button
                onClick={() => {
                  setSignatureMethod('draw');
                  setSignatureData('');
                  setUploadedSignature(null);
                  setShowSignaturePad(true);
                }}
                className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium"
              >
                Sign Agreement
              </button>
            </div>
          </div>
        )}

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Digital Signature</h2>
              
              {/* Signature Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose your signature method:
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSignatureMethod('draw')}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      signatureMethod === 'draw'
                        ? 'border-[#114373] bg-[#114373] text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <PenTool className="w-4 h-4 inline mr-2" />
                    Draw Signature
                  </button>
                  <button
                    onClick={() => setSignatureMethod('upload')}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      signatureMethod === 'upload'
                        ? 'border-[#114373] bg-[#114373] text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Signature
                  </button>
                </div>
              </div>

              {/* Drawing Signature */}
              {signatureMethod === 'draw' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sign below with your mouse or touch *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                    <canvas
                      id="signatureCanvas"
                      width={600}
                      height={200}
                      className="border border-gray-200 rounded cursor-crosshair"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                      }}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Signature */}
              {signatureMethod === 'upload' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload your signature image *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="signatureUpload"
                    />
                    <label
                      htmlFor="signatureUpload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload signature image
                      </span>
                      <span className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </label>
                  </div>
                  
                  {/* Preview uploaded signature */}
                  {signatureData && signatureData.trim() !== '' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Signature Preview:
                      </label>
                      <div className="border border-gray-300 rounded p-4 bg-white">
                        <img 
                          src={signatureData} 
                          alt="Signature Preview" 
                          className="max-h-20 mx-auto"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSignatureData('');
                          setUploadedSignature(null);
                          const input = document.getElementById('signatureUpload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="mt-2 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Legal Notice</h4>
                    <p className="text-sm text-yellow-700">
                      Your digital signature is legally binding and equivalent to a handwritten signature. 
                      Please ensure you have read and understood all terms before signing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="w-4 h-4 text-[#114373] border-gray-300 rounded focus:ring-[#114373]"
                  required
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                  I have read and agree to the terms and conditions of this agreement
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSignaturePad(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!form.termsAccepted) {
                      alert('Please accept the terms and conditions first');
                      return;
                    }
                    
                    if (signatureMethod === 'draw') {
                      const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
                      if (canvas && !isCanvasEmpty(canvas)) {
                        const signature = canvas.toDataURL();
                        await handleSignatureComplete(signature);
                      } else {
                        alert('Please draw your signature first');
                      }
                    } else if (signatureMethod === 'upload') {
                      if (signatureData && signatureData.trim() !== '') {
                        await handleSignatureComplete(signatureData);
                      } else {
                        alert('Please upload your signature first');
                      }
                    }
                  }}
                  disabled={!form.termsAccepted || isSubmitting || (signatureMethod === 'upload' && !signatureData)}
                  className="px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Sign and Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Agreements */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Agreements</h2>
          
          {loadingAgreements ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading agreements...</p>
            </div>
          ) : agreements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No agreements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agreements.map((agreement: any) => (
              <div key={agreement.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{agreement.agreementType || agreement.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agreement.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(agreement.status)}
                          {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
                        </div>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Company:</span> {agreement.companyName}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {agreement.contactPerson}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {agreement.createdAt ? new Date(agreement.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    {agreement.signedAt && (
                      <div className="mt-2 text-xs text-gray-500">
                        Signed: {new Date(agreement.signedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedAgreement(agreement);
                        setShowViewModal(true);
                      }}
                      className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium text-sm flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* View Agreement Modal */}
        {showViewModal && selectedAgreement && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Agreement Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedAgreement(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Agreement Header */}
                  <div className="text-center border-b border-gray-200 pb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedAgreement.agreementType || 'Recruitment Services Agreement'}
                    </h3>
                    <p className="text-gray-600">
                      This Agreement is made as of {selectedAgreement.startDate ? new Date(selectedAgreement.startDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {/* Full Agreement Content */}
                  {selectedAgreement.agreementContent && (
                    <div className="border border-gray-200 rounded-lg p-8 bg-white mb-6">
                      <div className="space-y-8 text-base leading-relaxed max-w-4xl mx-auto text-justify">
                        {(() => {
                          try {
                            const content = typeof selectedAgreement.agreementContent === 'string' 
                              ? JSON.parse(selectedAgreement.agreementContent) 
                              : selectedAgreement.agreementContent;
                            
                            // If it's just metadata, render the full agreement text
                            // Otherwise, we'll render the structured content
                            return (
                              <div className="space-y-8">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">Between</h4>
                                  <p className="text-gray-800 mb-6 leading-relaxed text-justify">
                                    <strong>Axia HR Advisory Tanzania Limited</strong> (the "Agency"), an offshoot of RM Finance Consulting Limited, 
                                    having its registered office at the mezzanine floor of Urban Tower, Jamhuri Street, P.O BOX 75303, Dar es Salaam, Tanzania
                                  </p>
                                  
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">And</h4>
                                  <p className="text-gray-800 mb-6 leading-relaxed text-justify">
                                    <strong>{selectedAgreement.companyName || '[CLIENT NAME]'}</strong>, (the "Client"), having its registered office at 
                                    <strong> {selectedAgreement.address || '[CLIENT ADDRESS]'}</strong>, {selectedAgreement.city && selectedAgreement.country ? `${selectedAgreement.city}, ${selectedAgreement.country}` : '[CITY, COUNTRY]'}, where the Agency will source, recruit, review, and present potential employees to the Client.
                                  </p>
                                </div>

                                {selectedAgreement.serviceType === 'end-to-end' && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Service Exclusivity Agreement</h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                      <h5 className="font-medium text-blue-900 mb-2">Important Notice</h5>
                                      <p className="text-sm text-blue-800">
                                        This End-to-End Recruitment Service includes comprehensive recruitment management from job briefing to final selection.
                                      </p>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-700">
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
                                  </div>
                                )}

                                {/* Full Agreement Terms - Same as preview */}
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">1. Placement Fee:</h4>
                                  
                                  <div className="space-y-6">
                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3 text-base">a. Fee Calculation:</h5>
                                      <div className="ml-6 space-y-3">
                                        <p className="text-gray-800 leading-relaxed text-justify">I. The Agency's fees shall be calculated as the employee's one-month Gross Salary or TSH 800,000/-, whichever is higher.</p>
                                        <p className="text-gray-800 leading-relaxed text-justify">II. Fees are exclusive of VAT, which will be charged at the prevailing rate.</p>
                                        <p className="text-gray-800 leading-relaxed text-justify">III. For each recruitment position assigned, a deposit of Tsh. 600,000 will be payable upfront. If a suitable candidate is identified and hired, this deposit will be deducted from the total fee due.</p>
                                        <p className="text-gray-800 leading-relaxed text-justify">IV. If we do not present a suitable candidate within one (1) month, the deposit will be fully refunded. However, to be eligible for the refund, you must review all CVs we provide and conduct interviews with candidates who meet your requirements. If no interviews are conducted by you for matching candidates, the deposit will be forfeited.</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3 text-base">b. Fee Due Date and Payment Terms:</h5>
                                      <div className="ml-6 space-y-3">
                                        <p className="text-gray-800 leading-relaxed text-justify">I. The Client shall pay the due amount upon the Employee either joining the company or signing the employment contract, whichever occurs earlier.</p>
                                        <p className="text-gray-800 leading-relaxed text-justify">II. This amount has to be paid within 15 days from the date the invoice is raised.</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3 text-base">c. Replacement and Refund Policy:</h5>
                                      <div className="ml-6 space-y-3">
                                        <p className="text-gray-800 leading-relaxed text-justify">I. In the event the candidate placed by the Agency leaves within the first 3 months, the Agency shall provide a replacement candidate to the client within 21 working days from the date the Agency is informed of the candidate's departure.</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h5 className="font-medium text-gray-900 mb-3 text-base">d. Payment and Invoicing Clause:</h5>
                                      <div className="ml-6 space-y-4">
                                        <div>
                                          <h6 className="font-medium text-gray-900 mb-2">Invoice Generation:</h6>
                                          <p className="text-gray-800 leading-relaxed text-justify">All invoices related to recruitment services provided under this Agreement shall be automatically generated through the Axia HR Advisory recruitment platform. The Client acknowledges and agrees that no manual invoices shall be issued outside of the Portal unless expressly authorized in writing by Axia HR Advisory.</p>
                                        </div>
                                        
                                        <div>
                                          <h6 className="font-medium text-gray-900 mb-2">Payment Method:</h6>
                                          <p className="text-gray-800 leading-relaxed text-justify">The Client shall make all payments via the payment gateway integrated into the Portal. Payments made outside the Portal, including but not limited to direct bank transfers, checks, or cash, shall not be recognized as valid payments unless prior written approval is obtained from Axia HR Advisory.</p>
                                        </div>
                                        
                                        <div>
                                          <h6 className="font-medium text-gray-900 mb-2">Payment Obligation:</h6>
                                          <p className="text-gray-800 leading-relaxed text-justify">The Client agrees that payment obligations under this Agreement are absolute and unconditional, regardless of any disputes or claims the Client may have against the Agency. The Client shall not withhold or set off any payment due under this Agreement against any claim or liability.</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">2. Scope of Services:</h4>
                                  <p className="text-gray-800 leading-relaxed text-justify">
                                    The Agency will provide comprehensive recruitment services including but not limited to: job briefing, candidate sourcing, CV screening, initial interviews, background checks, and presentation of shortlisted candidates to the Client.
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">3. Qualifications of Candidates:</h4>
                                  <p className="text-gray-800 leading-relaxed text-justify">
                                    The Client has sole discretion to establish the minimum qualifications necessary for candidates applying for any positions offered.
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">4. Timing:</h4>
                                  <p className="text-gray-800 leading-relaxed text-justify">
                                    The initial search and identification of prospective candidates are typically completed within one to three weeks. The screening/interview process, leading to the presentation of a candidate shortlist, is also usually completed within one to three weeks. Most searches are thus completed within two to six weeks. The final selection depends on both the Client's and the candidate's availability for interviews and the Client's internal decision-making process. An estimated timeframe for completion will be provided at the outset of each assignment.
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">5. Confidentiality:</h4>
                                  <p className="text-gray-800 leading-relaxed text-justify">
                                    All searches conducted by the Agency are performed according to the highest standards of professionalism and confidentiality. Confidential information provided to the Agency is respected and should be treated with the same level of confidentiality by the Client regarding any candidate or general information provided.
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">6. Liability Disclaimer:</h4>
                                  <p className="text-gray-800 leading-relaxed mb-4 text-justify">
                                    While the Agency conducts thorough candidate background checks, it is ultimately the Client's responsibility to verify a candidate's suitability for a position. The Agency cannot be held liable for any loss, damage, or injury to persons or property arising directly or indirectly from any act of a candidate introduced by the Agency.
                                  </p>
                                  <div className="ml-6 space-y-3">
                                    <p className="text-gray-800 leading-relaxed text-justify">a) Neither Party shall be liable to the other for any indirect, consequential, incidental, or special loss; any loss of business, profits, anticipated savings, contracts, or commercial opportunities, or any other form of pure economic loss, direct or indirect.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">b) Nothing in this Agreement limits or excludes a Party's liability for fraud or fraudulent misrepresentation or in any way not permitted under applicable law.</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">7. Terms and Conditions:</h4>
                                  <div className="ml-6 space-y-3">
                                    <p className="text-gray-800 leading-relaxed text-justify">a) Candidates presented to the Client, whether verbally or in writing, will be considered Agency Recruitment candidates for twelve (12) months from the date of introduction. If such a candidate is hired within this timeframe, the Agency's professional fees will immediately become due.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">b) The Client must notify the Agency immediately upon accepting one of the Agency's candidates.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">c) If a replacement candidate is needed, the Agency will provide a free future search for that specific candidate's replacement, provided the Agency's invoice has been settled in full within 15 days of receipt. The service guarantee can be canceled if this condition is not met.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">d) These Terms and Conditions of Business shall be effective upon execution by both parties and valid until terminated under the provisions hereof.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">e) Either party may terminate these Terms and Conditions at its sole discretion, without assigning any reason or incurring any liability to the other party, by giving one (1) month's written notice.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">f) No variation to these Terms and Conditions shall be valid unless agreed upon in writing by both the Agency and the Client.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">g) These Terms and Conditions constitute the entire agreement between the parties concerning the subject matter and supersede all prior agreements, oral or written, concerning such subject matter.</p>
                                    <p className="text-gray-800 leading-relaxed text-justify">i) The Client undertakes not to poach any employees of the Agency.</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">8. Entire Agreement and Governing Law:</h4>
                                  <p className="text-gray-800 leading-relaxed text-justify">
                                    The conditions contained herein constitute the entire agreement between the Client and the Agency. No variation shall be valid unless put in writing and signed by both parties. This Agreement shall be governed by and construed in accordance with the laws of Tanzania.
                                  </p>
                                </div>
                              </div>
                            );
                          } catch (error) {
                            return (
                              <div className="text-gray-600">
                                <p>Agreement content is available but cannot be parsed. Please contact support for assistance.</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Company Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">Company Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-1">Company Name:</span>
                          <span className="text-gray-900">{selectedAgreement.companyName}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-1">Contact Person:</span>
                          <span className="text-gray-900">{selectedAgreement.contactPerson}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-1">Email:</span>
                          <span className="text-gray-900">{selectedAgreement.email}</span>
                        </div>
                        {selectedAgreement.phone && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Phone:</span>
                            <span className="text-gray-900">{selectedAgreement.phone}</span>
                          </div>
                        )}
                        {selectedAgreement.address && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Address:</span>
                            <span className="text-gray-900">{selectedAgreement.address}</span>
                          </div>
                        )}
                        {(selectedAgreement.city || selectedAgreement.country) && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Location:</span>
                            <span className="text-gray-900">{[selectedAgreement.city, selectedAgreement.country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">Legal Information</h4>
                      <div className="space-y-3 text-sm">
                        {selectedAgreement.tin && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">TIN:</span>
                            <span className="text-gray-900">{selectedAgreement.tin}</span>
                          </div>
                        )}
                        {selectedAgreement.vrn && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">VRN:</span>
                            <span className="text-gray-900">{selectedAgreement.vrn}</span>
                          </div>
                        )}
                        {selectedAgreement.registrationNumber && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Registration Number:</span>
                            <span className="text-gray-900">{selectedAgreement.registrationNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Agreement Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">Agreement Period</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-1">Start Date:</span>
                          <span className="text-gray-900">{selectedAgreement.startDate ? new Date(selectedAgreement.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-1">End Date:</span>
                          <span className="text-gray-900">{selectedAgreement.endDate ? new Date(selectedAgreement.endDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 text-base">Status Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700 mb-2">Status:</span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(selectedAgreement.status)}`}>
                            {selectedAgreement.status.charAt(0).toUpperCase() + selectedAgreement.status.slice(1)}
                          </span>
                        </div>
                        {selectedAgreement.signedAt && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Signed:</span>
                            <span className="text-gray-900">{new Date(selectedAgreement.signedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedAgreement.approvedAt && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Approved:</span>
                            <span className="text-gray-900">{new Date(selectedAgreement.approvedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedAgreement.createdAt && (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700 mb-1">Created:</span>
                            <span className="text-gray-900">{new Date(selectedAgreement.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Agency:</h4>
                        <p className="text-sm text-gray-600 mb-4">For and On Behalf of AXIA HR ADVISORY:</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                            <div className="border-b border-gray-300 pb-1">
                              <span className="text-sm text-gray-500">Axia HR Advisory Representative</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                            <div className="border-b border-gray-300 pb-1">
                              <span className="text-sm text-gray-500">
                                {selectedAgreement.signedAt ? new Date(selectedAgreement.signedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Accepted by the Client:</h4>
                        <p className="text-sm text-gray-600 mb-4">For and On Behalf of {selectedAgreement.companyName}</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                            <div className="border border-gray-300 rounded p-2 bg-white">
                              {selectedAgreement.digitalSignature && selectedAgreement.digitalSignature.trim() !== '' ? (
                                <img src={selectedAgreement.digitalSignature} alt="Digital Signature" className="max-h-20" />
                              ) : (
                                <span className="text-sm text-gray-500">No signature provided</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                            <div className="border-b border-gray-300 pb-1">
                              <span className="text-sm text-gray-500">
                                {selectedAgreement.signedAt ? new Date(selectedAgreement.signedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedAgreement(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </EmployerLayout>
  );
}

export default function Agreements() {
  return (
    <Suspense fallback={
      <EmployerLayout>
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </EmployerLayout>
    }>
      <AgreementsContent />
    </Suspense>
  );
}

