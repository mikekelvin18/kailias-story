import { test, expect, type Page } from '@playwright/test';
import { seedFamily } from './helpers';

// The placement Challenge round (/assessment/games?challenge=1), Muse
// round 5: the question count tells the truth (an area that can only ask
// one or two harder questions never says "1/4"), the button always says
// what really comes next, and leaving part way offers "Carry on".

async function answer(page: Page, right: boolean) {
  const submit = page.getByRole('button', { name: /That’s my answer/ });
  // the question card bounces in; tap the choice again until it is picked
  for (let i = 0; i < 10 && !(await submit.isEnabled()); i++) {
    await page.locator(`button[data-correct="${right}"]`).first().click({ force: true });
    await page.waitForTimeout(150);
  }
  await submit.click();
  await expect(page.locator('[data-feedback]')).toBeVisible();
}
const nextButton = (page: Page) => page.getByRole('button', { name: /Next Question|Next Game|See My Results/ });
const ready = (page: Page) => page.evaluate(() => !!document.querySelector('button[data-correct]') && !document.querySelector('[data-feedback]'));

/** The footer: "Game g of G • … • Question n/T" or "Question n of up to T". */
async function count(page: Page) {
  const t = await page.locator('[data-challenge-counter]').innerText().catch(() => '');
  const m = t.match(/Game (\d+) of (\d+).*Question (\d+)(\/| of up to )(\d+)/);
  return m ? { game: +m[1], games: +m[2], q: +m[3], exact: m[4] === '/', total: +m[5], text: t } : null;
}

for (const [name, pattern] of [['every answer right', () => true], ['a miss now and then', (q: number) => q % 3 !== 2]] as const) {
  test(`Challenge round (${name}): the count is honest and the button matches it`, async ({ page }) => {
    test.setTimeout(150_000);
    await seedFamily(page, { ageMonths: 78 });
    await page.goto('/assessment/games?challenge=1');
    for (let q = 0; q < 40; q++) {
      if (page.url().includes('/results')) break;
      const c = await count(page);
      if (!(await ready(page)) || !c) { await page.waitForTimeout(300); continue; }
      expect(c.q).toBeLessThanOrEqual(c.total);
      expect(c.total).toBeLessThanOrEqual(4);
      await answer(page, pattern(q));
      const after = (await count(page))!;
      const label = await nextButton(page).innerText();
      if (after.exact && after.q === after.total) {
        expect(label, `after "${after.text}"`).toMatch(after.game === after.games ? /See My Results/ : /Next Game/);
      } else {
        expect(label, `after "${after.text}"`).toMatch(/Next Question/);
      }
      await nextButton(page).click({ force: true });
    }
    await expect(page).toHaveURL(/\/results/);
  });
}

test('Challenge round: leaving part way offers "Carry on" at the same spot', async ({ page }) => {
  test.setTimeout(120_000);
  await seedFamily(page, { ageMonths: 78 });
  await page.goto('/assessment/games?challenge=1');
  let answered = 0;
  let where = '';
  for (let q = 0; q < 40 && answered < 2; q++) {
    if (!(await ready(page))) { await page.waitForTimeout(300); continue; }
    await answer(page, true);
    answered++;
    where = await page.locator('[data-challenge-counter]').innerText();
    if (answered < 2) await nextButton(page).click({ force: true });
  }
  await page.goto('/results');
  await page.goto('/assessment/games?challenge=1');
  const card = page.locator('[data-challenge-resume]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('2 answered so far');
  await card.getByRole('button', { name: /Carry on/ }).click();
  await expect(page.locator('[data-challenge-counter]')).toHaveText(where, { timeout: 10_000 });
  await expect(nextButton(page)).toBeVisible();
  // and the rest of the round still finishes
  for (let q = 0; q < 60 && !page.url().includes('/results'); q++) {
    if (await nextButton(page).isVisible().catch(() => false)) { await nextButton(page).click({ force: true, timeout: 3000 }).catch(() => null); await page.waitForTimeout(300); continue; }
    if (await ready(page).catch(() => false)) await answer(page, true).catch(() => null); else await page.waitForTimeout(300);
  }
  await expect(page).toHaveURL(/\/results/);
  // a finished round leaves nothing to carry on
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem(`kailia_assessment_v1::${id}`) ?? '{}').challengeRound ?? null, 'child-robot'), 'a finished round leaves nothing to carry on').toBeNull();
});
