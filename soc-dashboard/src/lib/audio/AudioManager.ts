'use client';

/**
 * Web Audio API-based sound system — no external audio files required.
 * Generates tones programmatically for mechanical HUD sounds.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(options: {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
  startFreq?: number;
  endFreq?: number;
  attack?: number;
  decay?: number;
}) {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = options.type;
    oscillator.frequency.setValueAtTime(options.startFreq ?? options.frequency, ctx.currentTime);
    if (options.endFreq) {
      oscillator.frequency.exponentialRampToValueAtTime(options.endFreq, ctx.currentTime + options.duration);
    }

    const attack = options.attack ?? 0.01;
    const decay = options.decay ?? options.duration;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(options.gain, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + decay);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + options.duration);
  } catch (e) {
    // Silently fail if audio not available
  }
}

export const AudioManager = {
  // Mechanical keyboard switch (UI interactions)
  playClick() {
    // Sharp plastic "snap" (the switch actuation)
    playTone({ type: 'square', frequency: 1200, startFreq: 2500, endFreq: 800, duration: 0.015, gain: 0.04, attack: 0.001, decay: 0.015 });
    
    // Hollow "clack" (the keycap bottoming out)
    setTimeout(() => {
      playTone({ type: 'triangle', frequency: 180, startFreq: 240, endFreq: 120, duration: 0.035, gain: 0.08, attack: 0.002, decay: 0.025 });
    }, 4);
  },

  // Low-frequency boot-up sound
  playBoot() {
    const ctx = getCtx();
    const freqs = [80, 120, 160, 200, 240, 300, 400];
    freqs.forEach((f, i) => {
      setTimeout(() => {
        playTone({ type: 'sine', frequency: f, duration: 0.2, gain: 0.1, attack: 0.02, decay: 0.2 });
      }, i * 80);
    });
    // Final chord
    setTimeout(() => {
      [400, 600, 800].forEach(f => playTone({ type: 'sine', frequency: f, duration: 0.6, gain: 0.06, attack: 0.05, decay: 0.6 }));
    }, freqs.length * 80);
  },

  // Rhythmic pulse warning alert
  playAlert() {
    const pulses = [0, 180, 360];
    pulses.forEach(delay => {
      setTimeout(() => {
        playTone({ type: 'sawtooth', frequency: 440, startFreq: 660, endFreq: 330, duration: 0.15, gain: 0.12, attack: 0.01, decay: 0.15 });
      }, delay);
    });
  },

  // Bass thud navigation sound
  playNav() {
    playTone({ type: 'sine', frequency: 80, startFreq: 120, endFreq: 60, duration: 0.25, gain: 0.15, attack: 0.01, decay: 0.25 });
    setTimeout(() => {
      playTone({ type: 'sine', frequency: 200, duration: 0.1, gain: 0.06, attack: 0.005, decay: 0.1 });
    }, 30);
  },

  // Theme switch sound (mechanical click with resonance)
  playThemeSwitch() {
    playTone({ type: 'square', frequency: 600, startFreq: 900, endFreq: 300, duration: 0.1, gain: 0.1, attack: 0.003, decay: 0.1 });
    setTimeout(() => {
      playTone({ type: 'sine', frequency: 1200, duration: 0.08, gain: 0.04, attack: 0.002, decay: 0.08 });
    }, 40);
  },
};
