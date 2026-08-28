'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Save
} from 'lucide-react';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    enabled: false,
    message: '',
    updatedAt: null as string | null,
    updatedBy: null as string | null,
  });
  const [tempMessage, setTempMessage] = useState('');

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch('/api/administrator/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceStatus(data);
        setTempMessage(data.message || '');
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!confirm(`Are you sure you want to ${maintenanceStatus.enabled ? 'disable' : 'enable'} maintenance mode?`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/administrator/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !maintenanceStatus.enabled,
          message: tempMessage || 'System is under maintenance. We will be back shortly.'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchMaintenanceStatus();
        alert(`Maintenance mode ${!maintenanceStatus.enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/administrator/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: maintenanceStatus.enabled,
          message: tempMessage || 'System is under maintenance. We will be back shortly.'
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchMaintenanceStatus();
        alert('Maintenance message updated successfully');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
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
          <Settings className="w-8 h-8 text-[#114373]" />
          Site Maintenance Mode
        </h1>
        <p className="mt-2 text-gray-600">
          Enable or disable maintenance mode to restrict access to the website for all users except administrators
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance Status</h2>
          <div className="flex items-center gap-2">
            {maintenanceStatus.enabled ? (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-sm font-medium text-red-600">Enabled</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-600">Disabled</span>
              </>
            )}
          </div>
        </div>

        {maintenanceStatus.updatedAt && (
          <div className="text-sm text-gray-500 mb-4">
            <p>Last updated: {new Date(maintenanceStatus.updatedAt).toLocaleString()}</p>
            {maintenanceStatus.updatedBy && (
              <p>Updated by: {maintenanceStatus.updatedBy}</p>
            )}
          </div>
        )}

        <button
          onClick={handleToggle}
          disabled={saving}
          className={`w-full px-6 py-3 rounded-lg font-medium transition ${
            maintenanceStatus.enabled
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {maintenanceStatus.enabled ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Disable Maintenance Mode
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Enable Maintenance Mode
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Maintenance Message */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Message</h2>
        <p className="text-sm text-gray-600 mb-4">
          Customize the message displayed to users when maintenance mode is enabled
        </p>
        
        <textarea
          value={tempMessage}
          onChange={(e) => setTempMessage(e.target.value)}
          placeholder="System is under maintenance. We will be back shortly."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373] focus:border-transparent mb-4"
        />

        <button
          onClick={handleSaveMessage}
          disabled={saving || tempMessage === maintenanceStatus.message}
          className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Message
        </button>
      </div>

      {/* Warning */}
      {maintenanceStatus.enabled && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900">Maintenance Mode Active</h4>
              <p className="text-sm text-yellow-800 mt-1">
                All users (employers, candidates, and general visitors) will be redirected to the maintenance page.
                Only administrators can access the site during maintenance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

