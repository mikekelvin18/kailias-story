'use client';

import { useSyncExternalStore } from 'react';
import { testTapMode } from '@/lib/testMode';

const noop = () => () => {};
/** True when a reviewer switched on test mode (tap instead of drag, lib/testMode.ts). */
export function useTestTapMode(): boolean {
  return useSyncExternalStore(noop, testTapMode, () => false);
}
