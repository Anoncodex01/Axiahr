'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, Filter, Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function FinanceManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = [
    { title: 'Total Revenue', value: '$284,500', change: '+23%', color: 'bg-green-500' },
    { title: 'Pending Invoices', value: '23', change: '-3%', color: 'bg-yellow-500' },
    { title: 'Paid Invoices', value: '156', change: '+8%', color: 'bg-blue-500' },
    { title: 'Overdue Payments', value: '5', change: '-12%', color: 'bg-red-500' }
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-lg text-gray-600">Manage invoices, payments, and financial reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <DollarSign className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Finance Module Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          We're working on implementing comprehensive finance management features including:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">• Invoice generation and management</p>
            <p className="text-sm text-gray-600">• Payment tracking and processing</p>
            <p className="text-sm text-gray-600">• Financial reporting and analytics</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">• Receipt generation</p>
            <p className="text-sm text-gray-600">• Payment notifications</p>
            <p className="text-sm text-gray-600">• Revenue analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}
