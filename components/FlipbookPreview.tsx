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
          height: '320px',
          border: `${frameStyle.borderWidth}px solid ${frameStyle.borderColor}`,
          borderRadius: `${frameStyle.borderRadius}px`
        }}
      >
        <img 
          src={currentImage} 
          alt={`Frame ${currentIndex}`} 
          className="w-full h-full object-cover grayscale-[10%]"
        />
        <div className="absolute bottom-4 right-4 text-[10px] tracking-widest text-neutral-500 bg-white/80 px-2 py-1 backdrop-blur-sm">
          {currentIndex + 1} — {data.frames.length}
        </div>
      </div>
    </div>
  );
};
