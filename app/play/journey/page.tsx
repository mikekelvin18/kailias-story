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

// ─── Kailia's Journey ─────────────────────────────────────────────────────────
// An old-school, Game-Boy-style top-down overworld: a tile grid, a camera
// that follows Kailia, free walking with a D-pad or arrow keys, and
// patches of tall grass that trigger a wild encounter — an authentic
// black-bordered dialog box, a menu of answers, and a Poké-ball-style
// capture animation. Every creature poses a different mini challenge
// (counting, memory, color matching, feelings, words) tied to its own
// skill domain. Four biomes cycle level to level — a real world to walk.

const W = 12, H = 10;           // map size, tiles
const TILE = 34;                // px per tile
const VIEWW = 8, VIEWH = 7;     // viewport size, tiles

type TileType = 'grass' | 'path' | 'tallgrass' | 'tree' | 'water' | 'flower' | 'flag';
type ChType = 'count' | 'memory' | 'color' | 'feeling' | 'word';

interface Pt { x: number; y: number; }
interface Challenge {
  type: ChType; creature: string; ask: string; display: string;
  options: { label: string; correct: boolean }[];
  memoryCast?: string[];
}
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

const CREATURES: Record<ChType, string[]> = {
  count: ['🐉', '🐲'], memory: ['🦉', '🦝'], color: ['🦜', '🦚'], feeling: ['🐰', '🐨'], word: ['🦌', '🦢'],
};
// The three starter partners offered on a brand-new journey — same names
// as the companions unlocked by starlight, tying the two systems together.
const STARTERS = [
  { emoji: '🐢', name: 'Shelly', blurb: 'Slow and steady — never rattled.' },
  { emoji: '🦊', name: 'Flick', blurb: 'Quick, clever, always curious.' },
  { emoji: '🦉', name: 'Sage', blurb: 'Wise eyes that notice everything.' },
];
const GEMS = ['💎', '🔮', '🟡', '🍓'];
const COLOR_SET = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const FEELINGS: [string, boolean][] = [['🎂🎈', true], ['💔🧸', false], ['🍦☀️', true], ['🌧️⚽', false], ['🎁🎀', true], ['🤕🩹', false]];
const WORDS: [string, string, string[]][] = [
  ['cat', '🐱', ['🐶', '🍎']], ['sun', '☀️', ['🌙', '🐟']], ['dog', '🐶', ['🐱', '⭐']],
  ['fish', '🐟', ['🐦', '🍪']], ['star', '⭐', ['🌸', '🐢']], ['bee', '🐝', ['🦋', '🍞']],
];
const MEMORY_POOL = ['🦊', '🐸', '🦋', '🐢', '🐿️', '🦔', '🐝'];
const DOMAIN: Record<ChType, string> = { count: 'math', memory: 'processing', color: 'sensory', feeling: 'communication', word: 'reading' };

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function makeChallenge(i: number, tier: string): Challenge {
  const types: ChType[] = tier === 'tiny' ? ['count', 'color', 'memory', 'feeling'] : ['count', 'memory', 'word', 'color', 'feeling'];
  const type = types[i % types.length];
  const creature = pick(CREATURES[type]);
  if (type === 'count') {
    const max = tier === 'tiny' ? 4 : tier === 'small' ? 6 : 9;
    const n = 2 + Math.floor(Math.random() * (max - 1));
    let wrong = n + pick([-1, 1, 2]); if (wrong < 1 || wrong === n) wrong = n + 1;
    let wrong2 = n + pick([-2, 2, 3]); if (wrong2 < 1 || wrong2 === n || wrong2 === wrong) wrong2 = n + 3;
    return { type, creature, ask: 'How many gems do I have?', display: pick(GEMS).repeat(n),
      options: shuffle([{ label: String(n), correct: true }, { label: String(wrong), correct: false }, { label: String(wrong2), correct: false }]) };
  }
  if (type === 'memory') {
    const cast = shuffle(MEMORY_POOL).slice(0, tier === 'big' ? 4 : 3);
    const hidden = pick(cast);
    const others = shuffle(MEMORY_POOL.filter(m => !cast.includes(m))).slice(0, 2);
    return { type, creature, ask: 'Someone snuck away — who was it?', display: '', memoryCast: cast,
      options: shuffle([{ label: hidden, correct: true }, ...others.map(o => ({ label: o, correct: false }))]) };
  }
  if (type === 'color') {
    const c = pick(COLOR_SET);
    const others = shuffle(COLOR_SET.filter(x => x !== c)).slice(0, 2);
    return { type, creature, ask: "Find my gem's twin color!", display: c,
      options: shuffle([{ label: c, correct: true }, ...others.map(o => ({ label: o, correct: false }))]) };
  }
  if (type === 'feeling') {
    const [scene, happy] = pick(FEELINGS);
    return { type, creature, ask: 'How would that feel?', display: scene,
      options: shuffle([{ label: '😊', correct: happy }, { label: '😢', correct: !happy }]) };
  }
  const [word, right, wrongs] = pick(WORDS);
  return { type, creature, ask: `Which picture says "${word}"?`, display: word,
    options: shuffle([{ label: right, correct: true }, ...wrongs.map(w => ({ label: w, correct: false }))]) };
}

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

  // sprinkle obstacles & decor off the path
  let placed = 0, guard = 0;
  while (placed < 10 && guard++ < 300) {
    const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2));
    const p = { x, y };
    if (pathKeys.has(key(p))) continue;
    if (Math.abs(x - 1) + Math.abs(y - (H - 2)) < 2) continue; // clear near start
    grid[y][x] = Math.random() < 0.6 ? 'tree' : 'water';
    placed++;
  }
  let decor = 0; guard = 0;
  while (decor < 6 && guard++ < 200) {
    const x = 1 + Math.floor(Math.random() * (W - 2)), y = 1 + Math.floor(Math.random() * (H - 2));
    const p = { x, y };
    if (pathKeys.has(key(p)) || grid[y][x] !== 'grass') continue;
    grid[y][x] = 'flower';
    decor++;
  }

  return { biome, grid, encounters, required, start: path[0] };
}

const BLOCKED: TileType[] = ['tree', 'water'];

export default function JourneyPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'starter' | 'walking' | 'rustle' | 'battle' | 'capturing' | 'done'>('intro');
  const [world, setWorld] = useState<ReturnType<typeof buildWorld> | null>(null);
  const [player, setPlayer] = useState<Pt>({ x: 1, y: H - 2 });
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

  useEffect(() => { setLevel(nextGameLevel('journey')); }, []);

  const beginWorld = useCallback((starter?: string) => {
    const w = buildWorld(tier, level);
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

  const tileAt = useCallback((x: number, y: number): TileType => {
    if (!world || x < 0 || x >= W || y < 0 || y >= H) return 'tree';
    return world.grid[y][x];
  }, [world]);

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

  const move = useCallback((dx: number, dy: number) => {
    if (phase !== 'walking' || movingRef.current || !world) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) return;
    if (BLOCKED.includes(tileAt(nx, ny))) return;
    movingRef.current = true;
    stepsRef.current += 1;
    sfx.step();
    setPlayer({ x: nx, y: ny });
    setTimeout(() => {
      movingRef.current = false;
      const t = tileAt(nx, ny);
      const k = `${nx},${ny}`;
      if (t === 'tallgrass' && world.encounters[k] && !world.encounters[k].solved) {
        setPendingTile(k);
        setPhase('rustle');
        setTimeout(() => {
          setActiveTile(k);
          sfx.encounter();
          setDialog(`A wild ${world.encounters[k].challenge.creature} appeared!`);
          setPhase('battle');
        }, 650);
      } else if (t === 'flag') {
        tryFinish(nx, ny);
      }
    }, 150);
  }, [phase, player, world, tileAt, tryFinish]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== 'walking') return;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) move(0, -1);
      else if (['ArrowDown', 's', 'S'].includes(e.key)) move(0, 1);
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) move(-1, 0);
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) move(1, 0);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, move]);

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
        : challenge.type === 'memory' ? 'Picture who was standing there… try again!'
        : challenge.type === 'word' ? 'Sound it out slowly… try again!'
        : 'Look closely and try again!';
      setDialog(hint);
    }
  }

  const activeEncounter = activeTile && world ? world.encounters[activeTile] : null;
  const offsetX = Math.max(0, Math.min((W - VIEWW) * TILE, player.x * TILE - (VIEWW * TILE) / 2 + TILE / 2));
  const offsetY = Math.max(0, Math.min((H - VIEWH) * TILE, player.y * TILE - (VIEWH * TILE) / 2 + TILE / 2));

  return (
    <main className="min-h-screen pb-6" style={{ background: '#0f172a' }}>
      <style>{`
        @keyframes kwiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-14deg)}75%{transform:rotate(14deg)}}
        @keyframes kshrink{0%{transform:scale(1);opacity:1}100%{transform:scale(0.15);opacity:0.9}}
      `}</style>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-slate-300">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🗺️ Kailia&apos;s Journey <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {world && phase !== 'intro' && phase !== 'starter' ? (
            <button onClick={() => setShowParty(true)} className="text-xs font-bold text-emerald-300 w-16 text-right">
              🎒 {party.length}/{world.required}
            </button>
          ) : <span className="w-16" />}
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={90} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={110} expression="excited" className="float" />
            </div>
            <div className="inline-block px-4 py-1 rounded-full text-xs font-extrabold tracking-wide mb-3"
              style={{ background: '#1a1a2e', color: '#FDE047', border: '2px solid #FDE047' }}>
              ⟨ REGION {level} ⟩ {BIOMES[(level - 1) % BIOMES.length].name.toUpperCase()}
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">A brand-new world stretches ahead! 🗺️</p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Walk Kailia through <strong>{BIOMES[(level - 1) % BIOMES.length].name}</strong> with the arrows below.
                Step into patches of <strong>tall grass 🌾</strong> to meet wild creatures — solve their riddle to
                catch them, then lead your new friends to the flag! 🚩
              </p>
            </div>
            <button onClick={startLevel}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Enter the world! 🌍
            </button>
            <SkillIntro gameId="journey" />
          </div>
        )}

        {phase === 'starter' && (
          <div className="text-center mt-6 bounce-in">
            <PandaSprite size={80} expression="excited" className="mx-auto float mb-3" />
            <div className="rounded-3xl p-5 mx-2 mb-4" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-800 font-extrabold text-lg mb-1">Before you set out…</p>
              <p className="text-gray-600 text-sm">Every explorer starts with one true partner. Who will it be?</p>
            </div>
            <div className="grid grid-cols-3 gap-3 px-2">
              {STARTERS.map(s => (
                <button key={s.name} onClick={() => beginWorld(s.emoji)}
                  className="rounded-2xl p-3 shadow-xl transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #1a1a2e' }}>
                  <span className="block text-4xl mb-1">{s.emoji}</span>
                  <span className="block text-sm font-extrabold text-slate-900">{s.name}</span>
                  <span className="block text-[10px] text-slate-500 leading-snug mt-1">{s.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase !== 'intro' && world && (
          <>
            <div className="relative mx-auto rounded-2xl overflow-hidden select-none"
              style={{ width: VIEWW * TILE, height: VIEWH * TILE, border: '4px solid #1a1a2e', boxShadow: '0 6px 20px rgba(0,0,0,0.5)', background: world.biome.sky }}>
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
                {/* party trailing marker (just a count badge near player, drawn below) */}
                <div className="absolute flex items-center justify-center" style={{
                  left: player.x * TILE, top: player.y * TILE, width: TILE, height: TILE,
                  transition: 'left 150ms linear, top 150ms linear', zIndex: 5,
                }}>
                  <div style={{ transform: 'translateY(-6px)' }}><KailiaSprite size={TILE * 0.95} expression="happy" /></div>
                </div>
              </div>
            </div>

            {/* D-pad */}
            {phase === 'walking' && (
              <div className="flex items-center justify-center mt-4" style={{ gap: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gridTemplateRows: 'repeat(3, 52px)', gap: 4 }}>
                  <div />
                  <button onClick={() => move(0, -1)} className="rounded-xl text-xl font-extrabold text-white active:scale-90 transition-transform" style={{ background: '#1e293b', border: '2px solid #475569' }}>⬆️</button>
                  <div />
                  <button onClick={() => move(-1, 0)} className="rounded-xl text-xl font-extrabold text-white active:scale-90 transition-transform" style={{ background: '#1e293b', border: '2px solid #475569' }}>⬅️</button>
                  <div className="rounded-xl" style={{ background: '#0f172a' }} />
                  <button onClick={() => move(1, 0)} className="rounded-xl text-xl font-extrabold text-white active:scale-90 transition-transform" style={{ background: '#1e293b', border: '2px solid #475569' }}>➡️</button>
                  <div />
                  <button onClick={() => move(0, 1)} className="rounded-xl text-xl font-extrabold text-white active:scale-90 transition-transform" style={{ background: '#1e293b', border: '2px solid #475569' }}>⬇️</button>
                  <div />
                </div>
              </div>
            )}

            {/* party roster */}
            {party.length > 0 && phase !== 'battle' && phase !== 'capturing' && (
              <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
                {party.map((p, i) => <span key={i} className="text-2xl">{p}</span>)}
              </div>
            )}

            {/* Noel dialog bar (overworld) */}
            {phase === 'walking' && (
              <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                <PandaSprite size={44} expression="happy" style={{ flexShrink: 0 }} />
                <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                  {dialog}
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                  <div key={i} className="rounded-xl flex items-center justify-center text-3xl" style={{ aspectRatio: '1', background: '#f1f5f9', border: '2px solid #1a1a2e' }}>{p}</div>
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
              <span className={`block ${phase === 'capturing' ? '' : 'float'}`}
                style={{ fontSize: 84, animation: phase === 'capturing' ? 'kshrink 0.5s ease-in forwards, kwiggle 0.4s ease-in-out 0.5s 3' : undefined }}>
                {activeEncounter.challenge.creature}
              </span>
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
            <p style={{ fontFamily: '"Courier New", monospace', fontSize: 15, color: '#1a1a2e', lineHeight: 1.5 }}>
              {phase === 'capturing'
                ? `Gotcha! ${activeEncounter.challenge.creature} was caught!`
                : dialog}
            </p>

            {phase === 'battle' && (
              <>
                {activeEncounter.challenge.memoryCast && (
                  <p className="text-center my-2" style={{ fontSize: 34, letterSpacing: 6 }}>{activeEncounter.challenge.memoryCast.join('')}</p>
                )}
                {activeEncounter.challenge.display && (
                  <p className="text-center my-2 font-extrabold" style={{ fontSize: 30, color: '#1a1a2e', fontFamily: '"Courier New", monospace' }}>
                    {activeEncounter.challenge.display}
                  </p>
                )}
                <p style={{ fontFamily: '"Courier New", monospace', fontSize: 12, color: '#64748b', marginTop: 6, marginBottom: 4 }}>{activeEncounter.challenge.ask}</p>
                <div className="rounded-md overflow-hidden mt-1" style={{ border: '3px solid #1a1a2e' }}>
                  {activeEncounter.challenge.options.map((o, i) => (
                    <button key={i} data-correct={o.correct} onClick={() => answer(o, activeEncounter.challenge)}
                      className="w-full text-left px-3 py-2 transition-colors hover:bg-slate-100 active:bg-slate-200"
                      style={{ fontFamily: '"Courier New", monospace', fontSize: 16, fontWeight: 700, color: '#1a1a2e',
                        borderBottom: i < activeEncounter.challenge.options.length - 1 ? '2px solid #1a1a2e' : 'none', background: '#fdfdf8' }}>
                      ▶ {o.label}
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
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <p style={{ fontSize: 34, letterSpacing: 6 }} className="mb-2">{party.join('')}</p>
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
