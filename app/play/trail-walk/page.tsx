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
import { makeChallenge as makeChallengeBase, DOMAIN, type Challenge } from '@/lib/creatureChallenges';
import { Critter } from '@/components/characters/CritterSprite';
import RunnerSprite from '@/components/characters/RunnerSprite';

// ─── Kailia's Trail ───────────────────────────────────────────────────────────
// A side-scrolling adventure walk: Kailia strolls a parallax landscape and
// meets creatures along the way. Every creature poses a different kind of
// challenge — counting, memory, matching, feelings, words — and joins her
// party when solved. A relaxed, one-tap-to-walk companion to the full
// top-down world in Kailia's Journey.

const SEG = 860;              // px walked between encounters
const STOPS = 4;              // creatures per walk

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// level folded into the picked index so each walk's mix of challenge
// types rotates from level to level, then delegates to the shared,
// picture-matches-question generator used by both Journey and Trail.
function makeChallenge(i: number, tier: string, level: number): Challenge {
  return makeChallengeBase(i + level, tier);
}

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

export default function TrailWalkPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'walking' | 'challenge' | 'memoryShow' | 'done'>('intro');
  const [offset, setOffset] = useState(0);
  const [stop, setStop] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [party, setParty] = useState<string[]>([]);
  const [noelLine, setNoelLine] = useState('');
  const wrongsRef = useRef(0);
  const attemptsRef = useRef(0);
  const startedRef = useRef(0);
  const challengesRef = useRef<Challenge[]>([]);

  useEffect(() => { setLevel(nextGameLevel('trail-walk')); }, []);

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

  const startWalk = useCallback(() => {
    challengesRef.current = Array.from({ length: STOPS }, (_, i) => makeChallenge(i, tier, level));
    wrongsRef.current = 0; attemptsRef.current = 0; startedRef.current = Date.now();
    setParty([]);
    setOffset(0);
    setStop(0);
    setChallenge(null);
    setNoelLine("Off we go! Tap WALK and let's see who we meet!");
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
      const totalMs = Date.now() - startedRef.current;
      logQuestMetric('processing', 'trail-walk', { level, friends: STOPS, wrongAnswers: wrongsRef.current, totalMs });
      awardStarlight(Math.max(10, 16 + level * 2 - wrongsRef.current * 2));
      recordGameLevel('trail-walk', level);
      sfx.fanfare();
      setPhase('done');
    }
  }

  function answer(opt: { label: string; correct: boolean }) {
    if (phase !== 'challenge' || !challenge) return;
    attemptsRef.current += 1;
    if (opt.correct) {
      logQuestMetric(DOMAIN[challenge.type], `trail-walk-${challenge.type}`, { level, attempts: attemptsRef.current });
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
        : challenge.type === 'memory' ? 'Try to remember who was missing… look again!'
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
            🥾 Kailia&apos;s Trail <span className="text-xs font-bold text-amber-700 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.4)' }}>Lv {level}</span>
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
              <PandaSprite size={128} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={96} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-800 text-xl font-semibold leading-relaxed mb-3">
                A brand-new trail stretches past the meadows! 🥾
              </p>
              <p className="text-gray-800 text-xl font-semibold leading-relaxed">
                Walk with Kailia, meet the creatures along the way, and solve each one&apos;s little
                riddle — every solved friend <strong>joins your party</strong> until you reach the flag! 🚩
              </p>
            </div>
            <button onClick={startWalk}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-sky-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Start the walk! 🥾
            </button>
            <div style={{ filter: 'invert(0.85)' }}><SkillIntro gameId="trail-walk" /></div>
          </div>
        )}

        {phase !== 'intro' && (
          <>
            <div className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ height: 300, border: '3px solid rgba(14,116,144,0.25)',
                background: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 55%, #86efac 62%, #4ade80 100%)' }}>
              <span className="absolute" style={{ right: 14, top: 10, fontSize: 30, pointerEvents: 'none' }}>☀️</span>

              <div className="absolute inset-0" style={{ transform: `translateX(${-offset * 0.35}px)`, transition: walking.current ? 'transform 2.6s linear' : 'none', pointerEvents: 'none' }}>
                {scenery.far.map((s, i) => (
                  <span key={i} className="absolute" style={{ left: s.x, top: 28 + (i % 3) * 16, fontSize: s.s, opacity: 0.6 }}>{s.e}</span>
                ))}
              </div>

              <div onTransitionEnd={arrived} className="absolute inset-0"
                style={{ transform: `translateX(${-offset}px)`, transition: walking.current ? 'transform 2.6s linear' : 'none' }}>
                {scenery.near.map((s, i) => (
                  <span key={i} className="absolute" style={{ left: s.x, bottom: 34 + (i % 2) * 8, fontSize: s.s, pointerEvents: 'none' }}>{s.e}</span>
                ))}
                {challengesRef.current.map((c, i) => (
                  i >= party.length && (
                    <span key={i} className="absolute" style={{ left: (i + 1) * SEG + kailiaScreenX + 90, bottom: 40, pointerEvents: 'none' }}>
                      <Critter emoji={c.creature} size={40} />
                    </span>
                  )
                ))}
                <span className="absolute" style={{ left: (STOPS + 1) * SEG + kailiaScreenX + 90, bottom: 40, fontSize: 44, pointerEvents: 'none' }}>🚩</span>
              </div>

              <div className="absolute left-0 right-0" style={{ bottom: 0, height: 34, background: 'linear-gradient(180deg, #16a34a, #15803d)', pointerEvents: 'none' }} />

              {/* Noel runs alongside Kailia — bigger, since he's a giant panda */}
              <div className="absolute" style={{ left: kailiaScreenX - 96, bottom: 18, zIndex: 4 }}>
                <RunnerSprite character="noel" action={walking.current ? 'run' : 'idle'} width={88} height={57} />
              </div>
              <div className="absolute" style={{ left: kailiaScreenX - 28, bottom: 22, zIndex: 5 }}>
                <RunnerSprite character="kailia" action={walking.current ? 'run' : 'idle'} width={58} height={57} />
              </div>
              {party.map((p, i) => (
                <span key={i} className="absolute" style={{ left: kailiaScreenX - 150 - i * 30, bottom: 40, animation: walking.current ? `bob 0.5s ${i * 0.1}s infinite` : 'none', zIndex: 3 }}>
                  <Critter emoji={p} size={30} />
                </span>
              ))}

              {phase === 'walking' && !walking.current && (
                <button onClick={walk}
                  className="absolute left-1/2 -translate-x-1/2 bottom-3 px-8 py-2.5 rounded-full text-base font-extrabold text-white shadow-xl pulse"
                  style={{ background: '#0E7490', zIndex: 10 }}>
                  Walk! 🥾▶
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(14,116,144,0.2)' }}>
              <PandaSprite size={46} expression={phase === 'challenge' ? 'thinking' : 'happy'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-base font-bold text-gray-900 bg-white relative shadow-sm">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>

            {phase === 'memoryShow' && challenge?.memoryFull && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <p className="text-sm font-extrabold text-sky-900 mb-2">👀 Look closely — remember everyone here!</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {challenge.memoryFull.map((c, i) => <Critter key={i} emoji={c} size={56} />)}
                </div>
              </div>
            )}

            {phase === 'challenge' && challenge && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <div className="flex justify-center mb-1"><Critter emoji={challenge.creature} size={64} /></div>
                <p className="text-base font-extrabold text-sky-950 mb-2">{challenge.ask}</p>
                {challenge.memoryCast && (
                  <>
                    <p className="text-xs font-bold text-slate-500">Still here:</p>
                    <div className="flex gap-2 justify-center flex-wrap mb-2">
                      {challenge.memoryCast.map((c, i) => <Critter key={i} emoji={c} size={40} />)}
                    </div>
                  </>
                )}
                {challenge.display && (
                  <p className="mb-3" style={{ fontSize: 30, fontWeight: 800, color: '#0c4a6e', letterSpacing: challenge.type === 'count' ? 2 : 0 }}>
                    {challenge.display}
                  </p>
                )}
                <div className="flex gap-3 justify-center flex-wrap">
                  {challenge.options.map((o, i) => (
                    <button key={i} data-correct={o.correct} onClick={() => answer(o)}
                      className="px-6 py-3 rounded-2xl font-extrabold shadow transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                      style={{ background: '#F0F9FF', border: '2.5px solid #7DD3FC', color: '#0c4a6e', fontSize: /\d/.test(o.label) ? 22 : 28 }}>
                      {(challenge.type === 'memory' || challenge.type === 'word')
                        ? <Critter emoji={o.label} size={36} animate={false} />
                        : o.label}
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
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="flex gap-2 justify-center flex-wrap mb-2">
              {party.map((p, i) => <Critter key={i} emoji={p} size={44} />)}
            </div>
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
