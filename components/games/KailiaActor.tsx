'use client';

// ── Kailia inside the game ──
// Kailia is not a portrait beside the game; she does the action. Give her
// a spot (x, y in % of the scene, at her feet) and she runs there with her
// drawn run cycle, turning to face the way she goes, then stands and
// breathes. `hop` (change the number) makes her jump for joy.

import { useEffect, useState } from 'react';
import RunnerSprite from '@/components/characters/RunnerSprite';

interface Props {
  x: number;
  y: number;
  /** height in px */
  h: number;
  /** how long a run across the whole scene takes */
  moveMs?: number;
  /** bump to make her hop */
  hop?: number;
  z?: number;
}

export default function KailiaActor({ x, y, h, moveMs = 700, hop = 0, z = 6 }: Props) {
  // the spot she was last sent to, how long the run there takes, and
  // which way she faces (updated while rendering, React's "adjust state
  // when a prop changes" pattern)
  const [move, setMove] = useState({ x, y, ms: 300, faceLeft: false, n: 0 });
  if (move.x !== x || move.y !== y) {
    const dx = x - move.x;
    setMove({ x, y, ms: duration(Math.hypot(dx, y - move.y), moveMs), faceLeft: Math.abs(dx) > 0.5 ? dx < 0 : move.faceLeft, n: move.n + 1 });
  }
  const [stoppedAt, setStoppedAt] = useState(0);
  useEffect(() => {
    if (!move.n) return;
    const t = setTimeout(() => setStoppedAt(move.n), move.ms);
    return () => clearTimeout(t);
  }, [move.n, move.ms]);
  const running = move.n > stoppedAt;
  const { ms, faceLeft } = move;
  const w = Math.round(h * 0.78);
  return (
    <div className="absolute pointer-events-none" style={{
      left: `${x}%`, top: `${y}%`, width: w, height: h, marginLeft: -w / 2, marginTop: -h, zIndex: z,
      transition: `left ${ms}ms linear, top ${ms}ms ease-out`,
    }}>
      <span aria-hidden="true" className="absolute left-[20%] right-[20%] -bottom-[3%] h-[8%] rounded-[50%]" style={{ background: 'rgba(0,0,0,0.3)', filter: 'blur(2px)' }} />
      <div style={{ transform: `scaleX(${faceLeft ? -1 : 1})`, transition: 'transform 0.18s', transformOrigin: '50% 100%' }}>
        <div key={hop} className={hop ? 'kp-hop' : undefined} style={{ transformOrigin: '50% 100%' }}>
          <RunnerSprite character="kailia" action={running ? 'run' : 'idle'} width={w} height={h} fps={10} />
        </div>
      </div>
    </div>
  );
}

// short hops are quick, a run across the scene takes the full time
function duration(distPct: number, fullMs: number) {
  return Math.round(Math.max(260, Math.min(1, distPct / 70) * fullMs));
}
