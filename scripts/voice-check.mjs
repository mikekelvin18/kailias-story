// ── Robot check: Noel's lines play to the end ──
// Kelvin (2026-11-22): in games opened from a link, Noel said "The baby
// dragons…" and stopped. The story card's reader was hushing the game's own
// first line when the card closed. This robot opens every game the way a
// phone does (iPhone screen, touch taps, sound only after a real tap) and
// fails if any voice clip is stopped part-way when nothing new replaced it.
//
// Two ways in, for every game:
//   link: open /go/game/<id> fresh, scroll, tap Play (first tap of the visit)
//   map:  open the map, tap once, walk to the game inside the app, let the
//         story start, then tap Play
//
// Run:  node scripts/voice-check.mjs [baseUrl] [game ...]
//       (default http://localhost:3000; needs Playwright with Chromium)

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const GAMES = process.argv.slice(3).length ? process.argv.slice(3) : [
  'dragon-bridge', 'firefly-catch', 'firefly-trails', 'moonlight-match', 'potion-sort',
  'snack-quest', 'sky-mail', 'story-sparks', 'trail-walk', 'hidden-friends', 'cargo-count',
  'reef-explorer', 'echo-song', 'reading', 'sensory', 'fine-motor',
];
const LISTEN = 14000; // ms after Play to keep listening

function spy() {
  const T0 = performance.now();
  const log = (window.__voice = []);
  window.__taps = [];
  document.addEventListener('touchend', () => window.__taps.push(performance.now() - T0), true);
  const isVoice = el => /\/voice\//.test(el.currentSrc || el.src || '');
  const file = el => (el.currentSrc || el.src).split('/').slice(-2).join('/');
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (!this.__spied) {
      this.__spied = true;
      this.addEventListener('playing', () => isVoice(this) && log.push({ t: performance.now() - T0, ev: 'start', f: file(this) }));
      this.addEventListener('ended', () => isVoice(this) && log.push({ t: performance.now() - T0, ev: 'end', f: file(this) }));
    }
    const f = isVoice(this) ? file(this) : null;
    const card = this.dataset.owner === 'read-aloud';
    const r = play.call(this);
    r.catch(e => f && e?.name === 'AbortError' && log.push({ t: performance.now() - T0, ev: 'cut', f, at: 0, of: 0, card }));
    return r;
  };
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function () {
    if (!this.paused && isVoice(this) && this.currentTime > 0 && this.currentTime < this.duration - 0.05)
      log.push({ t: performance.now() - T0, ev: 'cut', f: file(this), at: +this.currentTime.toFixed(2), of: +this.duration.toFixed(2), card: this.dataset.owner === 'read-aloud' });
    return pause.call(this);
  };
}

async function tapPlay(page) {
  // each game's big start button on its story card
  const btn = page.getByRole('button', {
    name: /play level|level 1 —|level 1:|catch fireflies|start the|load the rocket|dive in|open “|play as kailia|berry battle|let.?s go/i,
  }).first();
  await btn.waitFor({ timeout: 20000 });
  await btn.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  const b = await btn.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
}

// a cut is fine only when it is the story card stopping because Play was just
// tapped (lib/voice.ts marks the card's clips), or when a newer line took over
// straight away. Any other stopped line is the bug.
function problems(log, taps) {
  const out = [];
  log.forEach((e, i) => {
    if (e.ev !== 'cut') return;
    const nearTap = e.card && taps.some(t => e.t - t >= 0 && e.t - t < 700);
    const replaced = log.slice(i + 1).some(n => n.ev === 'start' && n.t - e.t < 600);
    if (!nearTap && !replaced) out.push(e.at ? `${e.f} stopped at ${e.at}s of ${e.of}s` : `${e.f} stopped before a sound came out`);
  });
  const started = log.filter(e => e.ev === 'start').length;
  const ended = log.filter(e => e.ev === 'end').length;
  if (!started) out.push('no voice played at all');
  else if (!ended) out.push('no voice line reached its end');
  return { out, started, ended };
}

async function run(browser, game, way) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await page.addInitScript(spy);
  if (way === 'link') {
    await page.goto(`${BASE}/go/game/${game}`);
    await page.waitForTimeout(4000);
  } else {
    await page.goto(`${BASE}/go/map?all=1`);
    await page.waitForTimeout(4000);
    await page.touchscreen.tap(195, 300); // a first tap on the map: sound wakes up
    await page.waitForTimeout(600);
    await page.evaluate(g => window.next?.router?.push(`/play/${g}`), game);
    await page.waitForURL(`**/play/${game}**`, { timeout: 20000 });
    await page.waitForTimeout(3500); // Noel starts reading the story card
  }
  await tapPlay(page);
  await page.waitForTimeout(LISTEN);
  const log = await page.evaluate(() => window.__voice);
  const taps = await page.evaluate(() => window.__taps);
  await ctx.close();
  return { ...problems(log, taps), log };
}

const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
let failed = 0;
for (const game of GAMES) {
  for (const way of ['link', 'map']) {
    let r;
    try { r = await run(browser, game, way); } catch (e) { r = { out: [`could not play: ${e.message.split('\n')[0]}`], started: 0, ended: 0 }; }
    const ok = r.out.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${game.padEnd(16)} ${way.padEnd(4)} lines started ${r.started}, finished ${r.ended}${ok ? '' : '  ← ' + r.out.join('; ')}`);
  }
}
await browser.close();
console.log(failed ? `\n${failed} problem(s)` : '\nevery voice line played to the end');
process.exit(failed ? 1 : 0);
