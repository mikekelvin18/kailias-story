'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import LiveArt from '@/components/characters/LiveArt';
import PandaSprite from '@/components/characters/PandaSprite';
import {
  LANDS, BONUS_LANDS, Land, AdventureProgress, loadProgress, recordQuestPlay, markCelebrated,
  landStars, isLandComplete, isLandUnlocked, isBonusLandUnlocked, currentLandIndex, isQuestFree,
} from '@/lib/adventure';
import { developmentalBand, BAND_INFO } from '@/lib/difficulty';
import { todaysQuests, getTodayReports, todayKey, ParentActivity } from '@/lib/activities';
import { loadRewards, explorerLevel, COMPANIONS, RewardsState, pendingCompanionReveal, markCompanionCelebrated } from '@/lib/rewards';
import { isPremium } from '@/lib/premium';
import { takeReturnPath, clearReturnPath } from '@/lib/returnTo';
import { TRAILS, companionFor } from '@/lib/companionTrails';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { scopedKey, activeChild } from '@/lib/family';
import { useHubTheme } from '@/hooks/useHubTheme';
import { PineTree, Mushroom, Rainbow } from '@/components/scenery/Scenery';
import { Sun, Moon, Sparkle, Butterfly, Flower, Birds, StarIcon, LockIcon } from '@/components/scenery/SkyDecor';
import LivingSky from '@/components/scenery/LivingSky';

interface DecorItem {
  C: (props: { size?: number; className?: string }) => React.ReactElement; // illustrated SVG
  x: number; y: number; s: number;
  still?: boolean;   // has no motion of its own, so give it a gentle float
}

const DAILY_SEEN_KEY = 'kailia_daily_seen_v1';

// ── Tiny sound effects (no audio files needed) ────────────────────────────────

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
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
// Two skies to choose from — a bright daytime map (friendlier, easier to
// read at a glance) or the original moonlit one, picked with the shared
// hub theme toggle (lib/theme.ts, hooks/useHubTheme.ts) and remembered
// per-device (not child data, just a display preference).

// Every decoration is a drawn illustration with its own motion — the sun
// turns, sparkles twinkle, the butterfly flaps, the flower sways
// (components/scenery/SkyDecor.tsx). The clouds are no longer decorations
// here: real-looking clouds drift across the whole map behind everything
// (components/scenery/LivingSky.tsx). `still` scenery (mountains, trees)
// gets the gentle float it always had. The mountain and volcano were
// dropped once the lands became painted islands: they crowded the labels.
const DECOR_BRIGHT: DecorItem[] = [
  { C: Sun, x: 6,  y: 2,  s: 44 }, { C: Rainbow, x: 34, y: 6,  s: 46, still: true },
  { C: Sparkle, x: 40, y: 12, s: 16 }, { C: Birds, x: 70, y: 27, s: 34 },
  { C: Sparkle, x: 36, y: 34, s: 13 },
  { C: Flower, x: 8,  y: 47, s: 20 }, { C: Mushroom, x: 45, y: 78, s: 26, still: true },
  { C: PineTree, x: 33, y: 90, s: 32, still: true }, { C: PineTree, x: 60, y: 93, s: 26, still: true },
  { C: Sparkle, x: 20, y: 95, s: 14 }, { C: Butterfly, x: 66, y: 54, s: 22 },
];

const DECOR_DARK: DecorItem[] = [
  { C: Moon, x: 6,  y: 2,  s: 44 }, { C: Sparkle, x: 55, y: 5,  s: 18 },
  { C: Sparkle, x: 40, y: 12, s: 14 }, { C: Sparkle, x: 82, y: 14, s: 12 },
  { C: Sparkle, x: 36, y: 34, s: 13 },
  { C: Flower, x: 8,  y: 47, s: 20 }, { C: Mushroom, x: 45, y: 78, s: 26, still: true },
  { C: PineTree, x: 33, y: 90, s: 32, still: true }, { C: PineTree, x: 60, y: 93, s: 26, still: true },
  { C: Sparkle, x: 20, y: 95, s: 14 }, { C: Butterfly, x: 66, y: 54, s: 22 },
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
  const { state, totalScore } = useAssessment();
  const band = developmentalBand(state.ageGroup, totalScore);
  const [progress, setProgress] = useState<AdventureProgress>({ played: {}, celebrated: [] });
  const [hydrated, setHydrated] = useState(false);
  const [openLand, setOpenLand] = useState<Land | null>(null);
  const [celebrating, setCelebrating] = useState<Land | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [noelLine, setNoelLine] = useState(IDLE_LINES[0]);
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [dailyPrompt, setDailyPrompt] = useState<ParentActivity[] | null>(null);
  const [rewards, setRewards] = useState<RewardsState>({ starlight: 0, gameLevels: {}, celebratedCompanions: [] });
  const [showGuide, setShowGuide] = useState(false);
  const [newCompanion, setNewCompanion] = useState<(typeof COMPANIONS)[number] | null>(null);
  const { theme, name: themeName } = useHubTheme();
  const bright = themeName === 'bright';
  const [child, setChild] = useState<ReturnType<typeof activeChild>>(null);

  // activeChild() reads localStorage, which doesn't exist during SSR —
  // reading it directly in render would make the server-rendered HTML
  // (no badge) mismatch the client's first paint (badge present).
  // Loading it into state after mount keeps server and client in sync.
  useEffect(() => { setChild(activeChild()); }, []);

  // A game started from a friend's trail sends its "back to the map" tap
  // here; go straight on to that trail instead (see lib/returnTo.ts).
  const router = useRouter();
  useEffect(() => {
    const back = takeReturnPath();
    if (back) router.replace(back);
  }, [router]);

  // A newly-unlocked companion is a one-time surprise reveal (the
  // celebration modal below) instead of a permanent row on the map —
  // pendingCompanionReveal only returns one not shown yet.
  useEffect(() => {
    const r = loadRewards();
    setRewards(r);
    const pending = pendingCompanionReveal(r);
    if (pending) setNewCompanion(pending);
  }, []);

  const [premium, setPremiumState] = useState(false);
  useEffect(() => { setPremiumState(isPremium()); }, []);

  const DECOR = bright ? DECOR_BRIGHT : DECOR_DARK;

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

  // For families below school age, today's quests ARE the main event —
  // pop them up front and center (once per day, until done or dismissed)
  useEffect(() => {
    if (!band) return;
    try {
      if (localStorage.getItem(scopedKey(DAILY_SEEN_KEY)) === todayKey()) return;
      const quests = todaysQuests(band);
      const reports = getTodayReports();
      if (quests.every(q => reports[q.id] !== undefined)) return;
      setDailyPrompt(quests);
    } catch { /* never block the map */ }
  }, [band]);

  function dismissDaily() {
    try { localStorage.setItem(scopedKey(DAILY_SEEN_KEY), todayKey()); } catch { /* ignore */ }
    setDailyPrompt(null);
  }

  // Noel chats while idle
  useEffect(() => {
    const t = setInterval(() => {
      setNoelLine(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]);
      setNoelMood('happy');
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const curIdx = useMemo(() => currentLandIndex(progress), [progress]);

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

  // Bonus realms (Space Outpost, Coral Reef) are only ever rendered once
  // already unlocked, so opening one never needs the locked-check tapLand
  // does for the main path.
  function openBonusLand(land: Land) {
    sfx.open();
    setOpenLand(land);
    setNoelLine(land.noelIntro);
    setNoelMood('excited');
  }

  function startQuest(land: Land, href: string) {
    sfx.play();
    clearReturnPath();
    setProgress(recordQuestPlay(land.id, href));
    // navigation happens via the <Link>
  }

  function closeCelebration(land: Land) {
    setProgress(markCelebrated(land.id));
    setCelebrating(null);
  }

  // Renders the map at either the phone (portrait, land.x/land.y) or
  // tablet/desktop (landscape, land.dx/land.dy) coordinates — see the
  // "The map" section below for why there are two.
  function renderMap(mode: 'portrait' | 'landscape') {
    const bonusUnlocked = hydrated && isBonusLandUnlocked(progress);
    // Bonus lands are always ON the map (even before they're unlocked) as
    // a blurred, mysterious tease — Kailia can see a portal is forming
    // out there, building anticipation, instead of them just materializing
    // out of nowhere the moment the 6th land is finished.
    const allLands = [...LANDS, ...BONUS_LANDS];
    // They live in extra canvas room BELOW the main path (not woven into
    // its winding trail) — a separate "new realms" strip, not two more
    // stops needing a connector line drawn back across the whole map.
    const VBW = mode === 'portrait' ? 400 : 1180;
    const VBH = mode === 'portrait' ? 800 : 460;
    const gx = (land: Land) => mode === 'portrait' ? land.x : land.dx;
    const gy = (land: Land) => mode === 'portrait' ? land.y : land.dy;
    const cur = LANDS[curIdx];

    return (
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ border: '3px solid rgba(255,255,255,0.15)' }}>

        {/* Trail — only the main 6 lands connect; bonus lands are
            standalone portals, not stops on this path. */}
        <svg viewBox={`0 0 ${VBW} ${VBH}`} className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {LANDS.slice(0, -1).map((a, i) => {
            const b = LANDS[i + 1];
            const ax = gx(a), ay = gy(a), bx = gx(b), by = gy(b);
            const midY = (ay + by) / 2;
            const d = `M ${ax} ${ay} C ${ax} ${midY}, ${bx} ${midY}, ${bx} ${by}`;
            const traveled = isLandUnlocked(progress, i + 1);
            return (
              <g key={a.id}>
                <path d={d} fill="none" stroke={bright ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.07)'} strokeWidth="16" strokeLinecap="round" />
                <path d={d} fill="none"
                  stroke={traveled ? '#F59E0B' : (bright ? 'rgba(71,85,105,0.45)' : 'rgba(255,255,255,0.45)')}
                  strokeWidth={traveled ? 5 : 4}
                  strokeLinecap="round"
                  strokeDasharray={traveled ? undefined : '0.5 14'} />
              </g>
            );
          })}
        </svg>

        {/* Scenery */}
        {DECOR.map((d, i) => (
          <span key={i} className={d.still ? 'absolute float' : 'absolute'}
            style={{ left: `${d.x}%`, top: `${d.y}%`, opacity: d.still ? 0.85 : 1, animationDelay: `${i * 0.5}s`, pointerEvents: 'none' }}>
            <d.C size={d.s} />
          </span>
        ))}

        {/* Lands */}
        {allLands.map((land, idx) => {
          const isBonus = idx >= LANDS.length;
          const unlocked = isBonus ? bonusUnlocked : (hydrated && isLandUnlocked(progress, idx));
          const complete = isLandComplete(progress, land);
          const isCurrent = idx === curIdx;
          const isFocus = focusLandId === land.id && unlocked && !complete;

          function handleClick() {
            if (isBonus) {
              if (unlocked) openBonusLand(land);
              else {
                sfx.locked();
                setShakeId(land.id);
                setTimeout(() => setShakeId(null), 400);
                setNoelLine("A new portal is forming out there... finish all six lands and let's see what it is!");
                setNoelMood('thinking');
              }
              return;
            }
            tapLand(land, idx);
          }

          return (
            <button key={land.id} onClick={handleClick}
              className={`absolute text-center ${shakeId === land.id ? 'shake' : ''}`}
              style={{ left: `${(gx(land) / VBW) * 100}%`, top: `${(gy(land) / VBH) * 100}%`, transform: 'translate(-50%, -50%)', width: '25%' }}>
              {/* Bonus lands get a spinning portal ring — dim while
                  forming, vivid once unlocked — instead of the plain
                  circle every main land uses, so finishing the adventure
                  is rewarded with something that actually feels new. */}
              {isBonus && (
                <span className={`absolute left-1/2 top-1/2 rounded-full portal-ring ${unlocked ? 'portal-pulse' : ''}`}
                  style={{
                    width: '5.4rem', height: '5.4rem',
                    background: unlocked
                      ? `conic-gradient(from 0deg, ${land.color}, ${land.glow}, #FBBF24, ${land.color})`
                      : 'conic-gradient(from 0deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05), rgba(255,255,255,0.35))',
                    filter: unlocked ? 'blur(2px)' : 'blur(3px)',
                    opacity: unlocked ? 0.9 : 0.5,
                    zIndex: 0,
                  }} />
              )}
              {land.art ? (
                // Kelvin's painted island for this land, floating gently.
                // Locked lands show the island faded with a small lock, so
                // kids can already see where they're heading.
                <span className={`relative inline-block w-20 sm:w-28 lg:w-32 transition-transform hover:scale-110`}>
                  {unlocked && isCurrent && !complete && (
                    <span aria-hidden="true" className="absolute left-1/2 top-1/2 rounded-full pulse"
                      style={{ width: '82%', height: '72%', transform: 'translate(-50%, -45%)', background: `radial-gradient(circle, ${land.glow}66, transparent 70%)` }} />
                  )}
                  <LiveArt src={land.art} alt={land.name} size="100%" kind="land" pokeable={false}
                    style={{ filter: unlocked ? (complete ? 'drop-shadow(0 0 6px #FBBF24)' : 'none') : 'grayscale(0.85) opacity(0.6)' }} />
                  {!unlocked && (
                    <span className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 text-base sm:text-xl"
                      style={{ transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.85)', border: '2px solid rgba(100,116,139,0.5)' }} aria-label="Locked"><LockIcon size={20} /></span>
                  )}
                  {/* Done / not-done corner badge, so it's clear at a glance
                      which lands are finished even though the next land
                      opens after just one quest. */}
                  {unlocked && !isBonus && complete && (
                    <span className="absolute top-0 right-0 flex items-center justify-center rounded-full w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-extrabold text-white"
                      style={{ background: '#16A34A', border: '2px solid white' }} aria-label="Finished">✓</span>
                  )}
                  {unlocked && !isBonus && !complete && landStars(progress, land) > 0 && (
                    <span className="absolute top-0 -right-3 rounded-full px-1.5 py-0.5 text-[11px] sm:text-sm font-extrabold whitespace-nowrap wiggle"
                      style={{ background: '#F59E0B', color: '#3B1F00', border: '2px solid white' }}
                      aria-label={`${landStars(progress, land)} of ${land.quests.length} quests done`}>
                      {landStars(progress, land)}/{land.quests.length}
                    </span>
                  )}
                </span>
              ) : (
              <span className={`relative inline-flex items-center justify-center rounded-full transition-transform hover:scale-110 w-16 h-16 text-3xl sm:w-20 sm:h-20 sm:text-4xl lg:w-24 lg:h-24 lg:text-5xl ${isCurrent && unlocked && !complete ? 'pulse' : ''}`}
                  style={{
                    background: unlocked ? land.sky : (isBonus ? 'rgba(80,70,120,0.55)' : 'rgba(120,120,140,0.45)'),
                    border: `3.5px solid ${complete ? '#FBBF24' : unlocked ? land.color : 'rgba(255,255,255,0.25)'}`,
                    boxShadow: unlocked ? `0 0 22px ${land.glow}88` : 'none',
                    filter: unlocked ? 'none' : (isBonus ? 'blur(1.5px) grayscale(0.5)' : 'grayscale(0.9)'),
                  }}>
                  {unlocked ? land.emoji : (isBonus ? '✨' : '🔒')}
                  {/* Done / not-done corner badge, so it's clear at a glance
                      which lands are finished even though the next land
                      opens after just one quest. */}
                  {unlocked && !isBonus && complete && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm font-extrabold text-white"
                      style={{ background: '#16A34A', border: '2px solid white' }} aria-label="Finished">✓</span>
                  )}
                  {unlocked && !isBonus && !complete && landStars(progress, land) > 0 && (
                    <span className="absolute -top-2 -right-4 rounded-full px-1.5 py-0.5 text-[11px] sm:text-sm font-extrabold whitespace-nowrap wiggle"
                      style={{ background: '#F59E0B', color: '#3B1F00', border: '2px solid white' }}
                      aria-label={`${landStars(progress, land)} of ${land.quests.length} quests done`}>
                      {landStars(progress, land)}/{land.quests.length}
                    </span>
                  )}
                </span>
              )}
              {/* mapLabel (a shorter name where needed) + whitespace-nowrap
                  keep this to one line — a long full name wrapping to 2-3
                  lines was tall enough to overlap the land below it. */}
              <span className="relative block mt-1 text-[11px] sm:text-sm lg:text-base font-extrabold whitespace-nowrap px-1 py-0.5 rounded-lg mx-auto w-fit"
                style={{ color: unlocked ? 'white' : 'rgba(255,255,255,0.85)', background: unlocked ? 'rgba(15,23,42,0.62)' : 'rgba(51,65,85,0.55)' }}>
                {unlocked ? (land.mapLabel ?? land.name) : (isBonus ? 'A new realm…' : (land.mapLabel ?? land.name))}
              </span>
              {unlocked && (
                <span className="relative block text-[11px] sm:text-sm mt-0.5" style={{ letterSpacing: 1 }}>
                  {land.quests.map((q, qi) => (
                    <StarIcon key={q.href} size={13} dim={(progress.played[land.id] ?? []).length <= qi} />
                  ))}
                </span>
              )}
              {isFocus && (
                <span className={`relative block text-[10px] sm:text-xs font-extrabold mt-0.5 sparkle ${bright ? 'text-amber-700' : 'text-yellow-300'}`}>Noel&apos;s pick!</span>
              )}
            </button>
          );
        })}

        {/* Kailia stands right on top of the current land, like a "you are
            here" pin. She used to stand out on the trail beside it, where she
            covered the path and made the first land look cut off. */}
        {hydrated && (
          <div className="absolute" style={{
            // on a painted island she stands on its front-left grass, so the
            // land's own picture (signpost, tower door) stays visible
            left: `${((gx(cur) - (cur.art ? (mode === 'portrait' ? 24 : 34) : 0)) / VBW) * 100}%`,
            top: `${((gy(cur) - (cur.art ? (mode === 'portrait' ? 26 : 30) : (mode === 'portrait' ? 58 : 72))) / VBH) * 100}%`,
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', transition: 'left 1s ease, top 1s ease',
          }}>
            {/* the bob animation lives on an inner wrapper: on the outer one
                it replaced the centering transform and shifted her sideways */}
            <div className="float"><KailiaSprite size={mode === 'portrait' ? 44 : 56} expression="happy" /></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="h-dvh overflow-hidden" style={{ background: theme.background, isolation: 'isolate' }}>
      <LivingSky mood={bright ? 'day' : 'night'} />
      {/* One flex column, exactly one screen tall, never scrolls — the map
          (flex-1) is the only part that gives up space when the chrome
          around it needs more, on any phone/tablet/desktop height. Bottom
          padding reserves room for the fixed BottomNav so nothing sits
          behind it. */}
      <div className="w-full h-full max-w-md sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 flex flex-col pb-[76px] sm:pb-[112px]">

        {/* Header — wraps to a second row on narrow phones instead of
            squeezing the title or badges into each other */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-3 pb-1 sm:pt-5 sm:pb-2 px-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className={`text-lg sm:text-2xl font-extrabold ${theme.title} truncate`}>
              🗺️ Kailia&apos;s World
            </h1>
            {child && (
              <Link href="/family" title={`Playing as ${child.nickname} — tap to switch`}
                className="text-base rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0"
                style={{ background: theme.badgeBg, border: `1.5px solid ${theme.badgeBorder}` }}>
                {child.avatar}
              </Link>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0 ml-auto">
            <button onClick={() => setShowGuide(true)}
              className={`px-2.5 py-1.5 rounded-full font-bold text-xs ${theme.badgeText} transition-transform hover:scale-105`}
              style={{ background: theme.badgeBg, border: `1.5px solid ${theme.badgeBorder}` }}>
              ✨ {rewards.starlight} · Lv {explorerLevel(rewards.starlight)} <span style={{ opacity: 0.7 }}>ⓘ</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
        <p className={`text-xs px-1 mb-1 sm:mb-3 font-semibold flex-shrink-0 ${theme.subtitle}`}>
          {state.childName ? `${state.childName}, six magical lands are waiting!` : 'Six magical lands are waiting!'}
        </p>

        {/* For young explorers, today's together-quests are the MAIN course —
            so they come before the map, with a why note */}
        {band !== null && (
          <Link href="/activities" className="block mb-1.5 sm:mb-3 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 transition-transform hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)', boxShadow: '0 4px 18px rgba(251,191,36,0.35)' }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-4xl">{BAND_INFO[band].emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-base font-extrabold text-amber-950 leading-tight truncate">
                  ☀️ Play Today&apos;s Quests →
                </p>
                <p className="hidden sm:block text-xs font-semibold text-amber-900 mt-0.5">
                  for your {BAND_INFO[band].name} — ~5 minutes of real-world play together
                </p>
              </div>
            </div>
            <p className="hidden sm:block text-[11px] text-amber-900 mt-2 leading-snug" style={{ opacity: 0.85 }}>
              💡 Because {state.childName || 'your child'} is at the {BAND_INFO[band].name} stage,
              playing together with you helps most — the map games below are the fun extra.
            </p>
          </Link>
        )}

        {/* ── The map ──
            Two versions, toggled by CSS breakpoint (not JS), so there's no
            hydration mismatch: a tall portrait map for phones (unchanged),
            and a wide landscape map for tablet/desktop using each land's
            dx/dy — spread left-to-right so the whole world fits without
            scrolling instead of just being a wider version of the same
            vertical scroll. */}
        {/* The landscape map only replaces the portrait one when there's
            actually more width than height to use (a real desktop monitor,
            or a tablet turned sideways) — a tall narrow screen (a tablet
            held upright) keeps the portrait map, which fills that shape
            properly instead of leaving a short wide map stranded in a sea
            of empty space above and below it. */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="sm:landscape:hidden flex-1 min-h-0">{renderMap('portrait')}</div>
          <div className="hidden sm:landscape:flex flex-1 min-h-0">{renderMap('landscape')}</div>
        </div>

        {/* ── Friends' adventures ──
            Each companion's own trail (lib/companionTrails.ts). They open
            once all six lands are finished; before that the button stays
            as a gentle tease and Noel explains. */}
        {(() => {
          const open = hydrated && isBonusLandUnlocked(progress);
          const faces = (
            <span className="flex -space-x-2 flex-shrink-0" aria-hidden="true">
              {TRAILS.map(t => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={t.slug} src={companionFor(t).art} alt="" width={30} height={30}
                  className="rounded-full"
                  style={{ width: 30, height: 30, objectFit: 'cover', objectPosition: '50% 20%', background: '#FFFFFF',
                    border: '2px solid #FFFFFF', filter: open ? 'none' : 'grayscale(0.7) brightness(0.9)' }} />
              ))}
            </span>
          );
          const cls = 'flex items-center gap-3 mt-2 sm:mt-3 min-h-[48px] px-3 py-2 rounded-2xl text-left font-extrabold text-sm sm:text-base flex-shrink-0 transition-transform active:scale-[0.98]';
          const style = { background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` };
          return open ? (
            <Link href="/play/friends" className={cls} style={style} onClick={() => sfx.open()}>
              {faces}<span className={`flex-1 ${theme.subtitle}`}>Friends&apos; adventures</span>
              <span aria-hidden="true" className={theme.subtitle}>→</span>
            </Link>
          ) : (
            <button className={cls} style={style} onClick={() => {
              sfx.locked();
              setNoelLine('Your friends are planning their own adventures! Finish all six lands and they\'ll take you along.');
              setNoelMood('thinking');
            }}>
              {faces}<span className={`flex-1 ${theme.subtitle}`} style={{ opacity: 0.75 }}>Friends&apos; adventures</span>
              <LockIcon size={18} />
            </button>
          );
        })()}

        {/* ── Noel's guide bar ── */}
        <div className="flex items-center gap-3 mt-2 sm:mt-4 rounded-2xl p-2.5 sm:p-3 flex-shrink-0"
          style={{ background: theme.panelBg, border: `1.5px solid ${theme.panelBorder}` }}>
          <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
          <div className="rounded-2xl px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-800 relative"
            style={{ background: 'white' }}>
            <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
              style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid white' }} />
            {noelLine}
          </div>
        </div>

        {/* Companions no longer sit in a permanent row here — unlocking one
            is now a one-time surprise (the reveal modal below), and the
            full collection is still viewable inside the ✨ Starlight panel. */}

        {/* Quests and Printables now live in the bottom nav — only Results
            needs a footer link here since it isn't one of the four tabs. */}
        <div className="text-center mt-2 sm:mt-4 flex-shrink-0">
          <Link href="/results"
            className="inline-flex items-center gap-1.5 min-h-[36px] px-4 rounded-full text-xs sm:text-sm font-extrabold shadow-sm"
            style={{ background: theme.backBg, color: theme.backText, border: `1px solid ${theme.navBorder}` }}>
            👪 For grown-ups: progress &amp; results
          </Link>
        </div>
      </div>

      {/* ── Starlight guide — explains the whole reward system ── */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,8,40,0.85)' }} onClick={() => setShowGuide(false)}>
          <div className="w-full max-w-md rounded-3xl p-5 bounce-in shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1e1b4b, #312e81)', border: '2px solid rgba(253,224,71,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-3">
              <PandaSprite size={70} expression="excited" className="mx-auto float" />
              <h2 className="text-2xl font-extrabold text-yellow-300">✨ Starlight!</h2>
            </div>
            <div className="space-y-2.5 text-sm font-semibold text-indigo-100">
              <p className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                ✨ Every quest you play sprinkles <strong className="text-yellow-300">starlight</strong> —
                you earn it for <strong>trying</strong>, not just for being right!
              </p>
              <p className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                🎖️ Collecting starlight raises your <strong className="text-yellow-300">Explorer level</strong> —
                you are level {explorerLevel(rewards.starlight)} with {rewards.starlight} starlight!
              </p>
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="mb-2">🌙 Sleeping <strong className="text-yellow-300">companions</strong> wake up
                  and join the adventure at starlight milestones:</p>
                {COMPANIONS.map(c => {
                  const unlocked = rewards.starlight >= c.at;
                  return (
                    <p key={c.name} className="flex items-center gap-2 py-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.art} alt="" width={32} height={32} style={{ width: 32, height: 32, objectFit: 'contain', filter: unlocked ? 'none' : 'grayscale(1) brightness(0.6)' }} />
                      <span className={unlocked ? 'text-emerald-300' : 'text-indigo-300'}>
                        {c.name} — {unlocked ? 'awake! ✓' : `sleeps until ✨${c.at}`}
                      </span>
                    </p>
                  );
                })}
                {(() => {
                  const next = COMPANIONS.find(c => rewards.starlight < c.at);
                  return next ? (
                    <p className="mt-2 text-yellow-200">
                      Only ✨{next.at - rewards.starlight} more until {next.name} the {next.kind} wakes up!
                    </p>
                  ) : <p className="mt-2 text-yellow-200">Every companion is awake — amazing! 🎉</p>;
                })()}
              </div>
            </div>
            <button onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-3 rounded-full text-lg font-extrabold text-indigo-950 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Got it! ✨
            </button>
          </div>
        </div>
      )}

      {/* ── Today's quests popup — the main event for little ones ── */}
      {dailyPrompt && band && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(10,8,40,0.85)' }} onClick={dismissDaily}>
          <div className="w-full max-w-md rounded-3xl p-5 bounce-in shadow-2xl text-center"
            style={{ background: 'linear-gradient(180deg, #FFFBEB, #FEF3C7)' }}
            onClick={e => e.stopPropagation()}>
            <PandaSprite size={84} expression="excited" className="mx-auto float" />
            <h2 className="text-2xl font-extrabold text-amber-900 mt-1">☀️ Today&apos;s Quests!</h2>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Noel picked {dailyPrompt.length === 1 ? 'a tiny adventure' : `${dailyPrompt.length} little adventures`} for {state.childName ? `${state.childName} the` : 'your'} {BAND_INFO[band].name} {BAND_INFO[band].emoji}
            </p>
            <p className="text-xs text-amber-800 mb-4 px-2 leading-snug rounded-xl py-2"
              style={{ background: 'rgba(255,255,255,0.55)' }}>
              💡 {state.childName ? `${state.childName}'s` : 'Your child\'s'} adventure check showed a
              developmental age of {BAND_INFO[band].ages} — and at the{' '}
              {BAND_INFO[band].name} stage, children grow fastest by playing{' '}
              <strong>together with you</strong>. That&apos;s why Noel suggests these quests first!
              Only ~{dailyPrompt.reduce((s, q) => s + q.minutes, 0)} minutes all together.
            </p>
            <div className="space-y-2 mb-5 text-left">
              {dailyPrompt.map((q, i) => (
                <div key={q.id} className="flex items-center gap-3 rounded-2xl p-3 bg-white shadow-sm">
                  <span className="text-3xl">{q.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-extrabold text-sm text-gray-800">{i + 1}. {q.title}</span>
                    <span className="block text-xs text-gray-500">~{q.minutes} minutes together</span>
                  </span>
                </div>
              ))}
            </div>
            <Link href="/activities" onClick={dismissDaily}
              className="block w-full py-4 rounded-full text-lg font-extrabold text-amber-950 shadow-xl transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Let&apos;s play together! →
            </Link>
            <button onClick={dismissDaily} className="mt-3 text-sm font-semibold text-amber-700">
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── Land panel ── */}
      {openLand && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpenLand(null)}>
          <div className="w-full max-w-md rounded-3xl p-5 slide-up shadow-2xl" style={{ background: openLand.sky }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-1">
              {openLand.art
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={openLand.art} alt="" width={72} height={72} style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
                : <span className="text-5xl">{openLand.emoji}</span>}
              <div>
                <h2 className="text-xl font-extrabold leading-tight" style={{ color: openLand.color }}>{openLand.name}</h2>
                <p className="text-xs font-semibold text-gray-500">{openLand.tagline}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 my-3 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <PandaSprite size={42} expression="excited" style={{ flexShrink: 0 }} />
              <p className="text-sm text-gray-700 font-medium pt-1">{openLand.noelIntro}</p>
            </div>

            {/* Lands open early (one quest is enough), so a child can wander
                ahead with an earlier land half-done. A friendly nudge back to
                the first unfinished land — never a wall, just a reminder. */}
            {(() => {
              const idx = LANDS.findIndex(l => l.id === openLand.id);
              const unfinished = idx > 0 ? LANDS.slice(0, idx).find(l => !isLandComplete(progress, l)) : undefined;
              if (!unfinished) return null;
              const left = unfinished.quests.length - landStars(progress, unfinished);
              return (
                <button onClick={() => { sfx.open(); setOpenLand(unfinished); setNoelLine(unfinished.noelIntro); }}
                  className="w-full flex items-center gap-2 mb-3 rounded-2xl p-3 text-left transition-transform hover:scale-[1.02]"
                  style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
                  {unfinished.art
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={unfinished.art} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    : <span className="text-3xl">{unfinished.emoji}</span>}
                  <span className="flex-1 text-sm font-bold text-amber-900">
                    {unfinished.name} isn&apos;t finished yet! {left} {left === 1 ? 'quest is' : 'quests are'} still waiting there.
                  </span>
                  <span className="px-3 py-1.5 rounded-full font-extrabold text-white text-xs whitespace-nowrap" style={{ background: '#D97706' }}>
                    Finish it →
                  </span>
                </button>
              );
            })()}

            <div className="space-y-3">
              {openLand.quests.map((q, qi) => {
                const done = (progress.played[openLand.id] ?? []).includes(q.href);
                // First quest of every land stays free forever, so a family
                // can try every skill before upgrading — the rest need Premium.
                const locked = !premium && !isQuestFree(qi);
                return (
                  <Link key={q.href} href={locked ? '/upgrade' : q.href}
                    onClick={() => !locked && startQuest(openLand, q.href)}
                    className="flex items-center gap-3 rounded-2xl p-3 bg-white shadow transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    style={locked ? { opacity: 0.75 } : undefined}>
                    <span className="text-4xl" style={locked ? { filter: 'grayscale(0.6)' } : undefined}>{q.emoji}</span>
                    <span className="flex-1">
                      <span className="block font-extrabold text-sm" style={{ color: openLand.color }}>
                        {q.title} {done && '⭐'}
                      </span>
                      <span className="block text-xs text-gray-600">{q.desc}</span>
                    </span>
                    <span className="px-4 py-2 rounded-full font-extrabold text-white text-sm shadow whitespace-nowrap"
                      style={{ background: locked ? '#9CA3AF' : openLand.color }}>
                      {locked ? '🔒 Premium' : done ? 'Again!' : 'Play!'}
                    </span>
                  </Link>
                );
              })}
            </div>

            <button onClick={() => setOpenLand(null)}
              className="mt-4 w-full min-h-[48px] rounded-full font-extrabold text-base text-slate-700 bg-white/80"
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
              <PandaSprite size={145} expression="celebrating" className="float" />
              <KailiaSprite size={104} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="mb-2 star-burst">
              {celebrating.art
                ? <LiveArt src={celebrating.art} alt={celebrating.name} size={130} kind="land" />
                : <span className="text-6xl">{celebrating.emoji}</span>}
            </div>
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

      {/* ── New companion reveal — a one-time surprise instead of a
          permanent row, so unlocking one actually feels like something. ── */}
      {newCompanion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #667EEAee, #764BA2ee)' }}>
          <div className="text-center bounce-in">
            <div className="mb-3 star-burst">
              <LiveArt src={newCompanion.art} alt={newCompanion.name} size={170} kind="pet" />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">
              {newCompanion.name} joined you!
            </h2>
            <p className="text-purple-100 font-semibold mb-6">
              A new companion woke up, cheering you on from now on! ✨
            </p>
            <button onClick={() => { markCompanionCelebrated(newCompanion.name); setNewCompanion(null); }}
              className="px-10 py-4 rounded-full text-xl font-extrabold text-purple-800 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}>
              Yay! 🎉
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
