'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import StepGuide from '@/components/ui/StepGuide';
import {
  startingItems, followUpItems, MAX_EXTRA_ROUNDS,
  type Milestone, type MilestoneDomain, type Evidence,
} from '@/lib/milestones';

// The questions themselves live in lib/milestones.ts, one age-tagged
// ladder per area. This page only picks which rungs to ask (starting near
// the child's age, then a few harder / easier ones until the answers
// level out) and hands every answer to the estimator.

type Answer = 'yes' | 'sometimes' | 'notyet';
const CREDIT: Record<Answer, number> = { yes: 1, sometimes: 0.5, notyet: 0 };

interface Domain {
  key: string;
  label: string;
  emoji: string;
  color: string;
  light: string;
  basis: string; // evidence base note
}

// ─── INFANT 6–11 months ──────────────────────────────────────────────────────
// Internal evidence base: CDC Developmental Milestones (2022), WHO Motor Development Study,
// Zero to Three developmental guidelines, ASQ-3 fine motor items
const INFANT_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Social', emoji: '🗣️', color: '#EC4899', light: '#FDF2F8',
    basis: 'CDC Milestones (2022) • Zero to Three guidelines • developmental science research',
  },
  {
    key: 'reading', label: 'Attention & Early Awareness', emoji: '👀', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC Milestones (2022) • Zero to Three guidelines • developmental science research',
  },
  {
    key: 'writing', label: 'Fine Motor & Movement', emoji: '🤲', color: '#059669', light: '#ECFDF5',
    basis: 'CDC gross/fine motor norms • developmental science research', // internally informed by ASQ-3 milestones
  },
  {
    key: 'math', label: 'Problem Solving & Play', emoji: '🧠', color: '#D97706', light: '#FFFBEB',
    basis: 'Piaget sensorimotor stage research • CDC cognitive milestones',
  },
];

// ─── TODDLER 12–23 months ─────────────────────────────────────────────────────
// Internal evidence base: CDC Milestones, ASQ-3 (12/18 month versions), MCHAT-R/F (social items),
// First Words Project communication benchmarks
const TODDLER_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Talking', emoji: '🗣️', color: '#F97316', light: '#FFF7ED',
    basis: 'CDC Milestones • First Words Project • developmental science research',
  },
  {
    key: 'reading', label: 'Early Literacy & Attention', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC language milestones • Zero to Three early literacy guidelines',
  },
  {
    key: 'writing', label: 'Fine Motor & Hand Skills', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC fine motor norms • developmental science research', // internally informed by ASQ-3 12/18mo
  },
  {
    key: 'math', label: 'Problem Solving & Play', emoji: '🧩', color: '#D97706', light: '#FFFBEB',
    basis: 'CDC cognitive milestones • Piaget developmental theory • educational research',
  },
];

// ─── PRESCHOOL 2–4 years ──────────────────────────────────────────────────────
// Internal evidence base: CDC Milestones (ages 2–4), ASQ-3 (24/36/48 month),
// DRDP, Head Start school readiness framework
const PRESCHOOL_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Talking', emoji: '🗣️', color: '#7C3AED', light: '#F3E8FF',
    basis: 'CDC Milestones (2–4 yrs) • Head Start readiness framework • developmental science research',
  },
  {
    key: 'reading', label: 'Reading & Early Literacy', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'CDC language milestones • phonemic awareness research • early literacy science',
  },
  {
    key: 'writing', label: 'Writing & Fine Motor', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC fine motor norms (ages 2–4) • developmental science research', // internally informed by ASQ-3
  },
  {
    key: 'math', label: 'Math & Problem Solving', emoji: '🔢', color: '#D97706', light: '#FFFBEB',
    basis: 'CDC cognitive milestones • early numeracy research • developmental science',
  },
];

// ─── SCHOOL AGE 5–12 years (parent report option) ────────────────────────────
// Internal evidence base: CDC milestones (school age), WRAT-5 skill descriptions,
// grade-level literacy/numeracy benchmarks, DRDP school-age domains
const SCHOOLAGE_DOMAINS: Domain[] = [
  {
    key: 'communication', label: 'Communication & Language', emoji: '🗣️', color: '#7C3AED', light: '#F3E8FF',
    basis: 'CDC school-age milestones • expressive/receptive language research',
  },
  {
    key: 'reading', label: 'Reading & Literacy', emoji: '📖', color: '#2563EB', light: '#EFF6FF',
    basis: 'Phonemic awareness research • grade-level literacy benchmarks • developmental science', // internally informed by reading achievement research
  },
  {
    key: 'writing', label: 'Writing & Fine Motor', emoji: '✍️', color: '#059669', light: '#ECFDF5',
    basis: 'CDC school-age milestones • grade-level writing benchmarks • developmental science',
  },
  {
    key: 'math', label: 'Math & Problem Solving', emoji: '🔢', color: '#D97706', light: '#FFFBEB',
    basis: 'Early numeracy research • school readiness benchmarks • developmental science', // internally informed by math achievement research
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


const BASIS_NOTE = 'Each question is a milestone tagged with the age most children (about 3 in 4) reach it: CDC "Learn the Signs. Act Early." (2022) under 5, OT developmental norms for hand skills, and end-of-grade standards for school age.';

export default function ChecklistPage() {
  const { state, chronoMonths, setDomainScore, setDomainEvidence, completeAssessment } = useAssessment();
  const router = useRouter();

  const group   = (state.ageGroup ?? 'preschool') as string;
  const domains = DOMAINS_BY_GROUP[group] ?? PRESCHOOL_DOMAINS;
  const age     = chronoMonths ?? 36;

  const [step, setStep] = useState(0);
  const [asked, setAsked] = useState<Milestone[]>(() => startingItems(domains[0].key as MilestoneDomain, age));
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [rounds, setRounds] = useState(0);
  const [firstNew, setFirstNew] = useState<string | null>(null);

  const domain      = domains[step];
  const domainKey   = domain.key as MilestoneDomain;
  const allAnswered = asked.every(m => answers[m.id]);
  const isLast      = step === domains.length - 1;

  const handleNext = () => {
    const credit: Record<string, number> = {};
    for (const m of asked) credit[m.id] = CREDIT[answers[m.id]];

    // Not pinned down yet (all "yes" at the top, or "not yet" at the
    // bottom)? Ask a few more rungs before moving on.
    const more = rounds < MAX_EXTRA_ROUNDS ? followUpItems(domainKey, asked, credit) : [];
    if (more.length) {
      setAsked(a => [...a, ...more]);
      setRounds(r => r + 1);
      setFirstNew(more[0].id);
      setTimeout(() => document.getElementById(`q-${more[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const evidence: Evidence[] = asked.map(m => ({ id: m.id, months: m.months, r: credit[m.id], kind: 'parent' }));
    setDomainEvidence(domainKey, evidence);
    // Legacy 0–10 score (share of "yes" credit) — still drives the stage name and the bars.
    const share = evidence.reduce((t, e) => t + e.r, 0) / evidence.length;
    setDomainScore(domainKey, Math.round(share * 10));

    if (isLast) { completeAssessment(); router.push(state.sensoryCompleted ? '/results' : '/assessment/sensory'); return; }
    const next = domains[step + 1].key as MilestoneDomain;
    setStep(s => s + 1);
    setAsked(startingItems(next, age));
    setAnswers({});
    setRounds(0);
    setFirstNew(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isParentReport = group === 'schoolAge';

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: '#FFF9F0' }}>
      <div className="max-w-2xl w-full">
        <StepGuide step={3} className="mb-6" />

        {/* Header */}
        <div className="text-center mb-6">
          <span style={{ fontSize: 52 }}>{domain.emoji}</span>
          <h1 className="text-3xl font-extrabold mt-2" style={{ color: domain.color }}>
            {domain.label}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{GROUP_LABELS[group]}</p>
          <p className="text-gray-500 text-sm mt-1">
            {isParentReport ? 'Choose what best describes your child most of the time.' : 'Answer for what your child does now, on most days.'}
          </p>
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
          {asked.map((m, qi) => (
            <div key={m.id} id={`q-${m.id}`}>
              {m.id === firstNew && (
                <p className="text-center text-sm font-semibold mb-3 rounded-xl py-2 px-3" style={{ background: domain.light, color: domain.color }}>
                  Just a few more for this part. They help make the age range more exact.
                </p>
              )}
              <div
                className="rounded-2xl p-5 shadow-sm"
                style={{ background: 'white', border: `2px solid ${answers[m.id] ? domain.color : '#E5E7EB'}` }}
              >
                <p className="text-gray-700 font-semibold text-base mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold mr-2"
                    style={{ background: domain.color }}>
                    {qi + 1}
                  </span>
                  {m.q}
                </p>
                <div className="flex gap-3">
                  {([
                    { val: 'yes',       label: '✅ Yes',       bg: '#D1FAE5', border: '#059669', text: '#065F46' },
                    { val: 'sometimes', label: '🤔 Sometimes', bg: '#FEF3C7', border: '#D97706', text: '#92400E' },
                    { val: 'notyet',    label: '🌱 Not yet',   bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
                  ] as const).map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setAnswers(a => ({ ...a, [m.id]: opt.val }))}
                      className="flex-1 py-2.5 px-2 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{
                        background: answers[m.id] === opt.val ? opt.bg : '#F9FAFB',
                        border: `2px solid ${answers[m.id] === opt.val ? opt.border : '#E5E7EB'}`,
                        color: answers[m.id] === opt.val ? opt.text : '#6B7280',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evidence note */}
        <p className="text-center text-gray-400 text-xs mt-4 italic">
          📚 {BASIS_NOTE}
        </p>

        {/* Next */}
        <div className="mt-6 text-center">
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className="px-10 py-4 rounded-full font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: allAnswered ? `linear-gradient(135deg, ${domain.color}, #EC4899)` : '#D1D5DB' }}
          >
            {isLast ? (state.sensoryCompleted ? 'See Results! 🎉' : 'Next: senses →') : 'Next part →'}
          </button>
          {!allAnswered && <p className="text-gray-400 text-sm mt-3">Answer all questions to continue</p>}
        </div>

        <p className="text-center text-gray-500 text-sm font-semibold mt-4">
          Part {step + 1} of {domains.length} • {domain.label}
        </p>
      </div>
    </main>
  );
}
