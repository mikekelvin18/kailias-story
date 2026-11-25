import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, until, finished, nextLevel, savedRewards, guideLine, centers, drag } from './helpers';

// Potion Sort (Owl's Tower): catch each falling potion and drop it into the
// cauldron of the same color, every round, for several levels.

async function sortOne(page: Page) {
  const bottle = await page.evaluate(() => {
    const el = document.querySelector('[data-bottle]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { color: el.getAttribute('data-bottle')!, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!bottle) return false;
  const [pot] = await centers(page, `[data-pot="${bottle.color}"]`);
  await drag(page, bottle, { x: pot.x, y: pot.y - pot.h * 0.3 }, 6);
  return true;
}

async function playLevel(page: Page) {
  for (let guard = 0; guard < 600; guard++) {
    if (await finished(page)) return;
    if (!(await sortOne(page))) await page.waitForTimeout(120);
  }
  throw new Error('Potion Sort never reached its party screen');
}

test('Potion Sort: levels 1–3 sort every potion and finish', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/potion-sort');
  for (let level = 1; level <= 3; level++) {
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['potion-sort']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Potion Sort: a potion in the wrong cauldron is "close", never "perfect"', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/potion-sort');
  // the potions are falling, so grab one where it is right now; a grab that
  // misses the moving bottle is simply tried again with the next one
  const where = () => page.evaluate(() => {
    const el = document.querySelector('[data-bottle]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { color: el.getAttribute('data-bottle')!, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  let said = false;
  for (let tries = 0; tries < 4 && !said; tries++) {
    const bottle = await until(where, 'a falling potion');
    const other = (await page.evaluate(c => [...document.querySelectorAll('[data-pot]')].map(e => e.getAttribute('data-pot')!).find(k => k !== c), bottle.color))!;
    const [pot] = await centers(page, `[data-pot="${other}"]`);
    const now = (await where()) ?? bottle;
    await drag(page, now, { x: pot.x, y: pot.y - pot.h * 0.3 }, 6);
    said = await until(async () => /close/i.test(await guideLine(page)), 'the "close" line', 4000).then(() => true, () => false);
  }
  expect(said, 'a potion in the wrong cauldron gets the "close" line').toBe(true);
  expect(await guideLine(page)).not.toMatch(/perfect|just right|splash/i);
});
