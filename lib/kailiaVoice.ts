// ── Kailia's own voice ──
// Kailia doesn't explain things (that's Noel's job); she cheers. When she
// jumps for joy in a game she sometimes says one of these short happy lines
// in her own young voice. The lines are recorded ahead of time by
// scripts/record-voice.py (speaker "kailia") into public/voice/kailia/,
// listed in public/voice/kailia/manifest.json. Until they're recorded she
// stays quiet (a robot voice would spoil her). Never while Noel is talking.

import { soundEnabled } from './accessibility';
import { isTalking } from './voice';

/** Keep in sync with voice/kailia-lines.json (the recording list). */
export const KAILIA_CHEERS = [
  'Yay!', 'I did it!', 'Wheee!', 'Woohoo!', 'Hooray!', 'We did it!',
  'Yippee!', 'So fun!', 'Look at me!', 'I can do it!', 'Ta-da!', 'Again, again!',
];

let clips: Record<string, string> | null = null;
if (typeof window !== 'undefined') {
  fetch('/voice/kailia/manifest.json')
    .then(r => (r.ok ? r.json() : {}))
    .then((m: Record<string, string>) => { clips = m ?? {}; })
    .catch(() => { clips = {}; });
}

let player: HTMLAudioElement | null = null;
let lastAt = 0;
let lastLine = '';

/** Kailia cheers, sometimes: at most every 6 s, and only about half the time, so it stays special. */
export function kailiaCheer() {
  if (typeof window === 'undefined' || !clips || !soundEnabled() || isTalking()) return;
  const now = performance.now();
  if (now - lastAt < 6000 || Math.random() < 0.45) return;
  const ready = KAILIA_CHEERS.filter(l => clips![l] && l !== lastLine);
  if (!ready.length) return;
  const line = ready[Math.floor(Math.random() * ready.length)];
  lastAt = now; lastLine = line;
  try {
    player = player ?? new Audio();
    player.src = `/voice/kailia/${clips[line]}`;
    player.volume = 0.8;
    void player.play().catch(() => { /* sound is a bonus */ });
  } catch { /* sound is a bonus */ }
}
