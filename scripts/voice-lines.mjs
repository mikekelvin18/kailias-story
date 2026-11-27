// ── Gather the lines Noel (and friends) say, for recording ──
// Scans the child-facing game code for sentences a child will hear, and
// writes them to voice/lines.json (one sentence per entry). Run:
//   node scripts/voice-lines.mjs
// Then scripts/record-voice.py records any sentence not yet recorded.
// This is a generous net: it may catch a few sentences that are only
// shown, never spoken, which costs a few cents and does no harm.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { dynamicLines } from './voice-dynamic.mjs';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');

/** Every string the code holds, read by the TypeScript parser (exact, unlike
    the quick patterns below, which an apostrophe in JSX text can throw off).
    A template with a changing part keeps its fixed sentences only. */
function literals(file, src) {
  const out = [];
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, false, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push({ text: node.text });
    else if (ts.isTemplateExpression(node)) {
      out.push({ text: node.head.text + node.templateSpans.map(sp => 'Q\u0001' + sp.literal.text).join(''), marked: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const ROOTS = ['app/play', 'app/story', 'components/NoelHello.tsx', 'components/friends', 'components/carepet', 'components/world', 'components/games', 'lib/petTasks.ts', 'lib/companionTrails.ts', 'lib/dragonBridgePlan.ts'];

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
  'Onward!', 'A Magic Map.', 'The flag is close!', 'The flag needs more friends!', 'What happens next?', 'Keep going!', 'Psst!'];

/** The fixed sentences of a bit of JSX with {changing} parts in it. Text
    shown only sometimes ({x && <>Tonight is tricky…</>}) counts as fixed. */
function fixedSentences(jsx) {
  let t = jsx;
  for (let k = 0; k < 4; k++) t = t.replace(/\{[^{}]*?<>([^{}]*?)<\/>[^{}]*?\}/g, ' $1 ');
  t = t.replace(/\{\s*'([^'{}]*)'\s*\}/g, '$1').replace(/\{\s*"([^"{}]*)"\s*\}/g, '$1')
    .replace(/<[^>]+>/g, ' ');
  for (let k = 0; k < 4; k++) t = t.replace(/\{[^{}]*\}/g, ' Q\u0001 ');
  t = t.replace(/&apos;/g, "'").replace(/\s+([,.!?…:;])/g, '$1').replace(/\s+/g, ' ').trim();
  return sentences(t).filter(p => !p.includes('\u0001') && !/[{}]/.test(p));
}

export function scan(roots, found = new Set()) {
const add = text => {
  const clean = text.replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').replace(/[*_~]/g, '').replace(/\s+/g, ' ').trim();
  if (!looksSpoken(clean)) return;
  sentences(clean).forEach(s => found.add(s));
};

for (const root of roots) {
  for (const file of walk(root)) {
    // comments out first: an apostrophe in a comment ("it's") would throw
    // off the quote pairing below and hide the next spoken line
    const src = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:'"`\\])\/\/[^\n]*/gm, '$1')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');
    for (const l of literals(file, readFileSync(file, 'utf8'))) {
      if (!l.marked) add(l.text);
      else sentences(l.text.replace(/\s+/g, ' ')).filter(p => !p.includes('\u0001')).forEach(add);
    }
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
      // a paragraph with a changing part ("The night sky pictures went dark!
      // {skyStory}") or a part shown only sometimes ({tricky && <> Tonight is
      // tricky…</>}): keep its fixed sentences (2026-11-25: these were missed,
      // and the whole bubble fell back to the phone's own voice)
      paras.filter(t => /[{}]/.test(t)).forEach(t => fixedSentences(t).forEach(add));
    }
    // JSX text inside read-aloud story cards (<strong> etc. flattened)
    for (const m of src.matchAll(/data-read-aloud[^>]*>([\s\S]*?)<\/div>/g)) {
      const text = m[1].replace(/\{[^}]*\}/g, ' ').replace(/<[^>]+>/g, ' ');
      if (!/[{}]/.test(text)) add(text);
      else fixedSentences(m[1]).forEach(add);
      // also each paragraph alone
      for (const p of m[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
        if (!/[{}]/.test(p[1])) add(p[1].replace(/<[^>]+>/g, ' '));
      }
    }
  }
}
  return found;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
const found = scan(ROOTS);
// sentences with a changing word (numbers, friends' names, shapes...), every version
dynamicLines().forEach(l => sentences(l).forEach(s => found.add(s)));
EXTRA.forEach(l => found.add(l));
// Word Wizard: Noel reads back the word on a tapped balloon ("That one says leaf.")
for (const m of readFileSync('app/play/reading/page.tsx', 'utf8').matchAll(/(?:choices:\s*|pq\([^\n]*?)\[([^\]]*)\]/g)) {
  for (const w of m[1].matchAll(/'([^']+)'|"([^"]+)"/g)) found.add(`That one says ${w[1] ?? w[2]}.`);
}
// the picture riddles' answers too: pq('Who says moo?', 'cow', [...])
for (const m of readFileSync('app/play/reading/page.tsx', 'utf8').matchAll(/pq\('[^']*',\s*'([^']+)'/g)) found.add(`That one says ${m[1]}.`);
// sentences the robot heard Noel say with no recording (scripts/voice-miss-check.mjs)
if (existsSync('voice/misses.json')) Object.keys(JSON.parse(readFileSync('voice/misses.json', 'utf8'))).forEach(l => sentences(l).forEach(s => found.add(s)));

const lines = [...found].sort();
mkdirSync('voice', { recursive: true });
writeFileSync('voice/lines.json', JSON.stringify(lines, null, 1) + '\n');
console.log(`${lines.length} sentences, ${lines.reduce((n, l) => n + l.length, 0)} characters -> voice/lines.json`);
}
