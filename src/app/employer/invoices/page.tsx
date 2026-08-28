'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EmployerLayout from '@/components/EmployerLayout';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Eye,
  Send,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ExternalLink
} from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
  offer_letter_id: number;
  application_id: number;
  employer_id: number;
  candidate_id: number;
  job_id: number;
  subtotal: number;
  tax_rate: number;
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
  notes: string | null;
  pdf_url: string | null;
  payment_link: string | null;
  position_title: string;
  candidate_first_name: string;
  candidate_last_name: string;
  job_title: string;
  company_name: string;
  employer_email: string;
  created_at: string;
  updated_at: string;
}

export default function EmployerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('employerAuthToken') || localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please login to view invoices');
        return;
      }

      const url = filterStatus === 'all' 
        ? '/api/invoices'
        : `/api/invoices?status=${filterStatus}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load invoices');
      }

      console.log('📋 Invoices loaded:', {
        count: data.count,
        invoices: data.data,
        success: data.success
      });

      setInvoices(data.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    if (currency === 'TZS') {
      // Format TZS - show as TZS 1,000,000 (without currency symbol from Intl, just add TZS prefix)
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
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'draft':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
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
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent' || i.status === 'draft').length,
    overdue: invoices.filter(i => isOverdue(i.due_date, i.status)).length,
    totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0),
    pendingAmount: invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0)
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading invoices...</p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">View and manage your recruitment service invoices</p>
          </div>
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.paidAmount, 'TZS')}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.pendingAmount, 'TZS')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'overdue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-4">You don't have any invoices yet.</p>
            <p className="text-sm text-gray-500">
              Invoices are automatically generated when a candidate accepts an offer.
            </p>
            <button
              onClick={loadInvoices}
              className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`bg-white rounded-xl border-2 ${
                  isOverdue(invoice.due_date, invoice.status)
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200'
                } p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {invoice.invoice_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                      {isOverdue(invoice.due_date, invoice.status) && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Position</p>
                        <p className="text-sm font-medium text-gray-900">{invoice.position_title || invoice.job_title}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Candidate</p>
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.candidate_first_name} {invoice.candidate_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(invoice.total_amount.toString()), invoice.currency)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Invoice Date: {formatDate(invoice.invoice_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Due Date: {formatDate(invoice.due_date)}</span>
                      </div>
                      {invoice.paid_date && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Paid: {formatDate(invoice.paid_date)}</span>
                        </div>
                      )}
                    </div>

                    {invoice.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{invoice.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    {invoice.status === 'paid' ? (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </span>
                    ) : invoice.payment_link ? (
                      <a
                        href={invoice.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('employerAuthToken') || localStorage.getItem('authToken');
                            const response = await fetch('/api/payments/stripe/create-checkout-session', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ invoiceId: invoice.id })
                            });
                            const data = await response.json();
                            if (data.success && data.paymentLink) {
                              window.open(data.paymentLink, '_blank');
                              // Reload invoices to get updated payment link
                              setTimeout(() => loadInvoices(), 1000);
                            } else {
                              alert('Failed to create payment link: ' + (data.error || 'Unknown error'));
                            }
                          } catch (error) {
                            console.error('Error creating payment link:', error);
                            alert('Failed to create payment link');
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                      >
                        <CreditCard className="w-4 h-4" />
                        Generate Payment Link
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Open invoice in new window or download PDF
                        window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <Link
                      href={`/employer/invoices/${invoice.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium text-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </EmployerLayout>
  );
}

