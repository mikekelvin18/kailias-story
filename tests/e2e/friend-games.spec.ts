import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, peek, until, savedRewards } from './helpers';

// The six friends' signature games (Friends' adventures). Each runs inside
// one shared frame: rounds, the friend's cheers and "try again" lines, the
// level-done screen and the next level. The robot wins or misses rounds
// through the frame and checks the friend reacts honestly.

const GAMES = ['night-flight', 'vine-weave', 'gem-scales', 'star-letters', 'slow-waves', 'kiko-says'];

interface Friend { phase: string; level: number; round: number; rounds: number; results: boolean[]; line: string; between: boolean; cheers: string[]; tryAgain: string[] }
const state = (page: Page) => peek<Friend>(page, 'friendGame');
const finishRound = (page: Page, ok: boolean) =>
  page.evaluate(ok => (window as unknown as { __kailia: { friendGame: { finishRound: (ok: boolean) => void } } }).__kailia.friendGame.finishRound(ok), ok);

for (const id of GAMES) {
  test(`${id}: two levels play through, misses get "try again", wins get cheers`, async ({ page }) => {
    const errors = watchErrors(page);
    await seedFamily(page);
    await page.goto(`/play/friend-games/${id}`);
    for (let level = 1; level <= 2; level++) {
      await page.getByRole('button', { name: "Let's play!" }).click({ force: true });
      const s0 = await until(async () => { const v = await state(page); return v?.phase === 'play' ? v : null; }, 'the first round');
      // the real round is on screen and has something to tap or drag
      await expect(page.locator('main, body').first()).toBeVisible();
      for (let r = 0; r < s0.rounds; r++) {
        await until(async () => { const v = await state(page); return v && !v.between && v.results.length === r ? v : null; }, `round ${r + 1}`);
        const ok = r !== 1; // miss the second round on purpose
        await finishRound(page, ok);
        const s = await until(async () => { const v = await state(page); return v?.results.length === r + 1 ? v : null; }, 'the friend to react');
        if (ok) expect(s.cheers, `a win must be cheered: "${s.line}"`).toContain(s.line);
        else expect(s.tryAgain, `a miss must get a "try again", never a cheer: "${s.line}"`).toContain(s.line);
      }
      await until(async () => (await state(page))?.phase === 'done', 'the level-done screen');
      expect((await savedRewards(page)).gameLevels[id]).toBe(level);
      const counter = await page.locator('[aria-label^="Round "]').count();
      expect(counter, 'no round counter left over on the done screen').toBe(0);
      await page.getByRole('button', { name: 'Next level' }).click({ force: true });
    }
    expect(errors).toEqual([]);
  });
}
