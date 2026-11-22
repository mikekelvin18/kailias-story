import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, until, finished, nextLevel, savedRewards, guideLine } from './helpers';

// Reef Explorer (Coral Reef, senses): its own game, not Sense Explorer
// (Muse round 5). The reef is dark; move Kailia's flashlight and tap the
// sea friend that looks just like the card. A friend in the dark can't be
// picked (the tap only shines the light there), and a look-alike gets a
// kind "look again" line, never a find.

async function fish(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-fish]')].map(e => {
    const r = e.getBoundingClientRect();
    return { target: e.getAttribute('data-target') === '1', x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }));
}
const found = (page: Page) => page.evaluate(() => Number(document.querySelector('[aria-label$=" found"]')?.getAttribute('aria-label')?.match(/^(\d+)/)?.[1] ?? -1));

/** Shine the light on a fish, then tap it while it is lit. */
async function shineAndTap(page: Page, wantTarget: boolean) {
  const f = (await fish(page)).find(q => q.target === wantTarget);
  if (!f) return false;
  await page.mouse.click(f.x, f.y);           // moves the light onto it
  await page.waitForTimeout(80);
  const again = (await fish(page)).find(q => q.target === wantTarget && Math.hypot(q.x - f.x, q.y - f.y) < 60);
  if (again) await page.mouse.click(again.x, again.y);
  return true;
}

async function playLevel(page: Page) {
  for (let guard = 0; guard < 80; guard++) {
    if (await finished(page)) return;
    const before = await found(page);
    if (before < 0 || !(await shineAndTap(page, true))) { await page.waitForTimeout(200); continue; }
    await until(async () => (await finished(page)) || (await found(page)) > before, 'the find to count', 3000).catch(() => null);
    await page.waitForTimeout(300);
  }
  throw new Error('Reef Explorer never reached its party screen');
}

test('Reef Explorer: levels 1–3 find every friend and finish', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/reef-explorer');
  for (let level = 1; level <= 3; level++) {
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['reef-explorer']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Reef Explorer: a dark level (18) with close look-alikes still finishes', async ({ page }) => {
  test.setTimeout(120_000);
  await seedFamily(page, { strong: true, ageMonths: 96, levels: { 'reef-explorer': 18 } });
  await startGame(page, '/play/reef-explorer');
  await expect(page.locator('h1')).toContainText('Lv 18');
  await playLevel(page);
  expect((await savedRewards(page)).gameLevels['reef-explorer']).toBe(18);
});

test('Reef Explorer: a tap in the dark only moves the light; a look-alike gets "look again"', async ({ page }) => {
  await seedFamily(page, { strong: true, ageMonths: 96, levels: { 'reef-explorer': 12 } });
  await startGame(page, '/play/reef-explorer');
  await until(async () => (await fish(page)).length > 0, 'the sea friends');
  // a far-off look-alike, away from the light: tapping it just moves the light
  const reef = (await page.locator('[data-reef]').boundingBox())!;
  const light = async () => page.evaluate(() => { const r = document.querySelector('[data-reef]')!; return { x: Number(r.getAttribute('data-light-x')), y: Number(r.getAttribute('data-light-y')) }; });
  const l0 = await light();
  const far = (await fish(page)).filter(q => !q.target)
    .map(q => ({ ...q, d: Math.hypot((q.x - reef.x) / reef.width * 100 - l0.x, ((q.y - reef.y) / reef.height * 100 - l0.y) * 1.33) }))
    .sort((a, b) => b.d - a.d)[0];
  const line0 = await guideLine(page);
  await page.mouse.click(far.x, far.y);
  await page.waitForTimeout(200);
  const l1 = await light();
  expect(Math.hypot(l1.x - l0.x, l1.y - l0.y), 'the light moved to the tap').toBeGreaterThan(5);
  expect(await guideLine(page), 'a tap in the dark is not judged').toBe(line0);
  // now it is lit: tapping the look-alike is a kind "look again", not a find
  await shineAndTap(page, false);
  await until(async () => /look again|so close|check the fins|count the stripes/i.test(await guideLine(page)), 'the look-again line');
  expect(await found(page)).toBe(0);
  expect(await guideLine(page)).not.toMatch(/you found|wrong/i);
});
