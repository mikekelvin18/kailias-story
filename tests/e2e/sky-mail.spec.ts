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
      expect(box.trim(), `the right mailbox for this sum`).toBe(String(sum));
    }
    const before = await card.getAttribute('data-index');
    const letter = await card.innerText();
    // next letter (new index), the bag's party, or back on the shelf. A swipe
    // made while the letter is still flying in is ignored, so a child (and
    // the robot) simply swipes again.
    let moved = false;
    for (let attempt = 0; attempt < 3 && !moved; attempt++) {
      await swipe(page, dir);
      moved = await until(() => page.evaluate(b => !!document.querySelector('[data-testid="game-finish"], [data-testid="game-intro"]') ||
        (document.querySelector('[data-card]')?.getAttribute('data-index') ?? b) !== b, before), 'the next letter', 3000).catch(() => false);
    }
    expect(moved, `the letter "${letter}" never went into its mailbox`).toBe(true);
  }
  throw new Error('a Sky Mail bag never finished');
}

// one check per mailbag so they run side by side (the whole shelf in one go
// takes the robot over five minutes)
const BAGS = ['Number Letters', 'Berry Battle', 'Silly Sentences', 'Wind Riders', 'Shape Twins', 'Feeling Finder', 'Rhyme Chime', 'Tricky Wind'];
for (const bagName of BAGS) {
  test(`Sky Mail: the "${bagName}" mailbag sorts to the end`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors = watchErrors(page);
    // Rhyme Chime and Tricky Wind join the shelf once a child reads
    await seedFamily(page, { strong: /Rhyme|Tricky/.test(bagName) });
    await page.goto('/play/sky-mail');
    await expect(page.getByTestId('game-intro')).toBeVisible();
    await page.locator('.gf-choice', { hasText: bagName }).first().click({ force: true });
    await sortBag(page);
    // back on the shelf (or its "Mailbag sorted!" party) with this bag starred
    if (await page.getByTestId('game-finish').isVisible()) {
      await expect(page.getByTestId('game-finish')).toContainText(/sorted|made it home/i);
    } else {
      await expect(page.getByTestId('game-intro')).toBeVisible();
      await expect(page.getByLabel('1 mailbags sorted')).toBeAttached();
    }
    expect(errors).toEqual([]);
  });
}

test('Sky Mail: a letter in the wrong mailbox bounces back with a hint', async ({ page }) => {
  await seedFamily(page);
  await page.goto('/play/sky-mail');
  await expect(page.getByTestId('game-intro')).toBeVisible();
  const card = page.locator('[data-card]');
  // a tap before the page is ready is simply tapped again
  await expect(async () => {
    if (!(await card.count())) await page.locator('.gf-choice').first().click({ force: true });
    await expect(card).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  const dir = (await card.getAttribute('data-correct'))!;
  const before = await card.innerText();
  await swipe(page, dir === 'left' ? 'right' : 'left');
  await until(async () => /almost|again|close|think|tricked|count|say both/i.test(await guideLine(page)), 'a hint');
  expect(await card.innerText()).toBe(before);
});
