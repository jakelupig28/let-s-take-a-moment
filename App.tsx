import React, { useState } from 'react';
import { AppStep, FlipbookData, FrameStyle } from './types';
import { FRAME_STYLES } from './constants';
import { CameraBooth } from './components/CameraBooth';
import { FrameSelector } from './components/FrameSelector';
import { FlipbookPreview } from './components/FlipbookPreview';
import { PrintLayout } from './components/PrintLayout';
import { CoverGenerator } from './components/CoverGenerator';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { initAudio, playClick } from './utils/sound';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [selectedFrame, setSelectedFrame] = useState<FrameStyle>(FRAME_STYLES[0]);
  const [flipbookData, setFlipbookData] = useState<FlipbookData>({
    frames: [],
    coverImage: null,
    timestamp: Date.now()
  });

  const handleStart = () => {
    initAudio(); // Resume AudioContext if needed
    playClick();
    setStep(AppStep.SETUP);
  };
  
  const handleFrameSelect = (frame: FrameStyle) => {
    playClick();
    setSelectedFrame(frame);
    setStep(AppStep.CAPTURE);
  };

  const handleCaptureComplete = (frames: string[]) => {
    setFlipbookData(prev => ({ ...prev, frames }));
    setStep(AppStep.PREVIEW);
  };

  const handleCoverGenerated = (imgUrl: string) => {
    playClick();
    setFlipbookData(prev => ({ ...prev, coverImage: imgUrl }));
    setStep(AppStep.PRINT);
  };

  const handleSkipCover = () => {
    playClick();
    setStep(AppStep.PRINT);
  };

  const handleBack = () => {
    playClick();
    switch (step) {
      case AppStep.SETUP:
        setStep(AppStep.LANDING);
        break;
      case AppStep.CAPTURE:
        setStep(AppStep.SETUP);
        break;
      case AppStep.PREVIEW:
        setStep(AppStep.CAPTURE);
        break;
      case AppStep.PRINT:
        setStep(AppStep.PREVIEW);
        break;
      default:
        break;
    }
  };

  // Animation variants for smooth page transitions
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      filter: 'blur(8px)',
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      scale: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      filter: 'blur(8px)',
      scale: 0.98,
      transition: { duration: 0.4, ease: "easeIn" }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden">
      {/* Minimal Header - Hidden on Landing Page */}
      {step !== AppStep.LANDING && (
        <header className="w-full py-8 px-6 flex justify-start items-center max-w-4xl mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-700">
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] pt-0.5">Back</span>
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl px-6 flex flex-col items-center justify-center min-h-[600px] relative">
        <AnimatePresence mode="wait">
          {step === AppStep.LANDING && (
            <motion.div 
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center w-full max-w-2xl"
            >
              <span className="text-neutral-400 text-sm tracking-[0.2em] uppercase mb-4">Analog Series v1.0</span>
              <h2 className="text-6xl md:text-8xl font-medium tracking-tight leading-[0.9] mb-8 text-neutral-900">
                capture the<br/>moment.
              </h2>
              <p className="text-lg text-neutral-500 max-w-md mb-12 font-light">
                Create a sequence of 15 frames. <br/>
                A minimal flipbook generator for your printed memories.
              </p>
              <button 
                onClick={handleStart}
                className="group flex items-center gap-3 px-10 py-4 bg-neutral-900 text-white text-sm font-medium uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 rounded-full"
              >
                Start Session <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === AppStep.SETUP && (
            <motion.div 
              key="setup"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-2xl"
            >
               <div className="mb-12 text-center">
                  <h3 className="text-2xl font-light">Select Frame of Flipbook</h3>
               </div>
               <FrameSelector selectedFrame={selectedFrame} onSelect={handleFrameSelect} />
            </motion.div>
          )}

          {step === AppStep.CAPTURE && (
            <motion.div 
              key="capture"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex flex-col items-center"
            >
              <CameraBooth 
                onCaptureComplete={handleCaptureComplete} 
                selectedFrame={selectedFrame}
              />
            </motion.div>
          )}

          {step === AppStep.PREVIEW && (
            <motion.div 
              key="preview"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full flex flex-col items-center gap-16"
            >
              <FlipbookPreview data={flipbookData} frameStyle={selectedFrame} />

              <div className="flex flex-col md:flex-row gap-8 items-center w-full max-w-2xl">
                <div className="flex-1 w-full">
                  <CoverGenerator 
                    onCoverGenerated={handleCoverGenerated}
                    onSkip={handleSkipCover}
                  />
                </div>
                <div className="hidden md:flex h-12 w-[1px] bg-neutral-200"></div>
                <button 
                  onClick={() => setStep(AppStep.CAPTURE)}
                  className="text-neutral-400 hover:text-neutral-900 text-sm tracking-widest uppercase transition-colors"
                >
                  Retake Sequence
                </button>
              </div>
            </motion.div>
          )}

          {step === AppStep.PRINT && (
            <motion.div 
              key="print"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
               <div className="flex justify-between items-end mb-8 border-b border-neutral-200 pb-4">
                <div>
                  <h2 className="text-2xl font-light">Production</h2>
                  <p className="text-neutral-400 text-sm mt-1">Ready for print on A4.</p>
                </div>
              </div>
              <PrintLayout data={flipbookData} frameStyle={selectedFrame} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Credits Footer - Fixed at bottom */}
      {step === AppStep.LANDING && (
        <div className="fixed bottom-6 left-0 w-full text-center z-40 animate-in fade-in duration-1000 delay-500">
           <span className="text-neutral-500 text-[10px] tracking-[0.2em] uppercase font-medium">
             Created by Jake Lupig
           </span>
        </div>
      )}

      {/* Minimal Footer Progress */}
      {step !== AppStep.LANDING && (
        <div className="fixed bottom-0 left-0 w-full h-1 bg-neutral-100 z-50">
          <motion.div 
            className="h-full bg-neutral-900"
            initial={{ width: 0 }}
            animate={{ 
              width: `${(Object.values(AppStep).indexOf(step) / (Object.values(AppStep).length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  );
};

export default App;