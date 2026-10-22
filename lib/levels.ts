// ── Level chapters ──
// Every leveled game shares one ladder: 30 levels in 6 chapters of 5.
// Each chapter maps to an approximate developmental age band, so the
// ladder doubles as a rough "where is my child" marker for parents.
// After level 30 the game keeps going with endless ⭐ Star levels.
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

export function chapterFor(level: number): Chapter {
  const i = Math.floor((Math.max(1, level) - 1) / LEVELS_PER_CHAPTER);
  return CHAPTERS[i] ?? STAR_CHAPTER;
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
