'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { soundEnabled } from '@/lib/accessibility';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Potion Sort ────────────────────────────────────────────────────────────
// A fast-paced drag-to-sort game in the owl's potion room: colored potion
// bottles tumble off the high shelf, and the child drags each one into
// the bubbling cauldron of the same color before it lands. Kailia stands
// at the cauldrons and hops to stir every potion that goes in; the friend
// cheers, wobbles when one slips by, and after two slips runs to the
// right cauldron to show the way. A genuinely new interaction
// (drag-under-time-pressure) rather than a reskinned engine. Combo
// streaks + escalating speed are the "just one more try" hook; a miss or
// wrong cauldron is always gentle.

// ms: how long its current fall takes (a released bottle falls the rest of the way)
interface Bottle { id: number; color: string; x: number; y: number; dragging: boolean; ms?: number }

const COLORS = [
  { key: 'red',    hex: '#EF4444', dark: '#B91C1C' },
  { key: 'blue',   hex: '#3B82F6', dark: '#1D4ED8' },
  { key: 'green',  hex: '#22C55E', dark: '#15803D' },
  { key: 'purple', hex: '#A855F7', dark: '#7E22CE' },
];

interface RoundCfg { colorCount: number; fallMs: number; spawnMs: number; bottles: number; noel: string; }

const ROUNDS: RoundCfg[] = [
  { colorCount: 2, fallMs: 5200, spawnMs: 1500, bottles: 6,  noel: 'Drag each potion into the cauldron with the SAME color!' },
  { colorCount: 3, fallMs: 4400, spawnMs: 1250, bottles: 8,  noel: 'A third color joined the shelf. Keep those cauldrons matching!' },
  { colorCount: 3, fallMs: 3600, spawnMs: 1050, bottles: 9,  noel: 'Faster potions! Quick hands, matching colors!' },
  { colorCount: 4, fallMs: 3200, spawnMs: 950,  bottles: 10, noel: 'All four colors now. The owl believes in you!' },
];

const COMBO_LINES = ['Nice!', 'Great!', 'Fantastic!', 'Amazing!', "You're on a roll!"];

const TIER_TUNING: Record<DifficultyTier, { fall: number; spawn: number }> = {
  tiny:  { fall: 1.65, spawn: 1.55 },
  small: { fall: 1.25, spawn: 1.2 },
  big:   { fall: 1, spawn: 1 },
};

// The room, in % of the play area's height: potions land on the cauldron
// rims, the cauldrons stand on a stone hearth, and Kailia and the friend
// stand on the floor in front of it.
const LAND_Y = 0.63;     // where a falling bottle's middle reaches the rims
const DROP_Y = 0.5;      // let go anywhere below this to drop into a cauldron
const GROUND = 98;       // feet of Kailia and the friend

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
  const [combo, setCombo] = useState(0);
  const [comboLine, setComboLine] = useState('');
  const [noelLine, setNoelLine] = useState(ROUNDS[0].noel);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [earned, setEarned] = useState(0);

  // Kailia, the friend and the cauldrons
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(30);
  const [kailiaHop, setKailiaHop] = useState(0);
  const [petX, setPetX] = useState(62);
  const [hintColor, setHintColor] = useState<string | null>(null);
  // the last cauldron that got a potion (jelly gulp) or a wrong one (wobble)
  const [potFx, setPotFx] = useState<{ idx: number; n: number; kind: 'gulp' | 'wobble' }>({ idx: -1, n: 0, kind: 'gulp' });
  const { layer: burstLayer, fire } = useBursts();

  const areaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 360, h: 480 });
  const idRef = useRef(0);
  const spawnedRef = useRef(0);
  const roundMissesRef = useRef(0);
  const slipStreakRef = useRef(0);   // slips (fallen or wrong cauldron) since the last good sort
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragRef = useRef<{ id: number; startedAt: number } | null>(null);
  const bottlesRef = useRef<Bottle[]>([]);
  useEffect(() => { bottlesRef.current = bottles; }, [bottles]);
  const metricsRef = useRef({ correct: 0, wrong: 0, missed: 0, sortMs: [] as number[], bestCombo: 0, startedAt: 0 });

  const activeColors = () => COLORS.slice(0, ROUNDS[roundIdx].colorCount);
  const zoneCenter = (i: number, n: number) => ((i + 0.5) / n) * 100;

  const startRound = useCallback((idx: number) => {
    roundMissesRef.current = 0;
    slipStreakRef.current = 0;
    spawnedRef.current = 0;
    setBottles([]);
    setHintColor(null);
    setRoundIdx(idx);
    setNoelLine(ROUNDS[idx].noel);
    setNoelMood('excited');
    setPhase('playing');
  }, []);

  function startGame() {
    metricsRef.current = { correct: 0, wrong: 0, missed: 0, sortMs: [], bestCombo: 0, startedAt: Date.now() };
    setCombo(0);
    setKailiaX(30); setPetX(62);
    sfx.round();
    startRound(0);
  }

  // after two slips the friend runs to the cauldron the next potion
  // belongs in, and that cauldron starts to glow
  const slip = useCallback((landedId?: number) => {
    setPetMood('oops');
    slipStreakRef.current += 1;
    if (slipStreakRef.current >= 2) {
      const left = bottlesRef.current.filter(b => b.id !== landedId);
      const next = left.find(b => b.dragging) ?? left[0];
      if (next) {
        setHintColor(next.color);
        setNoelLine(`Look, ${pet.name} is at the ${next.color} cauldron. Drop the ${next.color} potion there!`);
        setNoelMood('thinking');
      }
    }
  }, [pet.name, setPetMood]);

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
      const bottle: Bottle = { id: idRef.current, color, x, y: 56, dragging: false };
      setBottles(prev => [...prev, bottle]);
      // schedule its fall onto the cauldron rims (a slip) unless caught first
      const bottleId = bottle.id;
      const fallMs = cfg.fallMs * tuning.fall;
      // One frame after mount, move the target down — the CSS
      // `transition: top` on the bottle animates this into the actual
      // falling motion (without this second step it never moves at all).
      requestAnimationFrame(() => {
        setBottles(prev => prev.map(b => (b.id === bottleId && !b.dragging) ? { ...b, y: h * LAND_Y } : b));
      });
      scheduleLanding(bottleId, fallMs);
    }, spawnMs);
    return () => { if (spawnTimerRef.current) clearInterval(spawnTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIdx]);

  // when a bottle reaches the cauldron rims without being caught
  function scheduleLanding(bottleId: number, ms: number) {
      setTimeout(() => {
        const { w } = sizeRef.current;
        const landed = bottlesRef.current.find(b => b.id === bottleId);
        if (landed && !landed.dragging) {
          // it lands with a little splash of its own color, never a "fail"
          const hex = COLORS.find(c => c.key === landed.color)!.hex;
          fire((landed.x / w) * 100, LAND_Y * 100, [hex, '#FFFFFF'], 6, 26);
          slip(bottleId);
        }
        setBottles(prev => {
          const still = prev.find(b => b.id === bottleId);
          if (!still || still.dragging) return prev;
          // missed — gentle, resets combo, no punishment language
          metricsRef.current.missed += 1;
          roundMissesRef.current += 1;
          setCombo(0);
          return prev.filter(b => b.id !== bottleId);
        });
      }, ms);
  }

  // ── Round completion: every spawned bottle has left the board ──
  useEffect(() => {
    if (phase !== 'playing') return;
    if (spawnedRef.current >= ROUNDS[roundIdx].bottles && bottles.length === 0) {
      setPhase('roundDone');
      setNoelMood('celebrating');
      setHintColor(null);
      setPetMood('cheer');
      setNoelLine(['Every potion found a home!', 'The cauldrons are bubbling happily!', 'What quick hands!', 'All sorted!'][roundIdx]);
    }
  }, [bottles, phase, roundIdx, setPetMood]);

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
    const light = Math.max(12, 16 + level * 3 - m.missed * 2);
    awardStarlight(light);
    setEarned(light);
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
    // hold it where it is right now (it was mid-fall)
    const el = e.currentTarget as HTMLElement;
    const rect = areaRef.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const y = rect ? r.top + r.height / 2 - rect.top : undefined;
    setBottles(prev => prev.map(b => b.id === id ? { ...b, dragging: true, y: y ?? b.y } : b));
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
    const inZoneY = p.y > h * DROP_Y;
    const zoneIdx = Math.min(zoneCount - 1, Math.max(0, Math.floor(p.x / zoneW)));
    const bottle = bottles.find(b => b.id === drag.id);
    if (!bottle) return;

    if (inZoneY) {
      const targetColor = activeColors()[zoneIdx].key;
      const ok = targetColor === bottle.color;
      if (ok) {
        sfx.correct();
        metricsRef.current.correct += 1;
        metricsRef.current.sortMs.push(Date.now() - drag.startedAt);
        setCombo(c => {
          const next = c + 1;
          metricsRef.current.bestCombo = Math.max(metricsRef.current.bestCombo, next);
          if (next >= 2) setComboLine(COMBO_LINES[Math.min(COMBO_LINES.length - 1, next - 2)]);
          return next;
        });
        setBottles(prev => prev.filter(b => b.id !== drag.id));
        // Kailia runs to that cauldron and hops to stir it in; the friend
        // cheers beside her; the brew bubbles up in sparkles
        const cx = zoneCenter(zoneIdx, zoneCount);
        setKailiaX(cx);
        setKailiaHop(n => n + 1);
        setPetX(px => besideKailia(px, cx));
        setPetMood('cheer');
        setPotFx(f => ({ idx: zoneIdx, n: f.n + 1, kind: 'gulp' }));
        fire(cx, 66, ['#FFE066', '#FFFFFF', COLORS.find(c => c.key === bottle.color)!.hex], 12, 56);
        slipStreakRef.current = 0;
        setHintColor(null);
        setNoelLine(['Splash! Perfect match!', 'Into the pot it goes!', 'Bubble bubble!', 'Just right!'][metricsRef.current.correct % 4]);
        setNoelMood('excited');
        return;
      }
      sfx.wrong();
      metricsRef.current.wrong += 1;
      setCombo(0);
      setPotFx(f => ({ idx: zoneIdx, n: f.n + 1, kind: 'wobble' }));
      setNoelLine("Close! Try matching the COLOR, you've got this!");
      setNoelMood('thinking');
      slip();
    }
    // released outside any zone, or in the wrong one — let it carry on
    // falling from where it was let go, never a dead end
    const fallTo = h * LAND_Y;
    const from = Math.min(p.y, fallTo - 30);
    const ms = Math.max(600, ROUNDS[roundIdx].fallMs * tuning.fall * (fallTo - from) / (fallTo - 56));
    setBottles(prev => prev.map(b => b.id === drag.id ? { ...b, dragging: false, y: from, ms } : b));
    requestAnimationFrame(() => {
      setBottles(prev => prev.map(b => (b.id === drag.id && !b.dragging) ? { ...b, y: fallTo } : b));
    });
    scheduleLanding(drag.id, ms + 30);
  }

  function tickle() {
    setPetMood('dance');
    setTimeout(() => setPetMood('idle'), 1300);
  }

  const colorsNow = activeColors();
  const hintIdx = hintColor ? colorsNow.findIndex(c => c.key === hintColor) : -1;
  // during a hint the friend stands right under the cauldron to use and
  // Kailia steps aside for it
  const petAt = hintIdx >= 0 ? zoneCenter(hintIdx, colorsNow.length) : besideKailia(petX, kailiaX);
  const kailiaAt = hintIdx >= 0 ? besideKailia(kailiaX, petAt) : kailiaX;

  if (phase === 'intro') return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="flex items-end justify-center gap-2 mb-4">
          <PandaSprite size={112} expression="excited" className="float" />
          <KailiaSprite size={88} expression="excited" className="float" style={{ animationDelay: '0.2s' }} />
          <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 62)} kind="pet" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2" style={{ textShadow: '0 0 20px #A855F7' }}>Potion Sort</h1>
        <div className="rounded-2xl px-4 py-3 mb-4 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <p className="text-gray-900 text-base font-bold leading-snug">
            The owl&apos;s potions are tumbling off the shelf! Drag each one into the cauldron with the
            <strong> same color</strong> before it lands. Kailia will stir them in!
          </p>
        </div>
        <div className="flex justify-center items-end gap-3 mb-5">
          {COLORS.map((c, i) => (
            <span key={c.key} className="float inline-block" style={{ animationDelay: `${i * 0.25}s` }}><PotionBottle color={c.hex} size={34} /></span>
          ))}
        </div>
        <LevelPath gameId="potion-sort" level={level} onPick={setLevel} />
        <button onClick={() => { setPhase('playing'); startGame(); }}
          className="mt-4 px-10 py-4 rounded-full font-extrabold text-white text-xl transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#A855F7,#7C3AED)', boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
          <span className="whitespace-nowrap">Play level {level}</span>
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-purple-200 text-sm hover:text-white">← Back to the map</Link>
        </div>
        <SkillIntro gameId="potion-sort" />
      </div>
    </main>
  );

  if (phase === 'done') return (
    <main className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#3b2a7a,#5b21b6)' }}>
      <div className="text-center bounce-in">
        <span className="inline-flex items-end gap-2 mb-3 star-burst">
          {COLORS.map(c => <PotionBottle key={c.key} color={c.hex} size={30} />)}
        </span>
        <div className="flex items-end justify-center gap-2 mb-4">
          <PandaSprite size={120} expression="celebrating" className="float" />
          <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
          <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
            <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 80)} kind="pet" />
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
        <p className="text-purple-100 font-semibold mb-1">Every cauldron is bubbling. {pet.name} is doing a potion dance!</p>
        <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
            className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-900 shadow-xl transition-transform hover:scale-105"
            style={{ background: 'white' }}>
            <span className="whitespace-nowrap">Level {level + 1} ▶</span>
          </button>
          <Link href="/play"
            className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-950 shadow-xl transition-transform hover:scale-105 inline-block"
            style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
            <span className="whitespace-nowrap">Back to the map</span>
          </Link>
        </div>
      </div>
    </main>
  );

  const fallMs = ROUNDS[roundIdx].fallMs * tuning.fall;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg,#1e1b4b,#312e81)' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="font-bold text-sm text-purple-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Potion Sort <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-16" aria-hidden>
            {ROUNDS.map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: '#FDE047', boxShadow: '0 0 8px #FDE047', opacity: i < roundIdx || (i === roundIdx && phase === 'roundDone') ? 1 : 0.25 }} />
            ))}
          </span>
        </div>

        <div ref={areaRef} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerLeave={onDragEnd}
          className="relative w-full rounded-[28px] overflow-hidden select-none"
          style={{ aspectRatio: '3 / 4.2', touchAction: 'none', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>

          <PotionRoom />

          {/* the cauldrons on the hearth, one per color */}
          {colorsNow.map((c, i) => {
            const n = colorsNow.length;
            const wPct = Math.min(30, 92 / n);
            return (
              <div key={`${c.key}-${n}`} data-pot={c.key} className="absolute pointer-events-none" style={{
                left: `${zoneCenter(i, n)}%`, top: '83.5%', width: `${wPct}%`, transform: 'translate(-50%, -100%)', zIndex: 3,
              }}>
                <div key={potFx.idx === i ? potFx.n : 'still'}
                  className={`${potFx.idx === i ? (potFx.kind === 'wobble' ? 'soft-wobble' : 'kp-jelly') : ''} ${hintIdx === i ? 'hint-glow' : ''}`}
                  style={{ transformOrigin: '50% 100%' }}>
                  <Cauldron color={c.hex} dark={c.dark} seed={i} />
                </div>
              </div>
            );
          })}

          {/* bottles tumbling off the shelf */}
          {bottles.map(b => {
            const c = COLORS.find(x => x.key === b.color)!;
            return (
              <div key={b.id} onPointerDown={e => onDragStart(e, b.id)} data-bottle={b.color}
                className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center"
                style={{
                  left: b.x, top: b.y, width: 76, height: 92, transform: 'translate(-50%, -50%)',
                  transition: b.dragging ? 'none' : `top ${b.ms ?? fallMs}ms linear`,
                  zIndex: b.dragging ? 20 : 10, touchAction: 'none',
                }}>
                <div className={b.dragging ? '' : 'wiggle'} style={{ transform: b.dragging ? 'scale(1.12) rotate(-8deg)' : undefined, transition: 'transform 0.15s' }}>
                  <PotionBottle color={c.hex} size={50} />
                </div>
              </div>
            );
          })}

          <KailiaActor x={kailiaAt} y={GROUND} h={68} hop={kailiaHop} z={12} />
          <div data-pet>
            <Actor art={pet.art} name={pet.name} x={petAt} y={GROUND - 0.5} h={50}
              mood={hintIdx >= 0 ? 'talk' : petMood} moodKey={petMoodKey} moveMs={800}
              flip={petAt < kailiaAt} onTap={tickle} z={13} />
          </div>
          {burstLayer}

          {phase === 'roundDone' && roundIdx + 1 < ROUNDS.length && (
            <div className="absolute inset-x-0 top-[24%] flex justify-center pointer-events-none" style={{ zIndex: 40 }}>
              <p className="bounce-in px-5 py-2 rounded-full text-xl font-extrabold text-purple-950" style={{ background: '#FFF8E7', border: '3px solid #3b2416' }}>
                Round {roundIdx + 2} next!
              </p>
            </div>
          )}
        </div>

        {/* Noel's guide bar */}
        <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)' }}>
          <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
          <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white">
            {noelLine}
            {combo >= 2 && <span key={combo} className="block text-base text-purple-700 bounce-in">{comboLine}</span>}
          </div>
        </div>
      </div>
    </main>
  );
}

// the friend stands beside Kailia on the floor, never on top of her
function besideKailia(petX: number, kx: number) {
  const x = Math.abs(petX - kx) >= 18 ? petX : kx + (kx > 50 ? -19 : 19);
  return Math.max(9, Math.min(91, x));
}

// ── A painted potion bottle ──
// Round flask, cork, bright brew with a light rim, so every color reads
// on the dark tower room.
function PotionBottle({ color, size }: { color: string; size: number }) {
  const sk = '#3b2416';
  return (
    <svg viewBox="0 0 40 50" width={size} height={size * 1.25} aria-hidden="true"
      style={{ overflow: 'visible', filter: `drop-shadow(0 0 2px #FFF8E1) drop-shadow(0 0 8px ${color}aa)` }}>
      <g filter="url(#kp-brush)" strokeLinejoin="round">
        <rect x="14.5" y="2" width="11" height="8" rx="2" fill="#B07A45" stroke={sk} strokeWidth="1.8" />
        <path d="M15 10 H25 V17 Q35 21 35 32 A15 15 0 0 1 5 32 Q5 21 15 17z" fill="#EAF6FF" stroke={sk} strokeWidth="2" />
        <path d="M7 30 Q20 25 33 30 A13 13 0 0 1 7 30z" fill={color} />
        <path d="M7.4 32 A13 13 0 0 0 32.6 32" fill={color} />
        <circle cx="16" cy="36" r="2" fill="#FFFFFF" opacity="0.6" /><circle cx="24" cy="39" r="1.3" fill="#FFFFFF" opacity="0.6" />
        <path d="M11 22 Q8 27 9 31" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M15 10 H25 V17 Q35 21 35 32 A15 15 0 0 1 5 32 Q5 21 15 17z" fill="none" stroke={sk} strokeWidth="2" />
      </g>
    </svg>
  );
}

// ── A bubbling cauldron ──
// Warm copper (not black) so it stands out on the dark room, with the
// brew's color on top and little bubbles rising out of it.
function Cauldron({ color, dark, seed }: { color: string; dark: string; seed: number }) {
  const sk = '#3b2416';
  return (
    <div className="relative w-full">
      {[0, 1, 2].map(i => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${30 + i * 18 + seeded(seed, i) * 6}%`, top: '14%', width: 8 + i * 2, height: 8 + i * 2,
          background: color, border: '1.5px solid rgba(255,255,255,0.8)',
          animationDuration: `${1.8 + seeded(seed, i + 3) * 1.2}s`, animationDelay: `${-seeded(seed, i + 6) * 2}s`,
          ['--rise' as string]: '30px', ['--sway' as string]: `${(seeded(seed, i + 9) - 0.5) * 12}px`,
        } as CSSProperties} />
      ))}
      <svg viewBox="0 0 80 60" width="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <ellipse cx="40" cy="12" rx="36" ry="10" fill={color} opacity="0.35" className="fg-glow" />
        <g filter="url(#kp-brush)" stroke={sk} strokeLinejoin="round">
          <path d="M14 52 L10 59 M66 52 L70 59" strokeWidth="4" strokeLinecap="round" />
          <path d="M6 14 Q4 50 40 54 Q76 50 74 14z" fill="#C27C4A" strokeWidth="2.2" />
          <path d="M14 22 Q14 42 30 48" stroke="#E8A774" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="40" cy="14" rx="36" ry="9" fill="#8F5532" strokeWidth="2.2" />
          <ellipse cx="40" cy="14.5" rx="31" ry="6.5" fill={color} stroke={dark} strokeWidth="1.2" />
          <ellipse cx="30" cy="13" rx="7" ry="2" fill="#FFFFFF" opacity="0.45" stroke="none" />
        </g>
      </svg>
    </div>
  );
}

// ── The owl's potion room ──
// Purple stone walls, a round window with the moon and twinkling stars,
// the high shelf of books and jars the potions tumble from, candles, a
// stone hearth for the cauldrons and a wooden floor.
function PotionRoom() {
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pr-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A2466" /><stop offset="1" stopColor="#3D2F7E" />
          </linearGradient>
          <radialGradient id="pr-candle"><stop offset="0" stopColor="#FFD86B" stopOpacity="0.55" /><stop offset="1" stopColor="#FFD86B" stopOpacity="0" /></radialGradient>
          <radialGradient id="pr-sky"><stop offset="0" stopColor="#3B4AA0" /><stop offset="1" stopColor="#151A4A" /></radialGradient>
        </defs>
        <rect width="100" height="140" fill="url(#pr-wall)" />
        {/* stone blocks */}
        <g stroke="#221D55" strokeWidth="0.5" fill="none" opacity="0.8">
          {Array.from({ length: 10 }, (_, r) => (
            <g key={r}>
              <path d={`M0 ${16 + r * 10} H100`} />
              {Array.from({ length: 5 }, (_, c) => <path key={c} d={`M${(c * 22 + (r % 2) * 11) % 100} ${16 + r * 10} v10`} />)}
            </g>
          ))}
        </g>
        <g filter="url(#kp-brush)">
          {/* round window with the moon */}
          <circle cx="74" cy="42" r="13" fill="url(#pr-sky)" stroke={sk} strokeWidth="1.2" />
          <circle cx="78" cy="38" r="4.5" fill="#FFF1B8" stroke={sk} strokeWidth="0.5" />
          <path d="M61 42 H87 M74 29 V55" stroke="#6B4A2E" strokeWidth="1.4" />
          <circle cx="74" cy="42" r="13" fill="none" stroke="#8A6239" strokeWidth="2" />
          {/* the high shelf with books and jars */}
          <rect x="0" y="9" width="100" height="3.2" fill="#8A5A32" stroke={sk} strokeWidth="0.6" />
          {[[3, 5.5, '#E57373'], [7.5, 6.5, '#64B5F6'], [11.5, 5, '#FFD54F'], [15, 6, '#81C784']].map(([x, hgt, col], i) => (
            <rect key={i} x={x as number} y={9 - (hgt as number)} width="3.6" height={hgt as number} rx="0.5" fill={col as string} stroke={sk} strokeWidth="0.5" />
          ))}
          <path d="M84 9 v-4 q0 -1.5 2 -1.5 h3 q2 0 2 1.5 v4z" fill="#B39DDB" stroke={sk} strokeWidth="0.5" />
          <path d="M93 9 v-5 h4 v5z" fill="#80CBC4" stroke={sk} strokeWidth="0.5" />
          {/* candles */}
          <rect x="6" y="52" width="3" height="8" fill="#FFF3E0" stroke={sk} strokeWidth="0.4" />
          <path d="M7.5 52 q-1.4 -2 0 -4 q1.4 2 0 4z" fill="#FFB74D" />
          {/* the stone hearth the cauldrons stand on */}
          <rect x="0" y="116.5" width="100" height="8" fill="#5B4A86" stroke={sk} strokeWidth="0.6" />
          <path d="M0 116.5 H100" stroke="#8F7BC4" strokeWidth="0.8" />
          {/* wooden floor */}
          <rect x="0" y="124.5" width="100" height="15.5" fill="#6B4A2E" />
          <path d="M0 129 H100 M0 134 H100 M18 124.5 v4.5 M52 124.5 v4.5 M80 124.5 v4.5 M34 129 v5 M68 129 v5" stroke="#4E341F" strokeWidth="0.5" />
        </g>
        <circle cx="7.5" cy="49" r="7" fill="url(#pr-candle)" className="fg-glow" />
      </svg>
      {/* twinkling stars across the window */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
        {[[68, 36], [70, 47], [80, 49], [66, 41]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.6" fill="#FFFFFF" className="fg-twinkle" style={{ animationDelay: `${-i * 0.7}s` }} />
        ))}
      </svg>
      {/* magic motes drifting up */}
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${6 + seeded(i, 50) * 88}%`, bottom: `${30 + seeded(i, 51) * 20}%`, width: 6, height: 6,
          background: `radial-gradient(circle, #FFFFFF 0%, ${['#C4B5FD', '#F9A8D4', '#FDE68A', '#86EFAC'][i % 4]} 50%, transparent 75%)`,
          animationDuration: `${6 + seeded(i, 52) * 5}s`, animationDelay: `${-seeded(i, 53) * 8}s`,
          ['--rise' as string]: `${120 + seeded(i, 54) * 120}px`, ['--sway' as string]: `${(seeded(i, 55) - 0.5) * 30}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}
