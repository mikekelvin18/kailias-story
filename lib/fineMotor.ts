// ── Tracing results in plain language ──
// The placement tracing task scores each trace against a path whose width
// is set for the child's age (wider for little ones), so every number here
// means "compared with what's typical at THIS age", not an absolute level.
// Shared by the placement screen and /results so they never disagree.

export interface TraceScores {
  composite: number;
  accuracy: number;
  precision: number;
  smoothness: number;
  speed: number;
  liftPenalty: number;
}

export function fineMotorStage(composite: number) {
  if (composite >= 85) return { stage: 'Steady Hands',     emoji: '🎯', color: '#059669',
    description: 'Tracing control above what is typical for this age.' };
  if (composite >= 70) return { stage: 'On Track',         emoji: '✏️', color: '#2563EB',
    description: 'Tracing control typical for this age.' };
  if (composite >= 50) return { stage: 'Getting There',    emoji: '⭐', color: '#D97706',
    description: 'A little less control than most children this age. Daily drawing and tracing helps.' };
  if (composite >= 25) return { stage: 'Building Control', emoji: '🧭', color: '#F59E0B',
    description: 'Staying on the path is still hard at this age\'s level. Worth practising, and worth mentioning to an OT if writing is a struggle.' };
  return { stage: 'Just Starting', emoji: '🌱', color: '#EC4899',
    description: 'Very little tracing control yet. Try again on a touchscreen with a finger; if it stays hard, an OT can take a closer look.' };
}

/** What each sub-score measures, in one line a parent can follow. */
export const TRACE_MEASURES = {
  accuracy:   { label: 'Staying on the path', what: 'How much of the line stayed inside the path.' },
  precision:  { label: 'Closeness to the line', what: 'How near the centre of the path the line ran.' },
  smoothness: { label: 'Smooth, even speed', what: 'Whether the hand moved at a steady pace instead of stop-and-go jerks.' },
  speed:      { label: 'Pace', what: 'Time taken compared with what is typical at this age.' },
  liftPenalty:{ label: 'Keeping the finger down', what: 'Fewer lifts mean more continuous control.' },
} as const;

// One practical next step for the weakest skill (OT-style home ideas).
const NEXT_STEP: Record<keyof typeof TRACE_MEASURES, string> = {
  accuracy:   'Trace thick lines and big shapes between two guide lines, then make the lines thinner over time.',
  precision:  'Dot-to-dot pictures and "drive the car down the road" mazes build careful aiming.',
  smoothness: 'Slow, big movements first: rainbows and figure-8s on a vertical surface (easel, wall paper, window with a dry-erase marker).',
  speed:      'Short timed games like "draw 5 circles before the song ends" build fluent movement. Keep it playful.',
  liftPenalty:'Finger-tracing in sand, shaving foam or a salt tray: one long line without lifting.',
};

/** The lowest sub-score and what to try next. Null when everything is strong (≥ 75). */
export function traceNextStep(s: TraceScores) {
  const keys = Object.keys(TRACE_MEASURES) as (keyof typeof TRACE_MEASURES)[];
  const weakest = keys.reduce((a, b) => (s[b] < s[a] ? b : a));
  if (s[weakest] >= 75) return null;
  return { skill: TRACE_MEASURES[weakest].label, tip: NEXT_STEP[weakest] };
}
