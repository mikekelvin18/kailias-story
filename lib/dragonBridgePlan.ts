// ── Dragon Bridge: the round plans (app/play/dragon-bridge) ──
// Kept apart from the page so the level plans can be checked by tests and
// so every level's stories, numbers and twists live in one place.

import type { DifficultyTier } from './difficulty';
import { endlessRamp, isStarLevel } from './levels';
import type { SpeciesKey } from '@/components/characters/CritterSprite';
import { dealIndex, levelStories, randInt, randPick, roundRandom } from './variety';

// ── Gems, things to share, and the round plans ──

export const GEMS = [
  { hex: '#EF4444', dark: '#991B1B', name: 'red' },
  { hex: '#3B82F6', dark: '#1E3A8A', name: 'blue' },
  { hex: '#FACC15', dark: '#A16207', name: 'yellow' },
  { hex: '#22C55E', dark: '#166534', name: 'green' },
  { hex: '#A855F7', dark: '#6B21A8', name: 'purple' },
];
export const SHAPES = ['diamond', 'round', 'triangle'] as const;

// the things the friends want each round (each has its own drawing below)
export const THINGS = ['berry', 'apple', 'ball', 'carrot', 'acorn', 'cookie', 'flower', 'coin', 'shell', 'leaf'] as const;
export type Thing = typeof THINGS[number];
export const PLURAL: Record<Thing, string> = {
  berry: 'berries', apple: 'apples', ball: 'balls', carrot: 'carrots', acorn: 'acorns',
  cookie: 'cookies', flower: 'flowers', coin: 'gold coins', shell: 'shells', leaf: 'leaves',
};

// who sits on the far bank: the baby dragons (Ember's picture) or a
// visiting animal family (Kelvin's critter pictures)
export type Who = 'dragon' | Exclude<SpeciesKey, 'dragon' | 'fox' | 'owl' | 'turtle'>;
export const WHO_NAME: Record<Who, string> = {
  dragon: 'baby dragon', rabbit: 'bunny', squirrel: 'squirrel', hedgehog: 'hedgehog', frog: 'frog', deer: 'deer',
  koala: 'koala', raccoon: 'raccoon', bee: 'bee', butterfly: 'butterfly', swan: 'swan', peacock: 'peacock', parrot: 'parrot',
};

// ── The little stories (Kelvin 2026-11-23: "first berries, next the dragons
// want to play with toys, next they're hungry for apples") ──
// Every share round and every pattern round tells its own story, dealt
// fairly from these decks (lib/variety.ts): all are used before any comes
// back, and none shows up twice in a row.
export interface ShareStory { who: Who; thing: Thing; line: string; done: string }
// the very first three shares, in this order, for every new player
export const FIRST_SHARES: ShareStory[] = [
  { who: 'dragon', thing: 'berry', line: 'The baby dragons just woke up from their nap. They are hungry for berries!', done: 'Munch, munch! The baby dragons love their berries.' },
  { who: 'dragon', thing: 'ball', line: 'Now the baby dragons want to play! Share the bouncy balls.', done: 'Bounce, bounce! Everyone has toys to play with.' },
  { who: 'dragon', thing: 'apple', line: 'All that playing made the baby dragons hungry again. Time for apples!', done: 'Crunch! The baby dragons are full and happy.' },
];
export const SHARE_STORIES: ShareStory[] = [
  { who: 'dragon', thing: 'cookie', line: 'The baby dragons baked cookies with Grandma Dragon. Time to share!', done: 'Yum! The cookies are still warm.' },
  { who: 'dragon', thing: 'coin', line: 'The baby dragons are starting their very own treasure piles!', done: 'Shiny! Every baby dragon has a treasure pile.' },
  { who: 'dragon', thing: 'shell', line: 'The baby dragons found pretty shells by the river.', done: 'The baby dragons are making shell necklaces!' },
  { who: 'rabbit', thing: 'carrot', line: 'A bunny family hopped over for a carrot picnic!', done: 'Crunch, crunch! Happy bunnies.' },
  { who: 'squirrel', thing: 'acorn', line: 'The squirrels are filling their winter pantry with acorns.', done: 'The squirrels are ready for winter!' },
  { who: 'hedgehog', thing: 'apple', line: 'The hedgehogs rolled in, sniffing for apples!', done: 'The hedgehogs are curled up with their apples.' },
  { who: 'bee', thing: 'flower', line: 'The bees are buzzing! Every bee wants flowers to visit.', done: 'Buzz, buzz! The bees are making honey.' },
  { who: 'koala', thing: 'leaf', line: 'The sleepy koalas want leaves for a snack.', done: 'The koalas are munching, then napping.' },
  { who: 'frog', thing: 'ball', line: 'The frogs want to play ball by the pond!', done: 'Ribbit! Let the ball game begin.' },
  { who: 'deer', thing: 'berry', line: 'The deer family found Kailia\'s berry basket.', done: 'The deer are nibbling happily.' },
  { who: 'raccoon', thing: 'cookie', line: 'The raccoons smelled cookies! Share them fairly.', done: 'The raccoons say thank you with a little dance.' },
  { who: 'swan', thing: 'shell', line: 'The swans are decorating their nests with shells.', done: 'What beautiful nests!' },
  { who: 'peacock', thing: 'coin', line: 'The peacocks love shiny things! Share the gold coins.', done: 'The peacocks are showing off their shiny coins.' },
  { who: 'butterfly', thing: 'flower', line: 'The butterflies are looking for flowers to rest on.', done: 'The butterflies are resting on their flowers.' },
  { who: 'parrot', thing: 'apple', line: 'The chatty parrots are squawking for apples!', done: 'Squawk! Thank you, thank you!' },
];

export interface PathStory { who: Who; line: string; done: string }
export const PATH_STORIES: PathStory[] = [
  { who: 'dragon', line: 'A baby dragon is waving from the other side. Fix the path so Kailia can visit!', done: 'The baby dragon gives Kailia a warm hug!' },
  { who: 'rabbit', line: 'The bunny invited Kailia to a party across the river!', done: 'Hop, hop, hooray! Let the party begin.' },
  { who: 'frog', line: 'The frog is calling from the far bank. Let\'s go say hi!', done: 'Ribbit! The frog is so happy to see Kailia.' },
  { who: 'squirrel', line: 'The squirrel needs help gathering acorns on the other side!', done: 'Kailia made it! Now they can gather acorns together.' },
  { who: 'hedgehog', line: 'A little hedgehog is lost on the other side. Let\'s go get him!', done: 'The little hedgehog is found!' },
  { who: 'deer', line: 'The deer wants to show Kailia a secret meadow!', done: 'Kailia made it across! The secret meadow is beautiful.' },
  { who: 'koala', line: 'The koala is too sleepy to cross. Kailia will go to her!', done: 'Kailia made it! The sleepy koala smiles.' },
  { who: 'swan', line: 'The swan has a surprise waiting on the far bank!', done: 'Surprise! The swan has a new baby swan.' },
  { who: 'raccoon', line: 'The raccoon found something sparkly across the river!', done: 'Kailia made it! What a sparkly find.' },
  { who: 'peacock', line: 'The peacock wants to show Kailia his feathers!', done: 'Ta-da! What beautiful feathers.' },
  { who: 'bee', line: 'The bee found the sweetest flowers. Follow her across!', done: 'Kailia made it to the sweet flowers!' },
  { who: 'butterfly', line: 'The butterfly is dancing on the far bank. Let\'s join her!', done: 'Kailia and the butterfly are dancing!' },
  { who: 'parrot', line: 'The parrot has a new song to sing for Kailia!', done: 'What a happy song!' },
];

export interface Tok { c: number; s: number; n?: number; k?: Thing }
export const same = (a: Tok, b: Tok) => a.c === b.c && a.s === b.s && a.n === b.n && a.k === b.k;

export type Twist = 'plain' | 'leftover' | 'headstart';
export interface ShareRound {
  kind: 'share'; story: ShareStory; babies: number; each: number; extra: number; twist: Twist;
  start: number[];             // what each one already has (the head start twist)
}
export interface PatternRound {
  kind: 'pattern';
  story: PathStory;
  seq: Tok[];
  blanks: number[];          // stone indexes the child fills, left to right
  options: Tok[][];          // choices for each blank
  numbers: boolean;
  things: boolean;           // a pattern made of things instead of gems
  fam: string;
}
export type Round = ShareRound | PatternRound;

export type Fam = 'AB' | 'AAB' | 'ABB' | 'ABC' | 'AABB' | 'shapeAB' | 'ABCD' | 'mixABC' | 'ABAC'
  | 'up1' | 'up2' | 'up3' | 'up5' | 'up10' | 'down1' | 'down2';
export const STEP: Partial<Record<Fam, number>> = { up1: 1, up2: 2, up3: 3, up5: 5, up10: 10, down1: -1, down2: -2 };

export const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export const GAME = 'dragon-bridge';
export const SHARES_PER_LEVEL = 2;

// rounds per level: shares and patterns take turns
export function kindsFor(level: number): Round['kind'][] {
  return level <= 2 ? ['share', 'pattern', 'share']
    : level < 15 ? ['share', 'pattern', 'share', 'pattern']
    : ['pattern', 'share', 'pattern', 'share', 'pattern'];
}
export const patternsPer = (level: number) => kindsFor(level).filter(k => k === 'pattern').length;

// Which kinds of pattern a level may ask for: the 30-level ladder climbs
// through them a few levels at a time (each level mixes two or three
// kinds, never the same kind twice in a row); the Star worlds mix all of
// the harder ones.
export function famPool(level: number): Fam[] {
  if (level <= 2) return ['AB'];
  if (level <= 5) return ['AB', 'AAB', 'ABB'];
  if (level <= 8) return ['AAB', 'ABB', 'ABC'];
  if (level <= 11) return ['ABC', 'AABB', 'shapeAB'];
  if (level <= 14) return ['AABB', 'shapeAB', 'ABAC', 'up1'];
  if (level <= 18) return ['up1', 'ABAC', 'ABCD', 'up2'];
  if (level <= 22) return ['up2', 'ABCD', 'mixABC', 'up5'];
  if (level <= 26) return ['up5', 'up10', 'mixABC', 'up2'];
  if (level <= 30) return ['up10', 'down1', 'up5', 'up3'];
  return ['ABCD', 'AABB', 'mixABC', 'ABAC', 'shapeAB', 'up2', 'up3', 'up5', 'up10', 'down1', 'down2'];
}

// the pattern kinds of a level, worked out once and remembered, so a
// level never repeats the kind the level before it ended on
export const famMemo = new Map<number, Fam[]>();
export function famsFor(level: number): Fam[] {
  const hit = famMemo.get(level);
  if (hit) return hit;
  let prev: Fam | undefined;
  for (let L = Math.max(1, level - 40); L < level; L++) { const f = famsFor(L); prev = f[f.length - 1]; }
  const pool = famPool(level);
  const rand = roundRandom(GAME + ':fam', level);
  const out: Fam[] = [];
  for (let i = 0; i < patternsPer(level); i++) {
    const last = out[out.length - 1] ?? prev;
    const fresh = pool.filter(f => f !== last && !out.includes(f));
    const choices = fresh.length ? fresh : pool.filter(f => f !== last).length ? pool.filter(f => f !== last) : pool;
    out.push(randPick(rand, choices));
  }
  famMemo.set(level, out);
  return out;
}

export function makePattern(level: number, tier: DifficultyTier, fam: Fam, story: PathStory, useThings: boolean): PatternRound {
  const star = isStarLevel(level);
  const tiny = tier === 'tiny';
  const len = level <= 8 || tiny ? 6 : star ? 8 : 7;
  const nOpts = tiny && level <= 8 ? 2 : level <= 2 ? 2 : 3;
  const step = STEP[fam];
  let seq: Tok[];
  let unitLen = 2;
  const things = step === undefined && useThings && fam !== 'shapeAB' && fam !== 'mixABC';

  if (step !== undefined) {
    // counting on (or back) along the stones
    const reach = Math.round(endlessRamp(level, 3, 80, 25));
    let start = step === 1 ? rint(1, reach) : Math.abs(step) * rint(0, Math.max(2, Math.round(reach / Math.abs(step) / 2)));
    if (step < 0) start = Math.abs(step) * (len + rint(0, 4)) + (step === -1 ? rint(0, reach) : 0);
    seq = Array.from({ length: len }, (_, i) => ({ c: -1, s: 0, n: start + i * step }));
    unitLen = 2;
  } else {
    const cols = shuffle([0, 1, 2, 3, 4]);
    const kinds = shuffle([...THINGS]);
    const s0 = rint(0, 2);
    const shp = shuffle([0, 1, 2]);
    const T = (ci: number, s = s0): Tok => (things ? { c: -1, s: 0, k: kinds[ci] } : { c: cols[ci], s });
    const unit: Tok[] = {
      AB: [T(0), T(1)],
      AAB: [T(0), T(0), T(1)],
      ABB: [T(0), T(1), T(1)],
      ABC: [T(0), T(1), T(2)],
      AABB: [T(0), T(0), T(1), T(1)],
      ABAC: [T(0), T(1), T(0), T(2)],
      ABCD: [T(0), T(1), T(2), T(3)],
      shapeAB: [T(0, shp[0]), T(0, shp[1])],
      mixABC: [T(0, shp[0]), T(1, shp[1]), T(2, shp[2])],
    }[fam as 'AB'];
    unitLen = unit.length;
    seq = Array.from({ length: Math.max(len, unitLen + 2) }, (_, i) => unit[i % unit.length]);
  }
  const n = seq.length;

  // which stones are missing: the last one; later sometimes two, and in
  // the Star worlds sometimes one in the middle (always after a full
  // pattern has been shown)
  const blanks: number[] = [];
  const two = !tiny && ((level >= 21 && Math.random() < 0.4) || (star && Math.random() < 0.55));
  if (star && Math.random() < 0.45) {
    blanks.push(rint(Math.max(unitLen + 1, 3), n - 2));
    if (two) blanks.push(n - 1);
  } else {
    if (two) blanks.push(n - 2);
    blanks.push(n - 1);
  }

  const options = blanks.map(bi => {
    const ans = seq[bi];
    const pool: Tok[] = [];
    if (step !== undefined) {
      const v = ans.n!;
      [v + step, v - step, v + 1, v - 1, v + 2, v + 10, v - 10].forEach(x => { if (x >= 0) pool.push({ c: -1, s: 0, n: x }); });
    } else if (things) {
      seq.forEach(t => pool.push(t));
      const spare = THINGS.find(k => !seq.some(t => t.k === k));
      if (spare) pool.push({ c: -1, s: 0, k: spare });
    } else {
      seq.forEach(t => pool.push(t));
      // a same-color, other-shape gem makes shape patterns a real look
      pool.push({ c: ans.c, s: (ans.s + 1) % 3 }, { c: (ans.c + 1) % 5, s: ans.s });
    }
    const wrong: Tok[] = [];
    for (const t of shuffle(pool)) {
      if (wrong.length >= nOpts - 1) break;
      if (!same(t, ans) && !wrong.some(w => same(w, t))) wrong.push(t);
    }
    return shuffle([ans, ...wrong]);
  });

  return { kind: 'pattern', story, seq, blanks, options, numbers: step !== undefined, things, fam };
}

// How many friends and how many things each, for share k (0 or 1) of a
// level. The total climbs with the level (a window that slides up), the
// split inside it is a surprise each round, and a round never repeats the
// share just before it (in this level or the one before).
export function shareWindow(level: number, tier: DifficultyTier): { bLo: number; bHi: number; tLo: number; tHi: number; eHi: number } {
  const L = level;
  let w = L <= 1 ? { bLo: 2, bHi: 2, tLo: 2, tHi: 4 }
    : L <= 2 ? { bLo: 2, bHi: 3, tLo: 3, tHi: 6 }
      : L <= 4 ? { bLo: 2, bHi: 3, tLo: 4, tHi: 8 }
        : L <= 7 ? { bLo: 2, bHi: 4, tLo: 6, tHi: 10 }
          : L <= 10 ? { bLo: 2, bHi: 4, tLo: 8, tHi: 12 }
            : L <= 15 ? { bLo: 3, bHi: 4, tLo: 9, tHi: 15 }
              : L <= 20 ? { bLo: 3, bHi: 5, tLo: 12, tHi: 18 }
                : L <= 30 ? { bLo: 3, bHi: 5, tLo: 14, tHi: 24 }
                  : { bLo: 2, bHi: 5, tLo: 12, tHi: 24 };
  let eHi = 7;
  if (tier === 'tiny') { w = { bLo: 2, bHi: L <= 8 ? 2 : 3, tLo: Math.min(6, 2 + Math.floor(L / 4)), tHi: Math.min(10, 4 + Math.floor(L / 3)) }; eHi = L <= 5 ? 3 : 4; }
  else if (tier === 'small') { w = { ...w, bHi: Math.min(w.bHi, 4), tHi: Math.min(w.tHi, 16), tLo: Math.min(w.tLo, 10) }; eHi = 4; }
  return { ...w, eHi };
}

function shareCombos(level: number, tier: DifficultyTier): { babies: number; each: number }[] {
  const { bLo, bHi, tLo, tHi, eHi } = shareWindow(level, tier);
  const out: { babies: number; each: number }[] = [];
  for (let babies = bLo; babies <= bHi; babies++) {
    for (let each = 1; each <= eHi; each++) {
      const t = babies * each;
      if (t >= tLo && t <= tHi) out.push({ babies, each });
    }
  }
  // a window too narrow for any split falls back to the nearest one
  if (!out.length) out.push({ babies: bLo, each: Math.max(1, Math.min(eHi, Math.round(tLo / bLo))) });
  return out;
}

const shareMemo = new Map<string, { babies: number; each: number }>();
export function shareNumbers(level: number, k: number, tier: DifficultyTier): { babies: number; each: number } {
  const key = `${level}|${k}|${tier}`;
  const hit = shareMemo.get(key);
  if (hit) return hit;
  // the share right before this one (warming the memo from a little way
  // back keeps this cheap even on level 500)
  if (k === 0 && level > 2 && !shareMemo.has(`${level - 1}|${SHARES_PER_LEVEL - 1}|${tier}`)) {
    for (let L = Math.max(1, level - 30); L < level; L++) for (let j = 0; j < SHARES_PER_LEVEL; j++) shareNumbers(L, j, tier);
  }
  const prev = k > 0 ? shareNumbers(level, k - 1, tier)
    : level > 1 ? shareNumbers(level - 1, SHARES_PER_LEVEL - 1, tier) : null;
  const combos = shareCombos(level, tier);
  const fresh = combos.filter(c => !prev || c.babies !== prev.babies || c.each !== prev.each);
  const out = randPick(roundRandom(GAME + ':share', level, k), fresh.length ? fresh : combos);
  shareMemo.set(key, out);
  return out;
}

export function shareTwist(level: number, k: number, tier: DifficultyTier): Twist {
  const tiny = tier === 'tiny';
  if (level <= 5 || (tiny && level <= 10)) return 'plain';
  if (level <= 10 || tiny) return k === 1 ? 'leftover' : 'plain';
  if (level <= 20) return k === 0 ? 'headstart' : 'leftover';
  const rand = roundRandom(GAME + ':twist', level, k);
  return randPick(rand, k === 0 ? ['headstart', 'leftover', 'plain'] as Twist[] : ['leftover', 'headstart'] as Twist[]);
}

export function shareStory(level: number, k: number): ShareStory {
  const i = (level - 1) * SHARES_PER_LEVEL + k;
  if (i < FIRST_SHARES.length) return FIRST_SHARES[i];
  return SHARE_STORIES[dealIndex(SHARE_STORIES.length, GAME + ':share', i - FIRST_SHARES.length)];
}

export function makeShare(level: number, k: number, tier: DifficultyTier): ShareRound {
  const { babies, each } = shareNumbers(level, k, tier);
  const twist = shareTwist(level, k, tier);
  const rand = roundRandom(GAME + ':start', level, k);
  const extra = twist === 'leftover' ? randInt(rand, 1, babies - 1) : 0;
  let start = Array(babies).fill(0) as number[];
  if (twist === 'headstart') {
    // a few already have some (never all the same), the basket holds the rest
    start = start.map(() => randInt(rand, 0, Math.max(1, each - 1)));
    if (start.every(v => v === start[0])) start[0] = start[0] === 0 ? 1 : 0;
    start = start.map(v => Math.min(v, each - 1 < 0 ? 0 : each - 1));
    if (start.every(v => v === start[0])) start = start.map((_, i) => (i === 0 ? 0 : 1));
  }
  return { kind: 'share', story: shareStory(level, k), babies, each: Math.max(each, ...start.map(v => v + 1)), extra, twist, start };
}

/** The far-bank stories of a level: dealt fairly, skipping any animal that
 *  is already sharing in this level, so one level never shows the same
 *  family twice. */
export function pathStories(level: number): PathStory[] {
  const sharing = new Set(Array.from({ length: SHARES_PER_LEVEL }, (_, k) => shareStory(level, k).who));
  const dealt = levelStories(PATH_STORIES, GAME + ':path', level, 6);
  const fresh = dealt.filter(st => !sharing.has(st.who));
  return [...fresh, ...dealt.filter(st => sharing.has(st.who))].slice(0, 3);
}

export function planLevel(level: number, tier: DifficultyTier): Round[] {
  const kinds = kindsFor(level);
  const fams = famsFor(level);
  const paths = pathStories(level);
  let s = 0, p = 0;
  return kinds.map(kind => {
    if (kind === 'share') return makeShare(level, s++, tier);
    const i = p++;
    // gem patterns and patterns of things take turns, so the stones look new
    const useThings = (level + i) % 2 === 0;
    return makePattern(level, tier, fams[i], paths[i], useThings);
  });
}

