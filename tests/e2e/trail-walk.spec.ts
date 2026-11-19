import { test, expect } from '@playwright/test';
import { seedFamily, watchErrors, startGame, playUntilFinished, nextLevel, savedRewards, guideLine, until } from './helpers';

// Trail Walk (Whispering Signposts): walk the trail, help each friend with a
// riddle, reach the flag.

test('Trail Walk: levels 1–5 walk to the flag', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/trail-walk');
  for (let level = 1; level <= 5; level++) {
    await playUntilFinished(page, ['[data-correct="true"]', '[data-walk]'], 'Trail Walk');
    expect((await savedRewards(page)).gameLevels['trail-walk']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Trail Walk: a wrong answer gets a hint, not a new friend', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/trail-walk');
  await page.locator('[data-walk]').click({ force: true });
  const wrong = page.locator('[data-correct="false"]').first();
  await wrong.click({ force: true });
  await until(async () => /try again|one by one|look again|sound it out|ran over to help/i.test(await guideLine(page)), 'a gentle hint');
  expect(await guideLine(page)).not.toMatch(/joins the journey/i);
  await page.locator('[data-correct="true"]').first().click({ force: true });
  await until(async () => /joins the journey/i.test(await guideLine(page)), 'the friend joining');
});
