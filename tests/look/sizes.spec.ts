import { test, expect, type Page } from '@playwright/test';
import { GAMES, SIZES, prepare, openGame, overlap, floaters, actors } from './helpers';

// ── Size and readability check: things a child counts, taps or reads ──
// Kelvin 2026-11-27 (Dragon Bridge level 27 on his iPhone): "Look how tiny
// the carrots are. Then the numbers on hopping is almost unreadable."
// For every game, on an easy and a hard level, phone upright and sideways:
//   • every thing to count (data-basket-thing, data-plate-thing, data-count-thing)
//     is at least 22 px on its short side
//   • every answer to tap in the play area is at least 24 px on its short side
//     (characters' own tickle spots aren't answers and are left out)
//   • every number on screen is at least 14 px tall, fits inside its own
//     shape, and a round badge stays round
//   • no floating button (sound, back) and no character sits over an answer to tap

const MIN_THING = 22;
const MIN_TAP = 24;
const MIN_DIGITS = 14;
const LEVELS = [3, 27];

const TAPPABLE = '[data-play-field] button, [data-play-field] [role="button"], [data-opt], [data-pod]';
const COUNTABLE = '[data-basket-thing], [data-plate-thing], [data-count-thing]';

interface Seen { what: string; x: number; y: number; width: number; height: number }

async function boxes(page: Page, selector: string): Promise<Seen[]> {
  return page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => !e.closest('[data-actor]')).map(e => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    const shown = r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && Number(s.opacity) > 0.1
      && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    return { what: e.getAttribute('aria-label') || (e.textContent || '').trim().slice(0, 20) || e.tagName.toLowerCase(), x: r.x, y: r.y, width: r.width, height: r.height, shown };
  }).filter(b => b.shown), selector);
}

/** Every element whose own text is a number (a badge, a stone, a counter). */
async function numbers(page: Page) {
  return page.evaluate(() => {
    const out: { text: string; font: number; fits: boolean; round: boolean; ratio: number; width: number; height: number }[] = [];
    for (const e of document.querySelectorAll<HTMLElement>('body *')) {
      if (e.children.length) continue;
      const text = (e.textContent || '').trim();
      if (!/^\d{1,3}$/.test(text)) continue;
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      if (!r.width || !r.height || s.visibility === 'hidden' || Number(s.opacity) < 0.1 || e.closest('[aria-hidden="true"]')) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      // the shape around the number: the element itself, or its parent when
      // the number sits in a plain span inside a coloured badge
      let shape: HTMLElement = e;
      const bg = (el: HTMLElement) => { const c = getComputedStyle(el); return c.backgroundColor !== 'rgba(0, 0, 0, 0)' || c.backgroundImage !== 'none' || parseFloat(c.borderWidth) > 0; };
      if (!bg(e) && e.parentElement && bg(e.parentElement) && e.parentElement.children.length === 1) shape = e.parentElement;
      const sr = shape.getBoundingClientRect();
      const ss = getComputedStyle(shape);
      const radius = parseFloat(ss.borderTopLeftRadius);
      const badge = bg(shape);
      const round = badge && radius >= Math.min(sr.width, sr.height) * 0.45;
      // the digits' real width, measured with a range
      const range = document.createRange(); range.selectNodeContents(e);
      const tr = range.getBoundingClientRect();
      // plain words have no shape to spill out of; a badge does
      const fits = !badge || (tr.width <= sr.width + 1 && tr.height <= sr.height + 4);
      out.push({ text, font: parseFloat(s.fontSize), fits, round, ratio: sr.width / sr.height, width: Math.round(sr.width), height: Math.round(sr.height) });
    }
    return out;
  });
}

for (const game of GAMES) {
  test(`sizes: ${game} — things to count, tap and read are big enough (upright and sideways)`, async ({ page }) => {
    test.setTimeout(120_000);
    await prepare(page, { still: true });
    const problems: string[] = [];
    for (const level of LEVELS) {
      for (const size of SIZES) {
        await page.setViewportSize(size);
        await openGame(page, game, level);
        await page.waitForTimeout(2500);
        const where = `level ${level} ${size.name}`;
        for (const b of await boxes(page, COUNTABLE))
          if (Math.min(b.width, b.height) < MIN_THING) problems.push(`${where}: a thing to count is ${Math.round(b.width)}×${Math.round(b.height)} px (at least ${MIN_THING})`);
        const taps = await boxes(page, TAPPABLE);
        for (const b of taps)
          if (Math.min(b.width, b.height) < MIN_TAP) problems.push(`${where}: "${b.what}" to tap is ${Math.round(b.width)}×${Math.round(b.height)} px (at least ${MIN_TAP})`);
        for (const n of await numbers(page)) {
          if (n.font < MIN_DIGITS) problems.push(`${where}: number "${n.text}" is ${n.font}px (at least ${MIN_DIGITS})`);
          if (!n.fits) problems.push(`${where}: number "${n.text}" spills out of its ${n.width}×${n.height} shape`);
          if (n.round && (n.ratio < 0.85 || n.ratio > 1.18)) problems.push(`${where}: round badge "${n.text}" is squashed (${n.width}×${n.height})`);
        }
        for (const f of await floaters(page))
          for (const t of taps)
            if (overlap(f, t) >= 40 && !(f.x === t.x && f.y === t.y)) problems.push(`${where}: "${f.name}" covers the answer "${t.what}"`);
        for (const a of await actors(page))
          for (const t of taps)
            if (overlap(a, t) > 0.25 * t.width * t.height) problems.push(`${where}: ${a.name} stands over the answer "${t.what}"`);
      }
    }
    expect([...new Set(problems)], `${game}: too small, unreadable or covered`).toEqual([]);
  });
}
