'use client';

import { useState } from 'react';

interface LogoCarouselProps {
  logos: Array<{ name: string; logo: string }>;
}

export default function LogoCarousel({ logos }: LogoCarouselProps) {
  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];
  const [errorLogos, setErrorLogos] = useState<Set<string>>(new Set());

  return (
    <div className="overflow-hidden w-full py-6">
      <div className="flex gap-5 lg:gap-6 items-center animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        {duplicatedLogos.map((company, index) => (
          // Uniform white cards so logos with white and transparent backgrounds look consistent
          <div
            key={`${company.name}-${index}`}
            title={company.name}
            className="flex-shrink-0 flex items-center justify-center w-36 h-20 lg:w-44 lg:h-24 px-3 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            {errorLogos.has(company.logo) ? (
              <span className="text-gray-500 text-xs lg:text-sm font-medium text-center whitespace-normal">
                {company.name}
              </span>
            ) : (
              <img
                src={company.logo}
                alt={company.name}
                className="max-h-full max-w-full object-contain"
                onError={() => setErrorLogos(prev => new Set([...prev, company.logo]))}
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
