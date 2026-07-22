// ── Shared wild-creature challenge generator ──
// Used by both Kailia's Journey (top-down world) and Kailia's Trail
// (side-scroller) so the two games can't drift into different bugs.
// Every challenge's PICTURE and QUESTION are about the same subject —
// the creature the child just met — so nothing feels random or
// mismatched (e.g. meeting a deer never leads to a question about the
// sun).

export type ChType = 'count' | 'memory' | 'color' | 'feeling' | 'word';

export interface Challenge {
  type: ChType;
  creature: string;            // the creature met (shown in the battle art)
  ask: string;
  display: string;             // count/color/feeling: the big display content
  options: { label: string; correct: boolean }[];
  memoryFull?: string[];       // memory only: full lineup, shown during the "watch" reveal
  memoryCast?: string[];       // memory only: lineup MINUS the missing one, shown during the question
}

export const CREATURES: Record<ChType, string[]> = {
  count: ['🐉', '🐲'], memory: ['🦉', '🦝'], color: ['🦜', '🦚'], feeling: ['🐰', '🐨'], word: ['🦌', '🦢'],
};

// Every creature that can appear, with its name — used so the "word"
// challenge always asks about the exact picture on screen.
export const CREATURE_NAME: Record<string, string> = {
  '🐉': 'dragon', '🐲': 'dragon', '🦉': 'owl', '🦝': 'raccoon', '🦜': 'parrot', '🦚': 'peacock',
  '🐰': 'rabbit', '🐨': 'koala', '🦌': 'deer', '🦢': 'swan', '🦊': 'fox', '🐸': 'frog',
  '🐢': 'turtle', '🐿️': 'squirrel', '🦔': 'hedgehog', '🐝': 'bee', '🦋': 'butterfly',
};
const ALL_CREATURES = Object.keys(CREATURE_NAME);

const COLOR_SET = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const FEELINGS: [string, boolean][] = [['🎂🎈', true], ['💔🧸', false], ['🍦☀️', true], ['🌧️⚽', false], ['🎁🎀', true], ['🤕🩹', false]];

export const DOMAIN: Record<ChType, string> = { count: 'math', memory: 'processing', color: 'sensory', feeling: 'communication', word: 'reading' };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export function makeChallenge(i: number, tier: string): Challenge {
  const types: ChType[] = tier === 'tiny' ? ['count', 'color', 'memory', 'feeling'] : ['count', 'memory', 'word', 'color', 'feeling'];
  const type = types[i % types.length];
  const creature = pick(CREATURES[type]);

  if (type === 'count') {
    const max = tier === 'tiny' ? 4 : tier === 'small' ? 6 : 9;
    const n = 2 + Math.floor(Math.random() * (max - 1));
    let wrong = n + pick([-1, 1, 2]); if (wrong < 1 || wrong === n) wrong = n + 1;
    let wrong2 = n + pick([-2, 2, 3]); if (wrong2 < 1 || wrong2 === n || wrong2 === wrong) wrong2 = n + 3;
    return { type, creature, ask: `How many ${creature} do you see?`, display: creature.repeat(n),
      options: shuffle([{ label: String(n), correct: true }, { label: String(wrong), correct: false }, { label: String(wrong2), correct: false }]) };
  }

  if (type === 'memory') {
    const castSize = tier === 'big' ? 4 : 3;
    const others = shuffle(ALL_CREATURES.filter(c => c !== creature)).slice(0, castSize - 1);
    const full = shuffle([creature, ...others]);
    const hiddenIdx = Math.floor(Math.random() * full.length);
    const hidden = full[hiddenIdx];
    const remaining = full.filter((_, idx) => idx !== hiddenIdx);
    const decoys = shuffle(ALL_CREATURES.filter(c => !full.includes(c))).slice(0, 2);
    return { type, creature, ask: 'Look closely — one friend disappeared! Which one is missing?', display: '',
      memoryFull: full, memoryCast: remaining,
      options: shuffle([{ label: hidden, correct: true }, ...decoys.map(o => ({ label: o, correct: false }))]) };
  }

  if (type === 'color') {
    const c = pick(COLOR_SET);
    const others = shuffle(COLOR_SET.filter(x => x !== c)).slice(0, 2);
    return { type, creature, ask: 'Find my favorite color!', display: c,
      options: shuffle([{ label: c, correct: true }, ...others.map(o => ({ label: o, correct: false }))]) };
  }

  if (type === 'feeling') {
    const [scene, happy] = pick(FEELINGS);
    return { type, creature, ask: 'How would that feel?', display: scene,
      options: shuffle([{ label: '😊', correct: happy }, { label: '😢', correct: !happy }]) };
  }

  // word: always about the exact creature shown, so picture and question match
  const name = CREATURE_NAME[creature] ?? 'friend';
  const wrongs = shuffle(ALL_CREATURES.filter(c => c !== creature)).slice(0, 2);
  return { type, creature, ask: `Which picture shows the ${name}?`, display: '',
    options: shuffle([{ label: creature, correct: true }, ...wrongs.map(w => ({ label: w, correct: false }))]) };
}
