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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0 to 100
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Frame Rendering Logic (Reused for both preview and extraction)
  const drawComposition = useCallback((
    sourceVideo: HTMLVideoElement, 
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    // Layout Calculation
    // Left Gutter: 15% fixed
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

  const processVideo = async (videoBlob: Blob) => {
    setIsProcessing(true);
    const tempVideo = document.createElement('video');
    tempVideo.src = URL.createObjectURL(videoBlob);
    tempVideo.muted = true;
    tempVideo.playsInline = true;
    
    // Wait for metadata to load to get duration
    await new Promise((resolve) => {
      tempVideo.onloadedmetadata = () => resolve(true);
      // Trigger load
      tempVideo.load();
    });

    // Ensure canvas exists
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 16:9 Aspect Ratio Output
    const width = 960;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    const frames: string[] = [];
    
    // We want 15 frames from the 6 second video.
    // However, the video duration might slightly differ from 6s due to recording latency.
    // Use actual duration.
    const duration = tempVideo.duration;
    
    // Extract frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      // Calculate timestamp for this frame
      const time = (i / TOTAL_FRAMES) * duration;
      tempVideo.currentTime = time;

      // Wait for seek to complete
      await new Promise((resolve) => {
        tempVideo.onseeked = resolve;
      });

      // Draw
      drawComposition(tempVideo, ctx, width, height);
      
      // Capture
      frames.push(canvas.toDataURL('image/jpeg', 0.9));
    }

    // Add final solid color frame
    ctx.fillStyle = selectedFrame.borderColor;
    ctx.fillRect(0, 0, width, height);
    frames.push(canvas.toDataURL('image/jpeg', 0.9));

    URL.revokeObjectURL(tempVideo.src);
    playShutter(); // Play sound to indicate processing done
    onCaptureComplete(frames);
    setIsProcessing(false);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    try {
      // Prefer mp4/webm, fallback to default
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
        ? 'video/mp4' 
        : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '');
        
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        processVideo(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingProgress(0);

      // Progress Timer
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / RECORDING_DURATION_MS) * 100, 100);
        setRecordingProgress(progress);

        if (elapsed >= RECORDING_DURATION_MS) {
          clearInterval(interval);
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          setIsRecording(false);
        }
      }, 50);

    } catch (e) {
      console.error("Failed to start recording", e);
      setError("Failed to start video recording.");
    }
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

            {isRecording && (
              <div className="absolute inset-x-0 top-0 p-4 z-30 flex justify-between items-start">
                 <div className="flex items-center gap-3 px-4 py-2 bg-neutral-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                    <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">REC</span>
                 </div>
              </div>
            )}

            {isProcessing && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 z-40 backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                  <span className="text-white font-mono text-sm tracking-widest uppercase">Developing...</span>
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