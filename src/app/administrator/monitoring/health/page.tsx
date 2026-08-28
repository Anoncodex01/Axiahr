'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Lock,
  Server,
  AlertCircle
} from 'lucide-react';

interface ApiHealth {
  endpoint: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export default function HealthChecksPage() {
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState({
    ping: { status: 'unknown', responseTime: 0 },
    https: { status: 'unknown', expires: null as Date | null },
    api: { status: 'unknown', responseTime: 0 },
  });
  const [apiHealth, setApiHealth] = useState<ApiHealth[]>([]);

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/administrator/monitoring/health');
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
        setApiHealth(data.apiHealth || []);
      }
    } catch (error) {
      console.error('Error fetching health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-600" />;
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Heart className="w-8 h-8 text-[#114373]" />
          Health Checks
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor ping, HTTPS certificate status, and API response times
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#114373]" />
              <h3 className="font-semibold text-gray-900">Ping Monitoring</h3>
            </div>
            {healthStatus.ping.status === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            Response Time: {healthStatus.ping.responseTime}ms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-[#114373]" />
              <h3 className="font-semibold text-gray-900">HTTPS Certificate</h3>
            </div>
            {healthStatus.https.status === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {healthStatus.https.expires
              ? `Expires: ${new Date(healthStatus.https.expires).toLocaleDateString()}`
              : 'Status unknown'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-[#114373]" />
              <h3 className="font-semibold text-gray-900">API Response</h3>
            </div>
            {healthStatus.api.status === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            Response Time: {healthStatus.api.responseTime}ms
          </p>
        </div>
      </div>

      {/* API Health Checks */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Axia System API Health</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all Axia system API endpoints for availability and performance
          </p>
        </div>

        {apiHealth.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No API health data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiHealth.map((api, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-900">{api.endpoint}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(api.status)}`}>
                        {getStatusIcon(api.status)}
                        <span className="capitalize">{api.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {api.responseTime}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {api.statusCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {api.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

