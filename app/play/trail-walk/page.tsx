'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { makeChallenge as makeChallengeBase, DOMAIN, CREATURE_NAME, type Challenge } from '@/lib/creatureChallenges';
import { Critter } from '@/components/characters/CritterSprite';
import RunnerSprite from '@/components/characters/RunnerSprite';
import LiveArt from '@/components/characters/LiveArt';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import { petWidth } from '@/lib/companionTrails';
import { Mountain, PineTree, Cloud, Mushroom } from '@/components/scenery/Scenery';
import { Sun, Flower, Butterfly } from '@/components/scenery/SkyDecor';

// ─── Kailia's Trail ───────────────────────────────────────────────────────────
// A side-scrolling adventure walk: Kailia strolls a parallax landscape and
// meets creatures along the way. Every creature poses a different kind of
// challenge — counting, memory, matching, feelings, words — and joins her
// party when solved. A relaxed, one-tap-to-walk companion to the full
// top-down world in Kailia's Journey.
//
// The trail is painted and alive (drifting clouds, a turning sun, swaying
// grass, a butterfly) and every picture is drawn, never an emoji. The
// child's friend hops along ahead of Kailia, cheers each new friend,
// wobbles when an answer isn't it yet, and after two tries runs over to
// the creature while the right answer glows.

const SEG = 860;              // px walked between encounters
const STOPS = 4;              // creatures per walk
const SCENE_H = 300;
const FEET = 28;              // px from the scene bottom to the walkers' feet

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// level folded into the picked index so each walk's mix of challenge
// types rotates from level to level, then delegates to the shared,
// picture-matches-question generator used by both Journey and Trail.
function makeChallenge(i: number, tier: string, level: number): Challenge {
  return makeChallengeBase(i + level, tier);
}

const nameOf = (creature: string) => CREATURE_NAME[creature] ?? 'friend';
// the shared generator writes the creature emoji into its counting
// question; on screen we say its name instead
const askText = (ch: Challenge) =>
  ch.type === 'count' ? ch.ask.replace(ch.creature, `${nameOf(ch.creature)}s`) : ch.ask;

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
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

type NearKind = 'pine' | 'tree' | 'flower' | 'mushroom' | 'rock' | 'bush';
type FarKind = 'mountain' | 'hill' | 'cloud';

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
  const [tries, setTries] = useState(0);        // misses on the current creature (for the hint)
  const [wobble, setWobble] = useState<number | null>(null);
  const [hop, setHop] = useState(0);
  const [earned, setEarned] = useState(0);
  const [atFlag, setAtFlag] = useState(false);
  const wrongsRef = useRef(0);
  const attemptsRef = useRef(0);
  const startedRef = useRef(0);
  const challengesRef = useRef<Challenge[]>([]);
  const [stops, setStops] = useState<Challenge[]>([]);

  // the friend playing along
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const { layer: burstLayer, fire } = useBursts();

  // the scene's width, so everyone stands in proportion on any phone
  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneW, setSceneW] = useState(364);
  const inScene = phase !== 'intro';
  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const update = () => setSceneW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [inScene]);

  useEffect(() => { setLevel(nextGameLevel('trail-walk')); }, []);

  const scenery = useMemo(() => {
    const worldW = (STOPS + 1) * SEG + 600;
    const near: { x: number; k: NearKind; s: number }[] = [];
    const far: { x: number; k: FarKind; s: number }[] = [];
    const nearPool: NearKind[] = ['pine', 'tree', 'flower', 'mushroom', 'flower', 'rock', 'bush'];
    const farPool: FarKind[] = ['mountain', 'hill', 'mountain', 'cloud'];
    // at every stop the open path between Kailia and the creature stays
    // clear of props, so the friend (and its hint spot) never stands in a tree
    const clearFrom = Math.round(sceneW * 0.47) + 50, clearTo = Math.round(sceneW * 0.82) + 56;
    const blocked = (x: number) => Array.from({ length: STOPS + 2 }, (_, k) => k * SEG)
      .some(o => x + 62 > o + clearFrom && x < o + clearTo);
    for (let x = 100; x < worldW; x += 130 + Math.random() * 160) {
      const k = pick(nearPool), sc = 0.8 + Math.random() * 0.5;
      if (!blocked(x)) near.push({ x, k, s: sc });
    }
    for (let x = 0; x < worldW; x += 260 + Math.random() * 240) far.push({ x, k: pick(farPool), s: 0.8 + Math.random() * 0.5 });
    return { near, far, worldW };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, sceneW]);

  const startWalk = useCallback(() => {
    challengesRef.current = Array.from({ length: STOPS }, (_, i) => makeChallenge(i, tier, level));
    setStops(challengesRef.current);
    wrongsRef.current = 0; attemptsRef.current = 0; startedRef.current = Date.now();
    setParty([]);
    setOffset(0);
    setStop(0);
    setChallenge(null);
    setTries(0);
    setAtFlag(false);
    setNoelLine("Off we go! Tap WALK and let's see who we meet!");
    setPhase('walking');
  }, [tier, level]);

  const walking = useRef(false);
  const [isWalking, setIsWalking] = useState(false);
  function walk() {
    if (phase !== 'walking' || walking.current) return;
    walking.current = true;
    setIsWalking(true);
    setPetMood('talk'); // hops along
    setOffset((stop + 1) * SEG);
  }

  function arrived() {
    if (!walking.current) return;
    walking.current = false;
    setIsWalking(false);
    setPetMood('cheer');
    if (stop < STOPS) {
      const ch = challengesRef.current[stop];
      setChallenge(ch);
      setTries(0);
      attemptsRef.current = 0;
      if (ch.type === 'memory') {
        setPhase('memoryShow');
        setTimeout(() => setPhase('challenge'), 2400);
      } else {
        setPhase('challenge');
      }
      setNoelLine(askText(ch));
    } else {
      const totalMs = Date.now() - startedRef.current;
      logQuestMetric('processing', 'trail-walk', { level, friends: STOPS, wrongAnswers: wrongsRef.current, totalMs });
      const stars = Math.max(10, 16 + level * 2 - wrongsRef.current * 2);
      awardStarlight(stars);
      recordGameLevel('trail-walk', level);
      setEarned(stars);
      setAtFlag(true);
      setNoelLine('We made it to the flag! Hooray!');
      sfx.fanfare();
      setHop(n => n + 1);
      fire(creatureX / sceneW * 100 + 6, 70, ['#FFE066', '#FFFFFF', '#F87171', '#8BE3FF'], 16, 90);
      setTimeout(() => setPhase('done'), 900);
    }
  }

  function answer(opt: { label: string; correct: boolean }, idx: number) {
    if (phase !== 'challenge' || !challenge) return;
    attemptsRef.current += 1;
    if (opt.correct) {
      logQuestMetric(DOMAIN[challenge.type], `trail-walk-${challenge.type}`, { level, attempts: attemptsRef.current });
      sfx.join();
      setParty(p => [...p, challenge.creature]);
      setNoelLine(`The ${nameOf(challenge.creature)} joins the journey! ${party.length + 2 <= STOPS ? 'Onward!' : 'The flag is close!'}`);
      setPetMood('cheer');
      setHop(n => n + 1);
      fire((creatureX + 20) / sceneW * 100, ((SCENE_H - FEET - 24) / SCENE_H) * 100, ['#FFE066', '#FFFFFF', '#FF9EC7', '#8BE3FF'], 14, 70);
      setChallenge(null);
      setTries(0);
      setStop(s => s + 1);
      setPhase('walking');
    } else {
      wrongsRef.current += 1;
      sfx.hmm();
      setTries(t => t + 1);
      setWobble(idx);
      setTimeout(() => setWobble(null), 600);
      const hint = tries + 1 >= 2;
      setPetMood(hint ? 'talk' : 'oops');
      setNoelLine(hint
        ? `${pet.name} ran over to help. Look at the glowing one!`
        : challenge.type === 'count' ? 'Count them one by one with your finger!'
        : challenge.type === 'memory' ? 'Try to remember who was missing… look again!'
        : challenge.type === 'word' ? 'Sound it out slowly. What does it start with?'
        : 'Look really closely and try again!');
    }
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood(walking.current ? 'talk' : 'idle'), 1300);
  }

  // where everyone stands (px from the scene's left), in proportion to its width
  const noelLeft = Math.round(sceneW * 0.22);
  const kailiaLeft = Math.round(sceneW * 0.47);
  const creatureX = Math.round(sceneW * 0.82);  // a met creature (or the flag) stops here
  const hintOn = phase === 'challenge' && tries >= 2;
  // the friend hops along just ahead of Kailia; for a hint it runs to the creature
  const petXpct = hintOn ? ((creatureX - 28) / sceneW) * 100 : ((kailiaLeft + 58 + 26) / sceneW) * 100;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 45%, #86efac 100%)' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-sky-900 whitespace-nowrap">← Map</Link>
          <h1 className="text-xl font-extrabold text-sky-950 drop-shadow-sm whitespace-nowrap">
            Kailia&apos;s Trail <span className="text-xs font-bold text-amber-800 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex items-center justify-end gap-0.5 w-20">
            {phase !== 'intro' && Array.from({ length: STOPS }).map((_, i) => (
              i < party.length
                ? <Critter key={i} emoji={party[i]} size={20} animate={false} />
                : <span key={i} className="inline-block w-3 h-3 mx-1 rounded-full" style={{ background: '#FFFFFF', border: '2.5px solid #0E7490' }} />
            ))}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={120} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={90} expression="excited" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 66)} kind="pet" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                A brand-new trail stretches past the meadows!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                Walk with Kailia, meet the creatures along the way, and solve each one&apos;s little
                riddle. Every solved friend <strong>joins your party</strong> until you reach the flag!
              </p>
            </div>
            <LevelPath gameId="trail-walk" level={level} onPick={setLevel} />
            <button onClick={startWalk}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-sky-950 shadow-xl transition-transform hover:scale-105 inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              <span className="whitespace-nowrap">Start the walk!</span> <TrailFlag size={26} />
            </button>
            <div style={{ filter: 'invert(0.85)' }}><SkillIntro gameId="trail-walk" /></div>
          </div>
        )}

        {phase !== 'intro' && (
          <>
            <div ref={sceneRef} className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ height: SCENE_H, border: '3px solid rgba(14,116,144,0.3)', boxShadow: '0 8px 0 rgba(14,116,144,0.18)',
                background: 'linear-gradient(180deg, #6cc8f5 0%, #bfe7fb 52%, #e3f6ff 66%)' }}>
              {/* sky: the sun turns slowly, clouds drift by on their own */}
              <Sun size={48} className="absolute" style={{ right: 14, top: 12, pointerEvents: 'none' }} />
              {[{ top: 18, s: 64, d: 46, delay: 6 }, { top: 58, s: 44, d: 60, delay: 32 }].map((c, i) => (
                <div key={i} className="fg-drift absolute left-0 pointer-events-none" style={{ top: c.top, animationDuration: `${c.d}s`, animationDelay: `${-c.delay}s`, opacity: 0.9 }}>
                  <Cloud size={c.s} />
                </div>
              ))}

              {/* far layer (slow parallax): mountains, hills and puffy clouds */}
              <div className="absolute inset-0" style={{ transform: `translateX(${-offset * 0.35}px)`, transition: isWalking ? 'transform 2.6s linear' : 'none', pointerEvents: 'none' }}>
                {scenery.far.map((s, i) => (
                  s.k === 'cloud'
                    ? <Cloud key={i} size={46 * s.s} className="absolute" style={{ left: s.x, top: 30 + (i % 3) * 14, opacity: 0.85 }} />
                    : s.k === 'hill'
                      ? <Hill key={i} w={150 * s.s} className="absolute" style={{ left: s.x, bottom: 70 }} />
                      : <Mountain key={i} size={92 * s.s} className="absolute" style={{ left: s.x, bottom: 70 }} />
                ))}
              </div>

              {/* the meadow and the dirt path everyone walks on */}
              <Ground />

              {/* near layer: walks past at full speed */}
              <div onTransitionEnd={arrived} className="absolute inset-0"
                style={{ transform: `translateX(${-offset}px)`, transition: isWalking ? 'transform 2.6s linear' : 'none' }}>
                {scenery.near.map((s, i) => (
                  <span key={i} className="absolute" style={{ left: s.x, bottom: 40 + (i % 2) * 6, pointerEvents: 'none' }}>
                    <NearThing k={s.k} s={s.s} i={i} />
                  </span>
                ))}
                {stops.map((c, i) => (
                  i >= party.length && (
                    <span key={i} className="absolute" style={{ left: (i + 1) * SEG + creatureX, bottom: FEET - 2, pointerEvents: 'none' }}>
                      <Critter emoji={c.creature} size={44} />
                    </span>
                  )
                ))}
                <span className="absolute" style={{ left: (STOPS + 1) * SEG + creatureX, bottom: FEET - 4, pointerEvents: 'none' }}>
                  <TrailFlag size={52} raised={phase === 'done'} />
                </span>
              </div>

              {/* a butterfly flutters over the meadow */}
              <Butterfly size={24} className="absolute" style={{ left: '30%', top: 110, pointerEvents: 'none' }} />

              {/* the new friends follow at the back of the line */}
              {party.map((p, i) => (
                <span key={i} className="absolute" style={{ left: Math.max(2, noelLeft - 34 - i * 22), bottom: FEET + 2 + (i % 2) * 6, zIndex: 3 - (i % 2),
                  animation: isWalking ? `tw-bob 0.5s ${i * 0.1}s infinite` : 'none' }}>
                  <Critter emoji={p} size={28} />
                </span>
              ))}
              {/* Noel runs alongside Kailia — bigger, since he's a giant panda,
                  with a clear gap so neither sprite covers the other */}
              <div className="absolute" style={{ left: noelLeft, bottom: FEET - 2, zIndex: 4 }}>
                <RunnerSprite character="noel" action={isWalking ? 'run' : 'idle'} width={88} height={57} />
              </div>
              <div className="absolute" style={{ left: kailiaLeft, bottom: FEET, zIndex: 5 }}>
                <div key={hop} className={hop ? 'kp-hop' : undefined} style={{ transformOrigin: '50% 100%' }}>
                  <RunnerSprite character="kailia" action={isWalking ? 'run' : 'idle'} width={58} height={57} />
                </div>
              </div>
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petXpct} y={((SCENE_H - FEET + 2) / SCENE_H) * 100} h={46}
                  mood={petMood} moodKey={petMoodKey} moveMs={hintOn ? 700 : 500} onTap={tickle} z={6} />
              </div>
              {burstLayer}
            </div>
            <style>{`@keyframes tw-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`}</style>

            {/* Noel's dialogue gets its own banner directly under the scene */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-3"
              style={{ background: 'rgba(255,255,255,0.85)', border: '2px solid rgba(14,116,144,0.25)' }}>
              <PandaSprite size={54} expression={phase === 'challenge' ? 'thinking' : 'happy'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-4 py-2.5 text-lg font-bold text-gray-900 bg-white relative shadow-sm flex-1">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' }} />
                {noelLine}
              </div>
            </div>

            {phase === 'walking' && !isWalking && !atFlag && (
              <div className="flex justify-center mt-3">
                <button onClick={walk}
                  className="px-10 py-3 rounded-full text-lg font-extrabold text-white shadow-xl pulse whitespace-nowrap"
                  style={{ background: '#0E7490' }}>
                  Walk! ▶
                </button>
              </div>
            )}

            {phase === 'memoryShow' && challenge?.memoryFull && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <p className="text-base font-extrabold text-sky-900 mb-2">Look closely, remember everyone here!</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {challenge.memoryFull.map((c, i) => <Critter key={i} emoji={c} size={56} />)}
                </div>
              </div>
            )}

            {phase === 'challenge' && challenge && (
              <div className="rounded-3xl p-5 mt-3 text-center bounce-in bg-white shadow-xl">
                <div className="flex justify-center mb-1"><Critter emoji={challenge.creature} size={64} /></div>
                <p className="text-base font-extrabold text-sky-950 mb-2">{askText(challenge)}</p>
                {challenge.memoryCast && (
                  <>
                    <p className="text-sm font-bold text-slate-600">Still here:</p>
                    <div className="flex gap-2 justify-center flex-wrap mb-2">
                      {challenge.memoryCast.map((c, i) => <Critter key={i} emoji={c} size={40} />)}
                    </div>
                  </>
                )}
                {challenge.display && (
                  <div className="mb-3 flex items-center justify-center flex-wrap gap-1">
                    {challenge.type === 'count'
                      ? Array.from({ length: [...challenge.display.matchAll(/\p{Extended_Pictographic}️?/gu)].length }, (_, i) => (
                          <Critter key={i} emoji={challenge.creature} size={36} animate={false} />
                        ))
                      : challenge.type === 'color'
                        ? <PaintDot emoji={challenge.display} size={56} />
                        : <FeelingScene text={challenge.display} size={56} />}
                  </div>
                )}
                <div className="flex gap-3 justify-center flex-wrap">
                  {challenge.options.map((o, i) => (
                    <button key={i} data-correct={o.correct} onClick={() => answer(o, i)}
                      aria-label={challenge.type === 'color' ? colorName(o.label) : challenge.type === 'feeling' ? (o.label === '😊' ? 'happy' : 'sad') : (challenge.type === 'memory' || challenge.type === 'word') ? nameOf(o.label) : o.label}
                      className={`px-6 py-3 rounded-2xl font-extrabold shadow transition-transform hover:scale-105 active:scale-95 flex items-center justify-center ${wobble === i ? 'soft-wobble' : ''} ${hintOn && o.correct ? 'hint-glow' : ''}`}
                      style={{ minWidth: 72, minHeight: 64, background: '#F0F9FF', border: `2.5px solid ${hintOn && o.correct ? '#F59E0B' : '#7DD3FC'}`, color: '#0c4a6e', fontSize: 26 }}>
                      {(challenge.type === 'memory' || challenge.type === 'word')
                        ? <Critter emoji={o.label} size={58} animate={false} />
                        : challenge.type === 'color' ? <PaintDot emoji={o.label} size={44} />
                        : challenge.type === 'feeling' ? <Face happy={o.label === '😊'} size={48} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-y-auto"
          style={{ background: 'linear-gradient(135deg, #0e7490, #15803d)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-2 star-burst"><TrailFlag size={80} raised /></span>
            <div className="flex items-end justify-center gap-2 mb-2">
              <PandaSprite size={116} expression="celebrating" className="float" />
              <KailiaSprite size={88} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 76)} kind="pet" />
              </span>
            </div>
            <div className="flex gap-2 justify-center flex-wrap mb-2">
              {party.map((p, i) => <Critter key={i} emoji={p} size={44} />)}
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-emerald-50 font-bold text-lg mb-1">You reached the flag!</p>
            <p className="text-emerald-100 font-semibold mb-2">{party.length} new friends walked the whole way with you, and {pet.name} is dancing!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { const nl = level + 1; setLevel(nl); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-emerald-950 shadow-xl transition-transform hover:scale-105 inline-block"
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

const SK = '#3b2416';

// ── The meadow floor: grass with a dirt path and tufts that sway ──
function Ground() {
  return (
    <svg className="absolute left-0 bottom-0 w-full pointer-events-none" height="78" viewBox="0 0 100 78" preserveAspectRatio="none" aria-hidden="true">
      <g filter="url(#kp-brush)">
        <path d="M0 18 Q20 10 40 16 T80 14 T100 15 V78 H0z" fill="#6CC46A" stroke={SK} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <path d="M0 30 Q30 25 60 30 T100 28 V78 H0z" fill="#58B35A" />
        {/* the trail */}
        <path d="M0 48 Q25 44 50 48 T100 47 V66 Q75 70 50 66 T0 67z" fill="#E7C796" stroke={SK} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        <path d="M0 70 Q30 66 60 70 T100 69 V78 H0z" fill="#4E9E4F" />
      </g>
      {[6, 19, 33, 46, 58, 71, 84, 95].map((x, i) => (
        <g key={i} className="fg-sway" style={{ transformOrigin: `${x}px 30px`, transformBox: 'view-box', animationDelay: `${-i * 0.55}s` } as React.CSSProperties}>
          <path d={`M${x} 30 q-1 -6 -2.4 -8 M${x} 30 q0.2 -8 0.8 -10 M${x} 30 q1.2 -5 2.8 -6.5`} stroke="#2F7A41" strokeWidth="1.4" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

// a soft rolling hill for the far layer
function Hill({ w, className, style }: { w: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 40" width={w} height={w * 0.4} className={className} style={style} aria-hidden="true">
      <g filter="url(#kp-brush)">
        <path d="M0 40 Q25 2 55 8 Q85 14 100 40z" fill="#8FD18A" stroke={SK} strokeWidth="1.6" />
        <path d="M30 14 Q42 8 54 10" stroke="#C8F0C0" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// trees, flowers, mushrooms, rocks and bushes along the trail
function NearThing({ k, s, i }: { k: NearKind; s: number; i: number }) {
  if (k === 'pine') return <PineTree size={34 * s} />;
  if (k === 'mushroom') return <Mushroom size={24 * s} />;
  if (k === 'flower') return <Flower size={22 * s} />;
  const w = (k === 'tree' ? 46 : k === 'bush' ? 38 : 30) * s;
  return (
    <svg viewBox="0 0 50 50" width={w} height={w} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      <g filter="url(#kp-brush)">
        {k === 'tree' && (
          <g className="fg-sway" style={{ transformOrigin: '25px 50px', animationDelay: `${-i * 0.7}s`, animationDuration: '5s' }}>
            <rect x="21" y="30" width="8" height="20" rx="2" fill="#92400E" stroke={SK} strokeWidth="2" />
            <circle cx="25" cy="20" r="17" fill="#4CAF50" stroke={SK} strokeWidth="2.2" />
            <circle cx="18" cy="14" r="6" fill="#7ED67F" opacity="0.8" />
            <circle cx="32" cy="22" r="2" fill="#F87171" stroke={SK} strokeWidth="0.8" />
            <circle cx="20" cy="27" r="2" fill="#F87171" stroke={SK} strokeWidth="0.8" />
          </g>
        )}
        {k === 'bush' && (
          <>
            <circle cx="15" cy="38" r="11" fill="#3FA055" stroke={SK} strokeWidth="2" />
            <circle cx="35" cy="38" r="11" fill="#3FA055" stroke={SK} strokeWidth="2" />
            <circle cx="25" cy="30" r="13" fill="#4CB863" stroke={SK} strokeWidth="2" />
            <path d="M17 26 Q22 20 29 21" stroke="#A7E9A4" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        )}
        {k === 'rock' && (
          <>
            <path d="M6 48 Q4 34 14 28 Q24 22 36 28 Q46 34 44 48z" fill="#B7B2AD" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 36 Q18 29 27 29" stroke="#F5F2EE" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}

// the finish flag on its pole (raised = waving bright yellow)
function TrailFlag({ size, raised }: { size: number; raised?: boolean }) {
  return (
    <svg width={size * 0.6} height={size} viewBox="0 0 30 50" aria-hidden="true" style={{ display: 'inline-block', overflow: 'visible' }}>
      <g filter="url(#kp-brush)">
        <path d="M4 3 V50" stroke={SK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="4" cy="3" r="2.6" fill="#FDE047" stroke={SK} strokeWidth="1.2" />
        <g className="fg-sway" style={{ transformOrigin: '4px 12px' }}>
          <path d="M5 5 Q16 1 28 7 Q16 12 5 18z" fill={raised ? '#FDE047' : '#F87171'} stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

// ── Colour challenge: drawn paint blobs instead of coloured-circle emoji ──
const COLORS: Record<string, [string, string]> = {
  '🔴': ['#EF4444', 'red'], '🔵': ['#3B82F6', 'blue'], '🟢': ['#22C55E', 'green'],
  '🟡': ['#FACC15', 'yellow'], '🟣': ['#A855F7', 'purple'], '🟠': ['#F97316', 'orange'],
};
const colorName = (e: string) => COLORS[e]?.[1] ?? 'color';
function PaintDot({ emoji, size }: { emoji: string; size: number }) {
  const c = COLORS[emoji]?.[0] ?? '#9CA3AF';
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g filter="url(#kp-brush)">
        <path d="M20 3 Q31 3 35 12 Q39 21 34 30 Q28 38 18 37 Q7 36 4 26 Q2 15 9 8 Q14 3 20 3z" fill={c} stroke={SK} strokeWidth="2.4" />
        <path d="M11 13 Q14 8 20 7" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

// ── Feelings challenge: little drawn scenes and faces ──
function Face({ happy, size }: { happy: boolean; size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <g filter="url(#kp-brush)">
        <circle cx="20" cy="20" r="17" fill="#FFD966" stroke={SK} strokeWidth="2.4" />
        <circle cx="14" cy="16" r="2.2" fill={SK} /><circle cx="26" cy="16" r="2.2" fill={SK} />
        {happy
          ? <><path d="M12 23 Q20 31 28 23" stroke={SK} strokeWidth="2.4" fill="none" strokeLinecap="round" /><circle cx="10" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" /><circle cx="30" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" /></>
          : <><path d="M13 28 Q20 22 27 28" stroke={SK} strokeWidth="2.4" fill="none" strokeLinecap="round" /><path d="M26 19 Q28 23 26 25 Q24 23 26 19z" fill="#60A5FA" stroke={SK} strokeWidth="0.8" /></>}
      </g>
    </svg>
  );
}

function SceneIcon({ e, size }: { e: string; size: number }) {
  const body = (() => {
    switch (e) {
      case '🎂': return (<>
        <rect x="7" y="20" width="26" height="14" rx="3" fill="#F9A8D4" stroke={SK} strokeWidth="2" />
        <path d="M7 24 Q12 28 16 24 Q20 28 24 24 Q28 28 33 24" stroke="#FFFFFF" strokeWidth="2" fill="none" />
        <rect x="18" y="10" width="4" height="10" rx="1" fill="#93C5FD" stroke={SK} strokeWidth="1.4" />
        <path d="M20 4 Q23 7 20 10 Q17 7 20 4z" fill="#FBBF24" stroke={SK} strokeWidth="1" /></>);
      case '🎈': return (<>
        <ellipse cx="20" cy="15" rx="10" ry="12" fill="#F87171" stroke={SK} strokeWidth="2" />
        <path d="M15 9 Q17 6 21 6" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M20 27 q-3 4 0 7 q3 3 0 6" stroke={SK} strokeWidth="1.4" fill="none" /></>);
      case '💔': return (<>
        <path d="M20 34 L6 19 Q2 10 10 7 Q16 5 19 11 L16 18 L21 23 L18 30z" fill="#F87171" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 11 Q25 5 31 7 Q38 10 34 19 L22 32 L25 24 L20 18z" fill="#F87171" stroke={SK} strokeWidth="2" strokeLinejoin="round" /></>);
      case '🧸': return (<>
        <circle cx="12" cy="9" r="4.5" fill="#C08552" stroke={SK} strokeWidth="1.6" /><circle cx="28" cy="9" r="4.5" fill="#C08552" stroke={SK} strokeWidth="1.6" />
        <circle cx="20" cy="15" r="9" fill="#C08552" stroke={SK} strokeWidth="1.8" />
        <ellipse cx="20" cy="31" rx="10" ry="8" fill="#C08552" stroke={SK} strokeWidth="1.8" />
        <ellipse cx="20" cy="18" rx="3.5" ry="2.6" fill="#F3D3B0" /><circle cx="17" cy="13" r="1.2" fill={SK} /><circle cx="23" cy="13" r="1.2" fill={SK} /></>);
      case '🍦': return (<>
        <path d="M12 18 L20 37 L28 18z" fill="#E8B66A" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M15 22 L25 22 M17 27 L23 27" stroke={SK} strokeWidth="1" opacity="0.5" />
        <circle cx="20" cy="13" r="9" fill="#FBCFE8" stroke={SK} strokeWidth="2" />
        <circle cx="17" cy="10" r="2" fill="#FFFFFF" /></>);
      case '☀️': return (<>
        {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${20 + Math.cos(a) * 12} ${20 + Math.sin(a) * 12} L${20 + Math.cos(a) * 17} ${20 + Math.sin(a) * 17}`} stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" />; })}
        <circle cx="20" cy="20" r="9" fill="#FDE047" stroke={SK} strokeWidth="2" /></>);
      case '🌧️': return (<>
        <path d="M8 20 Q4 12 12 10 Q15 3 23 6 Q32 4 33 13 Q38 16 34 21z" fill="#CBD5E1" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
        {[12, 20, 28].map(x => <path key={x} d={`M${x} 25 l-2 7`} stroke="#3B82F6" strokeWidth="2.4" strokeLinecap="round" />)}</>);
      case '⚽': return (<>
        <circle cx="20" cy="20" r="15" fill="#FFFFFF" stroke={SK} strokeWidth="2" />
        <path d="M20 13 L26 17 L24 24 L16 24 L14 17z" fill={SK} />
        <path d="M20 13 V6 M26 17 L33 14 M24 24 L28 31 M16 24 L12 31 M14 17 L7 14" stroke={SK} strokeWidth="1.4" /></>);
      case '🎁': return (<>
        <rect x="7" y="15" width="26" height="20" rx="2" fill="#60A5FA" stroke={SK} strokeWidth="2" />
        <rect x="5" y="11" width="30" height="6" rx="2" fill="#93C5FD" stroke={SK} strokeWidth="2" />
        <path d="M20 11 V35" stroke="#FDE047" strokeWidth="4" />
        <path d="M20 11 Q12 2 10 8 Q10 12 20 11 Q28 2 30 8 Q30 12 20 11z" fill="#FDE047" stroke={SK} strokeWidth="1.4" /></>);
      case '🎀': return (<>
        <path d="M20 20 L6 11 Q3 20 6 29z" fill="#F472B6" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 20 L34 11 Q37 20 34 29z" fill="#F472B6" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 21 L14 35 M22 21 L26 35" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="20" r="4" fill="#EC4899" stroke={SK} strokeWidth="1.6" /></>);
      case '🤕': return (<>
        <circle cx="20" cy="20" r="16" fill="#FFD966" stroke={SK} strokeWidth="2" />
        <circle cx="14" cy="18" r="1.8" fill={SK} /><circle cx="26" cy="18" r="1.8" fill={SK} />
        <path d="M14 28 Q20 23 26 28" stroke={SK} strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="9" y="6" width="22" height="7" rx="3" fill="#FFFFFF" stroke={SK} strokeWidth="1.6" transform="rotate(-12 20 9)" /></>);
      case '🩹': return (<>
        <rect x="4" y="14" width="32" height="12" rx="6" fill="#F5C49A" stroke={SK} strokeWidth="2" transform="rotate(-25 20 20)" />
        <rect x="14" y="15" width="12" height="10" rx="2" fill="#FBE3CC" stroke={SK} strokeWidth="1.2" transform="rotate(-25 20 20)" /></>);
      default: return null;
    }
  })();
  if (!body) return <span style={{ fontSize: size * 0.8, lineHeight: 1 }}>{e}</span>;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <g filter="url(#kp-brush)">{body}</g>
    </svg>
  );
}

function FeelingScene({ text, size }: { text: string; size: number }) {
  const parts = [...text.matchAll(/\p{Extended_Pictographic}️?/gu)].map(m => m[0]);
  return <>{parts.map((e, i) => <SceneIcon key={i} e={e} size={size} />)}</>;
}
