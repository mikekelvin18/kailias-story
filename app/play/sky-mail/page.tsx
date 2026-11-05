'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel } from '@/lib/rewards';
import Stage from '@/components/friends/kit/Stage';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import {
  Arrow, Berry, Book, Check, Envelope, Face, Mailbox, Notes, Pebbles, Rider, Shape, Squiggle, Treat,
  RIDER_KINDS, type BerryKind, type RiderKind, type ShapeKind, type TreatKind,
} from '../_pieces/pieces';

// ─── Sky Mail ─────────────────────────────────────────────────────────────────
// Swipe-card game (think: flick cards left/right with real physics).
// The wind stole Noel's letters above Owl's Tower — the child sorts each
// flying card into the right mailbox with a swipe. Three mailbags:
//   math      → swipe toward the correct answer          (math)
//   sentence  → "sounds right" vs "silly" word order     (reading)
//   wind      → swipe the direction shown                (fine motor)
// Swiping itself is measured: decision speed + how straight the fling is.
//
// The sorting happens in a breezy painted sky: real drawn mailboxes on
// posts, each with a sign showing its answer. A good fling sends the
// letter whooshing into its mailbox (the flag pops up), Kailia runs over
// and jumps, the friend cheers. A miss springs back with a friendly
// wobble and the friend wobbles too; after two misses the friend runs
// over to the right mailbox and bounces while its sign glows. The
// pieces are drawn (shapes, berries, treats, arrows, wind riders,
// faces); only the Feeling Finder's little moments are still emoji.

type DeckId = 'math' | 'sentence' | 'wind' | 'tricky' | 'shapes' | 'feelings' | 'rhyme' | 'berries';
type Dir = 'left' | 'right' | 'up' | 'down';

// what a card or a mailbox sign shows
type Piece =
  | { t: 'text'; s: string }
  | { t: 'emoji'; s: string }
  | { t: 'treats'; kind: TreatKind; n: number }
  | { t: 'berries'; kind: BerryKind; n: number }
  | { t: 'rider'; kind: RiderKind; dir: Dir }
  | { t: 'shape'; kind: ShapeKind }
  | { t: 'arrow'; dir: Dir }
  | { t: 'face'; mood: 'happy' | 'sad' }
  | { t: 'sign'; icon: 'check' | 'squiggle' | 'notes' | 'pebbles' | 'left' | 'right'; s: string };

interface Card {
  main: Piece;
  sub?: string;
  bigSub?: boolean;   // Tricky Wind shows the (sometimes lying) word large
  split?: { left: Piece; right: Piece };  // comparison decks show two framed sides
  correct: Dir;
  targets: Partial<Record<Dir, Piece>>;
}

const DECKS: Record<DeckId, { title: string; desc: string; domain: string; noel: string }> = {
  math: {
    title: 'Number Letters', domain: 'math',
    desc: 'Swipe each letter to the mailbox with the right answer!',
    noel: 'These letters have number riddles! Fling each one to the mailbox with the TRUE answer!',
  },
  sentence: {
    title: 'Silly Sentences', domain: 'reading',
    desc: 'Sounds right? Swipe right! All mixed up? Swipe left!',
    noel: 'Uh oh — the wind shuffled some words! If a letter sounds RIGHT, swipe right. If it sounds SILLY, swipe left!',
  },
  wind: {
    title: 'Wind Riders', domain: 'fine motor',
    desc: 'Swipe each rider the way the wind blows!',
    noel: 'These little riders need a push! Swipe each one exactly the way its arrow points — smooth and straight!',
  },
  tricky: {
    title: 'Tricky Wind', domain: 'processing',
    desc: 'The word sometimes LIES — always follow the arrow!',
    noel: "Watch out — the tricky wind writes the WRONG word sometimes! Don't listen to the word. Follow the ARROW only!",
  },
  shapes: {
    title: 'Shape Twins', domain: 'sensory',
    desc: 'Every shape has a twin — swipe it home!',
    noel: 'Every shape letter has a twin mailbox! Look closely and swipe it to its perfect match!',
  },
  feelings: {
    title: 'Feeling Finder', domain: 'communication',
    desc: 'Happy or sad? Swipe how it would feel!',
    noel: 'These letters show little moments. How would THAT feel? Swipe to the happy face or the sad face!',
  },
  berries: {
    title: 'Berry Battle', domain: 'math',
    desc: 'Which side has MORE berries? Swipe to the winner!',
    noel: 'Two berry bushes had a contest! Look closely — swipe toward the side with MORE!',
  },
  rhyme: {
    title: 'Rhyme Chime', domain: 'reading',
    desc: 'Do the words rhyme? Swipe and find out!',
    noel: 'Say both words out loud — do their endings SING together? Rhymes go right, no-rhymes go left!',
  },
};

const SENTENCE_PAIRS: [string, string][] = [
  ['The dog runs fast', 'Runs the fast dog'],
  ['I like red apples', 'Apples red like I'],
  ['The cat is sleepy', 'Sleepy the is cat'],
  ['We jump very high', 'High very jump we'],
  ['Birds fly in the sky', 'Sky the in fly birds'],
  ['The fish can swim', 'Swim can fish the'],
  ['Mom bakes yummy bread', 'Bread yummy mom bakes'],
  ['The sun is bright', 'Bright is the sun'],
  ['I hug my teddy', 'Teddy my hug I'],
  ['Frogs hop on rocks', 'Rocks on hop frogs'],
  ['We read a book', 'Book a read we'],
  ['The bear eats honey', 'Honey the eats bear'],
];

// wind riders: light things the wind carries (drawn)
const WIND_RIDERS = RIDER_KINDS;

const SHAPES: ShapeKind[] = ['circle', 'triangle', 'square', 'star', 'heart', 'purple'];

// little moments → how would that feel? (emotion inference, no reading needed)
// these little scenes are still emoji pictures
const FEELING_CARDS: [string, 'happy' | 'sad'][] = [
  ['🎂🎈', 'happy'], ['💔🧸', 'sad'], ['🍦☀️', 'happy'], ['🌧️⚽', 'sad'],
  ['🎁🎀', 'happy'], ['🤕🩹', 'sad'], ['🐶💕', 'happy'], ['🍪❌', 'sad'],
  ['🎠🎡', 'happy'], ['😿🥛', 'sad'],
];

const RHYME_TRUE: [string, string][] = [
  ['cat', 'hat'], ['sun', 'bun'], ['star', 'car'], ['bee', 'tree'], ['fish', 'dish'],
  ['cake', 'snake'], ['mouse', 'house'], ['moon', 'spoon'], ['bear', 'chair'], ['dog', 'log'],
];
const RHYME_FALSE: [string, string][] = [
  ['cat', 'banana'], ['dog', 'star'], ['sun', 'fish'], ['bee', 'rock'], ['cake', 'bird'],
  ['moon', 'apple'], ['bear', 'cup'], ['star', 'milk'],
];

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound is a bonus */ }
}

const sfx = {
  whoosh: () => playNotes([{ f: 880, t: 0, d: 0.09 }, { f: 1245, t: 0.05, d: 0.14 }]),
  back:   () => playNotes([{ f: 262, t: 0, d: 0.18 }]),
  deck:   () => playNotes([{ f: 659, t: 0, d: 0.12 }, { f: 784, t: 0.1, d: 0.12 }, { f: 988, t: 0.2, d: 0.25 }]),
  fanfare:() => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

const PRAISE = ['Whoosh! Special delivery!', 'Right in the mailbox!', 'Kailia is cheering for you!', 'What a fling!', 'Another letter home!'];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const txt = (s: string): Piece => ({ t: 'text', s });

// ── Card generation, scaled to the child's tier ──
function buildDeck(deck: DeckId, tier: DifficultyTier): Card[] {
  const count = tier === 'tiny' ? 8 : 10;
  const cards: Card[] = [];

  if (deck === 'math') {
    for (let i = 0; i < count; i++) {
      let question: Piece, answer: number, sub: string | undefined;
      if (tier === 'tiny') {
        answer = 1 + Math.floor(Math.random() * 5);
        question = { t: 'treats', kind: pick<TreatKind>(['straw', 'cookie', 'star', 'apple']), n: answer };
        sub = 'How many?';
      } else if (tier === 'small') {
        const a = 1 + Math.floor(Math.random() * 5), b = 1 + Math.floor(Math.random() * 4);
        answer = a + b; question = txt(`${a} + ${b}`);
      } else {
        const kind = Math.random();
        if (kind < 0.45) { const a = 3 + Math.floor(Math.random() * 12), b = 1 + Math.floor(Math.random() * 8); answer = a + b; question = txt(`${a} + ${b}`); }
        else if (kind < 0.8) { const a = 5 + Math.floor(Math.random() * 13), b = 1 + Math.floor(Math.random() * Math.min(a, 9)); answer = a - b; question = txt(`${a} − ${b}`); }
        else { const a = 2 + Math.floor(Math.random() * 4), b = 2 + Math.floor(Math.random() * 3); answer = a * b; question = txt(`${a} × ${b}`); }
      }
      let wrong = answer + pick([-2, -1, 1, 2]);
      if (wrong < 0 || wrong === answer) wrong = answer + 1;
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      cards.push({ main: question, sub, correct,
        targets: { left: txt(String(correct === 'left' ? answer : wrong)), right: txt(String(correct === 'right' ? answer : wrong)) } });
    }
  }

  if (deck === 'sentence') {
    const pairs = [...SENTENCE_PAIRS].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [good, silly] of pairs) {
      const useGood = Math.random() < 0.5;
      cards.push({ main: txt(useGood ? good : silly), correct: useGood ? 'right' : 'left',
        targets: { left: { t: 'sign', icon: 'squiggle', s: 'Silly!' }, right: { t: 'sign', icon: 'check', s: 'Sounds right' } } });
    }
  }

  if (deck === 'wind') {
    const dirs: Dir[] = tier === 'tiny' ? ['left', 'right'] : ['left', 'right', 'up', 'down'];
    for (let i = 0; i < count; i++) {
      const d = pick(dirs);
      // Readers get the direction word under the arrow (builds left/right
      // vocabulary); pre-readers get the arrow alone — no text clutter.
      cards.push({ main: { t: 'rider', kind: pick(WIND_RIDERS), dir: d },
        sub: tier === 'big' ? d.toUpperCase() : 'Swipe this way!', correct: d,
        targets: { left: { t: 'arrow', dir: 'left' }, right: { t: 'arrow', dir: 'right' },
          ...(dirs.length > 2 ? { up: { t: 'arrow', dir: 'up' } as Piece, down: { t: 'arrow', dir: 'down' } as Piece } : {}) } });
    }
  }

  if (deck === 'shapes') {
    for (let i = 0; i < count; i++) {
      const shape = pick(SHAPES);
      const other = pick(SHAPES.filter(s => s !== shape));
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      cards.push({ main: { t: 'shape', kind: shape }, sub: 'Find its twin!', correct,
        targets: { left: { t: 'shape', kind: correct === 'left' ? shape : other }, right: { t: 'shape', kind: correct === 'right' ? shape : other } } });
    }
  }

  if (deck === 'feelings') {
    const shuffled = [...FEELING_CARDS].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [scene, mood] of shuffled) {
      cards.push({ main: { t: 'emoji', s: scene }, sub: 'How would that feel?', correct: mood === 'happy' ? 'right' : 'left',
        targets: { left: { t: 'face', mood: 'sad' }, right: { t: 'face', mood: 'happy' } } });
    }
  }

  if (deck === 'rhyme') {
    for (let i = 0; i < count; i++) {
      const isRhyme = Math.random() < 0.5;
      const [a, b] = pick(isRhyme ? RHYME_TRUE : RHYME_FALSE);
      cards.push({ main: txt(`${a} · ${b}`), sub: 'Say them out loud!', correct: isRhyme ? 'right' : 'left',
        targets: { left: { t: 'sign', icon: 'pebbles', s: 'No rhyme' }, right: { t: 'sign', icon: 'notes', s: 'Rhyme!' } } });
    }
  }

  if (deck === 'berries') {
    // numerosity comparison: which side has more? gaps shrink as tiers rise
    for (let i = 0; i < count; i++) {
      const berry = pick<BerryKind>(['straw', 'blue', 'cherry']);
      const small = tier === 'tiny' ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 5);
      const gap = tier === 'big' ? 1 : 1 + Math.floor(Math.random() * 2);
      const big = small + gap;
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      const leftN = correct === 'left' ? big : small;
      const rightN = correct === 'right' ? big : small;
      cards.push({ main: txt(''), sub: 'Which side has MORE?', correct,
        split: { left: { t: 'berries', kind: berry, n: leftN }, right: { t: 'berries', kind: berry, n: rightN } },
        targets: { left: { t: 'sign', icon: 'left', s: 'More!' }, right: { t: 'sign', icon: 'right', s: 'More!' } } });
    }
  }

  if (deck === 'tricky') {
    // Stroop-style inhibition: the word sometimes disagrees with the arrow;
    // the rule is ALWAYS obey the arrow. Readers only (big tier).
    const dirs: Dir[] = ['left', 'right', 'up', 'down'];
    for (let i = 0; i < count; i++) {
      const d = pick(dirs);
      const lies = Math.random() < 0.6;
      const word = lies ? pick(dirs.filter(x => x !== d)) : d;
      cards.push({ main: { t: 'rider', kind: pick(WIND_RIDERS), dir: d },
        sub: word.toUpperCase(), bigSub: true, correct: d,
        targets: { left: { t: 'arrow', dir: 'left' }, right: { t: 'arrow', dir: 'right' }, up: { t: 'arrow', dir: 'up' }, down: { t: 'arrow', dir: 'down' } } });
    }
  }

  return cards;
}

// ── Drawing a piece ──
function PieceView({ p, size, onCard }: { p: Piece; size: number; onCard?: boolean }) {
  switch (p.t) {
    case 'text': return <>{p.s}</>;
    case 'emoji': return <span style={{ fontSize: size, lineHeight: 1.1 }}>{p.s}</span>;
    case 'shape': return <Shape kind={p.kind} size={size} />;
    case 'arrow': return <Arrow dir={p.dir} size={size} />;
    case 'face': return <Face mood={p.mood} size={size} />;
    case 'treats': {
      const s = p.n > 3 ? size * 0.62 : size * 0.8;
      return (
        <span className="flex flex-wrap justify-center gap-1" style={{ maxWidth: s * 3 + 12 }}>
          {Array.from({ length: p.n }, (_, i) => <Treat key={i} kind={p.kind} size={s} />)}
        </span>
      );
    }
    case 'berries': {
      const s = p.n > 6 ? size * 0.56 : p.n > 4 ? size * 0.66 : size * 0.82;
      return (
        <span className="flex flex-wrap justify-center items-center gap-0.5">
          {Array.from({ length: p.n }, (_, i) => <Berry key={i} kind={p.kind} size={s} />)}
        </span>
      );
    }
    case 'rider':
      return (
        <span className="inline-flex items-center gap-2">
          <span className="float inline-block"><Rider kind={p.kind} size={size} /></span>
          <Arrow dir={p.dir} size={size * (onCard ? 0.9 : 0.7)} />
        </span>
      );
    case 'sign': {
      const icon = p.icon === 'check' ? <Check size={size} /> : p.icon === 'squiggle' ? <Squiggle size={size} />
        : p.icon === 'notes' ? <Notes size={size} /> : p.icon === 'pebbles' ? <Pebbles size={size} />
        : <Arrow dir={p.icon} size={size * 0.85} color="#F472B6" />;
      return <span className="flex flex-col items-center leading-tight">{icon}<span>{p.s}</span></span>;
    }
  }
}

// where each mailbox stands in the sky (% of the scene: centre of the box)
// and where Kailia runs when a letter lands in it
const BOX: Record<'two' | 'four', Record<Dir, { x: number; y: number; kailia: number }>> = {
  two:  { left: { x: 12, y: 44, kailia: 25 }, right: { x: 88, y: 44, kailia: 75 }, up: { x: 50, y: 10, kailia: 50 }, down: { x: 50, y: 80, kailia: 34 } },
  four: { left: { x: 12, y: 46, kailia: 25 }, right: { x: 88, y: 46, kailia: 75 }, up: { x: 50, y: 9, kailia: 50 }, down: { x: 50, y: 73, kailia: 30 } },
};
const BOX_PX = 64; // drawn mailbox width

const clampPct = (v: number) => Math.max(10, Math.min(90, v));

export default function SkyMailPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [deckId, setDeckId] = useState<DeckId | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'select' | 'playing' | 'deckDone' | 'allDone'>('select');
  const [drag, setDrag] = useState({ dx: 0, dy: 0, grabbed: false });
  const [flyDir, setFlyDir] = useState<Dir | null>(null);
  const [flyOffset, setFlyOffset] = useState<[number, number] | null>(null);
  const [wobble, setWobble] = useState(false);
  const [hintDir, setHintDir] = useState<Dir | null>(null);
  const [doneDecks, setDoneDecks] = useState<DeckId[]>([]);
  const [noelLine, setNoelLine] = useState('Pick a mailbag to sort!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  // Kailia and the friend on the hill under the mailboxes
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(32);
  const [petX, setPetX] = useState(66);
  const [kailiaHop, setKailiaHop] = useState(0);
  const [flagDir, setFlagDir] = useState<Dir | null>(null);
  const { layer: burstLayer, fire } = useBursts();

  const dragRef = useRef({ startX: 0, startY: 0, path: 0, lx: 0, ly: 0 });
  const missesRef = useRef(0);
  const shownAtRef = useRef(0);
  const metricsRef = useRef({ wrong: 0, ms: [] as number[], eff: [] as number[] });
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const card = cards[idx];
  const fourWay = deckId === 'tricky' || (deckId === 'wind' && tier !== 'tiny');
  const boxes = BOX[fourWay ? 'four' : 'two'];
  // the card's spot in the scene (%): centred, lower when a mailbox waits above it
  const cardBox = fourWay ? { top: 20, h: 40, w: 50 } : { top: 6, h: 54, w: 54 };
  // The mailbag shelf grows with the child: pre-readers get the no-text
  // decks; readers unlock rhymes and the Tricky Wind inhibition deck.
  const availableDecks = useMemo<DeckId[]>(() => {
    if (tier === 'tiny') return ['berries', 'shapes', 'feelings', 'math', 'wind'];
    if (tier === 'small') return ['berries', 'shapes', 'feelings', 'math', 'sentence', 'wind'];
    return ['math', 'berries', 'sentence', 'wind', 'shapes', 'feelings', 'rhyme', 'tricky'];
  }, [tier]);

  const startDeck = useCallback((d: DeckId) => {
    sfx.deck();
    setDeckId(d);
    setCards(buildDeck(d, tier));
    setIdx(0);
    metricsRef.current = { wrong: 0, ms: [], eff: [] };
    missesRef.current = 0;
    shownAtRef.current = performance.now();
    setHintDir(null);
    setFlyDir(null);
    setKailiaX(32);
    setPetX(66);
    setNoelLine(DECKS[d].noel);
    setNoelMood('excited');
    setPhase('playing');
  }, [tier]);

  // ── Swipe physics ──
  function onPointerDown(e: React.PointerEvent) {
    if (phase !== 'playing' || flyDir) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, path: 0, lx: e.clientX, ly: e.clientY };
    setDrag({ dx: 0, dy: 0, grabbed: true });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.grabbed || flyDir) return;
    const d = dragRef.current;
    d.path += Math.hypot(e.clientX - d.lx, e.clientY - d.ly);
    d.lx = e.clientX; d.ly = e.clientY;
    setDrag({ dx: e.clientX - d.startX, dy: e.clientY - d.startY, grabbed: true });
  }

  // a letter lands: the flag pops up, sparkles, Kailia runs over and jumps, the friend cheers
  function celebrate(dir: Dir) {
    const b = boxes[dir];
    const kx = b.kailia;
    setKailiaX(kx);
    setPetX(p => (Math.abs(p - kx) >= 15 ? p : clampPct(kx + (kx > 50 ? -16 : 16))));
    setKailiaHop(n => n + 1);
    setPetMood('cheer');
    setTimeout(() => {
      setFlagDir(dir);
      fire(b.x, b.y - 4, ['#FFE066', '#FFFFFF', '#FF9EC7', '#8BE3FF'], 12, 60);
    }, 260);
    setTimeout(() => setFlagDir(f => (f === dir ? null : f)), 1100);
  }

  // after two misses the friend runs over to the right mailbox and bounces
  function friendHint(dir: Dir) {
    const px = dir === 'left' ? 24 : dir === 'right' ? 76 : dir === 'down' ? 66 : 50;
    setPetX(px);
    setPetMood('talk');
    // Kailia steps aside so the friend never stands on her
    setKailiaX(k => (Math.abs(k - px) >= 15 ? k : clampPct(px + (px > 50 ? -18 : 18))));
  }

  function onPointerUp() {
    if (!drag.grabbed || flyDir || !card) return;
    const { dx, dy } = drag;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    const dominant: Dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const validDirs = Object.keys(card.targets) as Dir[];

    if (dist < 80 || !validDirs.includes(dominant)) {
      setDrag({ dx: 0, dy: 0, grabbed: false }); // spring back, no judgement
      return;
    }

    if (dominant === card.correct) {
      const d = dragRef.current;
      const displacement = Math.hypot(dx, dy) || 1;
      metricsRef.current.ms.push(performance.now() - shownAtRef.current);
      metricsRef.current.eff.push(Math.min(1, displacement / Math.max(displacement, d.path)));
      sfx.whoosh();
      setNoelLine(PRAISE[(idx + metricsRef.current.ms.length) % PRAISE.length]);
      setFlyDir(dominant);
      // a good fling whooshes the letter right into its mailbox's slot
      const st = stageRef.current?.getBoundingClientRect();
      const W = st?.width ?? 366, H = st?.height ?? 470;
      const b = boxes[dominant];
      setFlyOffset([(b.x / 100) * W - W / 2, ((b.y - 3) / 100) * H - ((cardBox.top + cardBox.h / 2) / 100) * H]);
      setDrag({ dx, dy, grabbed: false });
      setNoelMood('excited');
      celebrate(dominant);
      setTimeout(() => {
        setFlyDir(null);
        setFlyOffset(null);
        setDrag({ dx: 0, dy: 0, grabbed: false });
        setHintDir(null);
        missesRef.current = 0;
        shownAtRef.current = performance.now();
        if (idx + 1 < cards.length) setIdx(i => i + 1);
        else finishDeck();
      }, 300);
    } else {
      metricsRef.current.wrong += 1;
      missesRef.current += 1;
      sfx.back();
      setDrag({ dx: 0, dy: 0, grabbed: false });
      setWobble(true);
      setTimeout(() => setWobble(false), 400);
      setPetMood('oops');
      const hints: Record<DeckId, string> = {
        sentence: 'Hmm, read it once more — does it really sound like that?',
        math: 'Ooh, count again — which mailbox is the TRUE answer?',
        tricky: 'The wind tricked you! Ignore the word — where does the ARROW point?',
        wind: 'Almost! Look at the arrow and swipe that exact way!',
        shapes: 'So close! Which mailbox has the EXACT same shape?',
        feelings: 'Think about it — would that make you smile or feel down?',
        rhyme: 'Say both words slowly — do the endings sound the same?',
        berries: 'Count each side with your finger — which bush grew MORE?',
      };
      setNoelLine(hints[deckId ?? 'wind']);
      setNoelMood('thinking');
      if (missesRef.current >= 2) { setHintDir(card.correct); friendHint(card.correct); } // gentle scaffold
    }
  }

  function finishDeck() {
    if (!deckId) return;
    const m = metricsRef.current;
    const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
    logQuestMetric(DECKS[deckId].domain, `sky-mail-${deckId}`, {
      cards: cards.length,
      wrongSwipes: m.wrong,
      avgDecisionMs: Math.round(avg(m.ms)),
      swipeEfficiency: Math.round(avg(m.eff) * 100),
    });
    // ✨ starlight: base for finishing, minus a little for wrong swipes,
    // never below the floor — effort always pays
    awardStarlight(Math.max(6, 12 - m.wrong * 2));
    const newDone = doneDecks.includes(deckId) ? doneDecks : [...doneDecks, deckId];
    setDoneDecks(newDone);
    if (newDone.length === availableDecks.length) {
      awardStarlight(25); // full mailbag-shelf bonus
      recordGameLevel('sky-mail', newDone.length);
      sfx.fanfare(); setPhase('allDone');
    }
    else { sfx.deck(); setPhase('deckDone'); }
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
  }

  // deckDone interstitial → back to select
  useEffect(() => {
    if (phase !== 'deckDone') return;
    const t = setTimeout(() => { setPhase('select'); setNoelLine('Wonderful sorting! Pick another mailbag!'); setNoelMood('celebrating'); }, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const rotation = Math.max(-16, Math.min(16, drag.dx * 0.08));

  const mailbox = (dir: Dir, label: Piece) => {
    const b = boxes[dir];
    const hint = hintDir === dir;
    const onCloud = dir === 'up';
    const sign = (
      <span className={`flex items-center justify-center text-center rounded-2xl px-1.5 py-1 font-extrabold text-sky-950 ${hint ? 'hint-glow' : ''}`}
        style={{ minWidth: 50, maxWidth: 76, minHeight: 44, fontSize: label.t === 'text' ? 22 : 13, background: hint ? '#FEF9C3' : '#FFFFFF',
          border: '2.5px solid #3b2416', boxShadow: hint ? '0 0 0 3px #FDE047, 0 0 16px #FDE047' : '0 3px 0 rgba(59,36,22,0.25)' }}>
        <PieceView p={label} size={label.t === 'sign' ? 26 : 34} />
      </span>
    );
    // the sign sits above a side mailbox, beside the top and bottom ones
    const besideSign = dir === 'up' || dir === 'down';
    return (
      <div key={dir} data-box={dir} className="absolute pointer-events-none" style={{ left: `${b.x}%`, top: `${b.y}%`, zIndex: 5 }}>
        {/* post down to the hill (the top mailbox rides a little cloud instead) */}
        {!onCloud && (
          <span className="absolute" style={{ left: -3, top: 14, width: 6, height: `calc(${(93 - b.y) / 100} * var(--stage-h) - 14px)`, background: '#8A5A3B', border: '1.5px solid #3b2416', borderRadius: 3 }} />
        )}
        {onCloud && (
          <svg className="absolute" width="104" height="40" viewBox="0 0 104 40" style={{ left: -52, top: 4 }} aria-hidden="true">
            <g filter="url(#kp-brush)" fill="#FFFFFF" stroke="#3b2416" strokeWidth="1.6">
              <path d="M10 30 Q2 30 4 22 Q6 14 16 16 Q20 4 34 8 Q44 0 56 8 Q70 2 76 14 Q92 10 96 22 Q100 32 88 32z" />
            </g>
          </svg>
        )}
        <div className="absolute" style={{ left: -BOX_PX / 2, top: -BOX_PX * 0.42 }}>
          <Mailbox size={BOX_PX} flagUp={flagDir === dir} color={dir === 'left' || dir === 'up' ? '#F2645A' : '#5B8DEF'} />
        </div>
        <div className="absolute" style={besideSign
          ? { left: BOX_PX / 2 + 6, top: -24 }
          : { left: 0, top: -BOX_PX * 0.42 - 6, transform: 'translate(-50%, -100%)' }}>
          {sign}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen pb-6 overflow-hidden" style={{ background: 'linear-gradient(180deg, #38BDF8 0%, #7DD3FC 45%, #FDE7D3 120%)' }}>
      <div className="max-w-md mx-auto px-3 relative">

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-sky-950 shrink-0"
            style={{ background: 'rgba(255,255,255,0.6)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-sky-950" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>Sky Mail</h1>
          <span className="flex justify-end shrink-0" style={{ width: 104 }} aria-label={`${doneDecks.length} mailbags sorted`}>
            {availableDecks.map(d => (
              <span key={d}><StarIcon size={availableDecks.length > 6 ? 13 : 16} empty={!doneDecks.includes(d)} /></span>
            ))}
          </span>
        </div>

        {/* ── Mailbag select ── */}
        {(phase === 'select' || phase === 'deckDone') && (
          <div className="relative z-10">
            <div className="text-center mb-4 mt-1">
              <div className="flex items-end justify-center gap-1">
                <PandaSprite size={84} expression={noelMood} className="float" style={{ animationDelay: '0.2s' }} />
                <KailiaSprite size={66} expression="excited" className="float" />
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 50)} kind="pet" />
                <Mailbox size={52} flagUp={phase === 'deckDone'} />
              </div>
              <p className="text-sky-950 font-bold text-sm mt-2 px-6">
                The wind stole Noel&apos;s letters over Owl&apos;s Tower! Swipe each one into the right mailbox.
              </p>
            </div>
            {phase === 'deckDone' && (
              <div className="text-center mb-3 bounce-in">
                <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-lg font-extrabold text-amber-900" style={{ background: '#FEF9C3', border: '2px solid #3b2416' }}>
                  <StarIcon /> Mailbag sorted! <StarIcon />
                </p>
              </div>
            )}
            <div className="space-y-3">
              {availableDecks.map(d => (
                <button key={d} onClick={() => startDeck(d)}
                  className="w-full flex items-center gap-3 rounded-3xl p-4 bg-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] text-left"
                  style={{ border: '2.5px solid #3b2416' }}>
                  <span className="w-12 h-12 flex items-center justify-center shrink-0"><DeckIcon deck={d} /></span>
                  <span className="flex-1">
                    <span className="flex items-center gap-1 font-extrabold text-indigo-900">{DECKS[d].title} {doneDecks.includes(d) && <StarIcon size={18} />}</span>
                    <span className="block text-xs text-gray-600">{DECKS[d].desc}</span>
                  </span>
                  <span className="px-4 py-2 rounded-full font-extrabold text-white text-sm whitespace-nowrap" style={{ background: '#4F46E5' }}>
                    {doneDecks.includes(d) ? 'Again!' : 'Sort!'}
                  </span>
                </button>
              ))}
            </div>
            <SkillIntro gameId="sky-mail" />
          </div>
        )}

        {/* ── Playing: the breezy sky with its mailboxes ── */}
        {phase === 'playing' && card && deckId && (
          <div className="relative z-10">
            {/* progress: a little envelope for every letter delivered */}
            <div className="flex justify-center items-center gap-0.5 mb-2 h-5">
              {cards.map((_, i) => (
                i < idx
                  ? <Envelope key={i} size={18} />
                  : <span key={i} className="inline-block w-2 h-2 mx-1 rounded-full" style={{ background: 'rgba(255,255,255,0.85)', border: '1.5px solid #3b2416' }} />
              ))}
            </div>

            <div ref={stageRef} style={{ ['--stage-h' as string]: 'min(470px, 128vw)' } as CSSProperties}>
              <Stage world="shelly" style={{ height: 'var(--stage-h)' }}>
                {/* the hill, and wind gusts drifting across */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <g filter="url(#kp-brush)">
                    <path d="M0 86 Q22 80 48 85 T100 83 V100 H0z" fill="#8FD07A" stroke="#3b2416" strokeWidth="0.5" />
                    <path d="M0 93 Q30 89 60 93 T100 91 V100 H0z" fill="#6DBA5C" />
                  </g>
                </svg>
                {[0, 1, 2].map(i => (
                  <div key={i} className="fg-drift absolute left-0 pointer-events-none" style={{ top: `${18 + i * 22}%`, animationDuration: `${9 + i * 3}s`, animationDelay: `${-i * 4}s`, opacity: 0.7 }} aria-hidden="true">
                    <svg width="70" height="24" viewBox="0 0 70 24">
                      <path d="M2 14 Q20 6 36 12 T60 10 q8 -1 6 -6 q-3 -3 -6 0" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                ))}

                {(Object.keys(card.targets) as Dir[]).map(d => mailbox(d, card.targets[d]!))}

                <KailiaActor x={kailiaX} y={95} h={80} hop={kailiaHop} moveMs={900} />
                <div data-pet>
                  <Actor art={pet.art} name={pet.name} x={petX} y={95} h={56}
                    mood={hintDir ? 'talk' : petMood} moodKey={petMoodKey} moveMs={700} onTap={tickle} z={7} />
                </div>

                {/* card arena */}
                <div className="absolute" style={{ left: `${50 - cardBox.w / 2}%`, width: `${cardBox.w}%`, top: `${cardBox.top}%`, height: `${cardBox.h}%`, touchAction: 'none', zIndex: 12 }}>
                  {/* next card peeking behind */}
                  {cards[idx + 1] && (
                    <div className="absolute inset-0 rounded-3xl bg-white"
                      style={{ transform: 'translateY(8px) scale(0.93)', opacity: 0.6, border: '2.5px solid #3b2416' }} />
                  )}
                  {/* the flying letter */}
                  <div ref={cardRef} data-card data-correct={card.correct}
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                    className={`absolute inset-0 rounded-3xl select-none flex flex-col items-center justify-center px-3 ${wobble ? 'shake' : ''}`}
                    style={{
                      cursor: 'grab', touchAction: 'none',
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8EC 100%)',
                      border: '3px solid #3b2416',
                      boxShadow: drag.grabbed ? '0 14px 24px rgba(12,74,110,0.35)' : '0 6px 0 rgba(59,36,22,0.22)',
                      transform: flyOffset
                        ? `translate(${flyOffset[0]}px, ${flyOffset[1]}px) rotate(${rotation * 2}deg) scale(0.14)`
                        : `translate(${drag.dx}px, ${drag.dy}px) rotate(${rotation}deg) scale(${drag.grabbed ? 1.04 : 1})`,
                      transition: drag.grabbed ? 'none' : flyOffset ? 'transform 0.3s ease-in, opacity 0.3s ease-in' : 'transform 0.25s ease-out',
                      opacity: flyOffset ? 0.2 : 1,
                    }}>
                    <span className="absolute top-2.5 left-3 flex items-center gap-1 text-[11px] font-bold text-indigo-400"><Envelope size={16} /> air mail</span>
                    {card.split ? (
                      <div className="flex items-center w-full gap-1 mt-3">
                        <span className="flex-1 flex items-center justify-center rounded-2xl py-2 px-1"
                          style={{ background: '#FFF1F2', border: '2px solid #FECDD3', minHeight: 96 }}>
                          <PieceView p={card.split.left} size={34} onCard />
                        </span>
                        <span className="px-1.5 py-1 rounded-full text-[11px] font-extrabold text-white" style={{ background: '#6366F1', flexShrink: 0 }}>VS</span>
                        <span className="flex-1 flex items-center justify-center rounded-2xl py-2 px-1"
                          style={{ background: '#EFF6FF', border: '2px solid #BFDBFE', minHeight: 96 }}>
                          <PieceView p={card.split.right} size={34} onCard />
                        </span>
                      </div>
                    ) : (
                      <span className={`font-extrabold text-indigo-900 text-center leading-snug flex justify-center ${deckId === 'sentence' ? 'text-2xl' : card.main.t === 'text' && card.main.s.length > 8 ? 'text-3xl' : 'text-5xl'}`}>
                        <PieceView p={card.main} size={card.main.t === 'rider' ? 54 : card.main.t === 'emoji' ? 46 : 64} onCard />
                      </span>
                    )}
                    {card.sub && (
                      <span className={card.bigSub
                        ? 'text-3xl font-extrabold text-indigo-600 mt-3 tracking-wide'
                        : 'text-sm font-semibold text-gray-500 mt-2'}>
                        {card.sub}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 absolute bottom-2.5">grab me and swipe!</span>
                  </div>
                </div>

                {burstLayer}
              </Stage>
            </div>

            {/* Noel guide */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.35)', border: '1.5px solid rgba(255,255,255,0.6)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── All mailbags done ── */}
      {phase === 'allDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0369a1, #4f46e5)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-3 star-burst"><Mailbox size={96} flagUp /></span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Every letter made it home!</h2>
            <p className="text-sky-100 font-semibold mb-6">The wise owl hoots with joy — what a wind-fast sorter! {pet.name} is doing a happy dance!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setDoneDecks([]); setPhase('select'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-900 shadow-xl transition-transform hover:scale-105" style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Play again!</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                <span className="whitespace-nowrap">Back to the map</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// a small drawn picture for each mailbag on the shelf
function DeckIcon({ deck }: { deck: DeckId }) {
  switch (deck) {
    case 'math':
      return (
        <span className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm text-white"
          style={{ background: '#6366F1', border: '2.5px solid #3b2416' }}>1+2</span>
      );
    case 'sentence': return <Book size={44} />;
    case 'wind': return <Rider kind="kite" size={44} />;
    case 'tricky': return <span className="relative inline-block w-11 h-11"><Rider kind="plane" size={34} /><span className="absolute right-0 bottom-0"><Arrow dir="up" size={22} /></span></span>;
    case 'shapes': return <span className="relative inline-block w-11 h-11"><Shape kind="circle" size={30} /><span className="absolute right-0 bottom-0"><Shape kind="triangle" size={26} /></span></span>;
    case 'feelings': return <Face mood="happy" size={44} />;
    case 'berries': return <Berry kind="straw" size={44} />;
    case 'rhyme': return <Notes size={44} />;
  }
}
