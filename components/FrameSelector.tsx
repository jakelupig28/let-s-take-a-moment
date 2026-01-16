import React from 'react';
import { FrameStyle } from '../types';
import { FRAME_STYLES } from '../constants';

interface FrameSelectorProps {
  selectedFrame: FrameStyle;
  onSelect: (frame: FrameStyle) => void;
}

export const FrameSelector: React.FC<FrameSelectorProps> = ({ selectedFrame, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 w-full max-w-4xl px-4">
      {FRAME_STYLES.map((style) => {
        const isSelected = selectedFrame.id === style.id;
        // Scale down the border width for the small preview (approx 1/4 - 1/5 scale)
        const scaledPadding = Math.max(2, Math.round(style.borderWidth / 4)); 
        const previewBorderRadius = Math.max(0, Math.round(style.borderRadius / 2.5));

        return (
          <button
            key={style.id}
            onClick={() => onSelect(style)}
            className={`
              group flex flex-col items-center gap-4 transition-all duration-500 focus:outline-none
              ${isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-90'}
            `}
          >
            {/* Preview Container */}
            <div 
              className={`
                relative w-36 h-20 flex items-center justify-center transition-all duration-500 ease-out
                ${isSelected ? 'scale-105' : 'group-hover:scale-105'}
              `}
            >
              {/* The Frame Visualization - 16:9 Aspect Ratio Card */}
              <div 
                className="relative w-28 h-[3.9375rem] overflow-hidden shadow-sm transition-all duration-300 flex ring-1 ring-black/5"
                style={{
                  borderRadius: `${previewBorderRadius}px`,
                  backgroundColor: style.borderColor
                }}
              >
                {/* Simulated Photo Content */}
                {/* Positioned to create: Left 15% gutter + Padding, Top/Right/Bottom Padding */}
                <div 
                  className="absolute bg-neutral-100 overflow-hidden"
                  style={{
                     left: `calc(15% + ${scaledPadding}px)`, // Gutter + Padding
                     top: `${scaledPadding}px`,
                     right: `${scaledPadding}px`,
                     bottom: `${scaledPadding}px`,
                  }}
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-neutral-200/50 to-neutral-50"></div>
                   <div className="absolute bottom-0 w-full h-1/2 bg-neutral-200/30 skew-y-6 transform origin-bottom-left"></div>
                   <div className="absolute top-1/4 right-1/4 w-4 h-4 rounded-full bg-neutral-900/5"></div>
                   
                   {style.overlayType === 'vintage' && (
                     <div className="absolute inset-0 bg-orange-900/10 mix-blend-multiply"></div>
                   )}
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1 items-center">
              <span className={`text-[10px] uppercase tracking-[0.3em] font-semibold transition-colors ${isSelected ? 'text-neutral-900' : 'text-neutral-400'}`}>
                {style.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};