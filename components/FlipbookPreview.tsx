import React, { useEffect, useState } from 'react';
import { FlipbookData, FrameStyle, AppMode } from '../types';
import { TOTAL_FRAMES } from '../constants';

interface FlipbookPreviewProps {
  data: FlipbookData;
  frameStyle: FrameStyle;
  mode: AppMode;
}

export const FlipbookPreview: React.FC<FlipbookPreviewProps> = ({ data, frameStyle, mode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (mode === 'PHOTOBOOTH' || data.frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.frames.length);
    }, 150);
    return () => clearInterval(interval);
  }, [data.frames.length, mode]);

  const currentImage = data.frames[currentIndex];

  // Cap the displayed current frame number to TOTAL_FRAMES so the extra solid color frame doesn't increment the count beyond 20
  const displayCurrent = Math.min(currentIndex + 1, TOTAL_FRAMES);

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative bg-white overflow-hidden shadow-lg transition-transform hover:scale-[1.02] duration-300"
        style={{
          width: mode === 'PHOTOBOOTH' ? '480px' : '320px',
          height: mode === 'PHOTOBOOTH' ? '270px' : '180px', // 16:9 Aspect Ratio
          borderRadius: `${frameStyle.borderRadius}px`
        }}
      >
        <img 
          src={currentImage} 
          alt={`Frame ${currentIndex}`} 
          className="w-full h-full object-cover grayscale-[10%]"
        />
        
        {/* Frame Counter - Moved to upper right */}
        {mode === 'FLIPBOOK' && (
          <div className="absolute top-4 right-4 text-[10px] font-medium tracking-widest text-neutral-900 bg-white px-3 py-1.5 shadow-sm z-10">
            {displayCurrent} — {TOTAL_FRAMES}
          </div>
        )}
      </div>
    </div>
  );
};