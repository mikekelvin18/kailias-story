// ── Game difficulty curves, in one place ──
// The numbers each game grows level by level (how long a song is, how many
// pairs, how wide a maze path, which cargo boxes…). They live here, not in
// the game pages, so lib/ageFit.ts can check every level against real
// developmental ages (scripts/age-fit.test.mjs) and the games and the
// check can never drift apart. Keep this file free of app imports so the
// check runs in plain Node.

import type { DifficultyTier } from './difficulty';
import { BAND_SETTINGS, bandForMonths, type AgeBand } from './ageBands';

// ── Echo Song: how many notes the crystals sing ──
// Remembering a sequence of lights + tones (like the Corsi / Simon tasks):
// most 4-year-olds hold about 3, 6-year-olds 4, 8-year-olds 5, 10–12-year-olds
// 6, adults about 7. The song grows a note each chapter (it grew a
// note EVERY early level before, which asked a 5-year-old for 6 notes by
// level 4 — adult-hard; age-fit check 2026-11-25), capped near what the
// child's stage can hold.
export function echoSeqLen(level: number, tier: DifficultyTier): number {
  const base = tier === 'big' ? 3 : 2;
  const cap = tier === 'tiny' ? 4 : tier === 'small' ? 5 : 7;
  // one more note each chapter (every 5 levels); inside a chapter the
  // crystals sing faster and the tunes change
  return Math.min(cap, base + Math.floor((Math.max(1, level) - 1) / 5));
}

// ── Moonlight Match: how many pairs under the feathers ──
// Memory-match: 2–3 year olds manage 2–3 pairs, 4-year-olds about 4–6,
// 5–6 year olds 8, older children 10–12+. One more pair every three levels
// (it was one more EVERY level, so level 5 already asked a 3-year-old for 7).
// Age bands (Grok's review 2026-11-25): level 1 starts at the band's own
// gentle number of pairs (under 3: 2, 3–4: 3, 5–6: 4, 7–8: 6, 9–12: 8).
// Kelvin (2026-11-25): "start with the first game easy, then make it a little
// challenging after", so level 2 jumps halfway and level 3 reaches what most
// children that age can do (6-year-old: 4 → 6 → 8 pairs), then it keeps growing.
const MOON_BAND_CAP: Record<AgeBand, number> = { together: 4, little: 6, early: 10, big: 12, older: 12 };
// pairs most children can hold, by age in months (same norms as lib/ageFit.ts pairsAge)
const PAIRS_BY_AGE: [number, number][] = [[30, 2], [36, 3], [42, 4], [54, 6], [66, 8], [84, 10], [108, 12]];
export function agePairs(months: number): number {
  const m = months - Math.max(6, months * 0.1);   // a touch under the age: a little challenging, not hard
  let n = PAIRS_BY_AGE[0][1];
  for (const [age, pairs] of PAIRS_BY_AGE) if (m >= age) n = pairs;
  return n;
}
/** Kelvin's ramp: an easy first level, halfway on the second, the child's own level from the third. */
export function rampTo(level: number, start: number, target: number): number {
  if (level <= 1) return start;
  if (level === 2) return Math.round((start + target) / 2);
  return target;
}
export function moonPairs(level: number, tier: DifficultyTier, months?: number | null): number {
  const L = Math.max(1, level);
  if (months != null) {
    const band = bandForMonths(months);
    const base = BAND_SETTINGS[band].memoryPairs;
    const target = agePairs(months);
    // after the ramp it keeps growing a pair every 3 levels from the child's own level
    const grown = Math.max(base + Math.floor((L - 1) / 3), L >= 3 ? target + Math.floor((L - 3) / 3) : 0);
    return Math.min(MOON_BAND_CAP[band], Math.max(grown, rampTo(L, base, target)));
  }
  const base = tier === 'tiny' ? 2 : tier === 'small' ? 3 : 4;
  const cap = tier === 'tiny' ? 4 : tier === 'small' ? 8 : 12;
  return Math.min(cap, base + Math.floor((L - 1) / 3));
}

// ── Maze Runner: how far from the path a finger may wander ──
// Every lap of the five mazes narrows the path a little. The littlest hands
// get a wider path (it was the same for a 2-year-old and a 12-year-old).
// Under 7 the age band (lib/ageBands.ts) widens the path by its tolerance
// over the big kids' 28 (under 3: +28, 3–4: +16, 5–6: +6, in maze units),
// and it still narrows a little each lap, so the levels keep growing.
export function mazeCorridor(level: number, tier: DifficultyTier = 'big', months?: number | null): number {
  const lap = Math.floor((Math.max(1, level) - 1) / 5);
  const widen = tier === 'tiny' ? 8 : tier === 'small' ? 4 : 0;
  const curve = Math.max(13, 28 - lap * 3) + widen;
  if (months == null) return curve;
  // the extra band width is all there on level 1 (an easy first game), half on
  // level 2, and gone from level 3 (Kelvin 2026-11-25: easy first, then a little challenging)
  const bandWiden = Math.max(0, BAND_SETTINGS[bandForMonths(months)].pathTolerance - BAND_SETTINGS.big.pathTolerance);
  const extra = Math.max(widen, rampTo(level, bandWiden, widen));
  return Math.max(13, 28 - lap * 3) + extra;
}

// ── Cargo Count: which boxes float, how big the orders are ──
export interface CargoPlan { values: number[]; lo: number; hi: number; speed: number; size: number }
export function cargoPlan(level: number, tier: DifficultyTier): CargoPlan {
  const L = Math.max(1, level);
  // ones for two chapters, then 2-boxes (counting on by twos, about 6½),
  // 5-boxes (about 7), 10-boxes (about 8) — one new box a chapter
  let values = L <= 10 ? [1] : L <= 15 ? [1, 2] : L <= 20 ? [1, 2, 5] : [1, 2, 5, 10];
  let lo: number, hi: number;
  if (L <= 5) { lo = Math.max(2, L); hi = L + 2; }   // level 1 asks 2–3 (was up to 4)
  else if (L <= 10) { lo = L - 1; hi = L + 2; }
  else if (L <= 15) { lo = L - 2; hi = L + 3; }
  else { lo = L - 4; hi = L + 4; }
  hi = Math.min(50, hi); lo = Math.min(lo, hi - 1);
  let speed = Math.min(10, 2.4 + L * 0.3);
  if (tier === 'tiny') { values = values.filter(v => v <= 2); hi = Math.min(hi, 6 + Math.floor(L / 6)); lo = Math.min(lo, 3 + Math.floor(L / 8)); speed *= 0.5; }
  // preschoolers count ones (a "2" box means counting on by twos, about 6½)
  else if (tier === 'small') { values = values.filter(v => v <= 2); hi = Math.min(hi, L <= 10 ? 10 : 20); lo = Math.min(lo, hi - 2); speed *= 0.8; }
  const size = Math.max(54, 74 - L * 0.7);
  return { values, lo, hi, speed, size };
}

// ── Reef Explorer: how many fish, how fast, how dark ──
export interface ReefPlan { fish: number; speed: number; light: number; dark: number; band: number; size: number }
export function reefPlan(level: number, tier: DifficultyTier): ReefPlan {
  const L = Math.max(1, level);
  const band = L <= 5 ? 0 : L <= 10 ? 1 : L <= 15 ? 2 : 3;
  const plan: ReefPlan = {
    // Muse round 7: level 1 was too hard for a 6-year-old (small, dim, quick
    // fish; 0 of 5 found). The first levels now start slower, bigger, brighter
    // and with a wider light, and reach the old pace by about level 8.
    fish: Math.min(9, 4 + Math.floor((L - 1) / 2)),
    speed: Math.min(9, 1.2 + L * 0.42),
    light: Math.max(14, 31 - L * 0.75),
    dark: Math.min(0.93, 0.56 + L * 0.03),
    band,
    size: Math.max(52, 90 - L * 2.4),
  };
  if (tier === 'tiny') { plan.fish = Math.min(plan.fish, 4); plan.speed *= 0.5; plan.light += 8; plan.dark = Math.min(plan.dark, 0.62); plan.band = Math.min(band, 1); }
  else if (tier === 'small') { plan.fish = Math.min(plan.fish, 6); plan.speed *= 0.8; plan.light += 4; plan.dark = Math.min(plan.dark, 0.82); plan.band = Math.min(band, 2); }
  return plan;
}

// ── Snack Quest: the baby dragon's three wishes ──
// w = how many snacks she wishes for, h = how many she already has
// ("how many MORE?" rounds, only from about 6 years: taking away in disguise).
export const SNACK_PLANS: Record<DifficultyTier, { w: number[]; h: number[] }> = {
  tiny:  { w: [1, 2, 3], h: [0, 1, 1] },
  small: { w: [2, 3, 3], h: [0, 1, 2] },   // 3-year-olds count to about 3 (was 3, 4, 5)
  big:   { w: [4, 7, 9], h: [0, 3, 4] },
};
export const snackCap = (tier: DifficultyTier) => (tier === 'tiny' ? 5 : tier === 'small' ? 9 : 12); // the field's free spots
// Age bands (lib/ageBands.ts, Grok's review 2026-11-25): under 5 count to a
// wish of 1–5 ("I wish for 3 cookies"); 5–6 count to 10 and meet "Bring me
// 2 more!"; only 7+ get "I already have 4, how many MORE?".
export const SNACK_MORE_FROM_MONTHS = 84;
export const SNACK_TWO_MORE_FROM_MONTHS = 60;
export type SnackMode = 'count' | 'twoMore' | 'howManyMore';
export function snackMode(months: number): SnackMode {
  return months >= SNACK_MORE_FROM_MONTHS ? 'howManyMore' : months >= SNACK_TWO_MORE_FROM_MONTHS ? 'twoMore' : 'count';
}
/** The biggest wish for an age: 2 under 3, 5 at 3–4, 10 at 5–6, then the tier's own cap. */
export function snackAgeCap(months: number, tier: DifficultyTier): number {
  const byAge = months < 36 ? 2 : months < 60 ? 5 : months < 84 ? 10 : Infinity;
  return Math.min(snackCap(tier), byAge);
}
/** Within one feast a wish grows by at most this much over the last one (no 3 → 8 jumps). */
export const SNACK_MAX_STEP = 2;
/** How much the wishes have grown by a level: school-age wishes grow every
 *  two levels, little ones' once a chapter (3-year-olds count to about 3). */
export const snackGrowth = (level: number, tier: DifficultyTier) =>
  Math.floor((Math.max(1, level) - 1) / (tier === 'big' ? 2 : 5));
/** The little surprise up or down on each wish (little ones only get smaller surprises). */
export const snackWobble = (tier: DifficultyTier): [number, number] => (tier === 'big' ? [-1, 1] : [-1, 0]);
/** The biggest wish a level can make (base + growth + surprise + the "not the
 *  same as last level" nudge, which only nudges up for school-age children). */
export function snackBiggestWish(level: number, tier: DifficultyTier, months?: number): number {
  const { w } = SNACK_PLANS[tier];
  const cap = months != null ? snackAgeCap(months, tier) : snackCap(tier);
  return Math.min(cap, w[w.length - 1] + snackGrowth(level, tier) + snackWobble(tier)[1] + (tier === 'big' ? 1 : 0));
}

// ── Sky Mail: the math mailbag, by age in months ──
// Sky Mail has mailbags, not levels, so its sums follow the child's working
// age directly (they used to follow the three tiers, which gave 3-year-olds
// written sums and 5-year-olds times tables).
export type SkyMath = 'count3' | 'count5' | 'addPics' | 'add10' | 'addSub10' | 'addSub20' | 'times' | 'timesDiv';
export function skyMathKind(months: number): SkyMath {
  if (months < 42) return 'count3';     // "give me one / two / three" (about 3 yrs)
  if (months < 60) return 'count5';     // counts 5 objects (about 4½)
  if (months < 72) return 'addPics';    // 2 + 3 with pictures (about 5½)
  if (months < 78) return 'add10';      // written sums within 10 (about 6)
  if (months < 90) return 'addSub10';   // add and take away within 10 (about 6½–7)
  if (months < 102) return 'addSub20';  // within 20 (about 7–8)
  if (months < 126) return 'times';     // times tables (about 8½–10)
  return 'timesDiv';                    // bigger times and sharing out (about 10+)
}
/** Words appear on Sky Mail cards (silly sentences, rhymes) only for children who can listen to/read them. */
export const SKY_SENTENCE_FROM_MONTHS = 48;

// ── Wild-creature riddles (Kailia's Journey and Trail) ──
// `months` (the child's working age) lets 3-year-olds count small groups:
// most count 3 things at 3, 5 at 4½, 10 at 5 (it asked up to 6 before).
export function challengeSizes(tier: string, level: number, months?: number | null) {
  const grow = Math.max(0, Math.floor((level - 1) / 4));
  const little = tier === 'tiny' || (tier === 'small' && months != null && months < 42);
  const countBase = little ? 3 : tier === 'small' ? 5 : 9;
  return {
    // the littlest counters grow half as fast
    countMax: Math.min(tier === 'tiny' ? 5 : tier === 'small' ? 10 : 20, countBase + (little ? Math.floor(grow / 2) : grow)),
    castSize: Math.min(tier === 'tiny' ? 3 : tier === 'small' ? 5 : 7, (tier === 'big' ? 4 : 3) + Math.floor(grow / 2)),
  };
}

// ── Friends' games: the difficulty dial (1–10) a level turns to ──
export function friendDifficulty(tier: DifficultyTier, level: number): number {
  const base = tier === 'tiny' ? 1 : tier === 'small' ? 2 : 3;
  return Math.min(8, base + Math.floor((Math.max(1, level) - 1) / 2));
}
