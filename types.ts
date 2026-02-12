export enum AppStep {
  LANDING = 'LANDING',
  SETUP = 'SETUP',
  CAPTURE = 'CAPTURE',
  PREVIEW = 'PREVIEW',
  PRINT = 'PRINT'
}

export type AppMode = 'FLIPBOOK' | 'PHOTOBOOTH';

export interface FrameStyle {
  id: string;
  name: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  overlayType?: 'none' | 'vintage' | 'sparkle';
}

export interface FlipbookData {
  frames: string[]; // Base64 strings
  coverImage: string | null;
  timestamp: number;
}
