import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, peek, until, finished, guideLine, nextLevel, savedRewards } from './helpers';

// Word Wizard (Whispering Signposts, reading): pop the balloon with the right
// word. Checks every question has its answer among the balloons, the right
// balloon is praised, and a miss reads the word back kindly.

interface Reading { phase: string; level: number; q: number; of: number; answer?: string; choices?: string[]; prompt?: string; visual?: string; popped: string | null }
const state = (page: Page) => peek<Reading>(page, 'reading');
const choice = (page: Page, word: string) => page.locator(`[data-choice="${word.replace(/"/g, '\\"')}"]`);

/** Taps a balloon where a finger would: on its middle, and checks nothing covers it. */
async function tapChoice(page: Page, word: string) {
  const el = choice(page, word);
  await expect(el).toBeVisible();
  const b = (await el.boundingBox())!;
  const x = b.x + b.width / 2, y = b.y + b.height * 0.35;
  const top = await page.evaluate(([x, y, w]) => {
    const e = document.elementFromPoint(x, y);
    return e?.closest(`[data-choice]`)?.getAttribute('data-choice') === w ? 'ok' : (e?.outerHTML.slice(0, 160) ?? 'nothing');
  }, [x, y, word] as const);
  expect(top, `something covers the "${word}" balloon`).toBe('ok');
  await page.mouse.click(x, y);
}

async function playLevel(page: Page) {
  const seen: string[] = [];
  for (let guard = 0; guard < 60; guard++) {
    if (await finished(page)) return seen;
    const s = await state(page);
    if (!s || s.phase !== 'playing' || !s.answer || s.popped) { await page.waitForTimeout(150); continue; }
    expect(s.choices, `answer "${s.answer}" must be one of the balloons for "${s.prompt}"`).toContain(s.answer);
    expect(new Set(s.choices).size, 'no two balloons say the same thing').toBe(s.choices!.length);
    seen.push(`${s.visual} ${s.prompt} → ${s.answer}`);
    await tapChoice(page, s.answer);
    await until(async () => (await finished(page)) || (await state(page))?.q !== s.q, 'the next word');
  }
  throw new Error('Word Wizard never reached its party screen');
}

test('Word Wizard: every chapter of words plays to the finish', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await seedFamily(page, { ageMonths: 48 }); // a 4-year-old starts at level 1
  await startGame(page, '/play/reading');
  for (let level = 1; level <= 6; level++) {
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['word-wizard']).toBe(level);
    await nextLevel(page, level + 1);
  }
  expect(errors).toEqual([]);
});

for (const level of [11, 16, 21, 26, 31]) {
  test(`Word Wizard: level ${level} plays to the finish`, async ({ page }) => {
    await seedFamily(page, { ageMonths: 48, levels: { 'word-wizard': level } });
    await startGame(page, '/play/reading');
    await playLevel(page);
    expect((await savedRewards(page)).gameLevels['word-wizard']).toBe(level);
  });
}

test('Word Wizard: a wrong balloon is read back kindly, never praised', async ({ page }) => {
  await seedFamily(page, { ageMonths: 48 });
  await startGame(page, '/play/reading');
  const s = await until(async () => { const v = await state(page); return v?.answer ? v : null; }, 'first word');
  const wrong = s.choices!.find(c => c !== s.answer)!;
  await choice(page, wrong).click({ force: true });
  await until(async () => (await guideLine(page)).includes(`That one says "${wrong}"`), 'the word read back');
  expect((await state(page))!.q).toBe(s.q);
  expect((await state(page))!.popped).toBeNull();
  // a second miss makes the friend point at the right one
  const wrong2 = s.choices!.find(c => c !== s.answer && c !== wrong) ?? wrong;
  await choice(page, wrong2).click({ force: true });
  await until(async () => /found the glowing one/.test(await guideLine(page)), 'the friend hint');
  await choice(page, s.answer!).click({ force: true });
  await until(async () => (await state(page))?.popped === s.answer, 'the right balloon to pop');
});
