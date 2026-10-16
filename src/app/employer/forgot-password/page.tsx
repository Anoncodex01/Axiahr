'use client';

import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export default function EmployerForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      userType="employer"
      title="Forgot password"
      subtitle="Enter your employer account email and we'll send you a reset link"
      loginHref="/employer/login"
    />
  );
}
