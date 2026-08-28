'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  User,
  CreditCard,
  Send,
  Plus,
  ExternalLink,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  employer_id: number;
  candidate_id: number;
  job_id: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  commission_rate: number;
  offer_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoice_date: string;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  position_title: string;
  candidate_first_name: string;
  candidate_last_name: string;
  job_title: string;
  company_name: string;
  employer_email: string;
  created_at: string;
}

interface Payment {
  id: number;
  invoice_id: number | null;
  invoice_number: string | null;
  employer_id: number;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  payment_reference: string | null;
  stripe_payment_intent_id: string | null;
  payment_date: string | null;
  created_at: string;
  company_name: string;
}

export default function BillingManagementPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30d');

  useEffect(() => {
    loadData();
  }, [statusFilter, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminAuthToken');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Load invoices
      const invoicesResponse = await fetch(`/api/invoices?status=${statusFilter === 'all' ? '' : statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const invoicesData = await invoicesResponse.json();
      if (invoicesData.success) {
        setInvoices(invoicesData.data || []);
      }

      // Load payments
      const paymentsResponse = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const paymentsData = await paymentsResponse.json();
      if (paymentsData.success) {
        setPayments(paymentsData.data || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled':
      case 'refunded':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'overdue':
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  // Calculate statistics
  const stats = {
    totalInvoices: invoices.length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0),
    pendingAmount: invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0),
    overdueAmount: invoices.filter(i => isOverdue(i.due_date, i.status)).reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0),
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.payment_status === 'completed').length,
    pendingPayments: payments.filter(p => p.payment_status === 'pending' || p.payment_status === 'processing').length
  };

  // Filter data
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${invoice.candidate_first_name} ${invoice.candidate_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
      (payment.invoice_number && payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      payment.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.payment_reference && payment.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
          <p className="text-lg text-gray-600">Manage invoices, payments, and billing operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue, 'TZS')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices - invoices.filter(i => i.status === 'paid').length}</p>
              <p className="text-xs text-gray-500">{formatCurrency(stats.pendingAmount, 'TZS')}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.filter(i => isOverdue(i.due_date, i.status)).length}</p>
              <p className="text-xs text-gray-500">{formatCurrency(stats.overdueAmount, 'TZS')}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              <p className="text-xs text-gray-500">{stats.completedPayments} completed</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Invoices ({invoices.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Tracking ({payments.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number, company, candidate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'invoices' ? (
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-600">No invoices match your search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Position</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{invoice.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {invoice.candidate_first_name} {invoice.candidate_last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{invoice.position_title || invoice.job_title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(invoice.total_amount.toString()), invoice.currency)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                            {isOverdue(invoice.due_date, invoice.status) && (
                              <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{formatDate(invoice.due_date)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/billing-management/invoices/${invoice.id}`}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-600">No payments match your search criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Employer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Payment Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">#{payment.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{payment.invoice_number || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{payment.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(payment.amount.toString()), payment.currency)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                              {getStatusIcon(payment.payment_status)}
                              {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {payment.payment_method === 'stripe' ? (
                                <>
                                  <CreditCard className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">Stripe</span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">{payment.payment_method || 'N/A'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {payment.stripe_payment_intent_id && (
                                <a
                                  href={`https://dashboard.stripe.com/payments/${payment.stripe_payment_intent_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View in Stripe"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {payment.payment_reference && (
                                <span className="text-xs text-gray-500" title={`Reference: ${payment.payment_reference}`}>
                                  {payment.payment_reference.substring(0, 8)}...
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

