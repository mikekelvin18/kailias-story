'use client';
// ── A game's fit to this child (lib/ageFit.ts) ──
// One call gives a game everything age-related it needs:
//   tier       — tiny / small / big, from the child's working age in THIS
//                game's skill (math games read the math estimate, and so on)
//   fitMonths  — that working age in months (null before any check-up and age)
//   startLevel — where a new player starts on the level map
// and openingLevel() picks the level the game opens on: where the child left
// off, or, the first time, their own starting level (Kelvin 2026-11-25: older
// children met 3-year-old levels because every game began on level 1).

import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { fitGame, fitStartLevel } from '@/lib/ageFit';
import { loadRewards, nextGameLevel } from '@/lib/rewards';

export function useGameFit(gameId: string): { tier: DifficultyTier; fitMonths: number | null; startLevel: number; loaded: boolean } {
  const { state, totalScore, devMonths, chronoMonths, estimates, loaded } = useAssessment();
  const area = fitGame(gameId)?.area;
  const est = area ? estimates[area] : undefined;
  // the skill's own estimate, else the overall one, else the real age
  const fitMonths = est ? est.mid : devMonths ?? chronoMonths;
  const tier = difficultyTier(state.ageGroup, totalScore, fitMonths);
  return { tier, fitMonths, startLevel: loaded ? fitStartLevel(gameId, fitMonths) : 1, loaded };
}

/** The level a game opens on: the next one after the child's last, or for a
 *  game they have never played, their own starting level. */
export function openingLevel(gameId: string, startLevel: number): number {
  const r = loadRewards();
  const played = r.reviewNext ? gameId in r.reviewNext : gameId in r.gameLevels;
  return played ? nextGameLevel(gameId) : Math.max(1, startLevel);
}
