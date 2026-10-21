'use client';

// ── Gem Scales (Ember · counting) ──
// Ember's scale has gems on one side. Tap gems from the pile onto the
// other side until the scale sits level; tap a gem on the scale to put
// it back. The beam tips the way a real scale would, so overshooting is
// just something to notice and fix, never a "wrong".
// Difficulty: more gems; then gem pairs worth 2; then Ember's side comes
// in two little heaps to put together (early adding).
// Notices: moves beyond the fewest needed, the biggest amount balanced.

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { tones } from '../voice';

const GEM = '#E0457B';

function Gem({ size = 22, color = GEM }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12l4 6-10 12L2 9z" fill={color} stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2 9h20M6 3l3 6 3 12M18 3l-3 6-3 12M9 9l3-6 3 6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  );
}

function Piece({ value }: { value: 1 | 2 }) {
  return value === 1 ? <Gem /> : (
    <span className="inline-flex -space-x-1.5 rounded-full px-0.5" style={{ background: 'rgba(255,255,255,0.25)' }}>
      <Gem size={20} color="#7C5CE0" /><Gem size={20} color="#7C5CE0" />
    </span>
  );
}

function makeSetup(difficulty: number) {
  const max = Math.min(10, 2 + difficulty);
  const min = Math.max(1, Math.floor(max / 2));
  const target = min + Math.floor(Math.random() * (max - min + 1));
  const pairs = difficulty >= 6;
  const split = difficulty >= 8 && target >= 3;
  const a = split ? 1 + Math.floor(Math.random() * (target - 1)) : target;
  return { target, pairs, heaps: split ? [a, target - a] : [target] };
}

export default function GemScales({ difficulty, say, onDone }: RoundProps) {
  const [setup] = useState(() => makeSetup(difficulty));

  const [right, setRight] = useState<(1 | 2)[]>([]);
  useEffect(() => {
    say(setup.heaps.length > 1 ? 'I have two little heaps of gems. Make your side the same!' : 'Make your side the same as mine!');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);
  const st = useRef({ moves: 0, done: false });
  const sum = right.reduce((s, v) => s + v, 0);
  const diff = setup.target - sum;                       // >0: Ember's side is heavier
  const tilt = Math.max(-14, Math.min(14, diff * 3.5));
  const fewest = setup.pairs ? Math.ceil(setup.target / 2) : setup.target;

  function settle(nextSum: number) {
    if (nextSum !== setup.target || st.current.done) return;
    st.current.done = true;
    tones([{ f: 784, t: 0.05, d: 0.2 }, { f: 1047, t: 0.18, d: 0.3 }]);
    say('Level! Perfectly balanced!');
    setTimeout(() => onDone({ ok: st.current.moves - fewest <= 2, data: { amount: setup.target, extraMoves: Math.max(0, st.current.moves - fewest) } }), 700);
  }

  function add(v: 1 | 2) {
    if (st.current.done || right.length >= 12) return;
    st.current.moves++;
    tones([{ f: 520 + sum * 30, t: 0, d: 0.1 }]);
    setRight(r => [...r, v]);
    if (sum + v > setup.target) say('Whoa, my side went up! Take one off?');
    settle(sum + v);
  }

  function remove(i: number) {
    if (st.current.done) return;
    st.current.moves++;
    tones([{ f: 420, t: 0, d: 0.1 }]);
    const v = right[i];
    setRight(r => r.filter((_, k) => k !== i));
    settle(sum - v);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* the scale */}
      <div className="relative w-full rounded-3xl pt-6 pb-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="relative mx-auto" style={{ width: '92%', height: 190 }}>
          {/* stand */}
          <svg viewBox="0 0 100 60" className="absolute left-0 right-0 bottom-0 w-full" style={{ height: 120 }} aria-hidden="true">
            <path d="M50 10 L50 52 M36 56 Q50 48 64 56 Z" stroke="#C9A36A" strokeWidth="3" fill="#C9A36A" strokeLinecap="round" />
          </svg>
          {/* beam with two pans, tilting */}
          <div className="absolute left-0 right-0" style={{ top: 64, transform: `rotate(${-tilt}deg)`, transition: 'transform 0.5s cubic-bezier(.3,1.6,.5,1)' }}>
            <div className="mx-auto h-2.5 rounded-full" style={{ background: '#E8C27A', width: '100%' }} />
            {[0, 1].map(side => (
              <div key={side} className="absolute" style={{ [side ? 'right' : 'left']: 0, top: 0, width: '44%', transform: `rotate(${tilt}deg)`, transformOrigin: 'top center', transition: 'transform 0.5s' }}>
                <div className="mx-auto w-0.5 h-8" style={{ background: '#E8C27A' }} />
                <div className="rounded-b-[999px] min-h-[64px] px-2 pt-1 pb-3 flex flex-wrap content-start justify-center gap-0.5"
                  style={{ background: 'rgba(232,194,122,0.35)', border: '2.5px solid #E8C27A', borderTop: 'none' }}>
                  {side === 0
                    ? setup.heaps.map((n, h) => (
                        <span key={h} className="inline-flex flex-wrap justify-center gap-0.5 px-1 rounded-xl" style={{ background: setup.heaps.length > 1 ? 'rgba(255,255,255,0.12)' : undefined }}>
                          {Array.from({ length: n }, (_, i) => <Gem key={i} />)}
                        </span>
                      ))
                    : right.map((v, i) => (
                        <button key={i} onClick={() => remove(i)} aria-label={`Take off ${v === 2 ? 'a gem pair' : 'a gem'}`} className="bounce-in">
                          <Piece value={v} />
                        </button>
                      ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm font-bold opacity-80">Ember&apos;s side · your side</p>
      </div>

      {/* the pile */}
      <div className="flex gap-3 justify-center">
        <button onClick={() => add(1)} className="flex flex-col items-center gap-1 rounded-3xl px-5 py-3 transition-transform active:scale-95"
          style={{ background: 'rgba(255,255,255,0.14)' }} aria-label="Add a gem">
          <span className="flex -space-x-2"><Gem size={30} /><Gem size={30} /><Gem size={30} /></span>
          <span className="text-sm font-extrabold">Gems</span>
        </button>
        {setup.pairs && (
          <button onClick={() => add(2)} className="flex flex-col items-center gap-1 rounded-3xl px-5 py-3 transition-transform active:scale-95"
            style={{ background: 'rgba(255,255,255,0.14)' }} aria-label="Add a gem pair, worth two">
            <span className="flex -space-x-1.5"><Gem size={30} color="#7C5CE0" /><Gem size={30} color="#7C5CE0" /></span>
            <span className="text-sm font-extrabold">Gem pairs</span>
          </button>
        )}
      </div>
    </div>
  );
}
