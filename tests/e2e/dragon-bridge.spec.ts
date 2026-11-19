import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, peek, until, finished, guideLine, nextLevel, savedRewards } from './helpers';

// Dragon Bridge (Dragon's Treasure Cave, math): share berries fairly among
// the baby dragons and finish the stepping-stone patterns.

interface Bridge { phase: string; round: number; kind: 'share' | 'pattern'; counts: number[]; basket: number; unfair: boolean; crossing: boolean; right: number }
const state = (page: Page) => peek<Bridge>(page, 'bridge');
const playing = (page: Page) => until(async () => { const s = await state(page); return s?.phase === 'playing' && !s.crossing ? s : null; }, 'a round to play');

async function step(page: Page, s: Bridge) {
  if (s.kind === 'share') {
    const i = s.counts.indexOf(Math.min(...s.counts));
    await page.locator(`[data-baby="${i}"]`).click({ force: true });
  } else {
    await page.locator(`[data-opt="${s.right}"]`).click({ force: true });
  }
  await page.waitForTimeout(120);
}

async function playLevel(page: Page) {
  for (let guard = 0; guard < 200; guard++) {
    if (await finished(page)) return;
    const s = await state(page);
    if (!s || s.phase !== 'playing' || s.crossing) { await page.waitForTimeout(150); continue; }
    await step(page, s);
  }
  throw new Error('Dragon Bridge never reached its party screen');
}

test('Dragon Bridge: levels 1–6 share fairly, finish patterns and end', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/dragon-bridge');
  for (let level = 1; level <= 6; level++) {
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['dragon-bridge']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Dragon Bridge: a wrong stone is never praised and never fills the gap', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/dragon-bridge');
  // play until the first pattern round
  let s = await playing(page);
  while (s.kind !== 'pattern') { await step(page, s); s = await playing(page); }
  const before = s.round;
  const wrong = s.right === 0 ? 1 : 0;
  await page.locator(`[data-opt="${wrong}"]`).click({ force: true });
  await until(async () => /close|try again|fits/i.test(await guideLine(page)), 'kind "try again"');
  expect(await guideLine(page)).not.toMatch(/yes!|whole|fair and square/i);
  s = (await state(page))!;
  expect(s.round).toBe(before);
  expect(s.crossing).toBe(false);
  await page.locator(`[data-opt="${s.right}"]`).click({ force: true });
  await until(async () => /yes|whole/i.test(await guideLine(page)), 'praise for the right stone');
});

test('Dragon Bridge: a lopsided share is caught as not fair', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/dragon-bridge');
  const s = await playing(page);
  expect(s.kind).toBe('share');
  // keep giving berries to the first baby until the game asks
  for (let n = 0; n < s.basket && !(await state(page))!.unfair; n++) {
    await page.locator('[data-baby="0"]').click({ force: true });
    await page.waitForTimeout(100);
  }
  await until(async () => /is it fair/i.test(await guideLine(page)), 'the "is it fair?" question');
  expect(await guideLine(page)).not.toMatch(/fair and square/i);
});

for (const level of [15, 26, 31, 47]) {
  test(`Dragon Bridge: far level ${level} also finishes`, async ({ page }) => {
    await seedFamily(page, { levels: { 'dragon-bridge': level } });
    await startGame(page, '/play/dragon-bridge');
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['dragon-bridge']).toBe(level);
  });
}
