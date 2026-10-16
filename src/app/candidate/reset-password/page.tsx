'use client';

import { Suspense } from 'react';
import ResetPasswordForm from '@/components/ResetPasswordForm';

function CandidateResetPasswordContent() {
  return (
    <ResetPasswordForm
      userType="candidate"
      title="Reset password"
      loginHref="/candidate/login"
    />
  );
}

export default function CandidateResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-2 border-[#114373] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CandidateResetPasswordContent />
    </Suspense>
  );
}
