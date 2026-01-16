import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TOTAL_FRAMES, CAPTURE_INTERVAL_MS, COUNTDOWN_SECONDS } from '../constants';
import { FrameStyle } from '../types';
import { playTick, playShutter } from '../utils/sound';

interface CameraBoothProps {
  onCaptureComplete: (frames: string[]) => void;
  selectedFrame: FrameStyle;
}

export const CameraBooth: React.FC<CameraBoothProps> = ({ onCaptureComplete, selectedFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startCamera = async () => {
      setError(null);
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera access required.");
      }
    };
    startCamera();
    return () => {
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Helper to determine text contrast color
  const getContrastColor = (hex: string) => {
    if (!hex || hex[0] !== '#') return '#000000';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#171717' : '#ffffff';
  };

  const textColor = getContrastColor(selectedFrame.borderColor);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    playShutter();

    // 16:9 Aspect Ratio Output
    const width = 960;
    const height = 540;
    
    canvas.width = width;
    canvas.height = height;
    
    // Layout Calculation
    // Left Gutter: 15% fixed
    const gutterWidth = width * 0.15;
    
    // Padding/Frame Thickness
    const padding = selectedFrame.borderWidth; 

    // Destination Area for Video
    // We want the video to be padded from the gutter and from the outer edges.
    const destX = gutterWidth + padding;
    const destY = padding;
    const destW = width - gutterWidth - (padding * 2); // Left padding (after gutter) + Right padding
    const destH = height - (padding * 2); // Top padding + Bottom padding
    const destAspect = destW / destH;

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const vAspect = vWidth / vHeight;

    // Crop calculation to cover the destination area
    let sW, sH, sX, sY;
    if (vAspect > destAspect) {
      sH = vHeight;
      sW = vHeight * destAspect;
      sX = (vWidth - sW) / 2;
      sY = 0;
    } else {
      sW = vWidth;
      sH = vWidth / destAspect;
      sX = 0;
      sY = (vHeight - sH) / 2;
    }

    // 1. Fill background with Frame Color (Covers Gutter + Borders)
    ctx.fillStyle = selectedFrame.borderColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Video inside the padded area
    ctx.save();
    // Translate to the right edge of the destination rect to handle the flip
    ctx.translate(destX + destW, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sX, sY, sW, sH, 0, 0, destW, destH);
    ctx.restore();

    // 3. Draw Branding Text in Gutter (Centered in Gutter area)
    ctx.save();
    ctx.translate(gutterWidth / 2, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '500 14px "Courier New", Courier, monospace'; 
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    ctx.fillText("LET'S TAKE A MOMENT", 0, 0);
    ctx.restore();

    // 4. Vintage Overlay (over the whole card)
    if (selectedFrame.overlayType === 'vintage') {
      ctx.fillStyle = 'rgba(200, 190, 180, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [selectedFrame, textColor]);

  useEffect(() => {
    if (!isCapturing) return;
    const intervalId = setInterval(() => {
      setCapturedCount(prev => {
        if (prev >= TOTAL_FRAMES) {
          clearInterval(intervalId);
          setIsCapturing(false);
          return prev;
        }
        const frame = captureFrame();
        if (frame) setCapturedFrames(c => [...c, frame]);
        return prev + 1;
      });
    }, CAPTURE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isCapturing, captureFrame]);

  useEffect(() => {
    if (capturedFrames.length === TOTAL_FRAMES && !isCapturing) {
      setTimeout(() => onCaptureComplete(capturedFrames), 500);
    }
  }, [capturedFrames, isCapturing, onCaptureComplete]);

  const startCountdown = () => {
    setIsCountingDown(true);
    setCapturedFrames([]);
    setCapturedCount(0);
    setCountdown(COUNTDOWN_SECONDS);
    
    playTick(); 

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          setIsCapturing(true);
          return 0;
        }
        playTick(); 
        return prev - 1;
      });
    }, 1000);
  };

  if (error) return <div className="text-red-500 font-mono text-sm">{error}</div>;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto relative">
      {/* Viewfinder - Aspect 16:9 Landscape */}
      <div 
        className="relative w-full aspect-video overflow-hidden shadow-lg flex transition-all duration-300"
        style={{ borderRadius: `${selectedFrame.borderRadius}px` }}
      >
        
        {/* Left Gutter Section (15%) */}
        <div 
          className="relative w-[15%] h-full z-20 flex items-center justify-center shrink-0 transition-colors duration-300"
          style={{ backgroundColor: selectedFrame.borderColor }}
        >
          <span 
             className="writing-vertical-lr rotate-180 text-[12px] tracking-[0.3em] font-mono font-medium whitespace-nowrap transform -rotate-90"
             style={{ color: textColor }}
          >
            LET'S TAKE A MOMENT
          </span>
        </div>

        {/* Video Section (85%) with Borders */}
        {/* We use padding to simulate the top/right/bottom/left border inside this flex item */}
        <div 
          className="relative flex-1 h-full overflow-hidden transition-all duration-300"
          style={{ 
            backgroundColor: selectedFrame.borderColor,
            paddingTop: `${selectedFrame.borderWidth}px`,
            paddingBottom: `${selectedFrame.borderWidth}px`,
            paddingRight: `${selectedFrame.borderWidth}px`,
            paddingLeft: `${selectedFrame.borderWidth}px`, // Added padding left to separate from gutter
          }}
        >
          {/* Inner Video Container */}
          <div className="w-full h-full relative overflow-hidden bg-neutral-900 shadow-inner">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100 opacity-90 grayscale-[20%]"
            />
            
            {/* Overlays inside Video Section */}
            {isCountingDown && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                <span className="text-9xl font-light text-neutral-900 font-mono">{countdown}</span>
              </div>
            )}

            {isCapturing && (
              <div className="absolute top-4 right-4 flex gap-2 items-center z-20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono font-bold tracking-widest text-red-500 pt-0.5">
                  REC {capturedCount}/{TOTAL_FRAMES}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      {!isCapturing && !isCountingDown && (
        <button
          onClick={startCountdown}
          className="group relative flex items-center justify-center w-16 h-16 mt-8 rounded-full border border-neutral-300 hover:border-neutral-900 transition-all"
        >
          <div className="w-12 h-12 bg-neutral-900 rounded-full group-hover:scale-90 transition-transform"></div>
        </button>
      )}
      
      {isCapturing && (
        <div className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse mt-8 font-mono">
          Recording...
        </div>
      )}
    </div>
  );
};