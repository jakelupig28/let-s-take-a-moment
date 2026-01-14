import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera } from 'lucide-react';
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

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Play Shutter Sound
    playShutter();

    const size = 600; 
    canvas.width = size;
    canvas.height = size;
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const minDim = Math.min(vWidth, vHeight);
    const sx = (vWidth - minDim) / 2;
    const sy = (vHeight - minDim) / 2;

    ctx.save();
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
    ctx.restore();

    if (selectedFrame.overlayType === 'vintage') {
      ctx.fillStyle = 'rgba(200, 190, 180, 0.15)';
      ctx.fillRect(0, 0, size, size);
    }
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [selectedFrame]);

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
    
    playTick(); // Play for first number

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          setIsCapturing(true);
          return 0;
        }
        playTick(); // Play for subsequent numbers
        return prev - 1;
      });
    }, 1000);
  };

  if (error) return <div className="text-red-500 font-mono text-sm">{error}</div>;

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Viewfinder */}
      <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden shadow-inner mb-8">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100 opacity-90 grayscale-[20%]"
        />
        
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <span className="text-9xl font-light text-neutral-900">{countdown}</span>
          </div>
        )}

        {isCapturing && (
          <div className="absolute top-4 right-4 flex gap-2 items-center z-20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono font-medium text-red-500">{capturedCount}/{TOTAL_FRAMES}</span>
          </div>
        )}

        {!isCountingDown && !isCapturing && (
           <div 
             className="absolute inset-0 pointer-events-none z-10"
             style={{
               border: `${selectedFrame.borderWidth}px solid ${selectedFrame.borderColor === '#ffffff' ? 'rgba(255,255,255,0.8)' : selectedFrame.borderColor}`,
               borderRadius: `${selectedFrame.borderRadius}px`
             }}
           />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      {!isCapturing && !isCountingDown && (
        <button
          onClick={startCountdown}
          className="group relative flex items-center justify-center w-16 h-16 rounded-full border border-neutral-300 hover:border-neutral-900 transition-all"
        >
          <div className="w-12 h-12 bg-neutral-900 rounded-full group-hover:scale-90 transition-transform"></div>
        </button>
      )}
      
      {isCapturing && (
        <div className="text-neutral-400 text-xs tracking-widest uppercase animate-pulse">
          Recording Sequence
        </div>
      )}
    </div>
  );
};
