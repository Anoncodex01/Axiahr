'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  Building2,
  FileText,
  ExternalLink,
  Calendar,
  TrendingUp,
  Eye,
  RotateCw
} from 'lucide-react';

interface Payment {
  id: number;
  invoice_id: number | null;
  invoice_number: string | null;
  offer_letter_id: number | null;
  employer_id: number;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  payment_reference: string | null;
  stripe_payment_intent_id: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
  company_name: string;
  employer_email: string;
  candidate_first_name: string | null;
  candidate_last_name: string | null;
  job_title: string | null;
  position_title: string | null;
}

export default function PaymentTrackingPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });
  const [syncingPayment, setSyncingPayment] = useState<number | null>(null);

  useEffect(() => {
    loadPayments();
  }, [statusFilter, dateRange]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminAuthToken');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        let paymentsData = data.data || [];
        
        // Filter by date range
        if (dateRange !== 'all') {
          const now = new Date();
          const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
          const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          paymentsData = paymentsData.filter((p: Payment) => {
            const paymentDate = new Date(p.created_at);
            return paymentDate >= cutoffDate;
          });
        }

        setPayments(paymentsData);
        
        // Calculate statistics
        const total = paymentsData.length;
        const completed = paymentsData.filter((p: Payment) => p.payment_status === 'completed').length;
        const pending = paymentsData.filter((p: Payment) => p.payment_status === 'pending' || p.payment_status === 'processing').length;
        const failed = paymentsData.filter((p: Payment) => p.payment_status === 'failed').length;
        const totalAmount = paymentsData
          .filter((p: Payment) => p.payment_status === 'completed')
          .reduce((sum: number, p: Payment) => sum + parseFloat(p.amount.toString()), 0);
        
        setStats({
          total,
          completed,
          pending,
          failed,
          totalAmount
        });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    if (currency === 'TZS') {
      const formatted = new Intl.NumberFormat('en-TZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `TZS ${formatted}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'refunded':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleSyncPayment = async (payment: Payment) => {
    if (!payment.stripe_payment_intent_id && !payment.payment_reference) {
      alert('No Stripe payment reference found for this payment');
      return;
    }

    setSyncingPayment(payment.id);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminAuthToken');
      const response = await fetch('/api/payments/stripe/manual-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: payment.payment_reference,
          paymentIntentId: payment.stripe_payment_intent_id,
          invoiceId: payment.invoice_id
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Payment status synced successfully!');
        loadPayments(); // Reload payments
      } else {
        alert(`Failed to sync: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error syncing payment:', error);
      alert(`Error syncing payment: ${error.message}`);
    } finally {
      setSyncingPayment(null);
    }
  };

  // Filter payments by search term
  const filteredPayments = payments.filter((payment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.invoice_number?.toLowerCase().includes(searchLower) ||
      payment.company_name?.toLowerCase().includes(searchLower) ||
      payment.employer_email?.toLowerCase().includes(searchLower) ||
      payment.payment_reference?.toLowerCase().includes(searchLower) ||
      payment.stripe_payment_intent_id?.toLowerCase().includes(searchLower) ||
      `${payment.candidate_first_name} ${payment.candidate_last_name}`.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
              <p className="text-gray-600 mt-1">Monitor and track all payment transactions</p>
            </div>
            <button
              onClick={loadPayments}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice, company, email, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 font-medium">No payments found</p>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">#{payment.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.invoice_number ? (
                          <Link
                            href={`/admin/billing-management/invoices/${payment.invoice_id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            {payment.invoice_number}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.company_name}</p>
                            <p className="text-xs text-gray-500">{payment.employer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.candidate_first_name || payment.candidate_last_name ? (
                          <span className="text-sm text-gray-900">
                            {payment.candidate_first_name} {payment.candidate_last_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(parseFloat(payment.amount.toString()), payment.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                          {getStatusIcon(payment.payment_status)}
                          {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {payment.payment_method ? (
                            <span className="flex items-center gap-1">
                              {payment.payment_method === 'stripe' && <CreditCard className="w-4 h-4" />}
                              {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{formatDate(payment.payment_date)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {payment.stripe_payment_intent_id && (
                            <span className="text-xs text-gray-600 font-mono">
                              Stripe: {payment.stripe_payment_intent_id.substring(0, 20)}...
                            </span>
                          )}
                          {payment.payment_reference && (
                            <span className="text-xs text-gray-600">
                              Ref: {payment.payment_reference}
                            </span>
                          )}
                          {!payment.stripe_payment_intent_id && !payment.payment_reference && (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {payment.invoice_id && (
                            <Link
                              href={`/admin/billing-management/invoices/${payment.invoice_id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          {payment.stripe_payment_intent_id && (
                            <a
                              href={`https://dashboard.stripe.com/test/payments/${payment.stripe_payment_intent_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View in Stripe"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {(payment.stripe_payment_intent_id || payment.payment_reference) && payment.payment_status !== 'completed' && (
                            <button
                              onClick={() => handleSyncPayment(payment)}
                              disabled={syncingPayment === payment.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Sync with Stripe"
                            >
                              {syncingPayment === payment.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {filteredPayments.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{filteredPayments.length}</span> payment{filteredPayments.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Completed: </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      filteredPayments
                        .filter((p) => p.payment_status === 'completed')
                        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

