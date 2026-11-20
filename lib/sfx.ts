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
