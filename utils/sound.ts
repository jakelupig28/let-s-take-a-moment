
// Simple synthesizer for UI and Camera sounds using Web Audio API
// No external assets required

let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const initAudio = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

export const playClick = () => {
  const ctx = getContext();
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
  
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  
  osc.start(t);
  osc.stop(t + 0.05);
};

export const playTick = () => {
  const ctx = getContext();
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  
  osc.start(t);
  osc.stop(t + 0.1);
};

export const playShutter = () => {
  const ctx = getContext();
  const t = ctx.currentTime;
  
  // 1. Mechanical Clunk (Low sine)
  const osc = ctx.createOscillator();
  const gainOsc = ctx.createGain();
  osc.connect(gainOsc);
  gainOsc.connect(ctx.destination);
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  
  gainOsc.gain.setValueAtTime(0.1, t);
  gainOsc.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  
  osc.start(t);
  osc.stop(t + 0.1);

  // 2. Shutter Noise (White noise burst)
  const bufferSize = ctx.sampleRate * 0.1; // 100ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gainNoise = ctx.createGain();
  
  // Filter the noise to sound less harsh
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;

  noise.connect(filter);
  filter.connect(gainNoise);
  gainNoise.connect(ctx.destination);
  
  gainNoise.gain.setValueAtTime(0.2, t);
  gainNoise.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  
  noise.start(t);
};
