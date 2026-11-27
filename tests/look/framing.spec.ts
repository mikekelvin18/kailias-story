import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { GAMES, SIZES, prepare, openGame, actors, floaters, overlap, type Box } from './helpers';

// ── Art check: every character is drawn whole, on screen, uncovered ──
// Kelvin 2026-11-26: on his iPhone the fox in Reef Explorer showed only its
// tail, the sound button sat on top of friends with the phone sideways, and
// the friend stood right on top of Kailia in Firefly Trails. For every game,
// held upright and turned sideways:
//   • Kailia and the friend are fully on screen
//   • they don't stand on top of each other
//   • no floating button covers them
//   • the friend's picture fills its box, head to feet (not just a corner)

/** Where a character's own pixels are inside its box: a picture with it
 *  shown, one with it hidden, and the box around everything that changed. */
async function drawnPart(page: Page, name: string, box: Box) {
  const clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.max(1, box.width), height: Math.max(1, box.height) };
  const sel = `[data-actor="${name}"]`;
  const shown = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate(s => { const e = document.querySelector(s) as HTMLElement; e.style.visibility = 'hidden'; }, sel);
  const hidden = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate(s => { const e = document.querySelector(s) as HTMLElement; e.style.visibility = ''; }, sel);
  const a = await sharp(shown).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(hidden).raw().toBuffer();
  const { width, height, channels } = a.info;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const d = Math.abs(a.data[i] - b[i]) + Math.abs(a.data[i + 1] - b[i + 1]) + Math.abs(a.data[i + 2] - b[i + 2]);
    if (d > 60) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (x1 < 0) return { w: 0, h: 0, top: 1 };
  return { w: (x1 - x0 + 1) / width, h: (y1 - y0 + 1) / height, top: y0 / height };
}

for (const game of GAMES) {
  test(`${game}: Kailia and the friend are whole, on screen and uncovered (upright and sideways)`, async ({ page }) => {
    test.setTimeout(90_000);
    await prepare(page);
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openGame(page, game, 3, '&buddy=fox');
      await page.waitForTimeout(1500); // moving pictures have drawn, entrances settled
      const cast = await actors(page);
      const where = `${game}, phone ${size.name}`;
      expect(cast.length, `${where}: Kailia or the friend is on screen`).toBeGreaterThan(0);
      for (const a of cast) {
        expect(a.x, `${where}: ${a.name} cut off on the left`).toBeGreaterThanOrEqual(-2);
        expect(a.y, `${where}: ${a.name} cut off at the top`).toBeGreaterThanOrEqual(-2);
        expect(a.x + a.width, `${where}: ${a.name} cut off on the right`).toBeLessThanOrEqual(size.width + 2);
        expect(a.y + a.height, `${where}: ${a.name} cut off at the bottom`).toBeLessThanOrEqual(size.height + 2);
      }
      for (let i = 0; i < cast.length; i++) for (let j = i + 1; j < cast.length; j++) {
        const small = Math.min(cast[i].width * cast[i].height, cast[j].width * cast[j].height);
        expect(overlap(cast[i], cast[j]) / small, `${where}: ${cast[i].name} and ${cast[j].name} stand on top of each other`).toBeLessThan(0.3);
      }
      for (const f of await floaters(page)) for (const a of cast) {
        expect(overlap(f, a), `${where}: the floating "${f.name}" button covers ${a.name}`).toBeLessThan(40);
      }
      const pet = cast.find(a => a.name !== 'Kailia');
      if (pet) {
        const part = await drawnPart(page, pet.name, pet);
        expect(part.h, `${where}: ${pet.name} is drawn head to feet, not just a corner`).toBeGreaterThan(0.6);
        expect(part.w, `${where}: ${pet.name} is drawn side to side, not just a corner`).toBeGreaterThan(0.5);
        expect(part.top, `${where}: ${pet.name}'s head is at the top of its box`).toBeLessThan(0.3);
      }
    }
  });
}

// Kelvin 2026-11-26: two look-alike fish swam stacked on top of each other
// in Reef Explorer. Sea friends must never hide behind each other.
test('Reef Explorer: sea friends never swim stacked on top of each other (upright and sideways)', async ({ page }) => {
  test.setTimeout(90_000);
  await prepare(page);
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await openGame(page, 'reef-explorer', 18);
    let longest = 0;
    const runs: Record<string, number> = {};
    for (let s = 0; s < 40; s++) { // 8 seconds, from the very start of the round
      const stacked = await page.evaluate(() => {
        const r = [...document.querySelectorAll('[data-fish]')].map(e => e.getBoundingClientRect());
        const out: string[] = [];
        for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
          const ox = Math.min(r[i].right, r[j].right) - Math.max(r[i].left, r[j].left);
          const oy = Math.min(r[i].bottom, r[j].bottom) - Math.max(r[i].top, r[j].top);
          if (ox > 0 && oy > 0 && (ox * oy) / (r[i].width * r[i].height) > 0.35) out.push(`${i}-${j}`);
        }
        return out;
      });
      for (const k of Object.keys(runs)) if (!stacked.includes(k)) delete runs[k];
      for (const k of stacked) { runs[k] = (runs[k] ?? 0) + 1; longest = Math.max(longest, runs[k]); }
      await page.waitForTimeout(200);
    }
    expect(longest * 0.2, `phone ${size.name}: two sea friends stayed stacked for ${longest * 0.2}s`).toBeLessThanOrEqual(0.6);
  }
});
