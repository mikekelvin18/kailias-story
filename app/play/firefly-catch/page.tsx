'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import NightForest from '@/components/games/NightForest';
import GlowBug from '@/components/games/GlowBug';
import KailiaActor from '@/components/games/KailiaActor';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Firefly Catch ────────────────────────────────────────────────────────────
// A real fine-motor exercise: tap drifting fireflies (targeting, speed),
// then drag sleepy ones into the lantern (controlled drag, placement).
// Difficulty ramps gently; a struggling round makes the next one easier.
// All measurement is invisible — the child only sees the story.

interface Firefly { id: number; x: number; y: number; vx: number; vy: number; caught: boolean; }
// a caught firefly on its way into the lantern (start spot, px)
interface Homing { id: number; x: number; y: number; }

interface RoundCfg {
  label: string;
  noel: string;
  count: number;
  r: number;       // firefly radius, px
  speed: number;   // drift speed, px/s
  jitter: number;  // random direction changes (zippy round)
  mode: 'tap' | 'drag';
}

const ROUNDS: RoundCfg[] = [
  { label: 'Sleepy fireflies',  noel: 'Tap the fireflies gently to catch them!',                      count: 5, r: 34, speed: 26, jitter: 0,  mode: 'tap' },
  { label: 'Playful fireflies', noel: 'Ooh, these ones like to wander — follow the glow!',            count: 6, r: 26, speed: 55, jitter: 0,  mode: 'tap' },
  { label: 'Zippy fireflies',   noel: 'Whoa, speedy ones! Watch closely and tap right on them!',      count: 6, r: 20, speed: 92, jitter: 70, mode: 'tap' },
  { label: 'Carry them home',   noel: 'These sleepy ones need a ride. Drag each one into the lantern!', count: 4, r: 30, speed: 0, jitter: 0, mode: 'drag' },
];

const PRAISE = [
  'Amazing catching!', 'The forest is getting brighter!', 'Wow, quick fingers!',
  'Kailia is cheering for you!', 'Beautiful! The fireflies like you!',
];

const clampPct = (v: number) => Math.max(10, Math.min(90, v));

const LANTERN_ZONE = 84; // drop radius around the lantern, px

// developmental scaling: littler kids get bigger, slower fireflies
const TIER_TUNING: Record<DifficultyTier, { r: number; speed: number; zone: number }> = {
  tiny:  { r: 1.5,  speed: 0.5,  zone: 120 },
  small: { r: 1.15, speed: 0.85, zone: 96 },
  big:   { r: 1,    speed: 1,    zone: LANTERN_ZONE },
};

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound is a bonus */ }
}

const sfx = {
  catch:   () => playNotes([{ f: 880, t: 0, d: 0.12 }, { f: 1175, t: 0.06, d: 0.18 }]),
  home:    () => playNotes([{ f: 523, t: 0, d: 0.1 }, { f: 784, t: 0.08, d: 0.22 }]),
  round:   () => playNotes([{ f: 659, t: 0, d: 0.12 }, { f: 784, t: 0.1, d: 0.12 }, { f: 988, t: 0.2, d: 0.25 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function FireflyCatchPage() {
  const { state, totalScore } = useAssessment();
  const tuning = TIER_TUNING[difficultyTier(state.ageGroup, totalScore)];
  const [phase, setPhase] = useState<'intro' | 'playing' | 'roundDone' | 'done'>('intro');
  // video-game levels: each one a touch faster and trickier; the game
  // remembers the highest level beaten and offers the next one
  const [level, setLevel] = useState(1);
  useEffect(() => { setLevel(nextGameLevel('firefly-catch')); }, []);
  const [roundIdx, setRoundIdx] = useState(0);
  const [cfg, setCfg] = useState<RoundCfg>(ROUNDS[0]);
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [homing, setHoming] = useState<Homing[]>([]);
  const [gulp, setGulp] = useState(0);
  // Kailia and the friend live in the glade (x, y = % of the scene, at the feet)
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [petPos, setPetPos] = useState({ x: 72, y: 93 });
  const [kailiaPos, setKailiaPos] = useState({ x: 30, y: 94 });
  const [kailiaHop, setKailiaHop] = useState(0);
  const [hintId, setHintId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const { layer: burstLayer, fire } = useBursts();
  const [totalCaught, setTotalCaught] = useState(0);
  const [noelLine, setNoelLine] = useState(ROUNDS[0].noel);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [praise, setPraise] = useState(PRAISE[0]);

  const areaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 360, h: 480 });
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastCatchRef = useRef(0);
  const consecMissRef = useRef(0);
  const roundMissesRef = useRef(0);
  const burstIdRef = useRef(0);
  const dragRef = useRef<{ id: number; path: number; lx: number; ly: number; sx: number; sy: number } | null>(null);
  const metricsRef = useRef({
    tapOffsets: [] as number[], catchMs: [] as number[], misses: 0,
    dragRatios: [] as number[], dropOffsets: [] as number[], startedAt: 0,
  });

  const totalNeeded = ROUNDS.reduce((s, r) => s + r.count, 0);

  const lanternPos = useCallback(() => {
    const { w, h } = sizeRef.current;
    return { x: w / 2, y: h - 64 };
  }, []);

  // ── Round setup ──
  const startRound = useCallback((idx: number) => {
    const area = areaRef.current;
    if (area) {
      const rect = area.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
    }
    const { w, h } = sizeRef.current;

    // developmental tier sets the baseline; a tough previous round
    // makes this one gentler still
    const struggled = roundMissesRef.current > 4;
    const base = ROUNDS[idx];
    // level curve: +12% speed and slightly smaller fireflies per level,
    // capped so it stays fun rather than frantic
    const lvlSpeed = 1 + Math.min(2.2, (level - 1) * 0.12);
    const lvlSize = Math.max(0.72, 1 - (level - 1) * 0.035);
    const round: RoundCfg = {
      ...base,
      r: Math.round(base.r * tuning.r * lvlSize * (struggled ? 1.3 : 1)),
      speed: base.speed * tuning.speed * lvlSpeed * (struggled ? 0.75 : 1),
    };

    roundMissesRef.current = 0;
    consecMissRef.current = 0;
    lastCatchRef.current = performance.now();

    const flies: Firefly[] = Array.from({ length: round.count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        id: idx * 100 + i,
        x: round.r + 12 + Math.random() * (w - 2 * (round.r + 12)),
        y: round.r + 12 + Math.random() * (h - 170 - round.r),
        vx: Math.cos(angle) * round.speed,
        vy: Math.sin(angle) * round.speed,
        caught: false,
      };
    });

    setCfg(round);
    setHintId(null);
    setHoming([]);
    setKailiaPos({ x: 30, y: 94 });
    setPetPos({ x: 72, y: 93 });
    setRoundIdx(idx);
    setFireflies(flies);
    setNoelLine(round.noel);
    setNoelMood('excited');
    setPhase('playing');
  }, [tuning, level]);

  function startGame() {
    metricsRef.current = { tapOffsets: [], catchMs: [], misses: 0, dragRatios: [], dropOffsets: [], startedAt: Date.now() };
    setTotalCaught(0);
    sfx.round();
    startRound(0);
  }

  // ── Drift physics ──
  useEffect(() => {
    if (phase !== 'playing' || cfg.mode !== 'tap' || cfg.speed === 0) return;
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      const { w, h } = sizeRef.current;
      setFireflies(prev => prev.map(f => {
        if (f.caught) return f;
        let { vx, vy } = f;
        if (cfg.jitter && Math.random() < 0.02) {
          vx += (Math.random() - 0.5) * cfg.jitter;
          vy += (Math.random() - 0.5) * cfg.jitter;
          const sp = Math.hypot(vx, vy) || 1;
          vx = (vx / sp) * cfg.speed;
          vy = (vy / sp) * cfg.speed;
        }
        let x = f.x + vx * dt;
        let y = f.y + vy * dt;
        if (x < cfg.r) { x = cfg.r; vx = Math.abs(vx); }
        if (x > w - cfg.r) { x = w - cfg.r; vx = -Math.abs(vx); }
        if (y < cfg.r) { y = cfg.r; vy = Math.abs(vy); }
        if (y > h - 150) { y = h - 150; vy = -Math.abs(vy); }
        return { ...f, x, y, vx, vy };
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, cfg]);

  // ── Round completion detection ──
  useEffect(() => {
    if (phase !== 'playing' || fireflies.length === 0) return;
    if (fireflies.every(f => f.caught)) {
      setPhase('roundDone');
      setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
      setNoelMood('celebrating');
    }
  }, [fireflies, phase]);

  // ── Advance to the next round (or finish) ──
  // Kept separate from detection so the timer survives the phase change.
  useEffect(() => {
    if (phase !== 'roundDone') return;
    if (roundIdx + 1 < ROUNDS.length) {
      sfx.round();
      const t = setTimeout(() => startRound(roundIdx + 1), 1700);
      return () => clearTimeout(t);
    }
    // game finished — log the quiet metrics
    sfx.fanfare();
    const m = metricsRef.current;
    const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
    logQuestMetric('fine motor', 'firefly-catch', {
      level,
      tapAccuracy: Math.round((1 - avg(m.tapOffsets)) * 100),
      avgCatchMs: Math.round(avg(m.catchMs)),
      misses: m.misses,
      dragEfficiency: Math.round(avg(m.dragRatios) * 100),
      dropAccuracy: Math.round((1 - avg(m.dropOffsets)) * 100),
      totalMs: Date.now() - m.startedAt,
    });
    // ✨ higher levels shine brighter
    awardStarlight(15 + level * 5);
    recordGameLevel('firefly-catch', level);
    const t = setTimeout(() => setPhase('done'), 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx, startRound, level]);

  // ── The friend plays along ──
  // While fireflies drift, the friend scampers along the ground after
  // them (it wants to catch one too). Fireflies are tracked in a ref so
  // this timer doesn't restart every animation frame.
  const fliesRef = useRef<Firefly[]>([]);
  useEffect(() => { fliesRef.current = fireflies; }, [fireflies]);
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const { w } = sizeRef.current;
      const free = fliesRef.current.filter(f => !f.caught);
      if (!free.length || dragRef.current) return;
      const f = free[Math.floor(Math.random() * free.length)];
      setPetPos({ x: clampPct((f.x / w) * 100 + 8), y: 93 });
    }, 2600);
    return () => clearInterval(id);
  }, [phase]);

  // a catch: Kailia dashes under it and jumps, the friend cheers, the
  // firefly zooms into the lantern and sparkles pop
  function cheer(x: number, y: number) {
    const { w, h } = sizeRef.current;
    setKailiaPos({ x: clampPct((x / w) * 100), y: 94 });
    setKailiaHop(n => n + 1);
    setPetMood('cheer');
    setHintId(null);
    fire((x / w) * 100, (y / h) * 100);
    const id = ++burstIdRef.current;
    setHoming(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHoming(prev => prev.filter(b => b.id !== id));
      setGulp(n => n + 1);
      const l = lanternPos();
      fire((l.x / w) * 100, ((l.y - 30) / h) * 100, ['#FFE066', '#FFF7B0', '#FFFFFF'], 8, 44);
    }, 700);
  }

  // after a few misses the friend flies up to a firefly to point it out
  function friendHint(x: number, y: number) {
    const { w, h } = sizeRef.current;
    let best: Firefly | null = null;
    for (const f of fireflies) {
      if (f.caught) continue;
      if (!best || Math.hypot(f.x - x, f.y - y) < Math.hypot(best.x - x, best.y - y)) best = f;
    }
    if (!best) return;
    setHintId(best.id);
    setPetMood('fly');
    setPetPos({ x: clampPct((best.x / w) * 100 + 10), y: Math.min(90, (best.y / h) * 100 + 14) });
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
  }

  function pointerPos(e: React.PointerEvent): { x: number; y: number } {
    const rect = areaRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── Tap & drag handling ──
  function onPointerDown(e: React.PointerEvent) {
    if (phase !== 'playing') return;
    // tickling the friend is play, not a missed catch
    if ((e.target as HTMLElement).closest?.('[data-pet]')) return;
    const { x, y } = pointerPos(e);

    if (cfg.mode === 'drag') {
      const target = fireflies.find(f => !f.caught && Math.hypot(f.x - x, f.y - y) <= cfg.r + 18);
      if (target) {
        dragRef.current = { id: target.id, path: 0, lx: x, ly: y, sx: target.x, sy: target.y };
        setDraggingId(target.id);
        chime.tap();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* keep dragging even if capture fails */ }
      }
      return;
    }

    // tap mode: forgiving halo around each firefly
    let best: Firefly | null = null;
    let bestDist = Infinity;
    for (const f of fireflies) {
      if (f.caught) continue;
      const d = Math.hypot(f.x - x, f.y - y);
      if (d <= cfg.r + 14 && d < bestDist) { best = f; bestDist = d; }
    }
    if (best) {
      const now = performance.now();
      metricsRef.current.tapOffsets.push(Math.min(1, bestDist / cfg.r));
      metricsRef.current.catchMs.push(now - lastCatchRef.current);
      lastCatchRef.current = now;
      consecMissRef.current = 0;
      const caught = best;
      setFireflies(prev => prev.map(f => (f.id === caught.id ? { ...f, caught: true } : f)));
      setTotalCaught(n => n + 1);
      sfx.catch();
      cheer(caught.x, caught.y);
    } else {
      metricsRef.current.misses += 1;
      roundMissesRef.current += 1;
      consecMissRef.current += 1;
      if (consecMissRef.current === 2) {
        setPetMood('oops');
        friendHint(x, y);
      }
      if (consecMissRef.current >= 3) {
        setNoelLine("Try a soft tap right on the glow — we'll catch it together!");
        setNoelMood('thinking');
        consecMissRef.current = 0;
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || phase !== 'playing') return;
    const { x, y } = pointerPos(e);
    drag.path += Math.hypot(x - drag.lx, y - drag.ly);
    drag.lx = x; drag.ly = y;
    const { w, h } = sizeRef.current;
    const cx = Math.max(cfg.r, Math.min(w - cfg.r, x));
    const cy = Math.max(cfg.r, Math.min(h - cfg.r, y));
    setFireflies(prev => prev.map(f => (f.id === drag.id ? { ...f, x: cx, y: cy } : f)));
    // the friend trots along underneath the sleepy firefly
    setPetPos({ x: clampPct((cx / w) * 100 + 9), y: 93 });
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag || phase !== 'playing') return;
    dragRef.current = null;
    setDraggingId(null);
    const fly = fireflies.find(f => f.id === drag.id);
    if (!fly) return;
    const { x: lx, y: ly } = lanternPos();
    const dropDist = Math.hypot(fly.x - lx, fly.y - ly);
    if (dropDist <= tuning.zone) {
      const straight = Math.hypot(lx - drag.sx, ly - drag.sy) || 1;
      metricsRef.current.dragRatios.push(Math.min(1, straight / Math.max(straight, drag.path)));
      metricsRef.current.dropOffsets.push(Math.min(1, dropDist / tuning.zone));
      setFireflies(prev => prev.map(f => (f.id === drag.id ? { ...f, caught: true } : f)));
      setTotalCaught(n => n + 1);
      sfx.home();
      cheer(fly.x, fly.y);
    } else {
      setNoelLine('Almost! Carry it all the way to the lantern!');
      setNoelMood('thinking');
      setPetMood('oops');
    }
  }

  const glow = totalCaught / totalNeeded; // 0 → 1 as the lantern fills
  const { x: lanternX, y: lanternY } = lanternPos();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #04100a 0%, #07271a 55%, #0a3323 100%)' }}>
      <div className="max-w-md mx-auto px-3">

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-emerald-300">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Firefly Catch <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-16">
            {Array.from({ length: ROUNDS.length }).map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#FDE047', boxShadow: '0 0 8px #FDE047', opacity: i <= roundIdx && phase !== 'intro' ? 1 : 0.25 }} />
            ))}
          </span>
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-8 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={128} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={96} expression="thinking" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 70)} kind="pet" />
              <Lantern glow={0} size={58} />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                Oh no — <strong>Kailia&apos;s lantern went dark</strong> on the forest trail!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                Noel says the <strong>fireflies</strong> can light it again. Catch them with your finger, gently!
              </p>
            </div>
            <LevelPath gameId="firefly-catch" level={level} onPick={setLevel} />
            <button onClick={startGame}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Catch fireflies!
            </button>
            <SkillIntro gameId="firefly-catch" />
          </div>
        )}

        {/* ── Game area ── */}
        {phase !== 'intro' && (
          <>
            <div className="text-center mb-2">
              <span className="px-4 py-1 rounded-full text-xs font-extrabold text-emerald-200"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(110,231,183,0.3)' }}>
                {cfg.label}
              </span>
            </div>

            <div ref={areaRef}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              className="relative w-full rounded-[28px] overflow-hidden select-none"
              style={{ aspectRatio: '3 / 4', touchAction: 'none', cursor: 'pointer',
                boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>

              <NightForest glow={glow} />

              {/* the lantern: fills with light as fireflies arrive */}
              <div className="absolute" style={{ left: lanternX, top: lanternY, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 4 }}>
                {cfg.mode === 'drag' && phase === 'playing' && (
                  <span className="absolute rounded-full pulse" style={{
                    left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: tuning.zone * 2, height: tuning.zone * 2,
                    border: '3px dashed rgba(253,224,71,0.6)' }} />
                )}
                <Lantern glow={glow} size={64} gulp={gulp} />
              </div>

              {/* Kailia and the friend, in the glade */}
              <KailiaActor x={kailiaPos.x} y={kailiaPos.y} h={84} hop={kailiaHop} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petPos.x} y={petPos.y} h={62}
                  mood={petMood} moodKey={petMoodKey} moveMs={petMood === 'fly' ? 700 : 1100}
                  onTap={tickle} z={7} />
              </div>

              {/* fireflies */}
              {fireflies.filter(f => !f.caught).map((f, i) => {
                // drawn a little smaller than the (forgiving) tap area, and never giant
                const size = Math.min(64, cfg.r * 1.7);
                const dragging = draggingId === f.id;
                return (
                  <div key={f.id} data-firefly className="absolute" style={{ left: f.x - size / 2, top: f.y - size / 2, width: size, height: size, pointerEvents: 'none', zIndex: 10 }}>
                    {hintId === f.id && (
                      <span className="absolute inset-[-10%] rounded-full hint-glow" style={{ border: '3px solid rgba(255,255,255,0.85)' }} />
                    )}
                    <GlowBug size={size} seed={f.id % 17 + i}
                      angle={cfg.mode === 'drag' ? 0 : Math.atan2(f.vy, f.vx) * 180 / Math.PI}
                      sleepy={cfg.mode === 'drag' && !dragging} lit={dragging ? 1 : 0} />
                  </div>
                );
              })}

              {/* caught fireflies zooming home into the lantern */}
              {homing.map(b => (
                <div key={b.id} className="absolute ff-home" style={{
                  left: lanternX - 18, top: lanternY - 36, width: 36, height: 36, pointerEvents: 'none', zIndex: 11,
                  ['--fx' as string]: `${b.x - lanternX}px`, ['--fy' as string]: `${b.y - lanternY + 18}px`,
                } as React.CSSProperties}>
                  <GlowBug size={36} seed={b.id} lit={1} />
                </div>
              ))}

              {burstLayer}

              {/* round interstitial */}
              {phase === 'roundDone' && roundIdx + 1 < ROUNDS.length && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(8,12,40,0.35)', zIndex: 40 }}>
                  <div className="text-center bounce-in">
                    <PandaSprite size={90} expression="celebrating" />
                    <p className="text-xl font-extrabold text-white drop-shadow mt-1">{praise}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Noel's guide bar */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Finale ── */}
      {phase === 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #065f46ee, #0f766eee)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-3 star-burst"><Lantern glow={1} size={96} /></span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-emerald-100 font-semibold mb-2">Every firefly made it home. {pet.name} is doing a happy dance!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{15 + level * 5} starlight collected!</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                Back to the map
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Kailia's lantern ──
// A drawn paper-and-brass lantern that swings a little on its handle and
// glows brighter with every firefly; it does a happy gulp when one lands.
function Lantern({ glow, size, gulp = 0 }: { glow: number; size: number; gulp?: number }) {
  const sk = '#3b2416';
  return (
    <div key={gulp} className={gulp ? 'lantern-gulp' : undefined} style={{ width: size, height: size * 1.3 }}>
      <svg viewBox="0 0 60 78" width={size} height={size * 1.3} className="lantern-swing" aria-hidden="true" style={{ overflow: 'visible' }}>
        <circle cx="30" cy="46" r={18 + glow * 26} fill="#FDE047" opacity={0.08 + glow * 0.35} style={{ transition: 'all 0.6s' }} />
        <g filter="url(#kp-brush)">
          <path d="M18 14 Q30 -2 42 14" stroke={sk} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="14" y="13" width="32" height="8" rx="3" fill="#C9822F" stroke={sk} strokeWidth="2.4" />
          <path d="M16 21 H44 L47 60 H13z" fill={`rgb(${120 + glow * 135}, ${90 + glow * 140}, ${60 + glow * 40})`} stroke={sk} strokeWidth="2.6" strokeLinejoin="round" style={{ transition: 'fill 0.6s' }} />
          <path d="M23 22 L21 59 M37 22 L39 59" stroke={sk} strokeWidth="1.6" opacity="0.6" />
          <ellipse cx="30" cy={50 - glow * 6} rx={3 + glow * 4} ry={5 + glow * 7} fill="#FFFBE0" opacity={0.25 + glow * 0.75} className="gb-pulse" style={{ transition: 'all 0.6s' }} />
          <rect x="11" y="59" width="38" height="8" rx="3" fill="#C9822F" stroke={sk} strokeWidth="2.4" />
          <path d="M22 26 Q19 40 21 54" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
