// Paints the soft clouds used by components/scenery/LivingSky.tsx.
//
// Each cloud is a cluster of round billows, lit from the top (warm glow →
// white → cool shade underneath), with fine noise on the edges so it reads
// as a real cumulus cloud instead of a cartoon outline. Chromium renders
// the SVG once and saves a transparent PNG per palette (day, dusk, night)
// and shape (1–4); the app only ever slides those pictures sideways.
//
// To re-make them (needs Playwright, not an app dependency):
//   node scripts/make-clouds.mjs /tmp/clouds
// then trim each PNG to its visible edges and save it as WebP into
// public/scenery/clouds/{palette}-{n}.webp (quality ~82).

import { chromium } from 'playwright';
const out = process.argv[2];
const PALETTES = {
  day:   { shade: '#B9C7DA', mid: '#E4ECF6', light: '#FFFFFF', glow: '#FFFFFF' },
  dusk:  { shade: '#B79BC9', mid: '#EBD9EC', light: '#FFF6F8', glow: '#FFE9D6' },
  night: { shade: '#3E4A68', mid: '#6E7B99', light: '#9CA8C4', glow: '#CDD5EA' },
};
// deterministic rng
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function puffs(seed, W, H) {
  const r = rng(seed * 7919 + 13);
  const list = [];
  const base = H * 0.72;
  // big mounds along the cloud, tallest in the middle
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const hump = Math.pow(Math.sin(Math.PI * t), 0.8);
    const rad = H * (0.11 + 0.17 * hump + r() * 0.05);
    const cx = W * (0.15 + 0.7 * t) + (r() - 0.5) * W * 0.04;
    const cy = base - rad * (0.75 + r() * 0.25);
    list.push({ cx, cy, r: rad });
    // little billows sitting on the upper rim of each mound
    const k = 3 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) {
      const a = Math.PI * (1.1 + 0.8 * r());      // upper half
      const rr = rad * (0.35 + r() * 0.25);
      list.push({ cx: cx + Math.cos(a) * rad * 0.8, cy: cy + Math.sin(a) * rad * 0.75, r: rr });
    }
  }
  // fill the belly so the base reads as one body
  list.push({ cx: W * 0.5, cy: base - H * 0.1, r: 0, rx: W * 0.36, ry: H * 0.12, belly: true });
  return list.sort((a, b) => a.cy - b.cy);   // higher billows behind, lower in front
}
function svg(seed, pal, W = 640, H = 340) {
  const P = PALETTES[pal];
  const ps = puffs(seed, W, H);
  const shp = (p, k = 1, fill = 'url(#g)') => p.belly ? `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx * k}" ry="${p.ry * k}" fill="${fill}"/>` : `<circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="${(p.r * k).toFixed(1)}" fill="${fill}"/>`;
  const belly = ps.filter(p => p.belly), rest = ps.filter(p => !p.belly);
  const circles = belly.map(p => shp(p, 1, P.mid)).join('') + rest.map(p => shp(p)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="0.42" cy="0.3" r="0.75">
      <stop offset="0" stop-color="${P.glow}"/>
      <stop offset="0.5" stop-color="${P.light}"/>
      <stop offset="0.9" stop-color="${P.mid}"/>
      <stop offset="1" stop-color="${P.mid}"/>
    </radialGradient>
    <linearGradient id="belly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.shade}" stop-opacity="0"/>
      <stop offset="0.55" stop-color="${P.shade}" stop-opacity="0.25"/>
      <stop offset="1" stop-color="${P.shade}" stop-opacity="0.9"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-30%" width="140%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="3.2"/>
    </filter>
    <filter id="haze" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <g filter="url(#haze)" opacity="0.45">${ps.map(p => shp(p, 1.05, P.light)).join('')}</g>
  <g filter="url(#soft)">${circles}
    <rect x="0" y="${H * 0.2}" width="${W}" height="${H * 0.6}" fill="url(#belly)" clip-path="url(#cp)"/>
  </g>
  <clipPath id="cp">${ps.map(p => shp(p, 1, '#000')).join('')}</clipPath>
</svg>`;
}
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 700, height: 360 } });
const seeds = [3, 11, 27, 42];
for (const pal of Object.keys(PALETTES)) for (const [i, s] of seeds.entries()) {
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg(s, pal)}</body></html>`);
  await p.locator('svg').screenshot({ path: `${out}/${pal}-${i + 1}.png`, omitBackground: true });
}
await b.close();
