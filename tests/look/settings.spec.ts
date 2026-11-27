import { test, expect, type Page } from '@playwright/test';
import { prepare, openJump } from './helpers';
import sharp from 'sharp';

// ── Settings, profiles and grown-up numbers, checked the way a tester would ──
// From Grok's play-test (2026-11-27):
//   • Sound off: Soft music and Read aloud still looked on, and sound kept playing
//   • every "start fresh" link made another Robin
//   • a 6-year-old's progress report said "about 10–12 yrs" for four skills
//   • the Journey map sat at the left of a computer screen with empty grass on the right

/** Spies on every way the app can make a sound: clips, the device voice and the music engine. */
async function spyOnSound(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __heard: string[] };
    w.__heard = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      const el = this;
      el.addEventListener('playing', () => { if (!el.muted && el.volume > 0.01) w.__heard.push(`clip ${(el.currentSrc || el.src).replace(location.origin, '')} at volume ${el.volume}`); }, { once: true });
      return play.call(this);
    };
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => { if (u.volume > 0.01) w.__heard.push(`device voice "${u.text}"`); speak(u); };
    const start = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function (this: AudioScheduledSourceNode, ...a: number[]) {
      w.__heard.push(`a ${this.constructor.name.replace('Node', '').toLowerCase()} sound`);
      return (start as (...x: number[]) => void).apply(this, a);
    };
  });
}

/** Taps a switch the way a person would: scrolled to the middle of the screen, clear of the bottom tabs. */
async function flip(box: import('@playwright/test').Locator) {
  await box.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await box.click();
}

/** Gets past the grown-up check (hold 3 s, then a times-table) if it shows. */
async function passGate(page: Page) {
  const hold = page.getByRole('button', { name: 'Press and hold for 3 seconds' });
  if (!(await hold.isVisible({ timeout: 3000 }).catch(() => false))) return;
  const b = (await hold.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3600);
  await page.mouse.up();
  const ask = page.getByText(/what is \d+ × \d+\?/);
  const [, a, c] = (await ask.innerText()).match(/(\d+) × (\d+)/)!;
  await page.getByRole('textbox').fill(String(Number(a) * Number(c)));
  await page.getByRole('button', { name: 'Continue' }).click();
}

const heard = (page: Page) => page.evaluate(() => (window as unknown as { __heard: string[] }).__heard);

test('Sound off: music and Read aloud show as paused, nothing plays, and they come back as they were', async ({ page }) => {
  test.setTimeout(120_000);
  await prepare(page, { still: true });
  await spyOnSound(page);
  // first, with sound on, the spy must hear the game (or it proves nothing)
  await openJump(page, '/go/game/firefly-catch?level=2');
  await page.locator('.gf-cta').first().click({ force: true });
  await page.waitForTimeout(4000);
  expect((await heard(page)).length, 'with sound on, the robot hears the game').toBeGreaterThan(0);
  await openJump(page, '/go/family');
  await passGate(page);
  // the grown-up turns Sound off in the Parent Zone
  await page.getByText(/Display & accessibility/).first().click();
  const off = page.getByRole('checkbox', { name: /^\W*Sound off/ });
  const music = page.getByRole('checkbox', { name: /Soft music/ });
  const read = page.getByRole('checkbox', { name: /Read aloud/ });
  await expect(music).toBeChecked();
  await expect(read).toBeChecked();
  await flip(off);
  await expect(off).toBeChecked();
  const problems: string[] = [];
  for (const [what, box] of [['Soft music', music], ['Read aloud', read]] as const) {
    if (!(await box.isDisabled())) problems.push(`with Sound off on, "${what}" can still be switched`);
    if (await box.isChecked()) problems.push(`with Sound off on, "${what}" still shows as on`);
  }
  if (!(await page.getByText(/Paused while .?Sound off.? is on/i).first().isVisible().catch(() => false)))
    problems.push('with Sound off on, there is no "Paused while Sound off is on" note');

  // nothing makes a sound anywhere: a story screen, the map and a game, played for a while
  for (const path of ['/go/story', '/go/map', '/go/game/firefly-catch?level=2']) {
    await openJump(page, path);
    const cta = page.locator('.gf-cta').first();
    if (await cta.isVisible().catch(() => false)) await cta.click({ force: true });
    await page.waitForTimeout(4000);
    for (const h of await heard(page)) problems.push(`with Sound off on, ${path} played ${h}`);
  }

  // turning Sound off back off brings music and Read aloud back as they were
  await openJump(page, '/go/family');
  await passGate(page);
  await page.getByText(/Display & accessibility/).first().click();
  await flip(off);
  await expect(off).not.toBeChecked();
  for (const [what, box] of [['Soft music', music], ['Read aloud', read]] as const) {
    if (await box.isDisabled()) problems.push(`after Sound off is turned back off, "${what}" is still greyed out`);
    if (!(await box.isChecked())) problems.push(`after Sound off is turned back off, "${what}" didn't come back on`);
  }
  expect(problems).toEqual([]);
});

test('Starting fresh again and again keeps one test child, never a crowd of Robins', async ({ page }) => {
  test.setTimeout(120_000);
  await prepare(page, { still: true });
  for (const path of ['/go/review', '/go/map', '/go/review', '/go/game/moonlight-match?level=2', '/go/progress', '/go/pet-popup', '/go/review'])
    await openJump(page, path);
  const kids = await page.evaluate(() => (JSON.parse(localStorage.getItem('kailia_family_v1') || '{}').children || []).map((c: { id: string; nickname: string }) => `${c.nickname} (${c.id})`));
  expect(kids.filter((k: string) => k.startsWith('Robin')), 'children on this device after 7 jump links').toHaveLength(1);
});

/** Every age range written on a page, in years: "about 2½ to 3 years", "10–12 yrs", "12+ years". */
function ranges(text: string): { text: string; top: number }[] {
  const n = (s: string) => (parseFloat(s) || 0) + (s.endsWith('½') ? 0.5 : 0);
  const out: { text: string; top: number }[] = [];
  const re = /(\d+½?|½)\s*(?:to|–|-)\s*(\d+½?)(\+)?\s*(years|yrs)/g;
  for (const m of text.matchAll(re)) out.push({ text: m[0], top: n(m[2]) + (m[3] ? 1 : 0) });
  for (const m of text.matchAll(/(\d+½?)\s*(?:years|yrs)\s*or more/g)) out.push({ text: m[0], top: n(m[1]) + 1 });
  return out;
}

for (const age of [4, 6, 8]) {
  test(`a ${age}-year-old who aced every check-up question: no estimate far above ${age} (results and progress)`, async ({ page }) => {
    await prepare(page, { still: true });
    const problems: string[] = [];
    for (const path of [`/go/results?all=1&age=${age}`, `/go/progress?all=1&age=${age}`]) {
      await openJump(page, path);
      await page.waitForTimeout(1500);
      // open every folded section, so nothing a parent could open is skipped
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
      const text = await page.evaluate(() => document.body.innerText);
      for (const r of ranges(text))
        if (r.top > age + 1) problems.push(`${path}: "${r.text}" for a ${age}-year-old`);
    }
    expect([...new Set(problems)], 'age estimates run past the child: a few easy games can\'t make a 6-year-old "10–12"').toEqual([]);
  });
}

test.describe('on a computer screen', () => {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  /** How much there is to look at in the left and right thirds of the screen. */
  async function balance(page: Page) {
    const png = await page.screenshot();
    const { data, info } = await sharp(png).resize(144, 90, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const third = Math.floor(info.width / 3);
    const detail = (x0: number, x1: number) => {
      let sum = 0;
      for (let y = 0; y < info.height; y++) for (let x = Math.max(x0, 1); x < x1; x++) sum += Math.abs(data[y * info.width + x] - data[y * info.width + x - 1]);
      return sum;
    };
    return { left: detail(0, third), right: detail(info.width - third, info.width) };
  }

  test('Kailia\'s Journey: the world fills the screen, centred, not pinned to one side', async ({ page }) => {
    await prepare(page, { still: true });
    await openJump(page, '/go/game/journey?level=1');
    await page.locator('.gf-cta').first().click({ force: true });
    await page.waitForTimeout(1500);
    // the first visit asks for a partner: pick the first one
    const partner = page.getByRole('button', { name: /Shelly|Flick|Sage/ }).first();
    if (await partner.isVisible().catch(() => false)) await partner.click({ force: true });
    await page.waitForTimeout(3000);
    const { left, right } = await balance(page);
    const lopsided = Math.min(left, right) / Math.max(left, right);
    expect(lopsided, `one side of the screen is nearly empty (left ${left}, right ${right})`).toBeGreaterThan(0.35);
  });
});
