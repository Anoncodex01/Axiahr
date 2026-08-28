'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Database,
  Server,
  Activity,
  AlertTriangle,
  RefreshCw,
  Settings,
  FileText,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Play,
  LogOut,
  BarChart3
} from 'lucide-react';

interface DatabaseStatus {
  current: {
    source: string;
    config: any;
  };
  cpanel: {
    host: string;
    database: string;
    connected: boolean;
    error: string | null;
  };
  vps: {
    host: string;
    database: string;
    connected: boolean;
    error: string | null;
  };
}

interface BackupInfo {
  backups: Array<{
    filename: string;
    size: number;
    created: Date;
  }>;
  backupCount: number;
  latestLog: string;
}

export default function AdministratorDashboard() {
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [runningBackup, setRunningBackup] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [dbRes, backupRes, metricsRes] = await Promise.all([
        fetch('/api/admin/database/status'),
        fetch('/api/admin/database/backup'),
        fetch('/api/admin/system/metrics')
      ]);

      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDbStatus(dbData);
      }

      if (backupRes.ok) {
        const backupData = await backupRes.json();
        setBackupInfo(backupData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        // API returns { success: true, metrics: {...} }
        setSystemMetrics(metricsData.metrics || metricsData);
      } else {
        console.error('Failed to fetch metrics:', metricsRes.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchDatabase = async (target: 'cpanel' | 'vps') => {
    if (!confirm(`Are you sure you want to switch to ${target === 'cpanel' ? 'cPanel' : 'VPS backup'} database?`)) {
      return;
    }

    setSwitching(true);
    try {
      const response = await fetch('/api/admin/database/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully switched to ${target === 'cpanel' ? 'cPanel' : 'VPS backup'} database. Please restart the application.`);
        fetchData();
      } else {
        alert(`Failed to switch: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleRunBackup = async () => {
    if (!confirm('Run manual backup now? This may take a few minutes.')) {
      return;
    }

    setRunningBackup(true);
    try {
      const response = await fetch('/api/admin/database/backup', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup completed successfully!');
        fetchData();
      } else {
        alert(`Backup failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setRunningBackup(false);
    }
  };


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Management Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-[#114373]" />
                Database Management
              </h2>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  dbStatus?.current.source === 'cpanel' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  Current: {dbStatus?.current.source === 'cpanel' ? 'cPanel (Primary)' : 'VPS Backup'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* cPanel Database */}
              <div className={`border-2 rounded-lg p-4 ${
                dbStatus?.cpanel.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">cPanel Database (Primary)</h3>
                  {dbStatus?.cpanel.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Host:</span> {dbStatus?.cpanel.host}</p>
                  <p><span className="font-medium">Database:</span> {dbStatus?.cpanel.database}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={dbStatus?.cpanel.connected ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                      {dbStatus?.cpanel.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleSwitchDatabase('cpanel')}
                  disabled={switching || dbStatus?.current.source === 'cpanel'}
                  className="mt-4 w-full px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {switching ? 'Switching...' : 'Switch to cPanel'}
                </button>
              </div>

              {/* VPS Backup Database */}
              <div className={`border-2 rounded-lg p-4 ${
                dbStatus?.vps.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">VPS Backup Database</h3>
                  {dbStatus?.vps.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Host:</span> {dbStatus?.vps.host}</p>
                  <p><span className="font-medium">Database:</span> {dbStatus?.vps.database}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={dbStatus?.vps.connected ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                      {dbStatus?.vps.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleSwitchDatabase('vps')}
                  disabled={switching || dbStatus?.current.source === 'vps'}
                  className="mt-4 w-full px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {switching ? 'Switching...' : 'Switch to VPS Backup'}
                </button>
              </div>
            </div>

            {/* Backup Management */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#114373]" />
                  Backup Management
                </h3>
                <button
                  onClick={handleRunBackup}
                  disabled={runningBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Play className="w-4 h-4" />
                  {runningBackup ? 'Running Backup...' : 'Run Backup Now'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Total Backups:</span> {backupInfo?.backupCount || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Latest Backup:</span>{' '}
                  {backupInfo?.backups[0] 
                    ? `${new Date(backupInfo.backups[0].created).toLocaleString()} (${formatBytes(backupInfo.backups[0].size)})`
                    : 'No backups yet'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Automated backups run daily at 2:00 AM UTC
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* System Metrics Section */}
        {systemMetrics && (
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-[#114373]" />
                System Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">CPU Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics.cpu?.usage?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MemoryStick className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Memory</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics.memory?.percentage?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Disk Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics.disk?.percentage?.toFixed(1) || '0'}%
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Uptime</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {systemMetrics.uptime ? `${Math.floor(systemMetrics.uptime / 3600)}h` : '0h'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-[#114373]" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/administrator/security"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Server className="w-5 h-5 text-[#114373]" />
                <div>
                  <p className="font-medium text-gray-900">Security</p>
                  <p className="text-sm text-gray-500">Firewall, SSH, Malware, Nginx</p>
                </div>
              </Link>
              <Link
                href="/administrator/logs"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <FileText className="w-5 h-5 text-[#114373]" />
                <div>
                  <p className="font-medium text-gray-900">View Logs</p>
                  <p className="text-sm text-gray-500">System and application logs</p>
                </div>
              </Link>
              <Link
                href="/administrator/monitoring"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <AlertTriangle className="w-5 h-5 text-[#114373]" />
                <div>
                  <p className="font-medium text-gray-900">Monitoring</p>
                  <p className="text-sm text-gray-500">PM2, Health Checks, Alerts</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
    </div>
  );
}

