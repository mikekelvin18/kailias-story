'use client';
// ── A game's fit to this child (lib/ageFit.ts, lib/ageBands.ts) ──
// One call gives a game everything age-related it needs:
//   tier       — tiny / small / big, from the child's working age in THIS
//                game's skill (math games read the math estimate, and so on)
//   band       — together / little / early / big / older, and its settings
//                (tap size, speed, choices, path tolerance, reading, math…)
//   fitMonths  — that working age in months (null before any check-up and age),
//                after the grown-up's Easier / Harder choice in Family
//   startLevel — where a new player starts on the level map
// and openingLevel() picks the level the game opens on: where the child left
// off, or, the first time, their own starting level (Kelvin 2026-11-25: older
// children met 3-year-old levels because every game began on level 1).

import { useEffect, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { fitGame, fitStartLevel } from '@/lib/ageFit';
import { bandForMonths, BAND_SETTINGS, shiftedMonths, type AgeBand, type BandSettings, type GameLevelChoice } from '@/lib/ageBands';
import { activeChild, ACTIVE_CHILD_CHANGED_EVENT, CHILD_PREFS_CHANGED_EVENT } from '@/lib/family';
import { loadRewards, nextGameLevel } from '@/lib/rewards';

export interface GameFit {
  tier: DifficultyTier;
  band: AgeBand;
  /** The band's settings (lib/ageBands.ts). */
  look: BandSettings;
  fitMonths: number | null;
  startLevel: number;
  loaded: boolean;
  /** The grown-up switched on the Big Kid look in Family. */
  bigKid: boolean;
}

/** The active child's grown-up game settings, kept fresh when Family changes them. */
export function useChildGamePrefs(): { gameLevel: GameLevelChoice; bigKidLook: boolean | undefined } {
  const [prefs, setPrefs] = useState<{ gameLevel: GameLevelChoice; bigKidLook: boolean | undefined }>({ gameLevel: 'auto', bigKidLook: undefined });
  useEffect(() => {
    const read = () => {
      const c = activeChild();
      setPrefs({ gameLevel: c?.gameLevel ?? 'auto', bigKidLook: c?.bigKidLook });
    };
    read();
    window.addEventListener(CHILD_PREFS_CHANGED_EVENT, read);
    window.addEventListener(ACTIVE_CHILD_CHANGED_EVENT, read);
    return () => {
      window.removeEventListener(CHILD_PREFS_CHANGED_EVENT, read);
      window.removeEventListener(ACTIVE_CHILD_CHANGED_EVENT, read);
    };
  }, []);
  return prefs;
}

export function useGameFit(gameId: string): GameFit {
  const { state, totalScore, devMonths, chronoMonths, estimates, loaded } = useAssessment();
  const { gameLevel, bigKidLook } = useChildGamePrefs();
  const area = fitGame(gameId)?.area;
  const est = area ? estimates[area] : undefined;
  // the skill's own estimate, else the overall one, else the real age,
  // then a year down or up if a grown-up chose Easier / Harder
  const fitMonths = shiftedMonths(est ? est.mid : devMonths ?? chronoMonths, gameLevel);
  const tier = difficultyTier(state.ageGroup, totalScore, fitMonths);
  const band = bandForMonths(fitMonths);
  const look = BAND_SETTINGS[band];
  return {
    tier, band, look, fitMonths,
    startLevel: loaded ? fitStartLevel(gameId, fitMonths) : 1,
    loaded,
    bigKid: bigKidLook ?? false,
  };
}

/** The level a game opens on: the next one after the child's last, or for a
 *  game they have never played, their own starting level. */
export function openingLevel(gameId: string, startLevel: number): number {
  const r = loadRewards();
  const played = r.reviewNext ? gameId in r.reviewNext : gameId in r.gameLevels;
  return played ? nextGameLevel(gameId) : Math.max(1, startLevel);
}
