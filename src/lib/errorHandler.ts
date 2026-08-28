/**
 * Global error handling utilities
 * Prevents JavaScript errors from showing as popups
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

/**
 * Show toast notification (client-side only)
 */
function dispatchToastNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'error', duration: number = 6000) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-toast', {
      detail: { message, type, duration },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Safely handle errors without showing popups
 */
export function handleError(error: unknown, context?: string, showToastNotification: boolean = true): ErrorInfo {
  let errorInfo: ErrorInfo = {
    message: 'An unexpected error occurred',
  };

  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.details = error.stack;
  } else if (typeof error === 'string') {
    errorInfo.message = error;
  } else if (error && typeof error === 'object') {
    const err = error as any;
    errorInfo = {
      message: err.message || err.error || 'An unexpected error occurred',
      code: err.code,
      status: err.status,
      details: err.details || err,
    };
  }

  // Log error to console (not popup)
  if (context) {
    console.error(`[${context}]`, errorInfo);
  } else {
    console.error('Error:', errorInfo);
  }

  // Show modern toast notification instead of popup
  if (showToastNotification) {
    const toastType = errorInfo.status && errorInfo.status >= 500 ? 'error' : 
                     errorInfo.status && errorInfo.status >= 400 ? 'warning' : 'error';
    dispatchToastNotification(errorInfo.message, toastType, 6000);
  }

  return errorInfo;
}

/**
 * Safe async function wrapper
 * Catches errors and prevents them from bubbling up as popups
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    const result = await asyncFn();
    return result;
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

/**
 * Safe fetch wrapper that handles errors gracefully
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  context?: string
): Promise<Response | null> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      handleError(
        {
          message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
        },
        context
      );
    }
    
    return response;
  } catch (error) {
    handleError(error, context || 'fetch');
    return null;
  }
}

/**
 * Prevent default error behavior (popups)
 */
export function preventErrorPopups() {
  if (typeof window === 'undefined') return;

  // Prevent unhandled promise rejections from showing popups
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Prevent uncaught errors from showing popups
  window.addEventListener('error', (event) => {
    event.preventDefault();
    console.error('Uncaught error:', event.error);
  });
}

