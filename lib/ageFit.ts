// ── Age fit: does each game's level match the child's age? ──
// Kelvin (2026-11-25): "Having it tested for each age group if games will
// match or some will be too easy or difficult for that age group."
//
// Every game here has a `demand(level, tier)`: the age (in months) by which
// most children can do the hardest thing that level asks, read off its real
// level curve (lib/gameCurves.ts, lib/dragonBridgePlan.ts) and the same
// developmental norms as lib/milestones.ts (CDC 2022, Common Core grade
// standards, OT norms, memory-span norms). From that:
//   • fitStartLevel() — where a NEW player starts: the first level that asks
//     a little under their working age, so the first levels are easy wins
//     and the free five levels climb to "just right". (Every game used to
//     start everyone on level 1, so a 9-year-old met 3-year-old riddles.)
//   • judge() — too easy / just right / too hard, used by the check
//     (scripts/age-fit.test.mjs) that prints the age-by-game table.
// "Working age" = the check-up's estimate for that game's skill (falls back
// to the overall estimate, then real age), so a child strong in math but
// newer to reading starts high in Dragon Bridge and gently in Word Wizard.
//
// These ages are a first, careful mapping: review with a clinician before
// launch, along with lib/milestones.ts. Never shown to children.

import type { DifficultyTier } from './difficulty';
import type { MilestoneDomain } from './milestones';
import {
  cargoPlan, challengeSizes, echoSeqLen, mazeCorridor, moonPairs, skyMathKind, snackBiggestWish,
  SNACK_MORE_FROM_MONTHS, type SkyMath,
} from './gameCurves';
import { famPool, shareTwist, shareWindow } from './dragonBridgePlan';

/** Same cut-offs as difficultyTier() in lib/difficulty.ts. */
export function tierForMonths(m: number): DifficultyTier {
  return m < 30 ? 'tiny' : m < 57 ? 'small' : 'big';
}

// ── Norms: the age (months) by which most children can… ──
const interp = (table: [number, number][], x: number) => {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    if (x <= x1) { const [x0, y0] = table[i - 1]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  }
  return table[table.length - 1][1];
};
/** …repeat a sequence of n lights/tones in order (Corsi/Simon span norms). */
export const spanAge = (n: number) => interp([[2, 36], [3, 48], [4, 66], [5, 90], [6, 114], [7, 144]], n);
/** …remember where n pairs are in a memory-match game. */
export const pairsAge = (n: number) => interp([[2, 30], [3, 36], [4, 42], [6, 54], [8, 66], [10, 84], [12, 108]], n);
/** …count a group of n objects (CDC "gives just one" 33 mo, counts 5 at 4½, 10 at 5, 20 at 6). */
export const countAge = (n: number) => interp([[1, 24], [2, 30], [3, 36], [4, 48], [5, 54], [10, 60], [20, 72], [30, 84], [50, 96]], n);
/** …spot which one of n friends slipped away. */
export const castAge = (n: number) => interp([[3, 36], [4, 48], [5, 60], [6, 72], [7, 90]], n);
/** …tell "how many MORE" up to a total of n (missing addend: within 5 at 6, within 20 at 7). */
export const moreAge = (n: number) => interp([[5, 72], [10, 78], [20, 84]], n);

/** The 30-level map's own age bands (lib/levels.ts CHAPTERS), level by level. */
const CHAPTER_AGES: [number, number][] = [[30, 48], [48, 60], [60, 72], [72, 96], [96, 120], [120, 144]];
export function ladderAge(level: number): number {
  const L = Math.max(1, level);
  const c = Math.floor((L - 1) / 5);
  if (c >= CHAPTER_AGES.length) return 144 + (L - 30); // Star levels: past the ladder
  const [lo, hi] = CHAPTER_AGES[c];
  return lo + (hi - lo) * (((L - 1) % 5) / 5);
}
// speed-and-size games soften their targets for younger tiers
const TIER_EASE: Record<DifficultyTier, number> = { tiny: 0.75, small: 0.88, big: 1 };

// Fair sharing by dealing out: 2 friends at 4, 3–4 friends at 5, bigger piles
// at 5½, noticing the leftover ones at 6, a head start (some already given) at 7.
// Dragon Bridge's pattern kinds: AB at 3, AAB at 4, ABC/AABB at 4½,
// counting-on number patterns at 5, skip counting by 2 at 6½, by 5 and 10 at 7.
const PATTERN_AGE: Record<string, number> = {
  AB: 36, AAB: 48, ABB: 48, shapeAB: 48, ABC: 54, AABB: 54, ABAC: 60, ABCD: 60, mixABC: 66,
  up1: 60, down1: 72, up2: 78, up5: 84, up10: 84, up3: 96,
};

const SKY_MATH_AGE: Record<SkyMath, number> = { count3: 36, count5: 54, addPics: 66, add10: 72, addSub10: 78, addSub20: 84, times: 108, timesDiv: 120 };

// Word Wizard's word banks, one per chapter (app/play/reading/page.tsx):
// picture → word means telling words apart by their letters (about 5½);
// first letters and rhymes (about 5); blending and sight words (6);
// sentence meaning (7); vocabulary and ideas (9). Children reading below
// about 5 get the "find the picture" bank instead: "Find the cat!" (about
// 2½) on a chapter's first two levels, then riddles like "Who says moo?"
// (about 3½), each picture with its word printed under it.
export const WORD_PRE_READER_BELOW_MONTHS = 60;
const WORD_BANK_AGE = [66, 60, 72, 84, 108];

export interface FitGame {
  id: string;            // the id the game saves its level under
  title: string;
  /** which check-up area sets this game's working age (null = the overall estimate) */
  area: MilestoneDomain | null;
  /** skill in plain words, for the report */
  skill: string;
  /** false: no levels (Sky Mail's mailbags follow the age directly) */
  leveled: boolean;
  /** true: a speed/size game judged by the level map's own ages (an estimate) */
  paced?: boolean;
  /** youngest working age the game is built for (months); younger children
   *  can still play it with a grown-up, it just isn't their game yet */
  fromMonths?: number;
  /** true: level 1 is already set by the child's age band (lib/ageBands.ts),
   *  so every child starts on level 1 and climbs from their band's start.
   *  A number: the same, for children younger than that many months. */
  bandStart?: boolean | number;
  demand: (level: number, tier: DifficultyTier, months: number) => number;
}

const paced = (level: number, tier: DifficultyTier) => ladderAge(level) * TIER_EASE[tier];

export const FIT_GAMES: FitGame[] = [
  // Firefly Forest — hands
  // under 7 the band widens the path, so little ones start on level 1 (wide) and climb
  { id: 'fine-motor', title: 'Maze Runner', area: 'writing', skill: 'steady tracing inside a path', leveled: true, bandStart: 84,
    demand: (L, t, m) => interp([[13, 120], [16, 96], [19, 78], [22, 66], [25, 54], [28, 44], [30, 38], [33, 33], [38, 30], [44, 26], [56, 22]], mazeCorridor(L, t, m)) },
  { id: 'firefly-catch', title: 'Firefly Catch', area: 'writing', skill: 'tapping moving targets', leveled: true, paced: true, demand: paced },
  { id: 'firefly-trails', title: 'Firefly Trails', area: 'writing', skill: 'tracing, then drawing from memory', leveled: true, paced: true, demand: paced },
  // Dragon's Cave — math
  { id: 'snack-quest', title: 'Snack Quest', area: 'math', skill: 'counting, then "how many more?"', leveled: true,
    demand: (L, t, m) => {
      const n = snackBiggestWish(L, t, m);
      return Math.max(countAge(n), m >= SNACK_MORE_FROM_MONTHS && t === 'big' ? moreAge(n) : 0);
    } },
  { id: 'dragon-bridge', title: 'Dragon Bridge', area: 'math', skill: 'fair sharing and patterns', leveled: true, fromMonths: 48,
    demand: (L, t) => {
      const pat = Math.max(...famPool(L).map(f => PATTERN_AGE[f] ?? 60));
      const w = shareWindow(L, t);
      const twist = shareTwist(L, 1, t);
      const share = Math.max(w.bHi >= 3 ? 60 : 48, w.tHi > 10 ? 66 : 54, twist === 'leftover' ? 72 : twist === 'plain' ? 0 : 84);
      return Math.max(pat, share);
    } },
  // Whispering Signposts — reading
  { id: 'word-wizard', title: 'Word Wizard', area: 'reading', skill: 'reading words and sentences', leveled: true,
    demand: (L, _t, m) => {
      const bank = Math.min(WORD_BANK_AGE.length - 1, Math.floor((Math.max(1, L) - 1) / 5));
      if (bank === 0 && m < WORD_PRE_READER_BELOW_MONTHS) return (Math.max(1, L) - 1) % 5 <= 1 ? 30 : 42;
      return WORD_BANK_AGE[bank];
    } },
  { id: 'journey', title: "Kailia's Journey", area: 'reading', skill: 'picture words, counting, remembering', leveled: true,
    demand: (L, t, m) => { const s = challengeSizes(t, L, m); return Math.max(countAge(s.countMax), castAge(s.castSize)); } },
  { id: 'trail-walk', title: "Kailia's Trail", area: 'reading', skill: 'picture words, counting, remembering', leveled: true,
    demand: (L, t, m) => { const s = challengeSizes(t, L, m); return Math.max(countAge(s.countMax), castAge(s.castSize)); } },
  // Story Keepers — talking and stories
  { id: 'story-sparks', title: 'Story Sparks', area: 'communication', skill: 'what happens next in a story', leveled: true, fromMonths: 36,
    // picking the sensible next picture over a silly one (about 3½); there
    // is no harder version yet, so it tops out early
    demand: () => 42 },
  // Echo Caves — senses
  { id: 'sense-explorer', title: 'Sense Explorer', area: null, skill: 'spotting the one that is different', leveled: true, paced: true, demand: paced },
  { id: 'echo-song', title: 'Echo Song', area: 'processing', skill: 'remembering a song of notes', leveled: true,
    demand: (L, t) => spanAge(echoSeqLen(L, t)) },
  // Owl's Tower — thinking
  { id: 'hidden-friends', title: "Where's Noel?", area: 'processing', skill: 'searching a busy picture', leveled: true, paced: true, demand: paced },
  { id: 'moonlight-match', title: 'Moonlight Match', area: 'processing', skill: 'remembering pairs', leveled: true, bandStart: true,
    demand: (L, t, m) => pairsAge(moonPairs(L, t, m)) },
  { id: 'potion-sort', title: 'Potion Sort', area: 'processing', skill: 'quick sorting by color', leveled: true, paced: true, demand: paced },
  { id: 'sky-mail', title: 'Sky Mail (math bag)', area: 'math', skill: 'counting and sums', leveled: false,
    demand: (_L, _t, m) => SKY_MATH_AGE[skyMathKind(m)] },
  // Bonus realms
  { id: 'cargo-count', title: 'Cargo Count', area: 'math', skill: 'counting on, then counting by 2s, 5s, 10s', leveled: true, fromMonths: 48,
    demand: (L, t) => {
      const p = cargoPlan(L, t);
      const top = Math.max(...p.values);
      return Math.max(countAge(p.hi), top >= 5 ? (p.hi > 20 ? 96 : 84) : top === 2 ? 78 : 0);
    } },
  { id: 'reef-explorer', title: 'Reef Explorer', area: null, skill: 'finding the look-alike', leveled: true, paced: true, demand: paced },
];

export const fitGame = (id: string) => FIT_GAMES.find(g => g.id === id);

/** How far under/over age still counts as "just right" (wider for older children). */
export const easyGap = (age: number) => Math.max(9, age * 0.2);
export const hardGap = (age: number) => Math.max(6, age * 0.1);

export type FitVerdict = 'easy' | 'good' | 'hard';
export function judge(demand: number, age: number): FitVerdict {
  if (demand < age - easyGap(age)) return 'easy';
  if (demand > age + hardGap(age)) return 'hard';
  return 'good';
}

/**
 * Where a new player starts: the first level asking a little under their
 * working age (a warm first win), searched over the 30-level ladder, never
 * one that is too hard. If no level asks that much, the game's top (the
 * level asking the most); the check lists those games as "outgrown".
 */
export function fitStartLevel(id: string, months: number | null | undefined): number {
  const g = fitGame(id);
  if (!g || !g.leveled || months == null) return 1;
  if (g.bandStart === true || (typeof g.bandStart === 'number' && months < g.bandStart)) return 1;
  const tier = tierForMonths(months);
  const target = months - Math.max(6, months * 0.1);
  let best = 1, bestD = -Infinity;
  for (let L = 1; L <= 30; L++) {
    const d = g.demand(L, tier, months);
    if (judge(d, months) === 'hard') continue;
    if (d >= target) return L;
    if (d > bestD + 0.5) { best = L; bestD = d; }
  }
  return best;
}

// ── The free part (Kelvin, 2026-11-25) ──
// Free = the first five levels AT THE CHILD'S OWN LEVEL, not levels 1–5:
// an 8-year-old who starts on level 21 plays 21–25 free (and every easier
// level below their start), then Plus. Use this when the level paywall is
// switched on (lib/premium.ts PAYWALL_ENABLED).
export const FREE_LEVELS = 5;
export function isFreeLevel(level: number, startLevel: number): boolean {
  return level < Math.max(1, startLevel) + FREE_LEVELS;
}
