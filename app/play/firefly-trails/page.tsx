'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';

// ─── Firefly Trails ───────────────────────────────────────────────────────────
// Gamified tracing with a cognitive twist: a firefly draws a glowing
// picture in the night sky; the child traces it to wake the trail of
// sleeping star-dots. Higher levels FADE the guide so the child traces
// from memory — fine motor and visual recall in one game.

type ShapeKind = 'line' | 'circle' | 'zigzag' | 'wave' | 'star' | 'spiral';
type Mode = 'guide' | 'faint' | 'memory';

const SHAPES: { kind: ShapeKind; name: string; emoji: string }[] = [
  { kind: 'line', name: 'The Bridge', emoji: '🌉' },
  { kind: 'circle', name: 'The Full Moon', emoji: '🌕' },
  { kind: 'zigzag', name: 'The Lightning', emoji: '⚡' },
  { kind: 'wave', name: 'The River', emoji: '🌊' },
  { kind: 'star', name: 'The Great Star', emoji: '⭐' },
  { kind: 'spiral', name: 'The Snail Path', emoji: '🐌' },
];

function shapePoints(kind: ShapeKind, n = 64): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => pts.push({ x, y });
  if (kind === 'line') for (let i = 0; i < n; i++) push(0.1 + 0.8 * (i / (n - 1)), 0.5);
  if (kind === 'circle') for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + 2 * Math.PI * (i / (n - 1)); push(0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)); }
  if (kind === 'zigzag') { const vs = [[0.08, 0.7], [0.3, 0.3], [0.5, 0.7], [0.7, 0.3], [0.92, 0.7]]; const per = Math.floor(n / (vs.length - 1)); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'wave') for (let i = 0; i < n; i++) { const t = i / (n - 1); push(0.08 + 0.84 * t, 0.5 + 0.22 * Math.sin(t * Math.PI * 3)); }
  if (kind === 'star') { const vs: number[][] = []; for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + k * (2 * Math.PI / 5); const a2 = a1 + Math.PI / 5; vs.push([0.5 + 0.36 * Math.cos(a1), 0.5 + 0.36 * Math.sin(a1)]); vs.push([0.5 + 0.15 * Math.cos(a2), 0.5 + 0.15 * Math.sin(a2)]); } vs.push(vs[0]); const per = Math.max(2, Math.floor(n / (vs.length - 1))); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'spiral') for (let i = 0; i < n; i++) { const t = i / (n - 1); const a = t * Math.PI * 4; const r = 0.06 + 0.3 * t; push(0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)); }
  return pts;
}

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.1, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* optional */ }
}
const sfx = {
  dot: (i: number) => playNotes([{ f: 520 + (i % 8) * 40, t: 0, d: 0.06 }]),
  peek: () => playNotes([{ f: 392, t: 0, d: 0.15 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function FireflyTrailsPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'watch' | 'trace' | 'done'>('intro');
  const [lit, setLit] = useState<boolean[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [peeks, setPeeks] = useState(0);
  const [noelLine, setNoelLine] = useState('');
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  const boxRef = useRef<HTMLDivElement>(null);
  const ptsRef = useRef<{ x: number; y: number }[]>([]);
  const litRef = useRef<boolean[]>([]);
  const statsRef = useRef({ devSum: 0, devN: 0, startedAt: 0 });
  const trailId = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { setLevel(nextGameLevel('firefly-trails')); return () => timersRef.current.forEach(clearTimeout); }, []);

  const shape = SHAPES[(level - 1) % SHAPES.length];
  const mode: Mode = tier === 'tiny' ? 'guide'
    : tier === 'small' ? (level < 3 ? 'guide' : 'faint')
    : level < 2 ? 'guide' : level < 4 ? 'faint' : 'memory';
  const tolerance = tier === 'tiny' ? 36 : tier === 'small' ? 28 : 22;

  const startLevel = useCallback(() => {
    const pts = shapePoints(shape.kind);
    ptsRef.current = pts;
    litRef.current = pts.map(() => false);
    setLit(pts.map(() => false));
    setPeeks(0);
    setTrail([]);
    statsRef.current = { devSum: 0, devN: 0, startedAt: Date.now() };
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (mode === 'memory') {
      setPhase('watch');
      setShowGuide(true);
      setNoelLine(`Watch the firefly draw ${shape.name}… remember it!`);
      timersRef.current.push(setTimeout(() => {
        setShowGuide(false);
        setPhase('trace');
        setNoelLine('Now trace it from memory! (Peek 👀 if you need)');
      }, 3200));
    } else {
      setShowGuide(true);
      setPhase('trace');
      setNoelLine(mode === 'guide'
        ? `Trace ${shape.name} — follow the glowing dots!`
        : `The trail is faint tonight — trace ${shape.name} carefully!`);
    }
  }, [shape, mode]);

  function peek() {
    if (mode !== 'memory' || phase !== 'trace') return;
    sfx.peek();
    setPeeks(p => p + 1);
    setShowGuide(true);
    timersRef.current.push(setTimeout(() => setShowGuide(false), 1400));
  }

  function handleMove(e: React.PointerEvent) {
    if (phase !== 'trace' || e.buttons === 0) return;
    const rect = boxRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // glowing finger trail
    const id = ++trailId.current;
    setTrail(prev => [...prev.slice(-12), { x, y, id }]);
    // nearest path point
    let best = Infinity, bestI = -1;
    ptsRef.current.forEach((p, i) => {
      const d = Math.hypot(p.x * rect.width - x, p.y * rect.height - y);
      if (d < best) { best = d; bestI = i; }
    });
    statsRef.current.devSum += best;
    statsRef.current.devN += 1;
    if (best <= tolerance && bestI >= 0) {
      let changed = false;
      [bestI - 1, bestI, bestI + 1].forEach(i => {
        if (i >= 0 && i < litRef.current.length && !litRef.current[i]) { litRef.current[i] = true; changed = true; }
      });
      if (changed) {
        sfx.dot(bestI);
        setLit([...litRef.current]);
      }
    }
  }

  // completion: 88% of the trail lit
  useEffect(() => {
    if (phase !== 'trace' || lit.length === 0) return;
    const litCount = lit.filter(Boolean).length;
    if (litCount / lit.length >= 0.88) {
      const s = statsRef.current;
      const avgDev = s.devN ? Math.round(s.devSum / s.devN) : 0;
      logQuestMetric('fine motor', 'firefly-trails', {
        level, shapeIdx: (level - 1) % SHAPES.length, memoryMode: mode === 'memory' ? 1 : 0,
        coverage: Math.round((litCount / lit.length) * 100), avgDeviationPx: avgDev,
        peeks, totalMs: Date.now() - s.startedAt,
      });
      awardStarlight(Math.max(8, 12 + level * 2 - peeks * 2));
      recordGameLevel('firefly-trails', level);
      sfx.fanfare();
      setPhase('done');
    }
  }, [lit, phase, level, mode, peeks]);

  const litCount = lit.filter(Boolean).length;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #071527 0%, #0b2440 60%, #0f3d2e 130%)' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-emerald-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🪰 Firefly Trails <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="text-xs font-bold text-emerald-200 w-12 text-right">
            {phase === 'trace' || phase === 'watch' ? `${Math.round((litCount / Math.max(1, lit.length)) * 100)}%` : ''}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={128} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={96} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                The night sky pictures went dark! 🌌
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                A little firefly knows every trail — <strong>trace her glowing paths</strong> to wake
                the sky pictures, one star-dot at a time!
                {mode === 'memory' && <> Tonight is tricky: the trail <strong>fades</strong> — remember it!</>}
              </p>
            </div>
            <button onClick={startLevel}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Level {level}: {shape.emoji} {shape.name}
            </button>
            <SkillIntro gameId="firefly-trails" />
          </div>
        )}

        {(phase === 'watch' || phase === 'trace') && (
          <>
            <p className="text-center text-sm font-extrabold mb-2"
              style={{ color: phase === 'watch' ? '#FDE047' : '#A7F3D0' }}>
              {phase === 'watch' ? `👀 Watch and remember ${shape.name}…` : `${shape.emoji} Trace ${shape.name}!`}
            </p>
            <div ref={boxRef}
              onPointerDown={handleMove} onPointerMove={handleMove}
              className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ aspectRatio: '1', touchAction: 'none', cursor: 'crosshair',
                background: 'radial-gradient(ellipse at 50% 120%, #14532d66 0%, transparent 55%), linear-gradient(180deg, #050d1c, #0a1d33)',
                border: '3px solid rgba(110,231,183,0.25)' }}>
              {/* scenery */}
              <span className="absolute" style={{ left: '6%', top: '4%', fontSize: 22, opacity: 0.6, pointerEvents: 'none' }}>🌙</span>
              <span className="absolute" style={{ right: '8%', bottom: '4%', fontSize: 18, opacity: 0.5, pointerEvents: 'none' }}>🌲</span>
              {/* the trail dots */}
              {ptsRef.current.map((p, i) => (
                <span key={i} className="absolute rounded-full" style={{
                  left: `calc(${p.x * 100}% - 5px)`, top: `calc(${p.y * 100}% - 5px)`,
                  width: 10, height: 10, pointerEvents: 'none',
                  background: lit[i] ? '#FDE047' : '#93C5FD',
                  opacity: lit[i] ? 1 : showGuide ? (mode === 'faint' ? 0.28 : 0.75) : 0.05,
                  boxShadow: lit[i] ? '0 0 12px 4px rgba(253,224,71,0.55)' : showGuide ? '0 0 6px rgba(147,197,253,0.4)' : 'none',
                  transition: 'opacity 0.4s',
                }} />
              ))}
              {/* start marker */}
              {ptsRef.current[0] && (
                <span className="absolute sparkle" style={{ left: `calc(${ptsRef.current[0].x * 100}% - 12px)`, top: `calc(${ptsRef.current[0].y * 100}% - 26px)`, fontSize: 20, pointerEvents: 'none' }}>🪰</span>
              )}
              {/* finger glow trail */}
              {trail.map((t, i) => (
                <span key={t.id} className="absolute rounded-full" style={{
                  left: t.x - 7, top: t.y - 7, width: 14, height: 14, pointerEvents: 'none',
                  background: 'radial-gradient(circle, rgba(253,224,71,0.9), transparent 70%)',
                  opacity: (i + 1) / trail.length,
                }} />
              ))}
              {/* peek button (memory mode) */}
              {mode === 'memory' && phase === 'trace' && (
                <button onClick={peek}
                  className="absolute right-2 top-2 px-3 py-1.5 rounded-full text-xs font-extrabold"
                  style={{ background: 'rgba(255,255,255,0.9)', color: '#0b2440' }}>
                  👀 Peek
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={phase === 'watch' ? 'thinking' : 'excited'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0b2440ee, #14532dee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">{shape.emoji}</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">{shape.name} shines again!</h2>
            <p className="text-emerald-100 font-semibold mb-1">
              {mode === 'memory' ? 'Traced from memory — incredible!' : 'What a steady, glowing trail!'} 🌌
            </p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(8, 12 + level * 2 - peeks * 2)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { const nl = level + 1; setLevel(nl); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                Back to the map 🗺️
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
