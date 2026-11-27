import { test, expect, type Page } from '@playwright/test';
import { GAMES, SCREENS, SIZES, prepare, openJump, lookOver } from './helpers';

// ── Every screen, looked over like a person would ──
// Grok's play-test (Kelvin, 2026-11-27: "Grok seeing all these errors means
// your checker definitely doesn't work") found start buttons floating over
// the level picker, progress dots cut off, a dark title on a dark bar,
// a talking pop-up hidden under "Tap to start!" and a table cut off on a
// phone. The older checks only looked inside the play area. These look at
// the whole screen, at the top and scrolled to the bottom, phone upright and
// sideways, for every page and every game (opening and playing), and again
// with the biggest text:
//   • nothing you can tap is covered by something else
//   • nothing is cut off at the edge of the screen or of its box
//   • words are readable against what's behind them (4.5:1, big words 3:1)
//   • words never sit on a button they don't belong to
//   • only one pop-up is open at a time

async function settle(page: Page) { await page.waitForTimeout(1800); }

async function topAndBottom(page: Page, where: string) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const problems = await lookOver(page, `${where}, top`);
  // the page, or a scrolling box inside it (instantly: a smooth scroll would
  // still be moving while we look)
  const tall = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('body *')].filter(n => /(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 40);
    for (const b of boxes) b.scrollTo({ top: b.scrollHeight, behavior: 'instant' });
    const page = document.documentElement.scrollHeight > innerHeight + 40;
    if (page) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    return page || boxes.length > 0;
  });
  if (tall) {
    await page.waitForTimeout(500);
    problems.push(...await lookOver(page, `${where}, scrolled to the bottom`, { atEnd: true }));
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('body *')) if (b.scrollTop) b.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
  return problems;
}

/** Biggest text, set the way the Parent Zone sets it. */
async function bigText(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('kailia_sound_reset_v3', '1');
      const a = JSON.parse(localStorage.getItem('kailia_a11y_v1') || '{}');
      localStorage.setItem('kailia_a11y_v1', JSON.stringify({ ...a, textSize: 'xlarge' }));
    } catch { /* fine */ }
  });
}

// the reviewers' pages too (Grok: the age table showed only 2 columns on a phone)
const PAGES: [string, string][] = [...SCREENS, ['review', '/review'], ['review-ages', '/review/ages']];

for (const [name, path] of PAGES) {
  test(`screen: ${name} — nothing covered, cut off, unreadable or crowded (upright and sideways)`, async ({ page }) => {
    await prepare(page, { still: true });
    const problems: string[] = [];
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openJump(page, path);
      await settle(page);
      problems.push(...await topAndBottom(page, `${name} ${size.name}`));
    }
    expect([...new Set(problems)], `${name}: problems a person would see`).toEqual([]);
  });
}

for (const game of GAMES) {
  for (const text of ['normal', 'biggest'] as const) {
    test(`screen: ${game} with ${text} text — opening and playing look right (upright and sideways)`, async ({ page }) => {
      test.setTimeout(120_000);
      await prepare(page, { still: true });
      if (text === 'biggest') await bigText(page);
      const problems: string[] = [];
      for (const size of SIZES) {
        await page.setViewportSize(size);
        const where = `${game} ${size.name}, ${text} text`;
        await openJump(page, `/go/game/${game}?level=1`);
        const intro = page.getByTestId('game-intro');
        await expect(intro).toBeVisible({ timeout: 30_000 });
        await settle(page);
        problems.push(...await topAndBottom(page, `${where}, opening`));
        await intro.locator('.gf-cta, .gf-choice').first().click({ force: true });
        await expect(intro).toHaveCount(0);
        await settle(page);
        problems.push(...await lookOver(page, `${where}, playing`));
        // the game itself keeps the room: a talking panel or a title never
        // takes over the screen (Moonlight Match with big text)
        const field = await page.evaluate(() => {
          const f = document.querySelector('[data-play-field]');
          if (!f) return null;
          const r = f.getBoundingClientRect();
          return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) * Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) / (innerWidth * innerHeight);
        });
        if (field !== null && field < 0.3) problems.push(`${where}, playing: the game only has ${Math.round(field * 100)}% of the screen (at least 30%)`);
      }
      expect([...new Set(problems)], `${game}: problems a person would see`).toEqual([]);
    });
  }
}

// "Tap to start!" first, and only then anything else that pops up
// (Grok: "Tap to start" covered the "Your turn!" grown-up sheet)
for (const path of ['/go/talk?place=story-sparks&age=4', '/go/talk?place=trail-walk&age=6', '/go/pet-popup', '/go/daily-quests', '/go/new-friend']) {
  test(`one pop-up at a time: ${path} (before and after "Tap to start!")`, async ({ page }) => {
    await prepare(page, { still: true });
    await page.goto(path);
    const tap = page.getByRole('dialog', { name: 'Tap to start' });
    await expect(tap).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(3000);
    const problems = (await lookOver(page, `${path}, before tapping`)).filter(p => p.includes('two pop-ups'));
    await tap.click({ force: true });
    await expect(tap).toHaveCount(0);
    await page.waitForTimeout(2000);
    problems.push(...(await lookOver(page, `${path}, after tapping`)).filter(p => p.includes('two pop-ups')));
    expect(problems).toEqual([]);
  });
}
