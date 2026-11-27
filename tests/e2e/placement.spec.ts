import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, expectNoOverflowingCounters } from './helpers';

// The first check-up's placement games (/assessment/games). A missed answer
// must never look like a right one: no praise, the child's pick is not
// green, and Noel kindly shows the real answer. A right answer is praised.
// Question counters never run past their total ("7/6").

const PRAISE = /Yes! You got it|That's it! Kailia cheers|Spot on, explorer|You figured it out|Exactly right/;
const GREEN = 'rgb(16, 185, 129)';

async function answer(page: Page, right: boolean) {
  // the next question must be on screen (no feedback left from the last one)
  await expect(page.locator('[data-feedback]')).toHaveCount(0);
  const opt = page.locator(`button[data-correct="${right}"]`).first();
  const label = (await opt.innerText()).trim();
  // a tap during the question's swap-in is tapped again, like a child would
  for (let i = 0; i < 5 && !(await page.locator('button[data-picked="true"]').count()); i++) {
    await opt.click({ force: true });
    await page.waitForTimeout(150);
  }
  await page.getByRole('button', { name: /That’s my answer/ }).click({ force: true });
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
  await page.getByRole('button', { name: /Next Question|Bonus question|Next Game|See My Results|Last part/ }).click({ force: true });
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
  for (let q = 0; q < 60; q++) {
    if (page.url().includes('/results')) break;
    // "Question 2/4" or "Question 2 of up to 4"
    const counter = page.locator('[data-challenge-counter]');
    const ready = await page.evaluate(() => !!document.querySelector('button[data-correct]') && !document.querySelector('[data-feedback]'));
    if (!ready || !(await counter.isVisible().catch(() => false))) { await page.waitForTimeout(300); continue; }
    const [, a, b] = (await counter.innerText()).match(/Question (\d+)\s*(?:\/|of up to)\s*(\d+)/)!;
    expect(Number(a)).toBeLessThanOrEqual(Number(b));
    await answer(page, q % 3 !== 2);
    await next(page);
  }
  await expect(page).toHaveURL(/\/results/);
});

// Muse round 7: the dashes said "6 of 6" while the footer said "/8". Every
// game is 6 questions; extra rungs for a child who aces it are "Bonus".
test('Placement: an all-right run counts "of 6" and then "Bonus question", never past 6', async ({ page }) => {
  await seedFamily(page, { ageMonths: 72, noAssessment: true });
  await page.goto('/assessment/games');
  await expect(page.getByText("Kailia's Treasure Hunt")).toBeVisible();
  let bonus = 0;
  for (let q = 0; q < 10; q++) {
    if (!(await page.getByText("Kailia's Treasure Hunt").isVisible())) break;
    const counter = (await page.locator('[data-placement-counter]').innerText()).trim();
    const m = counter.match(/Question (\d+) of (\d+)/);
    if (m) {
      expect(Number(m[2]), counter).toBe(6);
      expect(Number(m[1])).toBeLessThanOrEqual(6);
      expect(bonus, 'no "Question n of 6" after a bonus question').toBe(0);
    } else { expect(counter).toMatch(/Bonus question \d/); bonus++; }
    // the little bars above agree: six, plus one gold bar per bonus reached
    await answer(page, true);
    await next(page);
  }
  expect(bonus, "an all-right run reaches the bonus questions").toBeGreaterThanOrEqual(1);
  expect(bonus).toBeLessThanOrEqual(2);
});

// Muse round 7: answering Q1, leaving and coming back restarted at Question 1.
test('Placement: leaving after a question carries on from the same spot', async ({ page }) => {
  await seedFamily(page, { ageMonths: 72, noAssessment: true });
  await page.goto('/assessment/games');
  await expect(page.getByText("Kailia's Treasure Hunt")).toBeVisible();
  await answer(page, true);
  await next(page);
  await expect(page.locator('[data-placement-counter]')).toContainText('Question 2 of 6');
  await page.goto('/play');
  await page.goto('/assessment/games');
  await expect(page.locator('[data-placement-resume]')).toContainText('question 2 of the reading game');
  await page.getByRole('button', { name: /Keep going/ }).click();
  await expect(page.locator('[data-placement-counter]')).toContainText('Question 2 of 6');
  // answered-but-not-moved-on also comes back answered
  await answer(page, false);
  await page.reload();
  await page.getByRole('button', { name: /Keep going/ }).click();
  await expect(page.locator('[data-placement-counter]')).toContainText('Question 2 of 6');
  await expect(page.getByRole('button', { name: /Next Question/ })).toBeVisible();
});
