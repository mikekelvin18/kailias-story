'use client';

// ── Friend game shell ──
// The one engine every friend's signature game plugs into. A game only
// supplies a Round component (one short puzzle at a given difficulty);
// the shell runs the story around it: the friend's intro, five rounds that
// get harder after a win and gently easier after a miss, the friend's
// reactions (never "wrong"), then the level celebration, starlight, saved
// level and one quiet number-only metric.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Stage, { type World } from './kit/Stage';
import Actor, { usePetMood } from './kit/Actor';
import { useBursts } from './kit/Burst';
import SkillIntro from '@/components/SkillIntro';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, nextGameLevel, recordGameLevel, COMPANIONS } from '@/lib/rewards';
import { logQuestMetric } from '@/lib/metrics';
import { findTrail } from '@/lib/companionTrails';
import { clearReturnPath } from '@/lib/returnTo';
import { speak, chime } from './voice';

export interface RoundResult {
  ok: boolean;
  /** numbers only (COPPA data minimization), summed over the level */
  data?: Record<string, number>;
}

export interface RoundProps {
  /** 1 (easiest) to 10 */
  difficulty: number;
  accent: string;
  /** the friend says a line (shown and read aloud) */
  say: (line: string) => void;
  onDone: (r: RoundResult) => void;
  /** the friend, who plays inside the round */
  pet: { art: string; name: string };
  world: World;
  /** set for a moment after the round ends, so the friend can react */
  reaction: 'win' | 'miss' | null;
}

export interface FriendGameDef {
  id: string;            // game id for levels, metrics and SKILL_INFO
  slug: string;          // the friend's trail slug
  title: string;
  intro: string;         // the friend explains the game
  Round: React.ComponentType<RoundProps>;
  rounds?: number;       // per level, default 5
  cheers: string[];
  tryAgain: string[];
  /** what the friend says when tickled */
  giggles?: string[];
}

const MAX_D = 10;

function startDifficulty(tier: DifficultyTier, level: number) {
  const base = tier === 'tiny' ? 1 : tier === 'small' ? 2 : 3;
  return Math.min(8, base + Math.floor((level - 1) / 3));
}

const pick = <T,>(xs: T[], n: number) => xs[n % xs.length];

export default function FriendGameShell({ game }: { game: FriendGameDef }) {
  const trail = findTrail(game.slug)!;
  const pet = COMPANIONS.find(c => c.name === trail.pet)!;
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);
  const rounds = game.rounds ?? 5;

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [difficulty, setDifficulty] = useState(1);
  const [line, setLine] = useState(game.intro);
  const [between, setBetween] = useState<'win' | 'miss' | null>(null);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const tickles = useRef(0);
  const { layer: bursts, fire } = useBursts();
  const stats = useRef({ startD: 1, startedAt: 0, data: {} as Record<string, number> });

  useEffect(() => { clearReturnPath(); setLevel(nextGameLevel(game.id)); }, [game.id]);

  function say(text: string) { setLine(text); speak(text); }

  function start() {
    const d = startDifficulty(tier, level);
    stats.current = { startD: d, startedAt: Date.now(), data: {} };
    setDifficulty(d);
    setRound(0);
    setResults([]);
    setPhase('play');
    say(game.intro);
  }

  function onDone(r: RoundResult) {
    if (between) return;
    const s = stats.current;
    for (const [k, v] of Object.entries(r.data ?? {})) s.data[k] = (s.data[k] ?? 0) + v;
    const next = [...results, r.ok];
    setResults(next);
    if (r.ok) { chime.good(); say(pick(game.cheers, next.length)); }
    else { chime.soft(); say(pick(game.tryAgain, next.length)); }
    const d = Math.max(1, Math.min(MAX_D, difficulty + (r.ok ? 1 : -1)));
    setBetween(r.ok ? 'win' : 'miss');
    setTimeout(() => {
      setBetween(null);
      if (next.length >= rounds) return finish(next, d);
      setDifficulty(d);
      setRound(n => n + 1);
    }, 1700);
  }

  function finish(res: boolean[], endD: number) {
    const s = stats.current;
    const correct = res.filter(Boolean).length;
    logQuestMetric(trail ? pet.skill : 'other', game.id, {
      level, rounds: res.length, correct, startDifficulty: s.startD, endDifficulty: endD,
      ms: Date.now() - s.startedAt, ...s.data,
    });
    // effort floor: playing always earns light, wins add more
    awardStarlight(Math.max(6, 8 + correct * 2 + level));
    recordGameLevel(game.id, level);
    chime.fanfare();
    setPhase('done');
    [0, 350, 700, 1100].forEach((t, i) => setTimeout(() => fire(20 + (i % 2) * 60, 30 + i * 8, undefined, 16, 110), t));
    say(`Level ${level} done! You were amazing. Want to keep going?`);
  }

  function tickle() {
    tickles.current++;
    setMood('cheer');
    chime.tap();
    fire(50, 45, [trail.color, '#FFFFFF'], 8, 50);
    say(pick(game.giggles ?? ['Hee hee! That tickles!', 'Again, again!', 'You found my giggle spot!'], tickles.current));
  }

  function again() {
    setLevel(l => l + 1);
    setPhase('intro');
    setLine(game.intro);
  }

  const back = `/play/friends/${trail.slug}`;
  const world = trail.slug as World;
  const petInfo = { art: pet.art, name: trail.pet };

  return (
    <div className="min-h-screen px-4 pt-5 pb-8" style={{ background: trail.sky, color: trail.ink }}>
      <div className="max-w-md mx-auto flex flex-col min-h-[calc(100dvh-3.25rem)]">
        <div className="flex items-center gap-3">
          <Link href={back} aria-label={`Back to ${trail.world}`}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.14)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </Link>
          <h1 className="text-2xl font-extrabold leading-tight flex-1 min-w-0">{game.title}</h1>
          {phase === 'play' && (
            // round stars fill in as the level goes: how far along, no scores
            <div className="flex gap-1" aria-label={`Round ${round + 1} of ${rounds}`}>
              {Array.from({ length: rounds }, (_, i) => (
                <svg key={`${i}-${i < results.length}`} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                  className={i < results.length ? 'bounce-in' : i === round ? 'fg-bob' : undefined}>
                  <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"
                    fill={i < results.length ? trail.color : 'rgba(255,255,255,0.18)'} stroke={i === round || i < results.length ? '#FFFFFF' : 'rgba(255,255,255,0.35)'} strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
          )}
        </div>

        {/* what the friend says (the friend itself is in the scene below) */}
        <div key={line} className="relative mt-3 flex items-start gap-2 rounded-3xl bg-white px-3.5 py-2.5 bounce-in" style={{ color: '#1F2A44' }}>
          <p className="flex-1 text-[15px] font-bold leading-snug" aria-live="polite">
            <span className="font-extrabold" style={{ color: '#8A5A00' }}>{trail.pet}: </span>{line}
          </p>
          <button onClick={() => speak(line)} aria-label="Hear it again"
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: `${trail.color}88` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
          </button>
          <span aria-hidden="true" className="absolute -bottom-2 left-10 w-5 h-5 bg-white rotate-45 rounded-[4px]" />
        </div>

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col gap-3 mt-4">
            <Stage world={world} className="aspect-[4/3.4]">
              <Actor art={pet.art} name={trail.pet} x={50} y={88} h={190} mood={mood} moodKey={moodKey} onTap={tickle} />
              {bursts}
            </Stage>
            <div className="flex-1" />
            <button onClick={start}
              className="w-full h-16 rounded-full text-2xl font-extrabold transition-transform active:scale-[0.98] fg-bob"
              style={{ background: trail.color, color: '#1F2A44', boxShadow: '0 6px 0 rgba(0,0,0,0.25)' }}>
              Let&apos;s play!
            </button>
            <SkillIntro gameId={game.id} />
          </div>
        )}

        {phase === 'play' && (
          <div className="relative flex-1 mt-4" style={{ pointerEvents: between ? 'none' : undefined }}>
            <game.Round key={round} difficulty={difficulty} accent={trail.color} say={say} onDone={onDone}
              pet={petInfo} world={world} reaction={between} />
          </div>
        )}

        {phase === 'done' && (
          <div className="flex-1 flex flex-col gap-3 mt-4">
            <Stage world={world} className="aspect-[4/3.4]">
              <Actor art={pet.art} name={trail.pet} x={50} y={88} h={190} mood={mood === 'idle' ? 'dance' : mood} moodKey={moodKey} onTap={tickle} />
              <div className="absolute inset-x-0 top-3 flex justify-center gap-1.5" aria-hidden="true">
                {results.map((_, i) => (
                  <svg key={i} width="36" height="36" viewBox="0 0 24 24" className="bounce-in" style={{ animationDelay: `${0.3 + i * 0.15}s`, animationFillMode: 'both' }}>
                    <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill={trail.color} stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                ))}
              </div>
              {bursts}
            </Stage>
            <div className="flex-1" />
            <button onClick={again}
              className="w-full h-16 rounded-full text-2xl font-extrabold transition-transform active:scale-[0.98] fg-bob"
              style={{ background: trail.color, color: '#1F2A44', boxShadow: '0 6px 0 rgba(0,0,0,0.25)' }}>
              Next level
            </button>
            <Link href={back} className="w-full h-14 rounded-full text-lg font-extrabold flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.14)' }}>
              Back to the trail
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
