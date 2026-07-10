'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Game data ────────────────────────────────────────────────────────────────

const GRASPS = [
  { id: 'palmar',        name: 'Palmar Grasp',     emoji: '🔨', image: '/grasp/palmar.jpg',        scenarioEmoji: '🔨', scenario: 'You need to hold a heavy hammer',          hint: 'Wrap your whole hand and palm around it' },
  { id: 'pincer',        name: 'Pincer Grasp',     emoji: '🔘', image: '/grasp/pincer.jpg',        scenarioEmoji: '🔘', scenario: 'Pick up one tiny bead or button',           hint: 'Use just the very tips of thumb and finger' },
  { id: 'tripod',        name: 'Tripod Grasp',     emoji: '✏️', image: '/grasp/tripod.jpg',        scenarioEmoji: '✏️', scenario: 'Write your name with a pencil',             hint: 'Thumb + index + middle finger team up' },
  { id: 'lateral-pinch', name: 'Lateral Pinch',    emoji: '🗝️', image: '/grasp/lateral-pinch.jpg', scenarioEmoji: '🗝️', scenario: 'Hold a key flat to unlock a door',          hint: 'Thumb presses against the side of the index finger' },
  { id: 'cylindrical',   name: 'Cylindrical Grasp',emoji: '☕', image: '/grasp/cylindrical.jpg',   scenarioEmoji: '☕', scenario: 'Hold a cup of hot cocoa',                   hint: 'All fingers curl around the round shape' },
  { id: 'spherical',     name: 'Spherical Grasp',  emoji: '🍊', image: '/grasp/spherical.jpg',     scenarioEmoji: '🍊', scenario: 'Hold a big round orange',                   hint: 'Fingers fan out wide around the ball shape' },
  { id: 'hook',          name: 'Hook Grasp',        emoji: '🛍️', image: '/grasp/hook.jpg',          scenarioEmoji: '🛍️', scenario: 'Carry a heavy bag by its handle',           hint: 'Fingers hook through the handle — thumb stays free' },
  { id: 'raking',        name: 'Raking Grasp',      emoji: '🌾', image: '/grasp/raking.jpg',        scenarioEmoji: '🌾', scenario: 'Scoop up cereal or sand with your fingers',  hint: 'Fingers sweep and rake across the surface' },
] as const;

type Grasp = typeof GRASPS[number];
interface Question { correct: Grasp; options: Grasp[]; }

function shuffle<T>(arr: readonly T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuestions(): Question[] {
  return shuffle(GRASPS).map(correct => {
    const others = shuffle(GRASPS.filter(g => g.id !== correct.id)).slice(0, 3) as Grasp[];
    return { correct, options: shuffle([correct, ...others]) as Grasp[] };
  });
}

function getStage(score: number, total: number) {
  const pct = score / total;
  if (pct === 1)   return { label: 'Grasp Expert',   emoji: '🌟', color: '#059669' };
  if (pct >= 0.75) return { label: 'Grasp Pro',      emoji: '🎯', color: '#2563EB' };
  if (pct >= 0.5)  return { label: 'Grasp Explorer', emoji: '🧭', color: '#D97706' };
  if (pct >= 0.25) return { label: 'Grasp Learner',  emoji: '📚', color: '#F59E0B' };
  return             { label: 'Grasp Discoverer', emoji: '🌱', color: '#EC4899' };
}

type Phase = 'intro' | 'playing' | 'done';
const BG = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

// ─── Main component ────────────────────────────────────────────────────────────

export default function GraspGamePage() {
  useAssessment(); // keep context connected for future extensions

  const [phase, setPhase] = useState<Phase>('intro');

  const [questions]              = useState<Question[]>(buildQuestions);
  const [qIdx, setQIdx]          = useState(0);
  const [selected, setSelected]  = useState<string | null>(null);
  const [score, setScore]        = useState(0);
  const scoreRef                 = useRef(0);

  const q = questions[qIdx];

  const pick = useCallback((id: string) => {
    if (selected) return;
    setSelected(id);
    const isCorrect = id === q.correct.id;
    if (isCorrect) { scoreRef.current += 1; setScore(scoreRef.current); }
    setTimeout(() => {
      if (qIdx + 1 >= questions.length) { setPhase('done'); }
      else { setQIdx(i => i + 1); setSelected(null); }
    }, 1700);
  }, [selected, q, qIdx, questions.length]);

  const restart = () => {
    scoreRef.current = 0; setScore(0); setQIdx(0); setSelected(null); setPhase('playing');
  };

  // ── intro ─────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-7xl mb-3">🤲</div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Grasp Master</h1>
          <p className="text-purple-300 text-sm mb-6">Match the grip to the object!</p>
          <div className="rounded-2xl p-4 mb-6 grid grid-cols-2 gap-2 text-left"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {GRASPS.map(g => (
              <div key={g.id} className="flex items-center gap-2">
                <span className="text-base">{g.emoji}</span>
                <span className="text-purple-200 text-xs font-medium">{g.name}</span>
              </div>
            ))}
          </div>
          <p className="text-purple-300 text-xs mb-6">
            Look at each activity — then tap the photo that shows the right hand grip!
          </p>
          <button onClick={() => setPhase('playing')}
            className="px-8 py-4 rounded-full font-extrabold text-white text-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
            Let&apos;s Play! 🎮
          </button>
        </div>
      </main>
    );
  }

  // ── done ─────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const stage = getStage(score, questions.length);
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Well done!</h1>
          <p className="text-purple-300 text-sm mb-6">All 8 grasp patterns matched</p>
          <div className="rounded-3xl p-6 mb-5 shadow-xl"
            style={{ background: 'rgba(255,255,255,0.96)', border: `3px solid ${stage.color}` }}>
            <p className="text-5xl font-extrabold mb-1" style={{ color: stage.color }}>
              {score}<span className="text-2xl text-gray-400">/{questions.length}</span>
            </p>
            <p className="font-bold text-xl mb-3" style={{ color: stage.color }}>
              {stage.label} {stage.emoji}
            </p>
            <div className="h-3 rounded-full mb-3" style={{ background: '#E5E7EB' }}>
              <div className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${(score / questions.length) * 100}%`, background: stage.color }} />
            </div>
            {gripInfo && (
              <p className="text-gray-500 text-xs mt-2">
                Pencil grip recorded: <span className="font-bold" style={{ color: gripInfo.noteColor }}>{gripInfo.label}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/play"
              className="px-5 py-3 rounded-full font-bold text-purple-300 text-sm transition-all hover:scale-105"
              style={{ border: '2px solid rgba(167,139,250,0.5)' }}>
              ← All Games
            </Link>
            <button onClick={restart}
              className="px-5 py-3 rounded-full font-extrabold text-white text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              Play Again 🔄
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── playing ───────────────────────────────────────────────────────────────────
  const isAnswered = !!selected;
  const wasCorrect = selected === q.correct.id;

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: BG }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <Link href="/play" className="text-purple-400 text-sm font-bold hover:text-purple-200">← Games</Link>
          <span className="text-purple-200 text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
            {qIdx + 1} / {questions.length}
          </span>
          <span className="text-yellow-300 text-sm font-bold">⭐ {score}</span>
        </div>

        <div className="h-1.5 rounded-full mb-5" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(qIdx / questions.length) * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
        </div>

        <div className="rounded-3xl p-5 mb-4 text-center"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1.5px solid rgba(255,255,255,0.18)' }}>
          <div className="text-5xl mb-2">{q.correct.scenarioEmoji}</div>
          <p className="text-white font-extrabold text-base mb-0.5">How would you hold this?</p>
          <p className="text-purple-200 text-sm">{q.correct.scenario}</p>
          {isAnswered && (
            <div className="mt-3 rounded-2xl px-4 py-2"
              style={{ background: wasCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)' }}>
              <p className="font-bold text-sm" style={{ color: wasCorrect ? '#10B981' : '#F87171' }}>
                {wasCorrect ? '✅ Correct!' : `❌ That's the ${q.correct.name}`}
              </p>
              <p className="text-purple-300 text-xs mt-0.5">{q.correct.hint}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map(opt => {
            const isThis  = selected === opt.id;
            const correct = opt.id === q.correct.id;
            let borderColor = 'rgba(255,255,255,0.15)';
            if (isAnswered) {
              if (correct)     borderColor = '#10B981';
              else if (isThis) borderColor = '#EF4444';
            }
            return (
              <button key={opt.id} onClick={() => pick(opt.id)} disabled={isAnswered}
                className="rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.03] active:scale-95"
                style={{ border: `2.5px solid ${borderColor}`, background: 'rgba(0,0,0,0.3)' }}>
                <div className="relative w-full" style={{ paddingBottom: '70%' }}>
                  <Image src={opt.image} alt={opt.name} fill sizes="(max-width: 768px) 45vw, 200px"
                    style={{ objectFit: 'cover' }} />
                  {isAnswered && correct && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.35)' }}>
                      <span className="text-4xl">✅</span>
                    </div>
                  )}
                  {isAnswered && isThis && !correct && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'rgba(239,68,68,0.35)' }}>
                      <span className="text-4xl">❌</span>
                    </div>
                  )}
                </div>
                <div className="px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-white text-xs font-bold leading-tight">{opt.name}</p>
                </div>
              </button>
            );
          })}
        </div>

        {!isAnswered && (
          <p className="text-center text-purple-400 text-xs mt-4">👆 Tap the photo that shows the right grip</p>
        )}
      </div>
    </main>
  );
}
