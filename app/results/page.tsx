'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';

const DOMAIN_INFO = [
  { key: 'reading', label: 'Reading & Literacy', emoji: '📖', color: '#2563EB', max: 10 },
  { key: 'writing', label: 'Writing & Fine Motor', emoji: '✍️', color: '#059669', max: 10 },
  { key: 'communication', label: 'Communication', emoji: '🗣️', color: '#7C3AED', max: 10 },
  { key: 'math', label: 'Math & Problem Solving', emoji: '🔢', color: '#D97706', max: 10 },
];

const STAGE_ACTIVITIES: Record<string, { title: string; activities: string[] }> = {
  'Early Explorer': {
    title: 'Perfect starting point activities:',
    activities: [
      '📚 Read picture books together every day',
      '🖍️ Practice drawing circles, lines, and shapes',
      '🎵 Sing songs and nursery rhymes',
      '🔢 Count objects around the house (spoons, toys)',
      '🧩 Do simple puzzles with 4–6 pieces',
    ],
  },
  'Skill Builder': {
    title: 'Great next-step activities:',
    activities: [
      '📖 Practice sounding out simple words (cat, dog, run)',
      '✏️ Write your name and copy simple sentences',
      '💬 Describe your day in 3–4 sentences',
      '🔢 Practice adding numbers up to 20',
      '📚 Read short books independently',
    ],
  },
  'Confident Explorer': {
    title: 'Challenge activities for this level:',
    activities: [
      '📗 Read chapter books independently',
      '📝 Write short stories with a beginning, middle, and end',
      '🗣️ Give a 1-minute presentation about a favorite topic',
      '➗ Practice multiplication and division',
      '🌍 Explore informational books and non-fiction',
    ],
  },
  'Independent Thinker': {
    title: 'Advanced exploration activities:',
    activities: [
      '📰 Read news articles and discuss main ideas',
      '📓 Keep a daily journal with detailed entries',
      '🎤 Join a debate or storytelling club',
      '🔬 Explore science projects with math data',
      '📚 Read biographies and historical fiction',
    ],
  },
};

export default function ResultsPage() {
  const { state, totalScore, learningStage, stageEmoji, stageDescription, resetAssessment } = useAssessment();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    if (!state.childName) return;
    const save = async () => {
      await supabase.from('assessments').insert({
        child_name: state.childName,
        child_age: state.childAge,
        assessment_type: state.assessmentType,
        reading_score: state.scores.reading,
        writing_score: state.scores.writing,
        communication_score: state.scores.communication,
        math_score: state.scores.math,
        total_score: totalScore,
        learning_stage: learningStage,
      });
      setSaved(true);
    };
    save();

    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const activities = STAGE_ACTIVITIES[learningStage] || STAGE_ACTIVITIES['Skill Builder'];

  const handleStartOver = () => {
    resetAssessment();
    router.push('/');
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* Celebration burst */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl bounce-in">🎉</div>
          {['🌟', '⭐', '✨', '💫', '🎊', '🎈', '🏆', '🌈'].map((e, i) => (
            <span
              key={i}
              className="absolute float"
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${5 + (i % 4) * 22}%`,
                fontSize: 36,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="float inline-block">
            <span style={{ fontSize: 72 }}>🧒</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mt-4 drop-shadow-lg">
            {state.childName ? `${state.childName}'s Adventure Map!` : 'Your Adventure Map!'}
          </h1>
          <p className="text-purple-300 mt-2 text-lg">Kailia found the perfect path just for you!</p>
        </div>

        {/* Stage card */}
        <div
          className="rounded-3xl p-8 mb-6 text-center shadow-2xl bounce-in"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', border: '4px solid rgba(255,255,255,0.3)' }}
        >
          <div className="float inline-block mb-4">
            <span style={{ fontSize: 80 }}>{stageEmoji}</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">{learningStage}</h2>
          <p className="text-purple-100 text-lg leading-relaxed">{stageDescription}</p>
          <div
            className="mt-4 inline-block px-6 py-2 rounded-full font-bold text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            Total Score: {totalScore} / 40
          </div>
        </div>

        {/* Domain breakdown */}
        <div
          className="rounded-3xl p-6 mb-6 shadow-xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)' }}
        >
          <h3 className="text-xl font-bold text-white mb-5">Domain Strengths</h3>
          <div className="space-y-4">
            {DOMAIN_INFO.map(d => {
              const score = state.scores[d.key as keyof typeof state.scores];
              const pct = Math.round((score / d.max) * 100);
              return (
                <div key={d.key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-semibold text-sm">
                      {d.emoji} {d.label}
                    </span>
                    <span className="text-purple-200 text-sm font-bold">{score}/{d.max}</span>
                  </div>
                  <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: d.color, minWidth: 8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended activities */}
        <div
          className="rounded-3xl p-6 mb-6 shadow-xl"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🗺️ {activities.title}
          </h3>
          <ul className="space-y-3">
            {activities.activities.map((act, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: '#F8F0FF' }}
              >
                <span className="text-lg flex-shrink-0">{act.split(' ')[0]}</span>
                <span className="text-gray-700 font-medium">{act.split(' ').slice(1).join(' ')}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-2xl p-5 mb-8 text-sm"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <p className="text-purple-200 leading-relaxed">
            <strong className="text-white">📋 Note for parents:</strong> This is a screening and
            learning placement tool, not a diagnostic assessment. Results are inspired by
            developmental science and educational research to help match your child with the
            right learning activities. For clinical evaluation, please consult a qualified
            professional.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={handleStartOver}
            className="w-full py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
          >
            Start a New Adventure! 🚀
          </button>
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-full font-bold text-lg text-purple-200 transition-all hover:text-white"
            style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'transparent' }}
          >
            🖨️ Print These Results
          </button>
        </div>
      </div>
    </main>
  );
}
