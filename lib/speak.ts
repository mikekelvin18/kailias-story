// ── Read-aloud ──
// Noel reads instructions out loud. The voice itself (picking the
// warmest natural voice on the device) lives in lib/voice.ts.
// Respects the sound setting.

import { soundEnabled } from './accessibility';
import { say, hush } from './voice';

/** `voice`: a pet friend's name when the friend is the one talking. */
export function speak(text: string, voice?: string) {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  say(text, voice ? { voice } : {});
}

export function stopSpeaking() {
  hush();
}
