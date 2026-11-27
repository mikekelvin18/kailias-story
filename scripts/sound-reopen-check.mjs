// ── Robot check: sound comes back when the app is reopened ──
// Kelvin (2026-11-22): the iPhone home-screen app was silent every time he
// opened it, until he turned the sound button off and on. iPhones keep the
// page alive in the background and the old sound engines come back stuck.
// This robot (iPhone screen, touch taps) sends the app to the background and
// back, and checks that the next tap builds fresh, running sound engines, and
// that ordinary taps don't rebuild them.
//
// Run:  node scripts/sound-reopen-check.mjs [baseUrl] [path]

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const PATHS = process.argv[3] ? [process.argv[3]] : ['/', '/go/map', '/go/game/dragon-bridge'];

const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
let failed = 0;
for (const path of PATHS) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__ctx = [];
    const C = window.AudioContext;
    window.AudioContext = class extends C { constructor(...a) { super(...a); window.__ctx.push(this); } };
    let hid = false;
    Object.defineProperty(document, 'hidden', { get: () => hid });
    Object.defineProperty(document, 'visibilityState', { get: () => (hid ? 'hidden' : 'visible') });
    window.__setHidden = h => { hid = h; document.dispatchEvent(new Event('visibilitychange')); };
  });
  const states = () => p.evaluate(() => window.__ctx.map(x => x.state));
  const live = s => s.filter(x => x === 'running').length;
  await p.goto(BASE + path); await p.waitForTimeout(4000);
  await p.touchscreen.tap(195, 120); await p.waitForTimeout(800);
  const a = await states();
  await p.touchscreen.tap(195, 130); await p.waitForTimeout(800);
  const b = await states();
  await p.evaluate(() => window.__setHidden(true)); await p.waitForTimeout(500);
  await p.evaluate(() => window.__setHidden(false)); await p.waitForTimeout(500);
  await p.touchscreen.tap(195, 140); await p.waitForTimeout(800);
  const c = await states();
  const problems = [];
  if (live(a) < 1) problems.push('no sound engine running after the first tap');
  if (b.length !== a.length) problems.push('an ordinary tap rebuilt the sound');
  if (c.length <= b.length) problems.push('reopening did not start a fresh sound engine');
  if (live(c) < live(a)) problems.push(`after reopening only ${live(c)} engine(s) running`);
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${path.padEnd(26)} first tap ${a.join(',')} | reopened ${c.join(',')}${problems.length ? '  ← ' + problems.join('; ') : ''}`);
  if (problems.length) failed++;
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
