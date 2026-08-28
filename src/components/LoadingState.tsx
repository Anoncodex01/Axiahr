'use client';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const waveSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const content = (
    <div className="flex flex-col items-center justify-center">
      {/* Material Wave Loading Animation */}
      <div className={`${sizeClasses[size]} flex items-end justify-center gap-1`}>
        <div className={`${waveSize[size]} bg-[#114373] rounded-full animate-bounce`} style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
        <div className={`${waveSize[size]} bg-[#114373] rounded-full animate-bounce`} style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
        <div className={`${waveSize[size]} bg-[#114373] rounded-full animate-bounce`} style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
        <div className={`${waveSize[size]} bg-[#114373] rounded-full animate-bounce`} style={{ animationDelay: '450ms', animationDuration: '1s' }}></div>
        <div className={`${waveSize[size]} bg-[#114373] rounded-full animate-bounce`} style={{ animationDelay: '600ms', animationDuration: '1s' }}></div>
      </div>
      {message && (
        <p className="mt-4 text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
