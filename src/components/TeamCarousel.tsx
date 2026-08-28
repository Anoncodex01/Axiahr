'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Linkedin, Mail, Phone as PhoneIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  region: string;
  email: string;
  phone: string;
  linkedin?: string;
  image?: string;
}

interface TeamCarouselProps {
  members: TeamMember[];
}

export default function TeamCarousel({ members }: TeamCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(4);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const totalCards = members.length;

  // Responsive cards to show
  useEffect(() => {
    const updateCardsToShow = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2); // Tablet: 2 cards
      } else {
        setCardsToShow(4); // Desktop: 4 cards
      }
    };

    updateCardsToShow();
    window.addEventListener('resize', updateCardsToShow);
    return () => window.removeEventListener('resize', updateCardsToShow);
  }, []);

  const maxIndex = Math.max(0, totalCards - cardsToShow);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      goToNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      goToPrevious();
    }
  };

  // Calculate the width percentage for each card based on cardsToShow
  const gapSize = 16; // Smaller gap on mobile
  const cardWidthPercent = 100 / cardsToShow;
  
  // Standard carousel: shift left as we navigate
  const translateX = -currentIndex * cardWidthPercent;

  // Calculate card width accounting for gaps
  const cardWidth = `calc(${cardWidthPercent}% - ${(gapSize * (cardsToShow - 1)) / cardsToShow}px)`;
  // Show partial card on right for desktop
  const containerWidthPercent = cardsToShow === 1 ? 100 : (cardsToShow + 0.5) * cardWidthPercent;

  return (
    <div className="relative w-full">
      <div 
        className="overflow-hidden relative w-full"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out relative z-0"
          style={{
            transform: `translateX(${translateX}%)`,
            gap: `${gapSize}px`,
            width: `${containerWidthPercent}%`,
            minWidth: '100%',
          }}
        >
          {members.map((member) => (
            <div
              key={member.id}
              className="flex-shrink-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              style={{ 
                width: cardWidth,
                minWidth: cardWidth,
              }}
            >
              {/* Image Section with rounded top corners - Light gray background */}
              <div className="aspect-square overflow-hidden bg-gray-200 rounded-t-2xl flex items-center justify-center">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <Users className="w-16 h-16 sm:w-20 sm:h-20 text-gray-500" />
                  </div>
                )}
              </div>
              
              {/* Content Section - Light gray background */}
              <div className="p-4 sm:p-6 bg-gray-100 flex-1 flex flex-col">
                <h3 className="text-[#6db99f] font-outfit-bold text-base sm:text-lg mb-2 leading-tight">{member.name}</h3>
                <p className="text-gray-900 font-outfit-bold text-xs sm:text-sm mb-1 leading-tight">{member.title}</p>
                <p className="text-gray-900 text-xs sm:text-sm mb-4 font-outfit-regular">{member.region}</p>
                
                {/* Contact Information */}
                <div className="mt-auto space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <Mail className="w-4 h-4 flex-shrink-0 text-gray-600" />
                    <span className="font-outfit-regular break-all">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0 text-gray-600" />
                    <span className="font-outfit-regular break-all">{member.phone}</span>
                  </div>
                </div>
                
                {/* LinkedIn Link */}
                {member.linkedin ? (
                  <Link
                    href={member.linkedin}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-gray-900 hover:text-[#6db99f] transition-colors font-outfit-semibold text-xs sm:text-sm mt-auto"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 text-gray-900 font-outfit-semibold text-xs sm:text-sm mt-auto">
                    <Linkedin className="w-4 h-4" />
                    Connect
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Circular buttons */}
      <div className="flex justify-center gap-3 mt-8">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-all ${
            currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Previous"
          type="button"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex >= maxIndex}
          className={`w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-all ${
            currentIndex >= maxIndex ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label="Next"
          type="button"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

