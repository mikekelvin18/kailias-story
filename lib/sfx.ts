// One shared Web Audio context for every game's little sound effects.
//
// Each game used to open a brand-new AudioContext for every beep and never
// close it, so a few minutes of play left dozens of audio engines running
// (battery drain, crackles, and on iPhones/iPads the sounds simply stop
// once the browser's limit is hit). Every game now borrows this one.
// Background music (lib/music.ts) keeps its own context on purpose.

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
