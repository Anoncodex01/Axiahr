'use client';

import { useState } from 'react';

export default function FloatingImage() {
  const [imgSrc, setImgSrc] = useState('/floating-image-placeholder.webp');

  const handleError = () => {
    // Fallback to a photo if placeholder doesn't exist
    setImgSrc('/uploads/photos/6_1762765113418.webp');
  };

  return (
    <img 
      src={imgSrc} 
      alt="Professional HR consultant"
      className="w-full h-auto object-cover"
      onError={handleError}
    />
  );
}

