import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, until, finished, savedRewards, guideLine } from './helpers';

// Sky Mail (Owl's Tower): swipe each letter into the right mailbox, every
// mailbag on the shelf, until the whole shelf is sorted. Sums on the math
// letters are checked against the mailbox the game calls right.

async function swipe(page: Page, dir: string) {
  const b = (await page.locator('[data-card]').boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const d = 170;
  const [dx, dy] = dir === 'left' ? [-d, 0] : dir === 'right' ? [d, 0] : dir === 'up' ? [0, -d] : [0, d];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

function evalSum(text: string): number | null {
  const m = text.match(/(\d+)\s*([+−×])\s*(\d+)/);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[3]);
  return m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
}

async function sortBag(page: Page) {
  for (let guard = 0; guard < 60; guard++) {
    if (await finished(page)) return;
    if (await page.getByTestId('game-intro').isVisible()) return;
    const card = page.locator('[data-card]');
    if (!(await card.count())) { await page.waitForTimeout(150); continue; }
    const dir = (await card.getAttribute('data-correct'))!;
    const sum = evalSum(await card.innerText());
    if (sum !== null) {
      const box = await page.locator(`[data-box="${dir}"]`).innerText();
      expect(box.trim(), `the right mailbox for "${await card.innerText()}"`).toBe(String(sum));
    }
    const before = await card.innerText();
    await swipe(page, dir);
    await until(async () => (await finished(page)) || (await page.getByTestId('game-intro').isVisible()) ||
      ((await card.count()) > 0 && (await card.innerText()) !== before), 'the next letter', 8000).catch(() => {});
    await page.waitForTimeout(200);
  }
  throw new Error('a Sky Mail bag never finished');
}

test('Sky Mail: every mailbag sorts, and the shelf finishes', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await seedFamily(page);
  await page.goto('/play/sky-mail');
  for (let bag = 0; bag < 12 && !(await finished(page)); bag++) {
    await expect(page.getByTestId('game-intro')).toBeVisible();
    // the next unsorted bag ("Sort!"), so the shelf fills up
    await page.locator('.gf-choice', { hasText: 'Sort!' }).first().click({ force: true });
    await sortBag(page);
  }
  await expect(page.getByTestId('game-finish')).toBeVisible();
  expect((await savedRewards(page)).gameLevels['sky-mail']).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Sky Mail: a letter in the wrong mailbox bounces back with a hint', async ({ page }) => {
  await seedFamily(page);
  await page.goto('/play/sky-mail');
  await page.locator('.gf-choice').first().click({ force: true });
  const card = page.locator('[data-card]');
  const dir = (await card.getAttribute('data-correct'))!;
  const before = await card.innerText();
  await swipe(page, dir === 'left' ? 'right' : 'left');
  await until(async () => /almost|again|close|think|tricked|count|say both/i.test(await guideLine(page)), 'a hint');
  expect(await card.innerText()).toBe(before);
});
