// ── Read-aloud ──
// Noel reads instructions out loud. The voice itself (picking the
// warmest natural voice on the device) lives in lib/voice.ts.
// Respects the sound setting.

import { soundEnabled } from './accessibility';
import { say, hush } from './voice';

export function speak(text: string) {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  say(text);
}

export function stopSpeaking() {
  hush();
}
