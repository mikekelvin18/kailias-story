// ── Each pet friend's own little call ──
// Sage hoots, Flick yips, Kiko chirps, Shelly bloops, Ember puffs and
// squeaks, Nova whinnies with sparkles. The sounds are made in code by
// scripts/pet-sounds.py (no recordings, nothing to license) and live in
// public/sounds/pets/. A pet calls when it's tapped, and games can call
// petCall() when the pet cheers. Quiet when sound is turned down.

import { soundEnabled } from './accessibility';
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
let lastCheerAt = 0;

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
    let a = players.get(kind);
    if (!a) { a = new Audio(`/sounds/pets/${kind}.mp3`); players.set(kind, a); }
    a.volume = volume;
    a.currentTime = 0;
    void a.play().catch(() => { /* sound is a bonus */ });
  } catch { /* sound is a bonus */ }
}
