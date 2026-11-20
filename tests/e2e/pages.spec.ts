import { test, expect } from '@playwright/test';
import { seedFamily, watchErrors } from './helpers';

// Every main page opens without crashing, for a family that has finished the
// first check-up (games are played in their own checks).

const PAGES = [
  '/', '/play', '/play/garden', '/play/friends', '/activities', '/printables', '/results', '/progress',
  '/family', '/story', '/privacy', '/retention', '/upgrade',
];

for (const path of PAGES) {
  test(`${path} opens without errors`, async ({ page }) => {
    const errors = watchErrors(page);
    await seedFamily(page);
    const res = await page.goto(path);
    expect(res?.status(), `${path} answered`).toBeLessThan(400);
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error/);
    expect(errors).toEqual([]);
  });
}
