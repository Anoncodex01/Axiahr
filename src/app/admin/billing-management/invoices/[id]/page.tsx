'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Send,
  AlertCircle,
  User,
  Briefcase,
  DollarSign,
  Building2,
  CreditCard,
  X
} from 'lucide-react';

interface Invoice {
  id: number;
  invoice_number: string;
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
  position_title: string;
  candidate_first_name: string;
  candidate_last_name: string;
  job_title: string;
  company_name: string;
  employer_email: string;
  created_at: string;
}

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminAuthToken');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load invoice');
      }

      setInvoice(data.data);
      setError('');
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Failed to load invoice');
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
      month: 'long',
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
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Invoice</h3>
          <p className="text-red-800 mb-4">{error || 'Invoice not found'}</p>
          <Link
            href="/admin/billing-management"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/billing-management"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing Management
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Details</h1>
            <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(invoice.status)}`}>
            {getStatusIcon(invoice.status)}
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        {/* Invoice Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{invoice.company_name}</h2>
            <p className="text-sm text-gray-600">{invoice.employer_email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
            <p className="text-lg font-bold text-gray-900">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Invoice Date
            </h3>
            <p className="text-gray-900">{formatDate(invoice.invoice_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Due Date
            </h3>
            <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Candidate & Job Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Candidate
              </h4>
              <p className="text-gray-900 font-medium">
                {invoice.candidate_first_name} {invoice.candidate_last_name}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Position
              </h4>
              <p className="text-gray-900 font-medium">{invoice.position_title || invoice.job_title}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Recruitment Service Commission</p>
                    <p className="text-xs text-gray-500">
                      {invoice.commission_rate}% of offer amount ({formatCurrency(parseFloat(invoice.offer_amount.toString()), invoice.currency)})
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(parseFloat(invoice.subtotal.toString()), invoice.currency)}
                  </td>
                </tr>
                {invoice.tax_rate > 0 && (
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">Tax ({invoice.tax_rate}%)</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(parseFloat(invoice.tax_amount.toString()), invoice.currency)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Total Amount</td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-gray-900">
                    {formatCurrency(parseFloat(invoice.total_amount.toString()), invoice.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Information */}
        {(invoice.status === 'paid' || (invoice as any).effective_status === 'paid') && invoice.paid_date && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-700 mb-1">Paid Date</p>
                <p className="text-green-900 font-medium">{formatDate(invoice.paid_date)}</p>
              </div>
              {invoice.payment_method && (
                <div>
                  <p className="text-sm text-green-700 mb-1">Payment Method</p>
                  <p className="text-green-900 font-medium flex items-center gap-2">
                    {invoice.payment_method === 'stripe' && <CreditCard className="w-4 h-4" />}
                    {invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1)}
                  </p>
                </div>
              )}
              {invoice.payment_reference && (
                <div>
                  <p className="text-sm text-green-700 mb-1">Payment Reference</p>
                  <p className="text-green-900 font-medium">{invoice.payment_reference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
            }}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </button>
          <Link
            href="/admin/billing-management"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Billing
          </Link>
        </div>
      </div>
    </div>
  );
}

