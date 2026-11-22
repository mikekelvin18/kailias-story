import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, until, finished, nextLevel, savedRewards, guideLine } from './helpers';

// Moonlight Match (Owl's Tower, memory): turn over feathers two at a time
// and find every pair of twins.

async function downCards(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-mkey][data-state="down"]')].map((e, i) => ({ key: e.getAttribute('data-mkey')!, i })));
}

async function flipPair(page: Page, key: string) {
  const pair = page.locator(`[data-mkey="${key}"][data-state="down"]`);
  await pair.nth(0).click({ force: true });
  await page.locator(`[data-mkey="${key}"][data-state="down"]`).first().click({ force: true });
  await until(async () => (await page.locator(`[data-mkey="${key}"][data-state="matched"]`).count()) === 2, `twins ${key} to match`);
  await page.waitForTimeout(150);
}

async function playLevel(page: Page) {
  for (let guard = 0; guard < 60; guard++) {
    if (await finished(page)) return;
    const down = await downCards(page);
    if (!down.length) { await page.waitForTimeout(200); continue; }
    const counts = new Map<string, number>();
    down.forEach(c => counts.set(c.key, (counts.get(c.key) ?? 0) + 1));
    const key = [...counts].find(([, n]) => n >= 2)?.[0];
    expect(key, 'every feather left face-down has a twin').toBeTruthy();
    await flipPair(page, key!);
  }
  throw new Error('Moonlight Match never reached its party screen');
}

test('Moonlight Match: levels 1–6 match every pair and finish', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/moonlight-match');
  for (let level = 1; level <= 6; level++) {
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['moonlight-match']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Moonlight Match: two different feathers are "not twins" and turn back over', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/moonlight-match');
  const down = await until(async () => { const d = await downCards(page); return d.length ? d : null; }, 'the feathers');
  const a = down[0].key, b = down.find(c => c.key !== a)!.key;
  await page.locator(`[data-mkey="${a}"]`).first().click({ force: true });
  await page.locator(`[data-mkey="${b}"]`).first().click({ force: true });
  await until(async () => /not twins/i.test(await guideLine(page)), '"not twins"');
  await until(async () => (await page.locator('[data-state="up"]').count()) === 0, 'feathers turning back');
  expect(await page.locator('[data-state="matched"]').count()).toBe(0);
});

test("Moonlight Match: after two misses the twin glows with a ring you can see (Muse round 5)", async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/moonlight-match');
  await until(async () => (await downCards(page)).length > 0, 'the feathers');
  for (let m = 0; m < 2; m++) {
    const down = await downCards(page);
    const a = down[0].key, b = down.find(c => c.key !== a)!.key;
    await page.locator(`[data-mkey="${a}"][data-state="down"]`).first().click({ force: true });
    await page.locator(`[data-mkey="${b}"][data-state="down"]`).first().click({ force: true });
    await until(async () => (await page.locator('[data-state="up"]').count()) === 0, 'feathers turning back');
    await until(async () => /not twins/i.test(await guideLine(page)), '"not twins"');
    await page.waitForTimeout(600);
  }
  const first = (await downCards(page))[0].key;
  await page.locator(`[data-mkey="${first}"][data-state="down"]`).first().click({ force: true });
  const hinted = page.locator('[data-hint="1"]');
  await expect(hinted).toHaveCount(1);
  expect(await hinted.getAttribute('data-mkey'), 'the glowing card is the twin').toBe(first);
  // the ring is drawn on top of the card (it used to sit hidden underneath)
  const onTop = await hinted.evaluate(card => {
    const ring = card.querySelector('.mm-hint') as HTMLElement | null;
    if (!ring) return 'no ring';
    const cs = getComputedStyle(ring);
    // drawn after (so above) the turning card, raised, with the golden glow
    const after = card.lastElementChild === ring;
    return after && Number(cs.zIndex) > 0 && cs.boxShadow.includes('253, 224, 71') && ring.getBoundingClientRect().width >= card.getBoundingClientRect().width ? 'ok' : `ring after=${after} z=${cs.zIndex} shadow=${cs.boxShadow}`;
  });
  expect(onTop).toBe('ok');
});

test('Moonlight Match: the squirrel pair shows its picture and matches', async ({ page }) => {
  test.setTimeout(120_000);
  // creature rounds pick 4 of 10 animals; reopen until the squirrel is dealt
  await seedFamily(page);
  for (let tries = 0; tries < 15; tries++) {
    await startGame(page, '/play/moonlight-match');
    await until(async () => (await downCards(page)).length > 0, 'the feathers');
    if (await page.locator('[data-mkey="pic:squirrel"]').count()) break;
  }
  await expect(page.locator('[data-mkey="pic:squirrel"]')).toHaveCount(2);
  await flipPair(page, 'pic:squirrel');
  const pic = await page.locator('[data-mkey="pic:squirrel"]').first().evaluate(e => !!e.querySelector('img, svg image, svg path'));
  expect(pic, 'the squirrel card has a picture').toBe(true);
});
