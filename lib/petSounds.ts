// ── Each pet friend's own little call ──
// Sage hoots, Flick yips, Kiko chirps, Shelly bloops, Ember puffs and
// squeaks, Nova whinnies with sparkles. The sounds are made in code by
// scripts/pet-sounds.py (no recordings, nothing to license) and live in
// public/sounds/pets/. A pet calls when it's tapped, and games can call
// petCall() when the pet cheers. Quiet when sound is turned down.

import { soundEnabled, effectsVolume, A11Y_EVENT } from './accessibility';
import { COMPANIONS } from './rewards';

const KINDS = ['owl', 'fox', 'parrot', 'turtle', 'dragon', 'unicorn'] as const;
type Kind = (typeof KINDS)[number];

function kindOf(pet: string): Kind | null {
  const p = pet.toLowerCase();
  if ((KINDS as readonly string[]).includes(p)) return p as Kind;
  const c = COMPANIONS.find(x => x.name.toLowerCase() === p || x.art === pet || pet.endsWith(x.art.split('/').pop() ?? '\u0000'));
  return c && (KINDS as readonly string[]).includes(c.kind) ? (c.kind as Kind) : null;
}

const players = new Map<Kind, HTMLAudioElement>();
let lastAt = 0;

function player(kind: Kind) {
  let a = players.get(kind);
  if (!a) { a = new Audio(`/sounds/pets/${kind}.mp3`); a.preload = 'auto'; players.set(kind, a); }
  return a;
}

/** Load a pet's call ahead of time (when the pet appears on screen), so the
 *  first tap answers at once instead of waiting for the download
 *  (Kelvin 2026-11-26: the pets' voices felt laggy). */
export function preloadPetCall(pet: string) {
  if (typeof window === 'undefined') return;
  const kind = kindOf(pet);
  if (kind) try { player(kind).load(); } catch { /* sound is a bonus */ }
}
let lastCheerAt = 0;

// "Sound off" (or the sound button) stops a call that is already playing.
if (typeof window !== 'undefined') {
  window.addEventListener(A11Y_EVENT, () => {
    if (!soundEnabled()) players.forEach(a => { try { a.pause(); } catch { /* ignore */ } });
  });
}

/**
 * Play a pet's call. `pet` may be its kind ("owl"), name ("Sage") or picture path.
 * `cheer: true` is for automatic calls (the pet cheering in a game): those
 * come at most every 5 seconds, so a run of good answers isn't a chorus.
 */
export function petCall(pet: string, { volume = 0.55, cheer = false } = {}) {
  if (typeof window === 'undefined' || !soundEnabled()) return;
  const kind = kindOf(pet);
  if (!kind) return;
  const now = performance.now();
  if (now - lastAt < 700) return; // a flurry of taps makes one call, not a pile-up
  if (cheer && now - lastCheerAt < 5000) return;
  lastAt = now;
  if (cheer) lastCheerAt = now;
  try {
    const a = player(kind);
    a.volume = Math.min(1, volume * effectsVolume());
    a.currentTime = 0;
    void a.play().catch(() => { /* sound is a bonus */ });
  } catch { /* sound is a bonus */ }
}
