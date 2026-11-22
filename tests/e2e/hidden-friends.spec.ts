import { test, expect } from '@playwright/test';
import { seedFamily, watchErrors, startGame, playUntilFinished, nextLevel, savedRewards, guideLine, until } from './helpers';

// Hidden Friends (Owl's Tower): find Noel and the treasures hiding in each
// busy scene. The robot taps where each hidden thing really is on screen,
// so a hiding spot covered by the crowd would fail the check.

const HIDDEN = 'button[data-found="false"][data-kind]:not([data-kind="crowd"])';

test('Hidden Friends: chapters 1–6 are all findable and finish', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/hidden-friends');
  for (let level = 1; level <= 6; level++) {
    await playUntilFinished(page, [HIDDEN], 'Hidden Friends', 60);
    expect((await savedRewards(page)).gameLevels['hidden-friends']).toBe(level);
    await nextLevel(page);
  }
  expect(errors).toEqual([]);
});

test('Hidden Friends: tapping the crowd is "keep looking", never a find', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/hidden-friends');
  await page.locator('g[data-kind="crowd"]').first().click({ force: true });
  await until(async () => /keep looking|close|not noel/i.test(await guideLine(page)), 'the keep-looking line');
  expect(await guideLine(page)).not.toMatch(/found me|keep going!|everyone is found/i);
});

test("Where's Noel: level 3 names the same chapter in the intro, the level map and the header (Muse round 5)", async ({ page }) => {
  await seedFamily(page, { levels: { 'hidden-friends': 3 } });
  await page.goto('/play/hidden-friends');
  const intro = page.getByTestId('game-intro');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  const place = (await intro.locator('[data-level-place]').textContent())!.trim();
  expect(place).toBe('Level 3 · Chapter 1: Sprout');
  // the level map shows the same chapter
  const map = await page.evaluate(() => {
    const ps = [...document.querySelectorAll('p')];
    const i = ps.findIndex(e => /^(Chapter \d+|Star world \d+)$/i.test(e.textContent!.trim()));
    return i < 0 ? '' : `${ps[i].textContent!.trim()}: ${ps[i + 1].textContent!.trim()}`;
  });
  expect(place.toLowerCase()).toContain(map.toLowerCase());
  await intro.locator('.gf-cta').first().click({ force: true });
  await expect(page.locator('h1 [data-level-place]')).toHaveText('Lv 3 · Sprout');
});
