'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';

type Answer = 'yes' | 'sometimes' | 'notyet' | null;
const SCORE = { yes: 2, sometimes: 1, notyet: 0 };

const DOMAINS = [
  {
    key: 'communication',
    label: 'Communication & Talking',
    emoji: '🗣️',
    color: '#7C3AED',
    light: '#F3E8FF',
    questions: [
      'Can your child point to things when you name them (e.g., "Where\'s the ball?")?',
      'Can your child follow simple 1–2 step instructions (e.g., "Pick up your shoes and bring them here")?',
      'Does your child use 2–3 word sentences (e.g., "want juice")?',
      'Does your child ask simple questions (e.g., "Where go?" or "What\'s that?")?',
      'Does your child understand simple concepts like "big/small" or "up/down"?',
    ],
  },
  {
    key: 'reading',
    label: 'Reading & Early Literacy',
    emoji: '📖',
    color: '#2563EB',
    light: '#EFF6FF',
    questions: [
      'Does your child enjoy looking at picture books or being read to?',
      'Can your child recognize familiar signs, logos, or letters (e.g., McDonald\'s "M")?',
      'Does your child pretend to "read" by telling a story from pictures?',
      'Can your child identify at least 5 common objects in pictures (dog, car, apple, etc.)?',
      'Can your child recognize rhymes or notice when words sound alike (cat/hat)?',
    ],
  },
  {
    key: 'writing',
    label: 'Writing & Fine Motor',
    emoji: '✍️',
    color: '#059669',
    light: '#ECFDF5',
    questions: [
      'Can your child scribble or draw simple lines or shapes with a crayon or pen?',
      'Can your child stack 6 or more blocks?',
      'Can your child turn pages in a book one at a time?',
      'Can your child attempt to copy simple shapes like a circle or straight line?',
      'Can your child hold small objects (like a spoon or toy) using fingers rather than whole hand?',
    ],
  },
  {
    key: 'math',
    label: 'Math & Problem Solving',
    emoji: '🔢',
    color: '#D97706',
    light: '#FFFBEB',
    questions: [
      'Can your child count up to 5 objects correctly?',
      'Can your child match shapes (circle to circle, square to square)?',
      'Can your child sort objects by color, shape, or size?',
      'Can your child understand "more" vs "less" when shown objects?',
      'Can your child complete a simple puzzle with 3–5 pieces?',
    ],
  },
];

export default function ChecklistPage() {
  const { state, setDomainScore } = useAssessment();
  const router = useRouter();

  // answers[domain][question] = 'yes' | 'sometimes' | 'notyet' | null
  const [answers, setAnswers] = useState<Record<string, (Answer)[]>>(
    Object.fromEntries(DOMAINS.map(d => [d.key, Array(5).fill(null)]))
  );
  const [step, setStep] = useState(0);

  const domain = DOMAINS[step];
  const domainAnswers = answers[domain.key];
  const allAnswered = domainAnswers.every(a => a !== null);
  const isLast = step === DOMAINS.length - 1;

  const setAnswer = (qIdx: number, val: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [domain.key]: prev[domain.key].map((a, i) => i === qIdx ? val : a),
    }));
  };

  const handleNext = () => {
    const score = domainAnswers.reduce((sum, a) => sum + (a ? SCORE[a] : 0), 0);
    setDomainScore(domain.key as 'reading' | 'writing' | 'communication' | 'math', score);
    if (isLast) {
      router.push('/results');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start px-4 py-10"
      style={{ background: '#FFF9F0' }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <span style={{ fontSize: 52 }}>{domain.emoji}</span>
          <h1 className="text-3xl font-extrabold mt-3" style={{ color: domain.color }}>
            {domain.label}
          </h1>
          <p className="text-gray-500 mt-2">
            For each item, choose what best describes your child most of the time.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {DOMAINS.map((d, i) => (
            <div
              key={d.key}
              className="h-3 flex-1 rounded-full transition-all"
              style={{ background: i <= step ? domain.color : '#E5E7EB' }}
            />
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {domain.questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: 'white', border: `2px solid ${domainAnswers[qi] ? domain.color : '#E5E7EB'}` }}
            >
              <p className="text-gray-700 font-semibold text-base mb-4">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold mr-2"
                  style={{ background: domain.color }}
                >
                  {qi + 1}
                </span>
                {q}
              </p>
              <div className="flex gap-3">
                {[
                  { val: 'yes' as Answer, label: '✅ Yes', bg: '#D1FAE5', border: '#059669', text: '#065F46' },
                  { val: 'sometimes' as Answer, label: '🤔 Sometimes', bg: '#FEF3C7', border: '#D97706', text: '#92400E' },
                  { val: 'notyet' as Answer, label: '❌ Not Yet', bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setAnswer(qi, opt.val)}
                    className="flex-1 py-2.5 px-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                    style={{
                      background: domainAnswers[qi] === opt.val ? opt.bg : '#F9FAFB',
                      border: `2px solid ${domainAnswers[qi] === opt.val ? opt.border : '#E5E7EB'}`,
                      color: domainAnswers[qi] === opt.val ? opt.text : '#6B7280',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Next button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: allAnswered ? `linear-gradient(135deg, ${domain.color}, #EC4899)` : '#D1D5DB' }}
          >
            {isLast ? 'See Results! 🎉' : 'Next Domain →'}
          </button>
          {!allAnswered && (
            <p className="text-gray-400 text-sm mt-3">Answer all questions to continue</p>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Domain {step + 1} of {DOMAINS.length} • {domain.label}
        </p>
      </div>
    </main>
  );
}
