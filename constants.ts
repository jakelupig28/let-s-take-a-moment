import { FrameStyle } from './types';

export const TOTAL_FRAMES = 20;
export const RECORDING_DURATION_MS = 6000; // 6 Seconds video
export const COUNTDOWN_SECONDS = 3;

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: 'minimal-white',
    name: 'Clean White',
    borderColor: '#ffffff',
    borderWidth: 24,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'minimal-black',
    name: 'Mono Black',
    borderColor: '#000000',
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'soft-gray',
    name: 'Stone',
    borderColor: '#e4e4e7', // zinc-200
    borderWidth: 32,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'vintage-mono',
    name: 'Film Grain',
    borderColor: '#18181b', // zinc-900
    borderWidth: 24,
    borderRadius: 8,
    overlayType: 'vintage',
  },
  {
    id: 'cherry-red',
    name: 'Cherry',
    borderColor: '#dc2626', // red-600
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'royal-blue',
    name: 'Royal',
    borderColor: '#1e40af', // blue-800
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'forest-green',
    name: 'Forest',
    borderColor: '#166534', // green-800
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'lavender-haze',
    name: 'Lavender',
    borderColor: '#d8b4fe', // purple-300
    borderWidth: 32,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    borderColor: '#a3e635', // lime-400
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'butter',
    name: 'Butter',
    borderColor: '#fef08a', // yellow-200
    borderWidth: 32,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'rose',
    name: 'Rose',
    borderColor: '#fda4af', // rose-300
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'tangerine',
    name: 'Tangerine',
    borderColor: '#fdba74', // orange-300
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    borderColor: '#172554', // blue-950
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    borderColor: '#451a03', // amber-950
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'sky',
    name: 'Sky',
    borderColor: '#bae6fd', // sky-200
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'mint',
    name: 'Mint',
    borderColor: '#a7f3d0', // emerald-200
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'wine',
    name: 'Wine',
    borderColor: '#881337', // rose-900
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'olive',
    name: 'Olive',
    borderColor: '#4d7c0f', // lime-700
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'sand',
    name: 'Sand',
    borderColor: '#d6d3d1', // stone-300
    borderWidth: 32,
    borderRadius: 8,
    overlayType: 'none',
  },
  {
    id: 'slate',
    name: 'Slate',
    borderColor: '#475569', // slate-600
    borderWidth: 28,
    borderRadius: 8,
    overlayType: 'none',
  }
];