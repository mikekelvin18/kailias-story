import { test, expect } from '@playwright/test';
import { BANK, firstQuestion, nextPlacementQuestion, type PlacementAnswer } from '../../lib/placementBank';
import { estimateAge, screenView, formatAgeRange, compareToAge, aheadCeiling, type Evidence } from '../../lib/milestones';

// Sample children take the first check-up's placement games (reading,
// communication, math), using the very same question-picking rule as the
// page. Their answers turn into the age range a parent would read on the
// results page, and each range is checked against Kelvin's rules:
//   • always a range, never a single age
//   • on track or a bit ahead → starts at their age, at most ~½ year above,
//     "at or above their age"
//   • behind → the real (lower) range, flagged as "a skill to grow"
//   • the questions asked stay inside the screen's reach for their age

/** A child whose skills sit at `devMonths`: right on questions at or below it. */
const childAt = (devMonths: number) => (months: number) => months <= devMonths;

function place(area: string, ageMonths: number, knows: (months: number) => boolean) {
  const bank = BANK[area];
  const answers: PlacementAnswer[] = [];
  let idx: number | null = firstQuestion(bank, ageMonths);
  while (idx != null) {
    const q = bank[idx];
    answers.push({ idx, right: knows(q.months), months: q.months });
    expect(answers.length, 'placement never asks more than 8 questions').toBeLessThanOrEqual(8);
    idx = nextPlacementQuestion(bank, answers, ageMonths);
  }
  const evidence: Evidence[] = answers.map(a => ({ id: `${area}-${a.idx}`, months: a.months, r: a.right ? 1 : 0, kind: 'choice3' }));
  return { answers, evidence };
}

/** What the results page shows for one area (same steps as AssessmentContext). */
function shown(evidence: Evidence[], ageMonths: number) {
  const ev = evidence.filter(e => e.months <= aheadCeiling(ageMonths));
  const raw = estimateAge(ev, ageMonths)!;
  const topPassed = ev.reduce((m, e) => (e.r >= 1 ? Math.max(m, e.months) : m), 0) || Infinity;
  const view = screenView(raw, ageMonths, false, topPassed);
  return { view, text: formatAgeRange(view), compare: compareToAge(view, ageMonths) };
}

const AREAS = ['reading', 'communication', 'math'];
// the placement games are for 5 to 12 (under 5, a grown-up answers the questionnaire instead)
const AGES = [60, 66, 72, 84, 96, 108, 120, 132, 144];

for (const age of AGES) {
  test(`a ${age / 12}-year-old right at their age reads "at or above their age", within half a year`, () => {
    for (const area of AREAS) {
      const { evidence } = place(area, age, childAt(age));
      const { view, text, compare } = shown(evidence, age);
      const where = `${area}, age ${age}: "${text}"`;
      expect(text, where).toMatch(/ to |or more/);
      expect(compare, where).not.toBe('growing');
      expect(view.high, where).toBeLessThanOrEqual(age + Math.max(2, Math.round(age * 0.08)) + 0.01);
      expect(view.low, where).toBeLessThanOrEqual(age);
    }
  });

  test(`a ${age / 12}-year-old who misses everything is never told "at or above"`, () => {
    for (const area of AREAS) {
      const { evidence, answers } = place(area, age, () => false);
      expect(answers.every(a => !a.right)).toBe(true);
      const { view, text } = shown(evidence, age);
      const where = `${area}, age ${age}: "${text}"`;
      expect(text, where).not.toMatch(/at or above/);
      expect(view.atOrAbove, where).toBeFalsy();
      expect(view.low, where).toBeLessThan(age);
    }
  });

  test(`a ${age / 12}-year-old a year behind in math gets a lower range`, () => {
    const { evidence } = place('math', age, childAt(age - 18));
    const { view, text } = shown(evidence, age);
    expect(view.low, `math, age ${age}: "${text}"`).toBeLessThan(age);
    expect(text).not.toMatch(/at or above/);
  });

  test(`a ${age / 12}-year-old who gets everything right is never shown a range past what they answered`, () => {
    for (const area of AREAS) {
      const { evidence } = place(area, age, () => true);
      const top = Math.max(...evidence.map(e => e.months));
      const { view, text } = shown(evidence, age);
      expect(view.high, `${area}, age ${age}: "${text}"`).toBeLessThanOrEqual(Math.max(top, age + Math.max(2, Math.round(age * 0.08))) + 0.01);
      expect(text).not.toMatch(/\+/);
    }
  });
}

test('the placement never asks the same question twice', () => {
  for (const area of AREAS) for (const age of AGES) for (const dev of [age * 0.6, age, age * 1.4]) {
    const { answers } = place(area, age, childAt(dev));
    expect(new Set(answers.map(a => a.idx)).size, `${area} age ${age} dev ${dev}`).toBe(answers.length);
  }
});
