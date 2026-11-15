'use client';

// ── The pet's little on-screen games (Play and Care, steps 4–6) ──
// Each one turns a real-world task into something the child does WITH
// the pet: breathe along with it, copy its move and tap it each time, or
// tick off the parts of a routine. None has a clock to beat. Every game
// can also be finished by a grown-up ("we needed help") or put off
// ("not today"), which only nudges the hidden difficulty step.

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Outcome } from '@/lib/carepet/engine';
import { chime } from '@/components/friends/voice';
import { speak } from '@/lib/speak';

const INK = '#3B2F63';
const ACCENT = '#7C3AED';

// ── Breathe ──

export type BreathPhase = 'in' | 'hold' | 'out' | 'rest';

const PATTERNS: Record<'flower' | 'box', { phase: BreathPhase; ms: number; say: string }[]> = {
  flower: [
    { phase: 'in', ms: 4000, say: 'Smell the flower' },
    { phase: 'out', ms: 5000, say: 'Blow out the candle' },
  ],
  box: [
    { phase: 'in', ms: 4000, say: 'Breathe in' },
    { phase: 'hold', ms: 4000, say: 'Hold' },
    { phase: 'out', ms: 4000, say: 'Breathe out' },
    { phase: 'rest', ms: 4000, say: 'Hold' },
  ],
};

export function BreatheGame({ pattern, rounds, onBreath, onDone }: {
  pattern: 'flower' | 'box'; rounds: number;
  onBreath: (p: BreathPhase, ms: number) => void;
  onDone: (o: Outcome) => void;
}) {
  const steps = PATTERNS[pattern];
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);           // step within all rounds
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = steps.length * rounds;
  const round = Math.min(rounds, Math.floor(i / steps.length) + (started ? 1 : 0));
  const cur = steps[i % steps.length];

  // the parent re-renders on every breath; these keep the pacing timer
  // from restarting when it does
  const breath = useEffectEvent((p: BreathPhase, ms: number) => onBreath(p, ms));
  const finished = useEffectEvent(() => onDone('win'));

  useEffect(() => {
    if (!started) return;
    if (i >= total) { breath('rest', 600); chime.good(); timer.current = setTimeout(() => finished(), 700); return; }
    breath(cur.phase, cur.ms);
    speak(cur.say);
    if (cur.phase === 'in') chime.soft();
    timer.current = setTimeout(() => setI(n => n + 1), cur.ms);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [started, i, total, cur]);

  const scale = !started ? 0.7 : cur.phase === 'in' || cur.phase === 'hold' ? 1 : 0.62;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: 210, height: 210 }}>
        {pattern === 'box' ? (
          <svg width="210" height="210" viewBox="0 0 210 210" aria-hidden="true">
            <rect x="30" y="30" width="150" height="150" rx="22" fill="#F5F3FF" stroke="#C4B5FD" strokeWidth="6" />
            {started && i < total && (
              <circle r="13" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="4" style={{
                offsetPath: 'path("M30 180 L30 30 L180 30 L180 180 Z")',
                offsetDistance: `${(((i % 4) + 1) / 4) * 100}%`,
                transition: `offset-distance ${cur.ms}ms linear`,
              } as React.CSSProperties} />
            )}
          </svg>
        ) : (
          <span className="absolute rounded-full" style={{
            width: 190, height: 190, transform: `scale(${scale})`,
            transition: `transform ${started ? cur.ms : 300}ms ease-in-out`,
            background: 'radial-gradient(circle, #FDE68A 0%, #FBCFE8 55%, #E9D5FF 100%)',
            boxShadow: '0 0 40px rgba(251,191,36,0.45)',
          }} />
        )}
        {pattern === 'flower' && (
          <span className="relative">
            {cur.phase === 'out' && started ? <CandleIcon /> : <FlowerIcon />}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-center" style={{ color: INK }} aria-live="polite">
        {!started ? 'Ready?' : i >= total ? 'So calm!' : cur.say}
      </p>
      <Dots n={rounds} lit={started ? Math.min(rounds, Math.floor(i / steps.length)) : 0} current={started && i < total ? round - 1 : -1} />
      {!started && (
        <button className="mt-4 min-h-[64px] px-10 rounded-full text-xl font-extrabold text-white shadow-lg active:scale-[0.97] transition-transform"
          style={{ background: ACCENT }} onClick={() => setStarted(true)}>
          Start breathing
        </button>
      )}
      <GrownUpRow onDone={onDone} />
    </div>
  );
}

// ── Count: copy the pet, tap each time ──

export function CountGame({ reps, tapLabel, count, onTap, onDone }: {
  reps: number; tapLabel: string; count: number; onTap: () => void; onDone: (o: Outcome) => void;
}) {
  const done = count >= reps;
  return (
    <div className="flex flex-col items-center">
      <p className="text-lg font-bold text-center px-2" style={{ color: '#5B4B8A' }}>{tapLabel}</p>
      <Dots n={reps} lit={count} current={done ? -1 : count} />
      <button onClick={onTap} disabled={done}
        className="mt-4 w-[132px] h-[132px] rounded-full flex flex-col items-center justify-center text-white font-extrabold text-xl shadow-xl active:scale-[0.94] transition-transform"
        style={{ background: done ? '#16A34A' : 'radial-gradient(circle at 35% 30%, #A78BFA, #7C3AED 70%)', border: '6px solid #FFFFFF' }}
        aria-label={done ? 'All done' : `I did one. ${count} of ${reps}`}>
        <StarMark />
        <span className="mt-1 text-lg">{done ? 'All done!' : 'I did one!'}</span>
      </button>
      <GrownUpRow onDone={onDone} />
    </div>
  );
}

// ── Steps: tick off each part ──

export function StepsGame({ steps, onDone }: { steps: string[]; onDone: (o: Outcome) => void }) {
  const [ticked, setTicked] = useState<boolean[]>(() => steps.map(() => false));
  const fired = useRef(false);
  function tick(i: number) {
    if (ticked[i]) return;
    const next = ticked.map((t, j) => t || j === i);
    setTicked(next);
    chime.good();
    speak(steps[i]);
    if (next.every(Boolean) && !fired.current) { fired.current = true; setTimeout(() => onDone('win'), 700); }
  }
  return (
    <div className="flex flex-col items-stretch gap-3 w-full max-w-[340px] mx-auto">
      {steps.map((s, i) => (
        <button key={s} onClick={() => tick(i)} aria-pressed={ticked[i]}
          className="flex items-center gap-3 min-h-[64px] px-4 rounded-3xl text-left text-lg font-extrabold shadow-sm active:scale-[0.98] transition-transform"
          style={{ background: ticked[i] ? '#DCFCE7' : '#FFFFFF', color: ticked[i] ? '#166534' : INK, border: `3px solid ${ticked[i] ? '#22C55E' : '#E9D5FF'}` }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: ticked[i] ? '#22C55E' : '#F5F3FF', border: `3px solid ${ticked[i] ? '#22C55E' : '#C4B5FD'}` }}>
            {ticked[i] ? <CheckMark /> : <span className="text-base" style={{ color: ACCENT }}>{i + 1}</span>}
          </span>
          {s}
        </button>
      ))}
      <GrownUpRow onDone={onDone} />
    </div>
  );
}

// ── Steps 1–3: a grown-up leads it, then one tap ──

export function GrownUpReport({ title, steps, tip, onDone }: { title?: string; steps?: string[]; tip: string; onDone: (o: Outcome) => void }) {
  const big = 'flex items-center justify-center gap-2 min-h-[60px] px-6 rounded-full text-lg font-extrabold shadow-md active:scale-[0.97] transition-transform';
  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div className="rounded-3xl p-4 text-[15px] leading-snug" style={{ background: '#FFFFFF', color: '#374151', border: '2px solid #EDE9FE' }}>
        <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: ACCENT }}>For a grown-up{title ? ` · ${title}` : ''}</p>
        {steps && <ol className="list-decimal pl-5 space-y-1 mt-2">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
        <p className="mt-2 text-gray-500"><span className="font-bold text-gray-600">Watch for: </span>{tip}</p>
      </div>
      <div className="grid gap-3 mt-4">
        <button className={`${big} text-white`} style={{ background: '#16A34A' }} onClick={() => onDone('win')}><CheckMark /> We did it!</button>
        <button className={`${big} text-white`} style={{ background: '#2563EB' }} onClick={() => onDone('help')}>We did it with help</button>
        <button className={`${big} text-gray-700`} style={{ background: '#EDE9FE' }} onClick={() => onDone('miss')}>Not yet</button>
      </div>
    </div>
  );
}

// ── Shared bits ──

function GrownUpRow({ onDone }: { onDone: (o: Outcome) => void }) {
  return (
    <div className="flex justify-center gap-2 mt-4 text-sm font-bold" style={{ color: '#7C6FA8' }}>
      <button className="min-h-[44px] px-3 rounded-full" onClick={() => onDone('help')}>We needed help</button>
      <span aria-hidden="true" className="self-center opacity-50">·</span>
      <button className="min-h-[44px] px-3 rounded-full" onClick={() => onDone('miss')}>Not today</button>
    </div>
  );
}

function Dots({ n, lit, current }: { n: number; lit: number; current: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={i === current ? 'soft-pulse' : undefined} style={{
          width: 18, height: 18, borderRadius: 999,
          background: i < lit ? '#FBBF24' : '#FFFFFF',
          border: `3px solid ${i < lit ? '#F59E0B' : '#D8CFF5'}`,
          transition: 'background 200ms',
        }} />
      ))}
    </div>
  );
}

function CheckMark() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
}

function StarMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="#FDE68A" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function FlowerIcon() {
  return (
    <svg width="84" height="84" viewBox="0 0 64 64" aria-hidden="true">
      <g filter="url(#kp-brush)" stroke="#3b2416" strokeWidth="2">
        <path d="M32 40 C32 50 30 56 30 60" fill="none" stroke="#15803D" strokeWidth="3.5" />
        <path d="M31 52 C24 50 22 46 22 44 C27 44 30 47 31 52Z" fill="#4ADE80" />
        {[0, 72, 144, 216, 288].map(a => (
          <ellipse key={a} cx="32" cy="18" rx="7" ry="10" fill="#F9A8D4" transform={`rotate(${a} 32 28)`} />
        ))}
        <circle cx="32" cy="28" r="6.5" fill="#FDE047" />
      </g>
    </svg>
  );
}

function CandleIcon() {
  return (
    <svg width="84" height="84" viewBox="0 0 64 64" aria-hidden="true">
      <g filter="url(#kp-brush)" stroke="#3b2416" strokeWidth="2">
        <path d="M32 6 C38 14 38 20 32 24 C26 20 26 14 32 6Z" fill="#FDBA74" />
        <path d="M32 12 C35 16 35 19 32 21 C29 19 29 16 32 12Z" fill="#FEF3C7" strokeWidth="1" />
        <rect x="24" y="26" width="16" height="30" rx="4" fill="#BFDBFE" />
        <path d="M24 34 H40" stroke="#93C5FD" strokeWidth="2" />
      </g>
    </svg>
  );
}
