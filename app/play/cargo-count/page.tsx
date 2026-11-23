'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { GameBackdrop, GameFinish, GameIntro, GOLD, PlayButton, SoftButton, GoArrow } from '@/components/games/GameFrame';
import LevelPath from '@/components/LevelPath';
import SpaceScene from '@/components/games/SpaceScene';
import KailiaActor from '@/components/games/KailiaActor';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime, tones } from '@/components/friends/voice';
import { shuffled } from '@/lib/shuffle';
import { levelStories } from '@/lib/variety';
import { logQuestMetric } from '@/lib/metrics';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, levelStarlight, nextGameLevel, recordGameLevel } from '@/lib/rewards';

// ─── Cargo Count (Space Outpost) ──────────────────────────────────────────────
// Its own game, not a re-skin (Muse round 5): the space crew orders an
// exact amount of cargo, and the child beams drifting cargo boxes into
// the rocket's hold until the hold matches the order, then launches.
// Early levels: every box is 1 (one-to-one counting to a target). Then
// boxes of 2, then 5, then 10 arrive, so the same game climbs from
// counting into making a number from parts (composing, counting on,
// place value). A box in the hold can be tapped to send it back, so an
// overshoot is fixed, never failed. Measured quietly: first-try
// launches, launches needed, and time per order.

interface Pod { id: number; value: number; x: number; y: number; vx: number; phase: number; row: number }
interface Beam { id: number; value: number; x: number; y: number }

const ORDERS_PER_LEVEL = 3;
const HATCH = { x: 80, y: 74 };   // where boxes beam into the rocket, % of the scene

const POD_COLORS: Record<number, { body: string; band: string; dot: string }> = {
  1:  { body: '#5EEAD4', band: '#14B8A6', dot: '#0F3D3A' },
  2:  { body: '#FDBA74', band: '#F97316', dot: '#4A1D05' },
  5:  { body: '#F9A8D4', band: '#EC4899', dot: '#4A0A2A' },
  10: { body: '#FDE68A', band: '#F59E0B', dot: '#4A2E05' },
};

interface Plan { values: number[]; lo: number; hi: number; speed: number; size: number }

// the level curve: which boxes exist, how big the orders are, how fast
// boxes drift and how big they are drawn
function planFor(level: number, tier: DifficultyTier): Plan {
  const L = Math.max(1, level);
  let values = L <= 5 ? [1] : L <= 10 ? [1, 2] : L <= 15 ? [1, 2, 5] : [1, 2, 5, 10];
  let lo: number, hi: number;
  if (L <= 5) { lo = L + 1; hi = L + 3; }
  else if (L <= 10) { lo = L - 1; hi = L + 2; }
  else if (L <= 15) { lo = L - 2; hi = L + 3; }
  else { lo = L - 4; hi = L + 4; }
  hi = Math.min(50, hi); lo = Math.min(lo, hi - 1);
  let speed = Math.min(10, 2.4 + L * 0.3);
  if (tier === 'tiny') { values = values.filter(v => v <= 2); hi = Math.min(hi, 6 + Math.floor(L / 6)); lo = Math.min(lo, 3 + Math.floor(L / 8)); speed *= 0.5; }
  else if (tier === 'small') { values = values.filter(v => v <= 5); hi = Math.min(hi, L <= 10 ? 10 : 20); lo = Math.min(lo, hi - 2); speed *= 0.8; }
  const size = Math.max(54, 74 - L * 0.7);
  return { values, lo, hi, speed, size };
}

// ── Where each rocket is going: a new little story every order ──
// (Kelvin 2026-11-23.) Dealt fairly from this deck (lib/variety.ts).
const MISSIONS = [
  'The moon bunnies are building a carrot farm. They need supplies!',
  'The space crew is throwing a birthday party on Mars!',
  'A comet needs fixing before it can zoom again.',
  'The star whales are hungry. Let\'s send a snack rocket!',
  'The robots are building a playground on the moon!',
  'A baby star lost its sparkle. Send some star dust!',
  'The astronauts are camping on a comet tonight.',
  'The Saturn ring needs new paint!',
  'The space garden needs seeds and water.',
  'A rocket full of toys for the moon kids!',
  'The space station is making pancakes for everyone!',
  'The aliens want to build a giant snowman on Pluto!',
];

const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

// boxes that add up to the target exactly (so it can always be made),
// plus a few spare ones so the child has to choose
function podsFor(target: number, plan: Plan, startId: number): Pod[] {
  const vals: number[] = [];
  let left = target;
  const big = [...plan.values].sort((a, b) => b - a);
  while (left > 0) {
    const fits = big.filter(v => v <= left);
    // mostly the biggest box that fits, sometimes a smaller one, so
    // there is more than one way to make the number
    const v = Math.random() < 0.7 ? fits[0] : fits[Math.floor(Math.random() * fits.length)];
    vals.push(v); left -= v;
  }
  const spare = Math.max(2, Math.min(4, 11 - vals.length));
  for (let i = 0; i < spare; i++) vals.push(plan.values[Math.floor(Math.random() * plan.values.length)]);
  const mixed = shuffled(vals);
  vals.splice(0, vals.length, ...mixed);
  // Boxes fly in lanes. Every box in a lane moves at the lane's speed and
  // the lanes are far enough apart, so two boxes never slide over each
  // other and a small finger always gets the box it aimed at.
  const rows = vals.length > 9 ? 4 : 3;
  const perRow = Array.from({ length: rows }, (_, r) => vals.filter((_, i) => i % rows === r).length);
  return vals.map((value, i) => {
    const row = i % rows, k = Math.floor(i / rows);
    return {
      id: startId + i, value, row,
      x: -4 + (k + (row % 2 ? 0.5 : 0)) * (108 / perRow[row]),
      y: laneY(row, rows),
      vx: laneSpeed(row, plan.speed),
      phase: Math.random() * 6,
    };
  });
}
const laneY = (row: number, rows: number) => (rows === 4 ? 10 + row * 14 : 12 + row * 17);
const laneSpeed = (row: number, speed: number) => (row % 2 ? -1 : 1) * speed * [1, 0.85, 1.15, 0.95][row];

/** Where a box sent back from the hold rejoins: the emptiest lane, in its biggest gap. */
function rejoin(pods: Pod[], p: Pod, speed: number): Pod {
  const rows = Math.max(3, ...pods.map(q => q.row + 1));
  const counts = Array.from({ length: rows }, (_, r) => pods.filter(q => q.row === r).length);
  const row = counts.indexOf(Math.min(...counts));
  const xs = pods.filter(q => q.row === row).map(q => q.x).sort((a, b) => a - b);
  let x = 50;
  if (xs.length) {
    let best = -1;
    xs.forEach((a, i) => {
      const b = i + 1 < xs.length ? xs[i + 1] : xs[0] + 108;
      if (b - a > best) { best = b - a; x = a + (b - a) / 2; }
    });
    if (x > 104) x -= 108;
  }
  return { ...p, row, x, y: laneY(row, rows), vx: laneSpeed(row, speed) };
}

const sfx = {
  beam:   () => tones([{ f: 520, t: 0, d: 0.1 }, { f: 780, t: 0.06, d: 0.1 }, { f: 1040, t: 0.12, d: 0.16 }], 'triangle'),
  back:   () => tones([{ f: 700, t: 0, d: 0.1 }, { f: 470, t: 0.07, d: 0.16 }], 'triangle'),
  rumble: () => tones([{ f: 140, t: 0, d: 0.25 }, { f: 120, t: 0.15, d: 0.3 }], 'triangle'),
  launch: () => tones([{ f: 392, t: 0, d: 0.14 }, { f: 523, t: 0.12, d: 0.14 }, { f: 659, t: 0.24, d: 0.14 }, { f: 784, t: 0.36, d: 0.4 }]),
};

const CHEERS = ['Lift off! Perfect count!', 'Whoosh! The crew loves it!', 'Right on the number! Off it goes!'];

export default function CargoCountPage() {
  const { state, totalScore, devMonths } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore, devMonths);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'launching' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- saved progress is only readable after mount
  useEffect(() => { setLevel(nextGameLevel('cargo-count')); }, []);
  const plan = useMemo(() => planFor(level, tier), [level, tier]);
  const [earned, setEarned] = useState(0);

  const [orderIdx, setOrderIdx] = useState(0);
  const [target, setTarget] = useState(3);
  const [pods, setPods] = useState<Pod[]>([]);
  const [hold, setHold] = useState<Pod[]>([]);
  const [beams, setBeams] = useState<Beam[]>([]);
  const [rocketKey, setRocketKey] = useState(0);
  const [rumble, setRumble] = useState(0);
  const [gulp, setGulp] = useState(0);
  const [hintPod, setHintPod] = useState<number | null>(null);
  const [hintHold, setHintHold] = useState<number | null>(null);
  const [noelLine, setNoelLine] = useState('');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [petX, setPetX] = useState(38);
  const [kailiaX, setKailiaX] = useState(20);
  const [kailiaHop, setKailiaHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  const nextId = useRef(1);
  const orderStart = useRef(0);
  const launchesThisOrder = useRef(0);
  const busyRef = useRef(false);
  const metrics = useRef({ firstTry: 0, launches: 0, orderMs: [] as number[], slips: 0, maxTarget: 0, startedAt: 0 });

  const loaded = hold.reduce((s, p) => s + p.value, 0);

  const lastTarget = useRef(0);
  const startOrder = useCallback((idx: number) => {
    // a new number every order (never the one just loaded)
    let t = rnd(plan.lo, plan.hi);
    for (let k = 0; k < 8 && t === lastTarget.current && plan.hi > plan.lo; k++) t = rnd(plan.lo, plan.hi);
    lastTarget.current = t;
    const mission = levelStories(MISSIONS, 'cargo-count', level, ORDERS_PER_LEVEL)[idx];
    const made = podsFor(t, plan, nextId.current);
    nextId.current += made.length + 1;
    setTarget(t);
    setPods(made);
    setHold([]);
    setBeams([]);
    setHintPod(null); setHintHold(null);
    setOrderIdx(idx);
    setRocketKey(k => k + 1);
    setKailiaX(20); setPetX(38);
    launchesThisOrder.current = 0;
    orderStart.current = performance.now();
    busyRef.current = false;
    metrics.current.maxTarget = Math.max(metrics.current.maxTarget, t);
    setNoelLine(`${mission} ${plan.values.length > 1
      ? 'Some boxes hold more than one! Load exactly what the crew ordered.'
      : 'The crew needs this many boxes. Tap a box to beam it aboard!'}`);
    setNoelMood('excited');
    setPhase('playing');
  }, [plan, level]);

  function startGame() {
    metrics.current = { firstTry: 0, launches: 0, orderMs: [], slips: 0, maxTarget: 0, startedAt: Date.now() };
    chime.good();
    startOrder(0);
  }

  // drifting boxes
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'launching') return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPods(prev => prev.map(p => {
        let x = p.x + p.vx * dt;
        if (x > 104) x = -4;
        if (x < -4) x = 104;
        return { ...p, x };
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // beam a drifting box into the hold
  function beamUp(p: Pod) {
    if (phase !== 'playing' || busyRef.current) return;
    if (hold.length >= 14) return;
    setPods(prev => prev.filter(q => q.id !== p.id));
    setHintPod(null); setHintHold(null);
    setBeams(prev => [...prev, { id: p.id, value: p.value, x: p.x, y: p.y }]);
    sfx.beam();
    setKailiaX(Math.max(10, Math.min(62, p.x)));
    setPetX(x => (Math.abs(x - p.x) < 14 ? Math.max(10, Math.min(66, p.x + 14)) : x));
    setPetMood('cheer');
    setTimeout(() => {
      setBeams(prev => prev.filter(b => b.id !== p.id));
      setHold(prev => [...prev, p]);
      setGulp(n => n + 1);
      fire(HATCH.x, HATCH.y, ['#A5F3FC', '#FFFFFF', '#C4B5FD'], 8, 36);
    }, 520);
  }

  // send a box back out to space
  function sendBack(p: Pod) {
    if (phase !== 'playing' || busyRef.current) return;
    setHold(prev => prev.filter(q => q.id !== p.id));
    setHintHold(null);
    sfx.back();
    setPods(prev => [...prev, rejoin(prev, p, plan.speed)]);
  }

  function launch() {
    if (phase !== 'playing' || busyRef.current || beams.length) return;
    launchesThisOrder.current += 1;
    metrics.current.launches += 1;
    if (loaded === target) {
      busyRef.current = true;
      if (launchesThisOrder.current === 1) metrics.current.firstTry += 1;
      metrics.current.orderMs.push(performance.now() - orderStart.current);
      sfx.launch();
      setPhase('launching');
      setNoelLine(CHEERS[orderIdx % CHEERS.length]);
      setNoelMood('celebrating');
      setKailiaHop(n => n + 1);
      setPetMood('dance');
      setTimeout(() => fire(HATCH.x, 40, ['#FDE68A', '#FFFFFF', '#F9A8D4', '#A5F3FC'], 16, 80), 500);
      return;
    }
    metrics.current.slips += 1;
    sfx.rumble();
    setRumble(n => n + 1);
    setPetMood('oops');
    setNoelMood('thinking');
    if (loaded > target) {
      setNoelLine('Too heavy to fly! Tap a box in the hold to send it back.');
    } else {
      setNoelLine('Room for more! Count with me and add a box.');
    }
    // after two tries the friend points at a box that fixes it
    if (launchesThisOrder.current >= 2) {
      if (loaded > target) {
        const over = loaded - target;
        const pick = hold.find(h => h.value === over) ?? [...hold].sort((a, b) => a.value - b.value).find(h => h.value <= over) ?? hold[hold.length - 1];
        if (pick) setHintHold(pick.id);
      } else {
        const need = target - loaded;
        const pick = pods.find(q => q.value === need) ?? [...pods].sort((a, b) => b.value - a.value).find(q => q.value <= need);
        if (pick) {
          setHintPod(pick.id);
          setPetX(Math.max(10, Math.min(66, pick.x)));
          setPetMood('talk');
          setNoelLine('Psst! Look where your friend is pointing!');
        }
      }
    }
  }

  // after the rocket flies: next order, or the level is done
  useEffect(() => {
    if (phase !== 'launching') return;
    const t = setTimeout(() => {
      if (orderIdx + 1 < ORDERS_PER_LEVEL) { startOrder(orderIdx + 1); return; }
      const m = metrics.current;
      const avg = m.orderMs.length ? m.orderMs.reduce((a, b) => a + b, 0) / m.orderMs.length : 0;
      logQuestMetric('math', 'cargo-count', {
        level,
        accuracy: Math.round((m.firstTry / ORDERS_PER_LEVEL) * 100),
        attempts: m.launches,
        avgOrderMs: Math.round(avg),
        maxTarget: m.maxTarget,
        biggestBox: Math.max(...plan.values),
        totalMs: Date.now() - m.startedAt,
      });
      const stars = levelStarlight(level, m.slips);
      awardStarlight(stars);
      setEarned(stars);
      recordGameLevel('cargo-count', level);
      chime.fanfare();
      setPhase('done');
    }, 1900);
    return () => clearTimeout(t);
  }, [phase, orderIdx, startOrder, level, plan.values]);

  function tickle() {
    setPetMood('dance');
    chime.tap();
  }

  return (
    <main className="min-h-screen pb-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d0826 0%, #1b1450 60%, #241a5e 100%)', isolation: 'isolate' }}>
      <GameBackdrop mode="play" />
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-indigo-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Cargo Count <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-16" aria-label={`Rocket ${Math.min(orderIdx + 1, ORDERS_PER_LEVEL)} of ${ORDERS_PER_LEVEL}`}>
            {Array.from({ length: ORDERS_PER_LEVEL }).map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#A5F3FC', boxShadow: '0 0 8px #A5F3FC', opacity: (i < orderIdx || (i === orderIdx && phase === 'launching')) ? 1 : 0.25 }} />
            ))}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <GameIntro
              title="Cargo Count"
              theme={{ bg: 'radial-gradient(130% 85% at 50% 0%, #4338CA 0%, #2E1F78 50%, #120B33 100%)', accent: '#A5B4FC', accent2: '#6366F1' }}
              pet={pet}
              story={<><p>
                Welcome to the <strong>Space Outpost</strong>! The crew&apos;s rocket is ready to fly.
              </p>
              <p>
                Cargo boxes are floating all around. <strong>Beam aboard exactly what the crew ordered</strong>, then press Launch!
              </p></>}
              extras={<div className="flex items-end justify-center gap-2"><PodArt value={1} size={44} /><PodArt value={2} size={48} /><Rocket size={70} /></div>}
              levels={<LevelPath gameId="cargo-count" level={level} onPick={setLevel} />}
              startLabel={<>Load the rocket!</>}
              onStart={startGame}
              footer={<SkillIntro gameId="cargo-count" />}
            />
          </div>
        )}

        {phase !== 'intro' && phase !== 'done' && (
          <>
            {/* the crew's order and what is in the hold, side by side */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div data-order data-target={target} className="rounded-2xl px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(165,180,252,0.45)' }}>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200">Crew order</p>
                <p className="text-3xl font-black text-white leading-tight">{target}</p>
                <TenFrames n={target} color="#FDE68A" />
              </div>
              <div data-loaded={loaded} className="rounded-2xl px-3 py-2 text-center" style={{ background: 'rgba(255,255,255,0.1)', border: `1.5px solid ${loaded === target ? 'rgba(134,239,172,0.8)' : 'rgba(165,243,252,0.45)'}`, transition: 'border-color 0.3s' }}>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">In the hold</p>
                <p key={loaded} className="text-3xl font-black text-white leading-tight bounce-in">{loaded}</p>
                <TenFrames n={loaded} color="#A5F3FC" />
              </div>
            </div>

            <div className="relative w-full rounded-[28px] overflow-hidden select-none"
              style={{ aspectRatio: '3 / 4', containerType: 'inline-size', touchAction: 'none', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <SpaceScene />

              {/* the rocket on its launch pad */}
              <div className="absolute" style={{ left: '80%', top: '96%', transform: 'translate(-50%, -100%)', zIndex: 4 }}>
                <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -4, width: 92, height: 14, borderRadius: '50%', background: '#2E3170', border: '2px solid #3b2416' }} />
                <div key={`r${rocketKey}`} className={phase === 'launching' ? 'cc-launch' : 'cc-land'}>
                  <div key={`u${rumble}`} className={rumble ? 'cc-rumble' : undefined}>
                    <div key={`g${gulp}`} className={gulp ? 'lantern-gulp' : undefined}>
                      <Rocket size={92} flame={phase === 'launching'} fill={Math.min(1, loaded / Math.max(1, target))} />
                    </div>
                  </div>
                </div>
                {phase === 'launching' && (
                  <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ bottom: -6 }}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <span key={i} className="cc-smoke absolute rounded-full" style={{ width: 26, height: 26, left: -13 + (i - 2) * 16, bottom: 0, background: '#E9E6FF', animationDelay: `${i * 0.06}s`, ['--sx' as string]: `${(i - 2) * 22}px` } as CSSProperties} />
                    ))}
                  </div>
                )}
              </div>

              <KailiaActor x={kailiaX} y={94} h={80} hop={kailiaHop} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petX} y={93} h={58} mood={petMood} moodKey={petMoodKey} onTap={tickle} z={7} />
              </div>

              {/* drifting cargo boxes */}
              {pods.map(p => (
                <button key={p.id} type="button" data-pod data-value={p.value}
                  aria-label={`Cargo box of ${p.value}`}
                  onPointerDown={e => { e.preventDefault(); beamUp(p); }}
                  className="absolute"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: plan.size, height: plan.size, marginLeft: -plan.size / 2, marginTop: -plan.size / 2, zIndex: 10, background: 'none', border: 0, padding: 0, cursor: 'pointer', touchAction: 'none' }}>
                  {hintPod === p.id && <span className="absolute inset-[-14%] rounded-full hint-glow" style={{ border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 0 18px rgba(253,230,138,0.9)' }} />}
                  <span className="block cc-float" style={{ animationDelay: `${-p.phase}s` }}>
                    <PodArt value={p.value} size={plan.size} showNumber={plan.values.length > 1} />
                  </span>
                </button>
              ))}

              {/* boxes on their way up the tractor beam */}
              {beams.map(b => (
                <div key={b.id} className="absolute pointer-events-none" style={{ left: `${HATCH.x}%`, top: `${HATCH.y}%`, zIndex: 11 }}>
                  <span className="cc-beam-line absolute" style={{ left: 0, top: -5, height: 10, borderRadius: 5, transformOrigin: '0 50%',
                    width: `${Math.hypot(b.x - HATCH.x, (b.y - HATCH.y) * 1.333)}cqw`,
                    transform: `rotate(${Math.atan2((b.y - HATCH.y) * 1.333, b.x - HATCH.x)}rad)`,
                    background: 'linear-gradient(90deg, rgba(165,243,252,0.65), rgba(165,243,252,0.15))' }} />
                  <div className="cc-beam absolute" style={{ left: -plan.size / 2, top: -plan.size / 2, ['--fx' as string]: `${(b.x - HATCH.x)}cqw`, ['--fy' as string]: `${(b.y - HATCH.y) * 1.333}cqw` } as CSSProperties}>
                    <PodArt value={b.value} size={plan.size} showNumber={plan.values.length > 1} />
                  </div>
                </div>
              ))}

              {burstLayer}
            </div>

            {/* the hold: tap a box to send it back */}
            <div className="mt-2 rounded-2xl p-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <div className="flex-1 flex flex-wrap gap-1 min-h-[44px] items-center" aria-label="The rocket's hold">
                {hold.length === 0 && <span className="text-sm font-bold text-indigo-200 px-1">The hold is empty</span>}
                {hold.map(p => (
                  <button key={p.id} type="button" data-hold-chip data-value={p.value} aria-label={`Send back the box of ${p.value}`}
                    onClick={() => sendBack(p)} className="relative bounce-in rounded-xl" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)' }}>
                    {hintHold === p.id && <span className="absolute inset-[-4px] rounded-xl hint-glow" style={{ border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 0 14px rgba(253,230,138,0.9)' }} />}
                    <PodArt value={p.value} size={40} showNumber={plan.values.length > 1} still />
                  </button>
                ))}
              </div>
              <button type="button" data-launch onClick={launch} disabled={phase !== 'playing' || hold.length === 0}
                className="gf-cta flex-shrink-0" style={{ background: 'linear-gradient(180deg, #FDE047, #FBBF24)', color: '#3b2416', ['--gf-accent' as string]: '#FDE047', opacity: hold.length === 0 ? 0.55 : 1, padding: '10px 18px', fontSize: 18 } as CSSProperties}>
                <span className="relative whitespace-nowrap">Launch!</span>
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2 rounded-2xl p-2.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div data-read-aloud className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0" style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'done' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <GameFinish
            title={`Level ${level} complete!`}
            theme={{ bg: 'linear-gradient(135deg, #2E1F78, #4338CA)', accent: '#A5B4FC', accent2: '#6366F1' }}
            pet={pet}
            trophy={<span className="inline-block"><Rocket size={96} fill={1} /></span>}
            message={<>Every rocket flew with just the right cargo. The crew is waving to {pet.name}!</>}
            earned={earned}
            actions={<>
              <PlayButton theme={GOLD} onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}>Level {level + 1} <GoArrow /></PlayButton>
              <SoftButton href="/play">Back to the map</SoftButton>
            </>}
          />
        </div>
      )}
    </main>
  );
}

// ── Dots in ten-frames (rows of five), so a pre-reader can count ──
function TenFrames({ n, color }: { n: number; color: string }) {
  const frames = Math.max(1, Math.ceil(n / 10));
  const dot = frames > 3 ? 5 : frames > 1 ? 6 : 8;
  return (
    <div className="flex flex-wrap justify-center gap-1 mt-1" aria-hidden="true">
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="grid gap-[2px] p-[3px] rounded-md" style={{ gridTemplateColumns: `repeat(5, ${dot}px)`, background: 'rgba(0,0,0,0.25)' }}>
          {Array.from({ length: 10 }, (_, i) => {
            const on = f * 10 + i < n;
            return <span key={i} className="rounded-full" style={{ width: dot, height: dot, background: on ? color : 'transparent', border: on ? 'none' : '1px solid rgba(255,255,255,0.25)', boxShadow: on ? `0 0 4px ${color}` : 'none' }} />;
          })}
        </div>
      ))}
    </div>
  );
}

// ── A cargo box: a painted crate with its dots, a little thruster below ──
const DOTS: Record<number, [number, number][]> = {
  1: [[20, 22]],
  2: [[13, 22], [27, 22]],
  5: [[12, 15], [28, 15], [20, 22], [12, 29], [28, 29]],
};
function PodArt({ value, size, showNumber = false, still = false }: { value: number; size: number; showNumber?: boolean; still?: boolean }) {
  const c = POD_COLORS[value] ?? POD_COLORS[1];
  const sk = '#3b2416';
  const dots = DOTS[value] ?? Array.from({ length: 10 }, (_, i) => [9 + (i % 5) * 5.5, 17 + Math.floor(i / 5) * 10] as [number, number]);
  return (
    <svg viewBox="0 0 40 44" width={size} height={size * 1.1} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      {!still && (
        <g className="cc-flame" style={{ transformOrigin: '20px 38px' }}>
          <path d="M15 38 Q20 47 25 38z" fill="#FDBA74" />
          <path d="M17.5 38 Q20 43 22.5 38z" fill="#FFF7D6" />
        </g>
      )}
      <g filter="url(#kp-brush)">
        <rect x="5" y="34" width="30" height="5" rx="2" fill="#7C83B8" stroke={sk} strokeWidth="1.4" />
        <rect x="3" y="6" width="34" height="30" rx="7" fill={c.body} stroke={sk} strokeWidth="2" />
        <rect x="3" y="9" width="34" height="3.5" fill={c.band} opacity="0.75" />
        <rect x="3" y="30" width="34" height="3" fill={c.band} opacity="0.6" />
        <path d="M8 13 Q9 9 13 9" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
        {dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={value === 10 ? 2 : value === 1 ? 5 : value === 2 ? 4 : 3} fill={c.dot} />)}
      </g>
      {showNumber && (
        <g>
          <circle cx="35" cy="6" r="6.5" fill="#FFFFFF" stroke={sk} strokeWidth="1.4" />
          <text x="35" y="9" textAnchor="middle" fontSize={value >= 10 ? 7 : 9} fontWeight="900" fill={sk}>{value}</text>
        </g>
      )}
    </svg>
  );
}

// ── The crew's rocket: its hold window fills as boxes come aboard ──
function Rocket({ size, flame = false, fill = 0 }: { size: number; flame?: boolean; fill?: number }) {
  const sk = '#3b2416';
  return (
    <svg viewBox="0 0 60 110" width={size} height={size * 110 / 60} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      {flame && (
        <g className="cc-flame-big" style={{ transformOrigin: '30px 92px' }}>
          <path d="M20 92 Q30 130 40 92z" fill="#FB923C" />
          <path d="M24 92 Q30 118 36 92z" fill="#FDE047" />
          <path d="M27 92 Q30 106 33 92z" fill="#FFFFFF" />
        </g>
      )}
      <g filter="url(#kp-brush)">
        {/* fins */}
        <path d="M14 66 L3 92 L16 86z" fill="#EF6F6C" stroke={sk} strokeWidth="2" strokeLinejoin="round" />
        <path d="M46 66 L57 92 L44 86z" fill="#EF6F6C" stroke={sk} strokeWidth="2" strokeLinejoin="round" />
        {/* body */}
        <path d="M30 4 Q48 22 46 70 L44 88 H16 L14 70 Q12 22 30 4z" fill="#F4EEE3" stroke={sk} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M30 4 Q40 13 43 26 H17 Q20 13 30 4z" fill="#EF6F6C" stroke={sk} strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 30 Q19 50 21 72" stroke="#FFFFFF" strokeWidth="2.4" fill="none" opacity="0.8" strokeLinecap="round" />
        {/* the hold window: fills with cargo light */}
        <circle cx="30" cy="46" r="10.5" fill="#1D1B4F" stroke={sk} strokeWidth="2.2" />
        <clipPath id="cc-win"><circle cx="30" cy="46" r="9" /></clipPath>
        <rect x="20" y={55 - 18 * fill} width="20" height={18 * fill} fill="#A5F3FC" clipPath="url(#cc-win)" style={{ transition: 'all 0.4s' }} />
        <path d="M24 41 Q26 38 29 38" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
        {/* hatch */}
        <rect x="23" y="62" width="14" height="16" rx="3" fill="#D9D1C2" stroke={sk} strokeWidth="1.8" />
        <circle cx="34" cy="70" r="1" fill={sk} />
        <rect x="18" y="86" width="24" height="6" rx="2" fill="#7C83B8" stroke={sk} strokeWidth="1.8" />
      </g>
      {/* blinking nose light */}
      <circle cx="30" cy="8" r="1.8" fill="#FDE047" className="fg-glow" />
    </svg>
  );
}
