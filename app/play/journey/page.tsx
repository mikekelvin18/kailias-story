'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';

// ─── Kailia's Journey ─────────────────────────────────────────────────────────
// A side-scrolling adventure world: Kailia walks through a living
// landscape (parallax sky, hills, meadow) and meets creatures along the
// trail. Every creature poses a different kind of challenge — counting,
// memory, matching, feelings, words — and joins her party when solved.
// One world, many skills; friends collected Pokémon-style.

const SEG = 860;              // px walked between encounters
const STOPS = 4;              // creatures per journey

type ChType = 'count' | 'memory' | 'color' | 'feeling' | 'word';

interface Challenge {
  type: ChType;
  creature: string;
  ask: string;
  display: string;            // big display content
  options: { label: string; correct: boolean }[];
  memoryCast?: string[];      // memory type: who was there
}

const CREATURES: Record<ChType, string[]> = {
  count: ['🐉', '🐲'], memory: ['🦉', '🦝'], color: ['🦜', '🦚'], feeling: ['🐰', '🐨'], word: ['🦌', '🦢'],
};
const GEMS = ['💎', '🔮', '🟡', '🍓'];
const COLOR_SET = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
const FEELINGS: [string, boolean][] = [['🎂🎈', true], ['💔🧸', false], ['🍦☀️', true], ['🌧️⚽', false], ['🎁🎀', true], ['🤕🩹', false]];
const WORDS: [string, string, string[]][] = [
  ['cat', '🐱', ['🐶', '🍎']], ['sun', '☀️', ['🌙', '🐟']], ['dog', '🐶', ['🐱', '⭐']],
  ['fish', '🐟', ['🐦', '🍪']], ['star', '⭐', ['🌸', '🐢']], ['bee', '🐝', ['🦋', '🍞']],
];
const MEMORY_POOL = ['🦊', '🐸', '🦋', '🐢', '🐿️', '🦔', '🐝'];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function makeChallenge(i: number, tier: string, level: number): Challenge {
  const types: ChType[] = tier === 'tiny'
    ? ['count', 'color', 'memory', 'feeling']
    : ['count', 'memory', 'word', 'color', 'feeling'];
  const type = types[(i + level) % types.length];
  const creature = pick(CREATURES[type]);

  if (type === 'count') {
    const max = tier === 'tiny' ? 4 : tier === 'small' ? 6 : Math.min(9, 6 + level);
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
    return { type, creature, ask: 'Find my gem\'s twin color!', display: c,
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

const DOMAIN: Record<ChType, string> = { count: 'math', memory: 'processing', color: 'sensory', feeling: 'communication', word: 'reading' };

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.11, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
    });
  } catch { /* optional */ }
}
const sfx = {
  join: () => playNotes([{ f: 659, t: 0, d: 0.1 }, { f: 880, t: 0.08, d: 0.2 }]),
  hmm: () => playNotes([{ f: 294, t: 0, d: 0.15 }, { f: 262, t: 0.13, d: 0.2 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function JourneyPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'walking' | 'challenge' | 'memoryShow' | 'done'>('intro');
  const [offset, setOffset] = useState(0);
  const [stop, setStop] = useState(0);                 // which encounter is next (0..3)
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [party, setParty] = useState<string[]>([]);
  const [noelLine, setNoelLine] = useState('');
  const wrongsRef = useRef(0);
  const attemptsRef = useRef(0);
  const startedRef = useRef(0);
  const challengesRef = useRef<Challenge[]>([]);

  useEffect(() => { setLevel(nextGameLevel('journey')); }, []);

  // world scenery, regenerated per level
  const scenery = useMemo(() => {
    const worldW = (STOPS + 1) * SEG + 600;
    const near: { x: number; e: string; s: number }[] = [];
    const far: { x: number; e: string; s: number }[] = [];
    const nearPool = ['🌲', '🌳', '🌷', '🍄', '🌼', '🪨', '🌻'];
    const farPool = ['⛰️', '🏔️', '☁️', '☁️'];
    for (let x = 100; x < worldW; x += 130 + Math.random() * 160) near.push({ x, e: pick(nearPool), s: 20 + Math.random() * 18 });
    for (let x = 0; x < worldW; x += 260 + Math.random() * 240) far.push({ x, e: pick(farPool), s: 26 + Math.random() * 22 });
    return { near, far, worldW };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const startJourney = useCallback(() => {
    challengesRef.current = Array.from({ length: STOPS }, (_, i) => makeChallenge(i, tier, level));
    wrongsRef.current = 0; attemptsRef.current = 0; startedRef.current = Date.now();
    setParty([]);
    setOffset(0);
    setStop(0);
    setChallenge(null);
    setNoelLine('Off we go! Tap WALK and let\'s see who we meet!');
    setPhase('walking');
  }, [tier, level]);

  const walking = useRef(false);
  function walk() {
    if (phase !== 'walking' || walking.current) return;
    walking.current = true;
    setOffset((stop + 1) * SEG);
  }

  function arrived() {
    if (!walking.current) return;
    walking.current = false;
    if (stop < STOPS) {
      const ch = challengesRef.current[stop];
      setChallenge(ch);
      attemptsRef.current = 0;
      if (ch.type === 'memory') {
        setPhase('memoryShow');
        setTimeout(() => setPhase('challenge'), 2400);
      } else {
        setPhase('challenge');
      }
      setNoelLine(ch.ask);
    } else {
      // reached the flag!
      const totalMs = Date.now() - startedRef.current;
      logQuestMetric('processing', 'journey', { level, friends: STOPS, wrongAnswers: wrongsRef.current, totalMs });
      awardStarlight(Math.max(10, 16 + level * 2 - wrongsRef.current * 2));
      recordGameLevel('journey', level);
      sfx.fanfare();
      setPhase('done');
    }
  }

  function answer(opt: { label: string; correct: boolean }) {
    if (phase !== 'challenge' || !challenge) return;
    attemptsRef.current += 1;
    if (opt.correct) {
      logQuestMetric(DOMAIN[challenge.type], `journey-${challenge.type}`, { level, attempts: attemptsRef.current });
      sfx.join();
      setParty(p => [...p, challenge.creature]);
      setNoelLine(`${challenge.creature} joins the journey! ${party.length + 2 <= STOPS ? 'Onward!' : 'The flag is close!'}`);
      setChallenge(null);
      setStop(s => s + 1);
      setPhase('walking');
    } else {
      wrongsRef.current += 1;
      sfx.hmm();
      setNoelLine(challenge.type === 'count' ? 'Count them one by one with your finger!'
        : challenge.type === 'memory' ? 'Close your eyes and picture who was standing there…'
        : challenge.type === 'word' ? 'Sound it out slowly — what does it start with?'
        : 'Look really closely and try again!');
    }
  }

  const kailiaScreenX = 110;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 45%, #86efac 100%)' }}>
      <style>{`@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`}</style>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-sky-800">← Map</Link>
          <h1 className="text-xl font-extrabold text-sky-950 drop-shadow-sm">
            🥾 Kailia&apos;s Journey <span className="text-xs font-bold text-amber-700 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="text-sm w-16 text-right">
            {phase !== 'intro' && Array.from({ length: STOPS }).map((_, i) => (
              <span key={i} style={{ opacity: i < party.length ? 1 : 0.3 }}>{i < party.length ? party[i] : '·'}</span>
            ))}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={90} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={110} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                A brand-new trail stretches past the meadows! 🥾
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Walk with Kailia, meet the creatures along the way, and solve each one&apos;s little
                riddle — every solved friend <strong>joins your party</strong> until you reach the flag! 🚩
              </p>
            </div>
            <button onClick={startJourney}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-sky-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Start the journey! 🥾
            </button>
            <div style={{ filter: 'invert(0.85)' }}><SkillIntro gameId="journey" /></div>
          </div>
        )}

        {phase !== 'intro' && (
          <>
            {/* ── the world ── */}
            <div className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ height: 300, border: '3px solid rgba(14,116,144,0.25)',
                background: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 55%, #86efac 62%, #4ade80 100%)' }}>
              <span className="absolute" style={{ right: 14, top: 10, fontSize: 30, pointerEvents: 'none' }}>☀️</span>

              {/* far layer (slow parallax) */}
              <div className="absolute inset-0" style={{ transform: `translateX(${-offset * 0.35}px)`, transition: walking.current ? 'transform 2.6s linear' : 'none', pointerEvents: 'none' }}>
                {scenery.far.map((s, i) => (
                  <span key={i} className="absolute" style={{ left: s.x, top: 28 + (i % 3) * 16, fontSize: s.s, opacity: 0.6 }}>{s.e}</span>
                ))}
              </div>

              {/* near layer — the trail world */}
              <div onTransitionEnd={arrived} className="absolute inset-0"
                style={{ transform: `translateX(${-offset}px)`, transition: walking.current ? 'transform 2.6s linear' : 'none' }}>
                {scenery.near.map((s, i) => (
                  <span key={i} className="absolute" style={{ left: s.x, bottom: 34 + (i % 2) * 8, fontSize: s.s, pointerEvents: 'none' }}>{s.e}</span>
                ))}
                {/* creatures on the trail */}
                {challengesRef.current.map((c, i) => (
                  i >= party.length && (
                    <span key={i} className="absolute float" style={{ left: (i + 1) * SEG + kailiaScreenX + 90, bottom: 40, fontSize: 40, pointerEvents: 'none' }}>{c.creature}</span>
                  )
                ))}
                {/* the goal flag */}
                <span className="absolute" style={{ left: (STOPS + 1) * SEG + kailiaScreenX + 90, bottom: 40, fontSize: 44, pointerEvents: 'none' }}>🚩</span>
              </div>

              {/* ground stripe */}
              <div className="absolute left-0 right-0" style={{ bottom: 0, height: 34, background: 'linear-gradient(180deg, #16a34a, #15803d)', pointerEvents: 'none' }} />

              {/* Kailia (fixed) + party trailing behind */}
              <div className="absolute" style={{ left: kailiaScreenX - 30, bottom: 22, animation: walking.current ? 'bob 0.45s infinite' : 'none', zIndex: 5 }}>
                <KailiaSprite size={56} expression={phase === 'done' ? 'celebrating' : 'happy'} />
              </div>
              {party.map((p, i) => (
                <span key={i} className="absolute" style={{ left: kailiaScreenX - 70 - i * 30, bottom: 40, fontSize: 24, animation: walking.current ? `bob 0.5s ${i * 0.1}s infinite` : 'none', zIndex: 4 }}>{p}</span>
              ))}

              {/* walk button */}
              {phase === 'walking' && !walking.current && (
                <button onClick={walk}
                  className="absolute left-1/2 -translate-x-1/2 bottom-3 px-8 py-2.5 rounded-full text-base font-extrabold text-white shadow-xl pulse"
                  style={{ background: '#0E7490', zIndex: 10 }}>
                  Walk! 🥾▶
                </button>
              )}
            </div>

            {/* Noel guide */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(14,116,144,0.2)' }}>
              <PandaSprite size={46} expression={phase === 'challenge' ? 'thinking' : 'happy'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative shadow-sm">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>

            {/* ── memory flash ── */}
            {phase === 'memoryShow' && challenge?.memoryCast && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <p className="text-sm font-extrabold text-sky-900 mb-2">👀 Remember who&apos;s here…</p>
                <p style={{ fontSize: 44, letterSpacing: 8 }}>{challenge.memoryCast.join('')}</p>
              </div>
            )}

            {/* ── challenge card ── */}
            {phase === 'challenge' && challenge && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <p className="text-3xl mb-1">{challenge.creature}</p>
                <p className="text-base font-extrabold text-sky-950 mb-2">{challenge.ask}</p>
                {challenge.display && (
                  <p className="mb-3" style={{ fontSize: challenge.type === 'word' ? 30 : 30, fontWeight: 800, color: '#0c4a6e', letterSpacing: challenge.type === 'count' ? 2 : 0 }}>
                    {challenge.display}
                  </p>
                )}
                <div className="flex gap-3 justify-center flex-wrap">
                  {challenge.options.map((o, i) => (
                    <button key={i} data-correct={o.correct} onClick={() => answer(o)}
                      className="px-6 py-3 rounded-2xl font-extrabold shadow transition-transform hover:scale-105 active:scale-95"
                      style={{ background: '#F0F9FF', border: '2.5px solid #7DD3FC', color: '#0c4a6e', fontSize: /\d/.test(o.label) ? 22 : 28 }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {phase === 'done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0e7490ee, #15803dee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">🚩</span>
            <div className="flex items-end justify-center gap-2 mb-2">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <p style={{ fontSize: 34, letterSpacing: 6 }} className="mb-2">{party.join('')}</p>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">You reached the flag!</h2>
            <p className="text-emerald-100 font-semibold mb-1">{party.length} new friends walked the whole way with you! 🥾</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(10, 16 + level * 2 - wrongsRef.current * 2)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { const nl = level + 1; setLevel(nl); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
