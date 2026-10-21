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
import LiveArt from '@/components/characters/LiveArt';
import SkillIntro from '@/components/SkillIntro';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, nextGameLevel, recordGameLevel, COMPANIONS } from '@/lib/rewards';
import { logQuestMetric } from '@/lib/metrics';
import { findTrail, petWidth } from '@/lib/companionTrails';
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
  const [between, setBetween] = useState(false);
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
    setBetween(true);
    setTimeout(() => {
      setBetween(false);
      if (next.length >= rounds) return finish(next, d);
      setDifficulty(d);
      setRound(n => n + 1);
    }, 1400);
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
    say(`Level ${level} done! You were amazing. Want to keep going?`);
  }

  function again() {
    setLevel(l => l + 1);
    setPhase('intro');
    setLine(game.intro);
  }

  const back = `/play/friends/${trail.slug}`;

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
            // round dots: how far along this level is, no scores
            <div className="flex gap-1.5" aria-label={`Round ${round + 1} of ${rounds}`}>
              {Array.from({ length: rounds }, (_, i) => (
                <span key={i} className="w-3 h-3 rounded-full"
                  style={{ background: i < results.length ? trail.color : i === round ? '#FFFFFF' : 'rgba(255,255,255,0.22)' }} />
              ))}
            </div>
          )}
        </div>

        {/* the friend talks */}
        <div className="mt-3 flex items-end gap-2">
          <span className="flex-shrink-0">
            <LiveArt src={pet.art} alt={`${trail.pet} the ${pet.kind}`} size={petWidth(pet.art, phase === 'play' ? 76 : 130)} kind="pet" />
          </span>
          <div className="flex-1 flex items-start gap-2 rounded-3xl bg-white px-3.5 py-2.5 mb-1" style={{ color: '#1F2A44' }}>
            <p className="flex-1 text-[15px] font-bold leading-snug" aria-live="polite">{line}</p>
            <button onClick={() => speak(line)} aria-label="Hear it again"
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: `${trail.color}66` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
            </button>
          </div>
        </div>

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col justify-end gap-3 mt-6">
            <button onClick={start}
              className="w-full h-16 rounded-full text-2xl font-extrabold transition-transform active:scale-[0.98]"
              style={{ background: trail.color, color: '#1F2A44', boxShadow: '0 5px 0 rgba(0,0,0,0.25)' }}>
              Let&apos;s play!
            </button>
            <SkillIntro gameId={game.id} />
          </div>
        )}

        {phase === 'play' && (
          <div className="flex-1 mt-3" style={{ pointerEvents: between ? 'none' : undefined }}>
            <game.Round key={round} difficulty={difficulty} accent={trail.color} say={say} onDone={onDone} />
          </div>
        )}

        {phase === 'done' && (
          <div className="flex-1 flex flex-col justify-end gap-3 mt-6">
            <div className="flex justify-center gap-2 mb-2" aria-hidden="true">
              {results.map((_, i) => (
                <svg key={i} width="34" height="34" viewBox="0 0 24 24" className="bounce-in" style={{ animationDelay: `${i * 0.12}s`, animationFillMode: 'both' }}>
                  <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" fill={trail.color} stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <button onClick={again}
              className="w-full h-16 rounded-full text-2xl font-extrabold transition-transform active:scale-[0.98]"
              style={{ background: trail.color, color: '#1F2A44', boxShadow: '0 5px 0 rgba(0,0,0,0.25)' }}>
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
