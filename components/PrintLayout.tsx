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
  const coverSrc = data.coverImage || `https://placehold.co/960x540/F5F5F5/A3A3A3?text=%20`;
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

  const handlePrint = () => {
    window.print();
  };

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
          {gridItems.map((src, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center">
              {/* 
                  Print Cell Container
                  Using aspect-video (16:9) to match capture format
                  Removed frame number overlay as requested
              */}
              <div className="relative border-r border-b border-dashed border-neutral-200 w-full aspect-video flex flex-col items-center justify-center print:border-neutral-300">
                 <div 
                   className="relative overflow-hidden w-full h-full"
                 >
                   <img src={src} alt={`frame-${idx}`} className="w-full h-full object-cover grayscale-[10%]" />
                 </div>
              </div>
            </div>
          ))}
          
          {/* Fill remaining grid cells */}
          {Array.from({ length: (3 - (gridItems.length % 3)) % 3 }).map((_, i) => (
             <div key={`empty-${i}`} className="border-r border-b border-dashed border-neutral-100 aspect-video"></div>
          ))}
        </div>
      </div>
    </div>
  );
};