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

// Item 8: the Quest Library shelves said only "Band 1"–"Band 4", and Today's
// Quests followed whichever shelf a grown-up browsed (a 6-year-old got baby
// quests). Every shelf names its ages; today's quests stay on the child's own.
test('Quest Library: every shelf shows its ages and today\'s quests stay on the child\'s shelf', async ({ page }) => {
  await seedFamily(page, { ageMonths: 72 });
  await page.goto('/activities');
  await expect(page.locator('[data-band-ages]')).toContainText(/years|months/);
  const today = async () => (await page.locator('h3, p.font-extrabold').allInnerTexts()).join('|');
  await page.getByRole('button', { name: /Peek at the whole library/ }).click();
  const shelves = page.locator('[data-band-button]');
  await expect(shelves).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(shelves.nth(i)).toContainText(/\d.*(months|years)/);
  await expect(page.locator('[data-band-button="4"]')).toContainText(/shelf/);
  const before = await page.locator('[data-band-ages]').innerText();
  const quests = await today();
  await page.locator('[data-band-button="1"]').click();
  await expect(page.locator('[data-other-band]')).toContainText('6–18 months');
  expect(await page.locator('[data-band-ages]').innerText()).toBe(before);
  expect(await today()).toContain(quests.split('|').find(t => /Dragon|Cut|Delivery/.test(t)) ?? '');
  await page.getByRole('button', { name: /Back to .* shelf/ }).click();
  await expect(page.locator('[data-other-band]')).toHaveCount(0);
});
