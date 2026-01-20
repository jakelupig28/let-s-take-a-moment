import React, { useRef } from 'react';
import { FlipbookData, FrameStyle } from '../types';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PrintLayoutProps {
  data: FlipbookData;
  frameStyle: FrameStyle;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ data, frameStyle }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Helper to determine text contrast color
  const getContrastColor = (hex: string) => {
    if (!hex || hex[0] !== '#') return '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#171717' : '#ffffff';
  };

  const textColor = getContrastColor(frameStyle.borderColor);

  // Prepare grid items: Cover (Thumbnail) + Frames
  const frames = [...data.frames];
  const gridItems = ['COVER_TOKEN', ...frames]; 

  const handleDownload = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `lets-take-a-moment-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  // Format date as mm/dd/yyyy
  const dateObj = new Date(data.timestamp);
  const dateString = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;

  // Calculate layout percentages based on reference dimensions (960x540) from CameraBooth
  const REFERENCE_WIDTH = 960;
  const REFERENCE_HEIGHT = 540;
  
  // Percentages for padding relative to container dimensions
  const paddingX = (frameStyle.borderWidth / REFERENCE_WIDTH) * 100;
  const paddingY = (frameStyle.borderWidth / REFERENCE_HEIGHT) * 100;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-8 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-8 py-3 border border-neutral-900 text-neutral-900 text-sm uppercase tracking-widest hover:bg-neutral-50 transition-all"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-3 bg-neutral-900 text-white text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all"
        >
          <Download className="w-4 h-4" /> Download Sheet
        </button>
      </div>

      <div className="overflow-auto w-full flex justify-center bg-neutral-100 p-8 border border-neutral-200 print:p-0 print:border-none print:bg-white print:overflow-visible">
        <div 
          ref={printRef}
          className="bg-white p-6 grid grid-cols-3 gap-0 shadow-xl print:shadow-none print:w-full print:h-full print:p-6"
          style={{
            width: '794px', 
            minHeight: '1123px', // Standard A4 height
          }}
        >
          {gridItems.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center">
              {/* 
                  Print Cell Container
                  Using aspect-video (16:9) to match capture format
              */}
              <div className="relative border-r border-b border-dashed border-neutral-200 w-full aspect-video flex flex-col items-center justify-center print:border-neutral-300">
                 <div className="relative overflow-hidden w-full h-full">
                   {item === 'COVER_TOKEN' ? (
                     // Cover / Thumbnail Rendering
                     <div 
                        className="relative w-full h-full"
                        style={{ backgroundColor: frameStyle.borderColor }}
                     >
                        {/* Gutter Content */}
                        <div className="absolute left-0 top-0 bottom-0 w-[15%] z-10">
                            {/* Title - Centered vertically to match frames */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span 
                                    className="whitespace-nowrap font-medium italic"
                                    style={{ 
                                        color: textColor,
                                        fontFamily: '"Playfair Display", serif',
                                        fontSize: '5px', // Smaller to match the 16px frame text
                                        letterSpacing: '0.5px',
                                        transform: 'rotate(-90deg)' 
                                    }}
                                >
                                let's take a moment
                                </span>
                            </div>
                            
                            {/* Date - Positioned absolutely at the bottom of the gutter */}
                            <div className="absolute left-0 right-0 bottom-4 flex items-center justify-center pointer-events-none">
                                <span 
                                    className="whitespace-nowrap font-mono opacity-70"
                                    style={{ 
                                        color: textColor,
                                        fontSize: '4px', // Tiny font for date
                                        letterSpacing: '0.5px',
                                        transform: 'rotate(-90deg)' 
                                    }}
                                >
                                    {dateString}
                                </span>
                            </div>
                        </div>

                        {/* Photo Area (Empty or Image) */}
                        <div 
                            className="absolute bg-neutral-100 flex items-center justify-center overflow-hidden"
                            style={{
                                top: `${paddingY}%`,
                                bottom: `${paddingY}%`,
                                right: `${paddingX}%`,
                                left: `${15 + paddingX}%`, // 15% gutter + padding
                            }}
                        >
                            {data.coverImage ? (
                                <img src={data.coverImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                /* Empty State */
                                null
                            )}

                            {/* Optional Vintage Overlay for consistency */}
                            {frameStyle.overlayType === 'vintage' && (
                                <div className="absolute inset-0 bg-orange-900/10 mix-blend-multiply pointer-events-none"></div>
                            )}
                        </div>
                     </div>
                   ) : (
                     <img src={item} alt={`frame-${idx}`} className="w-full h-full object-cover grayscale-[10%]" />
                   )}
                 </div>
              </div>
            </div>
          ))}
          
          {/* Fill remaining grid cells to complete the row if needed */}
          {Array.from({ length: (3 - (gridItems.length % 3)) % 3 }).map((_, i) => (
             <div key={`empty-${i}`} className="border-r border-b border-dashed border-neutral-100 aspect-video"></div>
          ))}
        </div>
      </div>
    </div>
  );
};