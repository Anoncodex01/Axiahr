'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Bot,
  AlertTriangle
} from 'lucide-react';

export default function NginxDDoSPage() {
  const [loading, setLoading] = useState(true);
  const [nginxStatus, setNginxStatus] = useState({
    rateLimiting: { enabled: false, limit: '10r/s' },
    botBlocking: { enabled: false, blockedBots: 0 },
    userAgentBlocking: { enabled: false, blockedAgents: [] as string[] },
    wafEnabled: false,
  });

  useEffect(() => {
    fetchNginxStatus();
  }, []);

  const fetchNginxStatus = async () => {
    try {
      const response = await fetch('/api/administrator/security/nginx');
      if (response.ok) {
        const data = await response.json();
        setNginxStatus(data);
      }
    } catch (error) {
      console.error('Error fetching Nginx status:', error);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Server className="w-8 h-8 text-[#114373]" />
          Nginx DDoS Protection
        </h1>
        <p className="mt-2 text-gray-600">
          Configure request rate limiting, block bots, block suspicious user-agents, and manage WAF rules
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Limiting</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {nginxStatus.rateLimiting.enabled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Limit</span>
              <span className="text-sm font-medium">{nginxStatus.rateLimiting.limit}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bot Blocking</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              {nginxStatus.botBlocking.enabled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Blocked Bots</span>
              <span className="text-sm font-medium">{nginxStatus.botBlocking.blockedBots}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

