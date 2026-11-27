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

// Kelvin 2026-11-27: the top card may show its shelf's ages only when the
// child's real age is inside them; other shelves' ages stay in the library fold.
test('Quest Library: the top card\'s ages always include the child\'s real age', async ({ page }) => {
  await seedFamily(page, { ageMonths: 9 * 12 }); // a 9-year-old lands on the 4–8 shelf
  await page.goto('/activities');
  await expect(page.getByText(/Big Adventurer/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-band-ages]')).toHaveCount(0);
});

// Item 9: on a 1919px screen the Journey world was a ~1000px strip with the
// path in its left third and the arrows alone in the far corner.
test.describe('on a big computer screen', () => {
  test.use({ viewport: { width: 1919, height: 1000 } });
  test('Journey: the world fills the width, the whole trail is in view, arrows sit by Noel', async ({ page }) => {
    await seedFamily(page, { levels: { journey: 2 } });
    await page.goto('/play/journey');
    await page.locator('[data-testid="game-intro"] .gf-cta').first().click({ force: true });
    const map = page.locator('[data-journey-map]');
    await expect(map).toBeVisible();
    await page.waitForTimeout(500);
    const box = (await map.boundingBox())!;
    expect(box.width, 'the world is as wide as the screen').toBeGreaterThan(1919 * 0.85);
    expect(box.y, 'the top of the world is on screen').toBeGreaterThan(-5);
    expect(box.y + box.height, 'the bottom of the world sits above Noel\'s bar').toBeLessThanOrEqual(1000 - 100);
    const pad = (await page.locator('[data-dpad]').boundingBox())!;
    expect(pad.y, 'the arrows are in the bottom bar').toBeGreaterThan(1000 - 200);
    expect(pad.x, 'the arrows are beside Noel, not in the far corner').toBeLessThan(1919 * 0.6);
  });
});

// Item 10: the Parent Zone showed two identical "Robin" buttons. Test Robins
// made by jump links fold into one on the Parent Zone itself, not only when a
// jump link opens; other children stay.
test('Parent Zone: duplicate test Robins fold into one', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    const at = new Date().toISOString();
    const kid = (id: string, nickname: string) => ({ id, nickname, birthYear: 2020, birthMonth: 5, avatar: 'fox', createdAt: at });
    localStorage.setItem('kailia_family_v1', JSON.stringify({
      id: 'fam-preview', createdAt: at,
      consent: { agreedAt: at, policyVersion: '2026-07-draft-1', method: 'checkbox' }, photoConsent: null,
      children: [kid('child-jump', 'Robin'), kid('child-old-1', 'Robin'), kid('child-test', 'Test Kid')],
      activeChildId: 'child-jump', migratedLegacyData: true,
    }));
  });
  await page.goto('/family');
  await page.waitForTimeout(1500);
  const fam = await page.evaluate(() => JSON.parse(localStorage.getItem('kailia_family_v1')!));
  expect(fam.children.filter((c: { nickname: string }) => c.nickname === 'Robin')).toHaveLength(1);
  expect(fam.children.map((c: { nickname: string }) => c.nickname)).toContain('Test Kid');
});

// Item 14: on a short computer screen Sky Mail's opening showed only Noel's
// words and the play controls; the mailbags (the menu) were below the fold and
// faded in late. A "Pick a mailbag" line and the first mailbag show at once.
test('Sky Mail: the mailbag menu shows on arrival at desktop height', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 600 });
  await seedFamily(page);
  await page.goto('/play/sky-mail');
  await expect(page.getByTestId('game-intro')).toBeVisible({ timeout: 30_000 });
  const hint = page.locator('[data-mailbag-hint]');
  await expect(hint).toBeInViewport();
  await expect(hint).toContainText(/ways to play/);
  await hint.click();
  await expect(page.locator('[data-mailbags] .gf-choice').first()).toBeInViewport();
});

// Item 15: the break reminder covered the map with one way out. The big X,
// Escape and a tap on the dim space around it all set it aside.
test('Break reminder: easy to set aside', async ({ page }) => {
  await seedFamily(page);
  for (const how of ['x', 'escape', 'outside'] as const) {
    await page.goto('/go/break');
    const box = page.getByTestId('break-screen');
    await expect(box).toBeVisible({ timeout: 30_000 });
    await page.getByRole('dialog', { name: 'Tap to start' }).click({ force: true, timeout: 3000 }).catch(() => {});
    if (how === 'x') await page.getByRole('button', { name: 'Not now, back to play' }).click();
    else if (how === 'escape') await page.keyboard.press('Escape');
    else await box.click({ position: { x: 6, y: 830 } });
    await expect(box).toHaveCount(0);
  }
});

// Item 16: /go/challenge was a hidden path. It now opens the Challenge round.
test('/go/challenge opens the Challenge round', async ({ page }) => {
  await page.goto('/go/challenge');
  await expect(page).toHaveURL(/\/assessment\/games\?challenge=1/, { timeout: 30_000 });
  await expect(page.getByText(/Challenge round/i).first()).toBeVisible({ timeout: 30_000 });
});
