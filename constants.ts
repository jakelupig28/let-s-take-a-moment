import { FrameStyle } from './types';

export const TOTAL_FRAMES = 15;
export const CAPTURE_INTERVAL_MS = 600; // Time between shots
export const COUNTDOWN_SECONDS = 3;

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: 'minimal-white',
    name: 'Clean White',
    borderColor: '#ffffff',
    borderWidth: 12,
    borderRadius: 0,
    overlayType: 'none',
  },
  {
    id: 'minimal-black',
    name: 'Mono Black',
    borderColor: '#000000',
    borderWidth: 16,
    borderRadius: 0,
    overlayType: 'none',
  },
  {
    id: 'soft-gray',
    name: 'Stone',
    borderColor: '#e4e4e7', // zinc-200
    borderWidth: 20,
    borderRadius: 0,
    overlayType: 'none',
  },
  {
    id: 'vintage-mono',
    name: 'Film Grain',
    borderColor: '#18181b', // zinc-900
    borderWidth: 12,
    borderRadius: 4,
    overlayType: 'vintage',
  },
];
