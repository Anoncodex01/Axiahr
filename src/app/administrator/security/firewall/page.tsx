'use client';

import { useState, useEffect } from 'react';
import {
  Wifi,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';

export default function FirewallPage() {
  const [loading, setLoading] = useState(true);
  const [firewallStatus, setFirewallStatus] = useState({
    enabled: false,
    allowedPorts: [] as number[],
    blockedPorts: [] as number[],
    fail2ban: { enabled: false, activeJails: [] as string[] },
    rateLimit: { enabled: false, sshAttempts: 0 },
  });
  const [configuring, setConfiguring] = useState(false);
  const [showPortForm, setShowPortForm] = useState(false);
  const [newPort, setNewPort] = useState({ port: '', protocol: 'tcp' });

  useEffect(() => {
    fetchFirewallStatus();
  }, []);

  const fetchFirewallStatus = async () => {
    try {
      const response = await fetch('/api/administrator/security/firewall');
      if (response.ok) {
        const data = await response.json();
        setFirewallStatus({
          enabled: data.enabled || false,
          allowedPorts: data.allowedPorts || [],
          blockedPorts: data.blockedPorts || [],
          fail2ban: data.fail2ban || { enabled: false, activeJails: [] },
          rateLimit: data.rateLimit || { enabled: false, sshAttempts: 0 },
        });
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch firewall status:', errorData);
      }
    } catch (error) {
      console.error('Error fetching firewall status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFirewall = async () => {
    if (!confirm(`Are you sure you want to ${firewallStatus.enabled ? 'disable' : 'enable'} the firewall?`)) {
      return;
    }

    setConfiguring(true);
    try {
      const response = await fetch('/api/administrator/security/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: firewallStatus.enabled ? 'disable' : 'enable'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchFirewallStatus();
        alert(`Firewall ${firewallStatus.enabled ? 'disabled' : 'enabled'} successfully`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConfiguring(false);
    }
  };

  const handleAddPort = async () => {
    if (!newPort.port) return;

    setConfiguring(true);
    try {
      const response = await fetch('/api/administrator/security/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'allow_port',
          port: parseInt(newPort.port),
          protocol: newPort.protocol
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchFirewallStatus();
        setNewPort({ port: '', protocol: 'tcp' });
        setShowPortForm(false);
        alert('Port added successfully');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConfiguring(false);
    }
  };

  const handleToggleFail2ban = async () => {
    if (!confirm(`Are you sure you want to ${firewallStatus.fail2ban.enabled ? 'disable' : 'enable'} Fail2Ban?`)) {
      return;
    }

    setConfiguring(true);
    try {
      const response = await fetch('/api/administrator/security/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: firewallStatus.fail2ban.enabled ? 'disable_fail2ban' : 'enable_fail2ban'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchFirewallStatus();
        alert(`Fail2Ban ${firewallStatus.fail2ban.enabled ? 'disabled' : 'enabled'} successfully`);
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
          <Wifi className="w-8 h-8 text-[#114373]" />
          Firewall & Network Security
        </h1>
        <p className="mt-2 text-gray-600">
          Configure UFW firewall, manage ports, enable fail2ban, and rate-limit SSH attempts
        </p>
      </div>

      {/* Firewall Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Firewall Status</h2>
          <div className="flex items-center gap-2">
            {firewallStatus.enabled ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Active</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Inactive</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Allowed Ports</h3>
            <div className="flex flex-wrap gap-2">
              {firewallStatus.allowedPorts.map((port) => (
                <span
                  key={port}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {port}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fail2Ban Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {firewallStatus.fail2ban.enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-600">
                  {firewallStatus.fail2ban.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {firewallStatus.fail2ban.activeJails.length > 0 && (
                <div className="ml-6">
                  <p className="text-xs text-gray-500 mb-1">Active Jails:</p>
                  <div className="flex flex-wrap gap-1">
                    {firewallStatus.fail2ban.activeJails.map((jail) => (
                      <span
                        key={jail}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {jail}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Firewall Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleToggleFirewall}
            disabled={configuring}
            className={`px-4 py-3 rounded-lg font-medium transition ${
              firewallStatus.enabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {configuring ? 'Processing...' : firewallStatus.enabled ? 'Disable Firewall' : 'Enable Firewall'}
          </button>

          <button
            onClick={() => setShowPortForm(!showPortForm)}
            className="px-4 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition"
          >
            {showPortForm ? 'Cancel' : 'Add Port'}
          </button>
        </div>

        {showPortForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Port Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Port number"
                value={newPort.port}
                onChange={(e) => setNewPort({ ...newPort, port: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373]"
              />
              <select
                value={newPort.protocol}
                onChange={(e) => setNewPort({ ...newPort, protocol: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373]"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="both">Both</option>
              </select>
              <button
                onClick={handleAddPort}
                disabled={!newPort.port || configuring}
                className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50"
              >
                Add Port
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleToggleFail2ban}
            disabled={configuring}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              firewallStatus.fail2ban.enabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
          >
            {firewallStatus.fail2ban.enabled ? 'Disable Fail2Ban' : 'Enable Fail2Ban'}
          </button>

          <button
            onClick={fetchFirewallStatus}
            disabled={configuring}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${configuring ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

