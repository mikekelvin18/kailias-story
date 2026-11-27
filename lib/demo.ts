// Try-before-sign-up demo: one game, playable before any account or
// consent exists. Only a "demo on" flag is kept, in sessionStorage (it
// disappears when the tab closes) and it holds no child data at all.
// Game progress is never written because every child-data store is
// consent-gated (lib/rewards.ts, lib/metrics.ts, lib/adventure.ts).

export const DEMO_GAME_PATH = '/play/firefly-catch';
const KEY = 'kailia_demo_session';

export function startDemo() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* blocked storage: demo still opens this once */ }
}

export function isDemoActive(): boolean {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}
