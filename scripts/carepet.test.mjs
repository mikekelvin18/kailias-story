// Checks for the shareable care pet engine (lib/carepet/engine.ts).
// Run: node scripts/carepet.test.mjs   (Node 22.18+ reads .ts directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPet, visit, completeToday, stageFor, nextStep, isLocked, daysBetween,
  shouldAutoOpen, markAutoOpened, taskDoneToday, greetingFor, DEFAULT_CONFIG,
} from '../lib/carepet/engine.ts';

test('two easy wins raise the step, a miss lowers it, help leaves it', () => {
  let r = nextStep(3, 0, 'win');
  assert.deepEqual(r, { step: 3, streak: 1 });
  r = nextStep(r.step, r.streak, 'win');
  assert.deepEqual(r, { step: 4, streak: 0 });
  assert.deepEqual(nextStep(4, 1, 'help'), { step: 4, streak: 0 });
  assert.deepEqual(nextStep(4, 1, 'miss'), { step: 3, streak: 0 });
  assert.equal(nextStep(1, 0, 'miss').step, 1);
  assert.equal(nextStep(6, 1, 'win').step, 6);
});

test('one need a day, rotating feed → play → care, even across skipped days', () => {
  let s = createPet(2, '2026-11-01');
  s = visit(s, '2026-11-01').state;
  assert.equal(s.today.need, 'feed');
  s = completeToday(s, '2026-11-01', 'win').state;
  s = visit(s, '2026-11-05').state;
  assert.equal(s.today.need, 'play');
  s = completeToday(s, '2026-11-05', 'win').state;
  s = visit(s, '2026-11-06').state;
  assert.equal(s.today.need, 'care');
});

test('a task can only be finished once a day', () => {
  let s = visit(createPet(2, '2026-11-01'), '2026-11-01').state;
  s = completeToday(s, '2026-11-01', 'win').state;
  const again = completeToday(s, '2026-11-01', 'miss');
  assert.equal(again.state.happyDays, 1);
  assert.equal(again.stepChange, 0);
  assert.ok(taskDoneToday(again.state, '2026-11-01'));
});

test('growth: egg → baby → little → grown, never backwards', () => {
  assert.equal(stageFor(0), 'egg');
  assert.equal(stageFor(1), 'baby');
  assert.equal(stageFor(5), 'little');
  assert.equal(stageFor(12), 'grown');
  let s = createPet(2, '2026-11-01');
  const grew = [];
  for (let d = 1; d <= 14; d++) {
    const day = `2026-11-${String(d).padStart(2, '0')}`;
    s = visit(s, day).state;
    const r = completeToday(s, day, d % 3 === 0 ? 'miss' : 'help');
    s = r.state;
    if (r.grewTo) grew.push(r.grewTo);
  }
  assert.deepEqual(grew, ['baby', 'little', 'grown']);
  // a long break changes nothing but the greeting
  const back = visit(s, '2026-12-20');
  assert.equal(back.greeting, 'missed-you');
  assert.equal(back.state.happyDays, 14);
  assert.equal(stageFor(back.state.happyDays), 'grown');
});

test('greeting: hello on a new day, again later that day, missed-you after a gap', () => {
  let s = createPet(2, '2026-11-01');
  let v = visit(s, '2026-11-01'); assert.equal(v.greeting, 'hello'); s = v.state;
  v = visit(s, '2026-11-01'); assert.equal(v.greeting, 'again');
  s = completeToday(s, '2026-11-01', 'win').state;
  v = visit(s, '2026-11-02'); assert.equal(v.greeting, 'hello');
  v = visit(s, '2026-11-04'); assert.equal(v.greeting, 'missed-you');
});

test('free days lock new tasks after the trial unless paid; the pet still visits', () => {
  let s = createPet(2, '2026-11-01');
  for (const day of ['2026-11-01', '2026-11-02', '2026-11-03']) {
    s = visit(s, day).state;
    assert.equal(isLocked(s, day, false), false);
    s = completeToday(s, day, 'win').state;
    assert.equal(isLocked(s, day, false), false, 'a finished day stays open');
  }
  s = visit(s, '2026-11-04').state;
  assert.equal(isLocked(s, '2026-11-04', false), true);
  assert.equal(isLocked(s, '2026-11-04', true), false);
  assert.equal(isLocked(s, '2026-11-04', false, { ...DEFAULT_CONFIG, freeDays: null }), false);
});

test('auto-open once a day, never after the task is done', () => {
  let s = visit(createPet(2, '2026-11-01'), '2026-11-01').state;
  assert.ok(shouldAutoOpen(s, '2026-11-01'));
  s = markAutoOpened(s, '2026-11-01');
  assert.ok(!shouldAutoOpen(s, '2026-11-01'));
  assert.ok(shouldAutoOpen(s, '2026-11-02'));
  s = completeToday(visit(s, '2026-11-02').state, '2026-11-02', 'win').state;
  assert.ok(!shouldAutoOpen(s, '2026-11-02'));
});

test('day math ignores clock time and month ends', () => {
  assert.equal(daysBetween('2026-10-31', '2026-11-01'), 1);
  assert.equal(daysBetween('2026-12-31', '2027-01-02'), 2);
  assert.equal(daysBetween('2026-03-07', '2026-03-09'), 2);
});

test('greetingFor is the same however often it is asked', () => {
  let s = visit(createPet(2, '2026-11-01'), '2026-11-01').state;
  assert.equal(greetingFor(s, '2026-11-01'), 'first');
  assert.equal(greetingFor(visit(s, '2026-11-01').state, '2026-11-01'), 'first');
  s = completeToday(s, '2026-11-01', 'win').state;
  assert.equal(greetingFor(s, '2026-11-01'), 'again');
  assert.equal(greetingFor(visit(s, '2026-11-02').state, '2026-11-02'), 'hello');
  assert.equal(greetingFor(visit(s, '2026-11-09').state, '2026-11-09'), 'missed-you');
});
