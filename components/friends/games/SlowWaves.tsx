'use client';

// ── Slow Waves (Shelly · senses & calm) ──
// A calm breathing game. The tide bubble slowly grows (breathe in) and
// shrinks (breathe out). The child presses and holds while breathing in
// and lets go while breathing out; their own bubble grows and shrinks
// inside the tide's, so they can see themselves matching it.
// Difficulty: longer, slower breaths (about 3 s up to 6 s each way).
// Notices: how much of the time the child's holding matched the tide.

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { speak } from '../voice';

const BREATHS = 3;

export default function SlowWaves({ difficulty, accent, say, onDone }: RoundProps) {
  const half = 3 + difficulty * 0.3;                       // seconds in, then the same out
  const [t, setT] = useState(-1);
  const [mine, setMine] = useState(0.55);
  const holding = useRef(false);
  const st = useRef({ match: 0, samples: 0, last: 0, phase: '' as 'in' | 'out' | '', done: false, mine: 0.55 });

  useEffect(() => {
    say('Let’s breathe with the waves. Hold your finger down to breathe in, let go to breathe out.');
    const t0 = performance.now() + 2500;                   // a moment to get ready
    let raf = 0;
    const loop = (now: number) => {
      const s = st.current;
      const sec = (now - t0) / 1000;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0;
      s.last = now;
      if (sec >= 0 && !s.done) {
        const phase = sec % (2 * half) < half ? 'in' : 'out';
        if (phase !== s.phase) { s.phase = phase; speak(phase === 'in' ? 'Breathe in' : 'Breathe out', { rate: 0.8, pitch: 1 }); }
        s.samples++;
        if ((phase === 'in') === holding.current) s.match++;
        s.mine = Math.max(0.55, Math.min(1, s.mine + (holding.current ? 1 : -1) * dt * 0.45 / half));
        setMine(s.mine);
        if (sec >= BREATHS * 2 * half) {
          s.done = true;
          const pct = s.match / Math.max(1, s.samples);
          onDone({ ok: pct >= 0.6, data: { breathSeconds: Math.round(half), matchPct: Math.round(pct * 100) } });
        }
      }
      setT(sec);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = t < 0;
  const inPhase = !ready && t % (2 * half) < half;
  const p = ready ? 0 : (t % half) / half;
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  const tide = ready ? 0.55 : inPhase ? 0.55 + 0.45 * ease(p) : 1 - 0.45 * ease(p);
  const breath = ready ? 0 : Math.min(BREATHS, Math.floor(t / (2 * half)) + 1);
  function hold(e: React.PointerEvent) { e.preventDefault(); holding.current = true; }
  function release(e: React.PointerEvent) { e.preventDefault(); holding.current = false; }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        onPointerDown={hold} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
        onContextMenu={e => e.preventDefault()}
        aria-label="Hold to breathe in, let go to breathe out"
        className="relative w-full aspect-square rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', touchAction: 'none' }}>
        {/* the tide bubble (guide) */}
        <span className="absolute left-1/2 top-1/2 rounded-full" aria-hidden="true"
          style={{ width: '86%', height: '86%', transform: `translate(-50%, -50%) scale(${tide})`, background: `${accent}33`, border: `3px solid ${accent}` }} />
        {/* your own breath */}
        <span className="absolute left-1/2 top-1/2 rounded-full" aria-hidden="true"
          style={{ width: '78%', height: '78%', transform: `translate(-50%, -50%) scale(${mine})`, background: 'rgba(255,255,255,0.22)' }} />
        {/* gentle waves along the bottom */}
        <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute left-0 bottom-0 w-full h-1/5" aria-hidden="true">
          <path d={`M 0 ${22 - tide * 6} Q 25 ${12 - tide * 6} 50 ${22 - tide * 6} T 100 ${22 - tide * 6} T 150 ${22 - tide * 6} T 200 ${22 - tide * 6} V 40 H 0 Z`} fill={`${accent}55`} />
        </svg>
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-3xl font-extrabold" style={{ color: '#FFFFFF' }}>
          {ready ? 'Get ready…' : inPhase ? 'Breathe in…' : 'Breathe out…'}
        </span>
      </button>
      <div className="flex gap-2" aria-label={`Breath ${breath} of ${BREATHS}`}>
        {Array.from({ length: BREATHS }, (_, i) => (
          <span key={i} className="w-3 h-3 rounded-full" style={{ background: i < breath ? accent : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>
    </div>
  );
}
