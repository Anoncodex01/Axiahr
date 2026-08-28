'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProvider, useUser } from '@/contexts/UserContext';
import RoleBasedAdminLayout from '@/components/RoleBasedAdminLayout';

// Component to check authentication and redirect if needed
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Don't check auth on login page
    if (pathname === '/admin/login') return;
    
    // Wait for user context to load
    if (isLoading) return;
    
    // If no user and not on login page, redirect to login
    if (!user) {
      const loginUrl = `/admin/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [user, isLoading, pathname, router]);
  
  // Show content immediately while auth verifies in background
  // Only redirect if authentication fails (handled by useEffect above)
  // Don't render protected content if not authenticated (except login page)
  if (!user && pathname !== '/admin/login' && !isLoading) {
    return null;
  }
  
  // Show content while loading (auth happens in background)
  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Block test and debug pages in production
  if (process.env.NODE_ENV === 'production') {
    if (pathname === '/admin/test' || pathname === '/admin/login-debug' || pathname === '/admin/login-simple') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">This page is not available in production.</p>
          </div>
        </div>
      );
    }
  }
  
  // For test page, don't use any layout (dev only)
  if (pathname === '/admin/test') {
    return <>{children}</>;
  }
  
  // Don't wrap login page with RoleBasedAdminLayout
  if (pathname === '/admin/login') {
    return (
      <UserProvider>
        {children}
      </UserProvider>
    );
  }

  return (
    <UserProvider>
      <AuthGuard>
        <RoleBasedAdminLayout>
          {children}
        </RoleBasedAdminLayout>
      </AuthGuard>
    </UserProvider>
  );
}
