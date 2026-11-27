import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, peek, until, finished, nextLevel, savedRewards, guideLine } from './helpers';

// Echo Song (Echo Caves): listen to the crystals' song and tap it back.

interface Echo { phase: string; level: number; seq: number[]; progress: number }
const state = (page: Page) => peek<Echo>(page, 'echo');

async function singBack(page: Page) {
  const s = await until(async () => { const v = await state(page); return v?.phase === 'echo' ? v : null; }, 'my turn to echo');
  for (const c of s.seq) {
    await page.locator(`[data-crystal="${c}"]`).click({ force: true });
    await page.waitForTimeout(120);
  }
}

test('Echo Song: levels 1–7 (up to the longest songs) sing to the finish', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await startGame(page, '/play/echo-song');
  for (let level = 1; level <= 7; level++) {
    await singBack(page);
    await until(() => finished(page), 'the party screen');
    expect((await savedRewards(page)).gameLevels['echo-song']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

test('Echo Song: a slipped echo replays the song, never counts as sung', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/echo-song');
  const s = await until(async () => { const v = await state(page); return v?.phase === 'echo' ? v : null; }, 'my turn');
  await page.locator(`[data-crystal="${(s.seq[0] + 1) % 4}"]`).click({ force: true });
  await until(async () => /slipped/i.test(await guideLine(page)), 'the "slipped" line');
  expect((await state(page))!.progress).toBe(0);
  await singBack(page);
  await until(() => finished(page), 'the party screen after a retry');
});

// Muse round 7: no way to re-hear the song; after a slip the song restarted at
// note 1 without saying so (so a tap meant as note 2 always "failed"); and
// tapping the friend did nothing.
test('Echo Song: "Again" replays, a slip keeps the notes already sung, the friend shows the next crystal', async ({ page }) => {
  await seedFamily(page, { levels: { 'echo-song': 4 } });
  await startGame(page, '/play/echo-song');
  let s = await until(async () => { const v = await state(page); return v?.phase === 'echo' ? v : null; }, 'my turn');
  // the replay button is there on my turn, and replaying keeps my turn intact
  await page.locator('[data-replay-song]').click();
  await until(async () => { const v = await state(page); return v?.phase === 'showing' ? v : null; }, 'the song playing again');
  s = await until(async () => { const v = await state(page); return v?.phase === 'echo' ? v : null; }, 'my turn again');
  // note 1 right, then a slip on note 2
  await page.locator(`[data-crystal="${s.seq[0]}"]`).click({ force: true });
  await page.locator(`[data-crystal="${(s.seq[1] + 1) % 4}"]`).click({ force: true });
  await until(async () => /slipped/i.test(await guideLine(page)), 'the "slipped" line');
  s = await until(async () => { const v = await state(page); return v?.phase === 'echo' ? v : null; }, 'my turn after the slip');
  expect(s.progress, 'note 1 stays sung after a slip on note 2').toBe(1);
  expect(await guideLine(page)).toMatch(/Carry on from note 2/);
  // ask the friend: the crystal that sings NEXT glows
  await page.getByRole('button', { name: /Ask .* for a hint/ }).click({ force: true });
  await expect(page.locator(`[data-crystal="${s.seq[1]}"] .hint-glow`)).toHaveCount(1);
  for (const c of s.seq.slice(1)) { await page.locator(`[data-crystal="${c}"]`).click({ force: true }); await page.waitForTimeout(120); }
  await until(() => finished(page), 'the party screen');
});
