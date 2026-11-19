import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, hook, clearHook, expectFinish, nextLevel, savedRewards } from './helpers';

// Firefly Trails (Firefly Forest, fine motor): trace each glowing picture,
// including the "from memory" levels where the trail fades after a look.

async function traceTrail(page: Page) {
  const { pts } = await hook<{ pts: { x: number; y: number }[] }>(page, 'trail');
  // memory levels show the picture first; wait until it's time to trace
  await expect(page.getByText(/^Trace /).first()).toBeVisible({ timeout: 15_000 });
  const box = (await page.locator('[data-trace]').boundingBox())!;
  const at = (p: { x: number; y: number }) => ({ x: box.x + p.x * box.width, y: box.y + p.y * box.height });
  await page.mouse.move(at(pts[0]).x, at(pts[0]).y);
  await page.mouse.down();
  for (const p of pts.slice(1)) await page.mouse.move(at(p).x, at(p).y, { steps: 1 });
  await page.mouse.up();
}

test('Firefly Trails: levels 1–6 trace every picture to the finish', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/firefly-trails');
  for (let level = 1; level <= 6; level++) {
    await traceTrail(page);
    await expectFinish(page);
    expect((await savedRewards(page)).gameLevels['firefly-trails']).toBe(level);
    await clearHook(page, 'trail');
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});
