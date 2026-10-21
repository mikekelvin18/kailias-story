// ── Starlight, levels & companions ──
// The points economy, framed as story rewards (never grades):
//   ✨ Starlight  — earned by finishing quests; the child "collects light"
//   Explorer level — grows with total starlight (gentle square-root curve)
//   Game levels   — each game remembers the highest level beaten
//   Companions    — creature friends that join Kailia at starlight
//                   milestones (the hook for future real-world rewards)
// Persistence is consent-gated like every other child-data store, and the
// key is registered in CHILD_DATA_KEYS so parental deletion wipes it.

export interface RewardsState {
  starlight: number;
  gameLevels: Record<string, number>; // gameId -> highest level beaten
  celebratedCompanions: string[];     // companion names already revealed,
                                       // so the reveal moment fires once
}

import { scopedKey } from './family';

const KEY = 'kailia_rewards_v1';
const empty: RewardsState = { starlight: 0, gameLevels: {}, celebratedCompanions: [] };

// `art` = Kelvin's painted picture of each pet (public/art/pets/); `emoji`
// stays only as a fallback and for plain-text spots. `skill` = the land
// domain this pet owns: each pet will get its own adventures for that
// skill (agreed with Kelvin 2026-10-21). Who each pet is (personality,
// colors) lives in the art kit doc. A 6th pet, Kiko the parrot
// (communication), joins once Kelvin's picture exists.
export const COMPANIONS: { at: number; emoji: string; name: string; art: string; kind: string; skill: string }[] = [
  { at: 30,  emoji: '🐢', name: 'Shelly', art: '/art/pets/shelly.webp', kind: 'turtle',  skill: 'sensory' },
  { at: 80,  emoji: '🦊', name: 'Flick',  art: '/art/pets/flick.webp',  kind: 'fox',     skill: 'fine motor' },
  { at: 150, emoji: '🦉', name: 'Sage',   art: '/art/pets/sage.webp',   kind: 'owl',     skill: 'processing' },
  { at: 250, emoji: '🦄', name: 'Nova',   art: '/art/pets/nova.webp',   kind: 'unicorn', skill: 'reading' },
  { at: 400, emoji: '🐉', name: 'Ember',  art: '/art/pets/ember.webp',  kind: 'dragon',  skill: 'math' },
];

function consented(): boolean {
  try { return !!JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null')?.consent; }
  catch { return false; }
}

export function loadRewards(): RewardsState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(scopedKey(KEY));
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch { return empty; }
}

function save(r: RewardsState) {
  if (!consented()) return; // COPPA: no consent → nothing recorded
  try { localStorage.setItem(scopedKey(KEY), JSON.stringify(r)); } catch { /* ignore */ }
}

export function awardStarlight(amount: number): RewardsState {
  const r = loadRewards();
  r.starlight += Math.max(0, Math.round(amount));
  save(r);
  return r;
}

// Remembers the highest level beaten per game; returns the updated state.
export function recordGameLevel(gameId: string, level: number): RewardsState {
  const r = loadRewards();
  r.gameLevels[gameId] = Math.max(r.gameLevels[gameId] ?? 0, level);
  save(r);
  return r;
}

export function nextGameLevel(gameId: string): number {
  return (loadRewards().gameLevels[gameId] ?? 0) + 1;
}

// Explorer level 1, 2, 3… — early levels come fast, later ones slower.
export function explorerLevel(starlight: number): number {
  return Math.floor(Math.sqrt(starlight / 15)) + 1;
}

export function unlockedCompanions(starlight: number) {
  return COMPANIONS.filter(c => starlight >= c.at);
}

// The one unlocked companion not yet shown as a celebration — a surprise
// reveal moment instead of a permanent always-visible row. Only ever
// returns one at a time even if several thresholds were crossed at once
// (e.g. a big starlight award), so reveals queue up one-by-one.
export function pendingCompanionReveal(r: RewardsState) {
  return COMPANIONS.find(c => r.starlight >= c.at && !r.celebratedCompanions.includes(c.name)) ?? null;
}

export function markCompanionCelebrated(name: string): RewardsState {
  const r = loadRewards();
  if (!r.celebratedCompanions.includes(name)) r.celebratedCompanions = [...r.celebratedCompanions, name];
  save(r);
  return r;
}
