// ── Voice and sound for the friends' games ──
// speak(): the browser's built-in voice reads a line aloud (it only
// speaks, it never listens). tones(): small sine-wave chimes. Both stay
// silent when the device has no voice or sound is switched off in the app.

import { soundEnabled } from '@/lib/accessibility';

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.1;
    s.speak(u);
  } catch { /* no voice on this device */ }
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let ctx: AudioContext | null = null;

/** notes: frequency (Hz), start (s from now), duration (s) */
export function tones(notes: { f: number; t: number; d: number }[], type: OscillatorType = 'sine') {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new Ctx();
    const now = ctx.currentTime;
    notes.forEach(({ f, t, d }) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.13, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.02);
    });
  } catch { /* sound is a bonus */ }
}

export const chime = {
  tap: () => tones([{ f: 620, t: 0, d: 0.08 }]),
  good: () => tones([{ f: 660, t: 0, d: 0.12 }, { f: 880, t: 0.09, d: 0.2 }]),
  soft: () => tones([{ f: 330, t: 0, d: 0.18 }]),
  fanfare: () => tones([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};
