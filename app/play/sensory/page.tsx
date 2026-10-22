'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { chapterFor, LEVELS_PER_CHAPTER } from '@/lib/levels';
import { soundEnabled } from '@/lib/accessibility';
import { speak, stopSpeaking } from '@/lib/speak';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import { Thing } from './things';

// ─── Sense Explorer ───────────────────────────────────────────────────────────
// Deep in Echo Caves, little things wander about in glowing bubbles.
// Each level is three rounds that alternate two kinds of looking:
//   hunt  → "catch every RED thing!" — the pieces drift around the cave;
//           the child taps every match, Kailia runs under it and hops,
//           and her lantern on the cave floor glows a little brighter
//   odd   → a cluster of bobbing crystals that are all the same color…
//           except ONE that is a tiny bit different. Tap it!
// Levels add more wandering pieces, wider drifting, trickier categories,
// and (for odd-one-out) a smaller and smaller color difference — the
// visual discrimination ladder. A miss just wobbles; after two tries the
// right piece starts to glow and the friend runs underneath it.
// Measures visual discrimination accuracy.

// e: a drawn piece id from ./things (or, for the animals that are not
// drawn yet, the emoji itself)
interface HuntItem { e: string; c: string }
interface Hunt { prompt: string; say: string; target: string; color: string; fromChapter: number; items: HuntItem[] }

const HUNTS: Hunt[] = [
  { prompt: 'Catch every RED thing!', say: 'Catch every red thing!', target: 'red', color: '#EF4444', fromChapter: 1,
    items: [{ e: 'apple', c: 'red' }, { e: 'strawberry', c: 'red' }, { e: 'balloon-red', c: 'red' }, { e: 'mushroom-red', c: 'red' }, { e: 'cherries', c: 'red' },
      { e: 'drop', c: 'blue' }, { e: 'lemon', c: 'yellow' }, { e: 'leaf', c: 'green' }, { e: 'grapes', c: 'purple' }, { e: 'balloon-blue', c: 'blue' },
      { e: 'broccoli', c: 'green' }, { e: 'sunflower', c: 'yellow' }, { e: 'cup-blue', c: 'blue' }, { e: 'blueberries', c: 'blue' }] },
  { prompt: 'Catch every BLUE thing!', say: 'Catch every blue thing!', target: 'blue', color: '#3B82F6', fromChapter: 1,
    items: [{ e: 'drop', c: 'blue' }, { e: 'heart-blue', c: 'blue' }, { e: 'blueberries', c: 'blue' }, { e: 'balloon-blue', c: 'blue' }, { e: 'gem-blue', c: 'blue' },
      { e: 'apple', c: 'red' }, { e: 'sunflower', c: 'yellow' }, { e: 'pear', c: 'green' }, { e: 'strawberry', c: 'red' }, { e: 'lemon', c: 'yellow' },
      { e: 'carrot', c: 'orange' }, { e: 'leaf', c: 'green' }, { e: 'balloon-red', c: 'red' }, { e: 'orange', c: 'orange' }] },
  { prompt: 'Catch every YELLOW thing!', say: 'Catch every yellow thing!', target: 'yellow', color: '#F59E0B', fromChapter: 1,
    items: [{ e: 'star', c: 'yellow' }, { e: 'sunflower', c: 'yellow' }, { e: 'lemon', c: 'yellow' }, { e: 'banana', c: 'yellow' }, { e: 'sun', c: 'yellow' },
      { e: 'apple', c: 'red' }, { e: 'pear', c: 'green' }, { e: 'drop', c: 'blue' }, { e: 'grapes', c: 'purple' }, { e: 'blueberries', c: 'blue' },
      { e: 'mushroom-red', c: 'red' }, { e: 'broccoli', c: 'green' }, { e: 'cup-blue', c: 'blue' }, { e: 'cherries', c: 'red' }] },
  { prompt: 'Catch every ROUND thing!', say: 'Catch every round thing!', target: 'round', color: '#8B5CF6', fromChapter: 2,
    items: [{ e: 'ball', c: 'round' }, { e: 'ball-orange', c: 'round' }, { e: 'donut', c: 'round' }, { e: 'button', c: 'round' }, { e: 'coin', c: 'round' },
      { e: 'pizza', c: 'tri' }, { e: 'block-red', c: 'square' }, { e: 'gem-blue', c: 'diamond' }, { e: 'star', c: 'star' }, { e: 'box', c: 'square' },
      { e: 'tri-block', c: 'tri' }, { e: 'cheese', c: 'tri' }, { e: 'block-green', c: 'square' }, { e: 'heart-red', c: 'heart' }] },
  { prompt: 'Catch everything with WINGS!', say: 'Catch everything with wings!', target: 'wings', color: '#10B981', fromChapter: 2,
    items: [{ e: '🦋', c: 'wings' }, { e: '🐦', c: 'wings' }, { e: '🐝', c: 'wings' }, { e: '🦜', c: 'wings' }, { e: '🐞', c: 'wings' },
      { e: '🐟', c: 'fins' }, { e: '🐛', c: 'crawl' }, { e: '🐢', c: 'crawl' }, { e: '🐍', c: 'crawl' }, { e: '🐕', c: 'legs' },
      { e: '🐌', c: 'crawl' }, { e: '🐙', c: 'fins' }, { e: '🐈', c: 'legs' }, { e: '🦀', c: 'legs' }] },
  { prompt: 'Catch every SWEET treat!', say: 'Catch every sweet treat!', target: 'sweet', color: '#EC4899', fromChapter: 3,
    items: [{ e: 'cake', c: 'sweet' }, { e: 'lollipop', c: 'sweet' }, { e: 'chocolate', c: 'sweet' }, { e: 'donut', c: 'sweet' }, { e: 'cookie', c: 'sweet' },
      { e: 'broccoli', c: 'veg' }, { e: 'carrot', c: 'veg' }, { e: 'onion', c: 'veg' }, { e: 'peas', c: 'veg' }, { e: 'cucumber', c: 'veg' },
      { e: 'corn', c: 'veg' }, { e: 'potato', c: 'veg' }, { e: 'pepper', c: 'veg' }, { e: 'eggplant', c: 'veg' }] },
  { prompt: 'Catch every animal with FOUR legs!', say: 'Catch every animal with four legs!', target: '4legs', color: '#D97706', fromChapter: 3,
    items: [{ e: '🐶', c: '4legs' }, { e: '🐱', c: '4legs' }, { e: '🐮', c: '4legs' }, { e: '🦁', c: '4legs' }, { e: '🐘', c: '4legs' },
      { e: '🐦', c: 'wings' }, { e: '🐟', c: 'fins' }, { e: '🐍', c: 'crawl' }, { e: '🦋', c: 'wings' }, { e: '🐠', c: 'fins' },
      { e: '🦅', c: 'wings' }, { e: '🐙', c: 'fins' }, { e: '🐧', c: 'wings' }, { e: '🐌', c: 'crawl' }] },
];

type Round =
  | { kind: 'hunt'; hunt: Hunt; pieces: { id: number; item: HuntItem; x: number; y: number; dx: number; dy: number; dur: number }[] }
  | { kind: 'odd'; hue: number; delta: number; count: number; oddIdx: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function buildHunt(level: number, tiny: boolean): Round {
  const ch = chapterFor(level).n;
  const step = (level - 1) % LEVELS_PER_CHAPTER;
  const pool = HUNTS.filter(h => h.fromChapter <= Math.min(ch, 3));
  const hunt = pool[Math.floor(Math.random() * pool.length)];
  const want = Math.min(5, (tiny ? 2 : 3) + Math.floor(ch / 2));
  const total = Math.min(14, (tiny ? 6 : 8) + step + ch);
  const targets = shuffle(hunt.items.filter(i => i.c === hunt.target)).slice(0, want);
  const others = shuffle(hunt.items.filter(i => i.c !== hunt.target)).slice(0, total - targets.length);
  const items = shuffle([...targets, ...others]);
  // spread pieces over a jittered grid so they never start on top of each other
  const cols = 4, rows = Math.ceil(items.length / cols);
  const roam = 6 + Math.min(18, (level - 1) * 1.2);   // drift distance grows with level
  const pieces = items.map((item, i) => ({
    id: i, item,
    x: ((i % cols) + 0.5) / cols * 100 + (Math.random() - 0.5) * 8,
    y: (Math.floor(i / cols) + 0.5) / rows * 100 + (Math.random() - 0.5) * 8,
    dx: (Math.random() < 0.5 ? -1 : 1) * roam * (0.6 + Math.random() * 0.4),
    dy: roam * (0.4 + Math.random() * 0.4),
    dur: Math.max(4, 9 - level * 0.12) + Math.random() * 2,
  }));
  return { kind: 'hunt', hunt, pieces };
}

function buildOdd(level: number, tiny: boolean): Round {
  // fewer crystals and a big color jump at first; more crystals and a
  // subtler difference as levels climb (never below 10° of hue)
  const count = Math.min(12, (tiny ? 3 : 4) + Math.floor((level - 1) / 2));
  const delta = Math.max(10, 70 - (level - 1) * 2.5);
  return { kind: 'odd', hue: Math.floor(Math.random() * 360), delta, count, oddIdx: Math.floor(Math.random() * count) };
}

function chime(freqs: number[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch { /* sound optional */ }
}

// The crystal's fill is the thing being measured (hue + delta), so it
// stays exactly as before; only the outline is the warm painted brown.
function Crystal({ hue, size }: { hue: number; size: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden style={{ overflow: 'visible' }}>
      <polygon points="20,2 36,16 30,48 10,48 4,16" fill={`hsl(${hue} 75% 58%)`} stroke="#3b2416" strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points="20,2 26,16 20,48 14,16" fill="rgba(255,255,255,0.28)" />
      <polygon points="4,16 36,16 20,2" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

const ROUNDS_PER_LEVEL = 3;

// The play area: pieces wander in the upper cave, Kailia, the friend and
// the lantern stand on the cave floor. (x, y in % of the cave)
const GROUND = 95;
const LANTERN_X = 89;
const pieceSpot = (p: { x: number; y: number }) => ({ x: 10 + p.x * 0.8, y: 7 + p.y * 0.62 });
function crystalSpots(count: number) {
  const cols = count <= 4 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols), inRow = Math.min(cols, count - r * cols);
    return { x: 50 + ((i % cols) - (inRow - 1) / 2) * (76 / cols), y: 16 + (r + 0.5) * (52 / rows) };
  });
}
const kailiaSpot = (x: number) => Math.max(10, Math.min(76, x));
// the friend stands beside Kailia, never on her, never on the lantern
const besideKailia = (petX: number, kx: number) => {
  const x = Math.abs(petX - kx) >= 18 ? petX : kx + (kx > 48 ? -19 : 19);
  return Math.max(9, Math.min(78, x));
};

export default function SenseExplorerPage() {
  const { state, totalScore } = useAssessment();
  const tiny = difficultyTier(state.ageGroup, totalScore) === 'tiny';

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [rIdx, setRIdx] = useState(0);
  const [caught, setCaught] = useState<Set<number>>(new Set());
  const [wobble, setWobble] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [noelLine, setNoelLine] = useState('');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [earned, setEarned] = useState(0);

  // Kailia and the friend in the cave
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(34);
  const [kailiaHop, setKailiaHop] = useState(0);
  const [petX, setPetX] = useState(60);
  const [lanternGulp, setLanternGulp] = useState(0);
  const [lit, setLit] = useState(0);   // catches this level: the lantern glows brighter
  const { layer: burstLayer, fire } = useBursts();

  const statsRef = useRef({ huntMisses: 0, oddMisses: 0, oddFirstTry: 0, startedAt: 0, smallestDelta: 999 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setLevel(nextGameLevel('sense-explorer'));
    const timers = timersRef.current;
    return () => { timers.forEach(clearTimeout); stopSpeaking(); };
  }, []);

  const round = rounds[rIdx];
  const chapter = chapterFor(level);

  const announce = useCallback((r: Round | undefined) => {
    if (!r) return;
    const line = r.kind === 'hunt' ? r.hunt.prompt : 'One crystal is a little bit different. Can you spot it?';
    setNoelLine(line);
    setNoelMood('happy');
    speak(r.kind === 'hunt' ? r.hunt.say : 'One crystal is a little bit different. Can you spot it?');
  }, []);

  const begin = useCallback(() => {
    const rs: Round[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) =>
      (i % 2 === (level % 2)) ? buildOdd(level, tiny) : buildHunt(level, tiny));
    setRounds(rs); setRIdx(0);
    setCaught(new Set()); setTries(0); setRoundDone(false); setWobble(null);
    setKailiaX(34); setPetX(60); setLit(0);
    statsRef.current = { huntMisses: 0, oddMisses: 0, oddFirstTry: 0, startedAt: Date.now(), smallestDelta: 999 };
    setPhase('playing');
    announce(rs[0]);
  }, [level, tiny, announce]);

  function nextRound() {
    timersRef.current.push(setTimeout(() => {
      if (rIdx + 1 >= rounds.length) { finish(); return; }
      setRIdx(i => i + 1);
      setCaught(new Set()); setTries(0); setRoundDone(false); setWobble(null);
      announce(rounds[rIdx + 1]);
    }, 1300));
  }

  // a good find: Kailia dashes under it and hops, the friend cheers,
  // sparkles pop and the lantern drinks in a little more light
  function celebrate(x: number, y: number, color: string) {
    const kx = kailiaSpot(x);
    setKailiaX(kx);
    setKailiaHop(n => n + 1);
    setPetX(p => besideKailia(p, kx));
    setPetMood('cheer');
    fire(x, y, ['#FFE066', '#FFFFFF', color], 12, 60);
    setLit(n => n + 1);
    timersRef.current.push(setTimeout(() => setLanternGulp(n => n + 1), 350));
  }

  function miss(id: number, kind: 'hunt' | 'odd') {
    if (kind === 'hunt') statsRef.current.huntMisses += 1; else statsRef.current.oddMisses += 1;
    setTries(t => t + 1);
    setWobble(id);
    setPetMood('oops');
    chime([330]);
    timersRef.current.push(setTimeout(() => setWobble(null), 600));
    setNoelLine(tries + 1 >= 2 ? `Ooh, look where ${pet.name} is! Something is glowing!` : 'Hmm, not that one. Let\'s look again together!');
    setNoelMood('thinking');
  }

  function tapPiece(id: number) {
    if (!round || round.kind !== 'hunt' || roundDone || caught.has(id)) return;
    const piece = round.pieces.find(p => p.id === id);
    if (!piece) return;
    if (piece.item.c !== round.hunt.target) { miss(id, 'hunt'); return; }
    const next = new Set(caught); next.add(id);
    setCaught(next); setTries(0);
    chime([523 + next.size * 60, 784 + next.size * 60]);
    const spot = pieceSpot(piece);
    celebrate(spot.x, spot.y, round.hunt.color);
    const want = round.pieces.filter(p => p.item.c === round.hunt.target).length;
    if (next.size >= want) {
      setRoundDone(true);
      setNoelLine('You caught them all! The lantern is glowing!');
      setNoelMood('excited');
      nextRound();
    } else {
      setNoelLine(['Got one!', 'Into the lantern!', 'Sparkly catch!', 'Keep looking!'][next.size % 4]);
      setNoelMood('excited');
    }
  }

  function tapCrystal(i: number) {
    if (!round || round.kind !== 'odd' || roundDone) return;
    if (i !== round.oddIdx) { miss(i, 'odd'); return; }
    if (tries === 0) statsRef.current.oddFirstTry += 1;
    statsRef.current.smallestDelta = Math.min(statsRef.current.smallestDelta, round.delta);
    setCaught(new Set([i]));
    setRoundDone(true);
    chime([659, 880, 1175]);
    const spot = crystalSpots(round.count)[i];
    celebrate(spot.x, spot.y, `hsl(${(round.hue + round.delta) % 360} 75% 58%)`);
    setNoelLine('Sharp eyes! That crystal was different!');
    setNoelMood('excited');
    nextRound();
  }

  function finish() {
    const s = statsRef.current;
    logQuestMetric('sensory', 'sense-explorer', {
      level, rounds: rounds.length, huntMisses: s.huntMisses, oddMisses: s.oddMisses,
      oddFirstTry: s.oddFirstTry, smallestHueDelta: s.smallestDelta === 999 ? 0 : Math.round(s.smallestDelta),
      totalMs: Date.now() - s.startedAt,
    });
    const stars = Math.max(10, 14 + level * 2 - (s.huntMisses + s.oddMisses));
    awardStarlight(stars);
    recordGameLevel('sense-explorer', level);
    setEarned(stars);
    chime([523, 659, 784, 1047]);
    setPhase('levelDone');
  }

  function tickle() {
    setPetMood('dance');
    timersRef.current.push(setTimeout(() => setPetMood('idle'), 1300));
  }

  const hint = tries >= 2 && !roundDone;
  const want = round?.kind === 'hunt' ? round.pieces.filter(p => p.item.c === round.hunt.target).length : 1;

  // after two tries the friend runs along the cave floor to stand right
  // under the piece to find, and bounces there
  let hintX: number | null = null;
  if (hint && round?.kind === 'hunt') {
    const t = round.pieces.find(p => p.item.c === round.hunt.target && !caught.has(p.id));
    if (t) hintX = pieceSpot(t).x;
  } else if (hint && round?.kind === 'odd') {
    hintX = crystalSpots(round.count)[round.oddIdx].x;
  }
  // during a hint the friend stands right under the piece and Kailia steps aside
  const petAt = hintX !== null ? Math.max(9, Math.min(78, hintX)) : besideKailia(petX, kailiaX);
  const kailiaAt = hintX !== null ? kailiaSpot(besideKailia(kailiaX, petAt)) : kailiaX;
  const roundsTotal = Math.max(1, rounds.length * 2);

  return (
    <main className="min-h-screen pb-8 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #082f49 0%, #0e7490 70%, #155e75 120%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Sense Explorer <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {phase === 'playing'
            ? <button onClick={() => announce(round)} aria-label="Say it again"
                className="w-11 h-11 rounded-full inline-flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <SpeakerIcon />
              </button>
            : <span className="w-11" />}
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-4 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-3">
              <PandaSprite size={112} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={88} expression="excited" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 64)} kind="pet" />
            </div>
            <div className="rounded-3xl p-5 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-xl font-bold leading-snug">
                Little things are floating in glowing bubbles in the caves! Catch the ones Noel asks for, and spot the
                crystal that&apos;s <strong>a tiny bit different</strong>.
              </p>
            </div>
            <LevelPath gameId="sense-explorer" level={level} onPick={setLevel} />
            <button onClick={begin}
              className="mt-5 px-12 py-4 rounded-full text-xl font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              <span className="whitespace-nowrap">Play level {level}</span>
            </button>
            <SkillIntro gameId="sense-explorer" />
          </div>
        )}

        {/* ── Playing ── */}
        {phase === 'playing' && round && (
          <div className="relative z-10">
            {/* what to look for, and the round dots */}
            <div className="flex items-center justify-between gap-2 px-1 mb-2">
              <div className="flex gap-1.5 shrink-0" aria-hidden>
                {rounds.map((_, i) => (
                  <span key={i} className="w-3 h-3 rounded-full transition-all"
                    style={{ background: i < rIdx || (i === rIdx && roundDone) ? '#FDE047' : 'rgba(255,255,255,0.25)' }} />
                ))}
              </div>
              <div key={rIdx} className="drop-in flex items-center gap-2 rounded-full pl-2 pr-3 py-1 min-w-0"
                style={{ background: '#FFF8E7', border: `3px solid ${round.kind === 'hunt' ? round.hunt.color : '#7dd3fc'}` }}>
                {round.kind === 'hunt'
                  ? <span className="inline-block w-4 h-4 rounded-full shrink-0" style={{ background: round.hunt.color, border: '2px solid #3b2416' }} />
                  : <span className="shrink-0"><Crystal hue={round.hue} size={14} /></span>}
                <span className="text-sm font-extrabold text-gray-900 truncate">
                  {round.kind === 'hunt' ? round.hunt.prompt : 'Find the different crystal!'}
                </span>
              </div>
            </div>

            {/* the cave */}
            <div key={rIdx} className="relative w-full rounded-[28px] overflow-hidden select-none bounce-in"
              style={{ aspectRatio: '3 / 3.9', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <CrystalCave />

              {/* the lantern on the cave floor */}
              <div className="absolute pointer-events-none" style={{ left: `${LANTERN_X}%`, top: `${GROUND}%`, transform: 'translate(-50%, -100%)', zIndex: 4 }}>
                <Lantern glow={Math.min(1, 0.2 + lit / roundsTotal)} gulp={lanternGulp} want={round.kind === 'hunt' ? want : 0} got={round.kind === 'hunt' ? caught.size : 0} color={round.kind === 'hunt' ? round.hunt.color : '#FDE047'} />
              </div>

              {round.kind === 'hunt' && round.pieces.map(p => {
                const isCaught = caught.has(p.id);
                const glow = hint && p.item.c === round.hunt.target && !isCaught;
                const spot = pieceSpot(p);
                return (
                  <div key={p.id} className="absolute" style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)', zIndex: 8 }}>
                    <div className="wander" style={{
                      animationDuration: `${p.dur}s`, animationDelay: `${-p.id * 0.7}s`,
                      ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`,
                    } as CSSProperties}>
                      <button onClick={() => tapPiece(p.id)} data-goal={p.item.c === round.hunt.target ? 1 : 0} aria-label={p.item.e.replace('-', ' ')} disabled={isCaught}
                        className={`w-16 h-16 flex items-center justify-center rounded-full ${isCaught ? 'pop' : ''} ${wobble === p.id ? 'soft-wobble' : ''} ${glow ? 'hint-glow' : ''}`}
                        style={isCaught ? { animationFillMode: 'forwards' } : undefined}>
                        {/* a glowing bubble: light, so every color reads on the dark cave */}
                        <span className="flex items-center justify-center rounded-full" style={{
                          width: 56, height: 56,
                          background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FFF8E7 55%, #E6F7FB 100%)',
                          border: '2.5px solid rgba(59,36,22,0.55)',
                          boxShadow: '0 0 12px rgba(165,243,252,0.65), inset 0 -4px 0 rgba(59,36,22,0.08)',
                        }}>
                          <Thing id={p.item.e} size={38} />
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {round.kind === 'odd' && crystalSpots(round.count).map((s, i) => {
                const isOdd = i === round.oddIdx;
                const hue = isOdd ? (round.hue + round.delta) % 360 : round.hue;
                const size = round.count <= 4 ? 56 : round.count <= 8 ? 46 : 40;
                return (
                  <div key={i} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)', zIndex: 8 }}>
                    <div className="bob-drift" style={{ animationDuration: `${3 + (i % 3) * 0.6}s`, animationDelay: `${-i * 0.4}s` }}>
                      <button onClick={() => tapCrystal(i)} data-goal={isOdd ? 1 : 0} aria-label={`Crystal ${i + 1}`}
                        className={`p-2 rounded-full ${wobble === i ? 'soft-wobble' : ''} ${hint && isOdd ? 'hint-glow' : ''} ${roundDone && isOdd ? 'star-burst' : ''}`}
                        style={{
                          filter: roundDone && !isOdd ? 'saturate(0.4) brightness(0.8)' : 'drop-shadow(0 0 6px rgba(255,255,255,0.55))',
                        }}>
                        <Crystal hue={hue} size={size} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <KailiaActor x={kailiaAt} y={GROUND} h={74} hop={kailiaHop} z={6} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petAt} y={GROUND - 1} h={54}
                  mood={hintX !== null ? 'talk' : petMood} moodKey={petMoodKey} moveMs={900}
                  flip={petAt < kailiaAt} onTap={tickle} z={7} />
              </div>
              {burstLayer}
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white">{noelLine}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Level complete ── */}
      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #164e63, #0e7490)' }}>
          <div className="text-center bounce-in">
            <span className="inline-flex items-end gap-1 mb-3 star-burst" style={{ filter: 'drop-shadow(0 0 16px rgba(165,243,252,0.9))' }}>
              <Crystal hue={190} size={40} /><Crystal hue={290} size={56} /><Crystal hue={330} size={40} />
            </span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 80)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-cyan-100 font-semibold mb-1">Super-sharp {chapter.name} eyes! The caves are sparkling, and {pet.name} is dancing.</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105 inline-block"
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

function SpeakerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 9 H7 L12 5 V19 L7 15 H3z" fill="#FFF8E7" stroke="#3b2416" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M15.5 9 Q17.5 12 15.5 15 M18 6.5 Q21.5 12 18 17.5" fill="none" stroke="#FFF8E7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Echo Caves ──
// A painted cave in cool teal and blue (so red, yellow and purple pieces
// all stand out): hanging rocks above, glowing crystal clusters at the
// sides, a sandy floor for Kailia and the friend, and light motes rising.
function CrystalCave() {
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ec-cave" cx="0.5" cy="0.45" r="0.8">
            <stop offset="0" stopColor="#1F5F7A" /><stop offset="0.6" stopColor="#123E5A" /><stop offset="1" stopColor="#0A2238" />
          </radialGradient>
          <radialGradient id="ec-glow"><stop offset="0" stopColor="#A5F3FC" stopOpacity="0.55" /><stop offset="1" stopColor="#A5F3FC" stopOpacity="0" /></radialGradient>
          <radialGradient id="ec-pink"><stop offset="0" stopColor="#F9A8D4" stopOpacity="0.5" /><stop offset="1" stopColor="#F9A8D4" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="130" fill="url(#ec-cave)" />
        <circle cx="8" cy="104" r="18" fill="url(#ec-glow)" className="fg-glow" />
        <circle cx="94" cy="30" r="16" fill="url(#ec-pink)" className="fg-glow" style={{ animationDelay: '-1.2s' }} />
        <g filter="url(#kp-brush)">
          {/* hanging rocks */}
          <path d="M0 0 H100 V7 Q90 12 82 7 Q74 14 64 8 Q54 13 46 7 Q36 13 26 8 Q14 13 0 8z" fill="#0B2A40" stroke={sk} strokeWidth="0.5" />
          <path d="M18 9 l2.4 9 l2.4 -9z M58 10 l1.8 7 l1.8 -7z M76 8 l1.6 6 l1.6 -6z M38 9 l1.4 5 l1.4 -5z" fill="#0B2A40" stroke={sk} strokeWidth="0.4" />
          {/* side ledges */}
          <path d="M0 40 Q6 44 4 56 Q2 64 0 66z" fill="#0F3550" />
          <path d="M100 58 Q93 64 96 74 Q98 80 100 82z" fill="#0F3550" />
          {/* crystal clusters */}
          <path d="M90 34 L93 22 L96 34z M94 34 L97 26 L100 34z" fill="#F9A8D4" stroke={sk} strokeWidth="0.4" />
          <path d="M2 112 L5 96 L8 112z M7 112 L10 102 L13 112z" fill="#67E8F9" stroke={sk} strokeWidth="0.4" />
          {/* the floor */}
          <path d="M0 114 Q25 108 50 113 T100 111 V130 H0z" fill="#3E6E7E" stroke={sk} strokeWidth="0.5" />
          <path d="M0 122 Q30 118 60 122 T100 120 V130 H0z" fill="#335F6E" />
          <ellipse cx="30" cy="120" rx="3" ry="1.2" fill="#5B8C99" /><ellipse cx="66" cy="117" rx="2.4" ry="1" fill="#5B8C99" />
        </g>
      </svg>
      {/* light motes rising through the cave */}
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${4 + seeded(i, 40) * 92}%`, bottom: `${6 + seeded(i, 41) * 30}%`, width: 5, height: 5,
          background: 'radial-gradient(circle, #FFFFFF 0%, #A5F3FC 50%, #A5F3FC00 75%)',
          animationDuration: `${7 + seeded(i, 42) * 6}s`, animationDelay: `${-seeded(i, 43) * 10}s`,
          ['--rise' as string]: `${140 + seeded(i, 44) * 140}px`, ['--sway' as string]: `${(seeded(i, 45) - 0.5) * 30}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}

// Kailia's lantern on the cave floor: it glows brighter with every find,
// gulps when one goes in, and shows little light dots for this hunt
function Lantern({ glow, gulp, want, got, color }: { glow: number; gulp: number; want: number; got: number; color: string }) {
  const sk = '#3b2416';
  return (
    <div className="flex flex-col items-center">
      {want > 0 && (
        <div className="flex gap-1 mb-1">
          {Array.from({ length: want }, (_, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < got ? 'star-burst' : ''}`}
              style={{ background: i < got ? color : 'rgba(255,255,255,0.35)', border: '1.5px solid #3b2416', boxShadow: i < got ? `0 0 6px ${color}` : 'none' }} />
          ))}
        </div>
      )}
      <div key={gulp} className={gulp ? 'lantern-gulp' : undefined}>
        <svg viewBox="0 0 60 78" width={40} height={52} aria-hidden="true" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="ec-lantern"><stop offset="0" stopColor="#FFF3A0" stopOpacity="0.9" /><stop offset="1" stopColor="#FDE047" stopOpacity="0" /></radialGradient>
          </defs>
          <circle cx="30" cy="44" r={16 + glow * 26} fill="url(#ec-lantern)" opacity={0.25 + glow * 0.6} style={{ transition: 'all 0.6s' }} />
          <g filter="url(#kp-brush)">
            <path d="M18 14 Q30 -2 42 14" stroke={sk} strokeWidth="3" fill="none" strokeLinecap="round" />
            <rect x="14" y="13" width="32" height="8" rx="3" fill="#C9822F" stroke={sk} strokeWidth="2.4" />
            <path d="M16 21 H44 L47 60 H13z" fill={`rgb(${215 + glow * 40}, ${180 + glow * 50}, ${120 + glow * 20})`} stroke={sk} strokeWidth="2.6" strokeLinejoin="round" style={{ transition: 'fill 0.6s' }} />
            <ellipse cx="30" cy={48 - glow * 5} rx={3 + glow * 4} ry={5 + glow * 7} fill="#FFFBE0" opacity={0.35 + glow * 0.65} style={{ transition: 'all 0.6s' }} />
            <rect x="11" y="59" width="38" height="8" rx="3" fill="#C9822F" stroke={sk} strokeWidth="2.4" />
          </g>
        </svg>
      </div>
    </div>
  );
}
