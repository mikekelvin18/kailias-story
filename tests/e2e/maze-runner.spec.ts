import { test, expect, type Page } from '@playwright/test';
import { seedFamily, watchErrors, startGame, hook, clearHook, expectFinish, nextLevel, savedRewards } from './helpers';

// Maze Runner (Firefly Forest, fine motor): a robot finger presses on GO and
// follows the glowing path to the flag, level after level, including the
// second lap where the mazes are mirrored and the path gets narrower.

interface Pt { x: number; y: number }
interface Maze { path: Pt[]; w: number; h: number }

async function traceMaze(page: Page, opts: { lift?: boolean } = {}) {
  const maze = await hook<Maze>(page, 'maze');
  const box = (await page.locator('canvas').first().boundingBox())!;
  const at = (p: Pt) => ({ x: box.x + (p.x / maze.w) * box.width, y: box.y + (p.y / maze.h) * box.height });
  const first = at(maze.path[0]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (let i = 2; i < maze.path.length + 1; i += 2) {
    const q = at(maze.path[Math.min(i, maze.path.length - 1)]);
    await page.mouse.move(q.x, q.y);
    // a child lifts their finger halfway and carries on from Kailia
    if (opts.lift && i === Math.floor(maze.path.length / 2)) {
      await page.mouse.up();
      await page.mouse.down();
    }
  }
  await page.mouse.up();
}

test('Maze Runner: levels 1–7 each reach the flag and the party (all five mazes, then the mirrored lap)', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await seedFamily(page, { motion: true });
  await startGame(page, '/play/fine-motor');
  for (let level = 1; level <= 7; level++) {
    await traceMaze(page, { lift: level % 2 === 0 });
    const finish = await expectFinish(page);
    await expect(finish).toContainText(/complete|did it/i);
    expect((await savedRewards(page)).gameLevels['fine-motor']).toBe(level);
    await clearHook(page, 'maze');
    await nextLevel(page);
  }
  expect(errors).toEqual([]);
});

test('Maze Runner: tapping the flag without tracing does not win', async ({ page }) => {
  await seedFamily(page);
  await startGame(page, '/play/fine-motor');
  const maze = await hook<Maze>(page, 'maze');
  const box = (await page.locator('canvas').first().boundingBox())!;
  const at = (p: Pt) => ({ x: box.x + (p.x / maze.w) * box.width, y: box.y + (p.y / maze.h) * box.height });
  // start on GO, then jump straight to the flag
  const go = at(maze.path[0]), flag = at(maze.path[maze.path.length - 1]);
  await page.mouse.move(go.x, go.y);
  await page.mouse.down();
  await page.mouse.move(flag.x, flag.y, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('game-finish')).toHaveCount(0);
});
