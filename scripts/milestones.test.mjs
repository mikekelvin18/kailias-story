// Sanity checks for the developmental-age estimator (lib/milestones.ts).
// Run: node --experimental-strip-types scripts/milestones.test.mjs
// Simulates parents of typical, ahead, and behind children answering the
// adaptive questionnaire, and checks the reported range lands where it should.
import assert from 'node:assert/strict';
import * as M from '../lib/milestones.ts';

// A child whose skills sit at `dev` months: says "yes" to items a bit below,
// "sometimes" right around, "not yet" above.
function answerAs(dev) {
  return m => (m.months <= dev * 0.92 ? 1 : m.months <= dev * 1.1 ? 0.5 : 0);
}

function run(domain, age, dev, ans = answerAs(dev)) {
  let asked = M.startingItems(domain, age);
  const answers = {};
  for (const m of asked) answers[m.id] = ans(m);
  for (let round = 0; round < M.MAX_EXTRA_ROUNDS; round++) {
    const more = M.followUpItems(domain, asked, answers, age);
    if (!more.length) break;
    for (const m of more) answers[m.id] = ans(m);
    asked = [...asked, ...more];
  }
  const ev = asked.map(m => ({ id: m.id, months: m.months, r: answers[m.id], kind: 'parent' }));
  return { est: M.estimateAge(ev, age), n: asked.length };
}

let fails = 0;
const cases = [];
for (const domain of M.MILESTONE_DOMAINS) {
  for (const age of [8, 14, 20, 30, 42, 54, 66, 84, 108, 132]) {
    for (const ratio of [0.6, 1, 1.3]) {
      const dev = age * ratio;
      if (dev > 150) continue;
      const { est, n } = run(domain, age, dev);
      const label = M.formatAgeRange(est);
      const inside = est.low <= dev * 1.15 && est.high >= dev * 0.87;
      cases.push(`${domain.padEnd(13)} age ${String(age).padStart(3)}mo dev ${dev.toFixed(0).padStart(3)}mo → ${label.padEnd(30)} (${n} q, ${M.compareToAge(est, age)})${inside ? '' : '  ✗ MISSES'}`);
      if (!inside) fails++;
      // Direction must be right: clearly-behind never reads "ahead" and vice versa.
      const cmp = M.compareToAge(est, age);
      if (ratio === 0.6) assert.notEqual(cmp, 'ahead', `${domain} ${age} behind read as ahead`);
      if (ratio === 1.3) assert.notEqual(cmp, 'growing', `${domain} ${age} ahead read as growing`);
      if (ratio === 1) assert.equal(cmp, 'onTrack', `${domain} ${age} typical not on track: ${label}`);
    }
  }
}
console.log(cases.join('\n'));
assert.ok(fails <= 4, `${fails} ranges missed the true developmental age`);
// Proud parent: "yes" to everything. The range must stay near the
// questions actually asked (≤ ~1.5× age), never jump to "12+ years".
for (const domain of M.MILESTONE_DOMAINS) {
  for (const age of [10, 20, 43, 66, 100]) {
    const { est } = run(domain, age, 0, () => 1);
    const label = M.formatAgeRange(est);
    console.log(`all-yes ${domain.padEnd(13)} age ${String(age).padStart(3)}mo → ${label}`);
    assert.ok(est.openTop, `${domain} ${age} all-yes should be open-topped`);
    assert.ok(est.high <= age * 1.8 + 6, `${domain} ${age} all-yes climbed to ${label}`);
    assert.match(label, /or older|\+|or more/);
  }
}
// Narrow ranges stay centred on the estimate (regression: 27–33 mo once read "4 to 5 years").
assert.equal(M.formatAgeRange({ low: 27, mid: 30, high: 33, items: 30 }), 'about 2 to 3 years');
assert.equal(M.formatAgeRange({ low: 50, mid: 54, high: 58, items: 30 }), 'about 4 to 5 years');
// Always a range, never a single age.
assert.match(M.formatAgeRange({ low: 30, mid: 33, high: 36, items: 5 }), /^about .+ to .+/);
console.log(`\nok — ${cases.length} simulated children, ${fails} misses`);
