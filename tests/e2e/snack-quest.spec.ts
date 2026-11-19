import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, peek, until, finished, guideLine, nextLevel, savedRewards } from './helpers';

// Snack Quest (Dragon's Treasure Cave, math): walk to snacks, carry exactly
// the number the baby dragon wishes for, and check her counting is honest:
// the right amount is praised, too many is never praised.

interface Snack {
  phase: string; round: number; want: number; have: number; kept: number; carried: number;
  items: { r: number; c: number; id: number }[]; cols: number; rows: number;
}

async function tapTile(page: Page, s: Snack, r: number, c: number) {
  const b = (await page.locator('[data-field]').boundingBox())!;
  const x = b.x + ((c + 0.5) / s.cols) * b.width, y = b.y + ((r + 0.5) / s.rows) * b.height;
  if (process.env.DEBUG_ROBOT) console.log('tap', r, c, await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e?.outerHTML.slice(0, 120) + ' pet:' + !!e?.closest('[data-pet]'); }, [x, y]), JSON.stringify(s));
  await page.mouse.click(x, y);
}

const state = (page: Page) => peek<Snack>(page, 'snack');

/** Walks to one snack and waits until Kailia is carrying it. */
async function pickOne(page: Page) {
  const s = (await until(async () => { const v = await state(page); return v?.phase === 'playing' ? v : null; }, 'a round to play'))!;
  const item = [...s.items].sort((a, b) => (b.r - a.r) - (a.c - b.c))[0];
  await tapTile(page, s, item.r, item.c);
  await until(async () => ((await state(page))?.carried ?? 0) > s.carried, 'picking up a snack');
}

async function deliver(page: Page) {
  const s = (await state(page))!;
  await tapTile(page, s, 1, 6);
  await until(async () => (await state(page))?.phase !== 'playing', 'the dragon to count');
}

async function playLevel(page: Page) {
  for (let guard = 0; guard < 80; guard++) {
    if (await finished(page)) return;
    const s = await state(page);
    if (!s || s.phase !== 'playing') { await page.waitForTimeout(200); continue; }
    const need = s.want - s.have - s.kept - s.carried;
    if (need > 0) await pickOne(page); else await deliver(page);
  }
  throw new Error('Snack Quest never reached its party screen');
}

test('Snack Quest: levels 1–4 feed the dragon exactly and finish', async ({ page }) => {
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/snack-quest', '.gf-choice');
  for (let level = 1; level <= 4; level++) {
    await playLevel(page);
    await expect(page.getByTestId('game-finish')).toBeVisible();
    expect((await savedRewards(page)).gameLevels['snack-quest']).toBe(level);
    // Snack Quest goes straight into the next feast
    await page.locator('[data-testid="game-finish"] .gf-cta').first().click({ force: true });
    await until(async () => (await state(page))?.round === 0 && !(await finished(page)), 'the next level');
  }
  expect(errors).toEqual([]);
});

test('Snack Quest: too many snacks is never praised, the right number is', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/snack-quest', '.gf-choice');
  const s = (await until(async () => { const v = await state(page); return v?.phase === 'playing' ? v : null; }, 'first round'))!;
  const need = s.want - s.have;
  for (let i = 0; i < need + 1; i++) await pickOne(page);
  await deliver(page);
  await until(async () => /too many/i.test(await guideLine(page)), 'kind "too many" feedback');
  const line = await guideLine(page);
  expect(line).not.toMatch(/exactly right|perfect|just the right/i);
  expect(line).toContain(`counted ${need + 1}`);
  // now do it right
  await until(async () => (await state(page))?.phase === 'playing', 'round to restart');
  for (let i = 0; i < need; i++) await pickOne(page);
  await deliver(page);
  await until(async () => (await state(page))?.round === 1 || /right|perfect|happy|yum/i.test(await guideLine(page)), 'praise for the right amount');
});
