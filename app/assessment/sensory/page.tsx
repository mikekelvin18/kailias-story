'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import type { AgeGroup, SensoryScores } from '@/context/AssessmentContext';

// Internal framework: Dunn's Sensory Processing Model (published academic theory)
// Questions are original; patterns align with Dunn's 4-quadrant model
// We call this "Sensory Style Profile" — not "Sensory Profile" (licensed tool)

type SensoryAnswer = 'often' | 'sometimes' | 'rarely' | null;
const SCORE: Record<string, number> = { often: 2, sometimes: 1, rarely: 0 };

interface SensoryPattern {
  key: keyof SensoryScores;
  label: string;
  emoji: string;
  color: string;
  light: string;
  tagline: string;
}

const PATTERNS: SensoryPattern[] = [
  { key: 'lowRegistration', label: 'Noticing Things',    emoji: '😌', color: '#6B7280', light: '#F9FAFB', tagline: 'How easily does your child notice what\'s happening around them?' },
  { key: 'seeking',         label: 'Craving Input',      emoji: '🎢', color: '#3B82F6', light: '#EFF6FF', tagline: 'Does your child actively look for more sensory experiences?' },
  { key: 'sensitive',       label: 'Noticing Too Much',  emoji: '🌊', color: '#7C3AED', light: '#F5F3FF', tagline: 'Does your child notice or get bothered by sensory things others miss?' },
  { key: 'avoiding',        label: 'Avoiding Input',     emoji: '🛡️', color: '#D97706', light: '#FFFBEB', tagline: 'Does your child actively move away from sensory experiences?' },
];

// Age-calibrated questions — 3 per pattern
// infant = 6-11mo, youngChild = 12mo-4yr, older = 5-12yr
const QUESTIONS: Record<keyof SensoryScores, Record<string, string[]>> = {
  lowRegistration: {
    infant: [
      'My baby doesn\'t seem to notice when touched lightly on their back or feet.',
      'My baby appears unaware of a wet or dirty diaper for long periods.',
      'My baby doesn\'t react to mild bumps or gentle falls.',
    ],
    youngChild: [
      'My child doesn\'t notice when their face or hands are messy after eating.',
      'My child seems unaware of cuts or scrapes until someone points them out.',
      'My child often misses what you say unless you\'re right in front of them.',
    ],
    older: [
      'My child doesn\'t notice when their name is called from a short distance.',
      'My child seems unaware of messy hands, face, or dishevelled clothing.',
      'My child often misses instructions and needs them repeated several times.',
    ],
  },
  seeking: {
    infant: [
      'My baby constantly mouths toys, clothing, or their own hands.',
      'My baby loves being bounced, spun, or moved vigorously and always wants more.',
      'My baby bangs toys repeatedly to create sounds or strong sensations.',
    ],
    youngChild: [
      'My child constantly moves, climbs, jumps, or spins even in calm situations.',
      'My child touches everything and everyone around them.',
      'My child seeks out very loud sounds, fast movement, or rough play.',
    ],
    older: [
      'My child constantly fidgets, moves, or touches things during quiet activities.',
      'My child seeks out intense activities — crashing, spinning, or very loud music.',
      'My child touches objects and people around them, often without realising.',
    ],
  },
  sensitive: {
    infant: [
      'My baby startles easily at sounds that don\'t bother other babies.',
      'My baby becomes fussy or distressed in bright lights or busy environments.',
      'My baby is very difficult to soothe once upset.',
    ],
    youngChild: [
      'My child gets upset by sudden noises (vacuum cleaner, hand dryer, sirens).',
      'My child is easily overwhelmed in busy, noisy places like malls or parties.',
      'My child notices smells, sounds, or textures that others don\'t seem to notice.',
    ],
    older: [
      'My child is easily distracted by background noises (fans, conversations, traffic).',
      'My child becomes overwhelmed in crowded or noisy environments.',
      'My child notices sensory details others miss — specific smells, light changes, textures.',
    ],
  },
  avoiding: {
    infant: [
      'My baby resists being touched or held by unfamiliar people.',
      'My baby cries or protests during routine care like hair washing or nail cutting.',
      'My baby rejects certain food textures or bottle types.',
    ],
    youngChild: [
      'My child avoids messy play like finger painting, sand, or play-doh.',
      'My child covers their ears for sounds that don\'t seem to bother others.',
      'My child refuses certain food textures or clothing (tags, seams, specific fabrics).',
    ],
    older: [
      'My child avoids messy activities like art projects, cooking, or outdoor play in mud.',
      'My child covers ears or leaves the room for sounds that don\'t bother others.',
      'My child is very particular about clothing textures, tags, or how things feel on skin.',
    ],
  },
};

function getAgeKey(group: AgeGroup): string {
  if (group === 'infant') return 'infant';
  if (group === 'toddler' || group === 'preschool') return 'youngChild';
  return 'older';
}

export default function SensoryPage() {
  const { state, setSensoryScore, completeSensory } = useAssessment();
  const router = useRouter();
  const ageKey = getAgeKey(state.ageGroup);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<keyof SensoryScores, (SensoryAnswer)[]>>(
    { lowRegistration: [null,null,null], seeking: [null,null,null], sensitive: [null,null,null], avoiding: [null,null,null] }
  );

  const pattern  = PATTERNS[step];
  const qs       = QUESTIONS[pattern.key][ageKey];
  const pAnswers = answers[pattern.key];
  const allDone  = pAnswers.every(a => a !== null);
  const isLast   = step === PATTERNS.length - 1;

  const setAnswer = (qi: number, val: SensoryAnswer) =>
    setAnswers(prev => ({ ...prev, [pattern.key]: prev[pattern.key].map((a,i) => i === qi ? val : a) }));

  const handleNext = () => {
    const score = pAnswers.reduce((s, a) => s + (a ? SCORE[a] : 0), 0);
    setSensoryScore(pattern.key, score);
    if (isLast) {
      completeSensory();
      router.push('/results');
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: '#FFF9F0' }}>
      <div className="max-w-2xl w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="float inline-block mb-2">
            <span style={{ fontSize: 56 }}>🧠</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">Sensory Style Profile</h1>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Understanding how your child experiences the world through their senses.
            Answer based on what you observe most of the time.
          </p>
        </div>

        {/* Pattern progress */}
        <div className="flex gap-2 mb-6">
          {PATTERNS.map((p, i) => (
            <div key={p.key} className="flex-1 h-3 rounded-full transition-all"
              style={{ background: i <= step ? pattern.color : '#E5E7EB' }} />
          ))}
        </div>

        {/* Pattern card */}
        <div className="rounded-3xl p-7 shadow-xl mb-6"
          style={{ background: 'white', border: `3px solid ${pattern.color}` }}>

          <div className="flex items-center gap-3 mb-1">
            <span style={{ fontSize: 40 }}>{pattern.emoji}</span>
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: pattern.color }}>
                {pattern.label}
              </h2>
              <p className="text-gray-500 text-sm">{pattern.tagline}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl p-3 mb-5 text-xs font-semibold text-gray-500"
            style={{ background: pattern.light }}>
            For each statement, choose how often this describes your child:
          </div>

          <div className="space-y-5">
            {qs.map((q, qi) => (
              <div key={qi} className="rounded-2xl p-4"
                style={{ background: pAnswers[qi] ? pattern.light : '#F9FAFB', border: `2px solid ${pAnswers[qi] ? pattern.color : '#E5E7EB'}` }}>
                <p className="text-gray-700 font-semibold text-base mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mr-2"
                    style={{ background: pattern.color }}>
                    {qi + 1}
                  </span>
                  {q}
                </p>
                <div className="flex gap-2">
                  {[
                    { val: 'often' as SensoryAnswer,     label: '🔴 Often',     bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
                    { val: 'sometimes' as SensoryAnswer, label: '🟡 Sometimes', bg: '#FEF3C7', border: '#D97706', text: '#92400E' },
                    { val: 'rarely' as SensoryAnswer,    label: '🟢 Rarely',    bg: '#D1FAE5', border: '#059669', text: '#065F46' },
                  ].map(opt => (
                    <button key={opt.val}
                      onClick={() => setAnswer(qi, opt.val)}
                      className="flex-1 py-2.5 px-1 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{
                        background: pAnswers[qi] === opt.val ? opt.bg : '#F9FAFB',
                        border: `2px solid ${pAnswers[qi] === opt.val ? opt.border : '#E5E7EB'}`,
                        color: pAnswers[qi] === opt.val ? opt.text : '#6B7280',
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-gray-400 text-xs mb-5 italic">
          Based on sensory processing theory and developmental science research.
          This is a profile tool, not a clinical diagnosis.
        </p>

        {/* Next button */}
        <div className="text-center">
          <button onClick={handleNext} disabled={!allDone}
            className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: allDone ? `linear-gradient(135deg, ${pattern.color}, #EC4899)` : '#D1D5DB' }}>
            {isLast ? 'See My Sensory Profile! 🎉' : 'Next Pattern →'}
          </button>
          {!allDone && <p className="text-gray-400 text-sm mt-3">Answer all 3 questions to continue</p>}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Pattern {step + 1} of {PATTERNS.length} • {pattern.label}
        </p>
      </div>
    </main>
  );
}
