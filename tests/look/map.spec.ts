import { test, expect } from '@playwright/test';
import { SIZES, prepare, openJump, overlap } from './helpers';

// ── Art check: the world map fills the phone, and every land can be read ──
// Kelvin 2026-11-26: "The map looks weird now. Squeezed on tiny square."
// Held upright and turned sideways, with a new child and with every land open:
//   • the map picture takes a real share of the screen (not a thin strip)
//   • it is as wide as the page allows
//   • each land's name is fully inside the map and no two names sit on
//     top of each other

const LANDS = ['Firefly Forest', 'Echo Caves', 'Signposts', 'Story Keepers', "Owl's Tower", "Dragon's Cave"];

for (const path of ['/go/map', '/go/map?all=1']) {
  test(`world map (${path}) fills the screen and every land name is readable`, async ({ page }) => {
    await prepare(page);
    for (const size of SIZES) {
      await page.setViewportSize(size);
      await openJump(page, path);
      await page.waitForTimeout(1200);
      const where = `map ${path}, phone ${size.name}`;
      // the map picture = the largest drawing on the page
      const map = await page.evaluate(() => {
        const svgs = [...document.querySelectorAll('svg')].map(s => s.parentElement!.getBoundingClientRect());
        svgs.sort((a, b) => b.width * b.height - a.width * a.height);
        const r = svgs[0];
        return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
      });
      expect(map.width, `${where}: the map is as wide as the page`).toBeGreaterThan(size.width * (size.width < size.height ? 0.85 : 0.45));
      expect(map.height, `${where}: the map is squeezed into a thin strip`).toBeGreaterThan(size.height * (size.width < size.height ? 0.4 : 0.6));
      const labels = await page.evaluate(names => {
        const out: { name: string; x: number; y: number; width: number; height: number }[] = [];
        for (const el of document.querySelectorAll('span, p, div')) {
          const t = (el.textContent || '').trim();
          if (el.children.length > 2 || !names.includes(t)) continue;
          const r = el.getBoundingClientRect();
          if (r.width > 4 && !out.some(o => o.name === t)) out.push({ name: t, x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height });
        }
        return out;
      }, LANDS);
      expect(labels.length, `${where}: every land has its name on the map`).toBe(LANDS.length);
      for (const l of labels) {
        expect(l.x >= map.x - 2 && l.x + l.width <= map.x + map.width + 2 && l.y >= map.y - 2 && l.y + l.height <= map.y + map.height + 2,
          `${where}: "${l.name}" is cut off by the edge of the map`).toBe(true);
      }
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
        expect(overlap(labels[i], labels[j]), `${where}: "${labels[i].name}" and "${labels[j].name}" sit on top of each other`).toBeLessThan(20);
      }
    }
  });
}
