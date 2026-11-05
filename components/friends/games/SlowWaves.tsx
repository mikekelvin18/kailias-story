'use client';

// ── Slow Waves (Shelly · senses & calm) ──
// A calm breathing game at the seaside. The sun slowly swells and glows
// (breathe in) and softens again (breathe out). The child presses and
// holds the sea while breathing in and lets go while breathing out; the
// sea rises with their breath and Shelly floats up and down on it, with
// bubbles drifting up as they breathe out and little fish swimming by.
// When the child's breath follows the sun, Shelly glows.
// Difficulty: longer, slower breaths (about 3 s up to 6 s each way).
// Notices: how much of the time the child's holding matched the tide.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage, { seeded } from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
import { speak } from '../voice';

const BREATHS = 3;

function Fish({ color, top, dur, delay, size }: { color: string; top: string; dur: number; delay: number; size: number }) {
  return (
    <div className="fg-swim absolute left-0" style={{ top, animationDuration: `${dur}s`, animationDelay: `${-delay}s` }} aria-hidden="true">
      <svg width={size} height={size * 0.6} viewBox="0 0 40 24">
        <g filter="url(#kp-brush)">
          <path d="M4 12 Q16 0 30 12 Q16 24 4 12z" fill={color} stroke="#3b2416" strokeWidth="1.2" />
          <path d="M29 12 L38 5 L37 19z" fill={color} stroke="#3b2416" strokeWidth="1.2" />
          <circle cx="11" cy="10.5" r="1.6" fill="#3b2416" />
        </g>
      </svg>
    </div>
  );
}

export default function SlowWaves({ difficulty, say, onDone, pet, reaction }: RoundProps) {
  const half = 3 + difficulty * 0.3;                       // seconds in, then the same out
  const [t, setT] = useState(-1);
  const [mine, setMine] = useState(0);
  const [held, setHeld] = useState(false);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const { layer, fire } = useBursts();
  const holding = useRef(false);
  const st = useRef({ match: 0, samples: 0, last: 0, phase: '' as 'in' | 'out' | '', done: false, mine: 0, breaths: 0 });

  useEffect(() => {
    say('Let’s breathe with the sun. Hold the sea to breathe in, let go to breathe out.');
    const t0 = performance.now() + 2500;                   // a moment to get ready
    let raf = 0;
    const loop = (now: number) => {
      const s = st.current;
      const sec = (now - t0) / 1000;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0;
      s.last = now;
      if (sec >= 0 && !s.done) {
        const phase = sec % (2 * half) < half ? 'in' : 'out';
        if (phase !== s.phase) {
          if (phase === 'in' && s.phase === 'out') { s.breaths++; fire(50, 40, ['#FFFFFF', '#99F6E4', '#FFE7A8'], 10, 60); }
          s.phase = phase;
          speak(phase === 'in' ? 'Breathe in' : 'Breathe out', { rate: 0.8, pitch: 1 });
        }
        s.samples++;
        if ((phase === 'in') === holding.current) s.match++;
        s.mine = Math.max(0, Math.min(1, s.mine + (holding.current ? 1 : -1) * dt / half));
        setMine(s.mine);
        if (sec >= BREATHS * 2 * half) {
          s.done = true;
          const pct = s.match / Math.max(1, s.samples);
          if (pct >= 0.6) setMood('cheer');
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
  useEffect(() => { if (reaction === 'win') setMood('cheer'); }, [reaction, setMood]);

  const ready = t < 0;
  const inPhase = !ready && t % (2 * half) < half;
  const p = ready ? 0 : (t % half) / half;
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  const tide = ready ? 0 : inPhase ? ease(p) : 1 - ease(p);       // 0..1, the sun's breath
  const breath = ready ? 0 : Math.min(BREATHS, Math.floor(t / (2 * half)) + 1);
  const together = !ready && (inPhase === held);

  // the sea rises with the child's own breath
  const sea = 74 - mine * 26;                                     // % from the top
  const wave = (x: number) => sea + Math.sin(x / 9 + t * 1.6) * 1.6 + Math.sin(x / 4 + t * 2.3) * 0.6;
  const surface = Array.from({ length: 21 }, (_, i) => `${i * 5},${wave(i * 5).toFixed(2)}`).join(' L ');
  const sun = 15 + tide * 10;

  function hold(e: React.PointerEvent) { e.preventDefault(); holding.current = true; setHeld(true); }
  function release(e: React.PointerEvent) { e.preventDefault(); holding.current = false; setHeld(false); }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <Stage world="shelly" className="aspect-square">
        <button
          onPointerDown={hold} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
          onContextMenu={e => e.preventDefault()}
          aria-label="Hold to breathe in, let go to breathe out"
          className="absolute inset-0 w-full h-full" style={{ touchAction: 'none', zIndex: 2 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id="sw-sun"><stop offset="0.4" stopColor="#FFE7A8" stopOpacity="0.9" /><stop offset="1" stopColor="#FFE7A8" stopOpacity="0" /></radialGradient>
              <linearGradient id="sw-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3FC1C9" /><stop offset="1" stopColor="#1B6E8A" /></linearGradient>
            </defs>
            {/* the breathing sun */}
            <circle cx="50" cy="22" r={sun * 1.9} fill="url(#sw-sun)" />
            <g filter="url(#kp-brush)">
              <circle cx="50" cy="22" r={sun * 0.75} fill="#FFD166" stroke="#3b2416" strokeWidth="0.6" />
              <circle cx="46" cy="20" r="0.9" fill="#3b2416" /><circle cx="54" cy="20" r="0.9" fill="#3b2416" />
              <path d={`M46.5 24.5 Q50 ${26 + tide * 1.6} 53.5 24.5`} stroke="#3b2416" strokeWidth="0.7" fill="none" strokeLinecap="round" />
              <circle cx="43.5" cy="23.5" r="1.4" fill="#FF9F80" opacity="0.6" /><circle cx="56.5" cy="23.5" r="1.4" fill="#FF9F80" opacity="0.6" />
            </g>
            {/* the sea */}
            <path d={`M ${surface} L 100,100 L 0,100 Z`} fill="url(#sw-sea)" />
            <path d={`M ${surface}`} fill="none" stroke="#E8FFFD" strokeWidth="1.2" opacity="0.8" />
            <path d={`M ${Array.from({ length: 21 }, (_, i) => `${i * 5},${(wave(i * 5 + 12) + 7).toFixed(2)}`).join(' L ')}`} fill="none" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.25" />
            {/* sand and shells */}
            <g filter="url(#kp-brush)">
              <path d="M0 94 Q30 89 60 93 T100 92 V100 H0z" fill="#F4D9A3" stroke="#3b2416" strokeWidth="0.4" />
              <path d="M14 94 q2 -3 4 0z" fill="#FFB4C8" stroke="#3b2416" strokeWidth="0.3" />
              <path d="M78 93 q2.4 -3.6 4.8 0z" fill="#FFFFFF" stroke="#3b2416" strokeWidth="0.3" />
              <path d="M88 95 l1.5 -3 l1.5 3 l-1.5 -1z" fill="#FF8C69" stroke="#3b2416" strokeWidth="0.3" />
            </g>
          </svg>
          <Fish color="#FFB347" top="80%" dur={14} delay={2} size={30} />
          <Fish color="#FF8FC0" top="86%" dur={18} delay={9} size={24} />
          {/* bubbles while breathing out */}
          {!held && !ready && Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="fg-rise absolute rounded-full" style={{
              left: `${10 + seeded(i, 41) * 80}%`, bottom: '8%', width: 8 + seeded(i, 42) * 10, height: 8 + seeded(i, 42) * 10,
              border: '2px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)',
              animationDuration: `${2.5 + seeded(i, 43) * 2}s`, animationDelay: `${-seeded(i, 44) * 3}s`,
              ['--rise' as string]: '120px',
            } as CSSProperties} />
          ))}
        </button>
        {/* Shelly floats on the water */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
          {together && (
            <span className="absolute rounded-full fg-glow" aria-hidden="true"
              style={{ left: '50%', top: `${wave(50) - 12}%`, width: 170, height: 120, transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(255,255,255,0.55), rgba(255,255,255,0))' }} />
          )}
          <Actor art={pet.art} name={pet.name} x={50} y={wave(50) + 6} h={112} mood={mood} moodKey={moodKey} moveMs={60} shadow={false} />
        </div>
        <div className="absolute inset-x-0 bottom-[12%] text-center pointer-events-none" style={{ zIndex: 4 }}>
          <span key={ready ? 'r' : inPhase ? 'i' : 'o'} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-2xl font-extrabold bounce-in"
            style={{ background: 'rgba(255,255,255,0.85)', color: '#0F3E4A' }}>
            {!ready && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ transform: inPhase ? undefined : 'rotate(180deg)' }}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
            )}
            {ready ? 'Get ready…' : inPhase ? 'Breathe in… hold' : 'Breathe out… let go'}
          </span>
        </div>
        {layer}
      </Stage>
      <div className="flex gap-2" aria-label={`Breath ${breath} of ${BREATHS}`}>
        {Array.from({ length: BREATHS }, (_, i) => (
          <span key={i} className="w-3.5 h-3.5 rounded-full" style={{ background: i < breath ? '#99F6E4' : 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.6)' }} />
        ))}
      </div>
    </div>
  );
}
