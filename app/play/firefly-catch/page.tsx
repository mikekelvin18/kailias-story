'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { logQuestMetric } from '@/lib/metrics';

// ─── Firefly Catch ────────────────────────────────────────────────────────────
// A real fine-motor exercise: tap drifting fireflies (targeting, speed),
// then drag sleepy ones into the lantern (controlled drag, placement).
// Difficulty ramps gently; a struggling round makes the next one easier.
// All measurement is invisible — the child only sees the story.

interface Firefly { id: number; x: number; y: number; vx: number; vy: number; caught: boolean; }
interface Burst { id: number; x: number; y: number; }

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
  'Amazing catching! ✨', 'The forest is getting brighter!', 'Wow, quick fingers!',
  'Kailia is cheering for you!', 'Beautiful! The fireflies like you!',
];

const LANTERN_ZONE = 84; // drop radius around the lantern, px

function playNotes(notes: { f: number; t: number; d: number }[]) {
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
  const [phase, setPhase] = useState<'intro' | 'playing' | 'roundDone' | 'done'>('intro');
  const [roundIdx, setRoundIdx] = useState(0);
  const [cfg, setCfg] = useState<RoundCfg>(ROUNDS[0]);
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [totalCaught, setTotalCaught] = useState(0);
  const [noelLine, setNoelLine] = useState(ROUNDS[0].noel);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [kailiaMood, setKailiaMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');
  const [praise, setPraise] = useState(PRAISE[0]);

  const areaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 360, h: 480 });
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastCatchRef = useRef(0);
  const consecMissRef = useRef(0);
  const roundMissesRef = useRef(0);
  const burstIdRef = useRef(0);
  const kailiaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    // gentle adaptivity: a tough previous round makes this one bigger & slower
    const struggled = roundMissesRef.current > 4;
    const base = ROUNDS[idx];
    const round: RoundCfg = struggled
      ? { ...base, r: Math.round(base.r * 1.3), speed: base.speed * 0.75 }
      : base;

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
    setRoundIdx(idx);
    setFireflies(flies);
    setNoelLine(round.noel);
    setNoelMood('excited');
    setPhase('playing');
  }, []);

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
      tapAccuracy: Math.round((1 - avg(m.tapOffsets)) * 100),
      avgCatchMs: Math.round(avg(m.catchMs)),
      misses: m.misses,
      dragEfficiency: Math.round(avg(m.dragRatios) * 100),
      dropAccuracy: Math.round((1 - avg(m.dropOffsets)) * 100),
      totalMs: Date.now() - m.startedAt,
    });
    const t = setTimeout(() => setPhase('done'), 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx, startRound]);

  useEffect(() => () => { if (kailiaTimerRef.current) clearTimeout(kailiaTimerRef.current); }, []);

  function cheer() {
    setKailiaMood('excited');
    if (kailiaTimerRef.current) clearTimeout(kailiaTimerRef.current);
    kailiaTimerRef.current = setTimeout(() => setKailiaMood('happy'), 900);
  }

  function addBurst(x: number, y: number) {
    const id = ++burstIdRef.current;
    setBursts(prev => [...prev, { id, x, y }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 450);
  }

  function pointerPos(e: React.PointerEvent): { x: number; y: number } {
    const rect = areaRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── Tap & drag handling ──
  function onPointerDown(e: React.PointerEvent) {
    if (phase !== 'playing') return;
    const { x, y } = pointerPos(e);

    if (cfg.mode === 'drag') {
      const target = fireflies.find(f => !f.caught && Math.hypot(f.x - x, f.y - y) <= cfg.r + 18);
      if (target) {
        dragRef.current = { id: target.id, path: 0, lx: x, ly: y, sx: target.x, sy: target.y };
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
      addBurst(caught.x, caught.y);
      sfx.catch();
      cheer();
    } else {
      metricsRef.current.misses += 1;
      roundMissesRef.current += 1;
      consecMissRef.current += 1;
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
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag || phase !== 'playing') return;
    dragRef.current = null;
    const fly = fireflies.find(f => f.id === drag.id);
    if (!fly) return;
    const { x: lx, y: ly } = lanternPos();
    const dropDist = Math.hypot(fly.x - lx, fly.y - ly);
    if (dropDist <= LANTERN_ZONE) {
      const straight = Math.hypot(lx - drag.sx, ly - drag.sy) || 1;
      metricsRef.current.dragRatios.push(Math.min(1, straight / Math.max(straight, drag.path)));
      metricsRef.current.dropOffsets.push(Math.min(1, dropDist / LANTERN_ZONE));
      setFireflies(prev => prev.map(f => (f.id === drag.id ? { ...f, caught: true } : f)));
      setTotalCaught(n => n + 1);
      addBurst(lx, ly - 40);
      sfx.home();
      cheer();
    } else {
      setNoelLine('Almost! Carry it all the way to the lantern!');
      setNoelMood('thinking');
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
          <h1 className="text-xl font-extrabold text-white drop-shadow">🏮 Firefly Catch</h1>
          <span className="text-sm w-12 text-right">
            {Array.from({ length: ROUNDS.length }).map((_, i) => (
              <span key={i} style={{ opacity: i <= roundIdx && phase !== 'intro' ? 1 : 0.25 }}>✨</span>
            ))}
          </span>
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-8 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={90} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={110} expression="thinking" className="float" />
              <span className="text-5xl mb-6" style={{ filter: 'grayscale(0.8) brightness(0.6)' }}>🏮</span>
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                Oh no — <strong>Kailia&apos;s lantern went dark</strong> on the forest trail! 🌲
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Noel says the <strong>fireflies</strong> can light it again. Catch them with your finger — gently! ✨
              </p>
            </div>
            <button onClick={startGame}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Catch fireflies! 🏮
            </button>
          </div>
        )}

        {/* ── Game area ── */}
        {phase !== 'intro' && (
          <>
            <div className="text-center mb-2">
              <span className="px-4 py-1 rounded-full text-xs font-extrabold text-emerald-200"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(110,231,183,0.3)' }}>
                {cfg.label} {cfg.mode === 'drag' ? '🤲' : '👆'}
              </span>
            </div>

            <div ref={areaRef}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ aspectRatio: '3 / 4', touchAction: 'none', cursor: 'pointer',
                background: 'radial-gradient(ellipse at 50% 110%, #14532daa 0%, transparent 60%), linear-gradient(180deg, #052012, #071f15)',
                border: '3px solid rgba(110,231,183,0.25)' }}>

              {/* forest scenery */}
              {['🌲', '🌲', '🍄', '🌿', '🌲'].map((e, i) => (
                <span key={i} className="absolute" style={{
                  left: `${[4, 78, 30, 60, 45][i]}%`, bottom: `${[2, 4, 1, 2, 0][i]}%`,
                  fontSize: [40, 34, 20, 22, 28][i], opacity: 0.5, pointerEvents: 'none' }}>{e}</span>
              ))}

              {/* the lantern — fills with light as fireflies arrive */}
              <div className="absolute text-center" style={{ left: lanternX, top: lanternY, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                {cfg.mode === 'drag' && phase === 'playing' && (
                  <span className="absolute rounded-full pulse" style={{
                    left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    width: LANTERN_ZONE * 2, height: LANTERN_ZONE * 2,
                    border: '3px dashed rgba(253,224,71,0.6)' }} />
                )}
                <span className="block" style={{ fontSize: 52, filter: `grayscale(${1 - glow}) brightness(${0.55 + glow * 0.7}) drop-shadow(0 0 ${glow * 26}px #FDE047)` }}>
                  🏮
                </span>
              </div>

              {/* Kailia waits by her lantern */}
              <div className="absolute" style={{ left: lanternX - 74, top: lanternY - 34, pointerEvents: 'none' }}>
                <KailiaSprite size={40} expression={kailiaMood} />
              </div>

              {/* fireflies */}
              {fireflies.filter(f => !f.caught).map(f => (
                <span key={f.id} className="absolute sparkle" style={{
                  left: f.x - cfg.r, top: f.y - cfg.r, width: cfg.r * 2, height: cfg.r * 2,
                  borderRadius: '50%', pointerEvents: 'none',
                  background: 'radial-gradient(circle, #FEF9C3 15%, #FDE047 45%, rgba(253,224,71,0.15) 75%, transparent 100%)',
                  boxShadow: `0 0 ${cfg.r * 0.9}px ${cfg.r * 0.45}px rgba(253,224,71,0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: cfg.r * 0.8 }}>
                  ✨
                </span>
              ))}

              {/* catch bursts */}
              {bursts.map(b => (
                <span key={b.id} className="absolute pop" style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)', fontSize: 34, pointerEvents: 'none' }}>
                  🌟
                </span>
              ))}

              {/* round interstitial */}
              {phase === 'roundDone' && roundIdx + 1 < ROUNDS.length && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
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
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
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
            <span className="block text-7xl mb-3 star-burst" style={{ filter: 'drop-shadow(0 0 30px #FDE047)' }}>🏮</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">You lit Kailia&apos;s lantern!</h2>
            <p className="text-emerald-100 font-semibold mb-6">Every firefly made it home. Noel is doing his happy dance! 🎉</p>
            <div className="flex gap-3 justify-center">
              <button onClick={startGame}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Play again!
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
