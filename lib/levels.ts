// ── Level chapters ──
// Every leveled game shares one ladder: 30 levels in 6 chapters of 5.
// Each chapter maps to an approximate developmental age band, so the
// ladder doubles as a rough "where is my child" marker for parents.
// After level 30 the game never ends: it keeps going through endless
// Star worlds (Comet Coast, Aurora Peaks, …), five levels each, every
// world with its own name and color. Past 30 the age ladder is finished,
// so games grow by VARIETY (new twists, mixes, bigger numbers within
// reach) rather than by age; endlessRamp() gives them a gentle curve
// that keeps rising forever without ever becoming unplayable.
//
// Kids see only the chapter name and emoji — never the age band.
// The bands are a first guess; review them with a clinician alongside
// the rest of the milestone mapping before launch.

import { nextGameLevel, loadRewards } from './rewards';
import type { DifficultyTier } from './difficulty';

export const LEVELS_PER_CHAPTER = 5;

export interface Chapter {
  n: number;          // 1-based chapter number
  name: string;
  emoji: string;
  color: string;
  ages: string;       // parent-facing only
}

export const CHAPTERS: Chapter[] = [
  { n: 1, name: 'Sprout',   emoji: '🌱', color: '#22C55E', ages: 'about 2½–4 years' },
  { n: 2, name: 'Sapling',  emoji: '🌿', color: '#14B8A6', ages: 'about 4–5 years' },
  { n: 3, name: 'Explorer', emoji: '🧭', color: '#3B82F6', ages: 'about 5–6 years' },
  { n: 4, name: 'Ranger',   emoji: '🏕️', color: '#8B5CF6', ages: 'about 6–8 years' },
  { n: 5, name: 'Hero',     emoji: '🛡️', color: '#EC4899', ages: 'about 8–10 years' },
  { n: 6, name: 'Legend',   emoji: '👑', color: '#F59E0B', ages: 'about 10–12 years' },
];

export const STAR_CHAPTER: Chapter = { n: 7, name: 'Star Levels', emoji: '⭐', color: '#FACC15', ages: 'beyond 12 years' };

export const MAX_LADDER_LEVEL = CHAPTERS.length * LEVELS_PER_CHAPTER; // 30

// The never-ending worlds after the ladder. They cycle, and each lap
// gets a number ("Comet Coast II"), so level 500 still has a fresh name.
const STAR_WORLDS: { name: string; color: string }[] = [
  { name: 'Comet Coast',     color: '#38BDF8' },
  { name: 'Aurora Peaks',    color: '#34D399' },
  { name: 'Moonbeam Bay',    color: '#A78BFA' },
  { name: 'Rainbow Rift',    color: '#F472B6' },
  { name: 'Sunstone Summit', color: '#FB923C' },
  { name: 'Crystal Clouds',  color: '#22D3EE' },
  { name: 'Nebula Nest',     color: '#C084FC' },
  { name: 'Starfall Sea',    color: '#60A5FA' },
  { name: 'Golden Galaxy',   color: '#FACC15' },
  { name: 'Dream Meadow',    color: '#4ADE80' },
];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** 0-based chapter page a level sits on. */
export function chapterIndex(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / LEVELS_PER_CHAPTER);
}

/** The chapter (or Star world) at a 0-based page. Never runs out. */
export function chapterAt(index: number): Chapter {
  if (index < CHAPTERS.length) return CHAPTERS[Math.max(0, index)];
  const k = index - CHAPTERS.length;
  const w = STAR_WORLDS[k % STAR_WORLDS.length];
  const lap = Math.floor(k / STAR_WORLDS.length);
  return {
    ...STAR_CHAPTER,
    n: index + 1,
    name: lap ? `${w.name} ${ROMAN[lap + 1] ?? lap + 1}` : w.name,
    color: w.color,
  };
}

export function chapterFor(level: number): Chapter {
  return chapterAt(chapterIndex(level));
}

/** True for every level after the 30-level age ladder. */
export function isStarLevel(level: number): boolean {
  return level > MAX_LADDER_LEVEL;
}

/**
 * A level curve with no ceiling that never gets silly: starts at `from`
 * on level 1, is halfway to `to` by level `half`, and creeps toward `to`
 * forever after. Use it for speeds, counts and sizes that should keep
 * growing in the endless Star worlds.
 */
export function endlessRamp(level: number, from: number, to: number, half = 15): number {
  const t = 1 - Math.pow(0.5, Math.max(0, level - 1) / half);
  return from + (to - from) * t;
}

/** A repeatable random number for a level (same level, same layout). */
export function levelRandom(level: number, salt = 0): () => number {
  let a = (level * 2654435761 + salt * 40503) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Where a brand-new player starts. Most games already soften themselves
// for younger tiers, so the default is level 1 for everyone; games whose
// content IS the age ladder (Word Wizard) pass a later start for older kids.
export function firstLevelForTier(tier: DifficultyTier): number {
  return tier === 'big' ? 1 + LEVELS_PER_CHAPTER * 2 : tier === 'small' ? 1 + LEVELS_PER_CHAPTER : 1;
}

// Highest level the child may pick on the level map: everything beaten,
// the next one, and never below the game's starting level.
export function unlockedUpTo(gameId: string, startLevel = 1): number {
  return Math.max(nextGameLevel(gameId), startLevel);
}

export function highestBeaten(gameId: string): number {
  return loadRewards().gameLevels[gameId] ?? 0;
}
