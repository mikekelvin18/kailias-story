// Age-fit check: does every game start each age group at the right level?
// Run: node scripts/age-fit.test.mjs            (prints the table, checks it)
//      node scripts/age-fit.test.mjs --markdown (also prints a Markdown table)
// Test children are "on track" (working age = real age) at 2 to 12 years.
// For each game it finds the level a new player starts on and asks: is the
// hardest thing that level asks about right for this age? (lib/ageFit.ts)
// The "before" column replays how games picked levels until 2026-11-25
// (everyone on level 1, the old Echo Song / Moonlight / Sky Mail curves).
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti'; // ships with the Tailwind toolchain
const root = fileURLToPath(new URL('..', import.meta.url));
const jiti = createJiti(import.meta.url, { alias: { '@': root } });
const F = await jiti.import(root + 'lib/ageFit.ts');

const AGES = [24, 30, 36, 48, 60, 72, 84, 96, 120, 144];
const label = m => (m % 12 ? `${Math.floor(m / 12)}½` : `${m / 12}`);

// ── How the games behaved before this change ──
const oldEcho = (L, t) => {
  const base = t === 'big' ? 3 : 2, cap = t === 'tiny' ? 6 : t === 'small' ? 8 : 10;
  return Math.min(cap, L <= 4 ? base + L - 1 : base + 3 + Math.floor((L - 4) / 3));
};
const oldMoon = (L, t) => Math.min(t === 'tiny' ? 6 : t === 'small' ? 8 : 10, (t === 'tiny' ? 2 : t === 'small' ? 3 : 4) + (L - 1));
const oldChallenge = (t, L) => {
  const grow = Math.floor((L - 1) / 4);
  return { countMax: Math.min(t === 'tiny' ? 6 : 12, (t === 'tiny' ? 4 : t === 'small' ? 6 : 9) + grow),
           castSize: Math.min(t === 'tiny' ? 3 : 6, (t === 'big' ? 4 : 3) + Math.floor(grow / 2)) };
};
const oldWordStart = m => { const a = Math.floor(m / 12); return (a <= 4 ? 0 : a <= 5 ? 1 : a <= 6 ? 2 : a <= 8 ? 3 : 4) * 5 + 1; };
function oldDemand(g, L, t, m) {
  switch (g.id) {
    case 'echo-song': return F.spanAge(oldEcho(L, t));
    case 'moonlight-match': return F.pairsAge(oldMoon(L, t));
    case 'fine-motor': return g.demand(L, 'big', m); // the path was the same width for every age
    case 'journey': case 'trail-walk': { const s = oldChallenge(t, L); return Math.max(F.countAge(s.countMax), F.castAge(s.castSize)); }
    case 'word-wizard': { const bank = Math.min(4, Math.floor((L - 1) / 5)); return [66, 60, 72, 84, 108][bank]; }
    case 'sky-mail': return t === 'tiny' ? 54 : t === 'small' ? 72 : 108;
    default: return g.demand(L, t, m);
  }
}
const oldStart = (g, m) => (g.id === 'word-wizard' ? oldWordStart(m) : 1);

// ── Build the table ──
const rows = [];
let beforeGood = 0, afterGood = 0, cells = 0;
for (const g of F.FIT_GAMES) {
  const row = { game: g.title, skill: g.skill, paced: !!g.paced, cells: [] };
  for (const m of AGES) {
    const t = F.tierForMonths(m);
    const bL = oldStart(g, m), aL = F.fitStartLevel(g.id, m);
    const bD = oldDemand(g, bL, t, m), aD = g.demand(aL, t, m);
    const before = F.judge(bD, m), after = F.judge(aD, m);
    // the free five levels from the start: never a big jump past the age
    const climb = Math.max(...[0, 1, 2, 3, 4].map(k => g.demand(aL + k, t, m)));
    cells++; if (before === 'good') beforeGood++; if (after === 'good') afterGood++;
    row.cells.push({ m, bL, bD, before, aL, aD: Math.round(aD), after, climb: Math.round(climb) });
  }
  rows.push(row);
}

const mark = v => (v === 'good' ? '✓' : v === 'easy' ? 'easy' : 'HARD');
for (const r of rows) {
  console.log(`\n${r.game}${r.paced ? ' (speed game, estimate)' : ''}`);
  console.log('  age   before          after');
  for (const c of r.cells) {
    console.log(`  ${label(c.m).padEnd(4)}  L${String(c.bL).padEnd(3)}${mark(c.before).padEnd(6)}   L${String(c.aL).padEnd(3)}${mark(c.after).padEnd(5)} asks ~${label(Math.round(c.aD / 6) * 6)}y`);
  }
}
console.log(`\nJust right: before ${beforeGood}/${cells}, after ${afterGood}/${cells}`);

if (process.argv.includes('--markdown')) {
  const head = `| Game | ${AGES.map(label).join(' | ')} |\n|---|${AGES.map(() => ':-:').join('|')}|`;
  const md = which => rows.map(r => `| ${r.game} | ${r.cells.map(c => which === 'after' ? `${mark(c.after)} L${c.aL}` : `${mark(c.before)} L${c.bL}`).join(' | ')} |`).join('\n');
  console.log('\nBEFORE\n' + head + '\n' + md('before') + '\n\nAFTER\n' + head + '\n' + md('after'));
  console.log('\nJSON ' + JSON.stringify(rows));
}

// ── Checks ──
// 1. No game starts an on-track child of 2½ or more on a level that is too
//    hard (under 2½ the app coaches grown-ups through the Quest Library and
//    screen games are played together; those cells are only reported).
rows.forEach((r, i) => r.cells.forEach(c => {
  if (c.m < 30 || c.m < (F.FIT_GAMES[i].fromMonths ?? 0)) return;
  assert.notEqual(c.after, 'hard', `${r.game} starts a ${label(c.m)}-year-old on level ${c.aL}, which asks about ${Math.round(c.aD)} months`);
}));
// 2. The free five levels climb gently: never far past the child's age.
rows.forEach((r, i) => r.cells.forEach(c => {
  if (!F.FIT_GAMES[i].leveled || c.m < 30 || c.m < (F.FIT_GAMES[i].fromMonths ?? 0)) return;
  assert.ok(c.climb <= c.m + Math.max(12, c.m * 0.25),
    `${r.game}: a ${label(c.m)}-year-old's first five levels climb to ~${c.climb} months`);
}));
// 3. Children of 3 to 8 get a just-right start in every game built for them.
const OUTGROWN = new Set(['Story Sparks', "Kailia's Journey", "Kailia's Trail", 'Snack Quest']); // top out at 4–7
rows.forEach((r, i) => r.cells.forEach(c => {
  if (c.m < 36 || c.m > 96 || c.m < (F.FIT_GAMES[i].fromMonths ?? 0)) return;
  if (OUTGROWN.has(r.game) && c.m > (r.game === 'Story Sparks' ? 48 : 72)) return; // listed in the report
  assert.equal(c.after, 'good', `${r.game} for a ${label(c.m)}-year-old: start L${c.aL} asks ~${Math.round(c.aD)} months`);
}));
// 4. A child working below their age starts lower than one on track.
assert.ok(F.fitStartLevel('dragon-bridge', 48) < F.fitStartLevel('dragon-bridge', 84));
assert.equal(F.fitStartLevel('dragon-bridge', null), 1);
console.log('\nAge-fit checks passed.');
