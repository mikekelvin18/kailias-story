// ── Developmental difficulty tiers ──
// Games ask "how challenging should I be?" and get one of three answers,
// based on the assessment's age group and total score — never shown to kids.
//
//   tiny  → developmental level roughly under 2½ years: numbers 1–3,
//           big slow targets, visual hints always on
//   small → preschool level (or older kids who scored low): numbers to ~5
//   big   → confident school-age level: numbers to ~9, faster targets

import type { AgeGroup } from '@/context/AssessmentContext';

export type DifficultyTier = 'tiny' | 'small' | 'big';

export function difficultyTier(ageGroup: AgeGroup, totalScore: number): DifficultyTier {
  if (ageGroup === 'infant' || ageGroup === 'toddler') return 'tiny';
  if (ageGroup === 'preschool') return 'small';
  if (ageGroup === 'schoolAge') return totalScore <= 20 ? 'small' : 'big';
  return 'small'; // no assessment yet — a friendly middle
}
