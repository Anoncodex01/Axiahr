'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  Play,
  Square,
  Activity,
  Cpu,
  MemoryStick
} from 'lucide-react';

export default function PM2MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [pm2Status, setPm2Status] = useState<any>(null);

  useEffect(() => {
    fetchPM2Status();
    const interval = setInterval(fetchPM2Status, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPM2Status = async () => {
    try {
      const response = await fetch('/api/administrator/monitoring/pm2');
      if (response.ok) {
        const data = await response.json();
        setPm2Status(data);
      }
    } catch (error) {
      console.error('Error fetching PM2 status:', error);
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
          PM2 Monitoring
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor PM2 processes, ensure auto-start, view logs, and track CPU & memory usage
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">PM2 Processes</h2>
          <button
            onClick={fetchPM2Status}
            className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {pm2Status?.processes ? (
          <div className="space-y-4">
            {pm2Status.processes.map((proc: any) => (
              <div key={proc.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{proc.name}</h3>
                    <p className="text-sm text-gray-500">Status: {proc.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{proc.cpu}%</span>
                    <MemoryStick className="w-4 h-4 text-gray-400 ml-4" />
                    <span className="text-sm">{proc.memory}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No PM2 processes found</p>
        )}
      </div>
    </div>
  );
}

