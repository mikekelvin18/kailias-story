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

// ── Developmental bands for the youngest children ──
// Below preschool level, screen games teach very little by themselves —
// the evidence-aligned approach is parent-coached real-world play.
// Bands pick which Parent & Baby Quest library a family sees.
//
//   Band 1 "Little Sprout"     ≈ under 18 months developmental level
//   Band 2 "Little Explorer"   ≈ 18 months – 2½ years
//   Band 3 "Little Adventurer" ≈ 2½ – 4 years
//   null → school-age level; the world-map games carry the load

export type DevBand = 1 | 2 | 3 | null;

export function developmentalBand(ageGroup: AgeGroup, totalScore: number): DevBand {
  if (ageGroup === 'infant') return 1;
  if (ageGroup === 'toddler') return totalScore <= 20 ? 1 : 2;   // dev level under ~18 mo → Band 1
  if (ageGroup === 'preschool') return totalScore <= 20 ? 2 : 3;
  return null;
}

export const BAND_INFO: Record<1 | 2 | 3, { name: string; emoji: string; ages: string; blurb: string }> = {
  1: { name: 'Little Sprout', emoji: '🌱', ages: 'about 6–18 months',
       blurb: 'Baby learns from your face, your hands, and real objects — you play together off the screen, then tap what you noticed.' },
  2: { name: 'Little Explorer', emoji: '🐾', ages: 'about 18 months – 2½ years',
       blurb: 'Cause and effect is the big lesson now — little hands making big things happen, on screen and off.' },
  3: { name: 'Little Adventurer', emoji: '🎒', ages: 'about 2½ – 4 years',
       blurb: 'Ready for first real games — matching, counting to 3, big tracing, and two-step missions.' },
};
