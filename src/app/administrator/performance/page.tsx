'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Clock,
  Zap
} from 'lucide-react';

interface PerformanceMetrics {
  employers: {
    total: number;
    active: number;
    newToday: number;
    growth: number;
  };
  candidates: {
    total: number;
    active: number;
    newToday: number;
    growth: number;
  };
  jobs: {
    total: number;
    active: number;
    postedToday: number;
    growth: number;
  };
  applications: {
    total: number;
    today: number;
    thisWeek: number;
    growth: number;
  };
  system: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
  };
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPerformanceMetrics();
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchPerformanceMetrics();
      }
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/administrator/performance');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#114373]" />
            Performance Metrics
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor Axia web system performance: employers, candidates, jobs, and applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchPerformanceMetrics}
            className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* User Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Employers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Employers</h2>
                </div>
                {metrics.employers.growth !== 0 && (
                  <div className={`flex items-center gap-1 ${getGrowthColor(metrics.employers.growth)}`}>
                    {getGrowthIcon(metrics.employers.growth)}
                    <span className="text-sm font-medium">{Math.abs(metrics.employers.growth)}%</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.employers.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.employers.active)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">New Today</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.employers.newToday)}</p>
                </div>
              </div>
            </div>

            {/* Candidates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Candidates</h2>
                </div>
                {metrics.candidates.growth !== 0 && (
                  <div className={`flex items-center gap-1 ${getGrowthColor(metrics.candidates.growth)}`}>
                    {getGrowthIcon(metrics.candidates.growth)}
                    <span className="text-sm font-medium">{Math.abs(metrics.candidates.growth)}%</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.candidates.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.candidates.active)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">New Today</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.candidates.newToday)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs & Applications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Jobs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Jobs</h2>
                </div>
                {metrics.jobs.growth !== 0 && (
                  <div className={`flex items-center gap-1 ${getGrowthColor(metrics.jobs.growth)}`}>
                    {getGrowthIcon(metrics.jobs.growth)}
                    <span className="text-sm font-medium">{Math.abs(metrics.jobs.growth)}%</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.jobs.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.jobs.active)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posted Today</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.jobs.postedToday)}</p>
                </div>
              </div>
            </div>

            {/* Applications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
                </div>
                {metrics.applications.growth !== 0 && (
                  <div className={`flex items-center gap-1 ${getGrowthColor(metrics.applications.growth)}`}>
                    {getGrowthIcon(metrics.applications.growth)}
                    <span className="text-sm font-medium">{Math.abs(metrics.applications.growth)}%</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.applications.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.applications.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.applications.thisWeek)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#114373]" />
              System Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.system.avgResponseTime}ms</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Requests/Min</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.system.requestsPerMinute)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Error Rate</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.system.errorRate.toFixed(2)}%</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(metrics.system.uptime / 24)}d {Math.floor((metrics.system.uptime % 24))}h
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

