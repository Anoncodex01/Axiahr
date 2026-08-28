'use client';

import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface ScrollAnimateProps {
  children: ReactNode;
  delay?: string;
  animationClass?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export default function ScrollAnimate({
  children,
  delay = '0s',
  animationClass = 'animate-fade-in-up',
  className = '',
  threshold = 0.1,
  rootMargin = '0px 0px -100px 0px',
}: ScrollAnimateProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div
      ref={elementRef}
      className={`${className} ${isVisible ? animationClass : 'opacity-0'}`}
      style={isVisible ? { animationDelay: delay, animationFillMode: 'forwards' } : {}}
    >
      {children}
    </div>
  );
}

