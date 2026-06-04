'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaAvatar from '@/components/KailiaAvatar';

const GAMES = [
  {
    href: '/play/visual-scan',
    emoji: '🔍',
    title: "Star Hunt",
    sub: "Visual Scanning",
    desc: "Find all the hidden stars before time runs out!",
    color: '#7C3AED',
    light: '#F5F3FF',
    border: '#DDD6FE',
    domain: 'visual',
  },
  {
    href: '/play/math',
    emoji: '🍪',
    title: "Cookie Math",
    sub: "Numbers & Counting",
    desc: "Help Kailia count cookies and solve tasty math problems!",
    color: '#D97706',
    light: '#FFFBEB',
    border: '#FDE68A',
    domain: 'math',
  },
  {
    href: '/play/reading',
    emoji: '📖',
    title: "Word Wizard",
    sub: "Reading & Letters",
    desc: "Match words to pictures and unlock magical spells!",
    color: '#2563EB',
    light: '#EFF6FF',
    border: '#BFDBFE',
    domain: 'reading',
  },
  {
    href: '/play/fine-motor',
    emoji: '✨',
    title: "Shape Magic",
    sub: "Fine Motor Tracing",
    desc: "Trace magical shapes to help Kailia cast spells!",
    color: '#059669',
    light: '#ECFDF5',
    border: '#A7F3D0',
    domain: 'writing',
  },
  {
    href: '/play/story',
    emoji: '🃏',
    title: "Story Flip",
    sub: "Comprehension",
    desc: "Put Kailia's mixed-up adventure back in order!",
    color: '#EC4899',
    light: '#FDF2F8',
    border: '#FBCFE8',
    domain: 'communication',
  },
  {
    href: '/play/sensory',
    emoji: '🌈',
    title: "Sense Explorer",
    sub: "Sensory & Perception",
    desc: "Match colors, sounds, and patterns in Kailia's world!",
    color: '#0891B2',
    light: '#ECFEFF',
    border: '#A5F3FC',
    domain: 'sensory',
  },
];

// Map stage → display level label
function getLevel(stage: string): string {
  if (stage === 'Early Explorer' || stage === 'Growing Learner') return 'Beginner';
  if (stage === 'Curious Explorer' || stage === 'Bright Starter')  return 'Intermediate';
  if (stage === 'Skill Builder')                                    return 'Developing';
  if (stage === 'Confident Explorer')                               return 'Advanced';
  return 'Expert';
}

// Which domain score is lowest (suggest focus area)
function weakestDomain(scores: Record<string, number>): string {
  const entries = Object.entries(scores);
  return entries.sort((a, b) => a[1] - b[1])[0]?.[0] ?? '';
}

export default function PlayHub() {
  const { state, learningStage, stageEmoji } = useAssessment();
  const router = useRouter();
  const hasAssessment = !!state.childName;
  const level = getLevel(learningStage);
  const weak  = weakestDomain(state.scores);

  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {['🌟','✨','💫','⭐','🎮','🎯'].map((e, i) => (
          <span key={i} className="absolute float sparkle"
            style={{ left: `${(i*17+3)%93}%`, top: `${(i*23+5)%85}%`, fontSize: 22, opacity: 0.25, animationDelay: `${i*0.4}s` }}>
            {e}
          </span>
        ))}
      </div>

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="float inline-block mb-3"><KailiaAvatar size={80} /></div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
            {hasAssessment ? `${state.childName}'s Game World!` : "Kailia's Game World!"}
          </h1>
          {hasAssessment ? (
            <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
              <span className="px-4 py-1.5 rounded-full font-bold text-sm text-white"
                style={{ background: 'rgba(124,58,237,0.7)', border: '1.5px solid rgba(167,139,250,0.6)' }}>
                {stageEmoji} {learningStage}
              </span>
              <span className="px-4 py-1.5 rounded-full font-bold text-sm text-white"
                style={{ background: 'rgba(5,150,105,0.7)', border: '1.5px solid rgba(52,211,153,0.6)' }}>
                🎯 Level: {level}
              </span>
            </div>
          ) : (
            <p className="text-purple-300 mt-2">
              Do the{' '}
              <Link href="/setup" className="underline text-purple-200 font-bold">assessment first</Link>
              {' '}to unlock your personalized level!
            </p>
          )}
        </div>

        {/* Focus suggestion */}
        {hasAssessment && weak && (
          <div className="rounded-2xl p-4 mb-6 text-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
            <p className="text-purple-200 text-sm">
              💡 <strong className="text-white">Kailia's tip:</strong> Try practicing{' '}
              <strong className="text-yellow-300">
                {weak === 'reading' ? 'Word Wizard' : weak === 'writing' ? 'Shape Magic' : weak === 'math' ? 'Cookie Math' : 'Story Flip'}
              </strong>{' '}
              to build that skill!
            </p>
          </div>
        )}

        {/* Game grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {GAMES.map(g => {
            const isFocus = g.domain === weak;
            return (
              <Link key={g.href} href={g.href}
                className="rounded-3xl p-5 shadow-xl transition-all hover:scale-[1.04] hover:shadow-2xl active:scale-[0.98] block"
                style={{
                  background: g.light,
                  border: `3px solid ${isFocus ? g.color : g.border}`,
                  boxShadow: isFocus ? `0 0 0 3px ${g.color}44` : undefined,
                }}>
                {isFocus && (
                  <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2"
                    style={{ background: g.color }}>⭐ Practice this!</span>
                )}
                <div className="text-5xl mb-2">{g.emoji}</div>
                <h2 className="font-extrabold text-base leading-tight" style={{ color: g.color }}>{g.title}</h2>
                <p className="text-xs font-semibold text-gray-500 mb-1">{g.sub}</p>
                <p className="text-xs text-gray-600 leading-snug">{g.desc}</p>
              </Link>
            );
          })}
        </div>

        {/* Back button */}
        <div className="text-center">
          <button onClick={() => router.push('/results')}
            className="px-8 py-3 rounded-full font-bold text-purple-200 transition-all hover:text-white"
            style={{ border: '2px solid rgba(255,255,255,0.25)', background: 'transparent' }}>
            ← Back to Results
          </button>
        </div>
      </div>
    </main>
  );
}
