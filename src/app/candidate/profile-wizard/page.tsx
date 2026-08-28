'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CandidateLayout from '@/components/CandidateLayout';
import ProfileWizard from '@/components/ProfileWizard';
import { CheckCircle, ArrowLeft, X } from 'lucide-react';

export default function ProfileWizardPage() {
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load candidate context from API using cookie/JWT
    const init = async () => {
      try {
        const res = await fetch('/api/candidates/profile', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const id = data?.data?.candidate?.id;
        const status = data?.data?.profile?.status;
        if (status === 'completed') {
          // Use window.location.href to force a full page reload
          window.location.href = '/candidate/profile';
          return;
        }
        if (id) setCandidateId(String(id));
      } catch (e) {
        // fall through to login prompt
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  const handleComplete = () => {
    setIsCompleted(true);
    // Redirect to main profile page after 2 seconds
    // Use window.location.href to force a full page reload and ensure fresh data
    setTimeout(() => {
      window.location.href = '/candidate/profile';
    }, 2000);
  };

  if (isLoading) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114373] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile wizard...</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (!candidateId) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Please login to access your profile.</p>
            <button
              onClick={() => router.push('/candidate/login')}
              className="px-4 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559]"
            >
              Go to Login
            </button>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  if (isCompleted) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your profile has been successfully created. You will be redirected to your profile page shortly.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/candidate/profile'}
                className="px-6 py-2 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] flex items-center gap-2"
              >
                View Profile
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <ProfileWizard 
          candidateId={candidateId} 
          onComplete={handleComplete}
        />
      </div>
    </CandidateLayout>
  );
}
