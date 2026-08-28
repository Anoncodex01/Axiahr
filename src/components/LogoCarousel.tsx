'use client';

import { useState } from 'react';

interface LogoCarouselProps {
  logos: Array<{ name: string; logo: string }>;
}

export default function LogoCarousel({ logos }: LogoCarouselProps) {
  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];
  const [loadedLogos, setLoadedLogos] = useState<Set<string>>(new Set());
  const [errorLogos, setErrorLogos] = useState<Set<string>>(new Set());

  const handleImageLoad = (logo: string) => {
    setLoadedLogos(prev => new Set([...prev, logo]));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, logo: string) => {
    setErrorLogos(prev => new Set([...prev, logo]));
    // Don't hide the image, just mark it as errored
    e.currentTarget.style.opacity = '0.3';
  };

  return (
    <div className="overflow-hidden w-full py-6">
      <div className="flex gap-10 lg:gap-14 xl:gap-16 items-center animate-marquee whitespace-nowrap">
        {duplicatedLogos.map((company, index) => (
          <div
            key={`${company.name}-${index}`}
            className="flex items-center justify-center h-14 lg:h-16 xl:h-20 w-auto flex-shrink-0 px-4 lg:px-6"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {errorLogos.has(company.logo) ? (
                // Fallback: Show company name if image fails to load
                <div className="h-full flex items-center justify-center px-4">
                  <span className="text-gray-400 text-xs lg:text-sm font-medium text-center">
                    {company.name}
                  </span>
                </div>
              ) : (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-full w-auto max-w-[140px] lg:max-w-[180px] xl:max-w-[200px] object-contain transition-all duration-300 opacity-70 hover:opacity-100"
                  style={{ 
                    filter: 'opacity(0.7)',
                    transition: 'all 0.3s ease'
                  }}
                  onLoad={() => handleImageLoad(company.logo)}
                  onError={(e) => handleImageError(e, company.logo)}
                  onMouseEnter={(e) => {
                    if (!errorLogos.has(company.logo)) {
                      e.currentTarget.style.filter = 'opacity(1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!errorLogos.has(company.logo)) {
                      e.currentTarget.style.filter = 'opacity(0.7)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

