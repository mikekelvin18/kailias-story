// ── A tiny buzz on a right tap ──
// Phones that can vibrate (most Android phones; iPhones' browsers can't)
// give one short, soft buzz when a child gets something right. Grown-ups
// switch it off in the Parent Zone (lib/accessibility.ts `haptics`). Never
// on a miss: a buzz there could feel like a "no".

import { loadA11y } from './accessibility';

let lastAt = 0;

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** One soft buzz for a right answer (at most every 120 ms). */
export function buzzGood() {
  if (!canVibrate() || loadA11y().haptics === false) return;
  const now = Date.now();
  if (now - lastAt < 120) return;
  lastAt = now;
  try { navigator.vibrate(15); } catch { /* a bonus, never needed */ }
}
