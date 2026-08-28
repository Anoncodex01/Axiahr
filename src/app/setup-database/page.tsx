'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Database, Loader } from 'lucide-react';

export default function SetupDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetup = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.error || 'Setup failed' });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Setup failed' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Setup</h1>
            <p className="text-gray-600">
              Initialize the database tables for the candidate system
            </p>
          </div>

          {result && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
            </div>
          )}

          <button
            onClick={handleSetup}
            disabled={isLoading}
            className="w-full bg-[#114373] text-white py-3 px-6 rounded-lg hover:bg-[#0d3559] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Setting up database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Setup Database Tables
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What this will create:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Candidates table</li>
              <li>• Email verifications table</li>
              <li>• Candidate profiles table</li>
              <li>• Experience, education, and references tables</li>
              <li>• Database indexes for performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
