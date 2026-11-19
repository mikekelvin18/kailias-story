import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, expectNoOverflowingCounters } from './helpers';

// The first check-up's placement games (/assessment/games). A missed answer
// must never look like a right one: no praise, the child's pick is not
// green, and Noel kindly shows the real answer. A right answer is praised.
// Question counters never run past their total ("7/6").

const PRAISE = /Yes! You got it|That's it! Kailia cheers|Spot on, explorer|You figured it out|Exactly right/;
const GREEN = 'rgb(16, 185, 129)';

async function answer(page: Page, right: boolean) {
  const opt = page.locator(`button[data-correct="${right}"]`).first();
  const label = (await opt.innerText()).trim();
  await opt.click();
  await page.getByRole('button', { name: /That’s my answer/ }).click();
  const feedback = page.locator('[data-feedback]');
  await expect(feedback).toBeVisible();
  const said = await feedback.innerText();
  const picked = page.locator('button[data-picked="true"]');
  const border = await picked.evaluate(el => getComputedStyle(el).borderTopColor);
  if (right) {
    expect(said, `a right answer ("${label}") is praised`).toMatch(PRAISE);
    expect(await page.locator('button[data-shown-right="true"]').count()).toBe(0);
  } else {
    expect(said, `a miss ("${label}") is never praised`).not.toMatch(PRAISE);
    expect(said).toMatch(/^Nice try! Noel shows you: the answer is "/);
    const rightLabel = (await page.locator('button[data-correct="true"]').innerText()).replace(/·\s*the answer/i, '').trim();
    expect(said).toContain(rightLabel);
    expect(border, 'the child\'s missed pick is never green').not.toBe(GREEN);
    await expect(page.locator('button[data-shown-right="true"]')).toContainText('the answer');
  }
  await expectNoOverflowingCounters(page);
}

async function next(page: Page) {
  await page.getByRole('button', { name: /Next Question|Next Game|See My Results|Last part/ }).click();
}

test('Placement: misses get honest, kind feedback; right answers get praise; counters stay inside', async ({ page }) => {
  const errors = watchErrors(page);
  await seedFamily(page, { ageMonths: 78 });
  await page.goto('/assessment/games');
  await expect(page.getByText("Kailia's Treasure Hunt")).toBeVisible();
  for (let q = 0; q < 8; q++) {
    if (!(await page.getByText("Kailia's Treasure Hunt").isVisible())) break;
    await answer(page, q % 2 === 1);
    await next(page);
  }
  // reading done: on to the tracing game
  await expect(page.getByText(/Game 2 of 4/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Challenge round: reading, communication and math all finish, counters never pass 4', async ({ page }) => {
  await seedFamily(page, { ageMonths: 78 });
  await page.goto('/assessment/games?challenge=1');
  for (let q = 0; q < 20; q++) {
    if (page.url().includes('/results')) break;
    const counter = page.getByText(/Question \d+\/\d+/);
    if (!(await counter.isVisible().catch(() => false))) { await page.waitForTimeout(300); continue; }
    const [, a, b] = (await counter.innerText()).match(/Question (\d+)\/(\d+)/)!;
    expect(Number(a)).toBeLessThanOrEqual(Number(b));
    await answer(page, q % 3 !== 2);
    await next(page);
  }
  await expect(page).toHaveURL(/\/results/);
});
