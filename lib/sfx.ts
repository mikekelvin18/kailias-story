// One shared Web Audio context for every game's little sound effects.
//
// Each game used to open a brand-new AudioContext for every beep and never
// close it, so a few minutes of play left dozens of audio engines running
// (battery drain, crackles, and on iPhones/iPads the sounds simply stop
// once the browser's limit is hit). Every game now borrows this one.
// Background music (lib/music.ts) keeps its own context on purpose.

import { masterVolume, A11Y_EVENT } from './accessibility';

let shared: AudioContext | null = null;

export function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!shared || shared.state === 'closed') {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      shared = new Ctx();
    }
    // browsers start a context "suspended" until a tap; every sound is
    // played from a tap (or soon after one), so waking it here is enough
    if (shared.state === 'suspended') shared.resume().catch(() => {});
    return shared;
  } catch {
    return null;
  }
}

// ── Grown-ups' volume (Parent Zone) ──
// Every sound effect goes out through one gain per audio context, set from
// the volume slider (lib/accessibility.ts masterVolume) and kept in step
// when it moves.
const outs = new WeakMap<BaseAudioContext, GainNode>();
const live = new Set<GainNode>();
let listening = false;
export function sfxOut(ctx: BaseAudioContext): AudioNode {
  let g = outs.get(ctx);
  if (!g) {
    g = ctx.createGain();
    g.gain.value = masterVolume();
    g.connect(ctx.destination);
    outs.set(ctx, g); live.add(g);
    if (!listening && typeof window !== 'undefined') {
      listening = true;
      window.addEventListener(A11Y_EVENT, () => { const v = masterVolume(); live.forEach(n => { n.gain.value = v; }); });
    }
  }
  return g;
}

// ── iPhone silent switch ──
// iPhones mute all Web Audio (the music and these sound effects) while the
// ring/silent switch is on, unless the page is also playing a real audio
// element. So on iPhones/iPads, from the first tap, a silent clip loops in
// an audio element in the background: that tells the phone this page plays
// sound like a music app, and the music and effects play even on silent
// (Noel's recorded voice already did). Kelvin, 2026-11-21: "Every time I
// open the app it's not on. I still have to play with the switch."
// Newer iPhones also honour navigator.audioSession (components/SoundStart).

let keeper: HTMLAudioElement | null = null;

function isAppleTouch() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** One second of silence as a WAV file, made here (no download). */
function silentWav(): string {
  const rate = 8000, n = rate;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/** Call from inside a tap. Keeps the iPhone silent switch from muting music and effects. */
export function keepSoundOn() {
  if (typeof window === 'undefined' || !isAppleTouch()) return;
  try {
    if (!keeper) {
      keeper = new Audio(silentWav());
      keeper.loop = true;
      keeper.setAttribute('playsinline', '');
      keeper.setAttribute('x-webkit-airplay', 'deny');
    }
    if (keeper.paused && !document.hidden) void keeper.play().catch(() => {});
  } catch { /* ignore */ }
}

/** The app went to the background: let the phone rest. */
export function pauseSoundKeeper() {
  try { keeper?.pause(); } catch { /* ignore */ }
}
