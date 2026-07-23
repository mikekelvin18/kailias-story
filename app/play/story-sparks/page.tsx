'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';

// ─── Story Sparks ─────────────────────────────────────────────────────────────
// A choose-what-happens-next story adventure (visual-novel style): the
// Story Keepers' books lost their pages, and the child steers each tale
// beat by beat, picking what really happens next. Sensible choices move
// the story forward with sparkle; silly ones get a giggle and a retry.
// Measures narrative & social inference (communication domain).

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

function playNotes(notes: { f: number; t: number; d: number }[]) {
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

  useEffect(() => { setLevel(nextGameLevel('story-sparks')); }, []);

  const story = STORIES[(level - 1) % STORIES.length];
  const beat = story.beats[beatIdx];

  const startLevel = useCallback(() => {
    statsRef.current = { silly: 0, startedAt: Date.now() };
    setBeatIdx(0);
    setFlipped(Math.random() < 0.5);
    setBeatKey(k => k + 1);
    setNoelLine(`"${story.title}" — page one! What happens next?`);
    setNoelMood('excited');
    setPhase('playing');
  }, [story.title]);

  function choose(kind: 'good' | 'silly') {
    if (phase !== 'playing' || busyRef.current) return;
    if (kind === 'good') {
      busyRef.current = true;
      sfx.spark();
      setNoelLine('Yes! The story sparkles on! ✨');
      setNoelMood('celebrating');
      setTimeout(() => {
        busyRef.current = false;
        if (beatIdx + 1 < story.beats.length) {
          setBeatIdx(i => i + 1);
          setFlipped(Math.random() < 0.5);
          setBeatKey(k => k + 1);
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
      setNoelLine('Hee hee — that WOULD be silly! What would REALLY happen?');
      setNoelMood('thinking');
    }
  }

  const options: { kind: 'good' | 'silly'; c: Choice }[] = flipped
    ? [{ kind: 'silly', c: beat.silly }, { kind: 'good', c: beat.good }]
    : [{ kind: 'good', c: beat.good }, { kind: 'silly', c: beat.silly }];

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #3b0764 0%, #6b21a8 60%, #9d174d 130%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        {['📖', '✨', '🕯️', '⭐'].map((e, i) => (
          <span key={i} className="absolute sparkle" style={{ left: `${[6, 84, 46, 14][i]}%`, top: [70, 40, 8, 170][i], fontSize: [24, 16, 22, 14][i], opacity: 0.5, animationDelay: `${i * 0.6}s`, pointerEvents: 'none' }}>{e}</span>
        ))}

        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="text-sm font-bold text-pink-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            ✨ Story Sparks <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="text-xs font-bold text-pink-200 w-12 text-right">
            {phase === 'playing' ? `${beatIdx + 1}/${story.beats.length}` : ''}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-8 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={128} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="text-6xl mb-4 float">📖</span>
              <KailiaSprite size={96} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                The Story Keepers&apos; books lost their pages! 📖✨
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                YOU hold the story spark — at every page, choose what <strong>really</strong> happens
                next, and the tale comes back to life!
              </p>
            </div>
            <button onClick={startLevel}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-purple-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Open &ldquo;{story.title}&rdquo; {story.emoji}
            </button>
            <SkillIntro gameId="story-sparks" />
          </div>
        )}

        {phase === 'playing' && (
          <div className="relative z-10" key={beatKey}>
            {/* the story page */}
            <div className="rounded-3xl p-5 mt-2 text-center bounce-in shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #FFFBEB, #FEF3C7)', border: '3px solid #FDE68A' }}>
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">{story.emoji} {story.title} · page {beatIdx + 1}</p>
              <span className="block text-6xl my-3 float">{beat.scene}</span>
              <p className="text-lg font-extrabold text-amber-950 leading-snug">{beat.text}</p>
            </div>

            <p className="text-center text-sm font-extrabold text-pink-200 mt-4 mb-2">What happens next?</p>
            <div className="space-y-2.5">
              {options.map(o => (
                <button key={o.c.t} data-kind={o.kind} onClick={() => choose(o.kind)}
                  className="w-full flex items-center gap-3 rounded-2xl p-3.5 bg-white shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.97] text-left">
                  <span className="text-3xl" style={{ flexShrink: 0 }}>{o.c.e}</span>
                  <span className="font-extrabold text-purple-900">{o.c.t}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
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
          style={{ background: 'linear-gradient(135deg, #581c87ee, #9d174dee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">{story.emoji}</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">The story lives again!</h2>
            <p className="text-pink-100 font-semibold mb-1">&ldquo;{story.title}&rdquo; is back on the Story Keepers&apos; shelf! 📖</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(8, 12 + level * 2 - statsRef.current.silly)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Next story ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-purple-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
