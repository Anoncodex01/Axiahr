'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, Calendar, DollarSign } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  const stats = [
    { title: 'Total Candidates', value: '1,247', change: '+12%', color: 'bg-blue-500' },
    { title: 'Active Jobs', value: '89', change: '+5%', color: 'bg-green-500' },
    { title: 'Applications', value: '3,456', change: '+18%', color: 'bg-purple-500' },
    { title: 'Placements', value: '156', change: '+8%', color: 'bg-orange-500' }
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-lg text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#114373] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
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
                <p className="text-sm text-green-600">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Module Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          We're developing advanced analytics features including:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">• Performance dashboards</p>
            <p className="text-sm text-gray-600">• Candidate flow analytics</p>
            <p className="text-sm text-gray-600">• Job posting performance</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">• Revenue analytics</p>
            <p className="text-sm text-gray-600">• Conversion tracking</p>
            <p className="text-sm text-gray-600">• Custom reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
