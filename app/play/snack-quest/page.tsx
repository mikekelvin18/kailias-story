'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import LevelPath from '@/components/LevelPath';
import RunnerSprite from '@/components/characters/RunnerSprite';
import LiveArt from '@/components/characters/LiveArt';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet, type PlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import { chime } from '@/components/friends/voice';
import { COMPANIONS } from '@/lib/rewards';
import { petWidth } from '@/lib/companionTrails';

// ─── Snack Quest ──────────────────────────────────────────────────────────────
// Embodied math: the child walks their character around a little field,
// picks up snacks, and delivers EXACTLY what the baby dragon asks for.
// Counting and addition happen with the hands, not multiple choice.
// Rounds: count small → count bigger → "how many more?" → bigger addition.
//
// The field is a painted little place seen from above (a torch-lit
// treasure cave or a sunny bamboo meadow, both gently moving). The baby
// dragon is Ember's picture sitting in her nest; snacks, rocks and bushes
// are drawn, never emoji. The child's friend trots along a step behind,
// cheers each pickup and feast, wobbles when the count isn't right yet,
// and after two tries runs to a snack to show where to start.

// the hungry baby dragon is Ember's picture
const DRAGON = COMPANIONS.find(c => c.name === 'Ember')!;
const FLICK = COMPANIONS.find(c => c.name === 'Flick')!;

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
  itemName: string;
  bg: string;
  border: string;
  accent: string;
  guideName: string; // the OTHER character cheers you on
}

const SKINS: Record<'kailia' | 'noel', Skin> = {
  kailia: {
    id: 'kailia', itemName: 'cookies',
    bg: 'linear-gradient(180deg, #1c1006 0%, #2b1a08 55%, #3a2410 100%)',
    border: 'rgba(253,186,116,0.45)', accent: '#FDBA74',
    guideName: 'Noel',
  },
  noel: {
    id: 'noel', itemName: 'bamboo',
    bg: 'linear-gradient(180deg, #04100a 0%, #07271a 55%, #0a3323 100%)',
    border: 'rgba(110,231,183,0.45)', accent: '#6EE7B7',
    guideName: 'Kailia',
  },
};

const PRAISE = [
  'Exactly right! The dragon is SO happy!', 'Perfect counting!',
  'Yum yum yum! Just the right amount!', 'The dragon does a happy wiggle!',
];

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
  const { state, totalScore } = useAssessment();
  const [skin, setSkin] = useState<Skin | null>(null);
  const [level, setLevel] = useState(1);
  useEffect(() => { setLevel(nextGameLevel('snack-quest')); }, []);
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
  const tierRef = useRef<DifficultyTier>('small');
  const firstPickupRef = useRef(false);
  const [tilePx, setTilePx] = useState(56);
  const attemptsRef = useRef(0);          // wrong deliveries this round
  const roundStartRef = useRef(0);
  const itemIdRef = useRef(0);
  const metricsRef = useRef({ attempts: 0, firstTry: 0, deliverMs: [] as number[], maxNumber: 0, startedAt: 0 });

  // the friend playing along (Ember is the hungry baby dragon here, so if
  // Ember is the chosen friend, Flick keeps everyone company instead)
  const chosenPet = usePlayPet();
  const pet: PlayPet = chosenPet.name === DRAGON.name ? FLICK : chosenPet;
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [petTile, setPetTile] = useState<Tile>({ r: 7, c: 1 });
  const [hintItem, setHintItem] = useState<number | null>(null);
  const [walking, setWalking] = useState(false);
  const [faceLeft, setFaceLeft] = useState(false);
  const [hop, setHop] = useState(0);
  const [dragonHop, setDragonHop] = useState(0);
  const [earned, setEarned] = useState(0);
  const historyRef = useRef<Tile[]>([START]);
  const { layer: burstLayer, fire } = useBursts();

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { carriedRef.current = carried; }, [carried]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Measure the field so sprites, snacks and the dragon scale with the screen
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const update = () => setTilePx(el.clientWidth / COLS);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);
  useEffect(() => () => { if (walkTimer.current) clearInterval(walkTimer.current); }, []);

  const cfg = rounds[roundIdx] ?? { want: 3, have: 0, intro: '' };

  // ── Round plans, scaled to the child's developmental level ──
  // Every 3 levels the dragon's wishes grow by one (capped per tier so
  // the field never overflows), and "how many more?" rounds start from a
  // bigger pile — counting, then adding, with ever-larger numbers.
  const buildRounds = useCallback((lvl: number): RoundCfg[] => {
    const tier = difficultyTier(state.ageGroup, totalScore);
    tierRef.current = tier;
    const plans: Record<DifficultyTier, { w: number[]; h: number[] }> = {
      tiny:  { w: [1, 2, 2, 3], h: [0, 0, 1, 1] },   // developmental level under ~2½ yrs
      small: { w: [3, 4, 3, 5], h: [0, 0, 1, 2] },
      big:   { w: [4, 6, 6, 9], h: [0, 0, 2, 3] },
    };
    const { w, h } = plans[tier];
    const bump = Math.floor((lvl - 1) / 3);
    const cap = tier === 'tiny' ? 5 : tier === 'small' ? 9 : 12;  // fits the field's free spots
    const intros = [
      `The baby dragon is hungry! Walk to a snack to pick it up, then bring it to her!`,
      `She's still hungry — and this time it's a bigger wish!`,
      `Look — she already has some! How many MORE does she need?`,
      `One last feast! Count carefully — you've got this!`,
    ];
    return w.map((base, i) => {
      const want = Math.min(cap, base + bump);
      const have = h[i] > 0 ? Math.min(want - 1, h[i] + Math.floor(bump / 2)) : 0;
      return { want, have, intro: intros[i] };
    });
  }, [state.ageGroup, totalScore]);

  function spawnItems(round: RoundCfg, wallSet: Tile[]): Item[] {
    const needed = round.want - round.have;
    // extras make counting matter; the littlest ones get just one extra
    const total = needed + (tierRef.current === 'tiny' ? 1 : 2);
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
    setWalking(false);
    setHintItem(null);
    setPetTile({ r: 7, c: 1 });
    historyRef.current = [START];
    // Shown every round — now that empty slots are a clear dashed outline
    // instead of dimmed bamboo, it's a helpful visual aid rather than
    // clutter, so there's no reason to fade it out after round 1.
    setShowSlots(true);
    firstPickupRef.current = false;
    setRoundIdx(idx);
    setGuideLine(round.intro);
    setGuideMood('excited');
    setPhase('playing');
  }, []);

  function choose(which: 'kailia' | 'noel', lvl = level) {
    const plan = buildRounds(lvl);
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
    setWalking(true);
    walkTimer.current = setInterval(() => {
      const next = path.shift();
      if (!next) { if (walkTimer.current) clearInterval(walkTimer.current); setWalking(false); return; }
      const isDestination = path.length === 0;
      const from = posRef.current;
      if (next.c !== from.c) setFaceLeft(next.c < from.c);
      setPos(next);
      if (isDestination) setWalking(false);
      // the friend trots a step or two behind, on a free spot (never on a snack)
      historyRef.current = [...historyRef.current.slice(-6), next];
      const behind = [...historyRef.current].reverse().slice(2)
        .find(t => !itemsRef.current.some(i => i.r === t.r && i.c === t.c) && !(t.r === next.r && t.c === next.c));
      if (behind) setPetTile(behind);
      // pick up only the snack the child deliberately walked TO —
      // brushing past one on the way never grabs it by accident
      if (isDestination) {
        const here = itemsRef.current.find(i => i.r === next.r && i.c === next.c);
        if (here) {
          sfx.pickup();
          setCarried(c => c + 1);
          setItems(prev => prev.filter(i => i.id !== here.id));
          setHintItem(null);
          setPetMood('cheer');
          fire(((next.c + 0.5) / COLS) * 100, ((next.r + 0.4) / ROWS) * 100, ['#FFE066', '#FFFFFF', '#FDBA74'], 9, 46);
          if (!firstPickupRef.current) {
            firstPickupRef.current = true;
            setGuideLine('Got one! Now bring it to the dragon!');
            setGuideMood('excited');
          }
        }
      }
      // reached the dragon with snacks → deliver
      if (inDragonZone(next) && carriedRef.current > 0) {
        if (walkTimer.current) clearInterval(walkTimer.current);
        setWalking(false);
        setDelivered(carriedRef.current);
        setPhase('checking');
      }
    }, 170);
  }

  function onFieldTap(e: React.PointerEvent) {
    if (phase !== 'playing' || !fieldRef.current) return;
    // tickling the friend is play, not a walk
    if ((e.target as HTMLElement).closest?.('[data-pet]')) return;
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
        const line = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        setPraise(line);
        setGuideLine(line);
        setGuideMood('celebrating');
        sfx.yay();
        setDragonHop(n => n + 1);
        setHop(n => n + 1);
        setPetMood('cheer');
        fire(86, 14, ['#FFE066', '#FFFFFF', '#FF9EC7', '#FDBA74'], 16, 90);
        setPhase('roundDone');
      } else {
        attemptsRef.current += 1;
        metricsRef.current.attempts += 1;
        sfx.hmm();
        const diff = Math.abs(total - cfg.want);
        setGuideLine(total > cfg.want
          ? `The dragon counted ${total}, that's ${diff} too many! Let's try again together!`
          : `The dragon counted ${total}, she wished for ${cfg.want}! Just ${diff} more!`);
        setGuideMood('thinking');
        if (attemptsRef.current >= 2) setShowSlots(true); // scaffold appears when struggling
        const fresh = spawnItems(cfg, walls);
        setItems(fresh);
        setPetMood('oops');
        historyRef.current = [START];
        setPetTile({ r: 7, c: 1 });
        // after two tries the friend runs to the closest snack and bounces
        // beside it, to show where to start gathering
        if (attemptsRef.current >= 2 && fresh.length) {
          const near = [...fresh].sort((a, b) => (Math.abs(a.r - START.r) + Math.abs(a.c - START.c)) - (Math.abs(b.r - START.r) + Math.abs(b.c - START.c)))[0];
          const spot = [{ r: near.r, c: near.c + 1 }, { r: near.r, c: near.c - 1 }, { r: near.r + 1, c: near.c }, { r: near.r - 1, c: near.c }]
            .find(t => t.r >= 0 && t.r < ROWS && t.c >= 0 && t.c < COLS && !walls.some(w => w.r === t.r && w.c === t.c)
              && !fresh.some(i => i.r === t.r && i.c === t.c) && !(t.r === START.r && t.c === START.c));
          setHintItem(near.id);
          if (spot) {
            setPetTile(spot);
            setPetMood('talk');
          }
          setGuideLine(total > cfg.want
            ? `The dragon counted ${total}, that's ${diff} too many! ${pet.name} found a snack to start again with.`
            : `The dragon counted ${total}, she wished for ${cfg.want}! Just ${diff} more! ${pet.name} found a snack to start with.`);
        }
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
      level,
      firstTryRounds: m.firstTry,
      wrongDeliveries: m.attempts,
      avgRoundMs: Math.round(avg(m.deliverMs)),
      maxNumber: m.maxNumber,
      totalMs: Date.now() - m.startedAt,
    });
    // ✨ starlight for the feast: perfect first tries shine extra
    const stars = 15 + level * 2 + m.firstTry * 3;
    awardStarlight(stars);
    recordGameLevel('snack-quest', level);
    const t = setTimeout(() => { setEarned(stars); setPhase('done'); }, 1500);
    return () => clearTimeout(t);
  }, [phase, roundIdx, rounds, startRound, level]);

  const Guide = skin?.id === 'noel' ? KailiaSprite : PandaSprite;
  const cave = skin?.id !== 'noel';

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-4" style={{ background: skin?.bg ?? 'linear-gradient(180deg, #1c1006 0%, #2b1a08 60%, #3a2410 100%)' }}>
      {/* the column is sized so the field fills the screen height with little waste */}
      <div className="mx-auto px-3" style={{ width: 'min(100%, calc((100dvh - 330px) * 0.875 + 24px), 44rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold whitespace-nowrap" style={{ color: skin?.accent ?? '#FDBA74' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow whitespace-nowrap">
            Snack Quest <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-14" aria-hidden="true">
            {(rounds.length ? rounds : [0, 1, 2, 3]).map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#FDE047', boxShadow: '0 0 8px #FDE047', opacity: i <= roundIdx && phase !== 'select' ? 1 : 0.25 }} />
            ))}
          </span>
        </div>

        {/* ── Character select ── */}
        {phase === 'select' && (
          <div className="text-center mt-4 bounce-in">
            <div className="flex items-end justify-center gap-3 mb-3">
              <span className="relative inline-block">
                <span aria-hidden="true" className="absolute left-[8%] right-[8%] bottom-[-4%] h-[16%] rounded-[50%]" style={{ background: 'radial-gradient(ellipse, #F2C14E 0%, #C9822F 70%)', border: '2px solid #3b2416' }} />
                <LiveArt src={DRAGON.art} alt="the baby dragon" size={petWidth(DRAGON.art, 112)} kind="pet" />
              </span>
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 68)} kind="pet" />
            </div>
            <div className="rounded-3xl p-5 mx-1 mb-5 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                A <strong>baby dragon</strong> is hungry, and she only eats <strong>exactly</strong> the
                right amount! Who will gather her snacks?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 px-1">
              <button onClick={() => choose('kailia')}
                className="rounded-3xl p-5 shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ background: '#FFF7ED', border: '3px solid #FDBA74' }}>
                <KailiaSprite size={90} className="mx-auto" />
                <span className="block mt-2 font-extrabold text-amber-700">Play as Kailia</span>
                <span className="block text-sm text-gray-700 mt-1">
                  Gather cookies <Snack cave size={20} style={{ display: 'inline-block', verticalAlign: '-0.3em' }} /> in the treasure cave!
                </span>
              </button>
              <button onClick={() => choose('noel')}
                className="rounded-3xl p-5 shadow-xl transition-transform hover:scale-105 active:scale-95"
                style={{ background: '#ECFDF5', border: '3px solid #6EE7B7' }}>
                <PandaSprite size={90} className="mx-auto" />
                <span className="block mt-2 font-extrabold text-emerald-700">Play as Noel</span>
                <span className="block text-sm text-gray-700 mt-1">
                  Gather bamboo <Snack cave={false} size={20} style={{ display: 'inline-block', verticalAlign: '-0.3em' }} /> in the meadow!
                </span>
              </button>
            </div>
            <LevelPath gameId="snack-quest" level={level} onPick={setLevel} />
            <SkillIntro gameId="snack-quest" />
          </div>
        )}

        {/* ── The game ── */}
        {phase !== 'select' && skin && (
          <>
            {/* Dragon's wish — big and centered so little eyes can read it */}
            <div className="rounded-2xl px-4 py-2.5 mb-2 text-center" style={{ background: 'rgba(255,255,255,0.96)' }} data-want={cfg.want}>
              <p className="text-2xl font-extrabold text-gray-800 flex items-center justify-center gap-2 flex-wrap leading-tight">
                <LiveArt src={DRAGON.art} alt="the baby dragon" size={petWidth(DRAGON.art, 52)} kind="pet" pokeable={false} />
                <span className="inline-flex items-center gap-1">
                  I wish for <span className="text-4xl mx-1" style={{ color: '#B45309' }}>{cfg.want}</span>
                  <Snack cave={cave} size={38} />
                </span>
              </p>
              {cfg.have > 0 && (
                <p className="text-lg font-semibold text-gray-700 mt-0.5">I already have {cfg.have}!</p>
              )}
              {showSlots && (
                <p className="leading-none mt-1.5 flex items-center justify-center gap-1 flex-wrap">
                  {Array.from({ length: cfg.want }).map((_, i) => (
                    i < cfg.have + revealed
                      ? <span key={i} className={i >= cfg.have ? 'star-burst' : undefined} style={{ display: 'inline-block' }}><Snack cave={cave} size={30} /></span>
                      : <span key={i} className="inline-flex items-center justify-center rounded-full"
                          style={{ width: 26, height: 26, margin: 2, border: '2.5px dashed #9CA3AF' }} />
                  ))}
                </p>
              )}
            </div>

            {/* Field: a painted little place, seen from above */}
            <div ref={fieldRef} onPointerDown={onFieldTap}
              className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ aspectRatio: `${COLS} / ${ROWS}`, touchAction: 'none', cursor: 'pointer',
                border: `3px solid ${skin.border}`, boxShadow: '0 8px 0 rgba(0,0,0,0.25)' }}>

              <Floor cave={cave} />

              {/* rocks (cave) or bushes (meadow) */}
              {walls.map((w, i) => (
                <span key={i} className="absolute flex items-center justify-center" style={{
                  left: `${(w.c / COLS) * 100}%`, top: `${(w.r / ROWS) * 100}%`,
                  width: `${100 / COLS}%`, height: `${100 / ROWS}%`, pointerEvents: 'none' }}>
                  <WallPiece cave={cave} i={i} size={tilePx * 0.92} />
                </span>
              ))}

              {/* the dragon in her nest (top-right) — kept off the very top
                  edge so her ears never meet the field's rounded, clipped rim */}
              <div className="absolute flex flex-col items-center justify-end" style={{
                left: `${(5 / COLS) * 100}%`, top: `${(0.1 / ROWS) * 100}%`, width: `${(2 / COLS) * 100}%`, height: `${(1.9 / ROWS) * 100}%`,
                pointerEvents: 'none' }}>
                <span aria-hidden="true" className="absolute rounded-[50%]" style={{
                  left: '6%', right: '6%', bottom: `${tilePx * 0.2}px`, height: tilePx * 0.5,
                  background: cave ? 'radial-gradient(ellipse, #FFE7A3 0%, #F2C14E 45%, #C9822F 80%)' : 'radial-gradient(ellipse, #F3DFA6 0%, #D9B26A 50%, #A87B3C 85%)',
                  border: '2.5px solid #3b2416', boxShadow: '0 0 16px rgba(255,214,120,0.6)' }} />
                <span key={dragonHop} className={`relative block ${dragonHop ? 'kp-hop' : ''}`} style={{ marginBottom: tilePx * 0.3, transformOrigin: '50% 100%' }}>
                  <LiveArt src={DRAGON.art} alt="the baby dragon" size={petWidth(DRAGON.art, tilePx * 1.38)} kind="pet" pokeable={false} />
                </span>
                {/* the dragon's own stash sits in a little white tray — a
                    clearly different look from the loose snacks in the
                    field, so it's obvious these are already hers */}
                {(cfg.have + revealed) > 0 && (
                  <span className="absolute bottom-0 inline-flex items-center justify-center flex-wrap rounded-xl"
                    style={{ maxWidth: '100%', padding: '1px 3px', background: 'rgba(255,255,255,0.92)', border: '2px solid #3b2416' }}>
                    {Array.from({ length: cfg.have + revealed }).map((_, i) => <Snack key={i} cave={cave} size={Math.max(10, tilePx * 0.24)} />)}
                  </span>
                )}
              </div>

              {/* snacks, each on a little pool of light so it pops off the floor */}
              {items.map(it => (
                <span key={it.id} data-snack className="absolute flex items-center justify-center" style={{
                  left: `${(it.c / COLS) * 100}%`, top: `${(it.r / ROWS) * 100}%`,
                  width: `${100 / COLS}%`, height: `${100 / ROWS}%`, pointerEvents: 'none' }}>
                  <span aria-hidden="true" className="absolute rounded-full" style={{ width: '86%', height: '86%',
                    background: 'radial-gradient(circle, rgba(255,252,232,1) 0%, rgba(255,248,214,0.92) 46%, rgba(255,240,170,0.35) 62%, rgba(255,240,170,0) 72%)' }} />
                  {hintItem === it.id && (
                    <span className="absolute rounded-full hint-glow" style={{ width: '92%', height: '92%', border: '3px solid #FFFFFF' }} />
                  )}
                  <span className="relative sparkle inline-block"><Snack cave={cave} size={tilePx * 0.62} /></span>
                </span>
              ))}

              {/* the friend, trotting along a step behind */}
              <div data-pet>
                <Actor art={pet.art} name={pet.name}
                  x={((petTile.c + 0.5) / COLS) * 100} y={((petTile.r + 0.95) / ROWS) * 100} h={Math.round(tilePx * 0.82)}
                  mood={petMood} moodKey={petMoodKey} moveMs={hintItem !== null ? 900 : 380} onTap={tickle} z={4} />
              </div>

              {/* the child's character — top is clamped so the -60%
                  transform (plus the "carried" badge riding above it)
                  never pushes the sprite's head above row 0, where the
                  field's rounded+clipped edge would slice it off. This is
                  exactly the dragon-delivery moment, so it happened often. */}
              <div className="absolute" style={{
                left: `${((pos.c + 0.5) / COLS) * 100}%`, top: `${(Math.max(pos.r + 0.5, 1.1) / ROWS) * 100}%`,
                transform: 'translate(-50%, -60%)', transition: 'left 0.16s linear, top 0.16s linear',
                pointerEvents: 'none', zIndex: 5 }}>
                {carried > 0 && (
                  <span data-carried={carried}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-base font-extrabold whitespace-nowrap inline-flex items-center gap-0.5"
                    style={{ background: 'white', color: '#92400E', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 2 }}>
                    <Snack cave={cave} size={18} />×{carried}
                  </span>
                )}
                {/* a soft light under the feet keeps the hero readable on any floor */}
                <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 rounded-[50%]" style={{
                  bottom: -2, width: tilePx * 0.9, height: tilePx * 0.26, background: 'radial-gradient(ellipse, rgba(255,250,225,0.85) 0%, rgba(255,250,225,0) 70%)' }} />
                <div style={{ transform: `scaleX(${faceLeft ? -1 : 1})`, transition: 'transform 0.15s', transformOrigin: '50% 100%' }}>
                  <div key={hop} className={hop ? 'kp-hop' : undefined} style={{ transformOrigin: '50% 100%' }}>
                    <RunnerSprite character={skin.id} action={walking ? 'run' : 'idle'}
                      width={Math.round(tilePx * (skin.id === 'noel' ? 1.3 : 1.05))} height={Math.round(tilePx * 1.02)} fps={10} />
                  </div>
                </div>
              </div>

              {burstLayer}

              {/* round interstitial */}
              {phase === 'roundDone' && roundIdx + 1 < rounds.length && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)', zIndex: 40 }}>
                  <div className="text-center bounce-in px-4">
                    <Guide size={90} expression="celebrating" />
                    <p className="text-xl font-extrabold text-white mt-1 px-4 py-2 rounded-2xl" style={{ background: 'rgba(40,22,10,0.82)' }}>{praise}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Guide bar — the other character cheers you on */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <Guide size={54} expression={guideMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-4 py-2.5 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {guideLine}
              </div>
            </div>
            <p className="text-center text-sm font-semibold mt-2" style={{ color: skin.accent }}>
              Tap anywhere to walk. Pick up {skin.itemName}, then bring them to the dragon!
            </p>
          </>
        )}
      </div>

      {/* ── Finale ── */}
      {phase === 'done' && skin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
          style={{ background: cave ? 'linear-gradient(135deg, #92400e, #b45309)' : 'linear-gradient(135deg, #065f46, #15803d)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-2 star-burst">
              <LiveArt src={DRAGON.art} alt="the baby dragon" size={petWidth(DRAGON.art, 104)} kind="pet" />
            </span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={116} expression="celebrating" className="float" />
              <KailiaSprite size={88} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 76)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-white font-bold text-lg mb-1">The dragon is full and happy! {pet.name} is doing a happy dance!</p>
            <p className="text-white/90 font-semibold mb-2 inline-flex items-center gap-1.5 justify-center flex-wrap">
              She gives you a treasure from her cave <Gem size={26} />
            </p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { const nl = level + 1; setLevel(nl); choose(skin.id, nl); }}
                className={`px-8 py-3.5 rounded-full text-lg font-extrabold shadow-xl transition-transform hover:scale-105 ${cave ? 'text-amber-900' : 'text-emerald-900'}`}
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-amber-950 shadow-xl transition-transform hover:scale-105 inline-block"
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

const SK = '#3b2416';

// ── The snacks: a chocolate-chip cookie (cave) or a bamboo shoot (meadow) ──
function Snack({ cave, size, style }: { cave: boolean; size: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible', ...style }}>
      <g filter="url(#kp-brush)">
        {cave ? (
          <>
            <circle cx="20" cy="20" r="15.5" fill="#E9B872" stroke={SK} strokeWidth="2.6" />
            <path d="M9 15 Q13 8 21 7" stroke="#FFF1CF" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8" />
            {[[14, 16], [25, 13], [23, 25], [13, 26], [29, 21], [19, 20]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="2.3" ry="2" fill="#5B3A1E" />
            ))}
          </>
        ) : (
          <>
            <rect x="11" y="5" width="8" height="31" rx="3.5" fill="#D4F06E" stroke={SK} strokeWidth="2.2" />
            <rect x="21" y="11" width="7" height="25" rx="3" fill="#B5E04F" stroke={SK} strokeWidth="2.2" />
            <path d="M11 16 H19 M11 26 H19 M21 21 H28 M21 30 H28" stroke={SK} strokeWidth="1.8" />
            <path d="M13 8 V14" stroke="#F4FFD0" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 9 Q28 2 36 5 Q29 11 19 11z" fill="#5DB04E" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
          </>
        )}
      </g>
    </svg>
  );
}

// ── Things in the way: a boulder (some wear a little crystal) or a round bush ──
function WallPiece({ cave, i, size }: { cave: boolean; i: number; size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <ellipse cx="20" cy="35" rx="15" ry="3.5" fill="rgba(0,0,0,0.25)" />
      <g filter="url(#kp-brush)">
        {cave ? (
          <>
            <path d="M5 31 Q3 17 13 11 Q21 6 30 10 Q38 15 37 26 Q36 34 22 35 Q9 36 5 31z" fill="#B7B2AD" stroke={SK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M9 19 Q13 12 22 11" stroke="#F5F2EE" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M24 22 Q29 24 31 29" stroke="#8C8681" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {i % 3 === 0 && (
              <g className="fg-glow" style={{ animationDelay: `${-i * 0.7}s` }}>
                <path d="M23 12 L26 1 L29 12z" fill="#F9A8D4" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M28 12 L31 5 L33 12z" fill="#C4B5FD" stroke={SK} strokeWidth="1.4" strokeLinejoin="round" />
              </g>
            )}
          </>
        ) : (
          <>
            <circle cx="12" cy="24" r="10" fill="#2F8A45" stroke={SK} strokeWidth="2.2" />
            <circle cx="28" cy="24" r="10" fill="#2F8A45" stroke={SK} strokeWidth="2.2" />
            <circle cx="20" cy="15" r="11" fill="#3FA055" stroke={SK} strokeWidth="2.2" />
            <path d="M5 26 Q10 34 20 33 Q30 34 35 26 L35 28 Q30 36 20 35 Q10 36 5 28z" fill="#2F8A45" />
            <path d="M13 12 Q17 7 23 8" stroke="#8FD98F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {i % 2 === 0 && <><circle cx="27" cy="20" r="1.9" fill="#F87171" stroke={SK} strokeWidth="0.8" /><circle cx="14" cy="27" r="1.9" fill="#F87171" stroke={SK} strokeWidth="0.8" /></>}
          </>
        )}
      </g>
    </svg>
  );
}

// ── The floor, painted and gently alive ──
// Cave: warm torch-lit flagstones, glowing crystals and drifting sparks.
// Meadow: sunny grass with swaying tufts, little flowers and falling leaves.
function Floor({ cave }: { cave: boolean }) {
  const g = cave ? 'sq-cave' : 'sq-meadow';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 70 80" preserveAspectRatio="none">
        <defs>
          <radialGradient id={g} cx="0.45" cy="0.55" r="0.75">
            {cave
              ? <><stop offset="0" stopColor="#9A6845" /><stop offset="0.65" stopColor="#7A4E33" /><stop offset="1" stopColor="#4E2F1F" /></>
              : <><stop offset="0" stopColor="#A6DB86" /><stop offset="0.7" stopColor="#86C56C" /><stop offset="1" stopColor="#5E9F4E" /></>}
          </radialGradient>
          <radialGradient id={`${g}-glow`}><stop offset="0" stopColor={cave ? '#FF9AD5' : '#FFFBD0'} stopOpacity="0.75" /><stop offset="1" stopColor={cave ? '#FF9AD5' : '#FFFBD0'} stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="70" height="80" fill={`url(#${g})`} />
        <g filter="url(#kp-brush)">
          {cave ? (
            <>
              {/* flagstones */}
              {Array.from({ length: 22 }, (_, i) => (
                <ellipse key={i} cx={seeded(i, 1) * 70} cy={seeded(i, 2) * 80} rx={4 + seeded(i, 3) * 4} ry={3 + seeded(i, 4) * 2.5}
                  fill="#B07A52" opacity="0.28" stroke={SK} strokeWidth="0.35" strokeOpacity="0.5" />
              ))}
              {/* crystal light glowing in from the cave walls (only light on
                  the floor, so nothing looks like something in the way) */}
              {[[0, 40], [70, 62], [0, 76], [36, 80], [24, 0]].map(([x, y], i) => (
                <circle key={`c${i}`} cx={x} cy={y} r="9" fill={`url(#${g}-glow)`} className="fg-glow" style={{ animationDelay: `${-i * 0.8}s` }} />
              ))}
            </>
          ) : (
            <>
              {/* sun dapples */}
              {[[18, 22], [52, 46], [26, 64], [60, 14]].map(([x, y], i) => (
                <ellipse key={`d${i}`} cx={x} cy={y} rx="9" ry="6" fill={`url(#${g}-glow)`} className="fg-glow" style={{ animationDelay: `${-i * 0.9}s` }} />
              ))}
              {/* little flowers */}
              {Array.from({ length: 10 }, (_, i) => (
                <g key={`f${i}`}>
                  <circle cx={seeded(i, 11) * 70} cy={seeded(i, 12) * 80} r="1.1" fill={i % 2 ? '#FFB4C8' : '#FFF3A0'} stroke={SK} strokeWidth="0.25" />
                  <circle cx={seeded(i, 11) * 70} cy={seeded(i, 12) * 80} r="0.4" fill="#F59E0B" />
                </g>
              ))}
            </>
          )}
        </g>
        {/* swaying grass tufts (meadow) or tiny pebbles (cave) */}
        {Array.from({ length: cave ? 0 : 16 }, (_, i) => {
          const x = seeded(i, 21) * 70, y = seeded(i, 22) * 80;
          return (
            <g key={`t${i}`} className="fg-sway" style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box', animationDelay: `${-seeded(i, 23) * 4}s` } as React.CSSProperties}>
              <path d={`M${x} ${y} q-0.8 -2.4 -1.8 -3 M${x} ${y} q0 -3 0.5 -3.8 M${x} ${y} q0.8 -2 2 -2.6`} stroke="#3E8A3C" strokeWidth="0.5" fill="none" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      {/* drifting sparks (cave) or falling leaves (meadow) */}
      {cave
        ? Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="fg-rise absolute rounded-full" style={{
              left: `${4 + seeded(i, 30) * 92}%`, bottom: `${-2 + seeded(i, 31) * 50}%`, width: 5, height: 5,
              background: 'radial-gradient(circle, #FFFFFF 0%, #FFC46B 45%, #FFC46B00 72%)',
              animationDuration: `${5 + seeded(i, 32) * 5}s`, animationDelay: `${-seeded(i, 33) * 8}s`,
              ['--rise' as string]: `${120 + seeded(i, 34) * 140}px`, ['--sway' as string]: `${(seeded(i, 35) - 0.5) * 30}px`,
            } as React.CSSProperties} />
          ))
        : Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="fg-fall absolute top-[-6%]" style={{
              left: `${seeded(i, 40) * 92}%`,
              animationDuration: `${8 + seeded(i, 41) * 6}s`, animationDelay: `${-seeded(i, 42) * 12}s`,
              ['--sway' as string]: `${(seeded(i, 43) - 0.5) * 60}px`, ['--fall' as string]: '440px',
            } as React.CSSProperties}>
              <svg width="14" height="10" viewBox="0 0 16 12"><path d="M1 6 Q8 -2 15 6 Q8 14 1 6z" fill={['#F7B267', '#9ED36A', '#F4845F'][i % 3]} stroke={SK} strokeWidth="0.8" /></svg>
            </span>
          ))}
    </div>
  );
}

// a drawn treasure gem for the finale (instead of the 💎 emoji)
function Gem({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 34" width={size} height={size * 0.85} aria-hidden="true" style={{ display: 'inline-block' }}>
      <g filter="url(#kp-brush)">
        <path d="M8 3 H32 L39 12 L20 32 L1 12z" fill="#7DD3FC" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M1 12 H39 M14 3 L11 12 L20 32 L29 12 L26 3" fill="none" stroke={SK} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M11 12 L14 3 H26 L29 12z" fill="#BAE6FD" />
        <path d="M6 9 L9 5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}
