'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Building2, ArrowRight, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'login'; // 'login' or 'register'
  const [loading, setLoading] = useState<{ type: 'candidate' | 'employer' | null; isLoading: boolean }>({
    type: null,
    isLoading: false
  });

  const handleUserTypeSelect = (userType: 'candidate' | 'employer') => {
    // Set loading state
    setLoading({ type: userType, isLoading: true });
    
    // Navigate immediately without delay
    if (type === 'login') {
      router.push(userType === 'candidate' ? '/candidate/login' : '/employer/login');
    } else {
      router.push(userType === 'candidate' ? '/candidate/register' : '/employer/register');
    }
  };

  const isCandidateLoading = loading.isLoading && loading.type === 'candidate';
  const isEmployerLoading = loading.isLoading && loading.type === 'employer';

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <Header />
      
      {/* Loading Overlay */}
      {loading.isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full ${loading.type === 'candidate' ? 'bg-[#6db99f]/10' : 'bg-[#114373]/10'} flex items-center justify-center mb-6`}>
                {loading.type === 'candidate' ? (
                  <User className="w-10 h-10 text-[#6db99f]" />
                ) : (
                  <Building2 className="w-10 h-10 text-[#114373]" />
                )}
              </div>
              <h3 className="text-2xl font-outfit-bold text-gray-900 mb-2">
                Loading {loading.type === 'candidate' ? 'Candidate' : 'Employer'} {type === 'login' ? 'Login' : 'Registration'}...
              </h3>
              <p className="text-gray-600 mb-6">
                Please wait while we redirect you to the {type === 'login' ? 'login' : 'registration'} page.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className={`w-6 h-6 ${loading.type === 'candidate' ? 'text-[#6db99f]' : 'text-[#114373]'} animate-spin`} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-outfit-bold text-gray-900 mb-4">
              {type === 'login' ? 'Login' : 'Create Account'} as
            </h1>
            <p className="text-xl text-gray-600 font-outfit-regular">
              Choose your account type to continue
            </p>
          </div>

          {/* User Type Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Candidate Option */}
            <button
              onClick={() => handleUserTypeSelect('candidate')}
              disabled={loading.isLoading}
              className={`group relative bg-white border-2 rounded-2xl p-8 sm:p-10 transition-all duration-300 text-left transform ${
                loading.isLoading 
                  ? 'border-gray-300 cursor-not-allowed opacity-60' 
                  : 'border-gray-200 hover:border-[#6db99f] hover:shadow-xl hover:-translate-y-2'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
                  isCandidateLoading 
                    ? 'bg-[#6db99f]/20' 
                    : 'bg-[#6db99f]/10 group-hover:bg-[#6db99f]/20'
                }`}>
                  {isCandidateLoading ? (
                    <Loader2 className="w-8 h-8 text-[#6db99f] animate-spin" />
                  ) : (
                    <User className="w-8 h-8 text-[#6db99f]" />
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-outfit-bold text-gray-900 mb-3">
                  Candidate
                </h3>
                <p className="text-gray-600 text-base sm:text-lg font-outfit-regular mb-6 leading-relaxed">
                  {type === 'login' 
                    ? 'Find jobs and apply to positions that match your skills and career goals.'
                    : 'Create your candidate profile and start applying to exciting job opportunities.'}
                </p>
                <div className={`flex items-center font-outfit-semibold transition-transform ${
                  isCandidateLoading 
                    ? 'text-[#6db99f]' 
                    : 'text-[#6db99f] group-hover:translate-x-2'
                }`}>
                  {isCandidateLoading ? 'Loading...' : 'Continue'}
                  {!isCandidateLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                </div>
              </div>
            </button>

            {/* Employer Option */}
            <button
              onClick={() => handleUserTypeSelect('employer')}
              disabled={loading.isLoading}
              className={`group relative bg-white border-2 rounded-2xl p-8 sm:p-10 transition-all duration-300 text-left transform ${
                loading.isLoading 
                  ? 'border-gray-300 cursor-not-allowed opacity-60' 
                  : 'border-gray-200 hover:border-[#114373] hover:shadow-xl hover:-translate-y-2'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${
                  isEmployerLoading 
                    ? 'bg-[#114373]/20' 
                    : 'bg-[#114373]/10 group-hover:bg-[#114373]/20'
                }`}>
                  {isEmployerLoading ? (
                    <Loader2 className="w-8 h-8 text-[#114373] animate-spin" />
                  ) : (
                    <Building2 className="w-8 h-8 text-[#114373]" />
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-outfit-bold text-gray-900 mb-3">
                  Employer
                </h3>
                <p className="text-gray-600 text-base sm:text-lg font-outfit-regular mb-6 leading-relaxed">
                  {type === 'login' 
                    ? 'Post jobs and manage your hiring process to find the best talent.'
                    : 'Create your employer account and start posting job vacancies today.'}
                </p>
                <div className={`flex items-center font-outfit-semibold transition-transform ${
                  isEmployerLoading 
                    ? 'text-[#114373]' 
                    : 'text-[#114373] group-hover:translate-x-2'
                }`}>
                  {isEmployerLoading ? 'Loading...' : 'Continue'}
                  {!isEmployerLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114373]"></div>
        </main>
        <Footer />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}

