'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import NightForest from '@/components/games/NightForest';
import GlowBug from '@/components/games/GlowBug';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Firefly Trails ───────────────────────────────────────────────────────────
// Gamified tracing with a cognitive twist: a firefly draws a glowing
// picture in the night sky; the child traces it to wake the trail of
// sleeping star-dots. Higher levels FADE the guide so the child traces
// from memory — fine motor and visual recall in one game.
//
// The sky sits above a little forest glade: the firefly waits at the next
// sleeping dot, Kailia runs along the ground under the light the child
// draws (and hops at every quarter of the picture), and the child's
// friend plays along: cheers, wobbles when a stroke wakes nothing, and
// after two such strokes runs under the next dot to point it out.

type ShapeKind = 'line' | 'circle' | 'zigzag' | 'wave' | 'star' | 'spiral';
type Mode = 'guide' | 'faint' | 'memory';

const SHAPES: { kind: ShapeKind; name: string }[] = [
  { kind: 'line', name: 'The Bridge' },
  { kind: 'circle', name: 'The Full Moon' },
  { kind: 'zigzag', name: 'The Lightning' },
  { kind: 'wave', name: 'The River' },
  { kind: 'star', name: 'The Great Star' },
  { kind: 'spiral', name: 'The Snail Path' },
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

const toPath = (pts: { x: number; y: number }[], scale = 100) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * scale).toFixed(1)} ${(p.y * scale).toFixed(1)}`).join(' ');

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
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

const clampPct = (v: number) => Math.max(10, Math.min(90, v));
// the friend never stands right on top of Kailia: nudge it beside her
const besideKailia = (petX: number, kailiaX: number) =>
  Math.abs(petX - kailiaX) >= 18 ? petX : clampPct(kailiaX + (kailiaX > 50 ? -19 : 19));

// the sky (the tracing square) sits on top; the glade strip below it is
// where Kailia and the friend stand (scene height = width × SCENE_H)
const SCENE_H = 1.27;
const GROUND_Y = 97; // feet line, % of the whole scene

export default function FireflyTrailsPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'watch' | 'trace' | 'shine' | 'done'>('intro');
  const [lit, setLit] = useState<boolean[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [peeks, setPeeks] = useState(0);
  const [noelLine, setNoelLine] = useState('');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  // the firefly's spot along the trail while she shows the picture (watch)
  const [watchIdx, setWatchIdx] = useState(0);
  // the trail's points (state for drawing; ptsRef for the pointer handler)
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);

  // Kailia and the friend in the glade (x = % of the scene width)
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(30);
  const [petX, setPetX] = useState(70);
  const [kailiaHop, setKailiaHop] = useState(0);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const { layer: burstLayer, fire } = useBursts();

  const boxRef = useRef<HTMLDivElement>(null);
  const ptsRef = useRef<{ x: number; y: number }[]>([]);
  const litRef = useRef<boolean[]>([]);
  const statsRef = useRef({ devSum: 0, devN: 0, startedAt: 0 });
  const trailId = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // one finger stroke: did it wake any dot? (a stroke that wakes none is a "miss")
  const strokeRef = useRef<{ active: boolean; woke: number }>({ active: false, woke: 0 });
  const quietStrokesRef = useRef(0);
  const quarterRef = useRef(0);
  const lastLitRef = useRef(0);

  useEffect(() => { setLevel(nextGameLevel('firefly-trails')); return () => timersRef.current.forEach(clearTimeout); }, []);

  const shape = SHAPES[(level - 1) % SHAPES.length];
  const mode: Mode = tier === 'tiny' ? 'guide'
    : tier === 'small' ? (level < 3 ? 'guide' : 'faint')
    : level < 2 ? 'guide' : level < 4 ? 'faint' : 'memory';
  const tolerance = tier === 'tiny' ? 36 : tier === 'small' ? 28 : 22;

  const startLevel = useCallback(() => {
    const pts = shapePoints(shape.kind);
    ptsRef.current = pts;
    setPts(pts);
    litRef.current = pts.map(() => false);
    setLit(pts.map(() => false));
    setPeeks(0);
    setTrail([]);
    setHintIdx(null);
    setKailiaX(clampPct(pts[0].x * 100 - 4));
    setPetX(clampPct(pts[0].x * 100 + 16));
    quietStrokesRef.current = 0;
    quarterRef.current = 0;
    lastLitRef.current = 0;
    statsRef.current = { devSum: 0, devN: 0, startedAt: Date.now() };
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setNoelMood('excited');
    if (mode === 'memory') {
      setPhase('watch');
      setShowGuide(true);
      setWatchIdx(0);
      setNoelLine(`Watch the firefly draw ${shape.name}… remember it!`);
      // the firefly flies the whole picture once while the child watches
      const step = Math.floor(2800 / pts.length);
      pts.forEach((_, i) => timersRef.current.push(setTimeout(() => setWatchIdx(i), 200 + i * step)));
      timersRef.current.push(setTimeout(() => {
        setShowGuide(false);
        setPhase('trace');
        setNoelLine('Now trace it from memory! Tap Peek if you need a look.');
      }, 3200));
    } else {
      setShowGuide(true);
      setPhase('trace');
      setNoelLine(mode === 'guide'
        ? `Trace ${shape.name}: follow the firefly and the glowing dots!`
        : `The trail is faint tonight. Trace ${shape.name} carefully!`);
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
    if (!strokeRef.current.active) strokeRef.current = { active: true, woke: 0 };
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
        strokeRef.current.woke += 1;
        lastLitRef.current = bestI;
        setLit([...litRef.current]);
      }
    }
  }

  // a finger lifted: if that stroke woke no dots, the friend wobbles; after
  // two such strokes in a row it runs under the next sleeping dot
  function endStroke() {
    const s = strokeRef.current;
    if (!s.active) return;
    strokeRef.current = { active: false, woke: 0 };
    if (phase !== 'trace') return;
    if (s.woke > 0) { quietStrokesRef.current = 0; return; }
    quietStrokesRef.current += 1;
    setPetMood('oops');
    if (quietStrokesRef.current >= 2) {
      const next = litRef.current.findIndex(v => !v);
      if (next >= 0) {
        setHintIdx(next);
        setPetX(besideKailia(clampPct(ptsRef.current[next].x * 100), kailiaX));
        setPetMood('talk');
        setNoelLine(`Look! ${pet.name} found where the trail wakes up next. Start by the firefly!`);
        setNoelMood('thinking');
      }
      quietStrokesRef.current = 0;
    } else {
      setNoelLine('Slide your finger right along the sleepy dots, nice and slow!');
      setNoelMood('thinking');
    }
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    timersRef.current.push(setTimeout(() => setPetMood('idle'), 1300));
  }

  // Kailia runs along the ground under the newest light, the friend
  // scampers beside her; every quarter of the picture gets a hop and cheer
  const litCount = lit.filter(Boolean).length;
  useEffect(() => {
    if (phase !== 'trace' || litCount === 0) return;
    const p = ptsRef.current[lastLitRef.current];
    if (!p) return;
    const kx = clampPct(p.x * 100);
    setKailiaX(kx);
    setHintIdx(null);
    setPetX(px => besideKailia(Math.abs(px - kx) > 30 ? kx + (kx > 50 ? -20 : 20) : px, kx));
    const q = Math.floor((litCount / lit.length) * 4);
    if (q > quarterRef.current && q < 4) {
      quarterRef.current = q;
      setKailiaHop(n => n + 1);
      setPetMood('cheer');
      chime.good();
      fire(p.x * 100, (p.y * 100) / SCENE_H, ['#FFE066', '#FFF7B0', '#FFFFFF'], 12, 60);
      setNoelLine(q === 1 ? 'The sky is waking up!' : q === 2 ? 'Halfway there, keep glowing!' : 'Almost done, so bright!');
      setNoelMood('excited');
    }
  }, [litCount, lit.length, phase, fire, setPetMood]);

  // completion: 88% of the trail lit
  useEffect(() => {
    if (phase !== 'trace' || lit.length === 0) return;
    const litNow = lit.filter(Boolean).length;
    if (litNow / lit.length >= 0.88) {
      const s = statsRef.current;
      const avgDev = s.devN ? Math.round(s.devSum / s.devN) : 0;
      logQuestMetric('fine motor', 'firefly-trails', {
        level, shapeIdx: (level - 1) % SHAPES.length, memoryMode: mode === 'memory' ? 1 : 0,
        coverage: Math.round((litNow / lit.length) * 100), avgDeviationPx: avgDev,
        peeks, totalMs: Date.now() - s.startedAt,
      });
      awardStarlight(Math.max(8, 12 + level * 2 - peeks * 2));
      recordGameLevel('firefly-trails', level);
      sfx.fanfare();
      // the whole picture lights up and everyone celebrates before the finale
      /* eslint-disable react-hooks/set-state-in-effect -- the finished picture shines for a moment */
      setPhase('shine');
      setShowGuide(true);
      setKailiaHop(n => n + 1);
      setPetMood('cheer');
      setNoelMood('celebrating');
      setNoelLine(`${shape.name} shines again!`);
      /* eslint-enable react-hooks/set-state-in-effect */
      fire(50, 40, ['#FFE066', '#FFF7B0', '#FFFFFF', '#8BE3FF'], 18, 110);
      timersRef.current.push(setTimeout(() => setPhase('done'), 1700));
    }
  }, [lit, phase, level, mode, peeks, shape.name, fire, setPetMood]);

  const nextIdx = lit.findIndex(v => !v);
  // where the firefly waits: flying the picture (watch), else at the next
  // sleeping dot whenever the trail is showing
  const bugIdx = phase === 'watch' ? watchIdx : nextIdx;
  const showBug = (phase === 'watch' || phase === 'trace') && bugIdx >= 0 && pts[bugIdx] && (showGuide || hintIdx !== null);
  const bugAngle = (() => {
    const a = pts[bugIdx], b = pts[Math.min(pts.length - 1, bugIdx + 1)];
    return a && b && (a.x !== b.x || a.y !== b.y) ? Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI : 0;
  })();
  const stars = Math.max(8, 12 + level * 2 - peeks * 2);

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #071527 0%, #0b2440 60%, #0f3d2e 130%)' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-emerald-200 whitespace-nowrap">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow whitespace-nowrap">
            Firefly Trails <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {/* four little lights fill in as the picture wakes (no numbers) */}
          <span className="flex justify-end gap-1 w-14" aria-hidden="true">
            {[1, 2, 3, 4].map(q => {
              const on = phase !== 'intro' && lit.length > 0 && litCount / lit.length >= (q === 4 ? 0.88 : q / 4);
              return <span key={q} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#FDE047', boxShadow: on ? '0 0 8px #FDE047' : 'none', opacity: on ? 1 : 0.25 }} />;
            })}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={120} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={90} expression="excited" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 66)} kind="pet" />
              <span className="self-start mt-2 fg-bob inline-block"><GlowBug size={40} seed={3} /></span>
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                The night sky pictures went dark!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                A little firefly knows every trail. <strong>Trace her glowing paths</strong> to wake
                the sky pictures, one star-dot at a time!
                {mode === 'memory' && <> Tonight is tricky: the trail <strong>fades</strong>, so remember it!</>}
              </p>
            </div>
            <LevelPath gameId="firefly-trails" level={level} onPick={setLevel} />
            <button onClick={startLevel}
              className="mt-6 px-8 py-3 rounded-full text-xl font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              <ShapeGlyph kind={shape.kind} size={40} />
              <span className="whitespace-nowrap">Level {level}: {shape.name}</span>
            </button>
            <SkillIntro gameId="firefly-trails" />
          </div>
        )}

        {phase !== 'intro' && (
          <>
            <p className="text-center text-base font-extrabold mb-2 flex items-center justify-center gap-2"
              style={{ color: phase === 'watch' ? '#FDE047' : '#A7F3D0' }}>
              <ShapeGlyph kind={shape.kind} size={28} light />
              {phase === 'watch' ? `Watch and remember ${shape.name}…` : phase === 'trace' ? `Trace ${shape.name}!` : `${shape.name} shines!`}
            </p>

            {/* the scene: night sky to trace in, a glade below for Kailia and the friend */}
            <div className="relative w-full rounded-[28px] overflow-hidden select-none"
              style={{ aspectRatio: `1 / ${SCENE_H}`, boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <NightForest glow={litCount / Math.max(1, lit.length)} />

              <div ref={boxRef} data-trace
                onPointerDown={handleMove} onPointerMove={handleMove}
                onPointerUp={endStroke} onPointerCancel={endStroke} onPointerLeave={endStroke}
                className="absolute left-0 top-0 w-full"
                style={{ aspectRatio: '1', touchAction: 'none', cursor: 'crosshair', zIndex: 8 }}>
                {/* the faint line between the dots, so it reads as one picture */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {pts.length > 0 && (
                    <path d={toPath(pts)} fill="none" stroke={phase === 'shine' ? '#FDE047' : '#BFDBFE'} strokeWidth={phase === 'shine' ? 1.6 : 0.8}
                      strokeLinecap="round" strokeLinejoin="round"
                      opacity={phase === 'shine' ? 0.9 : showGuide ? (mode === 'faint' ? 0.12 : 0.3) : 0}
                      style={{ transition: 'opacity 0.4s', filter: phase === 'shine' ? 'drop-shadow(0 0 1.5px #FDE047)' : undefined }} />
                  )}
                </svg>
                {/* the trail dots */}
                {pts.map((p, i) => (
                  <span key={i} className="absolute rounded-full" style={{
                    left: `calc(${p.x * 100}% - 5px)`, top: `calc(${p.y * 100}% - 5px)`,
                    width: 10, height: 10, pointerEvents: 'none',
                    background: lit[i] ? '#FDE047' : '#DBEAFE',
                    border: lit[i] ? '1.5px solid #FFFBE0' : '1.5px solid rgba(255,255,255,0.7)',
                    opacity: lit[i] ? 1 : showGuide ? (mode === 'faint' ? 0.32 : 0.8) : 0.05,
                    boxShadow: lit[i] ? '0 0 12px 4px rgba(253,224,71,0.55)' : showGuide ? '0 0 6px rgba(191,219,254,0.5)' : 'none',
                    transition: 'opacity 0.4s',
                  }} />
                ))}
                {/* after two quiet strokes: a ring around where the trail wakes next */}
                {hintIdx !== null && pts[hintIdx] && (
                  <span className="absolute rounded-full hint-glow" style={{
                    left: `calc(${pts[hintIdx].x * 100}% - 22px)`, top: `calc(${pts[hintIdx].y * 100}% - 22px)`,
                    width: 44, height: 44, border: '3px solid rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
                )}
                {/* the firefly: flies the picture while you watch, then waits at the next sleeping dot */}
                {showBug && (
                  <div className="absolute" style={{
                    left: `calc(${pts[bugIdx].x * 100}% - 19px)`, top: `calc(${pts[bugIdx].y * 100}% - 34px)`,
                    width: 38, height: 38, pointerEvents: 'none',
                    transition: phase === 'watch' ? 'left 60ms linear, top 60ms linear' : 'left 0.35s ease-out, top 0.35s ease-out',
                  }}>
                    <GlowBug size={38} seed={7} angle={bugAngle} lit={1} />
                  </div>
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
                  <button onClick={peek} onPointerDown={e => e.stopPropagation()}
                    className="absolute right-2 top-2 h-11 px-4 rounded-full text-sm font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap shadow"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#0b2440' }}>
                    <EyeIcon /> Peek
                  </button>
                )}
              </div>

              {/* Kailia and the friend in the glade, under the sky picture */}
              <KailiaActor x={kailiaX} y={GROUND_Y} h={74} hop={kailiaHop} z={9} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petX} y={GROUND_Y - 0.5} h={54}
                  mood={hintIdx !== null && petMood === 'idle' ? 'talk' : petMood} moodKey={petMoodKey} moveMs={1000}
                  onTap={tickle} z={10} />
              </div>
              {burstLayer}
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={phase === 'watch' ? 'thinking' : noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
          style={{ background: 'linear-gradient(135deg, #0b2440, #14532d)' }}>
          <div className="text-center bounce-in">
            <span className="inline-flex items-center justify-center mb-3 star-burst rounded-full" style={{
              width: 128, height: 128, background: 'radial-gradient(circle, #1C2E6B 0%, #0B1238 70%)',
              border: '4px solid #FDE047', boxShadow: '0 0 28px rgba(253,224,71,0.55)' }}>
              <ShapeGlyph kind={shape.kind} size={92} light />
            </span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={116} expression="celebrating" className="float" />
              <KailiaSprite size={88} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 80)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-emerald-100 font-semibold mb-1">
              {shape.name} shines again! {mode === 'memory' ? 'Traced from memory, incredible!' : 'What a steady, glowing trail!'}
            </p>
            <p className="text-emerald-100 font-semibold mb-2">{pet.name} is doing a happy dance!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{stars} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { const nl = level + 1; setLevel(nl); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                <span className="whitespace-nowrap">Back to the map</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── A sky picture in miniature ──
// The trail's own shape drawn as a little glowing constellation: used on
// the start button, above the scene and on the finale (instead of emoji).
function ShapeGlyph({ kind, size, light }: { kind: ShapeKind; size: number; light?: boolean }) {
  const pts = shapePoints(kind, 40);
  const d = toPath(pts, 40);
  return (
    <svg viewBox="-4 -4 48 48" width={size} height={size} aria-hidden="true" style={{ flexShrink: 0, overflow: 'visible' }}>
      <g filter="url(#kp-brush)">
        <path d={d} fill="none" stroke={light ? 'rgba(253,224,71,0.35)' : '#3b2416'} strokeWidth={light ? 7 : 6.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={light ? '#FDE047' : '#FFF3A0'} strokeWidth={light ? 3 : 3.2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.filter((_, i) => i % 6 === 0).map((p, i) => (
          <circle key={i} cx={p.x * 40} cy={p.y * 40} r={light ? 2.2 : 2} fill="#FFFBE0" />
        ))}
      </g>
    </svg>
  );
}

// a drawn eye for the Peek button (instead of the 👀 emoji)
function EyeIcon() {
  return (
    <svg viewBox="0 0 28 18" width={24} height={16} aria-hidden="true">
      <path d="M2 9 Q14 -2 26 9 Q14 20 2 9z" fill="#FFFFFF" stroke="#3b2416" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="14" cy="9" r="4.4" fill="#2563EB" stroke="#3b2416" strokeWidth="1.4" />
      <circle cx="14" cy="9" r="2" fill="#0b2440" />
      <circle cx="15.4" cy="7.6" r="1" fill="#FFFFFF" />
    </svg>
  );
}
