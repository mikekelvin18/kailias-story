// ── Test mode for reviewers (preview builds only) ──
// Grok (2026-11-27) couldn't finish Garden, Maze Runner and Potion Sort
// because they need a steady drag. Test mode swaps the drag for taps (the
// same tap-to-move the youngest age bands get), so a tester can reach every
// level. It is switched on only by the jump link /go/test-mode (lib/jump.ts),
// and /go answers "not found" on the real public site (lib/jumpGate.ts), so a
// family can never turn it on. It lasts for this browser tab only.

export const TEST_TAP_KEY = 'kailia_test_tap_v1';

export function testTapMode(): boolean {
  if (typeof window === 'undefined') return false;
  try { return sessionStorage.getItem(TEST_TAP_KEY) === '1'; } catch { return false; }
}
// the React hook is in hooks/useTestTapMode.ts (this file is also read on the server)
