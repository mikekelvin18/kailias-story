// Draws the pictures for the wallet-lab pet card into public/wallet-lab/.
// Wallet cards only take PNG pictures, so this turns the painted pets
// (public/art/pets/*.webp) and the drawn egg into card-sized scenes.
//
//   node scripts/wallet-lab/make-card-art.mjs
//
// Output (each at 1x, @2x and @3x):
//   strip-egg.png, strip-<pet>-<stage>.png   the scene across the card
//   icon.png                                  lock-screen / notification icon
//   logo.png                                  "Kailia's Story" top-left of the card
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Playwright is not an app dependency; use any installed copy
// (NODE_PATH=$(npm root -g) works with a global install).
const { chromium } = createRequire(import.meta.url)('playwright');

const root = process.cwd();
const out = path.join(root, 'public/wallet-lab');
fs.mkdirSync(out, { recursive: true });

const PETS = ['shelly', 'flick', 'sage', 'nova', 'ember', 'kiko']; // same order as COMPANIONS
const STAGES = { baby: 0.5, little: 0.7, grown: 0.9 }; // pet height as a share of the strip

const petData = Object.fromEntries(
  PETS.map((p) => [p, 'data:image/webp;base64,' + fs.readFileSync(path.join(root, `public/art/pets/${p}.webp`)).toString('base64')]),
);

const EGG = `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="50" cy="114" rx="30" ry="5" fill="rgba(20,10,40,0.35)" />
  <path d="M50 6 C76 6 92 48 92 74 C92 98 74 112 50 112 C26 112 8 98 8 74 C8 48 24 6 50 6 Z" fill="#F5EBFF" stroke="#7C5CC4" stroke-width="3.5" />
  <path d="M22 44 C30 40 34 52 42 48" fill="none" stroke="#C4B5FD" stroke-width="5" stroke-linecap="round" />
  <circle cx="64" cy="40" r="6" fill="#FBCFE8" /><circle cx="30" cy="80" r="7" fill="#BAE6FD" />
  <circle cx="70" cy="86" r="5" fill="#FDE68A" /><circle cx="52" cy="66" r="4" fill="#BBF7D0" />
  <ellipse cx="36" cy="28" rx="7" ry="12" fill="#FFFFFF" opacity="0.7" transform="rotate(-20 36 28)" />
</svg>`;

// The card's own colour is #2E2A5A; the scene fades into it on the left so
// the pet's name (drawn by Wallet over the strip) stays readable.
function scene(inner) {
  return `<!doctype html><html><head><style>
    html,body{margin:0;width:375px;height:123px;overflow:hidden}
    .sky{position:absolute;inset:0;background:linear-gradient(180deg,#3A3473 0%,#5A4C9E 70%,#7A68B8 100%)}
    .fade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(46,42,90,0.92) 0%,rgba(46,42,90,0.55) 38%,rgba(46,42,90,0) 60%)}
    .moon{position:absolute;right:16px;top:12px;width:20px;height:20px;border-radius:50%;background:#FFF4D6;box-shadow:0 0 18px 6px rgba(255,236,190,0.35)}
    .star{position:absolute;width:3px;height:3px;border-radius:50%;background:#FFFFFF;opacity:.75}
    .hill{position:absolute;left:-40px;right:-40px;bottom:-70px;height:110px;border-radius:50%;background:#4E8C6A}
    .hill2{position:absolute;left:180px;right:-120px;bottom:-62px;height:96px;border-radius:50%;background:#5FA27A}
    .pet{position:absolute;right:40px;bottom:6px;display:flex;align-items:flex-end;justify-content:center;width:150px}
    .pet img,.pet svg{display:block;filter:drop-shadow(0 3px 4px rgba(20,10,40,.35))}
  </style></head><body>
    <div class="sky"></div>
    <div class="star" style="left:190px;top:18px"></div><div class="star" style="left:250px;top:40px"></div>
    <div class="star" style="left:300px;top:10px"></div><div class="star" style="left:160px;top:52px;opacity:.5"></div>
    <div class="moon"></div>
    <div class="hill"></div><div class="hill2"></div>
    <div class="fade"></div>
    <div class="pet">${inner}</div>
  </body></html>`;
}

const browser = await chromium.launch();
async function shot(html, w, h, file) {
  for (const [scale, suffix] of [[1, ''], [2, '@2x'], [3, '@3x']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(out, `${file}${suffix}.png`), omitBackground: true });
    await page.close();
  }
}

await shot(scene(`<div style="width:${123 * 0.62 / 1.2}px;height:${123 * 0.62}px">${EGG}</div>`), 375, 123, 'strip-egg');
for (const pet of PETS) {
  for (const [stage, share] of Object.entries(STAGES)) {
    const h = Math.round(123 * share);
    await shot(scene(`<img src="${petData[pet]}" style="height:${h}px;width:auto" />`), 375, 123, `strip-${pet}-${stage}`);
  }
}

// Icon: the egg on the card colour, square, no transparency (iOS needs a solid icon).
await shot(`<!doctype html><html><body style="margin:0;width:29px;height:29px;background:#2E2A5A;display:flex;align-items:center;justify-content:center">
  <div style="width:19px;height:23px">${EGG}</div></body></html>`, 29, 29, 'icon');

// Logo: a small egg mark, top-left of the card. Wallet writes the app
// name ("Kailia's Story") beside it, so the picture has no text.
await shot(`<!doctype html><html><body style="margin:0;width:26px;height:32px;background:transparent">
  <div style="width:26px;height:31px">${EGG}</div></body></html>`, 26, 32, 'logo');

await browser.close();
console.log('wrote', fs.readdirSync(out).length, 'files to public/wallet-lab/');
