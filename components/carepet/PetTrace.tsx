'use client';

// ── Feed: trace the pet's food ──
// A glowing dotted path (lib/traceShapes.ts) the child traces with a
// finger or mouse. Dots wake up when the finger passes close; the food is
// "made" when most of the path glows. Always the full guide, no clock,
// no fail state: a stray stroke only makes the next dot glow brighter.
//
// It reports an outcome for the pet's difficulty: an easy win (close to
// the path, few lost strokes), a miss (far off the path or many lost
// strokes), or in between ("help").

import { useMemo, useRef, useState } from 'react';
import { ShapeKind, shapePoints, toPath } from '@/lib/traceShapes';
import { chime } from '@/components/friends/voice';
import type { Outcome } from '@/lib/carepet/engine';

interface Props {
  shape: ShapeKind;
  tolerance: number;      // px a finger may stray and still wake a dot
  color: string;
  onDone: (outcome: Outcome, metrics: Record<string, number>) => void;
}

export default function PetTrace({ shape, tolerance, color, onDone }: Props) {
  const pts = useMemo(() => shapePoints(shape, 48), [shape]);
  const [lit, setLit] = useState<boolean[]>(() => pts.map(() => false));
  const [finished, setFinished] = useState(false);
  const [lostStrokes, setLostStrokes] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const litRef = useRef(lit);
  const stroke = useRef({ active: false, woke: 0 });
  const stats = useRef({ devSum: 0, devN: 0, lost: 0, startedAt: 0, lastAt: 0 });

  const litCount = lit.filter(Boolean).length;
  const nextIdx = lit.findIndex(v => !v);

  function move(e: React.PointerEvent) {
    if (finished || (e.pointerType === 'mouse' && e.buttons === 0)) return;
    const rect = boxRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (!stats.current.startedAt) stats.current.startedAt = e.timeStamp;
    stats.current.lastAt = e.timeStamp;
    if (!stroke.current.active) stroke.current = { active: true, woke: 0 };
    let best = Infinity, bestI = -1;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x * rect.width - x, p.y * rect.height - y);
      if (d < best) { best = d; bestI = i; }
    });
    stats.current.devSum += best;
    stats.current.devN += 1;
    if (best > tolerance) return;
    const next = [...litRef.current];
    let changed = false;
    [bestI - 1, bestI, bestI + 1].forEach(i => {
      if (i >= 0 && i < next.length && !next[i]) { next[i] = true; changed = true; }
    });
    if (!changed) return;
    stroke.current.woke += 1;
    litRef.current = next;
    setLit(next);
    if (next.filter(Boolean).length % 6 === 0) chime.tap();
    if (next.filter(Boolean).length / next.length >= 0.88) finish(next);
  }

  function up() {
    if (!stroke.current.active) return;
    if (stroke.current.woke === 0 && !finished) { stats.current.lost += 1; setLostStrokes(n => n + 1); }
    stroke.current = { active: false, woke: 0 };
  }

  function finish(final: boolean[]) {
    setFinished(true);
    setLit(final.map(() => true));
    const s = stats.current;
    const avgDev = s.devN ? s.devSum / s.devN : 0;
    const outcome: Outcome = avgDev <= tolerance * 0.5 && s.lost <= 1 ? 'win'
      : avgDev > tolerance * 0.85 || s.lost >= 3 ? 'miss' : 'help';
    onDone(outcome, {
      avgDeviationPx: Math.round(avgDev),
      lostStrokes: s.lost,
      totalMs: Math.round(s.lastAt - s.startedAt),
      coverage: Math.round((final.filter(Boolean).length / final.length) * 100),
    });
  }

  return (
    <div ref={boxRef}
      className="relative mx-auto rounded-[28px] touch-none select-none"
      style={{ width: 'min(78vw, 300px)', aspectRatio: '1 / 1', background: 'radial-gradient(circle at 50% 45%, #FFF7E0, #FDF2D8 70%)', boxShadow: 'inset 0 0 0 3px rgba(245,158,11,0.25)' }}
      onPointerDown={move} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
      role="img" aria-label="Tracing area: follow the glowing dots with your finger">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden="true">
        <path d={toPath(pts)} fill="none" stroke={finished ? color : '#F59E0B'} strokeOpacity={finished ? 0.9 : 0.28}
          strokeWidth={finished ? 7 : 5} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x * 100} cy={p.y * 100} r={lit[i] ? 2.6 : 1.9}
            fill={lit[i] ? color : '#FBBF24'} opacity={lit[i] ? 1 : 0.55} />
        ))}
        {!finished && nextIdx >= 0 && (
          <circle cx={pts[nextIdx].x * 100} cy={pts[nextIdx].y * 100}
            r={lostStrokes >= 2 ? 7 : 5.5} fill="#22C55E" fillOpacity={0.9}
            stroke="#BBF7D0" strokeWidth={2.5} className="soft-pulse" />
        )}
      </svg>
      <span className="sr-only" aria-live="polite">{finished ? 'All done!' : `${litCount} of ${pts.length} dots glowing`}</span>
    </div>
  );
}
