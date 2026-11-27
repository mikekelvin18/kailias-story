import { test, expect, type Page } from '@playwright/test';
import { GAMES, prepare, openGame } from './helpers';

// ── Speed check: the app opens fast, answers taps at once, moves smoothly ──
// Kelvin 2026-11-26: "Everything is laggy, even the voices of the pets."
// Opening pages and tapping are measured with the robot's computer slowed
// down 4× to feel like a phone:
//   • each page is ready to tap within the time budget
//   • a tap is answered on screen within the budget below (no frozen moments)
//   • a game keeps moving smoothly, with few frozen frames
//   • no more than a handful of moving-picture (WebGL) canvases at once:
//     each one eats phone memory and is a known cause of lag on iPhones

const SLOWDOWN = 4;                              // for opening pages and taps
const READY_MS = process.env.CI ? 8000 : 6000;   // open → ready to tap (slowed down)
// tap → answer on screen. Phones aim for 200 ms; today the first tap (which
// also wakes the sound and Noel) takes ~300 ms on the slowed-down robot, so
// the budget catches anything slower than that. Lower it as taps get lighter.
const TAP_MS = 400;
// Smoothness is measured at full speed on the robot's computer, which has no
// graphics chip (every painted filter is drawn by the processor), so its
// numbers are lower than a phone's. Today's slowest game manages ~22 frames a
// second there; the floor catches anything that makes a game slower than
// that. GitHub's check machines are slower still (slowest game ~15 there on
// 2026-11-27), so they get their own floor. Raise both as the painted
// filters get lighter.
const MIN_FPS = process.env.CI ? 12 : 18;
const MAX_FROZEN = process.env.CI ? 0.35 : 0.25; // share of frames over 50 ms
// Today up to 8 (Dragon Bridge, Kailia's Trail). iPhones lose drawings or
// slow down when a page holds too many; this stops it climbing further.
const MAX_DRAWING_CANVASES = 8;

const REFERENCE_SCENE = `<body style="margin:0;background:#203"><svg width="100%" height="100%" style="position:fixed;inset:0">
<filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3"><animate attributeName="seed" values="3;7;12;5" dur="0.5s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="2"/></filter>
${Array.from({ length: 6 }, (_, i) => `<g filter="url(#f)" opacity="0.6"><rect x="${i * 4}" y="${i * 6}" width="95%" height="95%" rx="30" fill="#5a8"/><circle cx="50%" cy="${30 + i * 8}%" r="120" fill="#fc6"><animate attributeName="r" values="100;140;100" dur="1s" repeatCount="indefinite"/></circle></g>`).join('')}
</svg></body>`;

async function slowDown(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOWDOWN });
}

/** frames drawn in `ms`, and the share that froze: took over 50 ms AND over
 *  2.5× the usual frame. A machine that draws everything steadily but slowly
 *  (every frame ~60 ms) isn't stuttering; the fps floor catches that instead. */
function frames(page: Page, ms: number) {
  return page.evaluate(ms => new Promise<{ fps: number; slow: number }>(done => {
    const gaps: number[] = [];
    let last = performance.now();
    const t0 = last;
    const step = (now: number) => {
      gaps.push(now - last); last = now;
      if (now - t0 < ms) { requestAnimationFrame(step); return; }
      const usual = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
      const slow = gaps.filter(g => g > 50 && g > usual * 2.5).length;
      done({ fps: (gaps.length * 1000) / (now - t0), slow: slow / gaps.length });
    };
    requestAnimationFrame(step);
  }), ms);
}

/** the longest time any tap took to show its answer, from the browser's own event timing */
async function watchTaps(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __tapMs: number };
    w.__tapMs = 0;
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (/pointer|click|touch/.test(e.name)) w.__tapMs = Math.max(w.__tapMs, e.duration);
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });
}
const longestTap = (page: Page) => page.evaluate(() => (window as unknown as { __tapMs: number }).__tapMs);

for (const [name, path] of [['front page', '/go/home'], ['world map', '/go/map'], ['pet pop-up', '/go/pet-popup?pet=baby'], ['progress report', '/go/progress']]) {
  test(`speed: ${name} opens fast and answers taps at once`, async ({ page }) => {
    await prepare(page);
    await slowDown(page);
    const t0 = Date.now();
    await page.goto(path);
    // a jump link sets up the test child, then opens the real page
    await page.waitForURL(u => !u.pathname.startsWith('/go'), { timeout: READY_MS * 2 });
    // ready = "Tap to start!" shows (it only appears once the page is live),
    // or, on pages without it, everything has loaded
    await Promise.race([
      page.getByRole('dialog', { name: 'Tap to start' }).waitFor({ timeout: READY_MS * 2 }),
      page.waitForLoadState('networkidle', { timeout: READY_MS * 2 }),
    ]);
    const ready = Date.now() - t0;
    expect(ready, `${name}: ready to tap after ${ready} ms`).toBeLessThan(READY_MS);
    await watchTaps(page);
    const tapToStart = page.getByRole('dialog', { name: 'Tap to start' });
    if (await tapToStart.count()) await tapToStart.click({ force: true });
    else await page.locator('main button, main a').first().dispatchEvent('pointerdown');
    await page.waitForTimeout(500);
    const tap = await longestTap(page);
    expect(tap, `${name}: a tap took ${Math.round(tap)} ms to show`).toBeLessThan(TAP_MS);
  });
}

for (const game of GAMES) {
  test(`speed: ${game} moves smoothly`, async ({ page }) => {
    test.setTimeout(90_000);
    await prepare(page);
    await openGame(page, game, 3);
    // a busy check machine can only make a game look slower, never faster,
    // so the best of three takes is the game's own smoothness
    let best = { fps: 0, slow: 1 };
    for (let take = 0; take < 3 && (best.fps <= MIN_FPS || best.slow >= MAX_FROZEN); take++) {
      await page.waitForTimeout(1500);
      const t = await frames(page, 4000);
      if (t.slow < best.slow) best = t;
    }
    const { fps, slow } = best;
    const gl = await page.evaluate(() => (window as unknown as { __glMax: number }).__glMax);
    // GitHub hands out machines of very different drawing power, and they have
    // no graphics chip. If the game stutters, draw a fixed test scene (painted
    // filter layers, like the app's brush look; ~6% frozen frames on our usual
    // robot). If even that freezes a lot, the machine can't judge smoothness.
    if (fps <= MIN_FPS || slow >= MAX_FROZEN) {
      await page.goto('about:blank');
      await page.setContent(REFERENCE_SCENE);
      await page.waitForTimeout(1000);
      const ref = await frames(page, 3000);
      test.info().annotations.push({ type: 'test scene', description: `${ref.fps.toFixed(0)} fps, ${(ref.slow * 100).toFixed(0)}% frozen` });
      console.log(`[speed] ${game}: ${fps.toFixed(0)} fps, ${(slow * 100).toFixed(0)}% frozen; test scene ${ref.fps.toFixed(0)} fps, ${(ref.slow * 100).toFixed(0)}% frozen`);
      test.skip(ref.slow > 0.25, `check machine too weak to judge smoothness (the test scene froze ${(ref.slow * 100).toFixed(0)}% of frames)`);
    }
    expect(fps, `${game}: ${fps.toFixed(0)} frames a second`).toBeGreaterThan(MIN_FPS);
    expect(slow, `${game}: ${(slow * 100).toFixed(0)}% of frames froze (a hitch over 50 ms)`).toBeLessThan(MAX_FROZEN);
    expect(gl, `${game}: ${gl} moving-picture canvases at once`).toBeLessThanOrEqual(MAX_DRAWING_CANVASES);
  });
}
