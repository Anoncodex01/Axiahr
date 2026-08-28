'use client';

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  RefreshCw,
  Play,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface Backup {
  filename: string;
  size: number;
  created: string;
  type: 'database' | 'full' | 'application';
}

export default function BackupsPage() {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [runningBackup, setRunningBackup] = useState(false);
  const [backupType, setBackupType] = useState<'database' | 'full' | 'application'>('database');

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/administrator/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBackup = async () => {
    if (!confirm(`Run ${backupType} backup now? This may take several minutes.`)) {
      return;
    }

    setRunningBackup(true);
    try {
      const response = await fetch('/api/administrator/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: backupType })
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup started successfully');
        setTimeout(() => fetchBackups(), 2000);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setRunningBackup(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const response = await fetch(`/api/administrator/backups/download?filename=${encodeURIComponent(backup.filename)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download backup');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (backup: Backup) => {
    if (!confirm(`Delete backup ${backup.filename}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/administrator/backups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: backup.filename })
      });

      const data = await response.json();
      if (data.success) {
        alert('Backup deleted successfully');
        fetchBackups();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'database':
        return 'bg-blue-100 text-blue-800';
      case 'full':
        return 'bg-purple-100 text-purple-800';
      case 'application':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <HardDrive className="w-8 h-8 text-[#114373]" />
          Backup Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage database backups, full VPS snapshots, and application backups
        </p>
      </div>

      {/* Backup Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Backup</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#114373]"
          >
            <option value="database">Database Backup</option>
            <option value="full">Full VPS Backup</option>
            <option value="application">Application Backup</option>
          </select>
          <button
            onClick={handleRunBackup}
            disabled={runningBackup}
            className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {runningBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Backup
              </>
            )}
          </button>
          <button
            onClick={fetchBackups}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Available Backups</h2>
          <p className="text-sm text-gray-500 mt-1">
            {backups.length} {backups.length === 1 ? 'backup' : 'backups'} found
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No backups found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{backup.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBackupTypeColor(backup.type)}`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(backup.created).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(backup)}
                          className="text-[#114373] hover:text-[#0d3559] flex items-center gap-1"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(backup)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

