'use client';

import { useEffect } from 'react';
import { showToast } from './Toast';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('Unhandled promise rejection:', event.reason);
      
      // Show modern toast instead of popup
      const errorMessage = event.reason?.message || event.reason?.toString() || 'An unexpected error occurred';
      showToast(errorMessage, 'error', 6000);
      
      if (event.reason) {
        console.error('Error details:', event.reason);
      }
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error('Uncaught error:', event.error);
      
      // Show modern toast instead of popup
      const errorMessage = event.error?.message || event.message || 'An unexpected error occurred';
      showToast(errorMessage, 'error', 6000);
      
      if (event.error) {
        console.error('Error details:', {
          message: event.error.message,
          stack: event.error.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    };

    // Override window.alert to show toast instead
    const originalAlert = window.alert;
    window.alert = (message?: string) => {
      showToast(message || 'Alert', 'info', 5000);
      console.log('Alert:', message);
    };

    // Override window.confirm to show toast (and return false)
    const originalConfirm = window.confirm;
    window.confirm = (message?: string) => {
      showToast(message || 'Confirm', 'info', 5000);
      console.log('Confirm:', message);
      return false; // Default to false to prevent blocking
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  return null;
}

