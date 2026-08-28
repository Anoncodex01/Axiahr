'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Wrench, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
  const [checking, setChecking] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(true);

  useEffect(() => {
    // Check if maintenance mode is still active
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/maintenance/status');
        if (response.ok) {
          const data = await response.json();
          setIsMaintenance(data.enabled || false);
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkMaintenance();
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isMaintenance && !checking) {
    // Maintenance mode disabled, redirect to home
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#114373] via-[#0d3559] to-[#114373] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6">
            <Wrench className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-5xl font-bold text-white mb-4">
          Under Maintenance
        </h1>
        <div className="w-32 h-1 bg-[#6db99f] mx-auto mb-8"></div>

        {/* Description */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-white mb-3">
                We'll Be Back Soon
              </h2>
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                We're currently performing scheduled maintenance to improve your experience. 
                Our services will be back online shortly.
              </p>
              <p className="text-white/80 text-base">
                Thank you for your patience and understanding.
              </p>
            </div>
          </div>

          {/* Auto-refresh indicator */}
          <div className="flex items-center justify-center gap-2 text-white/70 text-sm pt-4 border-t border-white/20">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking status automatically...</span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <p className="text-white/80 text-sm mb-2">
            Need immediate assistance?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white">
            <a 
              href="mailto:career@axia.co.tz" 
              className="hover:text-[#6db99f] transition-colors"
            >
              career@axia.co.tz
            </a>
            <span className="hidden sm:inline text-white/50">|</span>
            <a 
              href="tel:+255786443003" 
              className="hover:text-[#6db99f] transition-colors"
            >
              +255 786 443 003
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/60 text-sm mt-8">
          &copy; {new Date().getFullYear()} Axia HR Advisory. All rights reserved.
        </p>
      </div>
    </div>
  );
}

