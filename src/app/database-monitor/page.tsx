'use client';

import { useState, useEffect } from 'react';
import { Database, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DatabaseStatus {
  connection: {
    status: string;
    health: string;
  };
  pool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    usagePercentage: number;
    status: string;
  };
  recommendations: string[];
}

export default function DatabaseMonitorPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/database/status');
      const result = await response.json();
      
      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error || 'Failed to fetch database status');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#114373] mx-auto mb-4" />
          <p className="text-gray-600">Loading database status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-[#114373]" />
              <h1 className="text-3xl font-bold text-gray-900">Database Monitor</h1>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-gray-600 mt-2">Monitor database connection pool status and performance</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Connection Status
              </h2>
              <div className={`p-4 rounded-lg border ${getHealthColor(status.connection.health)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(status.connection.health)}
                    <div>
                      <p className="font-medium">Database Connection</p>
                      <p className="text-sm opacity-75 capitalize">{status.connection.status}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium capitalize">{status.connection.health}</span>
                </div>
              </div>
            </div>

            {/* Pool Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Connection Pool
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Connections</span>
                  <span className="font-semibold">{status.pool.totalConnections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Connections</span>
                  <span className="font-semibold text-blue-600">{status.pool.activeConnections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Idle Connections</span>
                  <span className="font-semibold text-green-600">{status.pool.idleConnections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Usage</span>
                  <span className="font-semibold">{status.pool.usagePercentage}%</span>
                </div>
                
                {/* Usage Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Connection Usage</span>
                    <span>{status.pool.usagePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status.pool.usagePercentage > 80 ? 'bg-red-500' : 
                        status.pool.usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(status.pool.usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recommendations
              </h2>
              <div className="space-y-2">
                {status.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-[#114373] rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
