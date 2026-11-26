// ── Robot check: every Noel sentence has a recording ──
// Kelvin (2026-11-25): Noel "sounds like a girl robot". New story lines had
// no recording, so the phone's own voice read them. lib/voice.ts notes every
// Noel sentence it couldn't find a recording for (window.__noelMisses).
// This robot opens every game at many levels on an iPhone-sized screen,
// listens to the story card, taps Play and pokes around the game for a
// while, then lists every sentence Noel had no recording for.
//
// Run:  node scripts/voice-miss-check.mjs [baseUrl] [game ...]
//       (needs jump links: a preview build, `next dev`, or KAILIA_JUMP_LINKS=on)
// Adds them to voice/misses.json (never removes any); add those sentences to voice/lines.json (or to
// the scanner in scripts/voice-lines.mjs) and record them.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const GAMES = process.argv.slice(3).length ? process.argv.slice(3) : [
  'dragon-bridge', 'firefly-catch', 'firefly-trails', 'moonlight-match', 'potion-sort',
  'snack-quest', 'sky-mail', 'story-sparks', 'trail-walk', 'hidden-friends', 'cargo-count',
  'reef-explorer', 'echo-song', 'reading', 'sensory', 'fine-motor', 'journey', 'garden',
];
const LEVELS = (process.env.LEVELS || '1,2,4,7,10,14,20,26,30').split(',').map(Number);
const POKE_MS = Number(process.env.POKE_MS || 12000);
const PARALLEL = Number(process.env.PARALLEL || 4);

async function tapStart(page) {
  const start = page.getByRole('dialog', { name: 'Tap to start' });
  if (await start.count()) { await page.touchscreen.tap(195, 420); await page.waitForTimeout(1200); }
}

async function one(browser, game, level) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const misses = new Set();
  const grab = async () => { try { (await page.evaluate(() => window.__noelMisses ?? [])).forEach(m => misses.add(m)); } catch { /* page moved */ } };
  try {
    await page.goto(`${BASE}/go/game/${game}?level=${level}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await tapStart(page);
    await page.waitForTimeout(2500); // the story card is read
    await grab();
    const btn = page.getByRole('button', {
      name: /play level|level \d+ —|level \d+:|catch fireflies|start the|load the rocket|dive in|open “|play as kailia|berry battle|let.?s go/i,
    }).first();
    if (await btn.count()) {
      await btn.evaluate(el => el.scrollIntoView({ block: 'center' }));
      const b = await btn.boundingBox();
      if (b) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    }
    // poke around: tap game buttons and spots, so hints, misses and cheers are said
    const until = Date.now() + POKE_MS;
    while (Date.now() < until) {
      await page.waitForTimeout(700);
      const spot = await page.evaluate(() => {
        const bs = [...document.querySelectorAll('main button, main [role=button], svg [role=button], svg g[style*="cursor"]')]
          .filter(b => { const r = b.getBoundingClientRect(); return r.width > 8 && r.height > 8 && r.top > 60 && r.bottom < innerHeight && !/map|back|sound|mute|calm|pause|speed|again from|times/i.test(b.getAttribute('aria-label') || b.textContent || ''); });
        const b = bs[Math.floor(Math.random() * bs.length)];
        if (!b) return { x: 60 + Math.random() * 270, y: 200 + Math.random() * 500 };
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }).catch(() => null);
      if (spot) await page.touchscreen.tap(spot.x, spot.y).catch(() => {});
      await grab();
    }
  } catch (e) {
    console.log(`  (${game} ${level}: ${e.message.split('\n')[0]})`);
  }
  await grab();
  await ctx.close();
  return misses;
}

const browser = await chromium.launch({ args: ['--autoplay-policy=user-gesture-required'] });
const jobs = GAMES.flatMap(g => LEVELS.map(l => [g, l]));
const all = new Map(); // sentence -> where
let n = 0;
async function worker() {
  while (jobs.length) {
    const [g, l] = jobs.shift();
    const m = await one(browser, g, l);
    m.forEach(s => { if (!all.has(s)) all.set(s, `${g} L${l}`); });
    console.log(`${String(++n).padStart(3)} ${g} level ${l}: ${m.size ? m.size + ' unrecorded' : 'ok'}`);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
await browser.close();
const list = [...all.entries()].sort((a, b) => a[0].localeCompare(b[0]));
// keep what earlier runs found: voice-lines.mjs records from this list, and a
// sentence dropped from it would have its recording removed
let before = {};
try { before = JSON.parse(readFileSync('voice/misses.json', 'utf8')); } catch { /* first run */ }
writeFileSync('voice/misses.json', JSON.stringify(Object.fromEntries(
  Object.entries({ ...before, ...Object.fromEntries(list) }).sort((a, b) => a[0].localeCompare(b[0]))), null, 1) + '\n');
console.log(list.length ? `\n${list.length} Noel sentence(s) with no recording:\n` + list.map(([s, w]) => `  ${w.padEnd(22)} ${s}`).join('\n') : '\nevery Noel sentence heard has a recording');
process.exit(list.length ? 1 : 0);
