'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import Stage from '@/components/friends/kit/Stage';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import { Book } from '../_pieces/pieces';

// ─── Story Sparks ─────────────────────────────────────────────────────────────
// A choose-what-happens-next story adventure (visual-novel style): the
// Story Keepers' books lost their pages, and the child steers each tale
// beat by beat, picking what really happens next. Sensible choices move
// the story forward with sparkle; silly ones get a giggle and a retry.
// Measures narrative & social inference (communication domain).
//
// The tale is acted out in the Story Keepers' dreamy sky: the two "what
// happens next" choices float as story bubbles, Kailia walks one page
// stone further toward the Story Keepers' book with every page that comes
// back, the friend cheers, wobbles with a giggle at silly picks and, after
// two silly picks on one page, runs under the bubble that really happens.
// The scene and choice pictures are still emoji (Noel's 🐼 is drawn as
// Noel); titles, buttons and rewards use drawn art.

interface Choice { t: string; e: string; }
interface Beat { scene: string; text: string; good: Choice; silly: Choice; }
interface Story { title: string; emoji: string; beats: Beat[]; }

const STORIES: Story[] = [
  {
    title: 'The Fallen Ice Cream', emoji: '🍦',
    beats: [
      { scene: '🍦😊', text: 'Kailia got a big strawberry ice cream!',
        good: { t: 'She says thank you and smiles', e: '😊💕' }, silly: { t: 'She wears it like a hat', e: '🍦🎩' } },
      { scene: '🍦💥', text: 'Oh no — the ice cream fell on the ground!',
        good: { t: 'Kailia feels sad', e: '😢' }, silly: { t: 'The ground says "yum!"', e: '😋🌍' } },
      { scene: '😢', text: "Kailia's eyes fill with tears.",
        good: { t: 'Noel shares his ice cream', e: '🐼🍨' }, silly: { t: 'Noel eats a cloud', e: '🐼☁️' } },
      { scene: '🍨💕', text: 'They share the ice cream together!',
        good: { t: 'Both friends feel happy', e: '😊😊' }, silly: { t: 'The spoon runs away', e: '🥄💨' } },
    ],
  },
  {
    title: 'The Lost Teddy', emoji: '🧸',
    beats: [
      { scene: '🧸❓', text: 'Teddy is missing at bedtime!',
        good: { t: 'Kailia looks under the bed', e: '🔦🛏️' }, silly: { t: 'She looks inside a banana', e: '🍌👀' } },
      { scene: '🛏️🔦', text: 'Teddy is not under the bed…',
        good: { t: 'She asks Noel for help', e: '🐼🙏' }, silly: { t: 'She asks the wall', e: '🧱💬' } },
      { scene: '🐼💡', text: 'Noel remembers — the garden!',
        good: { t: 'They look outside together', e: '🌳👀' }, silly: { t: 'They dig to the moon', e: '🌙⛏️' } },
      { scene: '🧸🌼', text: 'Teddy was napping in the flowers!',
        good: { t: 'Kailia hugs Teddy tight', e: '🤗🧸' }, silly: { t: 'Teddy drives away in a car', e: '🧸🚗' } },
    ],
  },
  {
    title: 'The Rainy Day', emoji: '🌧️',
    beats: [
      { scene: '🌧️😮', text: "Rain! The picnic can't happen outside.",
        good: { t: 'The friends feel a little sad', e: '😔' }, silly: { t: 'They drink the rain with straws', e: '🥤🌧️' } },
      { scene: '😔🏠', text: 'Kailia and Noel stay inside.',
        good: { t: 'Noel gets an idea!', e: '💡🐼' }, silly: { t: 'Noel turns into a fish', e: '🐟' } },
      { scene: '💡✨', text: '"Let\'s picnic on the living room floor!"',
        good: { t: 'They spread a blanket inside', e: '🧺🏠' }, silly: { t: 'They put the blanket on the roof', e: '🏠🧺' } },
      { scene: '🧺😊', text: 'An inside picnic — cozy and dry!',
        good: { t: 'They share snacks and giggle', e: '🍪😄' }, silly: { t: 'The sandwiches sing a song', e: '🥪🎤' } },
    ],
  },
  {
    title: 'The Little Seed', emoji: '🌱',
    beats: [
      { scene: '🌱', text: 'Kailia plants a tiny seed.',
        good: { t: 'She waters it gently', e: '💧🌱' }, silly: { t: 'She reads it a bedtime story', e: '📖🌱' } },
      { scene: '💧☀️', text: 'Water and sunshine, every single day…',
        good: { t: 'A little sprout peeks out!', e: '🌿✨' }, silly: { t: 'A pizza grows instead', e: '🍕' } },
      { scene: '🌿😊', text: 'The sprout grows taller and taller.',
        good: { t: 'Kailia keeps caring for it', e: '💚🌿' }, silly: { t: 'She teaches it karate', e: '🥋🌿' } },
      { scene: '🌸', text: 'One day — a beautiful flower!',
        good: { t: 'She shows Noel proudly', e: '🐼🌸' }, silly: { t: 'The flower flies to school', e: '🌸✈️' } },
    ],
  },
];

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound optional */ }
}
const sfx = {
  spark: () => playNotes([{ f: 740, t: 0, d: 0.1 }, { f: 988, t: 0.07, d: 0.18 }]),
  giggle: () => playNotes([{ f: 392, t: 0, d: 0.09 }, { f: 494, t: 0.09, d: 0.09 }, { f: 392, t: 0.18, d: 0.12 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

// Kailia's page stones along the cloud path, then the Story Keepers' book
const stoneX = (i: number) => 10 + i * 16;
const BOOK_X = 90;
// where the two story bubbles float (centre x, % of the scene)
const BUBBLE_X = [26, 74];

const clampPct = (v: number) => Math.max(10, Math.min(90, v));

// a scene or choice picture: emoji stay as they are, but Noel (🐼) is
// drawn as Noel himself
function Pic({ s, size }: { s: string; size: number }) {
  const parts = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), x => x.segment);
  return (
    <span className="inline-flex items-end justify-center" style={{ fontSize: size, lineHeight: 1.1 }}>
      {parts.map((g, i) => g === '🐼'
        ? <PandaSprite key={i} size={Math.round(size * 0.95)} expression="happy" />
        : <span key={i}>{g}</span>)}
    </span>
  );
}

export default function StorySparksPage() {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [beatIdx, setBeatIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);        // randomize option order
  const [beatKey, setBeatKey] = useState(0);            // retrigger animations
  const [noelLine, setNoelLine] = useState('You hold the story spark — choose what really happens next!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('excited');
  const statsRef = useRef({ silly: 0, startedAt: 0 });
  const busyRef = useRef(false);

  // the scene: Kailia walks the page stones, the friend plays along
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [step, setStep] = useState(0);           // page stones Kailia has reached
  const [kailiaHop, setKailiaHop] = useState(0);
  const [picked, setPicked] = useState<'good' | null>(null);
  const [wobble, setWobble] = useState(false);
  const [sillyThisBeat, setSillyThisBeat] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  useEffect(() => { setLevel(nextGameLevel('story-sparks')); }, []);

  const story = STORIES[(level - 1) % STORIES.length];
  const beat = story.beats[beatIdx];

  const startLevel = useCallback(() => {
    statsRef.current = { silly: 0, startedAt: Date.now() };
    setBeatIdx(0);
    setFlipped(Math.random() < 0.5);
    setBeatKey(k => k + 1);
    setStep(0);
    setPicked(null);
    setSillyThisBeat(0);
    setNoelLine(`"${story.title}" — page one! What happens next?`);
    setNoelMood('excited');
    setPhase('playing');
  }, [story.title]);

  function choose(kind: 'good' | 'silly', slot: number) {
    if (phase !== 'playing' || busyRef.current) return;
    if (kind === 'good') {
      busyRef.current = true;
      sfx.spark();
      setNoelLine('Yes! The story sparkles on!');
      setNoelMood('celebrating');
      // the page comes back: sparkles, Kailia walks on and jumps, the friend cheers
      setPicked('good');
      fire(BUBBLE_X[slot], 28, ['#FFE066', '#FFFFFF', '#FF9EC7', '#C4B5FD'], 14, 80);
      setStep(beatIdx + 1);
      setKailiaHop(n => n + 1);
      setPetMood('cheer');
      setTimeout(() => {
        busyRef.current = false;
        if (beatIdx + 1 < story.beats.length) {
          setBeatIdx(i => i + 1);
          setFlipped(Math.random() < 0.5);
          setBeatKey(k => k + 1);
          setPicked(null);
          setSillyThisBeat(0);
          setNoelMood('excited');
          setNoelLine('And then…?');
        } else {
          const s = statsRef.current;
          logQuestMetric('communication', 'story-sparks', {
            level, beats: story.beats.length, sillyPicks: s.silly, totalMs: Date.now() - s.startedAt,
          });
          awardStarlight(Math.max(8, 12 + level * 2 - s.silly));
          recordGameLevel('story-sparks', level);
          sfx.fanfare();
          setPhase('levelDone');
        }
      }, 700);
    } else {
      statsRef.current.silly += 1;
      sfx.giggle();
      setSillyThisBeat(n => n + 1);
      setWobble(true);
      setTimeout(() => setWobble(false), 600);
      setPetMood('oops');
      setNoelLine(sillyThisBeat + 1 >= 2
        ? `Hee hee — so silly! Look, ${pet.name} is under what REALLY happens!`
        : 'Hee hee — that WOULD be silly! What would REALLY happen?');
      setNoelMood('thinking');
    }
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
  }

  const options: { kind: 'good' | 'silly'; c: Choice }[] = flipped
    ? [{ kind: 'silly', c: beat.silly }, { kind: 'good', c: beat.good }]
    : [{ kind: 'good', c: beat.good }, { kind: 'silly', c: beat.silly }];

  // Kailia stands on the last page stone she reached; the last stone is beside the book
  const kailiaX = stoneX(step);
  const hintOn = sillyThisBeat >= 2 && !picked;
  const goodSlot = options.findIndex(o => o.kind === 'good');
  // the friend stays beside Kailia; with a hint it runs under the bubble that really happens
  const hintX = BUBBLE_X[goodSlot];
  const petX = hintOn
    ? (Math.abs(hintX - kailiaX) < 15 ? clampPct(hintX + (hintX > kailiaX ? 9 : -9)) : hintX)
    : clampPct(kailiaX + (kailiaX > 70 ? -15 : 15));

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #3b0764 0%, #6b21a8 60%, #9d174d 130%)' }}>
      <div className="max-w-md mx-auto px-3 relative">

        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Story Sparks <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-14">
            {phase === 'playing' && story.beats.map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#FDE047', boxShadow: i < step ? '0 0 8px #FDE047' : undefined, opacity: i < step ? 1 : 0.3 }} />
            ))}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={120} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={92} expression="excited" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 66)} kind="pet" />
              <span className="mb-2 float inline-block" style={{ animationDelay: '0.5s' }}><Book size={50} /></span>
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                The Story Keepers&apos; books lost their pages!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                YOU hold the story spark — at every page, choose what <strong>really</strong> happens
                next, and the tale comes back to life!
              </p>
            </div>
            <LevelPath gameId="story-sparks" level={level} onPick={setLevel} />
            <button onClick={startLevel}
              className="mt-6 px-10 py-4 rounded-full text-xl font-extrabold text-purple-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Open &ldquo;{story.title}&rdquo;
            </button>
            <SkillIntro gameId="story-sparks" />
          </div>
        )}

        {phase === 'playing' && (
          <div className="relative z-10">
            {/* the story page */}
            <div key={beatKey} className="rounded-3xl px-5 py-4 mt-1 text-center bounce-in shadow-2xl relative"
              style={{ background: 'linear-gradient(180deg, #FFFBEB, #FEF3C7)', border: '3px solid #3b2416' }}>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">{story.title} · page {beatIdx + 1}</p>
              <span className="block my-2 float"><Pic s={beat.scene} size={52} /></span>
              <p className="text-lg font-extrabold text-amber-950 leading-snug">{beat.text}</p>
            </div>

            {/* the Story Keepers' sky: two story bubbles, the page-stone path and the book */}
            <Stage world="nova" className="mt-3" style={{ aspectRatio: '1 / 0.86' }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <g filter="url(#kp-brush)">
                  <path d="M0 86 Q20 80 42 85 T78 83 T100 84 V100 H0z" fill="#F3D9F7" stroke="#3b2416" strokeWidth="0.5" />
                  <path d="M0 92 Q30 88 60 92 T100 90 V100 H0z" fill="#E8C3F0" />
                </g>
                {story.beats.map((_, i) => (
                  <ellipse key={i} cx={stoneX(i + 1)} cy="94" rx="5.4" ry="2.4" filter="url(#kp-brush)"
                    fill={i < step ? '#FFE27A' : '#FFFFFF'} stroke="#3b2416" strokeWidth="0.5"
                    style={{ transition: 'fill 0.5s', filter: i < step ? 'drop-shadow(0 0 2px #FDE047)' : undefined }} />
                ))}
              </svg>
              {/* the Story Keepers' book on its stand: it opens when the tale is whole */}
              <div className="absolute pointer-events-none" style={{ left: `${BOOK_X}%`, top: '96%', transform: 'translate(-50%, -100%)', zIndex: 4 }} aria-hidden="true">
                <div className={step >= story.beats.length ? 'star-burst' : 'float'} style={{ filter: 'drop-shadow(0 0 10px rgba(255,241,184,0.8))' }}>
                  <Book size={58} open={step >= story.beats.length} />
                </div>
                <svg width="58" height="18" viewBox="0 0 58 18" style={{ display: 'block', marginTop: -6 }}>
                  <g filter="url(#kp-edge)"><path d="M10 2 H48 L42 16 H16z" fill="#C9822F" stroke="#3b2416" strokeWidth="2" strokeLinejoin="round" /></g>
                </svg>
              </div>

              {/* story bubbles */}
              {options.map((o, i) => {
                const glow = hintOn && o.kind === 'good';
                return (
                  <div key={`${beatKey}-${o.c.t}`} className="absolute" style={{ left: `${BUBBLE_X[i]}%`, top: '4%', width: '46%', transform: 'translateX(-50%)', zIndex: 8 }}>
                    <div className="float-up-in" style={{ animationDelay: `${i * 140}ms` }}>
                      <div className={picked === 'good' && o.kind === 'good' ? 'pop' : wobble && o.kind === 'silly' ? 'soft-wobble' : ''}>
                      <div className="bob-drift" style={{ animationDuration: `${3.6 + i * 0.8}s`, animationDelay: `${i * -1.1}s`, ['--dx' as string]: '3px', ['--dy' as string]: '5px' } as React.CSSProperties}>
                        <button data-kind={o.kind} onClick={() => choose(o.kind, i)}
                          className={`w-full flex flex-col items-center gap-1.5 rounded-[26px] px-2.5 py-3 text-center transition-transform active:scale-[0.96] ${glow ? 'hint-glow' : ''}`}
                          style={{ background: glow ? 'linear-gradient(180deg, #FFFDF0, #FFF3C4)' : 'linear-gradient(180deg, #FFFFFF, #FFF4FB)', border: '3px solid #3b2416',
                            boxShadow: glow ? '0 6px 0 rgba(59,36,22,0.25), 0 0 0 4px #FDE047, 0 0 22px rgba(253,224,71,0.9)' : '0 6px 0 rgba(59,36,22,0.25), 0 0 18px rgba(255,214,245,0.5)', minHeight: 150 }}>
                          <Pic s={o.c.e} size={38} />
                          <span className="font-extrabold text-purple-950 leading-snug" style={{ fontSize: 16 }}>{o.c.t}</span>
                        </button>
                        {/* bubble tail */}
                        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true" style={{ display: 'block', margin: '-3px auto 0' }}>
                          <path d="M2 1 Q11 4 20 1 L11 13z" fill="#FFF4FB" stroke="#3b2416" strokeWidth="2.4" strokeLinejoin="round" />
                          <path d="M1 0 H21" stroke="#FFF4FB" strokeWidth="3" />
                        </svg>
                      </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <KailiaActor x={kailiaX} y={95} h={80} hop={kailiaHop} moveMs={2200} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petX} y={95} h={58}
                  mood={hintOn ? 'talk' : petMood} moodKey={petMoodKey} moveMs={hintOn ? 900 : 480} onTap={tickle} z={7} />
              </div>
              {burstLayer}
            </Stage>

            <p className="text-center text-sm font-extrabold text-pink-200 mt-2">What happens next? Tap a bubble!</p>

            <div className="flex items-center gap-3 mt-2 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
            <p className="text-center text-[11px] text-pink-200 mt-2" style={{ opacity: 0.75 }}>
              Grown-ups: reading the pages aloud together makes this quest extra powerful!
            </p>
          </div>
        )}
      </div>

      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #581c87, #9d174d)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-3 star-burst" style={{ filter: 'drop-shadow(0 0 18px rgba(255,241,184,0.7))' }}><Book size={92} open /></span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-pink-100 font-semibold mb-1">The story lives again! &ldquo;{story.title}&rdquo; is back on the Story Keepers&apos; shelf.</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{Math.max(8, 12 + level * 2 - statsRef.current.silly)} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Next story ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
