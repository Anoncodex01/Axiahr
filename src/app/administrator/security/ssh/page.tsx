'use client';

import { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SSHSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [sshStatus, setSshStatus] = useState({
    passwordLogin: true,
    port: 22,
    ipWhitelist: [] as string[],
    logMonitoring: false,
  });
  const [configuring, setConfiguring] = useState(false);
  const [showIPForm, setShowIPForm] = useState(false);
  const [newIP, setNewIP] = useState('');

  useEffect(() => {
    fetchSSHStatus();
  }, []);

  const fetchSSHStatus = async () => {
    try {
      const response = await fetch('/api/administrator/security/ssh');
      if (response.ok) {
        const data = await response.json();
        setSshStatus(data);
      }
    } catch (error) {
      console.error('Error fetching SSH status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordLogin = async () => {
    if (!confirm('Disabling password login will require SSH keys for all access. Continue?')) {
      return;
    }

    setConfiguring(true);
    try {
      const response = await fetch('/api/administrator/security/ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable_password_login'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchSSHStatus();
        alert('SSH password login disabled');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConfiguring(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP) return;

    setConfiguring(true);
    try {
      const response = await fetch('/api/administrator/security/ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_ip_whitelist',
          ip: newIP
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchSSHStatus();
        setNewIP('');
        setShowIPForm(false);
        alert('IP added to whitelist');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConfiguring(false);
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
          <Terminal className="w-8 h-8 text-[#114373]" />
          SSH Security
        </h1>
        <p className="mt-2 text-gray-600">
          Configure SSH security settings, disable password login, change port, and manage IP whitelist
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SSH Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SSH Configuration</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Password Login</p>
                <p className="text-sm text-gray-500">Allow password authentication</p>
              </div>
              <div className="flex items-center gap-2">
                {sshStatus.passwordLogin ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                <button
                  onClick={handleTogglePasswordLogin}
                  disabled={configuring}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    sshStatus.passwordLogin
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {sshStatus.passwordLogin ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">SSH Port</p>
                <p className="text-sm text-gray-500">Current port: {sshStatus.port}</p>
              </div>
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                disabled
              >
                Change Port
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Log Monitoring</p>
                <p className="text-sm text-gray-500">Monitor SSH access logs</p>
              </div>
              {sshStatus.logMonitoring ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">IP Whitelist</h2>
            <button
              onClick={() => setShowIPForm(!showIPForm)}
              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] text-sm"
            >
              {showIPForm ? 'Cancel' : 'Add IP'}
            </button>
          </div>

          {showIPForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="IP address or CIDR (e.g., 192.168.1.0/24)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] mb-2"
              />
              <button
                onClick={handleAddIP}
                disabled={!newIP || configuring}
                className="w-full px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50"
              >
                Add IP
              </button>
            </div>
          )}

          <div className="space-y-2">
            {sshStatus.ipWhitelist.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No IPs whitelisted</p>
            ) : (
              sshStatus.ipWhitelist.map((ip, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-mono text-gray-700">{ip}</span>
                  <button
                    className="text-red-600 hover:text-red-800 text-sm"
                    onClick={async () => {
                      if (confirm(`Remove ${ip} from whitelist?`)) {
                        // TODO: Implement remove IP
                        await fetchSSHStatus();
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

