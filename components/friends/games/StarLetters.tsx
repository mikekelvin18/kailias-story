'use client';

// ── Star Letters (Nova · letters & sounds) ──
// Nova stands on a cloud and the child joins the stars in order: each
// tap shoots a rainbow line to the next star, and the stars smile as
// they light. The finished letter glows in rainbow colors, Nova says its
// name, and the word choices float up on little clouds; tap a speaker to
// hear any word, tap the cloud whose word starts with the letter.
// Difficulty: numbered stars and a faint guide at first; later no numbers,
// no guide, and no glow on the next star; word choices get closer.
// Notices: stray taps while joining, and whether the word was found.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
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

const RAINBOW = ['#FF6B6B', '#FFB347', '#FFE66D', '#7BE495', '#6FB7FF', '#B28DFF'];

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

function CloudWord({ word, state, onPick, onHear, delay }: { word: string; state: '' | 'yes' | 'no' | 'hint'; onPick: () => void; onHear: () => void; delay: number }) {
  return (
    <div className="flex flex-col items-center gap-1 bounce-in" style={{ animationDelay: `${delay}s`, animationFillMode: 'both' }}>
      <button onClick={onPick} className={`relative w-full h-[68px] flex items-center justify-center ${state === 'no' ? 'shake' : state === 'yes' ? 'kp-jelly' : 'fg-bob'}`}
        style={{ animationDelay: state ? undefined : `${-delay * 3}s` }}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <g filter="url(#kp-brush)" fill={state === 'yes' ? '#FFF2FB' : '#FFFFFF'} stroke={state === 'yes' || state === 'hint' ? '#F9A8D4' : '#3b2416'} strokeWidth={state === 'yes' || state === 'hint' ? 3 : 1.4}>
            <path d="M14 50 Q2 50 4 38 Q4 26 18 26 Q20 8 40 10 Q54 2 66 14 Q84 10 88 28 Q100 32 96 44 Q94 54 80 52 Z" />
          </g>
        </svg>
        <span className="relative text-2xl font-extrabold" style={{ color: '#3B2463' }}>{word}</span>
      </button>
      <button onClick={onHear} aria-label={`Hear ${word}`} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
      </button>
    </div>
  );
}

export default function StarLetters({ difficulty, accent, say, onDone, pet, reaction }: RoundProps) {
  const [round] = useState(() => makeRound(difficulty));

  // the stars, in tapping order; a new stroke starts where `lift` is true
  const stars = useMemo(() => round.letter.strokes.flatMap(s => s.map((p, i) => ({ p, lift: i === 0 }))), [round]);
  const [next, setNext] = useState(0);
  const [mode, setMode] = useState<'draw' | 'word'>('draw');
  const [wobble, setWobble] = useState(-1);
  const [strays, setStrays] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const { layer, fire } = useBursts();
  const done = useRef(false);

  const numbers = difficulty <= 3;
  const guide = difficulty <= 5;
  const glow = difficulty <= 6 || strays >= 3;

  useEffect(() => {
    say(`Let's draw the letter ${round.letter.ch}! Join the stars in order.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  useEffect(() => { if (reaction === 'win') setMood('cheer'); }, [reaction, setMood]);

  const X = (p: Pt) => 34 + p[0] * 14;
  const Y = (p: Pt) => 9 + p[1] * 13;

  // stars sharing a spot (where strokes meet) are one star on screen
  const spots = useMemo(() => {
    const m = new Map<string, number[]>();
    stars.forEach((s, i) => { const k = s.p.join(','); m.set(k, [...(m.get(k) ?? []), i]); });
    return [...m.entries()].map(([k, idx]) => ({ p: k.split(',').map(Number) as Pt, idx }));
  }, [stars]);

  function tapSpot(e: React.MouseEvent<HTMLButtonElement>) {
    tap(spots[Number(e.currentTarget.dataset.spot)].idx);
  }

  function tap(idx: number[]) {
    if (mode !== 'draw' || done.current) return;
    if (!idx.includes(next)) {
      setStrays(n => n + 1);
      setWobble(idx[0]);
      setTimeout(() => setWobble(-1), 450);
      tones([{ f: 300, t: 0, d: 0.12 }]);
      return;
    }
    const p = stars[next].p;
    tones([{ f: 520 + next * 45, t: 0, d: 0.16 }]);
    fire(X(p), Y(p), RAINBOW, 8, 36);
    setMood('talk');
    setTimeout(() => setMood('idle'), 380);
    const n = next + 1;
    setNext(n);
    if (n === stars.length) {
      setMode('word');
      setTimeout(() => {
        setMood('cheer');
        stars.forEach((s, i) => setTimeout(() => fire(X(s.p), Y(s.p), RAINBOW, 6, 40), i * 60));
        speak(`${round.letter.ch}! Which word starts with ${round.letter.ch}?`);
        say(`${round.letter.ch}! Which word starts with ${round.letter.ch}?`);
      }, 350);
    }
  }

  function choose(w: string) {
    if (done.current) return;
    done.current = true;
    setPicked(w);
    const ok = w === round.word;
    if (ok) {
      speak(`${round.word}! ${round.letter.ch} is for ${round.word}.`);
      setMood('cheer');
    } else {
      setMood('oops');
      speak(`${round.letter.ch} is for ${round.word}.`);
    }
    setTimeout(() => onDone({ ok: ok && strays <= 2, data: { strayTaps: strays, wordFound: ok ? 1 : 0 } }), 1100);
  }

  // lines already joined (not across a pen lift)
  const lines: { a: Pt; b: Pt; i: number }[] = [];
  for (let i = 1; i < next; i++) if (!stars[i].lift) lines.push({ a: stars[i - 1].p, b: stars[i].p, i });

  return (
    <div className="flex flex-col gap-3">
      <Stage world="nova" className="aspect-square">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ zIndex: 3 }}>
          <defs>
            <linearGradient id="nova-rainbow" x1="20" y1="0" x2="95" y2="100" gradientUnits="userSpaceOnUse">
              {RAINBOW.map((c, i) => <stop key={c} offset={i / (RAINBOW.length - 1)} stopColor={c} />)}
            </linearGradient>
          </defs>
          {guide && mode === 'draw' && round.letter.strokes.map((s, i) => (
            <polyline key={i} points={s.map(p => `${X(p)},${Y(p)}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 3.6" />
          ))}
          {lines.map(({ a, b, i }) => {
            const L = Math.hypot(X(b) - X(a), Y(b) - Y(a));
            return (
              <g key={i}>
                <line x1={X(a)} y1={Y(a)} x2={X(b)} y2={Y(b)} stroke="url(#nova-rainbow)" strokeWidth="5" strokeLinecap="round" opacity="0.35" strokeDasharray={L} strokeDashoffset={L} className="fg-draw" />
                <line x1={X(a)} y1={Y(a)} x2={X(b)} y2={Y(b)} stroke="url(#nova-rainbow)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L} className="fg-draw" />
              </g>
            );
          })}
          {mode === 'word' && (
            <g className="fg-bob">
              {round.letter.strokes.map((s, i) => (
                <polyline key={`g${i}`} points={s.map(p => `${X(p)},${Y(p)}`).join(' ')} fill="none" stroke="url(#nova-rainbow)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 4px #FFFFFF)' }} />
              ))}
            </g>
          )}
        </svg>
        {mode === 'draw' && spots.map(({ p, idx }, si) => {
          const reached = idx.every(i => i < next);
          const isNext = idx.includes(next);
          return (
            <button key={p.join(',')} data-spot={si} onClick={tapSpot} aria-label={`Star ${idx.map(i => i + 1).join(' and ')}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center"
              style={{ left: `${X(p)}%`, top: `${Y(p)}%`, zIndex: 4 }}>
              <span key={`${reached}-${wobble !== -1 && idx.includes(wobble)}`}
                className={`block ${wobble !== -1 && idx.includes(wobble) ? 'shake' : reached ? 'kp-jelly' : isNext && glow ? 'soft-pulse' : ''}`}>
                <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" style={{ overflow: 'visible', filter: isNext && glow ? 'drop-shadow(0 0 8px #FFFFFF)' : reached ? `drop-shadow(0 0 6px ${accent})` : undefined }}>
                  <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
                    fill={reached ? accent : isNext && glow ? '#FFFFFF' : '#D9CCF5'} stroke="#3b2416" strokeWidth="0.8" strokeLinejoin="round" />
                  <circle cx="9.6" cy="10.2" r="0.85" fill="#3b2416" /><circle cx="14.4" cy="10.2" r="0.85" fill="#3b2416" />
                  <path d={reached ? 'M10 12.6 Q12 14.6 14 12.6' : 'M10.6 13 Q12 13.8 13.4 13'} stroke="#3b2416" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              {numbers && <span className="absolute -top-0.5 -right-0.5 text-[11px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: '#3B2463', border: '1.5px solid #FFFFFF' }}>{idx[0] + 1}</span>}
            </button>
          );
        })}
        {mode === 'word' && (
          <span className="absolute left-3 top-2 text-6xl font-extrabold bounce-in" style={{ color: '#FFFFFF', textShadow: '0 3px 0 #3B2463, 0 0 16px #F9A8D4', zIndex: 4 }} aria-hidden="true">
            {round.letter.ch}{round.letter.ch.toLowerCase()}
          </span>
        )}
        <Actor art={pet.art} name={pet.name} x={14} y={97} h={84} mood={mood} moodKey={moodKey} z={5} />
        {layer}
      </Stage>

      {mode === 'word' && (
        <div className="grid grid-cols-3 gap-2">
          {round.choices.map((w, i) => (
            <CloudWord key={w} word={w} delay={i * 0.12}
              state={picked === w ? (w === round.word ? 'yes' : 'no') : picked && w === round.word ? 'hint' : ''}
              onPick={() => choose(w)} onHear={() => speak(w)} />
          ))}
        </div>
      )}
    </div>
  );
}
