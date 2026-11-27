import { test, expect, type Page } from '@playwright/test';
import { GAMES, SIZES, prepare } from './helpers';

// ── Art check: every screen still looks the way Kelvin approved it ──
// Each screen is photographed on a phone held upright and turned sideways and
// compared with its approved picture in tests/look/pictures/. If an update
// changes how a screen looks, this check fails and shows the difference
// (expected / actual / diff) in the report, so nothing changes by accident.
//
// The approved pictures are taken on GitHub's check machine (fonts and
// drawing differ slightly between computers). When a change is MEANT to
// change the look (and has been checked by eye on a phone), push it with
// [update pictures] in the commit message: the check machine retakes the
// pictures and saves them to the branch. Look at every changed picture in
// that commit before merging. (Locally, --update-snapshots makes pictures
// for trying things out; don't commit those.)

const SCREENS: [string, string][] = [
  ['front-page', '/go/home'], ['story', '/go/story'], ['setup', '/go/setup'], ['try', '/go/try'],
  ['map', '/go/map'], ['map-all-open', '/go/map?all=1'],
  ['pet-popup-egg', '/go/pet-popup'], ['pet-popup-baby', '/go/pet-popup?pet=baby'], ['pet-popup-grown', '/go/pet-popup?pet=grown'],
  ['pet-popup-play', '/go/pet-popup?pet=little&task=play'], ['pet-popup-care', '/go/pet-popup?pet=little&task=care'],
  ['daily-quests', '/go/daily-quests'], ['new-friend', '/go/new-friend'], ['land-done', '/go/land-done'], ['land-sheet', '/go/land/dragons-cave'],
  ['friends', '/go/friends'], ['friend-sage', '/go/friend/sage'], ['garden', '/go/garden'],
  ['results', '/go/results'], ['progress', '/go/progress'], ['family', '/go/family'], ['activities', '/go/activities'],
  ['printables', '/go/printables'], ['upgrade', '/go/upgrade'],
];

// games whose targets fly, swim or fall on their own clock: their play field
// is covered in the picture (the framing and smoothness checks watch it live)
// cargo-count: its cargo floats and puffs smoke as it moves, so its play area differs a little each take
// (the masked area shows as a pink block in the approved picture)
const MOVING = new Set(['firefly-catch', 'reef-explorer', 'potion-sort', 'sensory', 'cargo-count']);

// The page's clock is frozen on one afternoon and only moves when the robot
// moves it, so each picture is taken at the same moment every run: the same
// daily task, the same line from Noel, the same spot in every timer.
const FROZEN_AT = new Date('2026-11-26T16:00:00Z');

async function tick(page: Page, ms: number) { await page.clock.runFor(ms); }

/** Moves the frozen clock in small steps until `ready()` says yes. */
async function tickUntil(page: Page, ready: () => Promise<boolean>, what: string) {
  for (let i = 0; i < 120; i++) {
    if (await ready()) return;
    await tick(page, 250);
    await page.waitForTimeout(100);
  }
  throw new Error(`never happened: ${what}`);
}

async function open(page: Page, path: string) {
  await page.goto(path);
  const tap = page.getByRole('dialog', { name: 'Tap to start' });
  // pages with "Tap to start!" show it once they're live; the others are
  // ready once the jump link has moved on to the real page
  await tickUntil(page, async () => (await tap.count()) > 0 || (!page.url().includes('/go/') && (await page.evaluate(() => document.readyState)) === 'complete'), `${path} opened`);
  await tick(page, 500);
  if (await tap.count()) {
    await tap.click({ force: true });
    await tickUntil(page, async () => (await tap.count()) === 0, 'Tap to start closed');
  }
}

async function settle(page: Page) {
  // a sound or music file can keep the network busy; don't wait on it forever
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  // fonts can stay "loading" on a busy check machine with the page clock frozen:
  // move the clock along until they're ready, but never wait more than ~10 s
  for (let i = 0; i < 40 && !(await page.evaluate(() => document.fonts.status === 'loaded')); i++) {
    await tick(page, 250);
    await page.waitForTimeout(250);
  }
  await tick(page, 1500);
  await page.waitForTimeout(300);
}

for (const [name, path] of SCREENS) {
  test(`picture: ${name}`, async ({ page }) => {
    await prepare(page, { steadyRandom: true, still: true });
    await page.clock.install({ time: FROZEN_AT });
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await open(page, path);
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-${size.name}.png`);
    }
  });
}

for (const game of GAMES) {
  test(`picture: ${game} (opening and playing)`, async ({ page }) => {
    test.setTimeout(120_000);
    await prepare(page, { steadyRandom: true, still: true });
    await page.clock.install({ time: FROZEN_AT });
    const intro = page.getByTestId('game-intro');
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await open(page, `/go/game/${game}?level=3`);
      await tickUntil(page, () => intro.isVisible(), 'the game opening');
      await settle(page);
      await expect(page).toHaveScreenshot(`${game}-opening-${size.name}.png`);
      // most games start with one big button; Snack Quest and Sky Mail start
      // by picking a place or a mailbag
      await intro.locator('.gf-cta, .gf-choice').first().click({ force: true });
      await tickUntil(page, async () => (await intro.count()) === 0, 'the game started');
      await settle(page);
      const mask = MOVING.has(game) ? [page.locator('[data-play-field]')] : [];
      await expect(page).toHaveScreenshot(`${game}-playing-${size.name}.png`, { mask });
    }
  });
}
