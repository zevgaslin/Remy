// One shared AudioContext for the app's synthesized sounds. Browsers allow it to start
// only after a user gesture, so it is created lazily on the first sound.
let audioContext = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}
