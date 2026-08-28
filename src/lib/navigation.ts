'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Custom navigation hook with instant navigation and loading state
 */
export function useInstantNavigation() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = (path: string, options?: { replace?: boolean }) => {
    // Set loading state immediately
    setIsNavigating(true);
    
    // Navigate immediately without waiting
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }

    // Reset loading state after a short delay (in case navigation is instant)
    setTimeout(() => {
      setIsNavigating(false);
    }, 100);
  };

  return { navigate, isNavigating };
}

/**
 * Prefetch route for faster navigation
 */
export function prefetchRoute(path: string) {
  if (typeof window !== 'undefined') {
    // Use Next.js router prefetch if available
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  }
}

