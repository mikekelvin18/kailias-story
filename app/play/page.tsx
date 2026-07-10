'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import {
  LANDS, Land, AdventureProgress, loadProgress, recordQuestPlay, markCelebrated,
  landStars, isLandComplete, isLandUnlocked, currentLandIndex, totalStars, maxStars,
} from '@/lib/adventure';

// ── Tiny sound effects (no audio files needed) ────────────────────────────────

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound is a bonus, never an error */ }
}

const sfx = {
  open:   () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.08, d: 0.2 }]),
  locked: () => playNotes([{ f: 196, t: 0, d: 0.25 }]),
  play:   () => playNotes([{ f: 523, t: 0, d: 0.1 }, { f: 659, t: 0.07, d: 0.1 }, { f: 784, t: 0.14, d: 0.25 }]),
  fanfare:() => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.4 }]),
};

// ── Map decorations (pure charm) ──────────────────────────────────────────────

const DECOR = [
  { e: '🌙', x: 8,  y: 3,  s: 34 }, { e: '⭐', x: 55, y: 5,  s: 16 },
  { e: '✨', x: 40, y: 12, s: 14 }, { e: '☁️', x: 78, y: 20, s: 26 },
  { e: '☁️', x: 12, y: 25, s: 22 }, { e: '🔮', x: 38, y: 33, s: 16 },
  { e: '🏔️', x: 60, y: 40, s: 26 }, { e: '🌸', x: 8,  y: 48, s: 16 },
  { e: '🌋', x: 62, y: 66, s: 24 }, { e: '🍄', x: 45, y: 78, s: 16 },
  { e: '🌲', x: 33, y: 90, s: 22 }, { e: '🌲', x: 60, y: 93, s: 18 },
  { e: '✨', x: 20, y: 95, s: 13 }, { e: '🦋', x: 70, y: 55, s: 15 },
];

const IDLE_LINES = [
  "Where should we explore today?",
  "Kailia says every explorer starts somewhere!",
  "Tap a land to visit it with us!",
  "I brought bamboo snacks for the journey! 🎋",
  "No rush — we go at YOUR pace!",
];

// weakest assessment domain → the land where it can grow
const DOMAIN_LAND: Record<string, string> = {
  writing: 'firefly-forest',
  math: 'dragons-cave',
  reading: 'whispering-signposts',
  communication: 'story-keepers',
};

export default function AdventureMap() {
  const { state } = useAssessment();
  const [progress, setProgress] = useState<AdventureProgress>({ played: {}, celebrated: [] });
  const [hydrated, setHydrated] = useState(false);
  const [openLand, setOpenLand] = useState<Land | null>(null);
  const [celebrating, setCelebrating] = useState<Land | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [noelLine, setNoelLine] = useState(IDLE_LINES[0]);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  // Load saved progress + detect a land finished on the last game visit
  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    setHydrated(true);
    const done = LANDS.find(l => isLandComplete(p, l) && !p.celebrated.includes(l.id));
    if (done) {
      setCelebrating(done);
      sfx.fanfare();
    }
  }, []);

  // Noel chats while idle
  useEffect(() => {
    const t = setInterval(() => {
      setNoelLine(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]);
      setNoelMood('happy');
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const curIdx = useMemo(() => currentLandIndex(progress), [progress]);
  const stars = totalStars(progress);

  // Gentle nudge toward the land matching the assessment's weakest domain
  const focusLandId = useMemo(() => {
    const entries = Object.entries(state.scores).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    const weakest = entries.sort((a, b) => a[1] - b[1])[0][0];
    return DOMAIN_LAND[weakest] ?? null;
  }, [state.scores]);

  function tapLand(land: Land, idx: number) {
    if (!isLandUnlocked(progress, idx)) {
      sfx.locked();
      setShakeId(land.id);
      setTimeout(() => setShakeId(null), 400);
      setNoelLine(`Not yet! Let's visit ${LANDS[idx - 1].name} first — together!`);
      setNoelMood('thinking');
      return;
    }
    sfx.open();
    setOpenLand(land);
    setNoelLine(land.noelIntro);
    setNoelMood('excited');
  }

  function startQuest(land: Land, href: string) {
    sfx.play();
    setProgress(recordQuestPlay(land.id, href));
    // navigation happens via the <Link>
  }

  function closeCelebration(land: Land) {
    setProgress(markCelebrated(land.id));
    setCelebrating(null);
  }

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #0b0b2a 0%, #1a1a3e 30%, #16324a 60%, #0f3d2e 100%)' }}>
      <div className="max-w-md mx-auto px-3">

        {/* Header */}
        <div className="flex items-center justify-between pt-5 pb-2 px-1">
          <h1 className="text-2xl font-extrabold text-white drop-shadow-lg">🗺️ Kailia&apos;s World</h1>
          <div className="px-3 py-1.5 rounded-full font-bold text-sm text-yellow-300"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(253,224,71,0.4)' }}>
            ⭐ {stars} / {maxStars()}
          </div>
        </div>
        <p className="text-purple-200 text-xs px-1 mb-3">
          {state.childName ? `${state.childName}, six magical lands are waiting!` : 'Six magical lands are waiting!'}
        </p>

        {/* ── The map ── */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl"
          style={{ aspectRatio: '400 / 640', border: '3px solid rgba(255,255,255,0.15)' }}>

          {/* Trail */}
          <svg viewBox="0 0 400 640" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {LANDS.slice(0, -1).map((a, i) => {
              const b = LANDS[i + 1];
              const midY = (a.y + b.y) / 2;
              const d = `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
              const traveled = isLandUnlocked(progress, i + 1);
              return (
                <g key={a.id}>
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16" strokeLinecap="round" />
                  <path d={d} fill="none"
                    stroke={traveled ? '#FBBF24' : 'rgba(255,255,255,0.45)'}
                    strokeWidth={traveled ? 5 : 4}
                    strokeLinecap="round"
                    strokeDasharray={traveled ? undefined : '0.5 14'} />
                </g>
              );
            })}
          </svg>

          {/* Scenery */}
          {DECOR.map((d, i) => (
            <span key={i} className={i % 3 === 0 ? 'absolute float' : 'absolute sparkle'}
              style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: d.s, opacity: 0.7, animationDelay: `${i * 0.5}s`, pointerEvents: 'none' }}>
              {d.e}
            </span>
          ))}

          {/* Lands */}
          {LANDS.map((land, idx) => {
            const unlocked = hydrated && isLandUnlocked(progress, idx);
            const complete = isLandComplete(progress, land);
            const isCurrent = idx === curIdx;
            const isFocus = focusLandId === land.id && unlocked && !complete;
            return (
              <button key={land.id} onClick={() => tapLand(land, idx)}
                className={`absolute text-center ${shakeId === land.id ? 'shake' : ''}`}
                style={{ left: `${(land.x / 400) * 100}%`, top: `${(land.y / 640) * 100}%`, transform: 'translate(-50%, -50%)', width: '25%' }}>
                <span className={`inline-flex items-center justify-center rounded-full transition-transform hover:scale-110 ${isCurrent && unlocked && !complete ? 'pulse' : ''}`}
                  style={{
                    width: '4.2rem', height: '4.2rem', fontSize: '2rem',
                    background: unlocked ? land.sky : 'rgba(120,120,140,0.45)',
                    border: `3.5px solid ${complete ? '#FBBF24' : unlocked ? land.color : 'rgba(255,255,255,0.25)'}`,
                    boxShadow: unlocked ? `0 0 22px ${land.glow}88` : 'none',
                    filter: unlocked ? 'none' : 'grayscale(0.9)',
                  }}>
                  {unlocked ? land.emoji : '🔒'}
                </span>
                <span className="block mt-1 text-[11px] font-extrabold leading-tight px-1 py-0.5 rounded-lg mx-auto w-fit"
                  style={{ color: unlocked ? 'white' : 'rgba(255,255,255,0.45)', background: 'rgba(0,0,0,0.45)' }}>
                  {land.name}
                </span>
                {unlocked && (
                  <span className="block text-[11px] mt-0.5" style={{ letterSpacing: 1 }}>
                    {land.quests.map((q, qi) => (
                      <span key={q.href} style={{ opacity: (progress.played[land.id] ?? []).length > qi ? 1 : 0.3 }}>⭐</span>
                    ))}
                  </span>
                )}
                {isFocus && (
                  <span className="block text-[10px] font-bold text-yellow-300 mt-0.5 sparkle">Noel&apos;s pick!</span>
                )}
              </button>
            );
          })}

          {/* Kailia stands at the current land */}
          {hydrated && (
            <div className="absolute float" style={{
              left: `${((LANDS[curIdx].x + 52) / 400) * 100}%`,
              top: `${((LANDS[curIdx].y - 58) / 640) * 100}%`,
              transform: 'translate(-50%, -50%)', pointerEvents: 'none', transition: 'left 1s ease, top 1s ease',
            }}>
              <KailiaSprite size={44} expression="happy" />
            </div>
          )}
        </div>

        {/* ── Noel's guide bar ── */}
        <div className="flex items-center gap-3 mt-4 rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <PandaSprite size={54} expression={noelMood} style={{ flexShrink: 0 }} />
          <div className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-800 relative"
            style={{ background: 'white' }}>
            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
              style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' }} />
            {noelLine}
          </div>
        </div>

        {/* For grown-ups */}
        <div className="text-center mt-4">
          <Link href="/results" className="text-xs text-purple-300 underline">For grown-ups: progress &amp; results</Link>
        </div>
      </div>

      {/* ── Land panel ── */}
      {openLand && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpenLand(null)}>
          <div className="w-full max-w-md rounded-3xl p-5 slide-up shadow-2xl" style={{ background: openLand.sky }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-5xl">{openLand.emoji}</span>
              <div>
                <h2 className="text-xl font-extrabold leading-tight" style={{ color: openLand.color }}>{openLand.name}</h2>
                <p className="text-xs font-semibold text-gray-500">{openLand.tagline}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 my-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <PandaSprite size={42} expression="excited" style={{ flexShrink: 0 }} />
              <p className="text-sm text-gray-700 font-medium pt-1">{openLand.noelIntro}</p>
            </div>

            <div className="space-y-3">
              {openLand.quests.map(q => {
                const done = (progress.played[openLand.id] ?? []).includes(q.href);
                return (
                  <Link key={q.href} href={q.href} onClick={() => startQuest(openLand, q.href)}
                    className="flex items-center gap-3 rounded-2xl p-3 bg-white shadow transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <span className="text-4xl">{q.emoji}</span>
                    <span className="flex-1">
                      <span className="block font-extrabold text-sm" style={{ color: openLand.color }}>
                        {q.title} {done && '⭐'}
                      </span>
                      <span className="block text-xs text-gray-600">{q.desc}</span>
                    </span>
                    <span className="px-4 py-2 rounded-full font-extrabold text-white text-sm shadow"
                      style={{ background: openLand.color }}>
                      {done ? 'Again!' : 'Play!'}
                    </span>
                  </Link>
                );
              })}
            </div>

            <button onClick={() => setOpenLand(null)}
              className="mt-4 w-full py-2.5 rounded-full font-bold text-sm text-gray-500"
              style={{ border: '2px solid rgba(0,0,0,0.12)' }}>
              ← Back to the map
            </button>
          </div>
        </div>
      )}

      {/* ── Land complete celebration ── */}
      {celebrating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #667EEAee, #764BA2ee)' }}>
          <div className="text-center bounce-in">
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="text-6xl mb-2 star-burst">{celebrating.emoji}</div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">
              You lit up {celebrating.name}!
            </h2>
            <p className="text-purple-100 font-semibold mb-6">
              Noel is SO proud of you! A new part of the map is glowing…
            </p>
            <button onClick={() => closeCelebration(celebrating)}
              className="px-10 py-4 rounded-full text-xl font-extrabold text-purple-800 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
              Keep exploring! 🚀
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
