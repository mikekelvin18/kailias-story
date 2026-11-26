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
