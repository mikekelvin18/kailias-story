'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel } from '@/lib/rewards';

// ─── Sky Mail ─────────────────────────────────────────────────────────────────
// Swipe-card game (think: flick cards left/right with real physics).
// The wind stole Noel's letters above Owl's Tower — the child sorts each
// flying card into the right mailbox with a swipe. Three mailbags:
//   math      → swipe toward the correct answer          (math)
//   sentence  → "sounds right" vs "silly" word order     (reading)
//   wind      → swipe the direction shown                (fine motor)
// Swiping itself is measured: decision speed + how straight the fling is.

type DeckId = 'math' | 'sentence' | 'wind' | 'tricky' | 'shapes' | 'feelings' | 'rhyme' | 'berries';
type Dir = 'left' | 'right' | 'up' | 'down';

interface Card {
  text: string;
  sub?: string;
  bigSub?: boolean;   // Tricky Wind shows the (sometimes lying) word large
  split?: { left: string; right: string };  // comparison decks show two framed sides
  correct: Dir;
  targets: Partial<Record<Dir, string>>;
}

const DECKS: Record<DeckId, { emoji: string; title: string; desc: string; domain: string; noel: string }> = {
  math: {
    emoji: '🔢', title: 'Number Letters', domain: 'math',
    desc: 'Swipe each letter to the mailbox with the right answer!',
    noel: 'These letters have number riddles! Fling each one to the mailbox with the TRUE answer!',
  },
  sentence: {
    emoji: '📚', title: 'Silly Sentences', domain: 'reading',
    desc: 'Sounds right? Swipe right! All mixed up? Swipe left!',
    noel: 'Uh oh — the wind shuffled some words! If a letter sounds RIGHT, swipe right. If it sounds SILLY, swipe left!',
  },
  wind: {
    emoji: '🌬️', title: 'Wind Riders', domain: 'fine motor',
    desc: 'Swipe each creature the way the wind blows!',
    noel: 'These little riders need a push! Swipe each one exactly the way its arrow points — smooth and straight!',
  },
  tricky: {
    emoji: '🌪️', title: 'Tricky Wind', domain: 'processing',
    desc: 'The word sometimes LIES — always follow the arrow!',
    noel: "Watch out — the tricky wind writes the WRONG word sometimes! Don't listen to the word. Follow the ARROW only!",
  },
  shapes: {
    emoji: '🔷', title: 'Shape Twins', domain: 'sensory',
    desc: 'Every shape has a twin — swipe it home!',
    noel: 'Every shape letter has a twin mailbox! Look closely and swipe it to its perfect match!',
  },
  feelings: {
    emoji: '💛', title: 'Feeling Finder', domain: 'communication',
    desc: 'Happy or sad? Swipe how it would feel!',
    noel: 'These letters show little moments. How would THAT feel? Swipe to the happy face or the sad face!',
  },
  berries: {
    emoji: '🍓', title: 'Berry Battle', domain: 'math',
    desc: 'Which side has MORE berries? Swipe to the winner!',
    noel: 'Two berry bushes had a contest! Look closely — swipe toward the side with MORE!',
  },
  rhyme: {
    emoji: '🎵', title: 'Rhyme Chime', domain: 'reading',
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

const WIND_RIDERS = ['🦋', '🐦', '🐝', '🍃', '🪁', '🐞'];

const SHAPES = ['🔵', '🔺', '🟩', '⭐', '❤️', '🟣'];

// little moments → how would that feel? (emotion inference, no reading needed)
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
const DIR_ARROW: Record<Dir, string> = { left: '⬅️', right: '➡️', up: '⬆️', down: '⬇️' };

function playNotes(notes: { f: number; t: number; d: number }[]) {
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

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ── Card generation, scaled to the child's tier ──
function buildDeck(deck: DeckId, tier: DifficultyTier): Card[] {
  const count = tier === 'tiny' ? 8 : 10;
  const cards: Card[] = [];

  if (deck === 'math') {
    for (let i = 0; i < count; i++) {
      let question: string, answer: number, sub: string | undefined;
      if (tier === 'tiny') {
        answer = 1 + Math.floor(Math.random() * 5);
        question = pick(['🍓', '🍪', '⭐', '🐟']).repeat(answer);
        sub = 'How many?';
      } else if (tier === 'small') {
        const a = 1 + Math.floor(Math.random() * 5), b = 1 + Math.floor(Math.random() * 4);
        answer = a + b; question = `${a} + ${b}`;
      } else {
        const kind = Math.random();
        if (kind < 0.45) { const a = 3 + Math.floor(Math.random() * 12), b = 1 + Math.floor(Math.random() * 8); answer = a + b; question = `${a} + ${b}`; }
        else if (kind < 0.8) { const a = 5 + Math.floor(Math.random() * 13), b = 1 + Math.floor(Math.random() * Math.min(a, 9)); answer = a - b; question = `${a} − ${b}`; }
        else { const a = 2 + Math.floor(Math.random() * 4), b = 2 + Math.floor(Math.random() * 3); answer = a * b; question = `${a} × ${b}`; }
      }
      let wrong = answer + pick([-2, -1, 1, 2]);
      if (wrong < 0 || wrong === answer) wrong = answer + 1;
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      cards.push({ text: question, sub, correct,
        targets: { left: String(correct === 'left' ? answer : wrong), right: String(correct === 'right' ? answer : wrong) } });
    }
  }

  if (deck === 'sentence') {
    const pairs = [...SENTENCE_PAIRS].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [good, silly] of pairs) {
      const useGood = Math.random() < 0.5;
      cards.push({ text: useGood ? good : silly, correct: useGood ? 'right' : 'left',
        targets: { left: 'Silly! 🤪', right: 'Sounds right ✓' } });
    }
  }

  if (deck === 'wind') {
    const dirs: Dir[] = tier === 'tiny' ? ['left', 'right'] : ['left', 'right', 'up', 'down'];
    for (let i = 0; i < count; i++) {
      const d = pick(dirs);
      // Readers get the direction word under the arrow (builds left/right
      // vocabulary); pre-readers get the arrow alone — no text clutter.
      cards.push({ text: `${pick(WIND_RIDERS)} ${DIR_ARROW[d]}`,
        sub: tier === 'big' ? d.toUpperCase() : 'Swipe this way!', correct: d,
        targets: { left: '⬅️', right: '➡️', ...(dirs.length > 2 ? { up: '⬆️', down: '⬇️' } : {}) } });
    }
  }

  if (deck === 'shapes') {
    for (let i = 0; i < count; i++) {
      const shape = pick(SHAPES);
      const other = pick(SHAPES.filter(s => s !== shape));
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      cards.push({ text: shape, sub: 'Find its twin!', correct,
        targets: { left: correct === 'left' ? shape : other, right: correct === 'right' ? shape : other } });
    }
  }

  if (deck === 'feelings') {
    const shuffled = [...FEELING_CARDS].sort(() => Math.random() - 0.5).slice(0, count);
    for (const [scene, mood] of shuffled) {
      cards.push({ text: scene, sub: 'How would that feel?', correct: mood === 'happy' ? 'right' : 'left',
        targets: { left: '😢', right: '😊' } });
    }
  }

  if (deck === 'rhyme') {
    for (let i = 0; i < count; i++) {
      const isRhyme = Math.random() < 0.5;
      const [a, b] = pick(isRhyme ? RHYME_TRUE : RHYME_FALSE);
      cards.push({ text: `${a} · ${b}`, sub: 'Say them out loud!', correct: isRhyme ? 'right' : 'left',
        targets: { left: 'No rhyme 🙅', right: 'Rhyme! 🎵' } });
    }
  }

  if (deck === 'berries') {
    // numerosity comparison: which side has more? gaps shrink as tiers rise
    for (let i = 0; i < count; i++) {
      const berry = pick(['\u{1F353}', '\u{1FAD0}', '\u{1F352}']);
      const small = tier === 'tiny' ? 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 5);
      const gap = tier === 'big' ? 1 : 1 + Math.floor(Math.random() * 2);
      const big = small + gap;
      const correct: Dir = Math.random() < 0.5 ? 'left' : 'right';
      const leftN = correct === 'left' ? big : small;
      const rightN = correct === 'right' ? big : small;
      cards.push({ text: '', sub: 'Which side has MORE?', correct,
        split: { left: berry.repeat(leftN), right: berry.repeat(rightN) },
        targets: { left: 'More! \u{1F448}', right: '\u{1F449} More!' } });
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
      cards.push({ text: `${pick(WIND_RIDERS)} ${DIR_ARROW[d]}`,
        sub: word.toUpperCase(), bigSub: true, correct: d,
        targets: { left: '⬅️', right: '➡️', up: '⬆️', down: '⬇️' } });
    }
  }

  return cards;
}

export default function SkyMailPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [deckId, setDeckId] = useState<DeckId | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'select' | 'playing' | 'deckDone' | 'allDone'>('select');
  const [drag, setDrag] = useState({ dx: 0, dy: 0, grabbed: false });
  const [flyDir, setFlyDir] = useState<Dir | null>(null);
  const [wobble, setWobble] = useState(false);
  const [hintDir, setHintDir] = useState<Dir | null>(null);
  const [doneDecks, setDoneDecks] = useState<DeckId[]>([]);
  const [noelLine, setNoelLine] = useState('Pick a mailbag to sort!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  const dragRef = useRef({ startX: 0, startY: 0, path: 0, lx: 0, ly: 0 });
  const missesRef = useRef(0);
  const shownAtRef = useRef(0);
  const metricsRef = useRef({ wrong: 0, ms: [] as number[], eff: [] as number[] });

  const card = cards[idx];
  const fourWay = deckId === 'tricky' || (deckId === 'wind' && tier !== 'tiny');
  const isTwoWay = !fourWay;
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
      setFlyDir(dominant);
      setDrag({ dx, dy, grabbed: false });
      setNoelMood('excited');
      setTimeout(() => {
        setFlyDir(null);
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
      if (missesRef.current >= 2) setHintDir(card.correct); // gentle scaffold
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

  // deckDone interstitial → back to select
  useEffect(() => {
    if (phase !== 'deckDone') return;
    const t = setTimeout(() => { setPhase('select'); setNoelLine('Wonderful sorting! Pick another mailbag!'); setNoelMood('celebrating'); }, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const rotation = Math.max(-16, Math.min(16, drag.dx * 0.08));
  const flyOffset = useMemo(() => {
    if (!flyDir) return null;
    const v = { left: [-620, -40], right: [620, -40], up: [0, -620], down: [0, 620] }[flyDir];
    return v;
  }, [flyDir]);

  const mailbox = (dir: Dir, label: string) => (
    <div key={dir} className={`text-center ${hintDir === dir ? 'pulse rounded-2xl' : ''}`}>
      <span className="block text-3xl">📮</span>
      <span className="block mt-0.5 px-2.5 py-1 rounded-full text-sm font-extrabold text-indigo-900 bg-white shadow"
        style={hintDir === dir ? { boxShadow: '0 0 16px #FDE047', background: '#FEF9C3' } : undefined}>
        {label}
      </span>
    </div>
  );

  return (
    <main className="min-h-screen pb-6 overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #3730a3 45%, #60a5fa 130%)' }}>
      <div className="max-w-md mx-auto px-3 relative">

        {/* drifting clouds */}
        {['☁️', '☁️', '🌙', '☁️'].map((e, i) => (
          <span key={i} className="absolute float" style={{ left: `${[5, 75, 60, 30][i]}%`, top: [70, 40, 8, 130][i], fontSize: [30, 24, 26, 20][i], opacity: 0.5, animationDelay: `${i * 0.7}s`, pointerEvents: 'none' }}>{e}</span>
        ))}

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="text-sm font-bold text-indigo-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">📬 Sky Mail</h1>
          <span className="text-sm w-16 text-right">
            {availableDecks.map(d => (
              <span key={d} style={{ opacity: doneDecks.includes(d) ? 1 : 0.3 }}>⭐</span>
            ))}
          </span>
        </div>

        {/* ── Mailbag select ── */}
        {(phase === 'select' || phase === 'deckDone') && (
          <div className="relative z-10">
            <div className="text-center mb-4 mt-2">
              <PandaSprite size={80} expression={noelMood} className="mx-auto float" />
              <p className="text-indigo-100 font-semibold text-sm mt-1 px-6">
                The wind stole Noel&apos;s letters over Owl&apos;s Tower! Swipe each one into the right mailbox.
              </p>
            </div>
            <div className="space-y-3">
              {availableDecks.map(d => (
                <button key={d} onClick={() => startDeck(d)}
                  className="w-full flex items-center gap-3 rounded-3xl p-4 bg-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98] text-left">
                  <span className="text-4xl">{DECKS[d].emoji}</span>
                  <span className="flex-1">
                    <span className="block font-extrabold text-indigo-900">{DECKS[d].title} {doneDecks.includes(d) && '⭐'}</span>
                    <span className="block text-xs text-gray-600">{DECKS[d].desc}</span>
                  </span>
                  <span className="px-4 py-2 rounded-full font-extrabold text-white text-sm" style={{ background: '#4F46E5' }}>
                    {doneDecks.includes(d) ? 'Again!' : 'Sort!'}
                  </span>
                </button>
              ))}
            </div>
            {phase === 'deckDone' && (
              <div className="text-center mt-4 bounce-in">
                <p className="text-xl font-extrabold text-yellow-300 drop-shadow">✨ Mailbag sorted! ✨</p>
              </div>
            )}
          </div>
        )}

        {/* ── Playing ── */}
        {phase === 'playing' && card && deckId && (
          <div className="relative z-10">
            {/* progress dots */}
            <div className="text-center mb-2" style={{ letterSpacing: 3 }}>
              {cards.map((_, i) => (
                <span key={i} className="text-xs" style={{ opacity: i < idx ? 1 : 0.3 }}>{i < idx ? '💌' : '·'}</span>
              ))}
            </div>

            {/* up mailbox */}
            {!isTwoWay && card.targets.up && <div className="flex justify-center mb-1">{mailbox('up', card.targets.up)}</div>}

            <div className="flex items-center gap-1">
              {card.targets.left && mailbox('left', card.targets.left)}

              {/* card arena */}
              <div className="flex-1 relative" style={{ height: 300, touchAction: 'none' }}>
                {/* next card peeking behind */}
                {cards[idx + 1] && (
                  <div className="absolute inset-x-4 rounded-3xl bg-white shadow"
                    style={{ top: 22, height: 250, transform: 'scale(0.93)', opacity: 0.55 }} />
                )}
                {/* the flying letter */}
                <div data-card data-correct={card.correct}
                  onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                  className={`absolute inset-x-2 rounded-3xl bg-white shadow-2xl select-none flex flex-col items-center justify-center px-4 ${wobble ? 'shake' : ''}`}
                  style={{
                    top: 10, height: 260, cursor: 'grab', touchAction: 'none',
                    border: '3px solid #C7D2FE',
                    transform: flyOffset
                      ? `translate(${flyOffset[0]}px, ${flyOffset[1]}px) rotate(${rotation * 2}deg)`
                      : `translate(${drag.dx}px, ${drag.dy}px) rotate(${rotation}deg) scale(${drag.grabbed ? 1.04 : 1})`,
                    transition: drag.grabbed ? 'none' : flyOffset ? 'transform 0.3s ease-in' : 'transform 0.25s ease-out',
                    opacity: flyOffset ? 0 : 1,
                  }}>
                  <span className="text-xs font-bold text-indigo-300 absolute top-3 left-4">💌 air mail</span>
                  {card.split ? (
                    <div className="flex items-center w-full gap-1 mt-1">
                      <span className="flex-1 flex flex-wrap items-center justify-center gap-0.5 rounded-2xl py-3 px-1 text-2xl leading-tight"
                        style={{ background: '#FFF1F2', border: '2px solid #FECDD3', minHeight: 90 }}>
                        {[...card.split.left].map((ch, i) => <span key={i}>{ch}</span>)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-extrabold text-white" style={{ background: '#6366F1', flexShrink: 0 }}>VS</span>
                      <span className="flex-1 flex flex-wrap items-center justify-center gap-0.5 rounded-2xl py-3 px-1 text-2xl leading-tight"
                        style={{ background: '#EFF6FF', border: '2px solid #BFDBFE', minHeight: 90 }}>
                        {[...card.split.right].map((ch, i) => <span key={i}>{ch}</span>)}
                      </span>
                    </div>
                  ) : (
                    <span className={`font-extrabold text-indigo-900 text-center leading-snug ${deckId === 'sentence' ? 'text-2xl' : card.text.length > 8 ? 'text-4xl' : 'text-5xl'}`}>
                      {card.text}
                    </span>
                  )}
                  {card.sub && (
                    <span className={card.bigSub
                      ? 'text-3xl font-extrabold text-indigo-600 mt-3 tracking-wide'
                      : 'text-sm font-semibold text-gray-500 mt-2'}>
                      {card.sub}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400 absolute bottom-3">grab me and swipe!</span>
                </div>
              </div>

              {card.targets.right && mailbox('right', card.targets.right)}
            </div>

            {/* down mailbox */}
            {!isTwoWay && card.targets.down && <div className="flex justify-center mt-1">{mailbox('down', card.targets.down)}</div>}

            {/* Noel guide */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
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
          style={{ background: 'linear-gradient(135deg, #312e81ee, #4f46e5ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">📬</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Every letter made it home!</h2>
            <p className="text-indigo-100 font-semibold mb-6">The wise owl hoots with joy — what a wind-fast sorter! 🦉</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setDoneDecks([]); setPhase('select'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-900 shadow-xl transition-transform hover:scale-105" style={{ background: 'white' }}>
                Play again!
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                Back to the map 🗺️
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
