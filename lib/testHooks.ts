// ── Hooks for the automatic game checks (tests/) ──
// The robot players in tests/e2e need to know a few things a child sees
// on screen but a robot can't (where the glowing path runs, which card is
// the right one). A game hands those over with testHook(); it does
// nothing at all unless the test runner switched the hooks on before the
// page loaded (window.__KAILIA_TEST__), so real players never run it and
// nothing is ever stored or sent anywhere.

type HookWindow = Window & { __KAILIA_TEST__?: boolean; __kailia?: Record<string, unknown> };

export function testing(): boolean {
  return typeof window !== 'undefined' && !!(window as HookWindow).__KAILIA_TEST__;
}

/** Share `data` under `name` with the robot player (no-op for real players). */
export function testHook(name: string, data: unknown): void {
  if (!testing()) return;
  const w = window as HookWindow;
  (w.__kailia ??= {})[name] = data;
}
