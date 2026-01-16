import React, { useEffect, useState } from 'react';
import { FlipbookData, FrameStyle } from '../types';

interface FlipbookPreviewProps {
  data: FlipbookData;
  frameStyle: FrameStyle;
}

export const FlipbookPreview: React.FC<FlipbookPreviewProps> = ({ data, frameStyle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.frames.length);
    }, 150);
    return () => clearInterval(interval);
  }, [data.frames.length]);

  const currentImage = data.frames[currentIndex];

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative bg-white overflow-hidden shadow-lg"
        style={{
          width: '320px',
          height: '180px', // 16:9 Aspect Ratio (320 / 1.777)
          borderRadius: `${frameStyle.borderRadius}px`
          // Note: Border color is now part of the image itself, so we don't add a border here.
        }}
      >
        <img 
          src={currentImage} 
          alt={`Frame ${currentIndex}`} 
          className="w-full h-full object-cover grayscale-[10%]"
        />
        
        {/* Frame Counter - Matching the aesthetic reference */}
        <div className="absolute bottom-4 right-4 text-[10px] font-medium tracking-widest text-neutral-900 bg-white px-3 py-1.5 shadow-sm">
          {currentIndex + 1} — {data.frames.length}
        </div>
      </div>
    </div>
  );
};