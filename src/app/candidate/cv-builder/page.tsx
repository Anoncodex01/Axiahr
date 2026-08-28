'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CandidateLayout from '@/components/CandidateLayout';
import { 
  Download,
  Upload,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  FileText,
  Plus,
  XCircle
} from 'lucide-react';

interface CVOrder {
  id: number;
  candidateName?: string;
  paymentStatus: string;
  canUpload: boolean;
  hasProcessedCv: boolean;
  cvFilePath?: string;
  processedCvPath?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  amountTZS: number;
  amountUSD: number;
  status: string;
}

export default function CVBuilderPage() {
  return (
    <CandidateLayout>
      <Suspense fallback={
        <div className="w-full space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-4 animate-shimmer"></div>
          <div className="h-32 bg-gray-200 rounded-lg animate-shimmer"></div>
        </div>
      }>
        <CVBuilderContent />
      </Suspense>
    </CandidateLayout>
  );
}

function CVBuilderContent() {
  const searchParams = useSearchParams();
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [orders, setOrders] = useState<CVOrder[]>([]);
  const [amountTZS, setAmountTZS] = useState(50000);
  const [amountUSD, setAmountUSD] = useState(0);
  const [formattedTZS, setFormattedTZS] = useState('TZS 50,000');
  const [formattedUSD, setFormattedUSD] = useState('$0.00');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState<'payment' | 'upload'>('payment');

  // Get candidate ID from token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCandidateId(payload.sub || payload.candidateId || payload.id || null);
      } catch (error) {
        // Error parsing token
      }
    }
  }, []);

  // Fetch exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('/api/cv-builder/exchange-rate');
        if (response.ok) {
          const data = await response.json();
          const rate = data.rate || 2678;
          const usd = amountTZS / rate;
          setAmountUSD(usd);
          setFormattedTZS(new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amountTZS));
          setFormattedUSD(new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(usd));
        }
      } catch (error) {
        // Fallback to default rate
        const defaultRate = 2678;
        const usd = amountTZS / defaultRate;
        setAmountUSD(usd);
        setFormattedTZS(new Intl.NumberFormat('en-TZ', {
          style: 'currency',
          currency: 'TZS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amountTZS));
        setFormattedUSD(new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(usd));
      }
    };
    fetchExchangeRate();
  }, [amountTZS]);

  // Fetch order status
  const fetchOrderStatus = async () => {
    if (!candidateId) {
      setIsLoadingOrder(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/cv-builder/order-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasOrder) {
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      }
    } catch (error) {
      // Error fetching order status
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Fetch orders on mount and when candidateId changes
  useEffect(() => {
    if (candidateId) {
      fetchOrderStatus();
    }
  }, [candidateId]);

  // Poll for pending orders
  useEffect(() => {
    if (!candidateId) return;

    const interval = setInterval(() => {
      const hasPendingOrder = orders.some(o => o.paymentStatus === 'pending');
      if (hasPendingOrder) {
        fetchOrderStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [candidateId, orders]);

  // Handle payment success/cancel from URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      setTimeout(() => {
        fetchOrderStatus();
      }, 2000);

      setSuccessMessage('Payment successful! You can now upload your CV for professional processing.');
      setSuccessType('payment');
      setShowSuccessModal(true);
      window.history.replaceState({}, '', '/candidate/cv-builder');
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', '/candidate/cv-builder');
    }
  }, [searchParams]);

  // Handle payment
  const handlePayment = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please log in to continue with payment.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      let candidateIdToSend = candidateId;
      if (!candidateIdToSend) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          candidateIdToSend = payload.sub || payload.candidateId || payload.id;
        } catch (error) {
          // Error parsing token
        }
      }

      const response = await fetch('/api/cv-builder/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(candidateIdToSend ? { candidateId: candidateIdToSend } : {})
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create payment session. Please try again.');
        setIsProcessingPayment(false);
      }
    } catch (error: any) {
      alert('An error occurred. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  // Handle CV upload
  const handleUploadCV = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    if (!candidateId) {
      alert('Please log in to upload your CV.');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('cvFile', selectedFile);

      const response = await fetch('/api/cv-builder/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchOrderStatus();
        setShowUploadModal(false);
        setSelectedFile(null);
        setSuccessMessage('CV uploaded successfully! Our HR team will process it within 24-72 hours.');
        setSuccessType('upload');
        setShowSuccessModal(true);
      } else {
        alert(data.error || 'Failed to upload CV. Please try again.');
      }
    } catch (error: any) {
      alert('An error occurred while uploading. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get status badge
  const getStatusBadge = (order: CVOrder) => {
    if (order.paymentStatus === 'pending') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" />Pending
        </span>
      );
    }
    if (order.paymentStatus === 'completed' && !order.cvFilePath) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />Ready to Upload
        </span>
      );
    }
    if (order.paymentStatus === 'completed' && order.cvFilePath && !order.hasProcessedCv) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <Loader2 className="w-3 h-3 animate-spin" />Processing
        </span>
      );
    }
    if (order.hasProcessedCv) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
          <CheckCircle className="w-3 h-3" />Completed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
        {order.paymentStatus}
      </span>
    );
  };

  // Shimmer loading state
  if (isLoadingOrder) {
    return (
      <div className="w-full space-y-6">
        {/* Header Shimmer */}
        <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          <div className="relative z-10">
            <div className="h-8 w-64 bg-white/20 rounded-lg mb-3 animate-shimmer"></div>
            <div className="h-5 w-96 bg-white/20 rounded-lg animate-shimmer"></div>
          </div>
        </div>

        {/* Stats Cards Shimmer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-7 w-16 bg-gray-200 rounded animate-shimmer"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Shimmer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Section Shimmer */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-6 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-48 bg-gray-200 rounded animate-shimmer"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-shimmer"></div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-shimmer"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-28 bg-gray-200 rounded animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order New CV Section Shimmer */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-6 w-36 bg-gray-200 rounded mb-4 animate-shimmer"></div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-4 w-full bg-gray-200 rounded animate-shimmer"></div>
              ))}
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg mt-6 animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  const completedOrders = orders.filter(o => o.hasProcessedCv).length;
  const inProgressOrders = orders.filter(o => o.paymentStatus === 'completed' && o.cvFilePath && !o.hasProcessedCv).length;

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Professional CV Builder</h1>
            <p className="text-white/90 text-lg">
              Get professionally crafted CVs by our HR experts. Order multiple CVs anytime.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
            <DollarSign className="w-5 h-5" />
            <div>
              <div className="text-xs text-white/80">Price per CV</div>
              <div className="text-sm font-bold">{formattedTZS}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{completedOrders}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{inProgressOrders}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My CV Orders Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#114373]" />
              My CV Orders
            </h2>
            <button
              onClick={fetchOrderStatus}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No CV Orders Yet</h3>
              <p className="text-gray-600 mb-6">Order your first professional CV below</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.candidateName || `Order #${order.id}`}
                        </h3>
                        {getStatusBadge(order)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount:</span>{' '}
                          {new Intl.NumberFormat('en-TZ', {
                            style: 'currency',
                            currency: 'TZS',
                            minimumFractionDigits: 0
                          }).format(order.amountTZS)}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {order.paymentStatus === 'completed' && !order.cvFilePath && (
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload CV
                      </button>
                    )}
                    {order.hasProcessedCv && order.processedCvPath && (
                      <a
                        href={order.processedCvPath}
                        download
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download CV
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order New CV Section */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#114373]" />
            Order New CV
          </h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">Professional CV crafted by HR experts</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">ATS-optimized format</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">24-72 hours processing time</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">Unlimited revisions</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Price:</span>
              <span className="text-lg font-bold text-gray-900">{formattedTZS}</span>
            </div>
            <div className="text-xs text-gray-500 text-right">({formattedUSD})</div>
          </div>
          <button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full bg-gradient-to-r from-[#114373] to-[#0d3559] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0d3559] hover:to-[#114373] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Order New CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload CV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upload CV</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Upload your CV file (PDF, DOC, or DOCX). Our HR team will process it within 24-72 hours.
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">Select File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#114373] file:text-white hover:file:bg-[#0d3559]"
                />
              </label>
              {selectedFile && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleUploadCV}
                disabled={!selectedFile || isUploading}
                className="flex-1 bg-[#114373] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d3559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload CV
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            {successType === 'payment' && (
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowUploadModal(true);
                }}
                className="w-full bg-[#114373] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0d3559] transition-colors mb-2"
              >
                Upload CV Now
              </button>
            )}
            <button
              onClick={() => setShowSuccessModal(false)}
              className={`w-full ${successType === 'payment' ? 'border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors' : 'bg-[#114373] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0d3559] transition-colors'}`}
            >
              {successType === 'payment' ? 'Later' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

