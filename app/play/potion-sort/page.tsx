'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { soundEnabled } from '@/lib/accessibility';

// ─── Potion Sort ────────────────────────────────────────────────────────────
// A fast-paced drag-to-sort game: colored potion bottles drift down from
// the top of the owl's shelf, and the child drags each one into the
// matching cauldron before it reaches the floor. A genuinely new
// interaction (drag-under-time-pressure) rather than a reskinned engine —
// this fills in the "quickly sort falling potion bottles" quest Owl's
// Tower was always meant to have. Combo streaks + escalating speed are
// the "just one more try" hook; a miss or wrong bin is always gentle.

interface Bottle { id: number; color: string; x: number; y: number; dragging: boolean; }

const COLORS = [
  { key: 'red',    hex: '#EF4444', dark: '#B91C1C', emoji: '🔴' },
  { key: 'blue',   hex: '#3B82F6', dark: '#1D4ED8', emoji: '🔵' },
  { key: 'green',  hex: '#22C55E', dark: '#15803D', emoji: '🟢' },
  { key: 'purple', hex: '#A855F7', dark: '#7E22CE', emoji: '🟣' },
];

interface RoundCfg { colorCount: number; fallMs: number; spawnMs: number; bottles: number; noel: string; }

const ROUNDS: RoundCfg[] = [
  { colorCount: 2, fallMs: 5200, spawnMs: 1500, bottles: 6,  noel: 'Drag each potion into the cauldron with the SAME color!' },
  { colorCount: 3, fallMs: 4400, spawnMs: 1250, bottles: 8,  noel: 'A third color joined the shelf — keep those cauldrons matching!' },
  { colorCount: 3, fallMs: 3600, spawnMs: 1050, bottles: 9,  noel: 'Faster potions! Quick hands, matching colors!' },
  { colorCount: 4, fallMs: 3200, spawnMs: 950,  bottles: 10, noel: 'All four colors now — the owl believes in you!' },
];

const COMBO_LINES = ['Nice!', 'Great!', 'Fantastic!', 'Amazing!', "You're ON FIRE! 🔥"];

// Fixed (not random-per-render) so the twinkle field never reshuffles
// mid-game and never causes a hydration mismatch.
const STARS = [
  { x: 6, y: 14, s: 12 }, { x: 22, y: 28, s: 9 }, { x: 88, y: 22, s: 11 },
  { x: 70, y: 40, s: 8 }, { x: 15, y: 55, s: 10 }, { x: 92, y: 60, s: 9 },
  { x: 40, y: 18, s: 8 }, { x: 60, y: 12, s: 10 }, { x: 30, y: 70, s: 9 },
  { x: 80, y: 78, s: 11 },
];

const RISE_BUBBLES = [
  { x: 12, s: 8,  c: '#C4B5FD', dur: 6,   delay: 0 },
  { x: 28, s: 6,  c: '#93C5FD', dur: 7.5, delay: 1.2 },
  { x: 46, s: 9,  c: '#F9A8D4', dur: 5.5, delay: 2.4 },
  { x: 62, s: 7,  c: '#FDE68A', dur: 8,   delay: 0.6 },
  { x: 78, s: 8,  c: '#86EFAC', dur: 6.5, delay: 3.1 },
  { x: 90, s: 6,  c: '#C4B5FD', dur: 7,   delay: 1.8 },
];

const TIER_TUNING: Record<DifficultyTier, { fall: number; spawn: number }> = {
  tiny:  { fall: 1.65, spawn: 1.55 },
  small: { fall: 1.25, spawn: 1.2 },
  big:   { fall: 1, spawn: 1 },
};

function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.12, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound is a bonus */ }
}
const sfx = {
  correct: () => playNotes([{ f: 784, t: 0, d: 0.1 }, { f: 1047, t: 0.07, d: 0.16 }]),
  wrong:   () => playNotes([{ f: 330, t: 0, d: 0.14 }]),
  round:   () => playNotes([{ f: 659, t: 0, d: 0.12 }, { f: 880, t: 0.1, d: 0.2 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function PotionSortPage() {
  const { state, totalScore } = useAssessment();
  const tuning = TIER_TUNING[difficultyTier(state.ageGroup, totalScore)];
  const [phase, setPhase] = useState<'intro' | 'playing' | 'roundDone' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  useEffect(() => { setLevel(nextGameLevel('potion-sort')); }, []);

  const [roundIdx, setRoundIdx] = useState(0);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [sorted, setSorted] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboLine, setComboLine] = useState('');
  const [noelLine, setNoelLine] = useState(ROUNDS[0].noel);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [flashZone, setFlashZone] = useState<string | null>(null);

  const areaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 360, h: 480 });
  const idRef = useRef(0);
  const spawnedRef = useRef(0);
  const roundMissesRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragRef = useRef<{ id: number; startedAt: number } | null>(null);
  const metricsRef = useRef({ correct: 0, wrong: 0, missed: 0, sortMs: [] as number[], bestCombo: 0, startedAt: 0 });

  const activeColors = () => COLORS.slice(0, ROUNDS[roundIdx].colorCount);

  const startRound = useCallback((idx: number) => {
    roundMissesRef.current = 0;
    spawnedRef.current = 0;
    setBottles([]);
    setRoundIdx(idx);
    setNoelLine(ROUNDS[idx].noel);
    setNoelMood('excited');
    setPhase('playing');
  }, []);

  function startGame() {
    metricsRef.current = { correct: 0, wrong: 0, missed: 0, sortMs: [], bestCombo: 0, startedAt: Date.now() };
    setSorted(0);
    setCombo(0);
    sfx.round();
    startRound(0);
  }

  // ── Spawn bottles on a timer, capped at this round's total ──
  useEffect(() => {
    if (phase !== 'playing') return;
    // Measure here (not in startRound) — the play area's DOM node only
    // exists once this effect runs post-commit, not synchronously from
    // the button's onClick handler.
    const area = areaRef.current;
    if (area) sizeRef.current = { w: area.getBoundingClientRect().width, h: area.getBoundingClientRect().height };
    const cfg = ROUNDS[roundIdx];
    const spawnMs = cfg.spawnMs * tuning.spawn;
    spawnTimerRef.current = setInterval(() => {
      if (spawnedRef.current >= cfg.bottles) { if (spawnTimerRef.current) clearInterval(spawnTimerRef.current); return; }
      spawnedRef.current += 1;
      const colors = activeColors();
      const color = colors[Math.floor(Math.random() * colors.length)].key;
      const { w, h } = sizeRef.current;
      const x = 40 + Math.random() * (w - 80);
      idRef.current += 1;
      // Spawn just below the shelf (not at y:0) so the bottle's own height
      // never clips against the container's overflow:hidden top edge.
      const bottle: Bottle = { id: idRef.current, color, x, y: 48, dragging: false };
      setBottles(prev => [...prev, bottle]);
      // schedule its fall-to-floor (miss) unless caught first
      const bottleId = bottle.id;
      const startedAt = Date.now();
      const fallMs = cfg.fallMs * tuning.fall;
      // One frame after mount, move the target to the floor — the CSS
      // `transition: top` on the bottle animates this into the actual
      // falling motion (without this second step it never moves at all).
      requestAnimationFrame(() => {
        setBottles(prev => prev.map(b => (b.id === bottleId && !b.dragging) ? { ...b, y: h - 55 } : b));
      });
      setTimeout(() => {
        setBottles(prev => {
          const still = prev.find(b => b.id === bottleId);
          if (!still || still.dragging) return prev;
          // missed — gentle, resets combo, no punishment language
          metricsRef.current.missed += 1;
          roundMissesRef.current += 1;
          setCombo(0);
          return prev.filter(b => b.id !== bottleId);
        });
      }, fallMs);
      void startedAt;
    }, spawnMs);
    return () => { if (spawnTimerRef.current) clearInterval(spawnTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIdx]);

  // ── Round completion: every spawned bottle has left the board ──
  useEffect(() => {
    if (phase !== 'playing') return;
    if (spawnedRef.current >= ROUNDS[roundIdx].bottles && bottles.length === 0) {
      setPhase('roundDone');
      setNoelMood('celebrating');
    }
  }, [bottles, phase, roundIdx]);

  useEffect(() => {
    if (phase !== 'roundDone') return;
    if (roundIdx + 1 < ROUNDS.length) {
      sfx.round();
      const t = setTimeout(() => startRound(roundIdx + 1), 1600);
      return () => clearTimeout(t);
    }
    sfx.fanfare();
    const m = metricsRef.current;
    const totalTries = m.correct + m.wrong;
    logQuestMetric('processing', 'potion-sort', {
      level,
      sortAccuracy: totalTries ? Math.round((m.correct / totalTries) * 100) : 0,
      avgSortMs: m.sortMs.length ? Math.round(m.sortMs.reduce((s, v) => s + v, 0) / m.sortMs.length) : 0,
      missed: m.missed,
      bestCombo: m.bestCombo,
      totalMs: Date.now() - m.startedAt,
    });
    awardStarlight(Math.max(12, 16 + level * 3 - m.missed * 2));
    recordGameLevel('potion-sort', level);
    const t = setTimeout(() => setPhase('done'), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIdx, level]);

  function pointerPos(e: React.PointerEvent) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDragStart(e: React.PointerEvent, id: number) {
    e.preventDefault();
    dragRef.current = { id, startedAt: Date.now() };
    setBottles(prev => prev.map(b => b.id === id ? { ...b, dragging: true } : b));
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const p = pointerPos(e);
    setBottles(prev => prev.map(b => b.id === dragRef.current!.id ? { ...b, x: p.x, y: p.y } : b));
  }

  function onDragEnd(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    const p = pointerPos(e);
    const { w, h } = sizeRef.current;
    const zoneCount = activeColors().length;
    const zoneW = w / zoneCount;
    const inZoneY = p.y > h - 90;
    const zoneIdx = Math.min(zoneCount - 1, Math.max(0, Math.floor(p.x / zoneW)));
    const bottle = bottles.find(b => b.id === drag.id);
    if (!bottle) return;

    if (inZoneY) {
      const targetColor = activeColors()[zoneIdx].key;
      const ok = targetColor === bottle.color;
      setFlashZone(`${zoneIdx}-${ok ? 'ok' : 'no'}`);
      setTimeout(() => setFlashZone(null), 350);
      if (ok) {
        sfx.correct();
        metricsRef.current.correct += 1;
        metricsRef.current.sortMs.push(Date.now() - drag.startedAt);
        setSorted(s => s + 1);
        setCombo(c => {
          const next = c + 1;
          metricsRef.current.bestCombo = Math.max(metricsRef.current.bestCombo, next);
          if (next >= 2) setComboLine(COMBO_LINES[Math.min(COMBO_LINES.length - 1, next - 2)]);
          return next;
        });
        setBottles(prev => prev.filter(b => b.id !== drag.id));
        return;
      }
      sfx.wrong();
      metricsRef.current.wrong += 1;
      setCombo(0);
      setNoelLine("Close! Try matching the COLOR — you've got this!");
      setNoelMood('thinking');
    }
    // released outside any zone, or in the wrong one — snap back to a
    // fresh falling position rather than vanishing, never a dead end
    setBottles(prev => prev.map(b => b.id === drag.id ? { ...b, dragging: false } : b));
  }

  const lv = ROUNDS[roundIdx];
  const totalNeeded = ROUNDS.reduce((s, r) => s + r.bottles, 0);

  if (phase === 'intro') return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="flex items-end justify-center gap-2 mb-4">
          <PandaSprite size={120} expression="excited" className="float" />
          <KailiaSprite size={92} expression="excited" className="float" style={{ animationDelay: '0.2s' }} />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2" style={{ textShadow: '0 0 20px #A855F7' }}>🧪 Potion Sort</h1>
        <p className="text-purple-200 text-sm mb-5">
          The owl&apos;s shelf is full of falling potions! Drag each one into the cauldron with the
          matching color before it reaches the floor.
        </p>
        <div className="flex justify-center gap-3 mb-6">
          {COLORS.map(c => (
            <span key={c.key} className="w-9 h-9 rounded-full" style={{ background: c.hex, border: `3px solid ${c.dark}` }} />
          ))}
        </div>
        <button onClick={() => { setPhase('playing'); startGame(); }}
          className="px-10 py-4 rounded-full font-extrabold text-white text-xl transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#A855F7,#7C3AED)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
          Start Sorting! 🧪
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-purple-300 text-sm hover:text-white">← Back to the map</Link>
        </div>
        <SkillIntro gameId="potion-sort" />
      </div>
    </main>
  );

  if (phase === 'done') {
    const pct = sorted / totalNeeded;
    const [title, medal] = pct >= 0.9 ? ['Potion Master!', '🏆'] : pct >= 0.6 ? ['Great Sorting!', '🌟'] : ['Nice Try!', '🧪'];
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-7xl mb-3">{medal}</div>
          <h1 className="text-3xl font-extrabold text-white mb-1">{title}</h1>
          <p className="text-purple-200 text-sm mb-5">{sorted} of {totalNeeded} potions sorted correctly!</p>
          <div className="flex gap-3 justify-center">
            <Link href="/play" className="px-5 py-3 rounded-full font-bold text-purple-300 text-sm"
              style={{ border: '2px solid rgba(168,85,247,0.4)' }}>← All Games</Link>
            <button onClick={() => { setPhase('intro'); }}
              className="px-6 py-3 rounded-full font-extrabold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#A855F7,#7C3AED)' }}>Play Again 🔄</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <Link href="/play" className="font-bold text-sm text-purple-300">← Games</Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full text-purple-100" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Round {roundIdx + 1}/{ROUNDS.length}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3 rounded-2xl px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div className="flex items-center gap-2">
            <PandaSprite size={40} expression={noelMood} />
            <p className="text-xs font-semibold text-purple-100 max-w-[160px]">{noelLine}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-extrabold text-lg leading-none">🧪 {sorted}/{totalNeeded}</p>
            {combo >= 2 && <p className="text-yellow-300 text-xs font-bold mt-0.5 sparkle">{comboLine} x{combo}</p>}
          </div>
        </div>

        <div ref={areaRef} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerLeave={onDragEnd}
          className="relative w-full rounded-3xl overflow-hidden shadow-2xl select-none"
          style={{ height: 420, background: 'radial-gradient(ellipse at 50% 20%, #2e2a6b 0%, #1e1b4b 45%, #0f0a2e 100%)', border: '2px solid rgba(168,85,247,0.3)', touchAction: 'none' }}>

          {/* Background dressing — the owl's starlit shelf, not a flat gradient */}
          <div className="absolute inset-0 pointer-events-none">
            {STARS.map((s, i) => (
              <span key={i} className="absolute sparkle" style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.s, animationDelay: `${i * 0.4}s`, opacity: 0.8 }}>✨</span>
            ))}
            <span className="absolute float" style={{ left: '8%', top: '6%', fontSize: 30, opacity: 0.55 }}>🌙</span>
            <span className="absolute float" style={{ right: '10%', top: '10%', fontSize: 22, opacity: 0.5, animationDelay: '0.6s' }}>⭐</span>
            {/* rising magic motes — continuous movement so the background
                never feels static, even between potion drops */}
            {RISE_BUBBLES.map((r, i) => (
              <span key={i} className="absolute rise-fade" style={{
                left: `${r.x}%`, bottom: '6%', width: r.s, height: r.s, borderRadius: '50%',
                background: r.c, boxShadow: `0 0 8px ${r.c}`,
                animationDuration: `${r.dur}s`, animationDelay: `${r.delay}s`,
              }} />
            ))}
            {/* the shelf the potions tumble off of */}
            <div className="absolute left-0 right-0 top-0" style={{ height: 14, background: 'linear-gradient(180deg,#78350F,#451A03)', borderBottom: '3px solid #1a1108', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }} />
            <span className="absolute" style={{ left: '6%', top: 2, fontSize: 20 }}>🦉</span>
            <span className="absolute" style={{ right: '6%', top: 2, fontSize: 18 }}>📚</span>
          </div>

          {bottles.map(b => {
            const c = COLORS.find(x => x.key === b.color)!;
            return (
              <div key={b.id} onPointerDown={e => onDragStart(e, b.id)}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: b.x, top: b.y, transform: 'translate(-50%, -50%)',
                  transition: b.dragging ? 'none' : `top ${(ROUNDS[roundIdx].fallMs * tuning.fall)}ms linear`,
                  zIndex: b.dragging ? 10 : 1,
                }}>
                <div style={{ width: 72, height: 90, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 26, width: 20, height: 18, background: '#92400E', borderRadius: 4, border: '2.5px solid #1a1108' }} />
                  <div style={{
                    position: 'absolute', top: 15, left: 0, width: 72, height: 74, borderRadius: '20px 20px 32px 32px',
                    background: c.hex, border: `3.5px solid ${c.dark}`, boxShadow: `0 0 22px ${c.hex}dd, 0 0 40px ${c.hex}66`,
                  }}>
                    <div style={{ position: 'absolute', top: 7, left: 9, width: 12, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.45)' }} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cauldrons */}
          <div className="absolute left-0 right-0 bottom-0 flex" style={{ height: 84 }}>
            {activeColors().map((c, i) => (
              <div key={c.key} className="flex-1 flex items-end justify-center pb-2 relative">
                <div className="absolute inset-x-1 top-0 bottom-0 rounded-t-2xl transition-all"
                  style={{
                    background: flashZone === `${i}-ok` ? `${c.hex}55` : flashZone === `${i}-no` ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.04)',
                    border: `2.5px dashed ${c.hex}88`,
                  }} />
                <span className="relative text-3xl" style={{ filter: `drop-shadow(0 0 8px ${c.hex})` }}>🍯</span>
                <span className="absolute bottom-1 w-7 h-7 rounded-full" style={{ background: c.hex, border: `2px solid ${c.dark}`, opacity: 0.9 }} />
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-3 text-purple-300">
          Drag a potion into the cauldron with the matching color!
        </p>
      </div>
    </main>
  );
}
