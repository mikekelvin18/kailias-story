// ── Task demands for the adventure world ──
// How hard each activity is starts from the child's adventure check
// (lib/difficulty.ts tier) and a grown-up can move it in the pause menu.
// Demands are only ever about the task (how many stones, how forgiving),
// never about the child.

import type { DifficultyTier } from '@/lib/difficulty';
import type { Demands } from './events';

export type ChallengeChoice = 'auto' | 'easier' | 'harder';
export type HintChoice = 'auto' | 'more' | 'fewer';

export interface GrownUpSettings {
  challenge: ChallengeChoice;
  hints: HintChoice;
  tapToMove: boolean;
}

export const DEFAULT_GROWN_UP: GrownUpSettings = { challenge: 'auto', hints: 'auto', tapToMove: false };

const LEVELS: Omit<Demands, 'label' | 'tapToMove' | 'remindAfterS' | 'hintAfter'>[] = [
  { level: 1, stones: 2, snap: 120, holdMs: 600, spots: 3, peek: 0.75 },
  { level: 2, stones: 3, snap: 85, holdMs: 1100, spots: 4, peek: 0.45 },
  { level: 3, stones: 4, snap: 60, holdMs: 1700, spots: 6, peek: 0.25 },
];

const TIER_LEVEL: Record<DifficultyTier, number> = { tiny: 0, small: 1, big: 2 };

export function demandsFor(tier: DifficultyTier, g: GrownUpSettings): Demands {
  const shift = g.challenge === 'easier' ? -1 : g.challenge === 'harder' ? 1 : 0;
  const i = Math.max(0, Math.min(2, TIER_LEVEL[tier] + shift));
  const base = LEVELS[i];
  const hintAfter = Math.max(1, (i + 1) + (g.hints === 'more' ? -1 : g.hints === 'fewer' ? 2 : 0));
  const remindAfterS = g.hints === 'more' ? 8 : g.hints === 'fewer' ? 25 : 14;
  return {
    ...base,
    label: ['easier', 'just right', 'harder'][Math.max(0, Math.min(2, 1 + shift))],
    hintAfter,
    remindAfterS,
    tapToMove: g.tapToMove,
  };
}
