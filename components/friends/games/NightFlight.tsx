'use client';

// ── Night Flight (Sage · memory) ──
// A little moon-light flies from star to star, drawing a path. The child
// remembers the path and taps the same stars in the same order.
// Difficulty: longer paths, a bigger sky (3×3 → 4×4), a quicker flight.
// Notices: the longest path remembered (visual-spatial sequence memory).

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { tones } from '../voice';

const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047, 1175];

function makePath(cells: number, len: number) {
  const path: number[] = [];
  while (path.length < len) {
    const c = Math.floor(Math.random() * cells);
    if (c !== path[path.length - 1] && !path.includes(c)) path.push(c);
  }
  return path;
}

export default function NightFlight({ difficulty, accent, say, onDone }: RoundProps) {
  const size = difficulty <= 4 ? 3 : 4;
  const len = Math.min(size * size - 1, 2 + Math.floor((difficulty - 1) / 2));
  const stepMs = Math.max(450, 900 - difficulty * 45);
  const [path] = useState(() => makePath(size * size, len));
  const [mode, setMode] = useState<'watch' | 'answer'>('watch');
  const [lit, setLit] = useState<number>(-1);            // index in path during the flight
  const [taps, setTaps] = useState<number[]>([]);
  const done = useRef(false);

  useEffect(() => {
    say(`Watch my moon-light fly across ${len} stars!`);
    const timers: ReturnType<typeof setTimeout>[] = [];
    path.forEach((cell, i) => timers.push(setTimeout(() => {
      setLit(i);
      tones([{ f: NOTES[i % NOTES.length], t: 0, d: 0.25 }]);
    }, 900 + i * stepMs)));
    timers.push(setTimeout(() => {
      setLit(-1);
      setMode('answer');
      say('Now you fly it! Tap the stars in the same order.');
    }, 900 + path.length * stepMs + 300));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  function tap(cell: number) {
    if (mode !== 'answer' || done.current) return;
    const i = taps.length;
    if (path[i] !== cell) {
      done.current = true;
      onDone({ ok: false, data: { span: len, stepsRemembered: i } });
      return;
    }
    tones([{ f: NOTES[i % NOTES.length], t: 0, d: 0.22 }]);
    const next = [...taps, cell];
    setTaps(next);
    if (next.length === path.length) {
      done.current = true;
      onDone({ ok: true, data: { span: len, stepsRemembered: len } });
    }
  }

  // where each star sits (a loose grid, a little jittered so it feels like a sky)
  const pos = (cell: number) => {
    const r = Math.floor(cell / size), c = cell % size;
    const j = ((cell * 37) % 7 - 3) * 1.2;
    return { x: ((c + 0.5) / size) * 100 + j, y: ((r + 0.5) / size) * 100 - j };
  };
  const shown = mode === 'watch' ? path.slice(0, lit + 1) : taps;

  return (
    <div className="relative w-full aspect-square rounded-3xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <polyline points={shown.map(c => `${pos(c).x},${pos(c).y}`).join(' ')} fill="none"
          stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 3.2" opacity="0.9" />
      </svg>
      {Array.from({ length: size * size }, (_, cell) => {
        const p = pos(cell);
        const on = mode === 'watch' ? path[lit] === cell : taps.includes(cell);
        return (
          <button key={cell} onClick={() => tap(cell)} disabled={mode !== 'answer'}
            aria-label={`Star ${cell + 1}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform active:scale-90"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: size === 3 ? 84 : 66, height: size === 3 ? 84 : 66 }}>
            <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"
              style={{ filter: on ? `drop-shadow(0 0 10px ${accent})` : undefined, transition: 'transform 0.2s', transform: on ? 'scale(1.15)' : 'scale(1)' }}>
              <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
                fill={on ? accent : 'rgba(255,255,255,0.22)'} stroke={on ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} strokeWidth="1" strokeLinejoin="round" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
