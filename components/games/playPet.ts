'use client';

// ── Which friend plays along ──
// Every main game has a friend in the scene with Kailia: the friend the
// parent picked as the practice focus, else the newest friend the child
// has unlocked, else Flick (so a brand-new player still has company).
// Read after mount, because it lives in the child's saved rewards.

import { useEffect, useState } from 'react';
import { COMPANIONS, getFocusCompanion, loadRewards, unlockedCompanions } from '@/lib/rewards';

export type PlayPet = (typeof COMPANIONS)[number];

const FLICK = COMPANIONS.find(c => c.name === 'Flick')!;

export function pickPlayPet(): PlayPet {
  const focus = getFocusCompanion();
  const chosen = focus ? COMPANIONS.find(c => c.name === focus) : undefined;
  if (chosen) return chosen;
  const unlocked = unlockedCompanions(loadRewards().starlight);
  return unlocked[unlocked.length - 1] ?? FLICK;
}

export function usePlayPet(): PlayPet {
  const [pet, setPet] = useState<PlayPet>(FLICK);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- saved rewards are only readable after mount
  useEffect(() => { setPet(pickPlayPet()); }, []);
  return pet;
}
