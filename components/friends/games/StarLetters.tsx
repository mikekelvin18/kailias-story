'use client';

// ── Star Letters (Nova · letters & sounds) ──
// Join the stars in order and a letter appears in the sky, then pick the
// word that starts with it. Drawing the letter's shape stroke by stroke,
// hearing its name, then finding it at the start of a word.
// Difficulty: numbered stars and a faint guide at first; later no numbers,
// no guide, and no glow on the next star; word choices get closer.
// Notices: stray taps while joining, and whether the word was found.

import { useMemo, useRef, useState, useEffect } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { speak, tones } from '../voice';

type Pt = [number, number];          // on a 4 × 6 grid
interface Letter { ch: string; strokes: Pt[][]; words: string[] }

const LETTERS: Letter[] = [
  { ch: 'L', strokes: [[[0, 0], [0, 6], [4, 6]]], words: ['lion', 'leaf', 'lamp'] },
  { ch: 'V', strokes: [[[0, 0], [2, 6], [4, 0]]], words: ['van', 'vase', 'vet'] },
  { ch: 'N', strokes: [[[0, 6], [0, 0], [4, 6], [4, 0]]], words: ['nest', 'net', 'nose'] },
  { ch: 'M', strokes: [[[0, 6], [0, 0], [2, 3], [4, 0], [4, 6]]], words: ['moon', 'map', 'milk'] },
  { ch: 'W', strokes: [[[0, 0], [1, 6], [2, 3], [3, 6], [4, 0]]], words: ['web', 'wing', 'water'] },
  { ch: 'Z', strokes: [[[0, 0], [4, 0], [0, 6], [4, 6]]], words: ['zoo', 'zip', 'zebra'] },
  { ch: 'U', strokes: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]], words: ['up', 'under', 'umbrella'] },
  { ch: 'C', strokes: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]], words: ['cat', 'cup', 'cake'] },
  { ch: 'J', strokes: [[[4, 0], [4, 5], [3, 6], [1, 6], [0, 5]]], words: ['jam', 'jet', 'juice'] },
  { ch: 'S', strokes: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]], words: ['sun', 'sock', 'star'] },
  { ch: 'T', strokes: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]], words: ['top', 'tree', 'toy'] },
  { ch: 'H', strokes: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]], words: ['hat', 'hen', 'hug'] },
  { ch: 'E', strokes: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]], words: ['egg', 'elf', 'end'] },
  { ch: 'A', strokes: [[[0, 6], [2, 0], [4, 6]], [[1, 3], [3, 3]]], words: ['ant', 'apple', 'arm'] },
  { ch: 'K', strokes: [[[0, 0], [0, 6]], [[4, 0], [0, 3], [4, 6]]], words: ['kite', 'key', 'king'] },
];

function shuffle<T>(xs: T[]) { return [...xs].sort(() => Math.random() - 0.5); }

function makeRound(difficulty: number) {
  // easier letters (one stroke, few stars) first
  const pool = LETTERS.filter(l => difficulty >= 5 || (l.strokes.length === 1 && l.strokes[0].length <= 6));
  const letter = pool[Math.floor(Math.random() * pool.length)];
  const word = letter.words[Math.floor(Math.random() * letter.words.length)];
  const others = shuffle(LETTERS.filter(l => l.ch !== letter.ch)).slice(0, 2)
    .map(l => l.words[Math.floor(Math.random() * l.words.length)]);
  return { letter, word, choices: shuffle([word, ...others]) };
}

export default function StarLetters({ difficulty, accent, say, onDone }: RoundProps) {
  const [round] = useState(() => makeRound(difficulty));

  // the stars, in tapping order; a new stroke starts where `lift` is true
  const stars = useMemo(() => round.letter.strokes.flatMap(s => s.map((p, i) => ({ p, lift: i === 0 }))), [round]);
  const [next, setNext] = useState(0);
  const [mode, setMode] = useState<'draw' | 'word'>('draw');
  const [wobble, setWobble] = useState(-1);
  const [strays, setStrays] = useState(0);
  const done = useRef(false);

  const numbers = difficulty <= 3;
  const guide = difficulty <= 5;
  const glow = difficulty <= 6 || strays >= 3;

  useEffect(() => {
    say(`Let's draw the letter ${round.letter.ch}! Join the stars in order.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const X = (p: Pt) => 18 + p[0] * 16;
  const Y = (p: Pt) => 8 + p[1] * 14;

  // stars sharing a spot (where strokes meet) are one star on screen
  const spots = useMemo(() => {
    const m = new Map<string, number[]>();
    stars.forEach((s, i) => { const k = s.p.join(','); m.set(k, [...(m.get(k) ?? []), i]); });
    return [...m.entries()].map(([k, idx]) => ({ p: k.split(',').map(Number) as Pt, idx }));
  }, [stars]);

  function tap(idx: number[]) {
    if (mode !== 'draw' || done.current) return;
    if (!idx.includes(next)) {
      setStrays(n => n + 1);
      setWobble(idx[0]);
      setTimeout(() => setWobble(-1), 400);
      tones([{ f: 300, t: 0, d: 0.12 }]);
      return;
    }
    tones([{ f: 520 + next * 40, t: 0, d: 0.15 }]);
    const n = next + 1;
    setNext(n);
    if (n === stars.length) {
      setMode('word');
      setTimeout(() => {
        speak(`${round.letter.ch}! Which word starts with ${round.letter.ch}?`);
        say(`${round.letter.ch}! Which word starts with ${round.letter.ch}?`);
      }, 400);
    }
  }

  function choose(w: string) {
    if (done.current) return;
    done.current = true;
    const ok = w === round.word;
    if (ok) speak(`${round.word}! ${round.letter.ch} is for ${round.word}.`);
    onDone({ ok: ok && strays <= 2, data: { strayTaps: strays, wordFound: ok ? 1 : 0 } });
  }

  // lines already joined (not across a pen lift)
  const lines: string[] = [];
  for (let i = 1; i < next; i++) if (!stars[i].lift) lines.push(`M ${X(stars[i - 1].p)} ${Y(stars[i - 1].p)} L ${X(stars[i].p)} ${Y(stars[i].p)}`);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full rounded-3xl" style={{ background: 'rgba(255,255,255,0.06)', aspectRatio: '100 / 100' }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
          {guide && round.letter.strokes.map((s, i) => (
            <polyline key={i} points={s.map(p => `${X(p)},${Y(p)}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {lines.map((d, i) => <path key={i} d={d} stroke={accent} strokeWidth="2.6" strokeLinecap="round" />)}
          {mode === 'word' && round.letter.strokes.map((s, i) => (
            <polyline key={`g${i}`} points={s.map(p => `${X(p)},${Y(p)}`).join(' ')} fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="bounce-in" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          ))}
        </svg>
        {spots.map(({ p, idx }) => {
          const reached = idx.every(i => i < next);
          const isNext = idx.includes(next) && mode === 'draw';
          return (
            <button key={p.join(',')} onClick={() => tap(idx)} aria-label={`Star ${idx.map(i => i + 1).join(' and ')}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center ${wobble !== -1 && idx.includes(wobble) ? 'shake' : ''}`}
              style={{ left: `${X(p)}%`, top: `${Y(p)}%` }}>
              <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" className={isNext && glow ? 'soft-pulse' : undefined}
                style={{ filter: isNext && glow ? `drop-shadow(0 0 8px ${accent})` : undefined }}>
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
                  fill={reached ? accent : isNext && glow ? '#FFFFFF' : 'rgba(255,255,255,0.35)'} stroke="#FFFFFF" strokeWidth="0.8" strokeLinejoin="round" />
              </svg>
              {numbers && <span className="absolute -top-1 -right-1 text-[11px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>{idx[0] + 1}</span>}
            </button>
          );
        })}
      </div>

      {mode === 'word' && (
        <div className="grid grid-cols-3 gap-2 slide-up">
          {round.choices.map(w => (
            <div key={w} className="flex flex-col items-center gap-1">
              <button onClick={() => choose(w)} className="w-full min-h-[60px] rounded-2xl bg-white text-2xl font-extrabold transition-transform active:scale-95"
                style={{ color: '#1F2A44' }}>{w}</button>
              <button onClick={() => speak(w)} aria-label={`Hear ${w}`} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
