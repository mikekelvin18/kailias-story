'use client';

// ── Night Flight (Sage · memory) ──
// Sage flies from star to star in the night sky, lighting each one and
// leaving a golden trail. Then Sage flies home and it is the child's turn:
// every star the child taps, Sage flies to it, so the two of them fly the
// path together. A wrong star gets a friendly wobble and Sage shows which
// star was next before trying a new flight.
// Difficulty: longer paths, a bigger sky (3×3 → 4×4), a quicker flight.
// Notices: the longest path remembered (visual-spatial sequence memory).

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
import { tones } from '../voice';

const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047, 1175];
const HOME = { x: 8, y: 68 };              // on top of Sage's tower

function makePath(cells: number, len: number) {
  const path: number[] = [];
  while (path.length < len) {
    const c = Math.floor(Math.random() * cells);
    if (!path.includes(c)) path.push(c);
  }
  return path;
}

export default function NightFlight({ difficulty, accent, say, onDone, pet, reaction }: RoundProps) {
  const size = difficulty <= 4 ? 3 : 4;
  const len = Math.min(size * size - 1, 2 + Math.floor((difficulty - 1) / 2));
  const stepMs = Math.max(550, 1000 - difficulty * 45);
  const [path] = useState(() => makePath(size * size, len));
  const [mode, setMode] = useState<'watch' | 'answer'>('watch');
  const [visited, setVisited] = useState<number[]>([]);     // stars lit so far (watch or answer)
  const [spot, setSpot] = useState(HOME);
  const [hint, setHint] = useState(-1);
  const [wobble, setWobble] = useState(-1);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const { layer, fire } = useBursts();
  const done = useRef(false);

  // where each star sits: a loose grid in the upper sky, a little jittered
  const pos = (cell: number) => {
    const r = Math.floor(cell / size), c = cell % size;
    const j = ((cell * 37) % 7 - 3) * 1.4;
    return { x: 30 + ((c + 0.5) / size) * 64 + j * 0.6, y: 10 + ((r + 0.5) / size) * 64 - j };
  };
  const onStar = (cell: number) => ({ x: pos(cell).x, y: pos(cell).y - 3 });

  useEffect(() => {
    say(`Watch me fly across ${len} stars!`);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setMood('fly'), 700));
    path.forEach((cell, i) => timers.push(setTimeout(() => {
      setSpot(onStar(cell));
      setVisited(v => [...v, cell]);
      tones([{ f: NOTES[i % NOTES.length], t: 0, d: 0.3 }]);
      fire(pos(cell).x, pos(cell).y, [accent, '#FFFFFF'], 6, 34);
    }, 900 + i * stepMs)));
    timers.push(setTimeout(() => {
      setSpot(HOME);
      setVisited([]);
    }, 900 + path.length * stepMs + 200));
    timers.push(setTimeout(() => {
      setMood('idle');
      setMode('answer');
      say('Your turn! Tap the stars in the same order, and I’ll fly with you.');
    }, 900 + path.length * stepMs + 900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (reaction === 'win') setMood('cheer');
  }, [reaction, setMood]);

  function tap(cell: number) {
    if (mode !== 'answer' || done.current) return;
    const i = visited.length;
    if (path[i] !== cell) {
      done.current = true;
      setWobble(cell);
      setMood('oops');
      tones([{ f: 330, t: 0, d: 0.2 }]);
      setTimeout(() => setHint(path[i]), 350);
      setTimeout(() => onDone({ ok: false, data: { span: len, stepsRemembered: i } }), 1300);
      return;
    }
    tones([{ f: NOTES[i % NOTES.length], t: 0, d: 0.26 }]);
    setMood('fly');
    setSpot(onStar(cell));
    fire(pos(cell).x, pos(cell).y, [accent, '#FFFFFF', '#B9A8FF'], 9, 44);
    const next = [...visited, cell];
    setVisited(next);
    if (next.length === path.length) {
      done.current = true;
      setTimeout(() => {
        setMood('cheer');
        path.forEach((c, k) => setTimeout(() => fire(pos(c).x, pos(c).y, undefined, 10, 60), k * 90));
      }, 400);
      setTimeout(() => onDone({ ok: true, data: { span: len, stepsRemembered: len } }), 900);
    } else {
      setTimeout(() => setMood('idle'), 450);
    }
  }

  const star = size === 3 ? 19 : 15;     // % of the stage

  return (
    <Stage world="sage" className="aspect-[4/4.6]">
      {/* the golden trail */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        {visited.slice(1).map((c, i) => {
          const a = pos(visited[i]), b = pos(c);
          const L = Math.hypot(b.x - a.x, b.y - a.y);
          return (
            <g key={`${i}-${c}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeWidth="3.2" strokeLinecap="round" opacity="0.25"
                strokeDasharray={L} strokeDashoffset={L} className="fg-draw" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round"
                strokeDasharray={L} strokeDashoffset={L} className="fg-draw" />
            </g>
          );
        })}
      </svg>
      {Array.from({ length: size * size }, (_, cell) => {
        const p = pos(cell);
        const on = visited.includes(cell);
        const isHint = hint === cell;
        return (
          <button key={cell} onClick={() => tap(cell)} disabled={mode !== 'answer'}
            aria-label={`Star ${cell + 1}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${star}%`, height: `${star}%`, zIndex: 4 }}>
            <span key={`${on}-${wobble === cell}-${isHint}`}
              className={`block w-full h-full ${on ? 'kp-jelly' : wobble === cell ? 'shake' : isHint ? 'soft-pulse' : 'fg-twinkle'}`}
              style={{ animationDelay: on || wobble === cell || isHint ? undefined : `${-(cell * 0.37) % 2.4}s`, animationDuration: on || wobble === cell || isHint ? undefined : '3.2s' }}>
              <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"
                style={{ filter: on || isHint ? `drop-shadow(0 0 8px ${accent})` : 'drop-shadow(0 0 3px rgba(255,255,255,0.5))', overflow: 'visible' }}>
                <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
                  fill={on ? accent : isHint ? '#FFF6D0' : '#E8E6FF'} stroke={on ? '#FFFFFF' : '#3b2416'} strokeWidth={on ? 1.2 : 0.8} strokeLinejoin="round" />
                <circle cx="9.5" cy="10" r="0.9" fill="#3b2416" /><circle cx="14.5" cy="10" r="0.9" fill="#3b2416" />
                <path d={on ? 'M10 12.6 Q12 14.6 14 12.6' : 'M10.6 13 Q12 13.8 13.4 13'} stroke="#3b2416" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        );
      })}
      <Actor art={pet.art} name={pet.name} x={spot.x} y={spot.y} h={size === 3 ? 66 : 56} mood={mood} moodKey={moodKey}
        moveMs={mode === 'watch' ? Math.min(stepMs * 0.75, 520) : 380} flip={spot.x < 40 && mode === 'answer'} shadow={false} z={6} />
      {layer}
    </Stage>
  );
}
