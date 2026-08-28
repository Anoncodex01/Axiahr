'use client';

import { useState, useEffect } from 'react';
import {
  Info,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Globe,
  Code,
  Database,
  RefreshCw
} from 'lucide-react';

interface SystemInfo {
  nodeVersion: string;
  nextVersion: string;
  platform: string;
  arch: string;
  uptime: number;
  environment: string;
  database: {
    host: string;
    name: string;
    user: string;
  };
  appUrl: string;
}

export default function SystemInfoPage() {
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/administrator/system-info');
      if (response.ok) {
        const data = await response.json();
        setSystemInfo(data);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Info className="w-8 h-8 text-[#114373]" />
            System Information
          </h1>
          <p className="mt-2 text-gray-600">
            View system configuration, versions, and environment details
          </p>
        </div>
        <button
          onClick={fetchSystemInfo}
          className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Code className="w-6 h-6 text-[#114373]" />
              Application
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Node.js Version</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next.js Version</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.nextVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Environment</span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  systemInfo.environment === 'production' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemInfo.environment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Platform</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Architecture</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.arch}</span>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-[#114373]" />
              Database
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Host</span>
                <span className="text-sm font-medium text-gray-900 font-mono">{systemInfo.database.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.database.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">User</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.database.user}</span>
              </div>
            </div>
          </div>

          {/* Server Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-6 h-6 text-[#114373]" />
              Server
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.floor(systemInfo.uptime / 86400)}d {Math.floor((systemInfo.uptime % 86400) / 3600)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">App URL</span>
                <a 
                  href={systemInfo.appUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#114373] hover:underline"
                >
                  {systemInfo.appUrl}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

