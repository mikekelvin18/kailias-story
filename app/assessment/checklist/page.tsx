'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import type { AgeGroup } from '@/context/AssessmentContext';

type Answer = 'yes' | 'sometimes' | 'notyet' | null;
const SCORE: Record<string, number> = { yes: 2, sometimes: 1, notyet: 0 };

interface Domain {
  key: string;
  label: string;
  emoji: string;
  color: string;
  light: string;
  basis: string; // evidence base note
  questions: string[];
}

// ─── INFANT 6–11 months ──────────────────────────────────────────────────────
// Internal evidence base: CDC Developmental Milestones (2022), WHO Motor Development Study,
// Zero to Three developmental guidelines, ASQ-3 fine motor items
const INFANT_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Social', emoji: '🗣️', color: '#EC4899', light: '#FDF2F8',
    basis: 'CDC Milestones (2022) • Zero to Three guidelines • developmental science research',
    questions: [
      'Does your baby respond to their name by looking toward you?',
      'Does your baby babble using sounds like "ba," "da," or "ma"?',
      'Does your baby make eye contact and smile back when you smile at them?',
      'Does your baby laugh, squeal, or show excitement with sounds?',
      'Does your baby try to get your attention by making sounds or reaching toward you?',
    ],
  },
  {
    key: 'reading', label: 'Attention & Early Awareness', emoji: '👀', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC Milestones (2022) • Zero to Three guidelines • developmental science research',
    questions: [
      'Does your baby watch your face closely when you talk or read to them?',
      'Does your baby turn toward a voice or sound from across the room?',
      'Does your baby look at pictures in a book, even briefly?',
      'Does your baby reach for objects they can see?',
      'Does your baby show curiosity about new objects or people?',
    ],
  },
  {
    key: 'writing', label: 'Fine Motor & Movement', emoji: '🤲', color: '#059669', light: '#ECFDF5',
    basis: 'CDC gross/fine motor norms • developmental science research', // internally informed by ASQ-3 milestones
    questions: [
      'Does your baby reach for and grasp objects placed near them?',
      'Does your baby pass objects from one hand to the other?',
      'Does your baby bang two objects together?',
      'Does your baby use a pincer grasp (thumb + one finger) to pick up small items?',
      'Does your baby explore objects by shaking, banging, or dropping them?',
    ],
  },
  {
    key: 'math', label: 'Problem Solving & Play', emoji: '🧠', color: '#D97706', light: '#FFFBEB',
    basis: 'Piaget sensorimotor stage research • CDC cognitive milestones',
    questions: [
      'Does your baby look for a toy after you hide it (understanding it still exists)?',
      'Does your baby repeat an action that caused a fun result — like hitting a toy that makes noise?',
      'Does your baby react differently to familiar people vs. strangers?',
      'Does your baby imitate simple actions you do (clapping, waving)?',
      'Does your baby show anticipation of familiar routines (gets excited at bath time or feeding)?',
    ],
  },
];

// ─── TODDLER 12–23 months ─────────────────────────────────────────────────────
// Internal evidence base: CDC Milestones, ASQ-3 (12/18 month versions), MCHAT-R/F (social items),
// First Words Project communication benchmarks
const TODDLER_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Talking', emoji: '🗣️', color: '#F97316', light: '#FFF7ED',
    basis: 'CDC Milestones • First Words Project • developmental science research',
    questions: [
      'Does your child say at least 1–3 recognizable words (e.g., "mama," "no," "ball")?',
      'Does your child follow simple one-step instructions ("Come here," "Give me that")?',
      'Does your child point to things they want, or to show you something interesting?',
      'Does your child wave bye-bye, shake their head, or use other gestures?',
      'Does your child try to repeat words or sounds that you say?',
    ],
  },
  {
    key: 'reading', label: 'Early Literacy & Attention', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC language milestones • Zero to Three early literacy guidelines',
    questions: [
      'Does your child enjoy looking at picture books or being read to?',
      'Does your child point to pictures when you name them ("Where\'s the dog?")?',
      'Does your child recognize familiar people or objects in photos?',
      'Does your child turn pages of a board book?',
      'Does your child "talk" about pictures using sounds or their own words?',
    ],
  },
  {
    key: 'writing', label: 'Fine Motor & Hand Skills', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC fine motor norms • developmental science research', // internally informed by ASQ-3 12/18mo
    questions: [
      'Does your child scribble with a crayon or marker?',
      'Does your child stack 2 or more blocks?',
      'Does your child pick up small objects using thumb and one finger?',
      'Does your child feed themselves with fingers, or attempt to use a spoon?',
      'Does your child turn knobs, open simple containers, or manipulate small toys?',
    ],
  },
  {
    key: 'math', label: 'Problem Solving & Play', emoji: '🧩', color: '#D97706', light: '#FFFBEB',
    basis: 'CDC cognitive milestones • Piaget developmental theory • educational research',
    questions: [
      'Does your child look for a hidden toy under a blanket or cup?',
      'Does your child understand simple concepts like "more" or "all gone"?',
      'Does your child point to body parts when asked ("Where\'s your nose?")?',
      'Does your child sort objects or attempt to match shapes?',
      'Does your child complete a simple shape-sorter or 2–3 piece puzzle?',
    ],
  },
];

// ─── PRESCHOOL 2–4 years ──────────────────────────────────────────────────────
// Internal evidence base: CDC Milestones (ages 2–4), ASQ-3 (24/36/48 month),
// DRDP, Head Start school readiness framework
const PRESCHOOL_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Talking', emoji: '🗣️', color: '#7C3AED', light: '#F3E8FF',
    basis: 'CDC Milestones (2–4 yrs) • Head Start readiness framework • developmental science research',
    questions: [
      'Can your child point to things when you name them (e.g., "Where\'s the ball?")?',
      'Can your child follow 1–2 step instructions (e.g., "Pick up your shoes and bring them here")?',
      'Does your child use sentences with 2–3 words (e.g., "want juice," "big dog")?',
      'Does your child ask simple questions (e.g., "Where go?" or "What\'s that?")?',
      'Does your child understand simple concepts like "big/small" or "up/down"?',
    ],
  },
  {
    key: 'reading', label: 'Reading & Early Literacy', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC language milestones • phonemic awareness research • early literacy science',
    questions: [
      'Does your child enjoy looking at picture books or being read to?',
      'Can your child recognize familiar signs, logos, or letters (e.g., McDonald\'s "M")?',
      'Does your child pretend to "read" by telling a story from pictures?',
      'Can your child identify at least 5 common objects in pictures (dog, car, apple)?',
      'Can your child recognize rhymes or notice when words sound alike (cat/hat)?',
    ],
  },
  {
    key: 'writing', label: 'Writing & Fine Motor', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC fine motor norms (ages 2–4) • developmental science research', // internally informed by ASQ-3
    questions: [
      'Can your child scribble or draw simple lines and shapes with a crayon or pen?',
      'Can your child stack 6 or more blocks?',
      'Can your child turn pages in a book one at a time?',
      'Can your child attempt to copy simple shapes like a circle or straight line?',
      'Can your child hold small objects using fingers rather than a whole-hand grip?',
    ],
  },
  {
    key: 'math', label: 'Math & Problem Solving', emoji: '🔢', color: '#D97706', light: '#FFFBEB',
    basis: 'CDC cognitive milestones • early numeracy research • developmental science',
    questions: [
      'Can your child count up to 5 objects correctly?',
      'Can your child match shapes (circle to circle, square to square)?',
      'Can your child sort objects by color, shape, or size?',
      'Can your child understand "more" vs "less" when shown objects?',
      'Can your child complete a simple puzzle with 3–5 pieces?',
    ],
  },
];

// ─── SCHOOL AGE 5–12 years (parent report option) ────────────────────────────
// Internal evidence base: CDC milestones (school age), WRAT-5 skill descriptions,
// grade-level literacy/numeracy benchmarks, DRDP school-age domains
const SCHOOLAGE_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Language', emoji: '🗣️', color: '#7C3AED', light: '#F3E8FF',
    basis: 'CDC school-age milestones • expressive/receptive language research',
    questions: [
      'My child can have conversations with both kids and adults.',
      'My child tells stories or describes events with a clear beginning, middle, and end.',
      'My child asks and answers questions to keep a conversation going.',
      'My child understands jokes, riddles, or wordplay.',
      'My child explains their own ideas and opinions clearly.',
    ],
  },
  {
    key: 'reading', label: 'Reading & Literacy', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'Phonemic awareness research • grade-level literacy benchmarks • developmental science', // internally informed by reading achievement research
    questions: [
      'My child enjoys reading books on their own.',
      'My child can read and understand age-appropriate stories.',
      'My child can sound out new or unfamiliar words.',
      'My child asks questions about stories they hear or read.',
      'My child can identify the main idea of a story or passage.',
    ],
  },
  {
    key: 'writing', label: 'Writing & Fine Motor', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC school-age milestones • grade-level writing benchmarks • developmental science',
    questions: [
      'My child\'s handwriting is clear enough to be understood.',
      'My child writes sentences with a beginning, middle, and end.',
      'My child uses punctuation (periods, question marks, etc.).',
      'My child enjoys drawing or writing their own stories.',
      'My child can copy from a board, book, or screen without much difficulty.',
    ],
  },
  {
    key: 'math', label: 'Math & Problem Solving', emoji: '🔢', color: '#D97706', light: '#FFFBEB',
    basis: 'Early numeracy research • school readiness benchmarks • developmental science', // internally informed by math achievement research
    questions: [
      'My child can add and subtract numbers confidently.',
      'My child can multiply and divide simple numbers.',
      'My child understands fractions or parts of a whole (½, ¼).',
      'My child can solve age-appropriate word problems.',
      'My child can tell time and count money.',
    ],
  },
];

const DOMAINS_BY_GROUP: Record<string, Domain[]> = {
  infant:     INFANT_DOMAINS,
  toddler:    TODDLER_DOMAINS,
  preschool:  PRESCHOOL_DOMAINS,
  schoolAge:  SCHOOLAGE_DOMAINS,
};

const GROUP_LABELS: Record<string, string> = {
  infant:    'Infant (6–11 months)',
  toddler:   'Toddler (12–23 months)',
  preschool: 'Preschool (2–4 years)',
  schoolAge: 'School Age (5–12 years)',
};

export default function ChecklistPage() {
  const { state, setDomainScore } = useAssessment();
  const router = useRouter();

  const group   = (state.ageGroup ?? 'preschool') as string;
  const domains = DOMAINS_BY_GROUP[group] ?? PRESCHOOL_DOMAINS;

  const [answers, setAnswers] = useState<Record<string, Answer[]>>(
    Object.fromEntries(domains.map(d => [d.key, Array(5).fill(null)]))
  );
  const [step, setStep] = useState(0);

  const domain        = domains[step];
  const domainAnswers = answers[domain.key];
  const allAnswered   = domainAnswers.every(a => a !== null);
  const isLast        = step === domains.length - 1;

  const setAnswer = (qi: number, val: Answer) => {
    setAnswers(prev => ({
      ...prev,
      [domain.key]: prev[domain.key].map((a, i) => i === qi ? val : a),
    }));
  };

  const handleNext = () => {
    const score = domainAnswers.reduce((sum, a) => sum + (a ? SCORE[a] : 0), 0);
    setDomainScore(domain.key as 'reading' | 'writing' | 'communication' | 'math', score);
    if (isLast) { router.push('/results'); } else { setStep(s => s + 1); }
  };

  // For school-age parent report, use "My child..." phrasing; others use direct questions
  const isParentReport = group === 'schoolAge';

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: '#FFF9F0' }}>
      <div className="max-w-2xl w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <span style={{ fontSize: 52 }}>{domain.emoji}</span>
          <h1 className="text-3xl font-extrabold mt-2" style={{ color: domain.color }}>
            {domain.label}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{GROUP_LABELS[group]}</p>
          {isParentReport && (
            <p className="text-gray-500 text-sm mt-1">Choose what best describes your child most of the time.</p>
          )}
        </div>

        {/* Domain progress bar */}
        <div className="flex gap-2 mb-6 justify-center">
          {domains.map((d, i) => (
            <div key={d.key} className="h-3 flex-1 rounded-full transition-all"
              style={{ background: i <= step ? domain.color : '#E5E7EB' }} />
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
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold mr-2"
                  style={{ background: domain.color }}>
                  {qi + 1}
                </span>
                {q}
              </p>
              <div className="flex gap-3">
                {[
                  { val: 'yes' as Answer,      label: '✅ Yes',       bg: '#D1FAE5', border: '#059669', text: '#065F46' },
                  { val: 'sometimes' as Answer, label: '🤔 Sometimes', bg: '#FEF3C7', border: '#D97706', text: '#92400E' },
                  { val: 'notyet' as Answer,    label: '❌ Not Yet',   bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
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

        {/* Evidence note */}
        <p className="text-center text-gray-400 text-xs mt-4 italic">
          📚 Based on: {domain.basis}
        </p>

        {/* Next */}
        <div className="mt-6 text-center">
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: allAnswered ? `linear-gradient(135deg, ${domain.color}, #EC4899)` : '#D1D5DB' }}
          >
            {isLast ? 'See Results! 🎉' : 'Next Domain →'}
          </button>
          {!allAnswered && <p className="text-gray-400 text-sm mt-3">Answer all questions to continue</p>}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Domain {step + 1} of {domains.length} • {domain.label}
        </p>
      </div>
    </main>
  );
}
