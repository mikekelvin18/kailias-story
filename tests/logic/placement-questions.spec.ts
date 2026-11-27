import { test, expect } from '@playwright/test';
import { BANK } from '../../lib/placementBank';

// The first check-up's question bank: every question must have exactly one
// right answer, and every math answer is worked out here independently, so
// a wrong answer key (like a "12 ÷ 3" or a cookie count that doesn't add up)
// can never ship again.

// Math answers, worked out from scratch. A new math question must be added
// here with its sum, or this check fails and asks for it.
const MATH: [RegExp, string][] = [
  [/Kailia has these cookies: 🍪🍪🍪\./, String('🍪🍪🍪'.length / '🍪'.length)],
  [/has 2 cookies .* gets 3 more/, String(2 + 3)],
  [/has 10 cookies\. She eats 4/, String(10 - 4)],
  [/shares 12 cookies equally among 3 friends/, String(12 / 3)],
  [/2 trays of cookies\. Each tray has 8/, String(2 * 8)],
  [/Plate A: 🍪🍪🍪🍪🍪\s+Plate B: 🍪🍪/, 'Plate A'],
  [/has 8 cookies and gets 6 more/, String(8 + 6)],
  [/45 cookies on Monday and 28 on Tuesday/, String(45 + 28)],
  [/7 bags with 8 cookies/, String(7 * 8)],
  [/same amount as ½ of a pizza/, '2/4 of the pizza'],
  [/24 cookies a day for 6 days/, String(24 * 6)],
  [/What is 0\.5 \+ 0\.25/, (0.5 + 0.25).toFixed(2)],
  [/every 2 chocolate cookies there are 3 sugar cookies\. If there are 10 chocolate/, String((10 / 2) * 3)],
];

test('every placement question has exactly one right answer and no repeated choices', () => {
  for (const [area, qs] of Object.entries(BANK)) {
    for (const q of qs) {
      if (q.type !== 'choice') continue;
      const right = q.options!.filter(o => o.correct);
      expect(right.length, `${area}: "${q.text}"`).toBe(1);
      expect(new Set(q.options!.map(o => o.label)).size, `${area}: "${q.text}"`).toBe(q.options!.length);
      expect(q.months, `${area}: "${q.text}" needs an age`).toBeGreaterThan(0);
    }
  }
});

test('every math answer key is really right', () => {
  for (const q of BANK.math) {
    const row = MATH.find(([re]) => re.test(q.text));
    expect(row, `no worked answer for math question "${q.text}" — add it to MATH in this test`).toBeTruthy();
    const keyed = q.options!.find(o => o.correct)!.label;
    expect(keyed, `"${q.text}"`).toBe(row![1]);
  }
});

test('the placement ladders climb by age (easiest first)', () => {
  for (const [area, qs] of Object.entries(BANK)) {
    for (let i = 1; i < qs.length; i++) expect(qs[i].months, area).toBeGreaterThanOrEqual(qs[i - 1].months);
  }
});
