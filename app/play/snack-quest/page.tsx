'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { logQuestMetric } from '@/lib/metrics';

// ─── Snack Quest ──────────────────────────────────────────────────────────────
// Embodied math: the child walks their character around a little field,
// picks up snacks, and delivers EXACTLY what the baby dragon asks for.
// Counting and addition happen with the hands, not multiple choice.
// Rounds: count small → count bigger → "how many more?" → bigger addition.

const COLS = 7;
const ROWS = 8;

interface Tile { r: number; c: number; }
interface Item extends Tile { id: number; }

interface RoundCfg {
  want: number;   // what the dragon wishes for in total
  have: number;   // what the dragon already has (addition rounds)
  intro: string;
}

// wall layouts per round — hand-placed so every tile stays reachable
const WALLS: Tile[][] = [
  [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 4, c: 4 }, { r: 4, c: 5 }, { r: 5, c: 1 }, { r: 6, c: 4 }, { r: 1, c: 1 }],
  [{ r: 1, c: 4 }, { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 5 }, { r: 5, c: 3 }, { r: 6, c: 1 }, { r: 4, c: 0 }],
  [{ r: 2, c: 1 }, { r: 2, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 6, c: 5 }, { r: 5, c: 5 }, { r: 1, c: 2 }],
  [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 2, c: 6 }, { r: 5, c: 2 }, { r: 6, c: 2 }, { r: 2, c: 0 }, { r: 5, c: 6 }],
];

const START: Tile = { r: 7, c: 0 };
const inDragonZone = (t: Tile) => t.r <= 1 && t.c >= 5;

interface Skin {
  id: 'kailia' | 'noel';
  item: string;
  itemName: string;
  wallEmoji: string;
  bg: string;
  fieldBg: string;
  border: string;
  accent: string;
  guideName: string; // the OTHER character cheers you on
}

const SKINS: Record<'kailia' | 'noel', Skin> = {
  kailia: {
    id: 'kailia', item: '🍪', itemName: 'cookies', wallEmoji: '🪨',
    bg: 'linear-gradient(180deg, #1c1006 0%, #2b1a08 55%, #3a2410 100%)',
    fieldBg: 'radial-gradient(ellipse at 50% 110%, #92400e55 0%, transparent 60%), linear-gradient(180deg, #241505, #2e1d08)',
    border: 'rgba(253,186,116,0.35)', accent: '#FDBA74',
    guideName: 'Noel',
  },
  noel: {
    id: 'noel', item: '🎋', itemName: 'bamboo', wallEmoji: '🌲',
    bg: 'linear-gradient(180deg, #04100a 0%, #07271a 55%, #0a3323 100%)',
    fieldBg: 'radial-gradient(ellipse at 50% 110%, #14532daa 0%, transparent 60%), linear-gradient(180deg, #052012, #071f15)',
    border: 'rgba(110,231,183,0.3)', accent: '#6EE7B7',
    guideName: 'Kailia',
  },
};

const PRAISE = [
  'Exactly right! The dragon is SO happy!', 'Perfect counting! 🎉',
  'Yum yum yum! Just the right amount!', 'The dragon does a happy wiggle!',
];

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
  pickup:  () => playNotes([{ f: 660, t: 0, d: 0.1 }]),
  count:   () => playNotes([{ f: 784, t: 0, d: 0.08 }]),
  yay:     () => playNotes([{ f: 659, t: 0, d: 0.12 }, { f: 784, t: 0.1, d: 0.12 }, { f: 988, t: 0.2, d: 0.25 }]),
  hmm:     () => playNotes([{ f: 294, t: 0, d: 0.15 }, { f: 262, t: 0.14, d: 0.2 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

// breadth-first search on the grid, avoiding walls
function findPath(from: Tile, to: Tile, walls: Tile[]): Tile[] | null {
  const key = (t: Tile) => `${t.r},${t.c}`;
  const blocked = new Set(walls.map(key));
  if (blocked.has(key(to))) return null;
  const prev = new Map<string, string | null>([[key(from), null]]);
  const queue: Tile[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.r === to.r && cur.c === to.c) {
      const path: Tile[] = [];
      let k: string | null = key(cur);
      while (k) {
        const [r, c] = k.split(',').map(Number);
        path.unshift({ r, c });
        k = prev.get(k) ?? null;
      }
      return path.slice(1); // drop the starting tile
    }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = { r: cur.r + dr, c: cur.c + dc };
      const nk = key(n);
      if (n.r < 0 || n.r >= ROWS || n.c < 0 || n.c >= COLS || blocked.has(nk) || prev.has(nk)) continue;
      prev.set(nk, key(cur));
      queue.push(n);
    }
  }
  return null;
}

export default function SnackQuestPage() {
  const { state } = useAssessment();
  const [skin, setSkin] = useState<Skin | null>(null);
  const [phase, setPhase] = useState<'select' | 'playing' | 'checking' | 'roundDone' | 'done'>('select');
  const [roundIdx, setRoundIdx] = useState(0);
  const [rounds, setRounds] = useState<RoundCfg[]>([]);
  const [walls, setWalls] = useState<Tile[]>(WALLS[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [pos, setPos] = useState<Tile>(START);
  const [carried, setCarried] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [showSlots, setShowSlots] = useState(true);
  const [guideLine, setGuideLine] = useState('Who will gather snacks for the baby dragon?');
  const [guideMood, setGuideMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [praise, setPraise] = useState(PRAISE[0]);

  const fieldRef = useRef<HTMLDivElement>(null);
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const posRef = useRef<Tile>(START);
  const carriedRef = useRef(0);
  const itemsRef = useRef<Item[]>([]);
  const attemptsRef = useRef(0);          // wrong deliveries this round
  const roundStartRef = useRef(0);
  const itemIdRef = useRef(0);
  const metricsRef = useRef({ attempts: 0, firstTry: 0, deliverMs: [] as number[], maxNumber: 0, startedAt: 0 });

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { carriedRef.current = carried; }, [carried]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => { if (walkTimer.current) clearInterval(walkTimer.current); }, []);

  const cfg = rounds[roundIdx] ?? { want: 3, have: 0, intro: '' };

  // ── Round plans, gently scaled by age ──
  const buildRounds = useCallback((): RoundCfg[] => {
    const big = state.ageGroup === 'schoolAge';
    const w = big ? [4, 6, 6, 9] : [3, 4, 3, 5];
    const h = big ? [0, 0, 2, 3] : [0, 0, 1, 2];
    const intros = [
      `The baby dragon is hungry! Bring her exactly what she wishes for.`,
      `She's still hungry — and this time it's a bigger wish!`,
      `Look — she already has some! How many MORE does she need?`,
      `One last feast! Count carefully — you've got this!`,
    ];
    return w.map((want, i) => ({ want, have: h[i], intro: intros[i] }));
  }, [state.ageGroup]);

  function spawnItems(round: RoundCfg, wallSet: Tile[]): Item[] {
    const needed = round.want - round.have;
    const total = needed + 2; // a couple of extras so counting matters
    const taken = new Set<string>(wallSet.map(t => `${t.r},${t.c}`));
    taken.add(`${START.r},${START.c}`);
    taken.add(`${START.r - 1},${START.c}`);
    const spots: Item[] = [];
    let guard = 0;
    while (spots.length < total && guard++ < 400) {
      const r = 1 + Math.floor(Math.random() * 6);   // rows 1–6
      const c = Math.floor(Math.random() * COLS);
      const k = `${r},${c}`;
      if (taken.has(k) || (r <= 2 && c >= 4)) continue; // keep clear of the dragon
      taken.add(k);
      spots.push({ id: ++itemIdRef.current, r, c });
    }
    return spots;
  }

  const startRound = useCallback((idx: number, roundPlan: RoundCfg[]) => {
    if (walkTimer.current) clearInterval(walkTimer.current);
    const round = roundPlan[idx];
    const wallSet = WALLS[idx % WALLS.length];
    attemptsRef.current = 0;
    roundStartRef.current = Date.now();
    setWalls(wallSet);
    setItems(spawnItems(round, wallSet));
    setPos(START);
    setCarried(0);
    setDelivered(0);
    setRevealed(0);
    setShowSlots(idx === 0);   // slots teach the mechanic in round 1
    setRoundIdx(idx);
    setGuideLine(round.intro);
    setGuideMood('excited');
    setPhase('playing');
  }, []);

  function choose(which: 'kailia' | 'noel') {
    const plan = buildRounds();
    metricsRef.current = { attempts: 0, firstTry: 0, deliverMs: [], maxNumber: plan[plan.length - 1].want, startedAt: Date.now() };
    setSkin(SKINS[which]);
    setRounds(plan);
    sfx.yay();
    startRound(0, plan);
  }

  // ── Walking ──
  function walkTo(target: Tile) {
    if (walkTimer.current) clearInterval(walkTimer.current);
    const path = findPath(posRef.current, target, walls);
    if (!path || !path.length) return;
    walkTimer.current = setInterval(() => {
      const next = path.shift();
      if (!next) { if (walkTimer.current) clearInterval(walkTimer.current); return; }
      const isDestination = path.length === 0;
      setPos(next);
      // pick up only the snack the child deliberately walked TO —
      // brushing past one on the way never grabs it by accident
      if (isDestination) {
        const here = itemsRef.current.find(i => i.r === next.r && i.c === next.c);
        if (here) {
          sfx.pickup();
          setCarried(c => c + 1);
          setItems(prev => prev.filter(i => i.id !== here.id));
        }
      }
      // reached the dragon with snacks → deliver
      if (inDragonZone(next) && carriedRef.current > 0) {
        if (walkTimer.current) clearInterval(walkTimer.current);
        setDelivered(carriedRef.current);
        setPhase('checking');
      }
    }, 170);
  }

  function onFieldTap(e: React.PointerEvent) {
    if (phase !== 'playing' || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    walkTo({ r, c });
  }

  // ── The dragon counts what was delivered ──
  useEffect(() => {
    if (phase !== 'checking') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= delivered; i++) {
      timers.push(setTimeout(() => { setRevealed(i); sfx.count(); }, i * 380));
    }
    timers.push(setTimeout(() => {
      const total = cfg.have + delivered;
      if (total === cfg.want) {
        metricsRef.current.deliverMs.push(Date.now() - roundStartRef.current);
        if (attemptsRef.current === 0) metricsRef.current.firstTry += 1;
        setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
        setGuideMood('celebrating');
        sfx.yay();
        setPhase('roundDone');
      } else {
        attemptsRef.current += 1;
        metricsRef.current.attempts += 1;
        sfx.hmm();
        const diff = Math.abs(total - cfg.want);
        setGuideLine(total > cfg.want
          ? `The dragon counted ${total} — that's ${diff} too many! Let's try again together!`
          : `The dragon counted ${total} — she wished for ${cfg.want}! Just ${diff} more!`);
        setGuideMood('thinking');
        if (attemptsRef.current >= 2) setShowSlots(true); // scaffold appears when struggling
        setItems(spawnItems(cfg, walls));
        setPos(START);
        setCarried(0);
        setDelivered(0);
        setRevealed(0);
        setPhase('playing');
      }
    }, delivered * 380 + 700));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Next round / finish (separate effect so the timer survives) ──
  useEffect(() => {
    if (phase !== 'roundDone') return;
    if (roundIdx + 1 < rounds.length) {
      const t = setTimeout(() => startRound(roundIdx + 1, rounds), 1700);
      return () => clearTimeout(t);
    }
    sfx.fanfare();
    const m = metricsRef.current;
    const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
    logQuestMetric('math', 'snack-quest', {
      firstTryRounds: m.firstTry,
      wrongDeliveries: m.attempts,
      avgRoundMs: Math.round(avg(m.deliverMs)),
      maxNumber: m.maxNumber,
      totalMs: Date.now() - m.startedAt,
    });
    const t = setTimeout(() => setPhase('done'), 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx, rounds, startRound]);

  const Sprite = skin?.id === 'noel' ? PandaSprite : KailiaSprite;
  const Guide = skin?.id === 'noel' ? KailiaSprite : PandaSprite;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-6" style={{ background: skin?.bg ?? 'linear-gradient(180deg, #1c1006 0%, #2b1a08 60%, #3a2410 100%)' }}>
      <div className="max-w-md mx-auto px-3">

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold" style={{ color: skin?.accent ?? '#FDBA74' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">🐲 Snack Quest</h1>
          <span className="text-sm w-14 text-right">
            {rounds.map((_, i) => (
              <span key={i} style={{ opacity: i <= roundIdx && phase !== 'select' ? 1 : 0.25 }}>✨</span>
            ))}
            {phase === 'select' && <span style={{ opacity: 0.25 }}>✨✨✨✨</span>}
          </span>
        </div>

        {/* ── Character select ── */}
        {phase === 'select' && (
          <div className="text-center mt-6 bounce-in">
            <div className="rounded-3xl p-5 mx-1 mb-5 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed">
                <span className="text-3xl mr-1">🐲</span>
                A <strong>baby dragon</strong> is hungry — and she only eats <strong>exactly</strong> the
                right amount! Who will gather her snacks?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 px-1">
              <button onClick={() => choose('kailia')}
                className="rounded-3xl p-5 shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ background: '#FFF7ED', border: '3px solid #FDBA74' }}>
                <KailiaSprite size={90} className="mx-auto" />
                <span className="block mt-2 font-extrabold text-amber-700">Play as Kailia</span>
                <span className="block text-xs text-gray-600 mt-1">Gather cookies 🍪 in the treasure cave!</span>
              </button>
              <button onClick={() => choose('noel')}
                className="rounded-3xl p-5 shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ background: '#ECFDF5', border: '3px solid #6EE7B7' }}>
                <PandaSprite size={90} className="mx-auto" />
                <span className="block mt-2 font-extrabold text-emerald-700">Play as Noel</span>
                <span className="block text-xs text-gray-600 mt-1">Gather bamboo 🎋 in the forest!</span>
              </button>
            </div>
          </div>
        )}

        {/* ── The game ── */}
        {phase !== 'select' && skin && (
          <>
            {/* Dragon's wish */}
            <div className="rounded-2xl px-4 py-2.5 mb-2 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.95)' }} data-want={cfg.want}>
              <span className="text-3xl">🐲</span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-gray-800">
                  I wish for <span className="text-xl" style={{ color: '#D97706' }}>{cfg.want}</span> {skin.item}
                  {cfg.have > 0 && <span className="font-semibold text-gray-600"> — I already have {cfg.have}!</span>}
                </p>
                {showSlots && (
                  <p className="text-lg leading-none mt-1" style={{ letterSpacing: 2 }}>
                    {Array.from({ length: cfg.want }).map((_, i) => (
                      <span key={i} style={{ opacity: i < cfg.have + revealed ? 1 : 0.22 }}>{skin.item}</span>
                    ))}
                  </p>
                )}
              </div>
            </div>

            {/* Field */}
            <div ref={fieldRef} onPointerDown={onFieldTap}
              className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ aspectRatio: `${COLS} / ${ROWS}`, touchAction: 'none', cursor: 'pointer',
                background: skin.fieldBg, border: `3px solid ${skin.border}` }}>

              {/* walls */}
              {walls.map((w, i) => (
                <span key={i} className="absolute flex items-center justify-center" style={{
                  left: `${(w.c / COLS) * 100}%`, top: `${(w.r / ROWS) * 100}%`,
                  width: `${100 / COLS}%`, height: `${100 / ROWS}%`,
                  fontSize: 'min(7vw, 34px)', pointerEvents: 'none', opacity: 0.9 }}>
                  {skin.wallEmoji}
                </span>
              ))}

              {/* dragon home (top-right) */}
              <div className="absolute text-center" style={{
                left: `${(5 / COLS) * 100}%`, top: 0, width: `${(2 / COLS) * 100}%`, height: `${(2 / ROWS) * 100}%`,
                pointerEvents: 'none' }}>
                <span className={`block ${phase === 'roundDone' ? 'star-burst' : 'float'}`} style={{ fontSize: 'min(12vw, 56px)', lineHeight: 1.2 }}>🐲</span>
                <span className="block text-base leading-none">
                  {Array.from({ length: cfg.have + revealed }).map((_, i) => <span key={i}>{skin.item}</span>)}
                </span>
              </div>

              {/* snacks */}
              {items.map(it => (
                <span key={it.id} className="absolute flex items-center justify-center sparkle" style={{
                  left: `${(it.c / COLS) * 100}%`, top: `${(it.r / ROWS) * 100}%`,
                  width: `${100 / COLS}%`, height: `${100 / ROWS}%`,
                  fontSize: 'min(6.5vw, 30px)', pointerEvents: 'none',
                  filter: 'drop-shadow(0 0 6px rgba(253,224,71,0.6))' }}>
                  {skin.item}
                </span>
              ))}

              {/* the child's character */}
              <div className="absolute" style={{
                left: `${((pos.c + 0.5) / COLS) * 100}%`, top: `${((pos.r + 0.5) / ROWS) * 100}%`,
                transform: 'translate(-50%, -60%)', transition: 'left 0.16s linear, top 0.16s linear',
                pointerEvents: 'none', zIndex: 5 }}>
                {carried > 0 && (
                  <span data-carried={carried}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-extrabold whitespace-nowrap"
                    style={{ background: 'white', color: '#92400E', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    {skin.item}×{carried}
                  </span>
                )}
                <Sprite size={46} expression={phase === 'roundDone' ? 'celebrating' : carried > 0 ? 'excited' : 'happy'} />
              </div>

              {/* round interstitial */}
              {phase === 'roundDone' && roundIdx + 1 < rounds.length && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 10 }}>
                  <div className="text-center bounce-in">
                    <Guide size={90} expression="celebrating" />
                    <p className="text-xl font-extrabold text-white drop-shadow mt-1 px-4">{praise}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Guide bar — the other character cheers you on */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <Guide size={46} expression={guideMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {guideLine}
              </div>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: skin.accent, opacity: 0.8 }}>
              Tap anywhere to walk there — walk over {skin.itemName} to pick them up!
            </p>
          </>
        )}
      </div>

      {/* ── Finale ── */}
      {phase === 'done' && skin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #92400eee, #b45309ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">🐲</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">The dragon is full and happy!</h2>
            <p className="text-amber-100 font-semibold mb-6">
              She gives you a treasure from her cave — you earned it! 💎
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setPhase('select'); setSkin(null); setRoundIdx(0); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-amber-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Play again!
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-amber-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
