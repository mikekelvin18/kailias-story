// ── Gather the lines Noel (and friends) say, for recording ──
// Scans the child-facing game code for sentences a child will hear, and
// writes them to voice/lines.json (one sentence per entry). Run:
//   node scripts/voice-lines.mjs
// Then scripts/record-voice.mjs records any sentence not yet recorded.
// This is a generous net: it may catch a few sentences that are only
// shown, never spoken, which costs a few cents and does no harm.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['app/play', 'components/friends', 'components/carepet', 'components/world', 'components/games', 'lib/petTasks.ts', 'lib/companionTrails.ts'];

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) readdirSync(p).forEach(f => walk(join(p, f), out));
  else if (/\.(tsx?|mjs)$/.test(p)) out.push(p);
  return out;
}

/** Same rule as lib/voice.ts sentences(). */
export function sentences(text) {
  const parts = text.split(/(?<=[.!?…])\s+(?=[A-Z"'“‘])/).map(p => p.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

const looksSpoken = s =>
  s.length >= 4 && s.length <= 260 &&
  /^[A-Z"'“]/.test(s) && /[.!?…]["'”]?$/.test(s) &&
  /[a-z]/.test(s) && !/[{}<>=\\\/]|https?:|className|^[A-Z_]+$/.test(s);

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

const lines = [...found].sort();
mkdirSync('voice', { recursive: true });
writeFileSync('voice/lines.json', JSON.stringify(lines, null, 1) + '\n');
console.log(`${lines.length} sentences, ${lines.reduce((n, l) => n + l.length, 0)} characters -> voice/lines.json`);
