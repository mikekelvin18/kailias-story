// ── Level variety: a fair story deck for every game ──
// Kelvin (2026-11-23): "every round should have variation and a different
// story" — first the baby dragons want berries, next they want to play with
// toys, next they're hungry for apples. Levels must never feel the same.
//
// The rule every game follows:
//  • Each round draws its little story from the game's own deck.
//  • A deck is dealt like cards: every story is used once before any
//    story comes back (a fresh, fairly shuffled lap after that), and the
//    last story of one lap is never the first of the next, so a story
//    never shows up twice in a row, not even across two levels.
//  • It is repeatable: level 7 always tells level 7's stories, so a
//    replay matches what the level map promised, and robot checks can
//    rely on it.
//
// The numbers (how many, how fast, which pattern) come from the game's own
// level curve; the deck only chooses WHICH story wraps them.

import { levelRandom } from './levels';

/** Small stable hash of a game id, so each game gets its own deal. */
function salt(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 100000;
}

/** A Fisher–Yates shuffle driven by a repeatable random source. */
export function seededShuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const lapCache = new Map<string, number[]>();

/** The deck's order on one lap (a list of indexes), never starting with
 *  the index the previous lap ended on. */
function lapOrder(n: number, id: string, lap: number): number[] {
  const key = `${id}|${n}|${lap}`;
  const hit = lapCache.get(key);
  if (hit) return hit;
  const order = seededShuffle(Array.from({ length: n }, (_, i) => i), levelRandom(lap + 1, salt(id)));
  if (lap > 0 && n > 1) {
    // the first few of this lap never repeat the last few of the previous
    // one, so nothing comes back within a level or the next one
    const k = Math.min(3, Math.floor(n / 2));
    const tail = new Set(lapOrder(n, id, lap - 1).slice(n - k));
    const head = order.slice(0, k + k).filter(x => !tail.has(x)).slice(0, k);
    const rest = order.filter(x => !head.includes(x));
    order.splice(0, n, ...head, ...rest);
  }
  lapCache.set(key, order);
  return order;
}

/**
 * The i-th card dealt from a deck of `n` stories (0-based, counted across
 * the whole game: level after level, round after round).
 */
export function dealIndex(n: number, id: string, i: number): number {
  if (n <= 1) return 0;
  const lap = Math.floor(i / n);
  return lapOrder(n, id, lap)[i % n];
}

/**
 * The stories for one level: `perLevel` cards dealt in a row, starting
 * where the previous level stopped. `fixedFirst` (optional) pins level 1's
 * opening stories, e.g. so the very first rounds introduce the game gently.
 */
export function levelStories<T>(deck: readonly T[], id: string, level: number, perLevel: number): T[] {
  const L = Math.max(1, level);
  return Array.from({ length: perLevel }, (_, k) => deck[dealIndex(deck.length, id, (L - 1) * perLevel + k)]);
}

/** One story per level (games with one round per level). */
export function levelStory<T>(deck: readonly T[], id: string, level: number): T {
  return levelStories(deck, id, level, 1)[0];
}

/** A repeatable random source for one round of one level of one game. */
export function roundRandom(id: string, level: number, round = 0): () => number {
  return levelRandom(Math.max(1, level) * 31 + round, salt(id));
}

/** A whole number from lo to hi (inclusive) from a random source. */
export function randInt(rand: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

/** Pick one item from a list with a random source. */
export function randPick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

/**
 * The scene's look for a level: games tint their BACKGROUND layer only
 * (never the characters) so neighbouring levels look like different
 * places or times of day. Five looks, dealt like the stories.
 */
export const SCENE_LOOKS = [
  { name: 'evening', filter: 'none' },
  { name: 'sapphire', filter: 'hue-rotate(-40deg) saturate(1.1)' },
  { name: 'emerald', filter: 'hue-rotate(-110deg) saturate(0.95) brightness(1.05)' },
  { name: 'sunset', filter: 'hue-rotate(40deg) saturate(1.15) brightness(1.05)' },
  { name: 'moonlit', filter: 'hue-rotate(-20deg) saturate(0.7) brightness(0.92)' },
] as const;

export function sceneLook(id: string, level: number) {
  return levelStory(SCENE_LOOKS, `${id}:look`, level);
}
