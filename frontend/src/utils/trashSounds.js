// Trash can sounds, synthesized with the Web Audio API so no audio files are needed.
// Every function fails silently: sound is a nice-to-have, never a reason to break deleting.
import { getAudioContext } from './audioContext';

function noiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// A short tick when the lid opens.
export function playLidSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Ignore: no sound is fine.
  }
}

// A paper crumple followed by a thunk as the item lands in the can.
export function playTrashSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const crumple = ctx.createBufferSource();
    crumple.buffer = noiseBuffer(ctx, 0.35);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.3);
    const crumpleGain = ctx.createGain();
    crumpleGain.gain.setValueAtTime(0.001, now);
    crumpleGain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    crumpleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
    crumple.connect(filter).connect(crumpleGain).connect(ctx.destination);
    crumple.start(now);

    const thunkStart = now + 0.22;
    const thunk = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    thunk.type = 'sine';
    thunk.frequency.setValueAtTime(150, thunkStart);
    thunk.frequency.exponentialRampToValueAtTime(55, thunkStart + 0.16);
    thunkGain.gain.setValueAtTime(0.001, thunkStart);
    thunkGain.gain.exponentialRampToValueAtTime(0.5, thunkStart + 0.01);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, thunkStart + 0.2);
    thunk.connect(thunkGain).connect(ctx.destination);
    thunk.start(thunkStart);
    thunk.stop(thunkStart + 0.22);
  } catch {
    // Ignore: no sound is fine.
  }
}

// A soft rising blip when a deletion is undone.
export function playRestoreSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Ignore: no sound is fine.
  }
}
