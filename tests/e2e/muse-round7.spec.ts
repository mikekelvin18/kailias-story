import { test, expect, type Page } from '@playwright/test';
import { seedFamily } from './helpers';

// Muse's round 7 review (2026-11-27). One check per thing it found, so the
// same problem can't slip back in unnoticed. Game-specific checks live in each
// game's own file; these cover screens shared by many games.

const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function introBottom(page: Page) {
  await expect(page.getByTestId('game-intro')).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('*').forEach(e => {
      if (e.scrollHeight > e.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight;
    });
  });
  await page.waitForTimeout(400);
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  // Item 4: "Go to my newest level (31)" showed the same number in every game
  // and sat on top of the Play button in four of them.
  test('the "newest level" button is this game\'s own and never covers Play', async ({ page }) => {
    await seedFamily(page, { levels: { 'firefly-trails': 14, 'dragon-bridge': 8 } });
    for (const [game, newest] of [['firefly-trails', 14], ['dragon-bridge', 8], ['hidden-friends', 0], ['reef-explorer', 0]] as const) {
      await page.goto(`/play/${game}`);
      await introBottom(page);
      // open the first chapter so the button has somewhere to jump back from
      const prev = page.getByRole('button', { name: 'Previous chapter' });
      for (let i = 0; i < 6 && await prev.isEnabled(); i++) await prev.click();
      const btn = page.locator('[data-newest-level]');
      if (newest > 5) {
        await expect(btn).toContainText(`(${newest})`);
        const cta = await page.locator('[data-testid="game-intro"] .gf-cta').first().boundingBox();
        const box = await btn.boundingBox();
        expect(overlap(box!, cta!), `${game}: newest-level button covers the start button`).toBe(false);
        const grown = await page.getByRole('button', { name: 'Grown-ups: choose a level' }).boundingBox();
        expect(overlap(box!, grown!), `${game}: newest-level button covers the grown-ups line`).toBe(false);
      }
    }
  });
});
