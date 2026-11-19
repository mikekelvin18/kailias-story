import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, expectFinish, nextLevel, savedRewards, centers, finished, drag } from './helpers';

// Firefly Catch (Firefly Forest, fine motor): tap every drifting firefly,
// then carry the sleepy ones into the lantern, for several levels.

async function playLevel(page: Page) {
  for (let guard = 0; guard < 400; guard++) {
    if (await finished(page)) return;
    const mode = await page.evaluate(() => document.querySelector('[data-mode]')?.getAttribute('data-mode'));
    const [at] = await centers(page, '[data-firefly]');
    if (!at) { await page.waitForTimeout(150); continue; }
    if (mode === 'drag') {
      const [lantern] = await centers(page, '[data-lantern]');
      await drag(page, at, lantern);
    } else {
      await page.mouse.click(at.x, at.y);
    }
    await page.waitForTimeout(80);
  }
  throw new Error('Firefly Catch never reached its party screen');
}

test('Firefly Catch: levels 1–4 catch every firefly and finish', async ({ page }) => {
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/firefly-catch');
  for (let level = 1; level <= 4; level++) {
    await playLevel(page);
    await expectFinish(page);
    expect((await savedRewards(page)).gameLevels['firefly-catch']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});
