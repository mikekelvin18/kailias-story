'use client';

// ── Which friend plays along ──
// Every main game has a friend in the scene with Kailia: the friend the
// parent picked as the practice focus, else the buddy picked for the
// child at sign-up (so the friend chosen at the start is the same friend
// in the games and the daily care pet: one choice, not two), else the
// newest friend the child has unlocked, else Flick (so a brand-new player
// still has company). Read after mount, because it lives on this device.

import { useEffect, useState } from 'react';
import { COMPANIONS, getFocusCompanion, loadRewards, unlockedCompanions } from '@/lib/rewards';
import { activeChild } from '@/lib/family';
import { CHILD_AVATARS } from '@/components/characters/characters.config';

export type PlayPet = (typeof COMPANIONS)[number];

const FLICK = COMPANIONS.find(c => c.name === 'Flick')!;

// The sign-up buddy as a friend's name, when that buddy is one of the
// friends (Noel the panda is already the guide, so he isn't one).
export function signupFriend(): string | null {
  const id = activeChild()?.avatar;
  const name = CHILD_AVATARS.find(a => a.id === id)?.name;
  return COMPANIONS.some(c => c.name === name) ? name! : null;
}

export function pickPlayPet(): PlayPet {
  const focus = getFocusCompanion() ?? signupFriend();
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
