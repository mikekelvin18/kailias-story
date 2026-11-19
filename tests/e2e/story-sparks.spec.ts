import { test, expect } from '@playwright/test';
import { seedFamily, watchErrors, startGame, playUntilFinished, nextLevel, savedRewards, guideLine, until } from './helpers';

// Story Sparks (Village of the Story Keepers, communication): pick what really
// happens next in each story, through every story in the book.

test('Story Sparks: all four stories (and the repeat) play to the end', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/story-sparks');
  for (let level = 1; level <= 5; level++) {
    await playUntilFinished(page, ['[data-kind="good"]'], 'Story Sparks');
    expect((await savedRewards(page)).gameLevels['story-sparks']).toBe(level);
    await nextLevel(page);
  }
  expect(errors).toEqual([]);
});

test('Story Sparks: a silly pick gets a giggle and a retry, never "yes"', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/story-sparks');
  await page.locator('[data-kind="silly"]').first().click({ force: true });
  await until(async () => /silly/i.test(await guideLine(page)), 'the giggle');
  expect(await guideLine(page)).not.toMatch(/yes!/i);
  await page.locator('[data-kind="silly"]').first().click({ force: true });
  await until(async () => /REALLY happens/.test(await guideLine(page)), 'the friend pointing at the real one');
  await page.locator('[data-kind="good"]').first().click({ force: true });
  await until(async () => /yes!/i.test(await guideLine(page)), 'praise');
});
