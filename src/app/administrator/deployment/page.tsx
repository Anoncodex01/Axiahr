'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  GitBranch,
  Download,
  Play,
  Square,
  Terminal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code,
  Activity
} from 'lucide-react';

interface GitStatus {
  branch: string;
  status: string;
  lastCommit: string;
  lastPull: string | null;
  hasChanges: boolean;
  ahead: number;
  behind: number;
}

interface DeploymentStatus {
  status: 'idle' | 'pulling' | 'building' | 'restarting' | 'success' | 'error';
  message: string;
  output: string[];
}

export default function DeploymentPage() {
  const [loading, setLoading] = useState(true);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'idle',
    message: '',
    output: []
  });

  useEffect(() => {
    fetchGitStatus();
  }, []);

  const fetchGitStatus = async () => {
    try {
      const response = await fetch('/api/administrator/deployment/status');
      if (response.ok) {
        const data = await response.json();
        setGitStatus(data);
      }
    } catch (error) {
      console.error('Error fetching git status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePullAndDeploy = async () => {
    if (!confirm('Pull latest changes from GitHub and deploy? This will restart the application.')) {
      return;
    }

    setDeploymentStatus({
      status: 'pulling',
      message: 'Pulling latest changes from GitHub...',
      output: []
    });

    try {
      const response = await fetch('/api/administrator/deployment/pull', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setDeploymentStatus({
          status: 'success',
          message: 'Deployment completed successfully!',
          output: data.output || []
        });
        await fetchGitStatus();
      } else {
        setDeploymentStatus({
          status: 'error',
          message: data.error || 'Deployment failed',
          output: data.output || []
        });
      }
    } catch (error: any) {
      setDeploymentStatus({
        status: 'error',
        message: `Error: ${error.message}`,
        output: []
      });
    }
  };

  const handleRestart = async () => {
    if (!confirm('Restart the application? This will cause a brief downtime.')) {
      return;
    }

    setDeploymentStatus({
      status: 'restarting',
      message: 'Restarting application...',
      output: []
    });

    try {
      const response = await fetch('/api/administrator/deployment/restart', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setDeploymentStatus({
          status: 'success',
          message: 'Application restarted successfully!',
          output: data.output || []
        });
      } else {
        setDeploymentStatus({
          status: 'error',
          message: data.error || 'Restart failed',
          output: data.output || []
        });
      }
    } catch (error: any) {
      setDeploymentStatus({
        status: 'error',
        message: `Error: ${error.message}`,
        output: []
      });
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
          Deployment & Version Control
        </h1>
        <p className="mt-2 text-gray-600">
          Pull updates from GitHub, build, and deploy the application
        </p>
      </div>

      {/* Git Status */}
      {gitStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-[#114373]" />
            Git Repository Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Branch</p>
              <p className="text-lg font-semibold text-gray-900">{gitStatus.branch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Commit</p>
              <p className="text-sm font-medium text-gray-900 truncate">{gitStatus.lastCommit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {gitStatus.hasChanges ? (
                  <>
                    <XCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Uncommitted changes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Clean</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {gitStatus.behind > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{gitStatus.behind}</strong> commit(s) behind remote. Pull to update.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Deployment Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deployment Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handlePullAndDeploy}
            disabled={deploymentStatus.status === 'pulling' || deploymentStatus.status === 'building'}
            className="px-6 py-4 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {(deploymentStatus.status === 'pulling' || deploymentStatus.status === 'building') ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Pull & Deploy from GitHub
              </>
            )}
          </button>

          <button
            onClick={handleRestart}
            disabled={deploymentStatus.status === 'restarting'}
            className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {deploymentStatus.status === 'restarting' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Restarting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Restart Application
              </>
            )}
          </button>
        </div>
      </div>

      {/* Deployment Status */}
      {deploymentStatus.status !== 'idle' && (
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${
          deploymentStatus.status === 'success' ? 'border-green-200 bg-green-50' :
          deploymentStatus.status === 'error' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {deploymentStatus.status === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : deploymentStatus.status === 'error' ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : (
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{deploymentStatus.message}</h3>
          </div>

          {deploymentStatus.output.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
              {deploymentStatus.output.map((line, index) => (
                <div key={index} className="mb-1">{line}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={fetchGitStatus}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
          <button
            onClick={() => window.open('https://github.com/Anoncodex01/Axiahr', '_blank')}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Code className="w-4 h-4" />
            View on GitHub
          </button>
          <button
            onClick={() => window.open('https://github.com/Anoncodex01/Axiahr/commits/main', '_blank')}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            View Commits
          </button>
        </div>
      </div>
    </div>
  );
}

