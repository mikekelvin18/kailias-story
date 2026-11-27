// One shared Web Audio context for every game's little sound effects.
//
// Each game used to open a brand-new AudioContext for every beep and never
// close it, so a few minutes of play left dozens of audio engines running
// (battery drain, crackles, and on iPhones/iPads the sounds simply stop
// once the browser's limit is hit). Every game now borrows this one.
// Background music (lib/music.ts) keeps its own context on purpose.

import { effectsVolume, musicVolume, gentleSounds, A11Y_EVENT } from './accessibility';

let shared: AudioContext | null = null;

let sharedStale = true;
/** The app went to the background: the next tap builds a fresh sound engine. */
export function markAudioStale() { sharedStale = true; }

export function audioCtx(fromTap = false): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (shared && fromTap && (sharedStale || (shared.state !== 'running' && shared.state !== 'suspended'))) {
      // reopened iPhone app: the old engine can be stuck silent; start fresh inside this tap
      try { void shared.close().catch(() => {}); } catch { /* ignore */ }
      shared = null;
    }
    if (fromTap) sharedStale = false;
    if (!shared || shared.state === 'closed') {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      shared = new Ctx();
    }
    // browsers start a context "suspended" until a tap; every sound is
    // played from a tap (or soon after one), so waking it here is enough
    if (shared.state !== 'running') shared.resume().catch(() => {});
    return shared;
  } catch {
    return null;
  }
}

// ── Grown-ups' volume (Parent Zone) ──
// Every sound effect goes out through one chain per audio context, set from
// the grown-ups' "Sound effects" slider (lib/accessibility.ts effectsVolume)
// and kept in step when it moves. "Gentle sounds" rounds off the sharp top
// of every effect (a soft low-pass) and squeezes loud peaks (a compressor),
// so a fanfare or a bright chime never startles; effectsVolume() also plays
// them quieter. Background music has its own chain (musicOut) and slider.
interface Chain { input: GainNode; tone: BiquadFilterNode; squeeze: DynamicsCompressorNode; volume: () => number }
const outs = new WeakMap<BaseAudioContext, Chain>();
const musicOuts = new WeakMap<BaseAudioContext, Chain>();
const live = new Set<Chain>();
let listening = false;

function tune(c: Chain) {
  const gentle = gentleSounds();
  c.input.gain.value = c.volume();
  c.tone.frequency.value = gentle ? 1600 : 20000;
  c.squeeze.threshold.value = gentle ? -30 : 0;
  c.squeeze.ratio.value = gentle ? 8 : 1;
}

function chain(ctx: BaseAudioContext, volume: () => number): Chain {
  const input = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass'; tone.Q.value = 0.4;
  const squeeze = ctx.createDynamicsCompressor();
  squeeze.knee.value = 12; squeeze.attack.value = 0.003; squeeze.release.value = 0.2;
  input.connect(tone).connect(squeeze).connect(ctx.destination);
  const c = { input, tone, squeeze, volume };
  tune(c);
  live.add(c);
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    window.addEventListener(A11Y_EVENT, () => live.forEach(tune));
  }
  return c;
}

export function sfxOut(ctx: BaseAudioContext): AudioNode {
  let c = outs.get(ctx);
  if (!c) { c = chain(ctx, effectsVolume); outs.set(ctx, c); }
  return c.input;
}

/** Where the background music goes out (its own "Music" slider). */
export function musicOut(ctx: BaseAudioContext): AudioNode {
  let c = musicOuts.get(ctx);
  if (!c) { c = chain(ctx, musicVolume); musicOuts.set(ctx, c); }
  return c.input;
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
