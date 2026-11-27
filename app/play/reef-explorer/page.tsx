'use client';

import { buzzGood } from '@/lib/haptics';
import { lowVisual } from '@/lib/accessibility';
import { levelStories } from '@/lib/variety';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { GameBackdrop, GameFinish, GameIntro, GOLD, PlayButton, SoftButton, GoArrow } from '@/components/games/GameFrame';
import LevelPath from '@/components/LevelPath';
import ReefScene from '@/components/games/ReefScene';
import KailiaActor from '@/components/games/KailiaActor';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime, tones } from '@/components/friends/voice';
import { logQuestMetric } from '@/lib/metrics';
import { roundEase } from '@/lib/ageBands';
import { useGameFit, openingLevel } from '@/hooks/useGameFit';
import { reefPlan } from '@/lib/gameCurves';
import { awardStarlight, levelStarlight, recordGameLevel, levelAfter, nextLabel } from '@/lib/rewards';

// ─── Reef Explorer (Coral Reef) ───────────────────────────────────────────────
// Its own game, not a re-skin (Muse round 5): the reef is dark, and
// Kailia's flashlight shows only a circle of it. The child moves the
// light (drag, or tap where to shine) to find the one sea friend that
// looks exactly like the one on the card, then taps it. A sea friend in
// the dark can't be picked: a tap there only shines the light on it, so
// every pick is a real look. Levels bring a darker reef, a smaller
// light, more and faster swimmers, and closer look-alikes (first both
// color and pattern differ, then only one, then the pattern color, the
// number of stripes or spots, or the fins). Measured quietly: first-try
// finds, time per find, and how subtle the differences were.

type Pattern = 'stripes' | 'spots' | 'zigzag' | 'plain';
interface Look { body: string; pattern: Pattern; ink: string; count: number; fin: string }
type Trait = 'body' | 'pattern' | 'ink' | 'count' | 'fin';
interface Fish { id: number; look: Look; x: number; y: number; vx: number; bob: number; target: boolean; diff: Trait | null }

const FINDS_PER_LEVEL = 5;

// ── Why each fish is being looked for: a new little story every find ──
// (Kelvin 2026-11-23.) Dealt fairly from this deck (lib/variety.ts).
const REEF_STORIES = [
  'This baby fish swam away from home. Help find him!',
  'This fish is late for school!',
  'It\'s this little fish\'s birthday. Let\'s find her for the party!',
  'This fish has a present to give. Let\'s find her!',
  'This fish is playing hide and seek. Ready or not!',
  'This fish is collecting shiny shells.',
  'This fish forgot her lunch at home!',
  'This fish is learning a brand-new dance!',
  'This fish is the star of tonight\'s bubble show!',
  'Story time is starting. This fish doesn\'t want to miss it!',
  'This fish lost his way in the dark reef.',
  'This fish just won the big race!',
  'This fish is sleepy and wants to go home to bed.',
  'This fish found a shiny pearl!',
  'A little fish is collecting bubbles. Can you find him?',
];
const BODIES = ['#FB7185', '#FACC15', '#38BDF8', '#84CC16', '#A78BFA', '#FB923C'];
const INKS = ['#FFFFFF', '#1E3A8A', '#3b2416'];
const FINS = ['#F472B6', '#22D3EE', '#FDE68A', '#86EFAC'];
const PATTERNS: Pattern[] = ['stripes', 'spots', 'zigzag', 'plain'];

const MISS_LINE: Record<Trait, string> = {
  body: 'Ooh, a new friend! Look again at the colors.',
  pattern: 'So pretty! Look again at the pattern.',
  ink: 'So close! Look at the color of the pattern.',
  count: 'So close! Count the stripes and spots.',
  fin: 'So close! Check the fins.',
};

// the game clock, read only in event handlers and effects
const clock = () => performance.now();
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const other = <T,>(a: T[], not: T) => pick(a.filter(v => v !== not));
const same = (a: Look, b: Look) => a.body === b.body && a.pattern === b.pattern && a.ink === b.ink && a.fin === b.fin
  && (a.pattern === 'plain' || a.pattern === 'zigzag' || a.count === b.count);

// the level curve lives in lib/gameCurves.ts (checked against ages by scripts/age-fit.test.mjs)
const planFor = reefPlan;

function lookFor(band: number): Look {
  const pattern = band >= 3 ? pick(['stripes', 'spots'] as Pattern[]) : pick(PATTERNS);
  const body = pick(BODIES);
  return { body, pattern, ink: body === '#FACC15' ? pick(['#1E3A8A', '#3b2416']) : pick(INKS), count: 2 + Math.floor(Math.random() * 2), fin: pick(FINS) };
}

// a look-alike that differs in the traits this band allows
function lookAlike(t: Look, band: number): { look: Look; diff: Trait } {
  for (let tries = 0; tries < 30; tries++) {
    const l = { ...t };
    let diff: Trait;
    if (band === 0) { l.body = other(BODIES, t.body); l.pattern = other(PATTERNS, t.pattern); diff = 'pattern'; }
    else {
      const traits: Trait[] = band === 1 ? ['body', 'pattern'] : band === 2 ? ['body', 'pattern', 'ink'] : ['ink', 'count', 'fin', 'pattern', 'count'];
      diff = pick(traits);
      if (diff === 'body') l.body = other(BODIES, t.body);
      if (diff === 'pattern') l.pattern = other(PATTERNS, t.pattern);
      if (diff === 'ink') l.ink = other(INKS, t.ink);
      if (diff === 'fin') l.fin = other(FINS, t.fin);
      if (diff === 'count') {
        if (t.pattern !== 'stripes' && t.pattern !== 'spots') continue;
        l.count = t.count === 2 ? 3 : t.count === 3 ? pick([2, 4]) : 3;
      }
    }
    if (l.ink === l.body) continue;
    if (!same(l, t)) return { look: l, diff };
  }
  return { look: { ...t, body: other(BODIES, t.body) }, diff: 'body' };
}

const sfx = {
  find: () => { buzzGood(); tones([{ f: 660, t: 0, d: 0.1 }, { f: 880, t: 0.08, d: 0.1 }, { f: 1175, t: 0.16, d: 0.22 }]); },
  bloop: () => tones([{ f: 300, t: 0, d: 0.12 }, { f: 420, t: 0.08, d: 0.14 }], 'triangle'),
};

// Kailia's hand, where the flashlight beam starts (viewBox units, 100 × 133)
const HAND = { x: 21, y: 119 };

export default function ReefExplorerPage() {
  const fit = useGameFit('reef-explorer');
  const tier = fit.tier;
  const [phase, setPhase] = useState<'intro' | 'playing' | 'found' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  // a new player starts on their own level (hooks/useGameFit.ts)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved level is only readable after mount
  useEffect(() => { setLevel(openingLevel('reef-explorer', fit.startLevel)); }, [fit.startLevel]);
  // fish swim at the age band's speed, never smaller than its smallest tap (lib/ageBands.ts)
  const plan = useMemo(() => {
    const p = planFor(level, tier);
    const tierPace = tier === 'tiny' ? 0.5 : tier === 'small' ? 0.8 : 1;
    return { ...p, speed: (p.speed / tierPace) * fit.look.speed, size: Math.max(p.size, fit.look.minTap) };
  }, [level, tier, fit.look.speed, fit.look.minTap]);
  const [earned, setEarned] = useState(0);

  const [round, setRound] = useState(0);
  const [targetLook, setTargetLook] = useState<Look>(() => ({ body: '#38BDF8', pattern: 'stripes', ink: '#FFFFFF', count: 3, fin: '#FDE68A' }));
  const [fish, setFish] = useState<Fish[]>([]);
  const [found, setFound] = useState<Look[]>([]);
  const [foundId, setFoundId] = useState<number | null>(null);
  const [wobbleId, setWobbleId] = useState<{ id: number; n: number } | null>(null);
  const [hintId, setHintId] = useState<number | null>(null);
  const [light, setLight] = useState({ x: 55, y: 45 });
  const lightRef = useRef(light);
  useEffect(() => { lightRef.current = light; }, [light]);
  const [noelLine, setNoelLine] = useState('');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [petX, setPetX] = useState(36);
  const [kailiaHop, setKailiaHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  const areaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(plan.size);
  useEffect(() => { sizeRef.current = plan.size; }, [plan.size]);
  const draggingRef = useRef(false);
  const nextId = useRef(1);
  const roundStart = useRef(0);
  const roundMisses = useRef(0);
  const metrics = useRef({ firstTry: 0, misses: 0, findMs: [] as number[], startedAt: 0 });
  const foundIdRef = useRef<number | null>(null);
  // the fish hold still until this time (after the light jumps onto one)
  const holdUntilRef = useRef(0);
  useEffect(() => { foundIdRef.current = foundId; }, [foundId]);

  const startRound = useCallback((idx: number) => {
    const t = lookFor(plan.band);
    const list: Fish[] = [];
    // Low visual (grown-ups' setting): fewer swimmers, so the scene is calmer
    const n = lowVisual() ? Math.max(3, Math.round(plan.fish * 0.6)) : plan.fish;
    const targetAt = Math.floor(Math.random() * n);
    for (let i = 0; i < n; i++) {
      const isT = i === targetAt;
      const made = isT ? { look: t, diff: null } : lookAlike(t, plan.band);
      const row = i % 4;
      list.push({
        id: nextId.current++, look: made.look, target: isT, diff: made.diff,
        // friends in one lane start spread out along it, never on top of
        // each other (Kelvin 2026-11-26: two green fish began stacked)
        x: 10 + ((80 * (Math.floor(i / 4) + 0.5)) / Math.ceil((n - row) / 4) + row * 19) % 80 + (Math.random() - 0.5) * 6,
        y: 16 + row * 14 + Math.random() * 5,
        vx: (Math.random() < 0.5 ? -1 : 1) * plan.speed * (0.7 + Math.random() * 0.6),
        bob: Math.random() * 4,
      });
    }
    setTargetLook(t);
    setFish(list);
    setFoundId(null);
    setHintId(null);
    setRound(idx);
    setPetX(36);
    roundMisses.current = 0;
    roundStart.current = performance.now();
    const story = levelStories(REEF_STORIES, 'reef-explorer', level, FINDS_PER_LEVEL)[idx];
    setNoelLine(`${story} ${idx === 0 ? 'Shine your light and find the fish that looks just like this one!' : 'Can you find this one?'}`);
    setNoelMood('excited');
    setPhase('playing');
  }, [plan.band, plan.fish, plan.speed, level]);

  function startGame() {
    metrics.current = { firstTry: 0, misses: 0, findMs: [], startedAt: Date.now() };
    setFound([]);
    setLight({ x: 55, y: 45 });
    chime.good();
    startRound(0);
  }

  // swimming
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'found') return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // how wide a fish is, in % of the reef
      const w = areaRef.current?.clientWidth || 360;
      const gap = (sizeRef.current / w) * 100 * 0.85;
      if (now < holdUntilRef.current) { raf = requestAnimationFrame(tick); return; }
      setFish(prev => {
        const next = prev.map(f => {
          if (f.id === foundIdRef.current) return f;
          let { x, vx } = f;
          x += vx * dt;
          if (x > 90) { x = 90; vx = -Math.abs(vx); }
          if (x < 10) { x = 10; vx = Math.abs(vx); }
          return { ...f, x, vx };
        });
        // friends in the same lane bump gently and swim apart, so one fish
        // never hides behind another for long (the one you need stays findable)
        for (let i = 0; i < next.length; i++) for (let j = i + 1; j < next.length; j++) {
          const a = next[i], b = next[j];
          if (Math.abs(a.y - b.y) > 8 || Math.abs(a.x - b.x) > gap) continue;
          const [l, r] = a.x <= b.x ? [i, j] : [j, i];
          if (next[l].id !== foundIdRef.current) next[l] = { ...next[l], vx: -Math.abs(next[l].vx) };
          if (next[r].id !== foundIdRef.current) next[r] = { ...next[r], vx: Math.abs(next[r].vx) };
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  function pointPct(e: React.PointerEvent) {
    const r = areaRef.current!.getBoundingClientRect();
    return { x: Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(4, Math.min(84, ((e.clientY - r.top) / r.height) * 100)) };
  }
  function onDown(e: React.PointerEvent) {
    if (phase !== 'playing') return;
    if ((e.target as HTMLElement).closest?.('[data-pet]')) return;
    draggingRef.current = true;
    setLight(pointPct(e));
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine without capture */ }
  }
  function onMove(e: React.PointerEvent) {
    if (phase !== 'playing') return;
    if (!draggingRef.current && e.pointerType !== 'mouse') return;
    setLight(pointPct(e));
  }
  function onUp() { draggingRef.current = false; }

  // is this sea friend inside the circle of light?
  function isLit(f: Fish) {
    const l = lightRef.current;
    const dx = f.x - l.x;
    const dy = (f.y - l.y) * 1.333;
    return Math.hypot(dx, dy) <= plan.light * 0.9;
  }

  // tapping the friend asks for help (Muse round 7): a ring lights the fish to find
  function askFriend() {
    chime.tap();
    const t = fish.find(q => q.target);
    if (phase === 'playing' && t) {
      setHintId(t.id);
      setPetMood('talk');
      setNoelLine(`${pet.name} spotted it! Look for the glowing ring.`);
      return;
    }
    setPetMood('dance');
  }

  function tapFish(f: Fish, e: React.PointerEvent) {
    if (phase !== 'playing') return;
    e.stopPropagation();
    if (!isLit(f)) {
      // in the dark (Muse round 7: taps on a dimly seen fish "all missed"):
      // the light jumps right onto that fish and everyone holds still for a
      // moment, so the next tap lands on what the child is looking at. It is
      // not a pick yet: every pick is still a real look in the light.
      setLight({ x: f.x, y: f.y });
      lightRef.current = { x: f.x, y: f.y };
      holdUntilRef.current = performance.now() + 1400;
      setNoelLine('Now you can see it! Is it the one on the card? Tap it!');
      return;
    }
    if (f.target) {
      if (roundMisses.current === 0) metrics.current.firstTry += 1;
      metrics.current.findMs.push(clock() - roundStart.current);
      sfx.find();
      setFoundId(f.id);
      setHintId(null);
      setFound(prev => [...prev, f.look]);
      setPhase('found');
      setNoelLine(round + 1 < FINDS_PER_LEVEL ? 'You found it! Hello, little friend!' : 'You found them all! The reef is so happy!');
      setNoelMood('celebrating');
      setKailiaHop(n => n + 1);
      setPetMood('dance');
      fire(f.x, f.y, ['#A5F3FC', '#FFFFFF', '#FDE68A', '#F9A8D4'], 14, 70);
      return;
    }
    metrics.current.misses += 1;
    roundMisses.current += 1;
    sfx.bloop();
    setWobbleId(w => ({ id: f.id, n: (w?.n ?? 0) + 1 }));
    setPetMood('oops');
    setNoelMood('thinking');
    setNoelLine(MISS_LINE[f.diff ?? 'body']);
    if (roundMisses.current >= 2) {
      const t = fish.find(q => q.target);
      if (t) {
        setHintId(t.id);
        setPetX(Math.max(12, Math.min(88, t.x)));
        setPetMood('talk');
      }
    }
  }

  // after a find: the next friend, or the level is done
  useEffect(() => {
    if (phase !== 'found') return;
    const t = setTimeout(() => {
      if (round + 1 < FINDS_PER_LEVEL) { startRound(round + 1); return; }
      const m = metrics.current;
      const avg = m.findMs.length ? m.findMs.reduce((a, b) => a + b, 0) / m.findMs.length : 0;
      logQuestMetric('sensory', 'reef-explorer', {
        level,
        accuracy: Math.round((m.firstTry / FINDS_PER_LEVEL) * 100),
        attempts: FINDS_PER_LEVEL + m.misses,
        avgFindMs: Math.round(avg),
        subtlety: plan.band,
        fishShown: plan.fish,
        totalMs: Date.now() - m.startedAt,
      });
      const stars = levelStarlight(level, m.misses);
      awardStarlight(stars);
      setEarned(stars);
      recordGameLevel('reef-explorer', level, roundEase(m.misses, plan.fish));
      chime.fanfare();
      setPhase('done');
    }, 1700);
    return () => clearTimeout(t);
  }, [phase, round, startRound, level, plan.band, plan.fish]);

  // the flashlight beam from Kailia's hand to the circle of light
  const L = { x: light.x, y: light.y * 1.333 };
  const d = Math.hypot(L.x - HAND.x, L.y - HAND.y) || 1;
  const px = -(L.y - HAND.y) / d, py = (L.x - HAND.x) / d;
  const r = plan.light;
  const beam = `${HAND.x + px * 1.4},${HAND.y + py * 1.4} ${L.x + px * r * 0.8},${L.y + py * r * 0.8} ${L.x - px * r * 0.8},${L.y - py * r * 0.8} ${HAND.x - px * 1.4},${HAND.y - py * 1.4}`;
  const torchAngle = Math.atan2(L.y - HAND.y, L.x - HAND.x) * 180 / Math.PI;

  return (
    <main className="min-h-screen pb-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #06263f 0%, #0a3557 60%, #0b3d63 100%)', isolation: 'isolate' }}>
      <GameBackdrop mode="play" />
      <div data-play-col className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="kp-back text-sm font-bold text-cyan-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Reef Explorer <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="w-12" />
        </div>

        {phase === 'intro' && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <GameIntro
              title="Reef Explorer"
              theme={{ bg: 'radial-gradient(130% 85% at 50% 0%, #0E7490 0%, #0B4F6C 50%, #062338 100%)', accent: '#67E8F9', accent2: '#0891B2' }}
              pet={pet}
              story={<><p>
                Down in the <strong>Coral Reef</strong> it is dark and quiet, and the sea friends love to play hide and seek.
              </p>
              <p>
                <strong>Move Kailia&apos;s flashlight</strong> to find the friend that looks just like the one on the card, then tap it!
              </p></>}
              extras={<div className="flex items-end justify-center gap-2"><FishArt look={{ body: '#FB7185', pattern: 'stripes', ink: '#FFFFFF', count: 3, fin: '#FDE68A' }} size={64} /><FishArt look={{ body: '#38BDF8', pattern: 'spots', ink: '#1E3A8A', count: 3, fin: '#F472B6' }} size={56} flip /></div>}
              levels={<LevelPath gameId="reef-explorer" level={level} onPick={setLevel} startLevel={fit.startLevel} />}
              startLabel={<>Dive in!</>}
              onStart={startGame}
              footer={<SkillIntro gameId="reef-explorer" />}
            />
          </div>
        )}

        {phase !== 'intro' && phase !== 'done' && (
          <>
            {/* the card: which friend to find, and the friends found so far */}
            <div className="flex items-center gap-3 mb-2 rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(103,232,249,0.45)' }}>
              <div data-target-card className="rounded-xl flex flex-col items-center px-2 py-1" style={{ background: 'rgba(255,255,255,0.92)' }}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800">Find me!</span>
                <FishArt look={targetLook} size={64} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-cyan-100 mb-1">Friends found</p>
                <div className="flex gap-1" aria-label={`${found.length} of ${FINDS_PER_LEVEL} found`}>
                  {Array.from({ length: FINDS_PER_LEVEL }, (_, i) => (
                    <span key={i} className={`rounded-full flex items-center justify-center ${found[i] ? 'bounce-in' : ''}`} style={{ width: 34, height: 34, background: found[i] ? 'rgba(165,243,252,0.25)' : 'transparent', border: found[i] ? '2px solid #A5F3FC' : '2px dashed rgba(165,243,252,0.4)' }}>
                      {found[i] && <FishArt look={found[i]} size={26} still />}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div ref={areaRef} data-play-field onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              data-reef data-light-x={Math.round(light.x)} data-light-y={Math.round(light.y)}
              className="relative w-full rounded-[28px] overflow-hidden select-none"
              style={{ aspectRatio: '3 / 4', touchAction: 'none', cursor: 'crosshair', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <ReefScene />

              {/* sea friends */}
              {fish.map(f => (
                <button key={f.id} type="button" data-fish data-target={f.target ? '1' : '0'}
                  aria-label={f.target ? 'Sea friend' : 'Sea friend'}
                  onPointerDown={e => tapFish(f, e)}
                  className="absolute"
                  style={{ left: `${f.x}%`, top: `${f.y}%`, width: plan.size + 24, height: plan.size * 0.7 + 24, marginLeft: -(plan.size + 24) / 2, marginTop: -(plan.size * 0.7 + 24) / 2, zIndex: 10, background: 'none', border: 0, padding: 12, touchAction: 'none' }}>
                  <span key={wobbleId?.id === f.id ? wobbleId.n : 0} className={`block ${foundId === f.id ? 'rf-found' : wobbleId?.id === f.id ? 'kp-jelly' : 'rf-bob'}`} style={{ animationDelay: foundId === f.id ? undefined : `${-f.bob}s` }}>
                    <FishArt look={f.look} size={plan.size} flip={f.vx < 0} />
                  </span>
                </button>
              ))}

              {/* Kailia and the friend in their magic bubbles */}
              <span className="absolute rf-bubble pointer-events-none" style={{ left: '16%', top: '95%', width: 96, height: 96, transform: 'translate(-50%, -96%)', zIndex: 15 }} />
              <KailiaActor x={16} y={95} h={78} hop={kailiaHop} z={16} />
              <div data-pet>
                <span className="absolute rf-bubble pointer-events-none" style={{ left: `${petX}%`, top: '95%', width: 74, height: 74, transform: 'translate(-50%, -94%)', zIndex: 15, transition: 'left 1.1s ease-in-out' }} />
                <Actor art={pet.art} name={pet.name} x={petX} y={94} h={56} mood={petMood} moodKey={petMoodKey} onTap={askFriend} z={16} tapLabel={`Ask ${pet.name} for a hint`} />
              </div>

              {/* the dark, with a circle of light and the beam from Kailia's flashlight */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 133.33" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: 12 }}>
                <defs>
                  <filter id="rf-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
                  <mask id="rf-mask">
                    <rect width="100" height="133.33" fill="#FFFFFF" />
                    <g filter="url(#rf-soft)">
                      <polygon points={beam} fill="#8A8A8A" />
                      <circle cx={L.x} cy={L.y} r={r} fill="#000000" />
                    </g>
                  </mask>
                  <radialGradient id="rf-warm"><stop offset="0.55" stopColor="#FFF3C4" stopOpacity="0" /><stop offset="1" stopColor="#FFF3C4" stopOpacity="0.22" /></radialGradient>
                </defs>
                <rect width="100" height="133.33" fill="#020F22" opacity={plan.dark} mask="url(#rf-mask)" />
                <circle cx={L.x} cy={L.y} r={r} fill="url(#rf-warm)" />
              </svg>

              {/* the flashlight in Kailia's hand */}
              <div className="absolute pointer-events-none" style={{ left: `${HAND.x}%`, top: `${HAND.y / 1.333}%`, zIndex: 17, transform: `rotate(${torchAngle}deg)`, transformOrigin: '0 50%', marginTop: -6 }}>
                <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
                  <g filter="url(#kp-brush)">
                    <rect x="1" y="3" width="15" height="6" rx="2" fill="#F6C453" stroke="#3b2416" strokeWidth="1.4" />
                    <path d="M16 2 L24 0 V12 L16 10z" fill="#FDE68A" stroke="#3b2416" strokeWidth="1.4" strokeLinejoin="round" />
                  </g>
                </svg>
              </div>

              {/* the friend's hint glows above the dark */}
              {fish.filter(f => f.id === hintId).map(f => (
                <span key={f.id} data-hint className="absolute rounded-full hint-glow pointer-events-none" style={{ left: `${f.x}%`, top: `${f.y}%`, width: plan.size * 1.3, height: plan.size * 1.3, marginLeft: -plan.size * 0.65, marginTop: -plan.size * 0.65, zIndex: 14, border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 0 20px rgba(165,243,252,0.9)' }} />
              ))}

              <div style={{ position: 'absolute', inset: 0, zIndex: 17, pointerEvents: 'none' }}>{burstLayer}</div>
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
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
            theme={{ bg: 'linear-gradient(135deg, #0B4F6C, #0E7490)', accent: '#67E8F9', accent2: '#0891B2' }}
            pet={pet}
            trophy={<span className="inline-flex gap-1">{found.slice(0, 3).map((l, i) => <FishArt key={i} look={l} size={56} flip={i === 1} />)}</span>}
            message={<>You found every hiding friend. They want to swim with {pet.name}!</>}
            earned={earned}
            actions={<>
              <PlayButton theme={GOLD} onClick={() => { setLevel(levelAfter('reef-explorer', level)); setPhase('intro'); }}>{nextLabel('reef-explorer', level)} <GoArrow /></PlayButton>
              <SoftButton href="/play">Back to the map</SoftButton>
            </>}
          />
        </div>
      )}
    </main>
  );
}

// ── A sea friend: painted fish with a wagging tail, a pattern and fins ──
function FishArt({ look, size, flip = false, still = false }: { look: Look; size: number; flip?: boolean; still?: boolean }) {
  const sk = '#3b2416';
  const cid = `rf-${look.body.slice(1)}-${look.pattern}-${look.count}`;
  const stripes = look.count;
  return (
    <svg viewBox="0 0 60 42" width={size} height={size * 0.7} aria-hidden="true" style={{ overflow: 'visible', display: 'block', transform: flip ? 'scaleX(-1)' : undefined }}>
      <defs><clipPath id={cid}><ellipse cx="30" cy="21" rx="19" ry="13" /></clipPath></defs>
      <g filter="url(#kp-brush)">
        {/* tail */}
        <g className={still ? undefined : 'rf-tail'} style={{ transformOrigin: '12px 21px' }}>
          <path d="M13 21 L2 11 Q5 21 2 31z" fill={look.fin} stroke={sk} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
        {/* top and bottom fins */}
        <path d="M22 9 Q30 1 38 9z" fill={look.fin} stroke={sk} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M26 33 Q30 39 34 33z" fill={look.fin} stroke={sk} strokeWidth="1.2" strokeLinejoin="round" />
        {/* body */}
        <ellipse cx="30" cy="21" rx="19" ry="13" fill={look.body} />
        <g clipPath={`url(#${cid})`}>
          {look.pattern === 'stripes' && Array.from({ length: stripes }, (_, i) => {
            const x = 18 + (i + 0.5) * (20 / stripes);
            return <rect key={i} x={x - 1.8} y="6" width="3.6" height="30" rx="1.6" fill={look.ink} opacity="0.92" />;
          })}
          {look.pattern === 'spots' && Array.from({ length: stripes + 1 }, (_, i) => {
            const spots = [[20, 15], [27, 25], [33, 14], [24, 22], [36, 25]];
            const [x, y] = spots[i % spots.length];
            return <circle key={i} cx={x} cy={y} r="2.6" fill={look.ink} opacity="0.92" />;
          })}
          {look.pattern === 'zigzag' && (
            <path d="M12 21 L17 15 L22 27 L27 15 L32 27 L37 15 L42 23" stroke={look.ink} strokeWidth="2.6" fill="none" strokeLinejoin="round" opacity="0.92" />
          )}
        </g>
        <ellipse cx="30" cy="21" rx="19" ry="13" fill="none" stroke={sk} strokeWidth="1.8" />
        {/* side fin */}
        <path d="M30 23 Q34 27 29 29" fill="none" stroke={sk} strokeWidth="1.2" strokeLinecap="round" />
        {/* eye and smile */}
        <circle cx="41" cy="18" r="3.6" fill="#FFFFFF" stroke={sk} strokeWidth="1.1" />
        <circle cx="42" cy="18" r="1.9" fill={sk} />
        <circle cx="42.7" cy="17.2" r="0.6" fill="#FFFFFF" />
        <path d="M44 24 Q46 25.5 47.5 24" stroke={sk} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M20 13 Q24 10 28 10" stroke="#FFFFFF" strokeWidth="1.4" fill="none" opacity="0.55" strokeLinecap="round" />
      </g>
    </svg>
  );
}
