import { test, expect, type Page } from '@playwright/test';
import { GAMES, SIZES, prepare, openJump, openGame } from './helpers';

// ── Art check: every screen still looks the way Kelvin approved it ──
// Each screen is photographed on a phone held upright and turned sideways and
// compared with its approved picture in tests/look/pictures/. If an update
// changes how a screen looks, this check fails and shows the difference
// (expected / actual / diff) in the report, so nothing changes by accident.
//
// When a change is MEANT to change the look (and has been checked by eye on
// a phone): update the approved pictures with
//   npx playwright test --project=phone tests/look/pictures.spec.ts --update-snapshots
// and look at every changed picture before committing it.

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
const MOVING = new Set(['firefly-catch', 'reef-explorer', 'potion-sort', 'sensory']);

async function settle(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
}

for (const [name, path] of SCREENS) {
  test(`picture: ${name}`, async ({ page }) => {
    await prepare(page, { steadyRandom: true, still: true });
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openJump(page, path);
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-${size.name}.png`);
    }
  });
}

for (const game of GAMES) {
  test(`picture: ${game} (opening and playing)`, async ({ page }) => {
    test.setTimeout(90_000);
    await prepare(page, { steadyRandom: true, still: true });
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openJump(page, `/go/game/${game}?level=3`);
      await expect(page.getByTestId('game-intro')).toBeVisible({ timeout: 30_000 });
      await settle(page);
      await expect(page).toHaveScreenshot(`${game}-opening-${size.name}.png`);
      await openGame(page, game, 3);
      await settle(page);
      const mask = MOVING.has(game) ? [page.locator('[data-play-field]')] : [];
      await expect(page).toHaveScreenshot(`${game}-playing-${size.name}.png`, { mask });
    }
  });
}
