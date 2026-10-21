'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { chapterFor, LEVELS_PER_CHAPTER } from '@/lib/levels';
import { soundEnabled } from '@/lib/accessibility';
import { speak, stopSpeaking } from '@/lib/speak';
import Stage from '@/components/friends/kit/Stage';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Word Wizard ──────────────────────────────────────────────────────────────
// The Whispering Signposts lost their words — they floated away as word
// balloons! The signpost shows a picture or a riddle; the child taps the
// balloon carrying the right word, it pops into sparkles, and Kailia
// walks one stone further down the path. Five words = level complete.
//
// Levels climb the reading ladder: each chapter of 5 levels is one word
// bank (pictures → first letters & rhymes → blending & sight words →
// sentence meaning → advanced vocabulary). Inside a chapter, the balloons
// gain more choices and drift more. Older readers start further up.
// A miss never says "wrong": the balloon wobbles, Noel reads what it
// says, and after two tries the right balloon starts to glow.
// Measures: accuracy by reading level, first-try reads, decoding speed.

interface ReadingQ {
  prompt: string;
  visual: string;     // emoji or sentence shown on the signpost
  choices: string[];
  answer: string;
}

const BANKS: ReadingQ[][] = [
  // Chapter 1: picture → word (about 3–4 years)
  [
    { visual: '🐱', prompt: 'Which word says this?', choices: ['cat', 'dog', 'bird'], answer: 'cat' },
    { visual: '🍎', prompt: 'Which word says this?', choices: ['apple', 'orange', 'banana'], answer: 'apple' },
    { visual: '🌙', prompt: 'Which word says this?', choices: ['sun', 'moon', 'star'], answer: 'moon' },
    { visual: '🚗', prompt: 'Which word says this?', choices: ['car', 'bus', 'bike'], answer: 'car' },
    { visual: '🌸', prompt: 'Which word says this?', choices: ['flower', 'tree', 'leaf'], answer: 'flower' },
    { visual: '🐶', prompt: 'Which word says this?', choices: ['cat', 'dog', 'fish'], answer: 'dog' },
    { visual: '⭐', prompt: 'Which word says this?', choices: ['moon', 'cloud', 'star'], answer: 'star' },
    { visual: '🏠', prompt: 'Which word says this?', choices: ['house', 'school', 'shop'], answer: 'house' },
    { visual: '🐟', prompt: 'Which word says this?', choices: ['fish', 'frog', 'fox'], answer: 'fish' },
    { visual: '🐸', prompt: 'Which word says this?', choices: ['frog', 'dog', 'log'], answer: 'frog' },
    { visual: '☀️', prompt: 'Which word says this?', choices: ['sun', 'run', 'bun'], answer: 'sun' },
    { visual: '🐝', prompt: 'Which word says this?', choices: ['bee', 'bed', 'bat'], answer: 'bee' },
  ],
  // Chapter 2: first letters and rhymes (about 4–5 years)
  [
    { visual: '🐱', prompt: 'CAT starts with…', choices: ['C', 'D', 'B', 'F'], answer: 'C' },
    { visual: '🍎', prompt: 'APPLE starts with…', choices: ['A', 'E', 'O', 'I'], answer: 'A' },
    { visual: '🐶', prompt: 'DOG starts with…', choices: ['B', 'D', 'G', 'P'], answer: 'D' },
    { visual: '🌟', prompt: 'STAR starts with…', choices: ['T', 'P', 'S', 'R'], answer: 'S' },
    { visual: '🦁', prompt: 'LION starts with…', choices: ['N', 'M', 'L', 'K'], answer: 'L' },
    { visual: '🐘', prompt: 'ELEPHANT starts with…', choices: ['E', 'A', 'I', 'O'], answer: 'E' },
    { visual: '🦇', prompt: 'Which word rhymes with CAT?', choices: ['bat', 'cup', 'pig', 'log'], answer: 'bat' },
    { visual: '☀️', prompt: 'Which word rhymes with FUN?', choices: ['sun', 'cat', 'dog', 'big'], answer: 'sun' },
    { visual: '🐷', prompt: 'Which word rhymes with PIG?', choices: ['wig', 'pot', 'hen', 'cup'], answer: 'wig' },
    { visual: '🪵', prompt: 'Which word rhymes with LOG?', choices: ['frog', 'leg', 'bag', 'sun'], answer: 'frog' },
  ],
  // Chapter 3: blending and sight words (about 5–6 years)
  [
    { visual: 'sh + ip', prompt: 'Blend the sounds. What word?', choices: ['ship', 'shop', 'chip', 'drip'], answer: 'ship' },
    { visual: 'fl + ower', prompt: 'Blend the sounds. What word?', choices: ['flower', 'flour', 'power', 'tower'], answer: 'flower' },
    { visual: '🌙 n + ight', prompt: 'What word do you make?', choices: ['night', 'might', 'light', 'right'], answer: 'night' },
    { visual: 'The cat SAT on the mat.', prompt: 'What did the cat do?', choices: ['ran', 'sat', 'ate', 'slept'], answer: 'sat' },
    { visual: '🏃 zoom!', prompt: 'Which word means moving quickly?', choices: ['slow', 'fast', 'sit', 'nap'], answer: 'fast' },
    { visual: 'The 🐶 is big.', prompt: 'Which word tells what the dog is like?', choices: ['The', 'dog', 'is', 'big'], answer: 'big' },
    { visual: 'b + ug', prompt: 'Blend the sounds. What word?', choices: ['bug', 'bag', 'big', 'hug'], answer: 'bug' },
    { visual: 'tr + ee', prompt: 'Blend the sounds. What word?', choices: ['tree', 'free', 'three', 'try'], answer: 'tree' },
  ],
  // Chapter 4: sentence meaning (about 6–8 years)
  [
    { visual: 'She ____ to school yesterday.', prompt: 'Which word fits best?', choices: ['went', 'go', 'goes', 'going'], answer: 'went' },
    { visual: 'un + happy', prompt: 'What does UNHAPPY mean?', choices: ['very happy', 'not happy', 'a bit happy', 'too happy'], answer: 'not happy' },
    { visual: '"The sun sets in the WEST."', prompt: 'Where does the sun set?', choices: ['East', 'West', 'North', 'South'], answer: 'West' },
    { visual: '"Kailia felt NERVOUS before the show."', prompt: 'How did Kailia feel?', choices: ['happy', 'nervous', 'angry', 'bored'], answer: 'nervous' },
    { visual: '"Every morning, she plays piano."', prompt: 'How often does she play?', choices: ['never', 'once', 'every day', 'every year'], answer: 'every day' },
    { visual: '"The chef made a yummy soup."', prompt: 'What did the chef do?', choices: ['ate soup', 'cooked soup', 'sold soup', 'spilled soup'], answer: 'cooked soup' },
    { visual: '"Noel hid UNDER the big leaf."', prompt: 'Where did Noel hide?', choices: ['on top', 'under', 'behind', 'inside'], answer: 'under' },
  ],
  // Chapter 5+: vocabulary and ideas (about 8–12 years)
  [
    { visual: '"He ran SWIFTLY to catch the bus."', prompt: 'What does SWIFTLY mean?', choices: ['slowly', 'carefully', 'quickly', 'quietly'], answer: 'quickly' },
    { visual: '"The ENORMOUS elephant splashed."', prompt: 'What does ENORMOUS mean?', choices: ['tiny', 'huge', 'fast', 'slow'], answer: 'huge' },
    { visual: '"Despite the rain, she persevered."', prompt: 'What does PERSEVERED mean?', choices: ['gave up', 'kept going', 'got wet', 'stayed home'], answer: 'kept going' },
    { visual: '"The PROTAGONIST was brave."', prompt: 'Who is the PROTAGONIST?', choices: ['the villain', 'the main character', 'the author', 'a side character'], answer: 'the main character' },
    { visual: '"She spoke in a MONOTONE voice."', prompt: 'What does MONOTONE mean?', choices: ['very loud', 'no expression', 'very quiet', 'very fast'], answer: 'no expression' },
    { visual: '"The scientist HYPOTHESIZED…"', prompt: 'What did the scientist do?', choices: ['proved a fact', 'made a guess', 'broke a tool', 'wrote a song'], answer: 'made a guess' },
    { visual: '"The story\'s THEME was friendship."', prompt: 'What is a THEME?', choices: ['the setting', 'the main message', 'the characters', 'the ending'], answer: 'the main message' },
    { visual: 'happy ↔ ___', prompt: 'Which word is the OPPOSITE?', choices: ['glad', 'joyful', 'sad', 'cheerful'], answer: 'sad' },
  ],
];

const QUESTIONS_PER_LEVEL = 5;
const BALLOON_COLORS = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24'];
const HAPPY_LINES = ['You read it!', 'The signpost lit up!', 'Wizard reading!', 'Sparkly! Kailia steps ahead!', 'Yes! The path glows!'];

// where the balloons float in the scene (centre of each balloon, % of the scene)
const SPOTS: Record<number, [number, number][]> = {
  2: [[30, 40], [70, 38]],
  3: [[19, 40], [50, 35], [81, 41]],
  4: [[25, 36], [74, 34], [29, 59], [70, 61]],
};
// Kailia's stepping stones along the meadow floor, then the finish flag
const stoneX = (i: number) => 10 + i * 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// chapter n of the level ladder → word bank (the last bank repeats for Hero, Legend and Star levels)
function bankFor(level: number) { return Math.min(BANKS.length - 1, Math.floor((level - 1) / LEVELS_PER_CHAPTER)); }
// 0–4: how far into its chapter this level is
function stepFor(level: number) { return (level - 1) % LEVELS_PER_CHAPTER; }

// Older children start further up the ladder (but can always step back down on the level map)
function startLevelForAge(age: number | null): number {
  const a = age ?? 5;
  const bank = a <= 4 ? 0 : a <= 5 ? 1 : a <= 6 ? 2 : a <= 8 ? 3 : 4;
  return bank * LEVELS_PER_CHAPTER + 1;
}

function buildRound(level: number): ReadingQ[] {
  const bank = BANKS[bankFor(level)];
  const step = stepFor(level);
  // early steps of a chapter offer fewer balloons, later ones all of them
  const nChoices = step <= 1 ? 3 : 4;
  return shuffle(bank).slice(0, QUESTIONS_PER_LEVEL).map(q => {
    const wrong = shuffle(q.choices.filter(c => c !== q.answer)).slice(0, Math.max(1, nChoices - 1));
    return { ...q, choices: shuffle([q.answer, ...wrong]) };
  });
}

function chime(freqs: number[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch { /* sound optional */ }
}

export default function WordWizardPage() {
  const { state } = useAssessment();
  const startLevel = startLevelForAge(state.childAge);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [round, setRound] = useState<ReadingQ[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [popped, setPopped] = useState<string | null>(null);
  const [wobble, setWobble] = useState<string | null>(null);
  const [triesThisQ, setTriesThisQ] = useState(0);
  const [noelLine, setNoelLine] = useState('Tap the balloon with the right word!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [earned, setEarned] = useState(0);
  // the friend plays along: follows Kailia, cheers, wobbles with her on a
  // miss and, after two tries, flies up to sit under the right balloon
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaHop, setKailiaHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  const statsRef = useRef({ firstTry: 0, misses: 0, startedAt: 0, qStartedAt: 0, readMs: 0 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setLevel(Math.max(nextGameLevel('word-wizard'), startLevel));
    const timers = timersRef.current;
    return () => { timers.forEach(clearTimeout); stopSpeaking(); };
  }, [startLevel]);

  const q = round[qIdx];
  const chapter = chapterFor(level);
  const step = stepFor(level);

  // Noel reads the riddle aloud, never the signpost words or the balloons —
  // reading those is the child's job
  const readSign = useCallback((question: ReadingQ | undefined) => {
    if (question) speak(question.prompt);
  }, []);

  const begin = useCallback(() => {
    const r = buildRound(level);
    setRound(r);
    setQIdx(0);
    setPopped(null); setWobble(null); setTriesThisQ(0);
    const now = Date.now();
    statsRef.current = { firstTry: 0, misses: 0, startedAt: now, qStartedAt: now, readMs: 0 };
    setNoelLine('Tap the balloon with the right word!');
    setNoelMood('happy');
    setPhase('playing');
    readSign(r[0]);
  }, [level, readSign]);

  function tapBalloon(choice: string, spot: [number, number]) {
    if (!q || popped) return;
    if (choice === q.answer) {
      fire(spot[0], spot[1], ['#FFE066', '#FFFFFF', BALLOON_COLORS[q.choices.indexOf(choice) % 4]], 14, 80);
      setKailiaHop(n => n + 1);
      setPetMood('cheer');
      const s = statsRef.current;
      s.readMs += Date.now() - s.qStartedAt;
      if (triesThisQ === 0) s.firstTry += 1;
      setPopped(choice);
      chime([659, 784, 1047]);
      setNoelLine(HAPPY_LINES[qIdx % HAPPY_LINES.length]);
      setNoelMood('excited');
      timersRef.current.push(setTimeout(() => {
        if (qIdx + 1 >= round.length) { finish(); return; }
        setQIdx(i => i + 1);
        setPopped(null); setTriesThisQ(0);
        statsRef.current.qStartedAt = Date.now();
        setNoelLine('Here comes the next one!');
        setNoelMood('happy');
        readSign(round[qIdx + 1]);
      }, 1100));
    } else {
      statsRef.current.misses += 1;
      setTriesThisQ(t => t + 1);
      setWobble(choice);
      setPetMood('oops');
      chime([392]);
      timersRef.current.push(setTimeout(() => setWobble(null), 600));
      // Noel reads the word that was tapped — real reading support, never "wrong"
      const line = triesThisQ + 1 >= 2
        ? `That one says "${choice}". Look, ${pet.name} found the glowing one!`
        : `That one says "${choice}". Let's look again together!`;
      setNoelLine(line);
      setNoelMood('thinking');
      speak(`That one says ${choice}. Let's look again!`);
    }
  }

  function finish() {
    const s = statsRef.current;
    const bank = bankFor(level);
    logQuestMetric('reading', 'word-wizard', {
      level, readingBank: bank, questions: round.length,
      firstTryCorrect: s.firstTry, misses: s.misses,
      avgReadMs: Math.round(s.readMs / Math.max(1, round.length)),
      totalMs: Date.now() - s.startedAt,
    });
    const stars = Math.max(10, 14 + level * 2 - s.misses * 2);
    awardStarlight(stars);
    recordGameLevel('word-wizard', level);
    setEarned(stars);
    chime([523, 659, 784, 1047]);
    setPhase('levelDone');
  }

  const lit = popped ? qIdx + 1 : qIdx;  // stones Kailia has walked
  const hintOn = triesThisQ >= 2;
  // Kailia stands on the last stone she lit, and runs to the flag at the end
  const kailiaX = lit === 0 ? 8 : lit >= round.length ? stoneX(round.length) - 6 : stoneX(lit - 1);
  const isWordVisual = q ? !/^\p{Extended_Pictographic}️?$/u.test(q.visual) : false;

  return (
    <main className="min-h-screen pb-8 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 55%, #93c5fd 120%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Word Wizard <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {phase === 'playing'
            ? <button onClick={() => readSign(q)} aria-label="Read it to me"
                className="w-11 h-11 rounded-full text-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>🔊</button>
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
                Uh-oh! The signposts&apos; words <strong>floated away</strong> as balloons!
                Tap the balloon with the right word to bring it home.
              </p>
            </div>
            <LevelPath gameId="word-wizard" level={level} onPick={setLevel} startLevel={startLevel} />
            <button onClick={begin}
              className="mt-5 px-12 py-4 rounded-full text-xl font-extrabold text-blue-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Play level {level}
            </button>
            <SkillIntro gameId="word-wizard" />
          </div>
        )}

        {/* ── Playing ── */}
        {phase === 'playing' && q && (
          <div className="relative z-10">
            {/* the signpost */}
            <div key={qIdx} className="mx-auto mt-1 drop-in" style={{ maxWidth: 320 }}>
              <div className="rounded-2xl px-4 py-3 text-center shadow-lg"
                style={{ background: 'linear-gradient(180deg,#fde68a,#f59e0b)', border: '4px solid #92400e' }}>
                <p className={`font-extrabold text-amber-950 leading-tight ${isWordVisual ? 'text-xl' : 'text-6xl'}`}>{q.visual}</p>
                <p className="mt-1 text-base font-bold text-amber-900">{q.prompt}</p>
                {popped && (
                  <p className="bounce-in mt-1 inline-block px-3 py-0.5 rounded-full text-lg font-extrabold text-amber-950"
                    style={{ background: '#FEF3C7', border: '2px solid #92400e' }}>{popped}</p>
                )}
              </div>
              <div className="mx-auto w-3 h-6" style={{ background: '#92400e' }} />
            </div>

            {/* the meadow: balloons in the sky, Kailia and the friend on the stepping stones */}
            <Stage world="flick" className="mt-2" style={{ aspectRatio: '3 / 3.4' }}>
              {/* stepping stones and the finish flag */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {Array.from({ length: round.length }, (_, i) => (
                  <ellipse key={i} cx={stoneX(i)} cy="94" rx="5.6" ry="2.6" filter="url(#kp-brush)"
                    fill={i < lit ? '#FFE27A' : '#C9C2B4'} stroke="#3b2416" strokeWidth="0.5"
                    style={{ transition: 'fill 0.5s', filter: i < lit ? 'drop-shadow(0 0 2px #FDE047)' : undefined }} />
                ))}
              </svg>
              <div className="absolute pointer-events-none" style={{ left: `${stoneX(round.length) - 2}%`, top: '72%' }} aria-hidden="true">
                <svg width="30" height="56" viewBox="0 0 30 56" className="fg-sway" style={{ transformOrigin: '3px 56px' }}>
                  <path d="M3 4 V56" stroke="#3b2416" strokeWidth="3" strokeLinecap="round" />
                  <path d="M4 5 Q16 1 28 7 Q16 12 4 18z" fill={lit >= round.length ? '#FDE047' : '#F87171'} stroke="#3b2416" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </div>

              {/* balloons */}
              {q.choices.map((c, i) => {
                const spot = (SPOTS[q.choices.length] ?? SPOTS[4])[i];
                const isPopped = popped === c;
                const glow = hintOn && c === q.answer && !popped;
                const long = c.length > 9;
                return (
                  <div key={`${qIdx}-${c}`} className="absolute" style={{ left: `${spot[0]}%`, top: `${spot[1]}%`, width: 112, marginLeft: -56, marginTop: -50, zIndex: 8 }}>
                    <div className="float-up-in" style={{ animationDelay: `${i * 120}ms` }}>
                      <div className="bob-drift relative" style={{
                        animationDuration: `${3.4 + i * 0.7}s`, animationDelay: `${i * -0.9}s`,
                        ['--dx' as string]: `${4 + step * 3}px`, ['--dy' as string]: `${6 + step * 2}px`,
                      } as React.CSSProperties}>
                        <button onClick={() => tapBalloon(c, spot)} aria-label={c}
                          className={`relative flex flex-col items-center w-full ${isPopped ? 'pop' : ''} ${wobble === c ? 'soft-wobble' : ''} ${glow ? 'hint-glow' : ''}`}>
                          <span className="flex items-center justify-center text-center font-extrabold text-white leading-tight"
                            style={{
                              width: 104, minHeight: 94, padding: '10px 12px',
                              borderRadius: '50% 50% 48% 48% / 56% 56% 44% 44%',
                              background: `radial-gradient(circle at 32% 26%, #ffffffcc 0 9%, ${BALLOON_COLORS[i % 4]} 34%, ${BALLOON_COLORS[i % 4]} 70%, #00000022 100%)`,
                              border: '3px solid #3b2416',
                              fontSize: long ? 15 : c.length > 5 ? 20 : 28,
                              textShadow: '0 2px 0 rgba(59,36,22,0.55)',
                              boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
                            }}>
                            {c}
                          </span>
                          <svg width="20" height="34" viewBox="0 0 20 34" aria-hidden="true" style={{ marginTop: -3 }}>
                            <path d="M6 0 L14 0 L10 6z" fill={BALLOON_COLORS[i % 4]} stroke="#3b2416" strokeWidth="1.6" strokeLinejoin="round" />
                            <path d="M10 6 q-6 6 0 11 q6 5 0 10 q-4 4 -1 7" stroke="#3b2416" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <KailiaActor x={kailiaX} y={95} h={78} hop={kailiaHop} />
              <div data-pet>
                {(() => {
                  // after two tries the friend runs to stand under the right
                  // balloon and bounces (the friends are drawn sitting, so
                  // they stay on the ground instead of floating in the sky)
                  const hintSpot = hintOn && !popped ? (SPOTS[q.choices.length] ?? SPOTS[4])[q.choices.indexOf(q.answer)] : null;
                  const kx = kailiaX;
                  const near = hintSpot && Math.abs(hintSpot[0] - kx) < 14;
                  const px = hintSpot && !near ? hintSpot[0] : kx > 70 ? kx - 14 : kx + 14;
                  const py = 95;
                  return (
                    <Actor art={pet.art} name={pet.name} x={px} y={py} h={56}
                      mood={hintSpot ? 'talk' : petMood} moodKey={petMoodKey} moveMs={900}
                      onTap={() => { setPetMood('dance'); timersRef.current.push(setTimeout(() => setPetMood('idle'), 1300)); }} z={9} />
                  );
                })()}
              </div>
              {burstLayer}
            </Stage>

            <div className="flex items-center gap-3 mt-2 rounded-2xl p-2.5"
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
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
          <div className="text-center bounce-in">
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-blue-100 font-semibold mb-1">
              {chapter.name} reader! Every signpost is glowing again.
            </p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-blue-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-blue-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
