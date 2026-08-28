'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Shield,
  Users,
  FileText,
  Mail,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  BarChart3,
  Zap,
  AlertCircle,
  Info,
  FileSearch,
  Filter,
  Download,
  Search,
  X
} from 'lucide-react';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    cached: number;
    free: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  timestamp: string;
}

interface ApplicationMetrics {
  newApplications: {
    today: number;
    thisWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
  apiErrorRate: {
    current: number;
    threshold: number;
    status: 'ok' | 'warning' | 'critical';
  };
  databaseConnections: {
    active: number;
    max: number;
    errors: number;
  };
  confirmationTime: {
    median: number;
    average: number;
    status: 'ok' | 'warning' | 'critical';
  };
  queueDepth: {
    pending: number;
    processing: number;
    failed: number;
  };
}

interface Alert {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

interface IPWhitelistEntry {
  id: string;
  ip: string;
  description: string;
  createdAt: string;
  createdBy: string;
  active: boolean;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
}

export default function SystemAdminDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [newIP, setNewIP] = useState({ ip: '', description: '' });
  const [showIPForm, setShowIPForm] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState('application');
  const [logSearch, setLogSearch] = useState('');
  const [logLines, setLogLines] = useState(100);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch system metrics
  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/metrics');
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  // Fetch application metrics
  const fetchAppMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/app-metrics');
      if (response.ok) {
        const data = await response.json();
        setAppMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching app metrics:', error);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/system/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch IP whitelist
  const fetchIPWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/system/ip-whitelist');
      if (response.ok) {
        const data = await response.json();
        setIpWhitelist(data.whitelist || []);
      }
    } catch (error) {
      console.error('Error fetching IP whitelist:', error);
    }
  };

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        type: logType,
        lines: logLines.toString(),
        ...(logSearch && { search: logSearch })
      });
      const response = await fetch(`/api/admin/system/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, [logType, logSearch, logLines]);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSystemMetrics(),
      fetchAppMetrics(),
      fetchAlerts(),
      fetchIPWhitelist()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Add IP to whitelist
  const handleAddIP = async () => {
    if (!newIP.ip.trim()) return;

    try {
      const response = await fetch('/api/admin/system/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIP)
      });

      if (response.ok) {
        setNewIP({ ip: '', description: '' });
        setShowIPForm(false);
        fetchIPWhitelist();
      }
    } catch (error) {
      console.error('Error adding IP:', error);
    }
  };

  // Remove IP from whitelist
  const handleRemoveIP = async (id: string) => {
    if (!confirm('Are you sure you want to remove this IP from the whitelist?')) return;

    try {
      const response = await fetch(`/api/admin/system/ip-whitelist/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchIPWhitelist();
      }
    } catch (error) {
      console.error('Error removing IP:', error);
    }
  };

  // Toggle IP active status
  const handleToggleIP = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/admin/system/ip-whitelist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active })
      });

      if (response.ok) {
        fetchIPWhitelist();
      }
    } catch (error) {
      console.error('Error toggling IP:', error);
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/system/alerts/${id}/acknowledge`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-100 text-red-800 border-red-300';
      case 'P1': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'P2': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !systemMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Server className="w-8 h-8 text-blue-600" />
                System Administrator Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage your server infrastructure</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Auto-refresh:</label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!autoRefresh}
              >
                <option value="10">10 seconds</option>
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
              </select>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {alerts.filter(a => !a.resolved && a.priority === 'P0').length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Critical Alerts (P0)</h2>
            </div>
            <div className="space-y-3">
              {alerts.filter(a => !a.resolved && a.priority === 'P0').map(alert => (
                <div key={alert.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">P0</span>
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      </div>
                      <p className="text-sm text-gray-700">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">CPU Usage</h3>
              </div>
              {systemMetrics && (
                <span className={`text-lg font-bold ${systemMetrics.cpu.usage > 80 ? 'text-red-600' : systemMetrics.cpu.usage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {systemMetrics.cpu.usage.toFixed(1)}%
                </span>
              )}
            </div>
            {systemMetrics && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      systemMetrics.cpu.usage > 80 ? 'bg-red-600' : systemMetrics.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemMetrics.cpu.usage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  Cores: {systemMetrics.cpu.cores} | Load: {systemMetrics.cpu.loadAverage[0].toFixed(2)}
                </div>
              </>
            )}
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Memory</h3>
              </div>
              {systemMetrics && (
                <span className={`text-lg font-bold ${systemMetrics.memory.percentage > 90 ? 'text-red-600' : systemMetrics.memory.percentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {systemMetrics.memory.percentage.toFixed(1)}%
                </span>
              )}
            </div>
            {systemMetrics && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      systemMetrics.memory.percentage > 90 ? 'bg-red-600' : systemMetrics.memory.percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemMetrics.memory.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
                </div>
              </>
            )}
          </div>

          {/* Disk Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Disk Space</h3>
              </div>
              {systemMetrics && (
                <span className={`text-lg font-bold ${systemMetrics.disk.percentage > 90 ? 'text-red-600' : systemMetrics.disk.percentage > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {systemMetrics.disk.percentage.toFixed(1)}%
                </span>
              )}
            </div>
            {systemMetrics && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      systemMetrics.disk.percentage > 90 ? 'bg-red-600' : systemMetrics.disk.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemMetrics.disk.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">
                  {formatBytes(systemMetrics.disk.used)} / {formatBytes(systemMetrics.disk.total)} free
                </div>
              </>
            )}
          </div>

          {/* Uptime */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">Uptime</h3>
              </div>
            </div>
            {systemMetrics && (
              <div className="text-2xl font-bold text-gray-900">
                {formatUptime(systemMetrics.uptime)}
              </div>
            )}
            {systemMetrics && (
              <div className="text-xs text-gray-600 mt-2">
                Last updated: {new Date(systemMetrics.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Application Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Flow Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Business Flow Metrics
            </h2>
            {appMetrics && (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">New Applications Today</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{appMetrics.newApplications.today}</span>
                      {appMetrics.newApplications.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {appMetrics.newApplications.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">This week: {appMetrics.newApplications.thisWeek}</div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">API Error Rate</span>
                    <span className={`text-lg font-bold ${getStatusColor(appMetrics.apiErrorRate.status)}`}>
                      {appMetrics.apiErrorRate.current.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Threshold: {appMetrics.apiErrorRate.threshold}%</div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Confirmation Time</span>
                    <span className={`text-lg font-bold ${getStatusColor(appMetrics.confirmationTime.status)}`}>
                      {appMetrics.confirmationTime.median.toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Average: {appMetrics.confirmationTime.average.toFixed(1)}s</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Queue Depth</span>
                    <span className="text-lg font-bold text-gray-900">{appMetrics.queueDepth.pending}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Processing: {appMetrics.queueDepth.processing} | Failed: {appMetrics.queueDepth.failed}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Database & Network */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-green-600" />
              Database & Network
            </h2>
            {appMetrics && systemMetrics && (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">DB Connections</span>
                    <span className={`text-xl font-bold ${appMetrics.databaseConnections.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {appMetrics.databaseConnections.active} / {appMetrics.databaseConnections.max}
                    </span>
                  </div>
                  {appMetrics.databaseConnections.errors > 0 && (
                    <div className="text-xs text-red-600 font-medium">Errors: {appMetrics.databaseConnections.errors}</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">Network Traffic</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">In:</span>
                      <span className="font-bold text-gray-900">{formatBytes(systemMetrics.network.bytesIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Out:</span>
                      <span className="font-bold text-gray-900">{formatBytes(systemMetrics.network.bytesOut)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IP Whitelist Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              IP Whitelist Management
            </h2>
            <button
              onClick={() => setShowIPForm(!showIPForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              Add IP
            </button>
          </div>

          {showIPForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                  <input
                    type="text"
                    value={newIP.ip}
                    onChange={(e) => setNewIP({ ...newIP, ip: e.target.value })}
                    placeholder="192.168.1.100 or 192.168.1.0/24"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newIP.description}
                    onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
                    placeholder="Office network, Home IP, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddIP}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add to Whitelist
                </button>
                <button
                  onClick={() => {
                    setShowIPForm(false);
                    setNewIP({ ip: '', description: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">IP Address</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ipWhitelist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No IP addresses whitelisted. Add one to restrict admin access.
                    </td>
                  </tr>
                ) : (
                  ipWhitelist.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-sm font-mono bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1.5 rounded font-semibold">{entry.ip}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{entry.description || 'No description'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleIP(entry.id, entry.active)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                            entry.active
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          {entry.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveIP(entry.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">IP Whitelist Information</p>
                <p>When IP whitelist is enabled, only the listed IP addresses can access the admin panel. Leave empty to allow all IPs.</p>
                <p className="mt-2">You can use CIDR notation (e.g., 192.168.1.0/24) to whitelist entire networks.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Viewer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-indigo-600" />
              System & Application Logs
            </h2>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Log Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Log Type</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="application">Application Logs</option>
                <option value="system">System Logs</option>
                <option value="pm2">PM2 Logs</option>
                <option value="nginx">Nginx Logs</option>
                <option value="database">Database Logs</option>
                <option value="error">Error Logs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lines to Show</label>
              <select
                value={logLines}
                onChange={(e) => setLogLines(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="50">50 lines</option>
                <option value="100">100 lines</option>
                <option value="200">200 lines</option>
                <option value="500">500 lines</option>
                <option value="1000">1000 lines</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {logSearch && (
                  <button
                    onClick={() => setLogSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logs Display */}
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {logsLoading ? (
              <div className="text-gray-400 text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <FileSearch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No logs found</p>
                <p className="text-xs mt-2">Logs may not be available or log files don't exist yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => {
                  const getLevelColor = (level: string) => {
                    const upperLevel = level.toUpperCase();
                    if (upperLevel.includes('ERROR')) return 'text-red-400';
                    if (upperLevel.includes('WARN')) return 'text-yellow-400';
                    if (upperLevel.includes('INFO')) return 'text-blue-400';
                    if (upperLevel.includes('DEBUG')) return 'text-gray-400';
                    return 'text-gray-300';
                  };

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 hover:bg-gray-800 px-2 py-1 rounded"
                    >
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-semibold ${getLevelColor(log.level)}`}>
                        [{log.level}]
                      </span>
                      <span className="text-gray-400 text-xs">[{log.source}]</span>
                      <span className="text-gray-300 flex-1 break-words">{log.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Showing {logs.length} log entries</span>
              <button
                onClick={() => {
                  const logText = logs.map(log => 
                    `[${log.timestamp}] [${log.level}] [${log.source}] ${log.message}`
                  ).join('\n');
                  const blob = new Blob([logText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `logs-${logType}-${new Date().toISOString()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              >
                <Download className="w-4 h-4" />
                Download Logs
              </button>
            </div>
          )}
        </div>

        {/* All Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />
            System Alerts
          </h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(alert.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <h3 className="font-semibold">{alert.title}</h3>
                        {alert.acknowledged && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">Acknowledged</span>
                        )}
                        {alert.resolved && (
                          <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">Resolved</span>
                        )}
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <p className="text-xs opacity-75">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3 py-1 bg-white border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

