import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TOTAL_FRAMES, RECORDING_DURATION_MS, COUNTDOWN_SECONDS } from '../constants';
import { FrameStyle } from '../types';
import { playTick, playShutter } from '../utils/sound';
import { Loader2 } from 'lucide-react';

interface CameraBoothProps {
  onCaptureComplete: (frames: string[]) => void;
  selectedFrame: FrameStyle;
}

export const CameraBooth: React.FC<CameraBoothProps> = ({ onCaptureComplete, selectedFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Store raw pixel data during capture to avoid serialization lag
  const rawFramesRef = useRef<ImageData[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0 to 100
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startCamera = async () => {
      setError(null);
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false // No audio needed for flipbook
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

  // Frame Rendering Logic
  const drawComposition = useCallback((
    sourceVideo: HTMLVideoElement, 
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    // Layout Calculation
    // Left Gutter: 15% fixed (Kept at 15% for video frames to maximize capture area)
    const gutterWidth = width * 0.15;
    
    // Padding/Frame Thickness
    const padding = selectedFrame.borderWidth; 

    // Destination Area for Video
    const destX = gutterWidth + padding;
    const destY = padding;
    const destW = width - gutterWidth - (padding * 2); 
    const destH = height - (padding * 2);
    const destAspect = destW / destH;

    const vWidth = sourceVideo.videoWidth;
    const vHeight = sourceVideo.videoHeight;
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
    // Translate to the right edge of the destination rect to handle the flip (mirror effect)
    ctx.translate(destX + destW, destY);
    ctx.scale(-1, 1);
    ctx.drawImage(sourceVideo, sX, sY, sW, sH, 0, 0, destW, destH);
    ctx.restore();

    // 3. Draw Branding Text in Gutter (Centered in Gutter area)
    ctx.save();
    ctx.translate(gutterWidth / 2, height / 2);
    ctx.rotate(-Math.PI / 2); // Rotated -90 degrees (Bottom to Top)
    // Use Playfair Display, Italic, smaller size for aesthetic
    ctx.font = 'italic 500 16px "Playfair Display", serif'; 
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '1px';
    ctx.fillText("let's take a moment", 0, 0);
    ctx.restore();

    // 4. Vintage Overlay (over the whole card)
    if (selectedFrame.overlayType === 'vintage') {
      ctx.fillStyle = 'rgba(200, 190, 180, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [selectedFrame, textColor]);

  const processFrames = async (rawFrames: ImageData[], width: number, height: number): Promise<string[]> => {
    // Create a temporary canvas for conversion
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return [];

    const processedFrames: string[] = [];

    // Process iteratively to avoid blocking main thread too long if we used a tight loop
    // But for 20 frames, a simple loop is usually acceptable.
    for (const frameData of rawFrames) {
        ctx.putImageData(frameData, 0, 0);
        processedFrames.push(tempCanvas.toDataURL('image/jpeg', 0.9));
    }
    
    // Add final frame (Solid color end card)
    ctx.fillStyle = selectedFrame.borderColor;
    ctx.fillRect(0, 0, width, height);
    processedFrames.push(tempCanvas.toDataURL('image/jpeg', 0.9));
    
    return processedFrames;
  };

  const startRecording = () => {
    if (!stream || !videoRef.current || !canvasRef.current) return;
    
    setIsRecording(true);
    setRecordingProgress(0);
    rawFramesRef.current = [];
    
    // Setup Canvas for Capture
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set Capture Resolution (16:9)
    const width = 960;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    const intervalTime = RECORDING_DURATION_MS / TOTAL_FRAMES;
    let frameCount = 0;
    
    const interval = setInterval(() => {
        if (!videoRef.current || !ctx) return;
        
        // Render Frame
        drawComposition(videoRef.current, ctx, width, height);
        
        // Capture raw pixel data (Faster than toDataURL)
        const frameData = ctx.getImageData(0, 0, width, height);
        rawFramesRef.current.push(frameData);
        
        frameCount++;
        setRecordingProgress((frameCount / TOTAL_FRAMES) * 100);

        if (frameCount >= TOTAL_FRAMES) {
            clearInterval(interval);
            setIsRecording(false);
            setIsProcessing(true);
            playShutter();

            // Process frames asynchronously to allow UI to update
            setTimeout(async () => {
                const finalFrames = await processFrames(rawFramesRef.current, width, height);
                setIsProcessing(false);
                onCaptureComplete(finalFrames);
            }, 100);
        }
    }, intervalTime);
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(COUNTDOWN_SECONDS);
    playTick(); 

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          startRecording();
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
          className="relative w-[15%] h-full z-20 shrink-0 transition-colors duration-300 overflow-hidden"
          style={{ backgroundColor: selectedFrame.borderColor }}
        >
          {/* Text Container - Centered and Rotated */}
          <div className="absolute inset-0 flex items-center justify-center">
             <span 
                className="whitespace-nowrap font-medium text-[16px] md:text-[20px]"
                style={{ 
                  color: textColor,
                  fontFamily: '"Playfair Display", serif',
                  fontStyle: 'italic',
                  letterSpacing: '1px',
                  transform: 'rotate(-90deg)' 
                }}
             >
               let's take a moment
             </span>
          </div>
        </div>

        {/* Video Section (85%) with Borders */}
        <div 
          className="relative flex-1 h-full overflow-hidden transition-all duration-300"
          style={{ 
            backgroundColor: selectedFrame.borderColor,
            paddingTop: `${selectedFrame.borderWidth}px`,
            paddingBottom: `${selectedFrame.borderWidth}px`,
            paddingRight: `${selectedFrame.borderWidth}px`,
            paddingLeft: `${selectedFrame.borderWidth}px`,
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
            
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 z-20 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <span className="text-white font-mono text-sm tracking-widest uppercase">Developing</span>
              </div>
            )}

            {isRecording && (
              <div className="absolute inset-x-0 top-0 p-4 z-30 flex justify-between items-start">
                 <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                    <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">REC</span>
                 </div>
              </div>
            )}

            {/* Recording Progress Bar (at bottom of video feed) */}
            {isRecording && (
               <div className="absolute bottom-0 left-0 w-full h-2 bg-neutral-800/50">
                  <div 
                    className="h-full bg-red-500 transition-all duration-75 ease-linear"
                    style={{ width: `${recordingProgress}%` }}
                  ></div>
               </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      {!isRecording && !isCountingDown && !isProcessing && (
        <button
          onClick={startCountdown}
          className="group relative flex items-center justify-center w-16 h-16 mt-8 rounded-full border border-neutral-300 hover:border-neutral-900 transition-all"
        >
          <div className="w-12 h-12 bg-neutral-900 rounded-full group-hover:scale-90 transition-transform"></div>
        </button>
      )}
      
      {isRecording && (
        <div className="text-neutral-400 text-xs tracking-widest uppercase mt-8 font-mono">
          Keep Moving
        </div>
      )}
    </div>
  );
};