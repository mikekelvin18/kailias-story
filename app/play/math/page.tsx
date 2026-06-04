'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Question generators ───────────────────────────────────────────────────────

interface MathQuestion {
  visual: string;          // emoji visual prompt
  prompt: string;          // question text
  choices: number[];
  answer: number;
}

function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function makeQuestion(level: number): MathQuestion {
  const type = level <= 1
    ? 'count'
    : level <= 2
    ? Math.random() < 0.5 ? 'add' : 'subtract'
    : level <= 3
    ? Math.random() < 0.33 ? 'add' : Math.random() < 0.5 ? 'subtract' : 'multiply'
    : Math.random() < 0.5 ? 'multiply' : 'divide';

  if (type === 'count') {
    const n = randomInt(1, 8);
    const emoji = ['🍪','⭐','🍎','🦋','🌸'][randomInt(0,4)];
    const distractors = [n === 1 ? 2 : n - 1, n + 1].filter(v => v > 0 && v !== n);
    return {
      visual: emoji.repeat(n),
      prompt: `How many ${emoji} are there?`,
      choices: shuffle([n, ...distractors.slice(0,2)]),
      answer: n,
    };
  }

  if (type === 'add') {
    const a = randomInt(1, level <= 2 ? 9 : 19);
    const b = randomInt(1, level <= 2 ? 9 : 19);
    const ans = a + b;
    const distractors = shuffle([ans - 1, ans + 1, ans + 2, ans - 2].filter(v => v > 0 && v !== ans)).slice(0, 2);
    const emoji = ['🍪','⭐','🌟'][randomInt(0,2)];
    return {
      visual: `${emoji.repeat(Math.min(a,8))} + ${emoji.repeat(Math.min(b,8))}`,
      prompt: `${a} + ${b} = ?`,
      choices: shuffle([ans, ...distractors]),
      answer: ans,
    };
  }

  if (type === 'subtract') {
    const b = randomInt(1, level <= 2 ? 5 : 12);
    const a = b + randomInt(1, level <= 2 ? 5 : 12);
    const ans = a - b;
    const distractors = shuffle([ans - 1, ans + 1, ans + 2].filter(v => v >= 0 && v !== ans)).slice(0, 2);
    return {
      visual: `${a} - ${b}`,
      prompt: `${a} - ${b} = ?`,
      choices: shuffle([ans, ...distractors]),
      answer: ans,
    };
  }

  if (type === 'multiply') {
    const a = randomInt(2, level <= 3 ? 6 : 9);
    const b = randomInt(2, level <= 3 ? 5 : 9);
    const ans = a * b;
    const distractors = shuffle([ans - a, ans + a, ans + b].filter(v => v > 0 && v !== ans)).slice(0, 2);
    return {
      visual: `${a} × ${b}`,
      prompt: `${a} × ${b} = ?`,
      choices: shuffle([ans, ...distractors]),
      answer: ans,
    };
  }

  // divide
  const b = randomInt(2, 9);
  const ans = randomInt(2, 9);
  const a = b * ans;
  const distractors = shuffle([ans - 1, ans + 1, ans + 2].filter(v => v > 0 && v !== ans)).slice(0, 2);
  return {
    visual: `${a} ÷ ${b}`,
    prompt: `${a} ÷ ${b} = ?`,
    choices: shuffle([ans, ...distractors]),
    answer: ans,
  };
}

function getLevelFromStage(stage: string, age: number | null): number {
  const a = age ?? 8;
  if (a <= 4) return 0;
  if (a <= 6) return 1;
  if (a <= 8) return 2;
  if (a <= 10) return 3;
  return 4;
}

const LEVEL_LABELS = ['Beginner', 'Junior', 'Explorer', 'Advanced', 'Expert'];
const ENCOURAGEMENTS = ['Amazing! 🌟', 'That\'s right! ✨', 'You\'re a math star! ⭐', 'Kailia loves it! 💜', 'Genius! 🧠'];
const WRONG_MSG = ['Keep trying! 💪', 'Almost! 🙂', 'Try again next time! 🔄'];

export default function MathGamePage() {
  const { state, learningStage } = useAssessment();
  const defaultLevel = getLevelFromStage(learningStage, state.childAge);
  const [level, setLevel] = useState(defaultLevel);
  const [question, setQuestion] = useState<MathQuestion>(() => makeQuestion(defaultLevel));
  const [selected, setSelected] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [phase, setPhase] = useState<'q'|'correct'|'wrong'>('q');

  const nextQuestion = useCallback((lvl: number) => {
    setQuestion(makeQuestion(lvl));
    setSelected(null);
    setPhase('q');
  }, []);

  const handleAnswer = (choice: number) => {
    if (phase !== 'q') return;
    setSelected(choice);
    const correct = choice === question.answer;
    setTotal(t => t + 1);
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setPhase('correct');
    } else {
      setStreak(0);
      setPhase('wrong');
    }
    setTimeout(() => nextQuestion(level), 1400);
  };

  const handleLevelChange = (l: number) => {
    setLevel(l);
    setStreak(0); setScore(0); setTotal(0);
    setQuestion(makeQuestion(l));
    setSelected(null); setPhase('q');
  };

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #78350f, #d97706, #fef3c7)' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-amber-800 text-sm font-bold hover:text-amber-900">← Games</Link>
          <h1 className="text-2xl font-extrabold text-amber-900">🍪 Cookie Math</h1>
          <div className="text-right">
            <p className="text-xs font-bold text-amber-700">{streak > 0 ? `🔥 ${streak} streak!` : ''}</p>
          </div>
        </div>

        {/* Level selector */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {LEVEL_LABELS.map((l, i) => (
            <button key={i} onClick={() => handleLevelChange(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: i === level ? '#D97706' : 'rgba(255,255,255,0.5)',
                color: i === level ? 'white' : '#92400E',
                border: `1.5px solid ${i === level ? '#D97706' : '#FDE68A'}`,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Score bar */}
        <div className="rounded-2xl p-3 mb-4 flex justify-between items-center"
          style={{ background: 'rgba(255,255,255,0.6)', border: '2px solid #FDE68A' }}>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-amber-700">{score}</p>
            <p className="text-xs text-amber-600">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-amber-600">Accuracy</p>
            <p className="text-2xl font-extrabold text-amber-800">{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-amber-700">{total}</p>
            <p className="text-xs text-amber-600">Played</p>
          </div>
        </div>

        {/* Question card */}
        <div key={question.prompt} className="rounded-3xl p-7 mb-5 text-center shadow-xl drop-in"
          style={{ background: 'rgba(255,255,255,0.92)', border: '3px solid #D97706' }}>

          {/* Visual prompt */}
          <div className="text-3xl mb-3 leading-loose min-h-[60px] flex items-center justify-center flex-wrap gap-1"
            style={{ wordBreak: 'break-all' }}>
            {question.visual}
          </div>

          <p className="text-xl font-extrabold text-amber-800 mb-5">{question.prompt}</p>

          {/* Choices */}
          <div className="grid grid-cols-3 gap-3">
            {question.choices.map(choice => {
              let bg = '#FFFBEB', border = '#FDE68A', color = '#92400E';
              if (selected !== null) {
                if (choice === question.answer) { bg = '#D1FAE5'; border = '#059669'; color = '#065F46'; }
                else if (choice === selected) { bg = '#FEE2E2'; border = '#DC2626'; color = '#991B1B'; }
              }
              return (
                <button key={choice} onClick={() => handleAnswer(choice)}
                  disabled={phase !== 'q'}
                  className="py-5 rounded-2xl font-extrabold text-3xl transition-all hover:scale-105 disabled:opacity-80"
                  style={{ background: bg, border: `3px solid ${border}`, color }}>
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {phase === 'correct' && (
            <p className="mt-4 font-extrabold text-green-600 text-xl bounce-in">
              {ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]}
            </p>
          )}
          {phase === 'wrong' && (
            <p className="mt-4 font-bold text-red-500 text-base bounce-in">
              The answer was <strong>{question.answer}</strong>. {WRONG_MSG[Math.floor(Math.random() * WRONG_MSG.length)]}
            </p>
          )}
        </div>

        {/* Streak celebration */}
        {streak >= 3 && phase === 'correct' && (
          <div className="text-center bounce-in">
            <span className="text-4xl">{'⭐'.repeat(Math.min(streak, 5))}</span>
            <p className="text-amber-800 font-extrabold">{streak} in a row!</p>
          </div>
        )}

        <p className="text-center text-amber-700 text-xs mt-3">
          💡 Kailia tip: Take your time — count carefully!
        </p>
      </div>
    </main>
  );
}
