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
}

const KEY = 'kailia_rewards_v1';
const empty: RewardsState = { starlight: 0, gameLevels: {} };

export const COMPANIONS: { at: number; emoji: string; name: string }[] = [
  { at: 30,  emoji: '🐢', name: 'Shelly' },
  { at: 80,  emoji: '🦊', name: 'Flick' },
  { at: 150, emoji: '🦉', name: 'Sage' },
  { at: 250, emoji: '🦄', name: 'Nova' },
  { at: 400, emoji: '🐉', name: 'Ember' },
];

function consented(): boolean {
  try { return !!JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null')?.consent; }
  catch { return false; }
}

export function loadRewards(): RewardsState {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch { return empty; }
}

function save(r: RewardsState) {
  if (!consented()) return; // COPPA: no consent → nothing recorded
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* ignore */ }
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
