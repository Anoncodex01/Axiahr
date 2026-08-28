'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Briefcase, Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ScrollAnimate from '@/components/ScrollAnimate';

interface ResourceCard {
  id: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  publishedDate: string;
  excerpt: string;
  link: string;
}

const resources: ResourceCard[] = [
  {
    id: '1',
    image: 'https://www.frazerjones.com/wp-content/uploads/sites/2/2025/11/Detail_Presenter-presenting-in-lecture-theatre_GettyImages-1783743772-300x225.jpg',
    imageAlt: 'Woman giving presentation',
    category: 'Market Insight',
    title: 'Elevating payroll: the need for visibility and voice',
    publishedDate: 'November 10, 2025',
    excerpt: 'The recent GPA Payroll Symposium offered a powerful reminder: payroll is no longer just a back-office function. It\'s a strategic pillar that touches every part of an organisation, from compliance and culture to talent attraction, employee engagement and financial planning. Here are some key takeaways from the GPA Payroll Symposium. 1. Payroll: from button-pushing to […]',
    link: '/resources/elevating-payroll'
  },
  {
    id: '2',
    image: 'https://www.frazerjones.com/wp-content/uploads/sites/2/2025/02/shutterstock_2248246643-300x225.jpg',
    imageAlt: 'Woman working on laptop',
    category: 'Career Progression',
    title: 'Next-generation HR leaders: what sets rising stars apart in today\'s junior talent market',
    publishedDate: 'November 10, 2025',
    excerpt: 'When I think about what makes a rising star in HR, I\'m reminded of the privilege we have at Frazer Jones. For almost thirty years, we\'ve helped HR professionals and businesses grow, supporting careers from those first junior roles right through to the most senior Chief People Officer and CHRO appointments. Our network is unique […]',
    link: '/resources/next-generation-hr-leaders'
  },
  {
    id: '3',
    image: 'https://www.frazerjones.com/wp-content/uploads/sites/2/2025/11/steve-scott-blog-banner-300x225.jpg',
    imageAlt: 'Professional headshot',
    category: 'Industry Leaders',
    title: 'View from the top – Global HR leadership series. Interview with Steve Scott (MD, Global People Insights and Analytics, FS).',
    publishedDate: 'November 10, 2025',
    excerpt: 'In the latest installment of Frazer Jones\' global HR Executive leadership series, View From The Top, Charlotte Matthew, Managing Director of the Global Financial Services Practice and Head of Southeast Asia, engages in a compelling conversation with Steve Scott, MD, Global People Insights and Analytics, Financial Services, widely regarded as one of the most influential […]',
    link: '/resources/view-from-the-top-steve-scott'
  },
  {
    id: '4',
    image: 'https://www.frazerjones.com/wp-content/uploads/sites/2/2022/09/Thumbnail-5-300x225.jpg',
    imageAlt: 'Woman leading discussion',
    category: 'Reward',
    title: 'Pay Transparency Directive: reshaping HR, reward and compensation in the EU and UK',
    publishedDate: 'November 3, 2025',
    excerpt: 'Change is coming quickly. By June 2026, the EU Pay Transparency Directive will be in full effect across EU countries, setting new regulatory expectations for HR and compensation professionals. This initiative is more than a compliance exercise. It\'s a shift in how organisations approach fairness, accountability and culture. At its core, the directive aims to […]',
    link: '/resources/pay-transparency-directive'
  }
];

export default function ResourcesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(2);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const totalCards = resources.length;

  // Responsive cards to show
  useEffect(() => {
    const updateCardsToShow = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setCardsToShow(1); // Tablet: 1 card
      } else {
        setCardsToShow(2); // Desktop: 2 cards
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

  return (
    <section className="py-20 lg:py-32 bg-white relative overflow-visible" style={{ marginTop: 'var(--wp--preset--spacing--x-large, 3rem)' }}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Section */}
        <div className="mb-12">
          <ScrollAnimate delay="0.2s" animationClass="animate-fade-in-up">
            <p className="text-[#6db99f] text-sm font-outfit-bold uppercase tracking-wide mb-4">
              HR RECRUITMENT RESOURCES
            </p>
          </ScrollAnimate>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="flex-1" style={{ flexBasis: '66.66%' }}>
              <ScrollAnimate delay="0.3s" animationClass="animate-fade-in-up">
                <h2 className="text-3xl lg:text-4xl xl:text-5xl font-outfit-bold text-gray-900 mb-6 leading-tight">
                  Explore market insights and HR hiring advice
                </h2>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.4s" animationClass="animate-fade-in-up">
                <p className="text-lg text-gray-700 leading-relaxed font-outfit-regular max-w-3xl">
                  Take a look at our HR recruitment resources to help you make the best talent acquisition decisions – including market insights, hiring and retention advice, salary guides, and thought leadership content.
                </p>
              </ScrollAnimate>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:flex-shrink-0 lg:items-end" style={{ flexBasis: '33.33%' }}>
              <ScrollAnimate delay="0.5s" animationClass="animate-fade-in-up">
                <Link
                  href="/resources"
                  className="inline-flex items-center justify-center gap-2 bg-[#4a9d8a] hover:bg-[#3d8a77] text-white px-6 py-3 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 whitespace-nowrap"
                >
                  <Briefcase className="w-5 h-5" />
                  View all resources
                </Link>
              </ScrollAnimate>
              
              <ScrollAnimate delay="0.6s" animationClass="animate-fade-in-up">
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center gap-2 bg-[#6db99f] hover:bg-[#5aa88a] text-white px-6 py-3 rounded-lg font-outfit-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 whitespace-nowrap"
                >
                  <Star className="w-5 h-5" />
                  Events
                </Link>
              </ScrollAnimate>
            </div>
          </div>
        </div>

        {/* Content Cards Carousel */}
        <div className="relative mb-12 w-full">
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
                width: '100%',
              }}
            >
              {resources.map((resource) => (
                <Link
                  key={resource.id}
                  href={resource.link}
                  className="flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block h-full flex flex-col"
                  style={{ 
                    width: cardWidth,
                    minWidth: cardWidth,
                  }}
                >
                  <div className="relative w-full h-48 sm:h-64 overflow-hidden bg-gray-100">
                    <img
                      src={resource.image}
                      alt={resource.imageAlt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/floating-image-placeholder.webp';
                      }}
                    />
                  </div>
                  <div className="p-4 sm:p-6 flex-1 flex flex-col">
                    <ul className="mb-3 sm:mb-4 flex flex-wrap gap-2">
                      <li>
                        <span className="inline-block bg-[#6db99f] text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-outfit-semibold">
                          {resource.category}
                        </span>
                      </li>
                    </ul>
                    <h4 className="text-lg sm:text-xl font-outfit-bold text-gray-900 mb-2 sm:mb-3 leading-tight line-clamp-2">
                      {resource.title}
                    </h4>
                    <ul className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="font-outfit-medium">Posted</span>
                        <span className="font-outfit-regular">{resource.publishedDate}</span>
                      </li>
                    </ul>
                    <div className="text-gray-700 leading-relaxed mb-3 sm:mb-4 font-outfit-regular text-xs sm:text-sm line-clamp-3 flex-1">
                      {resource.excerpt}
                    </div>
                    <span className="inline-flex items-center text-[#6db99f] font-outfit-semibold hover:text-[#5aa88a] transition-colors duration-300 group mt-auto text-xs sm:text-sm">
                      Read more
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentIndex === 0 
                  ? 'bg-[#6db99f]/30 cursor-not-allowed' 
                  : 'bg-[#6db99f]/30 hover:bg-[#6db99f]/50'
              }`}
              aria-label="Previous"
            >
              <ChevronLeft className={`w-5 h-5 ${currentIndex === 0 ? 'text-[#6db99f]/50' : 'text-[#6db99f]'}`} />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentIndex >= maxIndex 
                  ? 'bg-[#6db99f] opacity-50 cursor-not-allowed' 
                  : 'bg-[#6db99f] hover:bg-[#5aa88a]'
              }`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

