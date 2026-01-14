import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import { generateCoverArt } from '../services/geminiService';

interface CoverGeneratorProps {
  onCoverGenerated: (imgUrl: string) => void;
  onSkip: () => void;
}

export const CoverGenerator: React.FC<CoverGeneratorProps> = ({ onCoverGenerated, onSkip }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const url = await generateCoverArt(prompt);
      setGeneratedImage(url);
    } catch (err) {
      setError("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) onCoverGenerated(generatedImage);
  };

  if (generatedImage) {
    return (
      <div className="w-full flex flex-col gap-4 animate-in fade-in">
        <div className="relative aspect-square w-32 bg-neutral-100 mx-auto border border-neutral-200">
           <img src={generatedImage} alt="Cover" className="w-full h-full object-cover" />
           <button onClick={() => setGeneratedImage(null)} className="absolute -top-2 -right-2 bg-neutral-900 text-white p-1 rounded-full"><X className="w-3 h-3"/></button>
        </div>
        <div className="flex flex-col gap-2">
           <button onClick={handleConfirm} className="w-full py-3 bg-neutral-900 text-white text-sm uppercase tracking-widest hover:bg-neutral-800">Use Cover</button>
           <button onClick={() => setGeneratedImage(null)} className="w-full py-2 text-neutral-400 text-xs uppercase tracking-widest hover:text-neutral-900">Discard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-neutral-900">Cover Art (Optional)</label>
        <div className="flex gap-0 border-b border-neutral-300 focus-within:border-neutral-900 transition-colors">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your aesthetic..."
            className="flex-1 py-2 bg-transparent outline-none text-neutral-900 placeholder:text-neutral-300 font-light"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-4 text-neutral-900 disabled:opacity-30 hover:opacity-70"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={onSkip} className="text-xs text-neutral-400 hover:text-neutral-900 text-left mt-2">
          Skip and use blank cover
        </button>
      </div>
    </div>
  );
};
