'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { WordCheckResult } from '@/utils/wordChecker';

interface WordCheckWarningProps {
  result: WordCheckResult;
  onDismiss?: () => void;
  className?: string;
}

export default function WordCheckWarning({ 
  result, 
  onDismiss, 
  className = '' 
}: WordCheckWarningProps) {
  if (!result.hasBarredWords) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            Content Warning: Potentially Discriminatory Language
          </h4>
          <div className="text-sm text-red-700 mb-3">
            <p className="mb-2">The following terms may be discriminatory or inappropriate:</p>
            <ul className="list-disc list-inside space-y-1">
              {result.warnings.map((warning, index) => (
                <li key={index} className="font-medium">{warning}</li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-red-600">
            <p className="mb-1">
              <strong>Found words:</strong> {result.foundWords.join(', ')}
            </p>
            <p>
              Please review and remove discriminatory language to ensure equal opportunity employment.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
