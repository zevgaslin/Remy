import { getAudioContext } from './audioContext';

// A small "ding": a few bell-like partials that ring and fade. Fails silently.
const PARTIALS = [
  { ratio: 1, gain: 0.22, decay: 1.2 },
  { ratio: 2.76, gain: 0.08, decay: 0.6 },
  { ratio: 5.4, gain: 0.04, decay: 0.3 },
];

export function playBellSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = 1046.5; // C6

    PARTIALS.forEach(({ ratio, gain, decay }) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * ratio, now);
      amp.gain.setValueAtTime(0.001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.005);
      amp.gain.exponentialRampToValueAtTime(0.001, now + decay);
      osc.connect(amp).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch {
    // Ignore: no sound is fine.
  }
}
