// ── Gather what each pet friend says, for recording in its own voice ──
// A friend talks in the daily pet pop-up (components/carepet/, the asks in
// lib/petTasks.ts) and in its own signature game (components/friends/).
// This writes voice/pets/<name>.json, one sentence per entry, and
// `scripts/record-voice.py --speaker <name>` records them. Run:
//   node scripts/pet-voice-lines.mjs
// Sentences with the friend's own name, a food, a number or a letter are
// filled in for every word that can appear (one changing word per sentence).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { scan, sentences } from './voice-lines.mjs';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const FOODS = ['a long noodle', 'a round cookie', 'wiggly spaghetti', 'a crunchy pretzel', 'a star cookie', 'a cinnamon roll'];

// every friend: its signature game file, plus the sentences only it says
const PETS = {
  shelly: { name: 'Shelly', game: 'SlowWaves', extra: ['Breathe in.', 'Breathe out.'] },
  flick: { name: 'Flick', game: 'VineWeave', extra: [] },
  sage: { name: 'Sage', game: 'NightFlight', extra: range(2, 15).map(n => `Watch me fly across ${n} stars!`) },
  nova: { name: 'Nova', game: 'StarLetters', extra: [] },
  ember: { name: 'Ember', game: 'GemScales', extra: range(1, 20).flatMap(n => [`${n}`, `${n}!`]) },
  kiko: { name: 'Kiko', game: 'KikoSays', extra: [] },
};

const LETTER_WORDS = {
  L: ['lion', 'leaf', 'lamp'], V: ['van', 'vase', 'vet'], N: ['nest', 'net', 'nose'], M: ['moon', 'map', 'milk'],
  W: ['web', 'wing', 'water'], Z: ['zoo', 'zip', 'zebra'], U: ['up', 'under', 'umbrella'], C: ['cat', 'cup', 'cake'],
  J: ['jam', 'jet', 'juice'], S: ['sun', 'sock', 'star'], T: ['top', 'tree', 'toy'], H: ['hat', 'hen', 'hug'],
  E: ['egg', 'elf', 'end'], A: ['ant', 'apple', 'arm'], K: ['kite', 'key', 'king'],
};
for (const [ch, words] of Object.entries(LETTER_WORDS)) {
  PETS.nova.extra.push(`Let's draw the letter ${ch}!`, `${ch}!`, `Which word starts with ${ch}?`);
  for (const w of words) PETS.nova.extra.push(`${w}!`, `${ch} is for ${w}.`, w);
}

/** the part of the friends' game list (games/index.ts) that belongs to one game */
function gameEntry(component) {
  const src = readFileSync('components/friends/games/index.ts', 'utf8');
  const at = src.indexOf(`Round: ${component}`);
  const from = src.lastIndexOf('{', at), to = src.indexOf('\n  },', at);
  return src.slice(from, to);
}

mkdirSync('voice/pets', { recursive: true });
let total = 0;
for (const [id, pet] of Object.entries(PETS)) {
  const found = scan(['components/carepet', 'lib/petTasks.ts', 'components/friends/FriendGameShell.tsx', `components/friends/games/${pet.game}.tsx`]);
  // its own entry in the game list (intro, cheers, giggles)
  for (const m of gameEntry(pet.game).matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
    const t = m[1].replace(/\\'/g, "'");
    if (/^[A-Z].*[.!?]$/.test(t)) sentences(t).forEach(x => found.add(x));
  }
  const filled = [
    `Hi! It's me, ${pet.name}!`, `It's me, ${pet.name}!`, `I'm ${pet.name}!`, "Let's be friends.",
    ...FOODS.flatMap(f => [`Trace ${f} to keep the egg cozy!`, `Will you trace me ${f}?`]),
    ...range(2, 9).map(n => `${n} more days and I'll grow!`),
    ...range(1, 30).map(n => `Level ${n} done!`),
    'Smell the flower.', 'Blow out the candle.', 'Breathe in.', 'Breathe out.', 'Hold.',
    ...pet.extra,
  ];
  filled.forEach(l => sentences(l).forEach(x => found.add(x)));
  const lines = [...found].sort();
  writeFileSync(`voice/pets/${id}.json`, JSON.stringify(lines, null, 1) + '\n');
  total += lines.length;
  console.log(`${pet.name}: ${lines.length} sentences`);
}
console.log(`${total} in all -> voice/pets/*.json`);
