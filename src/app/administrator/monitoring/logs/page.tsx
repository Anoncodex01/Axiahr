'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonitoringLogsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main logs page
    router.replace('/administrator/logs');
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373]"></div>
      </div>
    </div>
  );
}

