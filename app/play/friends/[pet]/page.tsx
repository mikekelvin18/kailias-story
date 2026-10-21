'use client';

// ── A friend's trail ──
// Five stops per chapter on a winding path through the friend's world.
// The friend stands by the next stop; finished stops glow, later ones
// wait. Tapping a stop plays its game, and the game's "back to the map"
// brings the child right back here (lib/returnTo.ts). No scores shown.

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LiveArt from '@/components/characters/LiveArt';
import {
  findTrail, companionFor, trailId, currentChapter,
  STOPS_PER_CHAPTER, CHAPTER_COUNT, TRAIL_LENGTH,
} from '@/lib/companionTrails';
import { loadProgress, isBonusLandUnlocked } from '@/lib/adventure';
import { loadRewards, recordGameLevel } from '@/lib/rewards';
import { setReturnPath } from '@/lib/returnTo';

// stop positions on the path, bottom to top (fractions of the path box)
const SPOTS: [number, number][] = [[0.35, 0.89], [0.65, 0.71], [0.35, 0.53], [0.65, 0.35], [0.5, 0.15]];
const BOX_W = 390, BOX_H = 540;

function pathD() {
  const p = SPOTS.map(([x, y]) => [x * BOX_W, y * BOX_H]);
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [ax, ay] = p[i - 1], [bx, by] = p[i];
    const my = (ay + by) / 2;
    d += ` C ${ax} ${my}, ${bx} ${my}, ${bx} ${by}`;
  }
  return d;
}

function speak(text: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1.1;
    s.speak(u);
  } catch { /* no voice on this device */ }
}

export default function TrailPage() {
  const { pet } = useParams<{ pet: string }>();
  const router = useRouter();
  const trail = findTrail(pet);
  const [reached, setReached] = useState<number | null>(null);
  const [view, setView] = useState(0);

  useEffect(() => {
    if (!trail || !isBonusLandUnlocked(loadProgress())) { router.replace('/play/friends'); return; }
    const r = Math.min(TRAIL_LENGTH, loadRewards().gameLevels[trailId(trail)] ?? 0);
    setReached(r);
    setView(currentChapter(r));
  }, [trail, router]);

  if (!trail || reached === null) return <div className="min-h-screen" style={{ background: trail?.sky ?? '#262B66' }} />;

  const c = companionFor(trail);
  const allDone = reached >= TRAIL_LENGTH;
  const chapter = trail.chapters[view];
  const nextInView = allDone ? -1 : reached - view * STOPS_PER_CHAPTER;   // 0–4 when the next stop is in this chapter
  const petSpot = SPOTS[nextInView >= 0 && nextInView < STOPS_PER_CHAPTER ? nextInView : STOPS_PER_CHAPTER - 1];
  const line = allDone
    ? `We did every chapter together! You can play any stop again, any time.`
    : view === 0 && reached === 0 ? `${trail.intro} ${chapter.line}` : chapter.line;

  function play(i: number) {
    if (!trail) return;
    const n = view * STOPS_PER_CHAPTER + i + 1;     // 1-based stop number on the whole trail
    if (n > (reached ?? 0) + 1) return;
    if (n > (reached ?? 0)) setReached(recordGameLevel(trailId(trail), n).gameLevels[trailId(trail)]);
    setReturnPath(`/play/friends/${trail.slug}`);
    router.push(trail.stops[i].href);
  }

  const goIdx = nextInView >= 0 && nextInView < STOPS_PER_CHAPTER ? nextInView : 0;

  return (
    <div className="min-h-screen px-4 pt-5 pb-8 relative overflow-hidden" style={{ background: trail.sky, color: trail.ink }}>
      {/* a soft glow and a few stars, drawn, not emoji */}
      <span aria-hidden="true" className="absolute rounded-full" style={{ top: 60, right: 30, width: 70, height: 70, background: trail.color, opacity: 0.35, filter: 'blur(18px)' }} />
      {[[8, 22], [20, 40], [86, 30], [90, 55], [12, 62], [55, 18], [78, 74], [6, 84]].map(([x, y], i) => (
        <span key={i} aria-hidden="true" className="absolute rounded-full bg-white sky-twinkle"
          style={{ left: `${x}%`, top: `${y}%`, width: i % 3 ? 2 : 3, height: i % 3 ? 2 : 3, opacity: 0.6, animationDelay: `${i * 0.7}s` }} />
      ))}

      <div className="relative max-w-md mx-auto">
        <Link href="/play/friends" aria-label="Back to friends"
          className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>

        <p className="mt-3 inline-block text-xs font-extrabold tracking-wide px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }}>
          CHAPTER {view + 1} · {chapter.name.toUpperCase()}
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold leading-tight">{trail.world}</h1>

        {/* chapters: finished and current ones can be revisited */}
        <div className="mt-3 flex gap-2" role="tablist" aria-label="Chapters">
          {Array.from({ length: CHAPTER_COUNT }, (_, ch) => {
            const openCh = ch <= currentChapter(reached);
            const on = ch === view;
            return (
              <button key={ch} role="tab" aria-selected={on} disabled={!openCh} onClick={() => setView(ch)}
                aria-label={`Chapter ${ch + 1}`}
                className="w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm transition-transform active:scale-95"
                style={{ background: on ? trail.color : openCh ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                  color: on ? '#1F2A44' : openCh ? trail.ink : 'rgba(255,255,255,0.35)' }}>
                {ch + 1}
              </button>
            );
          })}
        </div>

        {/* the trail */}
        <div className="relative w-full mt-4" style={{ aspectRatio: `${BOX_W} / ${BOX_H}` }}>
          <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
            <path d={pathD()} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="16" strokeLinecap="round" />
          </svg>
          {trail.stops.map((s, i) => {
            const g = view * STOPS_PER_CHAPTER + i;
            const done = g < reached;
            const next = g === reached;
            const rescue = i === STOPS_PER_CHAPTER - 1;
            const [x, y] = SPOTS[i];
            return (
              <button key={i} onClick={() => play(i)} disabled={!done && !next}
                aria-label={`${s.title}${done ? ', played' : next ? ', next' : ', not yet'}`}
                className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 transition-transform active:scale-95"
                style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: 120 }}>
                <span className={`flex items-center justify-center rounded-full ${next ? 'portal-pulse' : ''}`}
                  style={{ width: rescue ? 70 : 60, height: rescue ? 70 : 60, boxShadow: '0 5px 0 rgba(0,0,0,0.25)',
                    background: done ? trail.color : next ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                    border: `4px solid ${done || next ? trail.color : 'rgba(255,255,255,0.22)'}` }}>
                  {done && <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  {next && <svg width="30" height="30" viewBox="0 0 24 24" fill={trail.sky} aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>}
                  {!done && !next && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>}
                </span>
                <span className="text-sm font-extrabold leading-tight drop-shadow" style={{ opacity: done || next ? 1 : 0.6 }}>{s.title}</span>
              </button>
            );
          })}
          {/* the friend waits just beside the next stop, on the outer edge
              of the zigzag, so it never covers a stop or its name */}
          <span className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${(petSpot[0] < 0.5 ? 0.13 : 0.86) * 100}%`, top: `${(petSpot[1] + 0.045) * 100}%` }}>
            <LiveArt src={c.art} alt={`${trail.pet} the ${c.kind}`} size={80} kind="pet" />
          </span>
        </div>

        {/* the friend speaks; a tap on the speaker reads it aloud */}
        <div className="mt-2 flex items-start gap-3 rounded-3xl bg-white p-3.5" style={{ color: '#1F2A44' }}>
          <p className="flex-1 text-base font-bold leading-snug">{trail.pet}: “{line}”</p>
          <button onClick={() => speak(line)} aria-label="Hear it"
            className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: `${trail.color}66` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
          </button>
        </div>
        <button onClick={() => play(goIdx)}
          className="mt-3 w-full h-16 rounded-full text-2xl font-extrabold transition-transform active:scale-[0.98]"
          style={{ background: trail.color, color: '#1F2A44', boxShadow: '0 5px 0 rgba(0,0,0,0.25)' }}>
          {allDone ? 'Play again!' : 'Let’s go!'}
        </button>
      </div>
    </div>
  );
}
