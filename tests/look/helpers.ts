import { expect, type Page } from '@playwright/test';

// ── Shared helpers for the "look" checks ──
// These robots look at the screen the way Kelvin does on his phone: held
// upright (390 × 844) and turned sideways (844 × 390), with touch.

export const PHONE = { width: 390, height: 844 };
export const SIDEWAYS = { width: 844, height: 390 };
export const SIZES = [{ name: 'upright', ...PHONE }, { name: 'sideways', ...SIDEWAYS }];

export const GAMES = [
  'cargo-count', 'dragon-bridge', 'echo-song', 'fine-motor', 'firefly-catch', 'firefly-trails',
  'hidden-friends', 'journey', 'moonlight-match', 'potion-sort', 'reading', 'reef-explorer',
  'sensory', 'sky-mail', 'snack-quest', 'story-sparks', 'trail-walk',
];

/** Every screen a family sees outside the games, as jump links. */
export const SCREENS: [string, string][] = [
  ['front-page', '/go/home'], ['story', '/go/story'], ['setup', '/go/setup'], ['try', '/go/try'],
  ['map', '/go/map'], ['map-all-open', '/go/map?all=1'],
  ['pet-popup-egg', '/go/pet-popup'], ['pet-popup-baby', '/go/pet-popup?pet=baby'], ['pet-popup-grown', '/go/pet-popup?pet=grown'],
  ['pet-popup-play', '/go/pet-popup?pet=little&task=play'], ['pet-popup-care', '/go/pet-popup?pet=little&task=care'],
  ['daily-quests', '/go/daily-quests'], ['new-friend', '/go/new-friend'], ['land-done', '/go/land-done'], ['land-sheet', '/go/land/dragons-cave'],
  ['friends', '/go/friends'], ['friend-sage', '/go/friend/sage'], ['garden', '/go/garden'],
  ['results', '/go/results'], ['progress', '/go/progress'], ['family', '/go/family'], ['activities', '/go/activities'],
  ['printables', '/go/printables'], ['upgrade', '/go/upgrade'],
];

export interface OpenOpts {
  /** the same random numbers every run, so pictures can be compared */
  steadyRandom?: boolean;
  /** the device's Reduce motion (still pictures; for picture comparisons) */
  still?: boolean;
  /** keep sound on and spy on every clip and spoken line */
  listen?: boolean;
}

/** Things every look check wants on the page before it loads. */
export async function prepare(page: Page, opts: OpenOpts = {}) {
  await page.addInitScript(({ steadyRandom, listen }) => {
    (window as unknown as { __KAILIA_TEST__: boolean }).__KAILIA_TEST__ = true;
    // "Tap to start!" on every opened page (tapping it proves the page is live)
    try { sessionStorage.removeItem('kailia_tap_started_v1'); } catch { /* fine */ }
    if (steadyRandom) {
      let a = 20261126;
      Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    // count drawing (WebGL) canvases alive at once: each costs the phone memory
    const w = window as unknown as { __gl: number; __glMax: number; __clips: { t: number; src: string }[]; __spoken: { t: number; text: string }[] };
    w.__gl = 0; w.__glMax = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      const ctx = (getContext as (...a: unknown[]) => unknown).call(this, kind, ...rest);
      if (ctx && /webgl/.test(kind) && !(this as unknown as { __counted?: boolean }).__counted) {
        (this as unknown as { __counted?: boolean }).__counted = true;
        w.__gl++; w.__glMax = Math.max(w.__glMax, w.__gl);
        this.addEventListener('webglcontextlost', () => { w.__gl--; }, { once: true });
      }
      return ctx;
    } as typeof HTMLCanvasElement.prototype.getContext;
    if (listen) {
      w.__clips = []; w.__spoken = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        w.__clips.push({ t: performance.now(), src: this.currentSrc || this.src, ev: 'play' } as never);
        if (!(this as unknown as { __spied?: boolean }).__spied) {
          (this as unknown as { __spied?: boolean }).__spied = true;
          this.addEventListener('playing', () => w.__clips.push({ t: performance.now(), src: this.currentSrc || this.src, ev: 'playing' } as never));
        }
        return play.call(this);
      };
      const speak = speechSynthesis.speak.bind(speechSynthesis);
      speechSynthesis.speak = (u: SpeechSynthesisUtterance) => { w.__spoken.push({ t: performance.now(), text: u.text }); speak(u); };
    }
  }, { steadyRandom: !!opts.steadyRandom, listen: !!opts.listen });
  if (opts.still) await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** Opens a jump link (it makes the test child) and taps "Tap to start!". */
export async function openJump(page: Page, path: string) {
  await page.goto(path);
  const tap = page.getByRole('dialog', { name: 'Tap to start' });
  await tap.click({ force: true, timeout: 8_000 }).catch(() => {});
  await expect(tap).toHaveCount(0);
}

/** Opens a game on a level and taps its big start button. */
export async function openGame(page: Page, game: string, level = 3, extra = '') {
  await openJump(page, `/go/game/${game}?level=${level}${extra}`);
  const intro = page.getByTestId('game-intro');
  await expect(intro).toBeVisible({ timeout: 30_000 });
  // most games start with one big button; Snack Quest and Sky Mail start by
  // picking a place or a mailbag
  await intro.locator('.gf-cta, .gf-choice').first().click({ force: true });
  await expect(intro).toHaveCount(0);
}

export interface Box { x: number; y: number; width: number; height: number }
export const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/** Every character on screen (Kailia and the friends), with its box. */
export function actors(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-actor]')].map(e => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return { name: e.getAttribute('data-actor')!, x: r.x, y: r.y, width: r.width, height: r.height, shown: s.visibility !== 'hidden' && s.display !== 'none' && r.width > 4 && Number(s.opacity) > 0.1 };
  }).filter(a => a.shown));
}

/** Buttons and badges that float over the page (fixed in place). */
export function floaters(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll('button, a, [role="button"]')].filter(e => {
    if (e.closest('[data-actor]')) return false; // a character's own tap area
    for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true;
    return false;
  }).map(e => {
    const r = e.getBoundingClientRect();
    return { name: e.getAttribute('aria-label') || (e.textContent || '').trim().slice(0, 30), x: r.x, y: r.y, width: r.width, height: r.height };
  }).filter(f => f.width > 4 && f.height > 4));
}

/**
 * Looks over everything on screen the way a person would (Grok's play-test,
 * 2026-11-27, found what the older checks never looked at):
 *   • covered: something you can tap is hidden under something else
 *     (a start button floating over the level picker)
 *   • cut off: words or buttons run past the edge of the screen or out of
 *     their box with no way to scroll to them (progress dots, wide tables)
 *   • hard to read: words too close in colour to what's behind them
 *   • crowded: words sitting on top of a button
 *   • two pop-ups open at once
 * Returns one plain sentence per problem.
 */
export async function lookOver(page: Page, where: string, opts: { atEnd?: boolean } = {}): Promise<string[]> {
  const found = await page.evaluate(({ atEnd }) => {
    const out: string[] = [];
    const W = innerWidth, H = innerHeight;
    const name = (e: Element) => (e.getAttribute('aria-label') || (e as HTMLElement).innerText || e.textContent || e.tagName.toLowerCase()).trim().replace(/\s+/g, ' ').slice(0, 40);
    const hidden = (e: Element) => {
      if (e.closest('[aria-hidden="true"], [data-actor], [inert]')) return true;
      const shut = e.closest('details:not([open])');
      if (shut && !e.closest('summary')) return true; // folded away inside a closed section
      for (let n: Element | null = e; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.15) return true;
      }
      return false;
    };
    // the app's own bars (bottom tabs) float over a page that scrolls under
    // them: what they hide can be scrolled into view, unless the page is
    // already at its very end or doesn't scroll at all
    const scrollsY = (n: Element) => { const st = getComputedStyle(n); return /(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 4; };
    const scrolls = document.documentElement.scrollHeight > H + 4 || [...document.querySelectorAll('body *')].some(scrollsY);
    const barOk = (e: Element) => scrolls && !atEnd && !!e.closest('nav, [role="navigation"]');
    const onScreen = (r: DOMRect) => r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    // the pop-ups that are open; anything outside the top one is meant to be covered
    const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [aria-modal="true"]')]
      .filter(d => !hidden(d) && onScreen(d.getBoundingClientRect()) && !d.parentElement?.closest('[role="dialog"], [role="alertdialog"], [aria-modal="true"]'));
    if (dialogs.length > 1) out.push(`two pop-ups are open at once: ${dialogs.map(d => `"${d.getAttribute('aria-label') || name(d)}"`).join(' and ')}`);
    const top = dialogs.length ? dialogs[dialogs.length - 1] : null;
    const inScope = (e: Element) => !top || top.contains(e);

    // ── covered ──
    const TAP = 'button, a[href], [role="button"], input:not([type="hidden"]), select, [data-opt]';
    const taps = [...document.querySelectorAll(TAP)].filter(e => inScope(e) && !hidden(e) && !(e as HTMLButtonElement).disabled);
    for (const e of taps) {
      const r = e.getBoundingClientRect();
      if (!onScreen(r) || r.width < 8 || r.height < 8) continue;
      // the middle of the part that's on screen
      const x = (Math.max(r.left, 0) + Math.min(r.right, W)) / 2, y = (Math.max(r.top, 0) + Math.min(r.bottom, H)) / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || e.contains(hit) || hit.contains(e)) continue;
      const label = hit.closest('label');
      if (label && label.contains(e)) continue;
      const over = hit.closest(TAP) || hit;
      if (name(over) === name(e)) continue; // a twin of itself on top (the same button)
      if (over.closest('[data-actor]')) continue; // a character walking past is checked elsewhere
      if (barOk(over)) continue;
      let layer = false;
      for (let n: Element | null = over; n && n !== document.body; n = n.parentElement) {
        if (getComputedStyle(n).position !== 'fixed') continue;
        const lr = n.getBoundingClientRect();
        if (lr.width * lr.height > 0.5 * W * H && !n.contains(e)) { layer = true; break; }
      }
      if (layer) continue; // a whole-screen pop-up or celebration is meant to sit on top
      out.push(`"${name(e)}" is covered by "${name(over)}"`);
    }

    // ── cut off ──
    const scrollsX = (n: Element) => { const s = getComputedStyle(n); return /(auto|scroll)/.test(s.overflowX) && n.scrollWidth > n.clientWidth + 1; };
    const clips = (n: Element) => { const s = getComputedStyle(n); return /(hidden|clip)/.test(s.overflowX) || /(hidden|clip)/.test(s.overflow); };
    const leaves = [...document.querySelectorAll<HTMLElement>('body *')].filter(e =>
      inScope(e) && [...e.childNodes].some(c => c.nodeType === 3 && (c.textContent || '').trim().length > 0));
    const things = new Set<Element>([...leaves, ...taps, ...document.querySelectorAll('[role="progressbar"], [data-progress-dot]')]);
    for (const e of things) {
      if (hidden(e) || e.closest('[data-play-field]')) continue; // game things glide in and out of the scene
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > H) continue;
      let box = { left: 0, right: W }, scroller = false;
      for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        if (scrollsX(n)) { scroller = true; break; }
        if (clips(n)) { const c = n.getBoundingClientRect(); box = { left: Math.max(box.left, c.left), right: Math.min(box.right, c.right) }; }
      }
      if (scroller) continue;
      const outside = Math.max(0, box.left - r.left) + Math.max(0, r.right - box.right);
      if (outside > Math.max(4, r.width * 0.15)) out.push(`"${name(e)}" is cut off at the ${r.left < box.left ? 'left' : 'right'} (${Math.round(outside)} px out of sight)`);
    }
    // text cut short inside its own box (no "…" and no way to see the rest)
    for (const e of leaves) {
      if (hidden(e)) continue;
      const s = getComputedStyle(e);
      if (!/(hidden|clip)/.test(s.overflowX) || s.textOverflow === 'ellipsis') continue;
      if (e.scrollWidth > e.clientWidth + 2 && onScreen(e.getBoundingClientRect())) out.push(`"${name(e)}" is cut short inside its box`);
    }

    // ── squeezed: a sentence pushed into a column so thin it reads one word per line ──
    for (const e of leaves) {
      if (hidden(e)) continue;
      const words = (e.textContent || '').trim().split(/\s+/).length;
      const r = e.getBoundingClientRect();
      const font = parseFloat(getComputedStyle(e).fontSize);
      const range = document.createRange(); range.selectNodeContents(e);
      const lines = new Set([...range.getClientRects()].map(c => Math.round(c.top))).size;
      if (words >= 4 && lines >= words && onScreen(r) && r.width < font * 5) out.push(`"${name(e)}" is squeezed into a column ${Math.round(r.width)} px wide (one word per line)`);
    }

    // ── hard to read ──
    const rgba = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = (c: { r: number; g: number; b: number }) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    for (const e of leaves) {
      if (hidden(e) || !onScreen(e.getBoundingClientRect())) continue;
      const s = getComputedStyle(e);
      const fg = rgba(s.color);
      if (!fg || fg.a < 0.5) continue;
      // an outline or shadow around the letters lifts them off what's behind
      if (parseFloat(s.webkitTextStrokeWidth || '0') >= 1 || s.textShadow !== 'none') continue;
      // what's behind: the nearest solid colour, or every colour of a gradient on the way
      const behind: { r: number; g: number; b: number }[] = [];
      let picture = false;
      for (let n: Element | null = e; n; n = n.parentElement) {
        const ns = getComputedStyle(n);
        if (ns.backgroundImage.includes('url(')) { picture = true; break; }
        if (ns.backgroundImage.includes('gradient')) {
          const cs = (ns.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(rgba).filter(c => c && c.a > 0.6) as { r: number; g: number; b: number }[];
          // a gradient reads as roughly its average colour
          if (cs.length) { behind.push({ r: cs.reduce((t, c) => t + c.r, 0) / cs.length, g: cs.reduce((t, c) => t + c.g, 0) / cs.length, b: cs.reduce((t, c) => t + c.b, 0) / cs.length }); break; }
        }
        const bg = rgba(ns.backgroundColor);
        if (bg && bg.a > 0.6) { behind.push(bg); break; }
        if (bg && bg.a > 0.15) { picture = true; break; } // see-through: depends on what's under it
      }
      if (picture || !behind.length) continue;
      const worst = Math.min(...behind.map(b => ratio(fg, b)));
      const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.6 && Number(s.fontWeight) >= 700);
      // 3:1 is where words stop being readable at a glance on a phone
      if (worst < 3) out.push(`"${name(e)}" is hard to read (contrast ${worst.toFixed(1)}:1, needs at least 3:1)`);
    }

    // ── crowded: words sitting on a button they don't belong to ──
    const tapBoxes = taps.map(t => ({ t, r: t.getBoundingClientRect() })).filter(b => onScreen(b.r));
    for (const e of leaves) {
      if (hidden(e) || e.closest(TAP)) continue;
      const range = document.createRange(); range.selectNodeContents(e);
      const r = range.getBoundingClientRect();
      if (!onScreen(r)) continue;
      for (const { t, r: b } of tapBoxes) {
        if (t.contains(e) || e.contains(t) || barOk(t)) continue;
        const lab = e.closest('label'); if (lab && lab.contains(t)) continue; // a switch's own words
        const ov = Math.max(0, Math.min(r.right, b.right) - Math.max(r.left, b.left)) * Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top));
        if (ov > 0.2 * Math.min(r.width * r.height, b.width * b.height)) out.push(`the words "${name(e)}" sit on the button "${name(t)}"`);
      }
    }
    return out;
  }, { atEnd: !!opts.atEnd });
  return [...new Set(found)].map(p => `${where}: ${p}`);
}
