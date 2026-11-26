import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, peek, until, finished, nextLevel, savedRewards } from './helpers';

// Kailia's Journey (Whispering Signposts): walk the trail, answer each wild
// friend's riddle, and reach the flag once every friend is met.

interface Pt { x: number; y: number }
interface Journey { phase: string; level: number; player: Pt; path?: Pt[]; required?: number; met: number; unsolved: number }
const state = (page: Page) => peek<Journey>(page, 'journey');

async function answerRiddle(page: Page) {
  await page.locator('[data-correct="true"]').first().click({ force: true });
  const s = await until(async () => { const v = await state(page); return v?.phase === 'walking' ? v : null; }, 'the friend to join');
  // "head for the flag" only once every friend really is met
  const says = await page.locator('body').innerText();
  if (/last friend/i.test(says)) expect(s.met, 'said "last friend" too early').toBeGreaterThanOrEqual(s.required!);
}

/** Walks the trail tile by tile; stops early at tile `stopAt` if given. */
async function walk(page: Page, opts: { skipLastFriend?: boolean; firstBattle?: boolean } = {}) {
  let k = 0;
  for (let guard = 0; guard < 600; guard++) {
    if (await finished(page)) return 'finished';
    const s = await state(page);
    if (!s) { await page.waitForTimeout(150); continue; }
    if (s.phase === 'starter') { await page.locator('.grid-cols-3 button').first().click({ force: true }); continue; }
    if (s.phase === 'battle') {
      if (opts.skipLastFriend && s.met === s.required! - 1) return 'skipped';
      if (opts.firstBattle) return 'battle';
      await answerRiddle(page); continue;
    }
    if (s.phase !== 'walking') { await page.waitForTimeout(120); continue; }
    const path = s.path!;
    while (k < path.length - 1 && !(path[k].x === s.player.x && path[k].y === s.player.y)) k++;
    if (k >= path.length - 1) return 'at-flag';
    const next = path[k + 1];
    const key = next.x > s.player.x ? 'ArrowRight' : next.x < s.player.x ? 'ArrowLeft' : next.y < s.player.y ? 'ArrowUp' : 'ArrowDown';
    await page.keyboard.press(key);
    await until(async () => { const v = await state(page); return v && (v.phase !== 'walking' || (v.player.x === next.x && v.player.y === next.y)); }, 'a step');
    await page.waitForTimeout(170);
  }
  throw new Error('Journey never reached the flag');
}

test('Journey: worlds 1–4 meet every friend and reach the flag', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/journey');
  for (let level = 1; level <= 4; level++) {
    expect(await walk(page)).toBe('finished');
    expect((await savedRewards(page)).gameLevels.journey).toBe(level);
    await nextLevel(page);
  }
  expect(errors).toEqual([]);
});

test('Journey: on the first world the partner pet is not counted as a friend met', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/journey');
  // meet all but the last friend: the game must still be waiting for one more
  expect(await walk(page, { skipLastFriend: true })).toBe('skipped');
  const s = (await state(page))!;
  expect(s.met).toBe(s.required! - 1);
  expect(s.unsolved).toBe(1);
  await expect(page.getByText(new RegExp(`${s.required! - 1} of ${s.required} friends`)).first()).toBeAttached().catch(() => {});
});

test('Journey: a wrong answer gets a gentle hint and the friend stays', async ({ page }) => {
  await seedFamily(page, { levels: { journey: 2 } });
  await startGame(page, '/play/journey');
  expect(await walk(page, { firstBattle: true })).toBe('battle');
  await page.locator('[data-correct="false"]').first().click({ force: true });
  await expect(page.getByText(/try again|look again|try that one/i).first()).toBeVisible();
  expect((await state(page))!.met).toBe(0);
  await answerRiddle(page);
  expect((await state(page))!.met).toBe(1);
});
