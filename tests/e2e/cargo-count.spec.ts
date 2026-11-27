import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, until, finished, nextLevel, savedRewards, guideLine } from './helpers';

// Cargo Count (Space Outpost, math): its own game, not Snack Quest (Muse
// round 5). Beam drifting cargo boxes into the rocket until the hold
// matches the crew's order, then launch. Too much cargo is fixed by
// sending a box back, never a failure.

async function order(page: Page) {
  return page.evaluate(() => {
    const t = document.querySelector('[data-order]')?.getAttribute('data-target');
    const l = document.querySelector('[data-loaded]')?.getAttribute('data-loaded');
    return t == null || l == null ? null : { target: Number(t), loaded: Number(l) };
  });
}

/** Taps a drifting box of the given value (or the biggest one that still fits). */
async function beam(page: Page, need: number) {
  // boxes fully inside the space scene (they drift out one side and back in the other)
  const onScreen = await page.evaluate(() => [...document.querySelectorAll('[data-pod]')].map(e => {
    const r = e.getBoundingClientRect(), s = e.parentElement!.getBoundingClientRect();
    return { v: Number(e.getAttribute('data-value')), x: r.left + r.width / 2, y: r.top + r.height / 2, inside: r.left > s.left + 4 && r.right < s.right - 4 };
  }).filter(p => p.inside));
  const pick = onScreen.filter(p => p.v <= need).sort((a, b) => b.v - a.v)[0];
  if (!pick) return false;
  await page.mouse.click(pick.x, pick.y);
  return true;
}

async function playLevel(page: Page) {
  const values = new Set<number>();
  for (let guard = 0; guard < 200; guard++) {
    if (await finished(page)) return values;
    const o = await order(page);
    (await page.evaluate(() => [...document.querySelectorAll('[data-pod]')].map(e => Number(e.getAttribute('data-value'))))).forEach(v => values.add(v));
    if (!o) { await page.waitForTimeout(200); continue; }
    if (o.loaded === o.target) {
      await page.locator('[data-launch]').click({ force: true });
      await until(async () => (await finished(page)) || (await order(page))?.loaded === 0, 'the rocket to launch and a new order', 8000);
      continue;
    }
    if (o.loaded > o.target) {
      // send back the smallest box (a slip of the finger), like a child fixing it
      const chips = await page.evaluate(() => [...document.querySelectorAll('[data-hold-chip]')].map(e => Number(e.getAttribute('data-value'))));
      const i = chips.indexOf(Math.min(...chips));
      await page.locator('[data-hold-chip]').nth(i).click({ force: true }); await page.waitForTimeout(200); continue;
    }
    if (!(await beam(page, o.target - o.loaded))) {
      // nothing left that fits: send a box back and try another way (always possible)
      const fits = await page.evaluate(need => [...document.querySelectorAll('[data-pod]')].some(e => Number(e.getAttribute('data-value')) <= need), o.target - o.loaded);
      if (!fits && o.loaded > 0) {
        const chips = await page.evaluate(() => [...document.querySelectorAll('[data-hold-chip]')].map(e => Number(e.getAttribute('data-value'))));
        await page.locator('[data-hold-chip]').nth(chips.indexOf(Math.max(...chips.filter(v => v > 1), 1))).click({ force: true });
      }
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(650);
  }
  throw new Error('Cargo Count never reached its party screen');
}

test('Cargo Count: levels 1–3 load exactly the order, launch and finish', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/cargo-count');
  for (let level = 1; level <= 3; level++) {
    const values = await playLevel(page);
    expect([...values], 'early levels only have boxes of 1').toEqual([1]);
    expect((await savedRewards(page)).gameLevels['cargo-count']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Cargo Count: higher levels bring boxes of 2 and 5 and still finish', async ({ page }) => {
  test.setTimeout(120_000);
  await seedFamily(page, { strong: true, ageMonths: 96, levels: { 'cargo-count': 12 } });
  await startGame(page, '/play/cargo-count');
  await expect(page.locator('h1')).toContainText('Lv 12');
  const values = await playLevel(page);
  expect(values.has(5) || values.has(2), 'boxes bigger than 1 show up').toBe(true);
  expect((await savedRewards(page)).gameLevels['cargo-count']).toBe(12);
});

test('Cargo Count: too much cargo is "too heavy", the rocket stays, and a box can go back', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/cargo-count');
  const o = await until(() => order(page), 'the crew order');
  // load one more than ordered
  for (let i = 0; i <= o.target; i++) { await beam(page, 1); await page.waitForTimeout(650); }
  await until(async () => (await order(page))!.loaded > o.target, 'an overloaded hold');
  await page.locator('[data-launch]').click({ force: true });
  await until(async () => /too heavy/i.test(await guideLine(page)), 'the too-heavy line');
  expect(await guideLine(page)).not.toMatch(/lift off|perfect|wrong/i);
  await page.locator('[data-hold-chip]').first().click({ force: true });
  await until(async () => (await order(page))!.loaded === o.target, 'a box sent back');
});
