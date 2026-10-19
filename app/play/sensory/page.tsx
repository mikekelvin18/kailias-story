'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// ─── Sense Explorer ───────────────────────────────────────────────────────────
// Deep in Echo Caves, little things wander about in the crystal light.
// Each level is three rounds that alternate two kinds of looking:
//   hunt  → "catch every RED thing!" — the pieces drift around the cave;
//           the child taps every match and it zips into Kailia's lantern
//   odd   → a cluster of bobbing crystals that are all the same color…
//           except ONE that is a tiny bit different. Tap it!
// Levels add more wandering pieces, wider drifting, trickier categories,
// and (for odd-one-out) a smaller and smaller color difference — the
// visual discrimination ladder. A miss just wobbles; after two tries the
// right piece starts to glow. Measures visual discrimination accuracy.

interface HuntItem { e: string; c: string }
interface Hunt { prompt: string; say: string; target: string; color: string; fromChapter: number; items: HuntItem[] }

const HUNTS: Hunt[] = [
  { prompt: '🔴 Catch every RED thing!', say: 'Catch every red thing!', target: 'red', color: '#EF4444', fromChapter: 1,
    items: [{ e: '🍎', c: 'red' }, { e: '🍓', c: 'red' }, { e: '🎈', c: 'red' }, { e: '🌹', c: 'red' }, { e: '🍒', c: 'red' },
      { e: '🌊', c: 'blue' }, { e: '🍋', c: 'yellow' }, { e: '🌿', c: 'green' }, { e: '🍇', c: 'purple' }, { e: '🐳', c: 'blue' },
      { e: '🥦', c: 'green' }, { e: '🌻', c: 'yellow' }, { e: '❄️', c: 'blue' }, { e: '🫐', c: 'blue' }] },
  { prompt: '🔵 Catch every BLUE thing!', say: 'Catch every blue thing!', target: 'blue', color: '#3B82F6', fromChapter: 1,
    items: [{ e: '🌊', c: 'blue' }, { e: '💙', c: 'blue' }, { e: '🫐', c: 'blue' }, { e: '🐳', c: 'blue' }, { e: '🧊', c: 'blue' },
      { e: '🍎', c: 'red' }, { e: '🌻', c: 'yellow' }, { e: '🐸', c: 'green' }, { e: '🍓', c: 'red' }, { e: '🍋', c: 'yellow' },
      { e: '🥕', c: 'orange' }, { e: '🌿', c: 'green' }, { e: '🎈', c: 'red' }, { e: '🍊', c: 'orange' }] },
  { prompt: '🟡 Catch every YELLOW thing!', say: 'Catch every yellow thing!', target: 'yellow', color: '#F59E0B', fromChapter: 1,
    items: [{ e: '⭐', c: 'yellow' }, { e: '🌻', c: 'yellow' }, { e: '🍋', c: 'yellow' }, { e: '🍌', c: 'yellow' }, { e: '🐥', c: 'yellow' },
      { e: '🍎', c: 'red' }, { e: '🐸', c: 'green' }, { e: '🌊', c: 'blue' }, { e: '🍇', c: 'purple' }, { e: '🫐', c: 'blue' },
      { e: '🌹', c: 'red' }, { e: '🥦', c: 'green' }, { e: '❄️', c: 'blue' }, { e: '🍒', c: 'red' }] },
  { prompt: '⚪ Catch every ROUND thing!', say: 'Catch every round thing!', target: 'round', color: '#8B5CF6', fromChapter: 2,
    items: [{ e: '⚽', c: 'round' }, { e: '🏀', c: 'round' }, { e: '🍩', c: 'round' }, { e: '🔵', c: 'round' }, { e: '🎱', c: 'round' },
      { e: '🍕', c: 'tri' }, { e: '🟥', c: 'square' }, { e: '🔷', c: 'diamond' }, { e: '⭐', c: 'star' }, { e: '📦', c: 'square' },
      { e: '🔺', c: 'tri' }, { e: '🧀', c: 'tri' }, { e: '🟩', c: 'square' }, { e: '❤️', c: 'heart' }] },
  { prompt: '🪶 Catch everything with WINGS!', say: 'Catch everything with wings!', target: 'wings', color: '#10B981', fromChapter: 2,
    items: [{ e: '🦋', c: 'wings' }, { e: '🐦', c: 'wings' }, { e: '🐝', c: 'wings' }, { e: '🦜', c: 'wings' }, { e: '🐞', c: 'wings' },
      { e: '🐟', c: 'fins' }, { e: '🐛', c: 'crawl' }, { e: '🐢', c: 'crawl' }, { e: '🐍', c: 'crawl' }, { e: '🐕', c: 'legs' },
      { e: '🐌', c: 'crawl' }, { e: '🐙', c: 'fins' }, { e: '🐈', c: 'legs' }, { e: '🦀', c: 'legs' }] },
  { prompt: '🍬 Catch every SWEET treat!', say: 'Catch every sweet treat!', target: 'sweet', color: '#EC4899', fromChapter: 3,
    items: [{ e: '🍰', c: 'sweet' }, { e: '🍭', c: 'sweet' }, { e: '🍫', c: 'sweet' }, { e: '🍩', c: 'sweet' }, { e: '🍪', c: 'sweet' },
      { e: '🥦', c: 'veg' }, { e: '🥕', c: 'veg' }, { e: '🧅', c: 'veg' }, { e: '🥬', c: 'veg' }, { e: '🥒', c: 'veg' },
      { e: '🌽', c: 'veg' }, { e: '🥔', c: 'veg' }, { e: '🫑', c: 'veg' }, { e: '🍆', c: 'veg' }] },
  { prompt: '🐾 Catch every animal with FOUR legs!', say: 'Catch every animal with four legs!', target: '4legs', color: '#D97706', fromChapter: 3,
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

function Crystal({ hue, size }: { hue: number; size: number }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden>
      <polygon points="20,2 36,16 30,48 10,48 4,16" fill={`hsl(${hue} 75% 58%)`} stroke={`hsl(${hue} 70% 32%)`} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="20,2 26,16 20,48 14,16" fill="rgba(255,255,255,0.28)" />
      <polygon points="4,16 36,16 20,2" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

const ROUNDS_PER_LEVEL = 3;

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
    const line = r.kind === 'hunt' ? r.hunt.prompt : '💎 One crystal is a little bit different. Can you spot it?';
    setNoelLine(line);
    setNoelMood('happy');
    speak(r.kind === 'hunt' ? r.hunt.say : 'One crystal is a little bit different. Can you spot it?');
  }, []);

  const begin = useCallback(() => {
    const rs: Round[] = Array.from({ length: ROUNDS_PER_LEVEL }, (_, i) =>
      (i % 2 === (level % 2)) ? buildOdd(level, tiny) : buildHunt(level, tiny));
    setRounds(rs); setRIdx(0);
    setCaught(new Set()); setTries(0); setRoundDone(false); setWobble(null);
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

  function miss(id: number, kind: 'hunt' | 'odd') {
    if (kind === 'hunt') statsRef.current.huntMisses += 1; else statsRef.current.oddMisses += 1;
    setTries(t => t + 1);
    setWobble(id);
    chime([330]);
    timersRef.current.push(setTimeout(() => setWobble(null), 600));
    setNoelLine(tries + 1 >= 2 ? 'Ooh, look closely — something is glowing!' : 'Hmm, not that one. Let\'s look again together!');
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
    const want = round.pieces.filter(p => p.item.c === round.hunt.target).length;
    if (next.size >= want) {
      setRoundDone(true);
      setNoelLine('You caught them all! The lantern is glowing! 🏮');
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

  const hint = tries >= 2 && !roundDone;
  const want = round?.kind === 'hunt' ? round.pieces.filter(p => p.item.c === round.hunt.target).length : 1;

  return (
    <main className="min-h-screen pb-8 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #082f49 0%, #0e7490 70%, #155e75 120%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className="absolute rise-fade pointer-events-none" aria-hidden
            style={{ left: `${[8, 84, 46, 22][i]}%`, top: [300, 380, 460, 520][i], fontSize: 14, animationDuration: `${7 + i * 2}s`, animationDelay: `${i * 1.3}s` }}>✨</span>
        ))}

        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🌈 Sense Explorer <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {phase === 'playing'
            ? <button onClick={() => announce(round)} aria-label="Say it again"
                className="w-11 h-11 rounded-full text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>🔊</button>
            : <span className="w-11" />}
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-4 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-3">
              <PandaSprite size={112} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={88} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-5 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-xl font-bold leading-snug">
                Little things are wandering in the glowing caves! 🔮 Catch the ones Noel asks for, and spot the
                crystal that&apos;s <strong>a tiny bit different</strong>.
              </p>
            </div>
            <LevelPath gameId="sense-explorer" level={level} onPick={setLevel} />
            <button onClick={begin}
              className="mt-5 px-12 py-4 rounded-full text-xl font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Play level {level} 🔮
            </button>
            <SkillIntro gameId="sense-explorer" />
          </div>
        )}

        {/* ── Playing ── */}
        {phase === 'playing' && round && (
          <div className="relative z-10">
            {/* round dots + lantern */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex gap-1.5" aria-hidden>
                {rounds.map((_, i) => (
                  <span key={i} className="w-3 h-3 rounded-full transition-all"
                    style={{ background: i < rIdx || (i === rIdx && roundDone) ? '#FDE047' : 'rgba(255,255,255,0.25)' }} />
                ))}
              </div>
              {round.kind === 'hunt' && (
                <div className="flex items-center gap-1 rounded-full px-3 py-1" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <span className={`text-xl ${roundDone ? 'star-burst' : ''}`}>🏮</span>
                  {Array.from({ length: want }, (_, i) => (
                    <span key={i} className="w-3 h-3 rounded-full transition-all duration-300"
                      style={{ background: i < caught.size ? round.hunt.color : 'rgba(255,255,255,0.25)', boxShadow: i < caught.size ? `0 0 8px ${round.hunt.color}` : 'none' }} />
                  ))}
                </div>
              )}
            </div>

            {/* the cave */}
            <div key={rIdx} className="relative rounded-3xl overflow-hidden bounce-in"
              style={{ height: 340, background: 'radial-gradient(ellipse at 50% 30%, rgba(165,243,252,0.25), rgba(8,47,73,0.6))', border: '2px solid rgba(165,243,252,0.3)' }}>
              {round.kind === 'hunt' && round.pieces.map(p => {
                const isCaught = caught.has(p.id);
                const glow = hint && p.item.c === round.hunt.target && !isCaught;
                return (
                  <div key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="wander" style={{
                      animationDuration: `${p.dur}s`, animationDelay: `${-p.id * 0.7}s`,
                      ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`,
                    } as React.CSSProperties}>
                      <button onClick={() => tapPiece(p.id)} aria-label={p.item.e}
                        className={`w-16 h-16 flex items-center justify-center rounded-full text-4xl ${isCaught ? 'pop' : ''} ${wobble === p.id ? 'soft-wobble' : ''} ${glow ? 'hint-glow' : ''}`}
                        style={{ background: 'rgba(255,255,255,0.1)' }}>
                        {p.item.e}
                      </button>
                    </div>
                  </div>
                );
              })}

              {round.kind === 'odd' && (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-3 p-4">
                  {Array.from({ length: round.count }, (_, i) => {
                    const isOdd = i === round.oddIdx;
                    const hue = isOdd ? (round.hue + round.delta) % 360 : round.hue;
                    const size = round.count <= 4 ? 64 : round.count <= 8 ? 50 : 42;
                    return (
                      <div key={i} className="bob-drift" style={{ animationDuration: `${3 + (i % 3) * 0.6}s`, animationDelay: `${-i * 0.4}s` }}>
                        <button onClick={() => tapCrystal(i)} aria-label={`Crystal ${i + 1}`}
                          className={`p-1 ${wobble === i ? 'soft-wobble' : ''} ${hint && isOdd ? 'hint-glow' : ''} ${roundDone && isOdd ? 'star-burst' : ''}`}
                          style={{ filter: roundDone && !isOdd ? 'saturate(0.4) brightness(0.8)' : undefined }}>
                          <Crystal hue={hue} size={size} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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
          style={{ background: 'linear-gradient(135deg, #164e63ee, #0e7490ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">💎</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={140} expression="celebrating" className="float" />
              <KailiaSprite size={100} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-cyan-100 font-semibold mb-1">{chapter.emoji} Super-sharp {chapter.name} eyes! The caves are sparkling.</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
