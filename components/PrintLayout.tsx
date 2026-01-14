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

  const slots = [...data.frames];
  const coverSrc = data.coverImage || `https://placehold.co/600x600/F5F5F5/A3A3A3?text=SEQUENCE`;
  const gridItems = [...slots, coverSrc]; 

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

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-8 py-3 bg-neutral-900 text-white text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all"
        >
          <Download className="w-4 h-4" /> Download Sheet
        </button>
      </div>

      <div className="overflow-auto w-full flex justify-center bg-neutral-100 p-8 border border-neutral-200">
        <div 
          ref={printRef}
          className="bg-white p-12 grid grid-cols-4 gap-0 shadow-xl"
          style={{
            width: '794px', 
            minHeight: '1123px',
          }}
        >
          {gridItems.map((src, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="relative border-r border-b border-dashed border-neutral-200 p-4 w-full h-full flex flex-col items-center justify-center aspect-[3/4]">
                 <div 
                   className="overflow-hidden mb-2"
                   style={{
                     width: '100%',
                     aspectRatio: '1/1',
                     border: `${Math.max(1, frameStyle.borderWidth / 2)}px solid ${frameStyle.borderColor}`,
                     borderRadius: `${frameStyle.borderRadius / 2}px`
                   }}
                 >
                   <img src={src} alt={`frame-${idx}`} className="w-full h-full object-cover grayscale-[10%]" />
                 </div>
                 <span className="text-[6px] text-neutral-300 uppercase tracking-[0.2em] self-start ml-1">
                   {idx === 15 ? 'CVR' : `0${idx + 1}`.slice(-2)}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};