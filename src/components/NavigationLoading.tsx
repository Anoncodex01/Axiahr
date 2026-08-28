'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset loading state when route changes
    startTransition(() => {
      setIsLoading(false);
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept all link clicks for instant navigation
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        // Check if it's an internal link
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          // Show loading immediately
          setIsLoading(true);
        }
      }
    };

    // Listen to all clicks on the document
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, []);

  // Show loading bar when navigating
  if (!isLoading && !isPending) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-1 bg-gray-200">
      <div 
        className="h-full bg-[#6db99f] transition-all duration-300 ease-out"
        style={{ 
          width: isLoading || isPending ? '100%' : '0%',
          animation: isLoading || isPending ? 'pulse 1.5s ease-in-out infinite' : 'none'
        }}
      ></div>
    </div>
  );
}

