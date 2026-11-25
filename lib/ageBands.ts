// ── Age bands: one place that says how each game behaves at each age ──
// Kelvin forwarded Grok's review (2026-11-25): "every game except Word
// Wizard is identical for a 2-year-old and a 9-year-old — build a central
// age-adaptation system and apply it to every game."
//
// Five bands. A game reads its band's settings here (tap size, speed, how
// many choices, how wide a path, reading, math, memory pairs…) and its own
// level curve in lib/gameCurves.ts; where it starts on the level map comes
// from lib/ageFit.ts. Change a number here and every game follows.
//
// The band comes from the child's WORKING age in that game's skill: the
// check-up's estimate for the skill, else the overall estimate, else the
// real age from the parent-entered birth month and year (hooks/useGameFit.ts).
// So a 6-year-old who is still growing in counting gets "little" math and
// "early" tracing. A grown-up can also nudge it in Family: Easier / Harder
// moves the child one year down or up (GAME_LEVEL_SHIFT_MONTHS).
//
// These are first, careful defaults for a clinician to review before launch,
// like lib/milestones.ts. Bands are never shown to children.
//
// Keep this file free of app imports so the Node checks can read it.

export type AgeBand = 'together' | 'little' | 'early' | 'big' | 'older';

export const AGE_BANDS: AgeBand[] = ['together', 'little', 'early', 'big', 'older'];

export type ReadingMode =
  | 'none'        // pictures and voice only, no words to read
  | 'cvc'         // simple three-letter words (cat, sun, map)
  | 'sentences'   // short sentences
  | 'longer';     // longer text, short paragraphs

export type MathMode =
  | 'find12'      // "find 1", "find 2"
  | 'count5'      // counting to 5
  | 'count10'     // counting to 10 and "bring 2 more"
  | 'addSub20'    // adding and taking away within 20
  | 'timesWords'; // times tables and word problems

export type TalkMode =
  | 'sounds'      // animal noises and sounds
  | 'words'       // single words
  | 'phrases'     // short phrases, "what happens next?"
  | 'retell';     // retell in their own words, name feelings

export interface BandSettings {
  band: AgeBand;
  /** Who it's for, in plain words, for grown-ups only. */
  label: string;
  ages: string;
  /** Youngest age in months (inclusive). */
  fromMonths: number;
  /** Smallest thing a child taps, in CSS pixels. */
  minTap: number;
  /** How fast things move, 1 = the game's normal speed. */
  speed: number;
  /** Most things to pick from on one screen. */
  maxChoices: number;
  /** How far a finger may drift off a tracing path or drag line, in pixels. */
  pathTolerance: number;
  /** For dragging games: a tap on the thing, then a tap on where it goes, moves it (no dragging needed). */
  tapToMove: boolean;
  /** Countdown timers: off, or the grown-up may switch them on. */
  timers: 'off' | 'optional';
  reading: ReadingMode;
  math: MathMode;
  /** The biggest number a counting round asks for. */
  countTo: number;
  /** Memory-match pairs on the first level a child of this band meets. */
  memoryPairs: number;
  /** "Your turn to talk" prompts. */
  talk: TalkMode;
  /** Games are optional extras played WITH a grown-up; real-world quests come first. */
  playTogether: boolean;
  /** Family suggests the Big Kid look (fewer sparkles, smaller characters) for this band; a grown-up switches it on. */
  bigKidLook: boolean;
}

export const BAND_SETTINGS: Record<AgeBand, BandSettings> = {
  together: {
    band: 'together', label: 'Play together', ages: 'under 3', fromMonths: 0,
    minTap: 96, speed: 0.4, maxChoices: 2, pathTolerance: 56, tapToMove: true, timers: 'off',
    reading: 'none', math: 'find12', countTo: 2, memoryPairs: 2, talk: 'sounds',
    playTogether: true, bigKidLook: false,
  },
  little: {
    band: 'little', label: 'Little', ages: '3–4', fromMonths: 36,
    minTap: 80, speed: 0.6, maxChoices: 3, pathTolerance: 44, tapToMove: true, timers: 'off',
    reading: 'none', math: 'count5', countTo: 5, memoryPairs: 3, talk: 'words',
    playTogether: false, bigKidLook: false,
  },
  early: {
    band: 'early', label: 'Early', ages: '5–6', fromMonths: 60,
    minTap: 64, speed: 0.8, maxChoices: 4, pathTolerance: 34, tapToMove: false, timers: 'off',
    reading: 'cvc', math: 'count10', countTo: 10, memoryPairs: 4, talk: 'phrases',
    playTogether: false, bigKidLook: false,
  },
  big: {
    band: 'big', label: 'Big', ages: '7–8', fromMonths: 84,
    minTap: 48, speed: 1.0, maxChoices: 6, pathTolerance: 28, tapToMove: false, timers: 'optional',
    reading: 'sentences', math: 'addSub20', countTo: 20, memoryPairs: 6, talk: 'retell',
    playTogether: false, bigKidLook: true,
  },
  older: {
    band: 'older', label: 'Older', ages: '9–12', fromMonths: 108,
    minTap: 48, speed: 1.2, maxChoices: 8, pathTolerance: 24, tapToMove: false, timers: 'optional',
    reading: 'longer', math: 'timesWords', countTo: 50, memoryPairs: 8, talk: 'retell',
    playTogether: false, bigKidLook: true,
  },
};

/** The band for a working age in months. No age yet → "little", a friendly middle. */
export function bandForMonths(months: number | null | undefined): AgeBand {
  if (months == null) return 'little';
  if (months < 36) return 'together';
  if (months < 60) return 'little';
  if (months < 84) return 'early';
  if (months < 108) return 'big';
  return 'older';
}

export const bandSettings = (months: number | null | undefined): BandSettings =>
  BAND_SETTINGS[bandForMonths(months)];

// ── The grown-up's "Game level" choice (Family page, per child) ──
// Let the app adjust (recommended) / Easier / Harder. Easier and Harder move
// the child's working age a year down or up, so the band, the tier and the
// starting level all follow together.
export type GameLevelChoice = 'auto' | 'easier' | 'harder';
export const GAME_LEVEL_SHIFT_MONTHS = 12;
export function shiftedMonths(months: number | null | undefined, choice: GameLevelChoice | undefined): number | null {
  if (months == null) return null;
  if (choice === 'easier') return Math.max(12, months - GAME_LEVEL_SHIFT_MONTHS);
  if (choice === 'harder') return months + GAME_LEVEL_SHIFT_MONTHS;
  return months;
}

// ── Adapting inside a band, round by round ──
// After 3 easy wins in a row a game steps up one extra level; after 2
// struggles in a row it quietly steps back one. The child is never told it
// moved down: the next level simply opens. See lib/rewards.ts recordGameLevel.
export const STEP_UP_AFTER_EASY_WINS = 3;
export const STEP_DOWN_AFTER_STRUGGLES = 2;

/** How a finished level went, from its slips (misses, wrong taps) out of
 *  how many things it asked: easy = barely a slip, struggle = slips on about
 *  half of them (at least 3). */
export type RoundEase = 'easy' | 'ok' | 'struggle';
export function roundEase(slips: number, items = 4): RoundEase {
  if (slips <= Math.floor(items * 0.1)) return 'easy';
  if (slips >= Math.max(3, Math.ceil(items / 2))) return 'struggle';
  return 'ok';
}

/** The grown-up note under each game in the "Play together" band. */
export const PLAY_TOGETHER_NOTE = 'Sit with your little one and help them tap.';
