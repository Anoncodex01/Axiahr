'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Loader2
} from 'lucide-react';

interface CVOrder {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  amountTZS: number;
  amountUSD: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference?: string;
  stripeSessionId?: string;
  cvFilePath?: string;
  processedCvPath?: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  updatedAt: string;
  canUpload: boolean;
  hasProcessedCv: boolean;
}

export default function CVOrdersPage() {
  const [orders, setOrders] = useState<CVOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 20;
  const [uploadingOrderId, setUploadingOrderId] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Try admin token first, then fallback to authToken
      const token = localStorage.getItem('adminAuthToken') || localStorage.getItem('authToken');
      
      if (!token) {
        setOrders([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('payment_status', filters.paymentStatus);

      const response = await fetch(`/api/admin/cv-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.orders || []);
          setTotal(data.total || 0);
        } else {
          setOrders([]);
          setTotal(0);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setOrders([]);
        setTotal(0);
      }
    } catch (error) {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (order: CVOrder) => {
    if (order.paymentStatus === 'pending') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" />Pending Payment</span>;
    }
    if (order.paymentStatus === 'completed' && !order.cvFilePath) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Ready to Upload</span>;
    }
    if (order.paymentStatus === 'completed' && order.cvFilePath && !order.hasProcessedCv) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Loader2 className="w-3 h-3 animate-spin" />Processing</span>;
    }
    if (order.hasProcessedCv) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Completed</span>;
    }
    if (order.paymentStatus === 'failed') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" />Failed</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{order.paymentStatus}</span>;
  };

  const filteredOrders = orders.filter(order => {
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        order.candidateName.toLowerCase().includes(search) ||
        order.candidateEmail.toLowerCase().includes(search) ||
        order.id.toString().includes(search)
      );
      if (!matchesSearch) return false;
    }

    // Apply status filter
    if (filters.status && order.status !== filters.status) {
      return false;
    }

    // Apply payment status filter
    if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  const handleUploadProcessedCV = async () => {
    if (!selectedOrderId || !uploadFile) {
      setErrorMessage('Please select a file to upload');
      setShowErrorModal(true);
      return;
    }

    setUploadingOrderId(selectedOrderId);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('adminAuthToken') || localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('orderId', selectedOrderId.toString());
      formData.append('file', uploadFile);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success) {
                setUploadProgress(100);
                setTimeout(() => {
                  setShowUploadModal(false);
                  setSelectedOrderId(null);
                  setUploadFile(null);
                  setUploadProgress(0);
                  // Check if email was sent automatically
                  const message = data.emailSent 
                    ? 'Processed CV uploaded and sent to candidate successfully!' 
                    : 'Processed CV uploaded successfully!' + (data.emailError ? `\n\nNote: Email could not be sent automatically. You can send it manually using the email button.` : '');
                  setSuccessMessage(message);
                  setShowSuccessModal(true);
                  fetchOrders(); // Refresh orders
                  resolve();
                }, 500);
              } else {
                setErrorMessage(data.error || 'Failed to upload processed CV');
                setShowErrorModal(true);
                setUploadProgress(0);
                setUploadingOrderId(null);
                reject(new Error(data.error));
              }
            } catch (parseError) {
              setErrorMessage('Failed to parse server response');
              setShowErrorModal(true);
              setUploadProgress(0);
              setUploadingOrderId(null);
              reject(parseError);
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              setErrorMessage(errorData.error || 'Failed to upload processed CV');
              setShowErrorModal(true);
            } catch {
              setErrorMessage('Failed to upload processed CV');
              setShowErrorModal(true);
            }
            setUploadProgress(0);
            setUploadingOrderId(null);
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setErrorMessage('Network error. Please try again.');
          setShowErrorModal(true);
          setUploadProgress(0);
          setUploadingOrderId(null);
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          setUploadProgress(0);
          setUploadingOrderId(null);
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/admin/cv-orders/upload-processed');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error) {
      setErrorMessage('Failed to upload processed CV');
      setShowErrorModal(true);
      setUploadProgress(0);
      setUploadingOrderId(null);
    }
  };


  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">CV Orders Management</h1>
            <p className="text-white/90 text-lg">Manage CV orders, payments, and processing status</p>
          </div>
          <button
            onClick={fetchOrders}
            className="hidden md:flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
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
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.hasProcessedCv).length}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.paymentStatus === 'completed' && o.cvFilePath && !o.hasProcessedCv).length}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(
                  orders.filter(o => o.paymentStatus === 'completed').reduce((sum, o) => sum + o.amountTZS, 0)
                )}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#114373] mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filters.status || filters.paymentStatus 
                ? 'No Orders Found' 
                : 'No CV Orders Yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.status || filters.paymentStatus
                ? 'No CV orders match your search criteria. Try adjusting your filters.'
                : 'There are no CV orders in the system yet.'}
            </p>
            {(searchTerm || filters.status || filters.paymentStatus) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ status: '', paymentStatus: '' });
                }}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors text-sm font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#114373] to-[#0d3559] rounded-full flex items-center justify-center text-white font-semibold">
                          {order.candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{order.candidateName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.candidateEmail}
                          </div>
                          {order.candidatePhone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.candidatePhone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(order.amountTZS)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(order.amountUSD)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.status === 'completed' ? 'Completed' : 
                         order.status === 'processing' ? 'Processing' :
                         order.status === 'delivered' ? 'Delivered' : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      {order.paidAt && (
                        <div className="text-xs text-gray-500">Paid: {formatDate(order.paidAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* View Original CV */}
                        {order.cvFilePath && (
                          <a
                            href={order.cvFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="View Original CV"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {/* Upload Processed CV */}
                        {order.paymentStatus === 'completed' && order.cvFilePath && !order.processedCvPath && (
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setShowUploadModal(true);
                            }}
                            className="p-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors"
                            title="Upload Processed CV"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                        {/* Download Processed CV */}
                        {order.processedCvPath && (
                          <a
                            href={order.processedCvPath}
                            download
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title="Download Processed CV"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Processed CV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload Processed CV</h3>
                <p className="text-sm text-gray-500 mt-1">Upload the professionally processed CV file</p>
              </div>
              <button
                onClick={() => {
                  if (!uploadingOrderId) {
                    setShowUploadModal(false);
                    setSelectedOrderId(null);
                    setUploadFile(null);
                    setUploadProgress(0);
                  }
                }}
                disabled={uploadingOrderId !== null}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* File Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Processed CV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#114373] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadFile(file);
                      setUploadProgress(0);
                    }}
                    disabled={uploadingOrderId !== null}
                    className="hidden"
                    id="cv-file-input"
                  />
                  <label
                    htmlFor="cv-file-input"
                    className={`cursor-pointer flex flex-col items-center gap-3 ${uploadingOrderId !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-12 h-12 bg-[#114373]/10 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[#114373]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {uploadFile ? uploadFile.name : 'Click to select file'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, or DOCX (Max 10MB)
                      </p>
                    </div>
                  </label>
                </div>
                
                {uploadFile && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#114373]" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!uploadingOrderId && (
                        <button
                          onClick={() => {
                            setUploadFile(null);
                            setUploadProgress(0);
                            const input = document.getElementById('cv-file-input') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploadingOrderId !== null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Uploading...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#114373] to-[#0d3559] h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUploadProcessedCV}
                  disabled={!uploadFile || uploadingOrderId !== null}
                  className="flex-1 bg-gradient-to-r from-[#114373] to-[#0d3559] text-white py-3 px-6 rounded-lg hover:from-[#0d3559] hover:to-[#114373] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg"
                >
                  {uploadingOrderId !== null ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload CV</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!uploadingOrderId) {
                      setShowUploadModal(false);
                      setSelectedOrderId(null);
                      setUploadFile(null);
                      setUploadProgress(0);
                    }
                  }}
                  disabled={uploadingOrderId !== null}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="w-full bg-gradient-to-r from-[#114373] to-[#0d3559] text-white py-3 px-6 rounded-lg hover:from-[#0d3559] hover:to-[#114373] transition-all duration-300 font-semibold shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg"
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

