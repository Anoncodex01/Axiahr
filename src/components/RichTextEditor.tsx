'use client';

import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Error boundary component
class EditorErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RichTextEditor error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-64 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center p-4">
          <p className="text-red-600 font-medium mb-2">Editor failed to load</p>
          <p className="text-red-500 text-sm text-center">
            Please refresh the page or use a plain textarea instead.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamically import the editor component to avoid SSR issues
const TipTapEditor = dynamic(
  () => import('./TipTapEditor').catch((err) => {
    console.error('Failed to load TipTap editor:', err);
    // Return a fallback component
    return {
      default: () => (
        <div className="h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <p className="text-red-600">Failed to load editor. Please refresh the page.</p>
        </div>
      ),
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center border border-gray-300">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    ),
  }
);

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center border border-gray-300">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center p-4">
        <p className="text-red-600 font-medium mb-2">Editor failed to load</p>
        <p className="text-red-500 text-sm text-center mb-4">{error.message}</p>
        <button
          onClick={() => {
            setError(null);
            setMounted(false);
            setTimeout(() => setMounted(true), 100);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <EditorErrorBoundary>
      <TipTapEditor 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
      />
    </EditorErrorBoundary>
  );
}
