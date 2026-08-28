'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Video,
  Filter,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface CounsellingOrder {
  id: number;
  candidateId: number;
  candidateName: string;
  email: string;
  phone: string;
  preferredDatetime: string;
  sessionMode: 'online' | 'in_person';
  city?: string;
  notes?: string;
  amountTZS: number;
  amountUSD: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  stripeSessionId?: string;
  status: string;
  sessionCompletedAt?: string;
  counsellorNotes?: string;
  createdAt: string;
  paidAt?: string;
  updatedAt: string;
}

export default function CareerCounsellingPage() {
  const [orders, setOrders] = useState<CounsellingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 20;
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CounsellingOrder | null>(null);
  const [counsellorNotes, setCounsellorNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
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

      const response = await fetch(`/api/admin/career-counselling?${params}`, {
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

  const getStatusBadge = (order: CounsellingOrder) => {
    if (order.paymentStatus === 'pending') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" />Pending Payment</span>;
    }
    if (order.paymentStatus === 'completed' && order.status === 'scheduled') {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Calendar className="w-3 h-3" />Scheduled</span>;
    }
    if (order.status === 'completed') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Completed</span>;
    }
    if (order.paymentStatus === 'failed') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" />Failed</span>;
    }
    return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{order.status}</span>;
  };

  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        order.candidateName.toLowerCase().includes(search) ||
        order.email.toLowerCase().includes(search) ||
        order.id.toString().includes(search)
      );
      if (!matchesSearch) return false;
    }

    if (filters.status && order.status !== filters.status) {
      return false;
    }

    if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(total / itemsPerPage);

  const handleMarkAsCompleted = (order: CounsellingOrder) => {
    setSelectedOrder(order);
    setCounsellorNotes(order.counsellorNotes || '');
    setShowCompleteModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('adminAuthToken') || localStorage.getItem('authToken');
      const response = await fetch('/api/admin/career-counselling/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: 'completed',
          counsellorNotes: counsellorNotes.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Counselling session marked as completed successfully!');
        setShowSuccessModal(true);
        setShowCompleteModal(false);
        setSelectedOrder(null);
        setCounsellorNotes('');
        fetchOrders(); // Refresh orders
      } else {
        setErrorMessage(data.error || 'Failed to update order status');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setErrorMessage('An error occurred while updating the order');
      setShowErrorModal(true);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#114373] via-[#1a4d7a] to-[#114373] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Career Counselling Orders</h1>
            <p className="text-white/90 text-lg">Manage career counselling bookings and sessions</p>
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
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
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
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
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
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filters.status || filters.paymentStatus 
                ? 'No Orders Found' 
                : 'No Career Counselling Bookings Yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filters.status || filters.paymentStatus
                ? 'No bookings match your search criteria. Try adjusting your filters.'
                : 'There are no career counselling bookings in the system yet.'}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Session Details</th>
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
                            {order.email}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.preferredDatetime)}
                        </div>
                        <div className="flex items-center gap-1">
                          {order.sessionMode === 'online' ? (
                            <Video className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MapPin className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-xs text-gray-600">
                            {order.sessionMode === 'online' ? 'Online' : `In-person${order.city ? ` - ${order.city}` : ''}`}
                          </span>
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
                         order.status === 'scheduled' ? 'Scheduled' :
                         order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      {order.paidAt && (
                        <div className="text-xs text-gray-500">Paid: {formatDate(order.paidAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {order.paymentStatus === 'completed' && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleMarkAsCompleted(order)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-1"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Completed
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                        {order.paymentStatus === 'pending' && (
                          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-sm font-semibold">
                            Waiting for Payment
                          </span>
                        )}
                        {order.paymentStatus === 'failed' && (
                          <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-semibold">
                            Payment Failed
                          </span>
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

      {/* Mark as Completed Modal */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mark Session as Completed</h3>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedOrder(null);
                  setCounsellorNotes('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Candidate:</span> {selectedOrder.candidateName}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Session Date:</span> {formatDate(selectedOrder.preferredDatetime)}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Mode:</span> {selectedOrder.sessionMode === 'online' ? 'Online' : 'In-person'}
                  {selectedOrder.city && ` - ${selectedOrder.city}`}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counsellor Notes (optional)
                </label>
                <textarea
                  rows={4}
                  value={counsellorNotes}
                  onChange={(e) => setCounsellorNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent"
                  placeholder="Add any notes about the counselling session..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Mark as Completed
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedOrder(null);
                  setCounsellorNotes('');
                }}
                disabled={isUpdating}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error!</h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

