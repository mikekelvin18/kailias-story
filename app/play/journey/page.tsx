'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import OverworldSprite, { type Facing } from '@/components/characters/OverworldSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { makeChallenge, DOMAIN, type Challenge } from '@/lib/creatureChallenges';
import { Critter } from '@/components/characters/CritterSprite';

// ─── Kailia's Journey ─────────────────────────────────────────────────────────
// An old-school, Game-Boy-style top-down overworld: a tile grid, a camera
// that follows Kailia, free walking with a D-pad or arrow keys, and
// patches of tall grass that trigger a wild encounter — an authentic
// black-bordered dialog box, a menu of answers, and a Poké-ball-style
// capture animation. Every creature poses a different mini challenge
// (counting, memory, color matching, feelings, words) tied to its own
// skill domain. Four biomes cycle level to level — a real world to walk.

const W = 16, H = 20;            // map size, tiles — bigger now the whole screen is the world
const TILE = 44;                 // px per tile

type TileType = 'grass' | 'path' | 'tallgrass' | 'tree' | 'water' | 'flower' | 'flag';

interface Pt { x: number; y: number; }
interface Encounter { challenge: Challenge; solved: boolean; }

interface Biome {
  name: string; sky: string; ground: string; path: string;
  obstacles: string[]; decor: string[]; tallgrassBg: string;
}
const BIOMES: Biome[] = [
  { name: 'Sunny Meadow', sky: 'linear-gradient(180deg,#7dd3fc,#bef264 65%)', ground: '#86efac', path: '#e0c88f', obstacles: ['🌳', '💧'], decor: ['🌸', '🍀'], tallgrassBg: '#4ade80' },
  { name: 'Golden Dunes', sky: 'linear-gradient(180deg,#fde68a,#fbbf24 65%)', ground: '#fcd34d', path: '#eab676', obstacles: ['🌵', '🪨'], decor: ['🪨', '🌾'], tallgrassBg: '#f0b429' },
  { name: 'Frosty Hills', sky: 'linear-gradient(180deg,#bfdbfe,#e0e7ff 65%)', ground: '#e0f2fe', path: '#cbd5e1', obstacles: ['🌲', '🧊'], decor: ['❄️', '⛄'], tallgrassBg: '#93c5fd' },
  { name: 'Autumn Grove', sky: 'linear-gradient(180deg,#fdba74,#fb923c 65%)', ground: '#fed7aa', path: '#d4a373', obstacles: ['🍁', '🪵'], decor: ['🍂', '🍄'], tallgrassBg: '#f59e42' },
];

// The three starter partners offered on a brand-new journey — same names
// as the companions unlocked by starlight, tying the two systems together.
const STARTERS = [
  { emoji: '🐢', name: 'Shelly', blurb: 'Slow and steady — never rattled.' },
  { emoji: '🦊', name: 'Flick', blurb: 'Quick, clever, always curious.' },
  { emoji: '🦉', name: 'Sage', blurb: 'Wise eyes that notice everything.' },
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.06, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
    });
  } catch { /* optional */ }
}
const sfx = {
  step: () => playNotes([{ f: 220, t: 0, d: 0.03 }]),
  encounter: () => playNotes([{ f: 220, t: 0, d: 0.1 }, { f: 175, t: 0.1, d: 0.1 }, { f: 220, t: 0.2, d: 0.1 }, { f: 330, t: 0.3, d: 0.2 }]),
  wrong: () => playNotes([{ f: 220, t: 0, d: 0.12 }, { f: 196, t: 0.1, d: 0.16 }]),
  catch_: () => playNotes([{ f: 392, t: 0, d: 0.08 }, { f: 392, t: 0.15, d: 0.08 }, { f: 392, t: 0.3, d: 0.08 }, { f: 659, t: 0.5, d: 0.15 }, { f: 880, t: 0.62, d: 0.3 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

// Biased random walk from bottom-left to top-right, guaranteeing a
// connected trail across the interior of the map.
function buildPath(): Pt[] {
  const start: Pt = { x: 1, y: H - 2 };
  const goal: Pt = { x: W - 2, y: 1 };
  const pts: Pt[] = [{ ...start }];
  let cur = { ...start };
  let guard = 0;
  while ((cur.x !== goal.x || cur.y !== goal.y) && guard++ < 250) {
    const dx = goal.x - cur.x, dy = goal.y - cur.y;
    const toward: string[] = [];
    if (dx > 0) toward.push('R'); if (dx < 0) toward.push('L');
    if (dy > 0) toward.push('D'); if (dy < 0) toward.push('U');
    const inBounds = (d: string) => {
      const nx = cur.x + (d === 'L' ? -1 : d === 'R' ? 1 : 0);
      const ny = cur.y + (d === 'U' ? -1 : d === 'D' ? 1 : 0);
      return nx >= 1 && nx <= W - 2 && ny >= 1 && ny <= H - 2;
    };
    let dir: string | undefined;
    if (Math.random() < 0.72 && toward.some(inBounds)) dir = pick(toward.filter(inBounds));
    else dir = pick((['U', 'D', 'L', 'R'] as string[]).filter(inBounds));
    if (!dir) break;
    cur = { x: cur.x + (dir === 'L' ? -1 : dir === 'R' ? 1 : 0), y: cur.y + (dir === 'U' ? -1 : dir === 'D' ? 1 : 0) };
    pts.push({ ...cur });
  }
  if (cur.x !== goal.x || cur.y !== goal.y) {
    while (cur.x !== goal.x) { cur = { ...cur, x: cur.x + (goal.x > cur.x ? 1 : -1) }; pts.push({ ...cur }); }
    while (cur.y !== goal.y) { cur = { ...cur, y: cur.y + (goal.y > cur.y ? 1 : -1) }; pts.push({ ...cur }); }
  }
  return pts;
}

function buildWorld(tier: string, level: number) {
  const biome = BIOMES[(level - 1) % BIOMES.length];
  const path = buildPath();
  const key = (p: Pt) => `${p.x},${p.y}`;
  const grid: TileType[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => 'grass' as TileType));
  const pathKeys = new Set(path.map(key));
  path.forEach(p => { grid[p.y][p.x] = 'path'; });

  const required = Math.min(6, (tier === 'tiny' ? 2 : tier === 'small' ? 3 : 4) + Math.floor((level - 1) / 3));
  const encounterIdx: number[] = [];
  for (let i = 0; i < required; i++) {
    const idx = Math.max(1, Math.min(path.length - 2, Math.round((i + 1) * (path.length - 1) / (required + 1))));
    if (!encounterIdx.includes(idx)) encounterIdx.push(idx);
  }
  const encounters: Record<string, Encounter> = {};
  encounterIdx.forEach((idx, i) => {
    const p = path[idx];
    grid[p.y][p.x] = 'tallgrass';
    encounters[key(p)] = { challenge: makeChallenge(i, tier), solved: false };
  });

  const goal = path[path.length - 1];
  grid[goal.y][goal.x] = 'flag';

  // sprinkle obstacles & decor off the path — scaled to the map's area so
  // a bigger world (the whole screen) still feels populated, not empty
  const obstacleTarget = Math.round((W * H) / 12);
  const decorTarget = Math.round((W * H) / 18);
  let placed = 0, guard = 0;
  while (placed < obstacleTarget && guard++ < obstacleTarget * 30) {
    const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2));
    const p = { x, y };
    if (pathKeys.has(key(p))) continue;
    if (Math.abs(x - 1) + Math.abs(y - (H - 2)) < 2) continue; // clear near start
    grid[y][x] = Math.random() < 0.6 ? 'tree' : 'water';
    placed++;
  }
  let decor = 0; guard = 0;
  while (decor < decorTarget && guard++ < decorTarget * 30) {
    const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2));
    const p = { x, y };
    if (pathKeys.has(key(p)) || grid[y][x] !== 'grass') continue;
    grid[y][x] = 'flower';
    decor++;
  }

  return { biome, grid, encounters, required, start: path[0] };
}

const BLOCKED: TileType[] = ['tree', 'water'];

// Shortest walkable route from start to goal (BFS on the tile grid),
// used for tap-to-walk. Returns the steps AFTER start, or null if no
// route exists.
function bfsPath(start: Pt, goal: Pt, grid: TileType[][]): Pt[] | null {
  const key = (p: Pt) => `${p.x},${p.y}`;
  if (goal.x < 0 || goal.x >= W || goal.y < 0 || goal.y >= H) return null;
  if (BLOCKED.includes(grid[goal.y][goal.x])) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const visited = new Set([key(start)]);
  const prev = new Map<string, Pt>();
  const queue: Pt[] = [start];
  let found = false;
  while (queue.length && !found) {
    const cur = queue.shift()!;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const nk = `${nx},${ny}`;
      if (visited.has(nk) || BLOCKED.includes(grid[ny][nx])) continue;
      visited.add(nk);
      prev.set(nk, cur);
      if (nx === goal.x && ny === goal.y) { found = true; break; }
      queue.push({ x: nx, y: ny });
    }
  }
  if (!found) return null;
  const path: Pt[] = [];
  let curKey = key(goal), curPt = goal;
  while (curKey !== key(start)) {
    path.unshift(curPt);
    const p = prev.get(curKey);
    if (!p) return null;
    curPt = p; curKey = key(p);
  }
  return path;
}

export default function JourneyPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'starter' | 'walking' | 'rustle' | 'memoryShow' | 'battle' | 'capturing' | 'done'>('intro');
  const [world, setWorld] = useState<ReturnType<typeof buildWorld> | null>(null);
  const [player, setPlayer] = useState<Pt>({ x: 1, y: H - 2 });
  const [facing, setFacing] = useState<Facing>('front');
  const [isWalking, setIsWalking] = useState(false);
  const [party, setParty] = useState<string[]>([]);
  const [activeTile, setActiveTile] = useState<string | null>(null);
  const [dialog, setDialog] = useState('Walk into the tall grass 🌾 to meet a wild friend!');
  const [shakeBox, setShakeBox] = useState(false);
  const [caughtCreature, setCaughtCreature] = useState<string | null>(null);
  const [showParty, setShowParty] = useState(false);
  const [pendingTile, setPendingTile] = useState<string | null>(null);

  const movingRef = useRef(false);
  const wrongRef = useRef(0);
  const stepsRef = useRef(0);
  const startedRef = useRef(0);
  // Kept in sync with state so the tap-to-walk step loop (which fires
  // from setTimeout chains) always reads the CURRENT position/phase/
  // world instead of a stale one captured when the walk began.
  const playerRef = useRef<Pt>({ x: 1, y: H - 2 });
  const phaseRef = useRef(phase);
  const worldRef = useRef<ReturnType<typeof buildWorld> | null>(null);
  const pathQueueRef = useRef<Pt[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  // The game canvas measures itself so it can fill the entire screen —
  // any phone, tablet or window size — rather than a fixed tile count.
  const [screenSize, setScreenSize] = useState({ w: 360, h: 640 });

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { worldRef.current = world; }, [world]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setScreenSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  useEffect(() => { setLevel(nextGameLevel('journey')); }, []);

  const beginWorld = useCallback((starter?: string) => {
    const w = buildWorld(tier, level);
    worldRef.current = w;
    playerRef.current = w.start;
    pathQueueRef.current = [];
    movingRef.current = false;
    setWorld(w);
    setPlayer(w.start);
    setParty(starter ? [starter] : []);
    setActiveTile(null);
    setCaughtCreature(null);
    wrongRef.current = 0; stepsRef.current = 0; startedRef.current = Date.now();
    setDialog(`Welcome to the ${w.biome.name}! Walk into the tall grass 🌾 to meet a wild friend!`);
    setPhase('walking');
  }, [tier, level]);

  const startLevel = useCallback(() => {
    if (level === 1) setPhase('starter');
    else beginWorld();
  }, [level, beginWorld]);

  const tryFinish = useCallback((x: number, y: number) => {
    if (!world) return;
    if (party.length >= world.required) {
      const totalMs = Date.now() - startedRef.current;
      logQuestMetric('processing', 'journey', { level, friends: world.required, wrongAnswers: wrongRef.current, steps: stepsRef.current, totalMs });
      awardStarlight(Math.max(10, 16 + level * 2 - wrongRef.current * 2));
      recordGameLevel('journey', level);
      sfx.fanfare();
      setPhase('done');
    } else {
      setDialog(`The flag needs more friends! ${world.required - party.length} still hiding in the tall grass 🌾…`);
    }
  }, [world, party.length, level]);

  const tryFinishRef = useRef(tryFinish);
  useEffect(() => { tryFinishRef.current = tryFinish; }, [tryFinish]);

  // Single-tile step. Reads position/phase/world from refs so it stays
  // correct when called repeatedly from a setTimeout chain (tap-to-walk)
  // rather than only from a single fresh render (D-pad/keyboard).
  const move = useCallback((dx: number, dy: number) => {
    const w = worldRef.current;
    if (phaseRef.current !== 'walking' || movingRef.current || !w) return;
    const cur = playerRef.current;
    const nx = cur.x + dx, ny = cur.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;
    if (BLOCKED.includes(w.grid[ny][nx])) return;
    movingRef.current = true;
    stepsRef.current += 1;
    sfx.step();
    playerRef.current = { x: nx, y: ny };
    setPlayer({ x: nx, y: ny });
    setFacing(dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'back' : 'front');
    setIsWalking(true);
    setTimeout(() => {
      movingRef.current = false;
      setIsWalking(false);
      const t = w.grid[ny][nx];
      const k = `${nx},${ny}`;
      if (t === 'tallgrass' && w.encounters[k] && !w.encounters[k].solved) {
        pathQueueRef.current = []; // an encounter always interrupts a tap-to-walk route
        setPendingTile(k);
        setPhase('rustle');
        setTimeout(() => {
          setActiveTile(k);
          sfx.encounter();
          const ch = w.encounters[k].challenge;
          setDialog(`A wild ${ch.creature} appeared!`);
          if (ch.type === 'memory') {
            setPhase('memoryShow');
            setTimeout(() => setPhase('battle'), 2400);
          } else {
            setPhase('battle');
          }
        }, 650);
      } else if (t === 'flag') {
        pathQueueRef.current = [];
        tryFinishRef.current(nx, ny);
      }
    }, 150);
  }, []);

  // Walks the queued route one tile at a time, re-checking phase/position
  // fresh from refs before every step so an encounter or the level ending
  // cleanly stops the walk.
  const stepQueue = useCallback(() => {
    if (phaseRef.current !== 'walking' || movingRef.current) { pathQueueRef.current = []; return; }
    const next = pathQueueRef.current.shift();
    if (!next) return;
    const cur = playerRef.current;
    move(next.x - cur.x, next.y - cur.y);
    setTimeout(stepQueue, 210);
  }, [move]);

  const walkTo = useCallback((tx: number, ty: number) => {
    const w = worldRef.current;
    if (phaseRef.current !== 'walking' || movingRef.current || !w) return;
    const path = bfsPath(playerRef.current, { x: tx, y: ty }, w.grid);
    if (!path || !path.length) return;
    pathQueueRef.current = path;
    stepQueue();
  }, [stepQueue]);

  function onViewportClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + offsetX;
    const clickY = e.clientY - rect.top + offsetY;
    walkTo(Math.floor(clickX / TILE), Math.floor(clickY / TILE));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phaseRef.current !== 'walking') return;
      pathQueueRef.current = []; // a manual key press cancels any tap-to-walk route
      if (['ArrowUp', 'w', 'W'].includes(e.key)) move(0, -1);
      else if (['ArrowDown', 's', 'S'].includes(e.key)) move(0, 1);
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) move(-1, 0);
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) move(1, 0);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  function answer(opt: { label: string; correct: boolean }, challenge: Challenge) {
    if (phase !== 'battle' || !activeTile || !world) return;
    if (opt.correct) {
      logQuestMetric(DOMAIN[challenge.type], `journey-${challenge.type}`, { level });
      sfx.catch_();
      setPhase('capturing');
      setCaughtCreature(challenge.creature);
      setTimeout(() => {
        world.encounters[activeTile].solved = true;
        setParty(p => [...p, challenge.creature]);
        setWorld({ ...world, grid: world.grid.map((row, y) => row.map((t, x) => {
          const [ex, ey] = activeTile.split(',').map(Number);
          return x === ex && y === ey ? 'path' : t;
        })) });
        setActiveTile(null);
        setCaughtCreature(null);
        setDialog(party.length + 1 >= world.required ? 'That was the last friend — head for the flag! 🚩' : 'Onward! More friends may be hiding in the grass…');
        setPhase('walking');
      }, 1500);
    } else {
      wrongRef.current += 1;
      sfx.wrong();
      setShakeBox(true);
      setTimeout(() => setShakeBox(false), 400);
      const hint = challenge.type === 'count' ? 'Count one by one with your finger, then try again!'
        : challenge.type === 'memory' ? 'Try to remember who was missing… look again!'
        : challenge.type === 'word' ? 'Sound it out slowly… try again!'
        : 'Look closely and try again!';
      setDialog(hint);
    }
  }

  const activeEncounter = activeTile && world ? world.encounters[activeTile] : null;
  // The floating dialog/hint bar (plus the D-pad above it) occupies the
  // bottom of the screen — bias the camera so Kailia stays visible above
  // that reserved strip instead of centered dead-in-the-middle.
  const BOTTOM_UI_RESERVE = 190;
  const maxOffX = Math.max(0, W * TILE - screenSize.w);
  const maxOffY = Math.max(0, H * TILE - screenSize.h);
  const offsetX = Math.max(0, Math.min(maxOffX, player.x * TILE - screenSize.w / 2 + TILE / 2));
  const offsetY = Math.max(0, Math.min(maxOffY, player.y * TILE - (screenSize.h - BOTTOM_UI_RESERVE) / 2 + TILE / 2));

  return (
    <main className="fixed inset-0 overflow-hidden" style={{ background: '#0f172a' }}>
      <style>{`
        @keyframes kwiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
        @keyframes kshrink{0%{transform:scale(1);opacity:1}100%{transform:scale(0.15);opacity:0.9}}
      `}</style>

      {(phase === 'intro' || phase === 'starter') && (
        <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {phase === 'intro' && (
              <div className="text-center bounce-in">
                <div className="flex items-end justify-center gap-1 mb-4">
                  <PandaSprite size={128} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
                  <KailiaSprite size={96} expression="excited" className="float" />
                </div>
                <div className="inline-block px-4 py-1 rounded-full text-xs font-extrabold tracking-wide mb-3"
                  style={{ background: '#1a1a2e', color: '#FDE047', border: '2px solid #FDE047' }}>
                  ⟨ REGION {level} ⟩ {BIOMES[(level - 1) % BIOMES.length].name.toUpperCase()}
                </div>
                <div className="rounded-3xl p-6 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <p className="text-gray-700 text-lg leading-relaxed mb-3">A brand-new world stretches ahead! 🗺️</p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Walk Kailia through <strong>{BIOMES[(level - 1) % BIOMES.length].name}</strong> — just tap
                    anywhere on the map to walk there! Step into patches of <strong>tall grass 🌾</strong> to meet
                    wild creatures — solve their riddle to catch them, then lead your new friends to the flag! 🚩
                  </p>
                </div>
                <button onClick={startLevel}
                  className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                  Enter the world! 🌍
                </button>
                <SkillIntro gameId="journey" />
                <Link href="/play" className="block mt-4 text-sm font-bold text-slate-400">← Back to the map</Link>
              </div>
            )}

            {phase === 'starter' && (
              <div className="text-center bounce-in">
                <PandaSprite size={80} expression="excited" className="mx-auto float mb-3" />
                <div className="rounded-3xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <p className="text-gray-800 font-extrabold text-lg mb-1">Before you set out…</p>
                  <p className="text-gray-700 text-base font-bold">Every explorer starts with one true partner. Who will it be?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {STARTERS.map(s => (
                    <button key={s.name} onClick={() => beginWorld(s.emoji)}
                      className="rounded-2xl p-3 shadow-xl transition-transform hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #1a1a2e' }}>
                      <div className="flex justify-center mb-1"><Critter emoji={s.emoji} size={48} /></div>
                      <span className="block text-sm font-extrabold text-slate-900">{s.name}</span>
                      <span className="block text-[10px] text-slate-500 leading-snug mt-1">{s.blurb}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── The world — fills the entire screen ── */}
      {phase !== 'intro' && phase !== 'starter' && world && (
        <>
          <div ref={viewportRef} onClick={phase === 'walking' ? onViewportClick : undefined}
            className="absolute inset-0 select-none"
            style={{ background: world.biome.sky, cursor: phase === 'walking' ? 'pointer' : 'default' }}>
            <div className="absolute" style={{ width: W * TILE, height: H * TILE, transform: `translate(${-offsetX}px, ${-offsetY}px)`, transition: 'transform 150ms linear' }}>
              {world.grid.map((row, y) => row.map((t, x) => {
                const isEnc = world.encounters[`${x},${y}`];
                let bg = world.biome.ground;
                if (t === 'path') bg = world.biome.path;
                if (t === 'tallgrass') bg = world.biome.tallgrassBg;
                if (t === 'flag') bg = world.biome.path;
                let emoji = '';
                if (t === 'tree' || t === 'water') emoji = t === 'tree' ? world.biome.obstacles[0] : world.biome.obstacles[1];
                if (t === 'flower') emoji = pick(world.biome.decor);
                if (t === 'tallgrass' && isEnc && !isEnc.solved) emoji = '🌾';
                if (t === 'flag') emoji = '🚩';
                return (
                  <div key={`${x}-${y}`} className="absolute flex items-center justify-center"
                    style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE, background: bg,
                      outline: '1px solid rgba(0,0,0,0.04)', fontSize: TILE * 0.62 }}>
                    {emoji}
                  </div>
                );
              }))}
              <div className="absolute flex items-center justify-center" style={{
                left: player.x * TILE, top: player.y * TILE, width: TILE, height: TILE,
                transition: 'left 150ms linear, top 150ms linear', zIndex: 5,
              }}>
                <div style={{ transform: 'translateY(-6px)' }}>
                  <OverworldSprite character="kailia" facing={facing} walking={isWalking} size={TILE * 1.15} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Floating header, on top of the world ── */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 pt-3 pb-6 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)' }}>
            <Link href="/play" className="text-sm font-bold text-white drop-shadow pointer-events-auto">← Map</Link>
            <h1 className="text-lg font-extrabold text-white drop-shadow">
              🗺️ Kailia&apos;s Journey <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.2)', border: '1px solid rgba(253,224,71,0.5)' }}>Lv {level}</span>
            </h1>
            <button onClick={() => setShowParty(true)} className="text-xs font-bold text-emerald-300 drop-shadow pointer-events-auto">
              🎒 {party.length}/{world.required}
            </button>
          </div>

          {/* ── Floating mini D-pad, inside the screen (tap-to-walk still works everywhere else) ── */}
          {phase === 'walking' && (
            <div className="absolute z-10" style={{ right: 12, bottom: 200 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gridTemplateRows: 'repeat(3, 36px)', gap: 3 }}>
                <div />
                <button onClick={() => move(0, -1)} className="rounded-lg text-base font-extrabold text-white active:scale-90 transition-transform" style={{ background: 'rgba(15,23,42,0.55)', border: '1.5px solid rgba(255,255,255,0.3)' }}>⬆️</button>
                <div />
                <button onClick={() => move(-1, 0)} className="rounded-lg text-base font-extrabold text-white active:scale-90 transition-transform" style={{ background: 'rgba(15,23,42,0.55)', border: '1.5px solid rgba(255,255,255,0.3)' }}>⬅️</button>
                <div />
                <button onClick={() => move(1, 0)} className="rounded-lg text-base font-extrabold text-white active:scale-90 transition-transform" style={{ background: 'rgba(15,23,42,0.55)', border: '1.5px solid rgba(255,255,255,0.3)' }}>➡️</button>
                <div />
                <button onClick={() => move(0, 1)} className="rounded-lg text-base font-extrabold text-white active:scale-90 transition-transform" style={{ background: 'rgba(15,23,42,0.55)', border: '1.5px solid rgba(255,255,255,0.3)' }}>⬇️</button>
                <div />
              </div>
            </div>
          )}

          {/* ── Floating Noel dialog + tap hint, pinned to the bottom of the world ── */}
          {phase === 'walking' && (
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pt-8"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent)' }}>
              <div className="flex items-center gap-3">
                <PandaSprite size={50} expression="happy" style={{ flexShrink: 0 }} />
                <div className="rounded-2xl px-4 py-3 text-lg font-extrabold leading-snug text-gray-900 bg-white relative shadow-lg">
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' }} />
                  {dialog}
                </div>
              </div>
              <p className="text-center text-base font-extrabold text-white mt-2 drop-shadow-lg">
                👆 Tap anywhere to walk there!
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Grass-rustle transition ── */}
      {phase === 'rustle' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: '#1a1a2e' }}>
          <div className="text-center">
            <span className="block text-6xl shake" style={{ animationIterationCount: 'infinite' }}>🌾</span>
            <p className="mt-3 font-extrabold text-lg" style={{ color: '#FDE047', fontFamily: '"Courier New", monospace' }}>
              The grass rustles…
            </p>
          </div>
        </div>
      )}

      {/* ── Memory reveal: show the full lineup before one disappears ── */}
      {phase === 'memoryShow' && activeEncounter && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: '#1a1a2e' }}>
          <div className="text-center px-6">
            <p className="font-extrabold text-lg mb-4" style={{ color: '#FDE047', fontFamily: '"Courier New", monospace' }}>
              👀 Look closely — remember everyone here!
            </p>
            <div className="bounce-in flex gap-3 justify-center flex-wrap">
              {activeEncounter.challenge.memoryFull?.map((c, i) => (
                <Critter key={i} emoji={c} size={64} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Party / Pokédex viewer ── */}
      {showParty && world && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowParty(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 bounce-in" style={{ background: '#fdfdf8', border: '4px solid #1a1a2e' }} onClick={e => e.stopPropagation()}>
            <p className="font-extrabold text-lg mb-1" style={{ color: '#1a1a2e', fontFamily: '"Courier New", monospace' }}>🎒 Your Party</p>
            <p className="text-xs text-slate-500 mb-3">{party.length} of {world.required} friends caught in {world.biome.name}</p>
            {party.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No friends yet — find them in the tall grass 🌾!</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {party.map((p, i) => (
                  <div key={i} className="rounded-xl flex items-center justify-center" style={{ aspectRatio: '1', background: '#f1f5f9', border: '2px solid #1a1a2e' }}>
                    <Critter emoji={p} size={40} />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, world.required - party.length) }).map((_, i) => (
                  <div key={`e${i}`} className="rounded-xl flex items-center justify-center text-2xl text-slate-300" style={{ aspectRatio: '1', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>?</div>
                ))}
              </div>
            )}
            <button onClick={() => setShowParty(false)} className="mt-4 w-full py-2.5 rounded-full font-bold text-sm text-slate-500" style={{ border: '2px solid #cbd5e1' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Retro battle overlay ── */}
      {(phase === 'battle' || phase === 'capturing') && activeEncounter && world && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" style={{ background: world.biome.sky }}>
          {/* battle stage */}
          <div className="flex-1 relative">
            <div className="absolute" style={{ right: '14%', top: '18%' }}>
              <div className={phase === 'capturing' ? '' : 'float'}
                style={{ animation: phase === 'capturing' ? 'kshrink 0.5s ease-in forwards, kwiggle 0.4s ease-in-out 0.5s 3' : undefined }}>
                <Critter emoji={activeEncounter.challenge.creature} size={96} />
              </div>
            </div>
            <div className="absolute" style={{ left: '10%', bottom: '8%' }}>
              <KailiaSprite size={70} expression={phase === 'capturing' ? 'celebrating' : 'thinking'} />
            </div>
            {phase === 'capturing' && (
              <div className="absolute text-center" style={{ right: '18%', top: '30%' }}>
                <span className="block text-3xl pop">✨ Gotcha!</span>
              </div>
            )}
          </div>

          {/* Game-Boy-style dialog box */}
          <div className={`mx-3 mb-3 rounded-lg p-4 ${shakeBox ? 'shake' : ''}`}
            style={{ background: '#fdfdf8', border: '4px solid #1a1a2e', boxShadow: '0 -4px 0 rgba(0,0,0,0.15) inset' }}>
            <p style={{ fontFamily: '"Courier New", monospace', fontSize: 19, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.5 }}>
              {phase === 'capturing'
                ? `Gotcha! ${activeEncounter.challenge.creature} was caught!`
                : dialog}
            </p>

            {phase === 'battle' && (
              <>
                {activeEncounter.challenge.memoryCast && (
                  <>
                    <p className="text-center text-xs font-bold" style={{ color: '#64748b', fontFamily: '"Courier New", monospace' }}>Still here:</p>
                    <div className="flex gap-2 justify-center my-1 flex-wrap">
                      {activeEncounter.challenge.memoryCast.map((c, i) => (
                        <Critter key={i} emoji={c} size={40} />
                      ))}
                    </div>
                  </>
                )}
                {activeEncounter.challenge.display && (
                  <p className="text-center my-2 font-extrabold" style={{ fontSize: 30, color: '#1a1a2e', fontFamily: '"Courier New", monospace' }}>
                    {activeEncounter.challenge.display}
                  </p>
                )}
                <p style={{ fontFamily: '"Courier New", monospace', fontSize: 15, fontWeight: 700, color: '#334155', marginTop: 6, marginBottom: 4 }}>{activeEncounter.challenge.ask}</p>
                <div className="rounded-md overflow-hidden mt-1" style={{ border: '3px solid #1a1a2e' }}>
                  {activeEncounter.challenge.options.map((o, i) => (
                    <button key={i} data-correct={o.correct} onClick={() => answer(o, activeEncounter.challenge)}
                      className="w-full text-left px-3 py-2 transition-colors hover:bg-slate-100 active:bg-slate-200 flex items-center gap-2"
                      style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 700, color: '#1a1a2e',
                        borderBottom: i < activeEncounter.challenge.options.length - 1 ? '2px solid #1a1a2e' : 'none', background: '#fdfdf8' }}>
                      <span>▶</span>
                      {(activeEncounter.challenge.type === 'memory' || activeEncounter.challenge.type === 'word')
                        ? <Critter emoji={o.label} size={32} animate={false} />
                        : <span>{o.label}</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && world && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0f172aee, #334155ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">🚩</span>
            <div className="flex items-end justify-center gap-2 mb-2">
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="flex gap-2 justify-center flex-wrap mb-2">
              {party.map((p, i) => <Critter key={i} emoji={p} size={44} />)}
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">You crossed {world.biome.name}!</h2>
            <p className="text-slate-200 font-semibold mb-1">{party.length} new friends joined your journey! 🐾</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(10, 16 + level * 2 - wrongRef.current * 2)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { const nl = level + 1; setLevel(nl); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Next world ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
