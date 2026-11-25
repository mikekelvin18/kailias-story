import { test, expect } from '@playwright/test';
import { seedFamily, watchErrors, startGame, playUntilFinished, nextLevel, savedRewards, guideLine, until } from './helpers';

// Sense Explorer (Echo Caves, sensory): catch the drifting things of the
// asked color and spot the crystal that looks different.

const GOAL = '[data-goal="1"]:not([disabled])';

test('Sense Explorer: levels 1–5 play to the finish', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/sensory');
  for (let level = 1; level <= 5; level++) {
    await playUntilFinished(page, [GOAL], 'Sense Explorer');
    expect((await savedRewards(page)).gameLevels['sense-explorer']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

for (const level of [12, 24, 33]) {
  test(`Sense Explorer: level ${level} plays to the finish`, async ({ page }) => {
    await seedFamily(page, { levels: { 'sense-explorer': level } });
    await startGame(page, '/play/sensory');
    await playUntilFinished(page, [GOAL], 'Sense Explorer');
    expect((await savedRewards(page)).gameLevels['sense-explorer']).toBe(level);
  });
}

test('Sense Explorer: a wrong pick is "look again", never a catch', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/sensory');
  await page.locator('[data-goal="0"]').first().click({ force: true });
  await until(async () => /look again|not that one/i.test(await guideLine(page)), 'the gentle miss line');
  expect(await guideLine(page)).not.toMatch(/got one|sharp eyes|caught them all/i);
});
