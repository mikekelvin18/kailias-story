// ── Kailia's own voice ──
// Kailia doesn't explain things (that's Noel's job); she cheers. When she
// jumps for joy in a game she sometimes says one of these short happy lines
// in her own young voice. The clips are made ahead of time by
// scripts/generate_voices.py (Chatterbox, see the README) into
// public/audio/kailia/. Until they're made she stays quiet here (a robot
// voice would spoil a cheer). Never while Noel is talking.

import { soundEnabled, masterVolume, narrationOn } from './accessibility';
import { isTalking, voiceKey } from './voice';

/** Keep in sync with voice/kailia-lines.json (the recording list). */
export const KAILIA_CHEERS = [
  'Yay!', 'I did it!', 'Wheee!', 'Woohoo!', 'Hooray!', 'We did it!',
  'Yippee!', 'So fun!', 'Look at me!', 'I can do it!', 'Ta-da!', 'Again, again!',
];

// line -> clip path under public/. Her new voice (scripts/generate_voices.py,
// public/audio/manifest.json, keyed by voiceKey) wins over the older
// recordings in public/voice/kailia/ (keyed by the line itself).
let clips: Record<string, string> | null = null;
if (typeof window !== 'undefined') {
  const get = (url: string) => fetch(url).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  Promise.all([get('/voice/kailia/manifest.json'), get('/audio/manifest.json')])
    .then(([old, made]: [Record<string, string>, { kailia?: Record<string, string> }]) => {
      const next: Record<string, string> = {};
      for (const [line, file] of Object.entries(old ?? {})) next[line] = `/voice/kailia/${file}`;
      const mine = made?.kailia ?? {};
      for (const line of KAILIA_CHEERS) if (mine[voiceKey(line)]) next[line] = `/audio/${mine[voiceKey(line)]}`;
      clips = next;
    });
}

let player: HTMLAudioElement | null = null;
let lastAt = 0;
let lastLine = '';

/** Kailia cheers, sometimes: at most every 6 s, and only about half the time, so it stays special. */
export function kailiaCheer() {
  if (typeof window === 'undefined' || !clips || !soundEnabled() || isTalking()) return;
  if (!narrationOn()) return;
  const now = performance.now();
  if (now - lastAt < 6000 || Math.random() < 0.45) return;
  const ready = KAILIA_CHEERS.filter(l => clips![l] && l !== lastLine);
  if (!ready.length) return;
  const line = ready[Math.floor(Math.random() * ready.length)];
  lastAt = now; lastLine = line;
  try {
    player = player ?? new Audio();
    player.src = clips[line];
    player.volume = 0.8 * masterVolume();
    void player.play().catch(() => { /* sound is a bonus */ });
  } catch { /* sound is a bonus */ }
}
