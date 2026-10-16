'use client';

import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export default function CandidateForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      userType="candidate"
      title="Forgot password"
      subtitle="Enter your candidate account email and we'll send you a reset link"
      loginHref="/candidate/login"
    />
  );
}
