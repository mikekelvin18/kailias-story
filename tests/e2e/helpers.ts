import { expect, type Page, type ConsoleMessage } from '@playwright/test';

// ── Shared helpers for the robot players ──
// Every game check starts from a ready-made family on this device: a parent
// who agreed to the privacy notice, one child (6 years old) and a finished
// first check-up, so the games open straight away like they do for a real
// family. Nothing here touches a server.

export const CHILD_ID = 'child-robot';

export interface Seed {
  /** child's age in whole months (default 72 = 6 years) */
  ageMonths?: number;
  /** which friend the child picked (fox, turtle, owl, unicorn, dragon, parrot) */
  buddy?: string;
  /** skip the finished check-up (to test the check-up itself) */
  noAssessment?: boolean;
  /** start every game at this level instead of level 1 */
  levels?: Record<string, number>;
  /** keep all the moving scenery on (default: the grown-ups' "Reduce motion"
   *  switch is on, so the robot isn't chasing bobbing buttons and the checks
   *  run faster; game rules are the same either way) */
  motion?: boolean;
  /** a strong first check-up (school-age child scoring well), so games open
   *  their biggest set of challenges */
  strong?: boolean;
}

export async function seedFamily(page: Page, seed: Seed = {}) {
  const ageMonths = seed.ageMonths ?? 72;
  const now = new Date();
  const born = new Date(now.getFullYear(), now.getMonth() - ageMonths, 1);
  await page.addInitScript(({ ageMonths, born, buddy, noAssessment, levels, childId, motion, strong }) => {
    (window as unknown as { __KAILIA_TEST__: boolean }).__KAILIA_TEST__ = true;
    // seed once per test; later page loads keep what the games saved
    if (sessionStorage.getItem('robot-seeded')) return;
    sessionStorage.setItem('robot-seeded', '1');
    localStorage.clear();
    const at = new Date().toISOString();
    localStorage.setItem('kailia_family_v1', JSON.stringify({
      id: 'fam-robot', createdAt: at,
      consent: { agreedAt: at, policyVersion: '2026-07-draft-1', method: 'checkbox' },
      photoConsent: null,
      children: [{ id: childId, nickname: 'Robin', birthYear: born.y, birthMonth: born.m, avatar: buddy, createdAt: at }],
      activeChildId: childId,
      migratedLegacyData: true,
    }));
    if (!noAssessment) {
      localStorage.setItem(`kailia_assessment_v1::${childId}`, JSON.stringify({
        childName: 'Robin', childAge: Math.floor(ageMonths / 12), childAgeMonths: ageMonths,
        ageGroup: ageMonths < 12 ? 'infant' : ageMonths < 24 ? 'toddler' : ageMonths <= 59 ? 'preschool' : 'schoolAge',
        assessmentType: 'checklist', assessmentCompleted: true, sensoryCompleted: true,
        scores: strong ? { reading: 10, writing: 10, communication: 10, math: 10 } : { reading: 0, writing: 0, communication: 0, math: 0 },
        sensoryScores: { lowRegistration: 0, seeking: 0, sensitive: 0, avoiding: 0 },
        fineMotorInputMethod: null, graspPattern: null, fineMotorSubScores: null, evidence: {},
      }));
    }
    if (levels && Object.keys(levels).length) {
      // per-game highest level reached, so a game opens on the level asked for
      const best: Record<string, number> = {};
      for (const [g, l] of Object.entries(levels)) best[g] = l - 1;
      localStorage.setItem(`kailia_rewards_v1::${childId}`, JSON.stringify({ starlight: 0, gameLevels: best, celebratedCompanions: [] }));
    }
    // quiet: no voices or music during the checks
    localStorage.setItem('kailia_a11y_v1', JSON.stringify({ musicOn: false, volume: 0, reducedMotion: !motion }));
  }, { ageMonths, born: { y: born.getFullYear(), m: born.getMonth() + 1 }, buddy: seed.buddy ?? 'fox',
       noAssessment: !!seed.noAssessment, levels: seed.levels ?? {}, childId: CHILD_ID, motion: !!seed.motion, strong: !!seed.strong });
}

/** Collects page crashes and console errors so a test can fail on them. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`page error: ${e.message}`));
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // missing optional art / voice files and blocked media are not game bugs
    if (/Failed to load resource|404|play\(\) failed|NotAllowedError|AbortError|hydrat/i.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}

/** Opens a game and taps its big Play button. */
export async function startGame(page: Page, path: string, startButton = '.gf-cta') {
  await page.goto(path);
  await expect(page.getByTestId('game-intro')).toBeVisible({ timeout: 30_000 });
  await page.locator(`[data-testid="game-intro"] ${startButton}`).first().click({ force: true });
  await expect(page.getByTestId('game-intro')).toHaveCount(0);
}

/** Reads what a game shared with the robot (lib/testHooks.ts). */
export async function hook<T = unknown>(page: Page, name: string): Promise<T> {
  await page.waitForFunction(n => !!(window as unknown as { __kailia?: Record<string, unknown> }).__kailia?.[n], name);
  return page.evaluate(n => (window as unknown as { __kailia: Record<string, unknown> }).__kailia[n], name) as Promise<T>;
}

/** Clears a shared value so the robot can wait for the game to hand over a fresh one. */
export async function clearHook(page: Page, name: string) {
  await page.evaluate(n => { const k = (window as unknown as { __kailia?: Record<string, unknown> }).__kailia; if (k) delete k[n]; }, name);
}

/** Waits for the level-finished party and checks the level number on it. */
export async function expectFinish(page: Page, timeout = 30_000) {
  const finish = page.getByTestId('game-finish');
  await expect(finish).toBeVisible({ timeout });
  return finish;
}

/** On the party screen, taps "Level N+1" (and Play, for games that show their opening again). */
export async function nextLevel(page: Page, level?: number) {
  const cta = page.locator('[data-testid="game-finish"] .gf-cta').first();
  if (level != null) await expect(cta).toContainText(`Level ${level}`);
  await cta.click({ force: true });
  await expect(page.getByTestId('game-finish')).toHaveCount(0);
  const intro = page.getByTestId('game-intro');
  if (await intro.isVisible().catch(() => false)) {
    await intro.locator('.gf-cta').first().click({ force: true });
    await expect(intro).toHaveCount(0);
  }
}

/** Center of an element on screen. */
export async function centerOf(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) return null;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** Drags with a pointer from one spot to another in small steps, like a finger. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps });
  await page.mouse.up();
}

/** No counter on screen may run past its total ("7/6", "4 of 3"). */
export async function expectNoOverflowingCounters(page: Page) {
  const text = await page.locator('body').innerText();
  for (const m of text.matchAll(/(\d+)\s*(?:\/|of)\s*(\d+)/g)) {
    const [whole, a, b] = m;
    if (Number(a) > Number(b) && Number(b) > 0) throw new Error(`Counter ran past its total: "${whole}"`);
  }
}

/** Reads the progress saved for this child (rewards store). */
export async function savedRewards(page: Page) {
  return page.evaluate(id => JSON.parse(localStorage.getItem(`kailia_rewards_v1::${id}`) ?? 'null'), CHILD_ID);
}

/** Centers of every element matching `selector`, right now (never waits). */
export async function centers(page: Page, selector: string) {
  return page.evaluate(sel => [...document.querySelectorAll(sel)].map(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }).filter(r => r.w > 0 && r.h > 0), selector);
}

/** True when the level-finished party is on screen (never waits). */
export async function finished(page: Page) {
  return page.evaluate(() => !!document.querySelector('[data-testid="game-finish"]'));
}

/** Reads a shared value right now (null when the game hasn't shared it yet). */
export async function peek<T = unknown>(page: Page, name: string): Promise<T | null> {
  return page.evaluate(n => ((window as unknown as { __kailia?: Record<string, unknown> }).__kailia?.[n] ?? null), name) as Promise<T | null>;
}

/** The words Noel (or the game's guide) is saying right now. */
export async function guideLine(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-read-aloud], [data-guide]')].map(e => (e as HTMLElement).innerText).join(' | '));
}

/** Polls `fn` until it returns something truthy. */
export async function until<T>(fn: () => Promise<T | null | undefined | false | '' | 0>, what: string, timeout = 30_000): Promise<T> {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v as T;
    if (Date.now() > end) throw new Error(`Timed out waiting for: ${what}`);
    await new Promise(r => setTimeout(r, 100));
  }
}

/** Taps the first on-screen element matching any selector, in order. Returns which one, or null. */
export async function tapFirst(page: Page, selectors: string[]) {
  const hit = await page.evaluate(sels => {
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') {
          return { sel, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
    }
    return null;
  }, selectors);
  if (!hit) return null;
  await page.mouse.click(hit.x, hit.y);
  return hit.sel;
}

/** Keeps tapping (first matching selector wins) until the level-finished party shows. */
export async function playUntilFinished(page: Page, selectors: string[], what: string, maxTaps = 300) {
  for (let i = 0; i < maxTaps; i++) {
    if (await finished(page)) return;
    const hit = await tapFirst(page, selectors);
    await page.waitForTimeout(hit ? 250 : 200);
  }
  throw new Error(`${what} never reached its party screen`);
}
