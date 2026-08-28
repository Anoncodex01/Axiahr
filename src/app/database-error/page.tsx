'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Database, RefreshCw, AlertCircle, Home } from 'lucide-react';

export default function DatabaseErrorPage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json();
      if (data.success && data.data?.connection?.status === 'connected') {
        // Database is back online, redirect to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Database check failed:', error);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Wait a bit before checking
    await new Promise(resolve => setTimeout(resolve, 2000));
    await checkDatabaseStatus();
    
    setIsRetrying(false);
  };

  // Auto-retry every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkDatabaseStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Error Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
              <Database className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-outfit-bold text-gray-900 mb-4">
              Database Connection Error
            </h1>
            <div className="w-24 h-1 bg-[#6db99f] mx-auto mb-6"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-red-900 mb-2">
                    Service Temporarily Unavailable
                  </h2>
                  <p className="text-red-700 mb-3">
                    We're unable to connect to our database at the moment. This may be due to:
                  </p>
                  <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                    <li>Database server maintenance</li>
                    <li>Network connectivity issues</li>
                    <li>Temporary service interruption</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Our system is automatically attempting to reconnect. Please try again in a few moments.
            </p>

            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Retry attempts: {retryCount}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Retry Connection'}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#114373] border-2 border-[#114373] rounded-lg hover:bg-[#114373]/5 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
          </div>

          {/* Support Information */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              If this issue persists, please contact our support team:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a href="mailto:career@axia.co.tz" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                career@axia.co.tz
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="tel:+255786443003" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                +255 786 443 003
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

