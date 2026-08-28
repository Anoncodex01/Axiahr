'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Wifi,
  Terminal,
  Bug,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState({
    firewall: { enabled: false, status: 'unknown' },
    ssh: { enabled: false, status: 'unknown' },
    malware: { enabled: false, status: 'unknown' },
    nginx: { enabled: false, status: 'unknown' },
  });

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      // TODO: Implement API endpoint to fetch security status
      // const response = await fetch('/api/administrator/security/status');
      // const data = await response.json();
      // setSecurityStatus(data);
      
      // Placeholder data
      setTimeout(() => {
        setSecurityStatus({
          firewall: { enabled: true, status: 'active' },
          ssh: { enabled: true, status: 'active' },
          malware: { enabled: false, status: 'inactive' },
          nginx: { enabled: true, status: 'active' },
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching security status:', error);
      setLoading(false);
    }
  };

  const securityFeatures = [
    {
      name: 'Firewall & Network Security',
      description: 'Configure UFW firewall, block unused ports, rate-limit SSH, enable fail2ban',
      href: '/administrator/security/firewall',
      icon: Wifi,
      status: securityStatus.firewall,
    },
    {
      name: 'SSH Security',
      description: 'Disable password login, change SSH port, IP whitelist, monitor SSH logs',
      href: '/administrator/security/ssh',
      icon: Terminal,
      status: securityStatus.ssh,
    },
    {
      name: 'Malware Protection',
      description: 'Install malware scanners, scan for malicious files, monitor for rootkits',
      href: '/administrator/security/malware',
      icon: Bug,
      status: securityStatus.malware,
    },
    {
      name: 'Nginx DDoS Protection',
      description: 'Limit request rate, block bots, block suspicious user-agents, WAF rules',
      href: '/administrator/security/nginx',
      icon: Server,
      status: securityStatus.nginx,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading security status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#114373]" />
          Server Security
        </h1>
        <p className="mt-2 text-gray-600">
          Configure and monitor firewall, SSH, malware protection, and Nginx DDoS protection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityFeatures.map((feature) => {
          const Icon = feature.icon;
          const StatusIcon = feature.status.enabled ? CheckCircle : XCircle;
          const statusColor = feature.status.enabled ? 'text-green-600' : 'text-red-600';

          return (
            <Link
              key={feature.name}
              href={feature.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#114373]/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#114373]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                  </div>
                </div>
                <StatusIcon className={`w-6 h-6 ${statusColor} flex-shrink-0`} />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`text-sm font-medium ${statusColor}`}>
                  {feature.status.enabled ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-[#114373] hover:underline">Configure →</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Security Best Practices</h4>
            <ul className="mt-2 text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Keep all security features enabled and up to date</li>
              <li>Regularly review firewall rules and SSH access logs</li>
              <li>Run malware scans weekly</li>
              <li>Monitor Nginx logs for suspicious activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

