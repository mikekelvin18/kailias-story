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

// devMonths: the middle of the assessment's developmental-age range
// (lib/milestones.ts). When present it decides, so a 5-year-old working at
// a 3-year-old level gets 3-year-old games and vice versa. Older checks
// without it fall back to age group + score.
export function difficultyTier(ageGroup: AgeGroup, totalScore: number, devMonths?: number | null): DifficultyTier {
  if (devMonths != null) return devMonths < 30 ? 'tiny' : devMonths < 57 ? 'small' : 'big';
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

export function developmentalBand(ageGroup: AgeGroup, totalScore: number, devMonths?: number | null): DevBand {
  if (devMonths != null) return devMonths < 18 ? 1 : devMonths < 30 ? 2 : devMonths < 48 ? 3 : null;
  if (ageGroup === 'infant') return 1;
  if (ageGroup === 'toddler') return totalScore <= 20 ? 1 : 2;   // dev level under ~18 mo → Band 1
  if (ageGroup === 'preschool') return totalScore <= 20 ? 2 : 3;
  return null;
}

// The Quest Library also has a school-age shelf (Band 4 "Big Adventurer",
// ≈ 4–8 yrs) of together-quests that back up the map games. A school-age
// child (DevBand null) gets Band 4, never toddler quests (Muse review,
// 2026-11-18). With no check yet, the child's real age decides.
export type LibraryBand = 1 | 2 | 3 | 4;

export function libraryBand(devBand: DevBand, devMonths: number | null | undefined, chronoMonths: number | null | undefined): LibraryBand {
  if (devBand) return devBand;
  if (devMonths != null) return 4; // checked, and working at school-age level
  if (chronoMonths != null) return chronoMonths < 18 ? 1 : chronoMonths < 30 ? 2 : chronoMonths < 48 ? 3 : 4;
  return 4;
}

/** Real-age span (months) each shelf's age label covers, matching BAND_INFO[b].ages. */
export const BAND_MONTHS: Record<LibraryBand, [number, number]> = { 1: [6, 18], 2: [18, 30], 3: [30, 48], 4: [48, 96] };

/** Kelvin 2026-11-27: the top card of the Quest Library may show its shelf's
 *  age range only when the child's real age falls inside it (a child placed on
 *  a younger shelf, or a 9-year-old on the 4–8 shelf, sees the name only). */
export function bandAgeFits(band: LibraryBand, chronoMonths: number | null | undefined): boolean {
  if (chronoMonths == null) return false;
  const [lo, hi] = BAND_MONTHS[band];
  return chronoMonths >= lo && chronoMonths <= hi;
}

export const BAND_INFO: Record<LibraryBand, { name: string; emoji: string; ages: string; blurb: string }> = {
  1: { name: 'Little Sprout', emoji: '🌱', ages: 'about 6–18 months',
       blurb: 'Baby learns from your face, your hands, and real objects — you play together off the screen, then tap what you noticed.' },
  2: { name: 'Little Explorer', emoji: '🐾', ages: 'about 18 months – 2½ years',
       blurb: 'Cause and effect is the big lesson now — little hands making big things happen, on screen and off.' },
  3: { name: 'Little Adventurer', emoji: '🎒', ages: 'about 2½ – 4 years',
       blurb: 'Ready for first real games — matching, counting to 3, big tracing, and two-step missions.' },
  4: { name: 'Big Adventurer', emoji: '🧭', ages: 'about 4–8 years',
       blurb: 'Quick real-world missions to do together, practising what the map games teach: letters, sharing, stories, steady hands.' },
};
