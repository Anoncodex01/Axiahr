'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Construction } from 'lucide-react';

export default function ComingSoon() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h1>
        <p className="text-gray-600 mb-6">
          This feature is currently under development. We're working hard to bring you the best experience.
        </p>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Expected: Q1 2024</span>
        </div>
        
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0f3a5f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
