// ── Gather the lines Noel (and friends) say, for recording ──
// Scans the child-facing game code for sentences a child will hear, and
// writes them to voice/lines.json (one sentence per entry). Run:
//   node scripts/voice-lines.mjs
// Then scripts/record-voice.py records any sentence not yet recorded.
// This is a generous net: it may catch a few sentences that are only
// shown, never spoken, which costs a few cents and does no harm.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { dynamicLines } from './voice-dynamic.mjs';

const ROOTS = ['app/play', 'components/friends', 'components/carepet', 'components/world', 'components/games', 'lib/petTasks.ts', 'lib/companionTrails.ts'];

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) readdirSync(p).forEach(f => walk(join(p, f), out));
  else if (/\.(tsx?|mjs)$/.test(p)) out.push(p);
  return out;
}

/** Same rule as lib/voice.ts sentences(). */
export function sentences(text) {
  const parts = text.split(/(?<=[.!?…])\s+(?=[A-Z0-9"'“‘])/).map(p => p.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

const looksSpoken = s =>
  s.length >= 4 && s.length <= 260 &&
  /^[A-Z"'“]/.test(s) && /[.!?…]["'”]?$/.test(s) &&
  /[a-z]/.test(s) && !/[{}<>=\\\/]|https?:|className|^[A-Z_]+$/.test(s);

// fixed sentences the scan can't see (they sit in the middle of built-up lines)
const EXTRA = ['Fair and square!', 'Yum!', 'Hi!', 'Look!', 'Your turn!', 'Listen once more.', 'Back to the glowing ring!',
  'I love playing with you!', 'Yum yum!', 'That was delicious.', 'Thank you!', 'You did it!', 'That made me so happy.',
  "One more day and I'll grow!", 'Mmm, thank you!', "We'll trace another one tomorrow.", "That's okay!",
  'We can try it again another day.', 'Thank you for playing with me!', 'Look, I grew bigger!', "Wow, I'm all grown up!",
  'I missed you!', 'Big hug!', 'Look, a magic egg!', 'Something is wiggling inside.', 'The magic egg is wiggling!',
  'Onward!', 'The flag is close!', 'The flag needs more friends!', 'What happens next?', 'Keep going!', 'Psst!'];

const found = new Set();
const add = text => {
  const clean = text.replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').replace(/[*_~]/g, '').replace(/\s+/g, ' ').trim();
  if (!looksSpoken(clean)) return;
  sentences(clean).forEach(s => found.add(s));
};

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, 'utf8');
    // string literals with no ${...} inside
    for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`$]*)`/g)) {
      add((m[1] ?? m[2] ?? m[3] ?? '').replace(/\\(['"`\\])/g, '$1'));
    }
    // fixed sentences sitting next to a changing one:
    // `Ooh, close — that's a ${critter}, not Noel! Look for the panda!`
    for (const m of src.matchAll(/`((?:[^`\\]|\\.)*\$\{(?:[^`\\]|\\.)*)`/g)) {
      const marked = m[1].replace(/\$\{[^{}]*\}/g, 'Q\u0001').replace(/\s+/g, ' ');
      if (/[{}]/.test(marked)) continue;
      sentences(marked).filter(p => !p.includes('\u0001')).forEach(add);
    }
    // the intro story of each game: story={<p>…</p>} on the shared game frame
    for (const m of src.matchAll(/story=\{/g)) {
      let depth = 1, i = m.index + m[0].length;
      const startAt = i;
      while (i < src.length && depth) { const ch = src[i++]; if (ch === '{') depth++; else if (ch === '}') depth--; }
      const jsx = src.slice(startAt, i - 1);
      // each paragraph is one or more sentences; skip any with {dynamic} bits
      const paras = [...jsx.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(x => x[1]);
      const flat = paras.filter(t => !/[{}]/.test(t)).map(t => t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      flat.forEach(add);
      add(flat.join(' '));
    }
    // JSX text inside read-aloud story cards (<strong> etc. flattened)
    for (const m of src.matchAll(/data-read-aloud[^>]*>([\s\S]*?)<\/div>/g)) {
      const text = m[1].replace(/\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ');
      if (!/[{}]/.test(text)) add(text);
      // also each paragraph alone
      for (const p of m[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
        if (!/[{}]/.test(p[1])) add(p[1].replace(/<[^>]+>/g, ' '));
      }
    }
  }
}

// sentences with a changing word (numbers, friends' names, shapes...), every version
dynamicLines().forEach(l => sentences(l).forEach(s => found.add(s)));
EXTRA.forEach(l => found.add(l));

const lines = [...found].sort();
mkdirSync('voice', { recursive: true });
writeFileSync('voice/lines.json', JSON.stringify(lines, null, 1) + '\n');
console.log(`${lines.length} sentences, ${lines.reduce((n, l) => n + l.length, 0)} characters -> voice/lines.json`);
