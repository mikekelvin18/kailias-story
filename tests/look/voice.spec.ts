import { test, expect, type Page } from '@playwright/test';
import { GAMES, prepare, openGame } from './helpers';

// ── Voice check: Noel speaks in his own recorded voice, pets answer at once ──
// Kelvin 2026-11-25/26: a missing recording sent Noel's line to the phone's
// robot voice, and pets' voices felt laggy. For every game:
//   • Noel's opening line plays from a recording within a few seconds
//   • the phone's robot voice is used only for a sentence with the child's
//     name in it (that can't be recorded ahead of time)
// And tapping a friend makes its sound start within 350 ms, even on a slow
// phone connection.

interface Clip { t: number; src: string; ev: 'play' | 'playing' }
const clips = (page: Page) => page.evaluate(() => (window as unknown as { __clips: Clip[] }).__clips);
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: { text: string }[] }).__spoken);

for (const game of GAMES) {
  test(`voice: ${game} — Noel speaks in his recorded voice, never the robot voice`, async ({ page }) => {
    test.setTimeout(60_000);
    await prepare(page, { listen: true });
    await openGame(page, game, 3);
    await expect.poll(async () => (await clips(page)).some(c => /\/voice\//.test(c.src) && c.ev === 'playing'),
      { message: `${game}: Noel's recorded voice never started`, timeout: 10_000 }).toBe(true);
    await page.waitForTimeout(3000);
    // a blank line is the silent warm-up that unlocks speech on iPhone, not words
    const robot = (await spoken(page)).filter(s => s.text.trim() && !/Robin/.test(s.text));
    expect(robot.map(s => s.text), `${game}: lines read by the phone's robot voice instead of a recording`).toEqual([]);
  });
}

test('voice: a friend\'s sound starts within 350 ms of a tap, even on a slow connection', async ({ page }) => {
  await prepare(page, { listen: true });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 250, downloadThroughput: 200_000, uploadThroughput: 100_000 });
  await openGame(page, 'reef-explorer', 3, '&buddy=fox');
  await page.waitForTimeout(2500);
  const pet = page.locator('[aria-label^="Tickle"]').first();
  const t0 = await page.evaluate(() => performance.now());
  await pet.click({ force: true });
  await expect.poll(async () => (await clips(page)).some(c => /\/sounds\/pets\//.test(c.src) && c.ev === 'playing' && c.t > t0),
    { message: 'the friend\'s sound never started', timeout: 5000 }).toBe(true);
  const started = (await clips(page)).find(c => /\/sounds\/pets\//.test(c.src) && c.ev === 'playing' && c.t > t0)!;
  expect(started.t - t0, `the friend's sound started ${Math.round(started.t - t0)} ms after the tap`).toBeLessThan(350);
});
