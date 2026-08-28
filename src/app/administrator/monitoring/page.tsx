'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Server,
  Heart,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function MonitoringPage() {
  const monitoringFeatures = [
    {
      name: 'PM2 Monitoring',
      description: 'Monitor PM2 processes, auto-restart, logs, CPU & memory',
      href: '/administrator/monitoring/pm2',
      icon: Server,
    },
    {
      name: 'Health Checks',
      description: 'Ping monitoring, HTTPS certificate status, API response monitoring',
      href: '/administrator/monitoring/health',
      icon: Heart,
    },
    {
      name: 'Error Logs',
      description: 'Nginx error logs, PM2 app logs, system logs',
      href: '/administrator/monitoring/logs',
      icon: FileText,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-[#114373]" />
          Application Uptime & Monitoring
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor PM2 processes, health checks, and error logs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {monitoringFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.name}
              href={feature.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-[#114373]/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#114373]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.name}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

