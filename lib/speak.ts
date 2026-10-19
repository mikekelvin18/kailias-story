// ── Read-aloud ──
// Noel reads instructions out loud with the browser's built-in speech
// voice (no audio files, no network, nothing recorded — this only ever
// SPEAKS, it never listens). Respects the sound setting.

import { soundEnabled } from './accessibility';

export function speak(text: string) {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    // emoji read aloud sound odd ("sparkles"), so strip them
    const clean = text.replace(/\p{Extended_Pictographic}|️/gu, '').trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.9;
    u.pitch = 1.1;
    synth.speak(u);
  } catch { /* reading aloud is a bonus, never an error */ }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}
