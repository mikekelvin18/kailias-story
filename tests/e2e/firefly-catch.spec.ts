import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, expectFinish, nextLevel, savedRewards, centers, finished, drag } from './helpers';

// Firefly Catch (Firefly Forest, fine motor): tap every drifting firefly,
// then carry the sleepy ones into the lantern, for several levels.

async function playLevel(page: Page) {
  for (let guard = 0; guard < 400; guard++) {
    if (await finished(page)) return;
    const mode = await page.evaluate(() => document.querySelector('[data-mode]')?.getAttribute('data-mode'));
    const [at] = await centers(page, '[data-firefly]');
    if (!at) { await page.waitForTimeout(150); continue; }
    if (mode === 'drag') {
      const [lantern] = await centers(page, '[data-lantern]');
      await drag(page, at, lantern);
    } else {
      await page.mouse.click(at.x, at.y);
    }
    await page.waitForTimeout(80);
  }
  throw new Error('Firefly Catch never reached its party screen');
}

test('Firefly Catch: levels 1–4 catch every firefly and finish', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page, { motion: true });
  await startGame(page, '/play/firefly-catch');
  for (let level = 1; level <= 4; level++) {
    await playLevel(page);
    await expectFinish(page);
    expect((await savedRewards(page)).gameLevels['firefly-catch']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

// Muse round 7: after the first jar a reviewer thought the level had quietly
// restarted (no party, no starlight). Between parts the game says which part
// is done; a late tap (aimed where a firefly was a moment ago) still catches;
// a whole level ends with the party and starlight; and the grown-ups' level
// picker follows a level picked on the path.
test('Firefly Catch: parts are announced, late taps catch, a replay ends with the party', async ({ page }) => {
  test.setTimeout(180_000);
  await seedFamily(page, { motion: true, levels: { 'firefly-catch': 16 } });
  await page.goto('/play/firefly-catch');
  await expect(page.getByTestId('game-intro')).toBeVisible({ timeout: 30_000 });
  // grown-ups' picker: open it, then tap stone 1 on the path; the picker follows
  await page.getByRole('button', { name: 'Grown-ups: choose a level' }).click();
  const sum = await page.getByText(/Grown-ups: what is \d+ \+ \d+\?/).innerText();
  const [, a, b] = sum.match(/(\d+) \+ (\d+)/)!;
  await page.getByRole('button', { name: String(Number(a) + Number(b)), exact: true }).click();
  await expect(page.locator('[data-override-level]')).not.toHaveText('1');
  await page.getByRole('button', { name: 'Previous chapter' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Previous chapter' }).click({ force: true }).catch(() => {});
  await page.getByRole('button', { name: 'Level 1', exact: true }).click();
  await expect(page.locator('[data-override-level]')).toHaveText('1');
  await page.locator('[data-testid="game-intro"] .gf-cta').first().click({ force: true });
  // a tap aimed where the first firefly was ~0.25 s ago still catches it
  const [was] = await centers(page, '[data-firefly]');
  const before = await page.locator('[data-firefly]').count();
  await page.waitForTimeout(250);
  await page.mouse.click(was.x, was.y);
  await expect(page.locator('[data-firefly]')).toHaveCount(before - 1);
  // finish part 1: the "Part 1 of N done!" card shows
  for (let g = 0; g < 200 && !(await page.locator('[data-round-done]').count()); g++) {
    const [at] = await centers(page, '[data-firefly]');
    if (at) await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(60);
  }
  await expect(page.locator('[data-round-done]')).toContainText(/Part 1 of \d+ done/);
  await playLevel(page);
  await expectFinish(page);
});
