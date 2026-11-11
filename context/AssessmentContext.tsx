'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scopedKey, ACTIVE_CHILD_CHANGED_EVENT } from '@/lib/family';
import {
  estimateAge, formatAgeRange, compareToAge, MILESTONE_DOMAINS,
  type AgeEstimate, type AgeComparison, type Evidence, type MilestoneDomain,
} from '@/lib/milestones';

export type AgeGroup = 'infant' | 'toddler' | 'preschool' | 'schoolAge' | null;
export type InputMethod = 'touch' | 'mouse' | null;

export interface SensoryScores {
  lowRegistration: number;
  seeking: number;
  sensitive: number;
  avoiding: number;
}

export interface FineMotorSubScores {
  composite: number;
  accuracy: number;
  precision: number;
  smoothness: number;
  speed: number;
  liftPenalty: number;
}

export interface AssessmentState {
  childName: string;
  childAge: number | null;
  /** Real age in months at the time of the check (from birth month/year). */
  childAgeMonths: number | null;
  ageGroup: AgeGroup;
  assessmentType: 'checklist' | 'games' | null;
  scores: { reading: number; writing: number; communication: number; math: number };
  sensoryScores: SensoryScores;
  sensoryCompleted: boolean;
  fineMotorInputMethod: InputMethod;
  graspPattern: string | null;
  fineMotorSubScores: FineMotorSubScores | null;
  assessmentCompleted: boolean;
  /** Every milestone answer / task result, per area — the estimator's input (lib/milestones.ts). */
  evidence: Partial<Record<MilestoneDomain, Evidence[]>>;
}

interface AssessmentContextType {
  state: AssessmentState;
  loaded: boolean;
  setChildInfo: (name: string, age: number, ageMonths?: number) => void;
  setDomainEvidence: (domain: MilestoneDomain, evidence: Evidence[]) => void;
  setAssessmentType: (type: 'checklist' | 'games') => void;
  setDomainScore: (domain: keyof AssessmentState['scores'], score: number) => void;
  setSensoryScore: (pattern: keyof SensoryScores, score: number) => void;
  completeSensory: () => void;
  completeAssessment: () => void;
  setFineMotorInputMethod: (method: InputMethod) => void;
  setGraspPattern: (pattern: string) => void;
  setFineMotorSubScores: (scores: FineMotorSubScores) => void;
  resetAssessment: () => void;
  totalScore: number;
  learningStage: string;
  stageEmoji: string;
  stageDescription: string;
  developmentalAge: string;
  domainAge: (score: number) => string;
  /** Real age in months (falls back to the age group). */
  chronoMonths: number | null;
  /** Range estimate per area, null for checks done before the milestone ladders existed. */
  estimates: Partial<Record<MilestoneDomain, AgeEstimate>>;
  /** Midpoint of the overall estimate, in months — drives game difficulty and the Quest Library band. */
  devMonths: number | null;
  /** "about 2½ to 3½ years" for one area, falling back to the older score bands. */
  domainRange: (domain: MilestoneDomain) => string;
  domainComparison: (domain: MilestoneDomain) => AgeComparison | null;
  primarySensoryPattern: string;
  sensoryPatternEmoji: string;
  sensoryPatternDescription: string;
}

const defaultState: AssessmentState = {
  childName: '',
  childAge: null,
  childAgeMonths: null,
  ageGroup: null,
  assessmentType: null,
  scores: { reading: 0, writing: 0, communication: 0, math: 0 },
  sensoryScores: { lowRegistration: 0, seeking: 0, sensitive: 0, avoiding: 0 },
  sensoryCompleted: false,
  fineMotorInputMethod: null,
  graspPattern: null,
  fineMotorSubScores: null,
  assessmentCompleted: false,
  evidence: {},
};

function deriveAgeGroup(age: number): AgeGroup {
  if (age === 0.5) return 'infant';
  if (age === 1)   return 'toddler';
  if (age <= 4)    return 'preschool';
  return 'schoolAge';
}

function getDevAge(total: number, group: AgeGroup): string {
  if (group === 'infant') {
    if (total <= 10) return '6–7 months';
    if (total <= 20) return '7–9 months';
    if (total <= 30) return '9–10 months';
    return '10–11 months';
  }
  if (group === 'toddler') {
    if (total <= 10) return '12–14 months';
    if (total <= 20) return '14–17 months';
    if (total <= 30) return '17–21 months';
    return '21–23 months';
  }
  if (group === 'preschool') {
    if (total <= 10) return '2–2.5 years';
    if (total <= 20) return '2.5–3 years';
    if (total <= 30) return '3–4 years';
    return '4–5 years';
  }
  if (total <= 10) return '5–6 years';
  if (total <= 20) return '6–8 years';
  if (total <= 30) return '8–10 years';
  return '10–12 years';
}

// Ranges on purpose (Kelvin, 2026-10-21): a short check can't place a child
// to the month, so every estimate reads as a band, never a single age.
function getDomainAge(score: number, group: AgeGroup): string {
  const pick = (r: string[]) => `about ${r[score <= 2 ? 0 : score <= 4 ? 1 : score <= 6 ? 2 : score <= 8 ? 3 : 4]}`;
  if (group === 'infant') return pick(['5–7 mo', '6–9 mo', '7–10 mo', '8–11 mo', '9–12 mo']);
  if (group === 'toddler') return pick(['11–14 mo', '12–16 mo', '14–19 mo', '16–22 mo', '19–24 mo']);
  if (group === 'preschool') return pick(['1½–2½ yrs', '2–3 yrs', '2½–3½ yrs', '3–4½ yrs', '3½–5 yrs']);
  return pick(['4½–6 yrs', '5½–7½ yrs', '6½–9 yrs', '8–11 yrs', '10–12 yrs']);
}

function getLearningStage(total: number, group: AgeGroup) {
  if (group === 'infant' || group === 'toddler') {
    if (total <= 10) return { stage: 'Early Explorer',   emoji: '🌱', description: 'Beginning the sensory and social journey — building the very first foundations of learning.' };
    if (total <= 20) return { stage: 'Growing Learner',  emoji: '🌿', description: 'Actively discovering the world through touch, sight, sound, and smiles.' };
    if (total <= 30) return { stage: 'Curious Explorer', emoji: '⭐', description: 'Reaching, communicating, and playing — showing strong early development.' };
    return             { stage: 'Bright Starter',        emoji: '🌟', description: 'Excellent milestone achievement — ready to leap into the next stage.' };
  }
  if (total <= 10) return { stage: 'Early Explorer',     emoji: '🌱', description: 'Just beginning the adventure — discovering the world through senses and play.' };
  if (total <= 20) return { stage: 'Skill Builder',      emoji: '🔧', description: 'Building foundations — growing stronger in reading, writing, talking, and counting.' };
  if (total <= 30) return { stage: 'Confident Explorer', emoji: '🚀', description: 'Gaining confidence — tackling bigger challenges with curiosity and courage.' };
  return             { stage: 'Independent Thinker',     emoji: '🧠', description: 'Ready to lead — solving problems, thinking deeply, and creating new ideas.' };
}

// Stage from the developmental estimate itself (months), so the stage name
// and the activity list on /results fit the level the child is working at
// — a 3-year-old never gets "join a debate club", whatever their score.
// Each cut-off matches the activities listed for that stage in app/results.
function stageForMonths(m: number) {
  if (m < 30)  return { stage: 'Growing Learner',     emoji: '🌿', description: 'Actively discovering the world through touch, sight, sound, and smiles.' };
  if (m < 42)  return { stage: 'Early Explorer',      emoji: '🌱', description: 'Discovering the world through senses, songs, shapes and play.' };
  if (m < 54)  return { stage: 'Curious Explorer',    emoji: '⭐', description: 'Talking, counting and making things: ready for first letters and scissors.' };
  if (m < 66)  return { stage: 'Bright Starter',      emoji: '🌟', description: 'Ready for letters, names and counting games: the doorway to school skills.' };
  if (m < 84)  return { stage: 'Skill Builder',       emoji: '🔧', description: 'Building foundations — growing stronger in reading, writing, talking, and counting.' };
  if (m < 114) return { stage: 'Confident Explorer',  emoji: '🚀', description: 'Gaining confidence — tackling bigger challenges with curiosity and courage.' };
  return              { stage: 'Independent Thinker', emoji: '🧠', description: 'Ready to lead — solving problems, thinking deeply, and creating new ideas.' };
}

// Sensory pattern analysis
// Internally based on Dunn's Sensory Processing Model (published academic research)
function getSensoryPattern(scores: SensoryScores) {
  const { lowRegistration: lr, seeking: sk, sensitive: se, avoiding: av } = scores;
  const max = Math.max(lr, sk, se, av);
  if (max === 0) return { pattern: '', emoji: '', description: '' };
  // Like the Sensory Profile's "just like the majority" band: with 3
  // questions per pattern (0–6), mostly "rarely" answers (≤ 2) aren't a
  // pattern at all, so don't label the highest of four low numbers.
  if (max <= 2) return {
    pattern: 'Balanced',
    emoji: '🌈',
    description: 'Your child responds to sights, sounds, touch and movement much like most children. No sensory pattern stands out.',
  };

  // If two patterns are within 1 point of each other, show mixed
  const tied = [lr, sk, se, av].filter(v => v >= max - 1).length > 1;

  if (lr === max || (tied && lr >= max - 1 && lr >= sk && lr >= se && lr >= av)) {
    return {
      pattern: 'Low Registration',
      emoji: '😌',
      description: 'Your child may miss sensory input others notice easily. They benefit from extra cues, movement breaks, and being positioned close during learning.',
    };
  }
  if (sk === max) {
    return {
      pattern: 'Sensory Seeking',
      emoji: '🎢',
      description: 'Your child actively craves more sensory input. They thrive with movement, hands-on activities, fidget tools, and regular active breaks.',
    };
  }
  if (se === max) {
    return {
      pattern: 'Sensory Sensitive',
      emoji: '🌊',
      description: 'Your child notices sensory input easily and can become overwhelmed. They benefit from calm environments, warnings before transitions, and reduced background noise.',
    };
  }
  return {
    pattern: 'Sensory Avoiding',
    emoji: '🛡️',
    description: 'Your child actively avoids overwhelming sensory input. They benefit from predictable routines, gradual sensory exposure, and choice in textures, sounds, and activities.',
  };
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

const STORAGE_KEY = 'kailia_assessment_v1';

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(defaultState);
  // False until the first load-from-storage pass finishes — lets gates
  // like app/play/layout.tsx tell "hasn't loaded yet" apart from
  // "genuinely hasn't completed the assessment" (both look like
  // assessmentCompleted === false otherwise).
  const [loaded, setLoaded] = useState(false);

  // Remember assessment results on this device so games can adapt
  // to the child's developmental level even after a page reload. Reloads
  // whenever the active child switches, since this provider is mounted
  // once at the root layout and otherwise wouldn't notice.
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(scopedKey(STORAGE_KEY));
        setState(raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState);
      } catch { /* start fresh if the saved copy is unreadable */ }
      setLoaded(true);
    };
    load();
    window.addEventListener(ACTIVE_CHILD_CHANGED_EVENT, load);
    return () => window.removeEventListener(ACTIVE_CHILD_CHANGED_EVENT, load);
  }, []);

  useEffect(() => {
    // Guard against the real bug this used to have: on mount, this effect
    // and the load effect above both run in the same pass, in declaration
    // order — but setState from the load effect hasn't committed yet, so
    // this effect would fire first using the stale, pre-load `state`
    // (defaultState) and overwrite the real saved data with it. That
    // clobber briefly wrote assessmentCompleted:false over a real
    // completed assessment, which is what caused /play's gate to
    // intermittently bounce a child who'd already finished the assessment
    // back to /setup. Skipping the save until the load has actually
    // finished removes the window where that could happen.
    if (!loaded) return;
    try {
      // COPPA: assessment results are child data — only saved once a
      // parent has consented in the Parent Zone.
      const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
      if (!fam?.consent) return;
      localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state, loaded]);

  const setChildInfo = (name: string, age: number, ageMonths?: number) =>
    setState(s => ({ ...s, childName: name, childAge: age, childAgeMonths: ageMonths ?? null, ageGroup: deriveAgeGroup(age) }));

  const setDomainEvidence = (domain: MilestoneDomain, evidence: Evidence[]) =>
    setState(s => ({ ...s, evidence: { ...s.evidence, [domain]: evidence } }));

  const setAssessmentType = (type: 'checklist' | 'games') =>
    setState(s => ({ ...s, assessmentType: type }));

  const setDomainScore = (domain: keyof AssessmentState['scores'], score: number) =>
    setState(s => ({ ...s, scores: { ...s.scores, [domain]: score } }));

  const setSensoryScore = (pattern: keyof SensoryScores, score: number) =>
    setState(s => ({ ...s, sensoryScores: { ...s.sensoryScores, [pattern]: score } }));

  const completeSensory = () =>
    setState(s => ({ ...s, sensoryCompleted: true }));

  const completeAssessment = () =>
    setState(s => ({ ...s, assessmentCompleted: true }));

  const setFineMotorInputMethod = (method: InputMethod) =>
    setState(s => ({ ...s, fineMotorInputMethod: method }));

  const setGraspPattern = (pattern: string) =>
    setState(s => ({ ...s, graspPattern: pattern }));

  const setFineMotorSubScores = (scores: FineMotorSubScores) =>
    setState(s => ({ ...s, fineMotorSubScores: scores }));

  const resetAssessment = () => setState(defaultState);

  const totalScore = state.scores.reading + state.scores.writing + state.scores.communication + state.scores.math;
  const { pattern, emoji: sEmoji, description: sDesc } = getSensoryPattern(state.sensoryScores);

  // ── Developmental-age ranges (lib/milestones.ts) ──
  const chronoMonths = state.childAgeMonths
    ?? (state.childAge == null ? null : state.childAge < 1 ? 9 : state.childAge === 1 ? 18 : state.childAge * 12 + 6);
  const estimates: Partial<Record<MilestoneDomain, AgeEstimate>> = {};
  const pooled: Evidence[] = [];
  for (const d of MILESTONE_DOMAINS) {
    const ev = state.evidence?.[d];
    if (!ev?.length) continue;
    const est = estimateAge(ev, chronoMonths);
    if (est) estimates[d] = est;
    pooled.push(...ev);
  }
  const overall = estimateAge(pooled, chronoMonths);
  const devMonths = overall ? overall.mid : null;
  const domainRange = (d: MilestoneDomain) => {
    const est = estimates[d];
    return est ? formatAgeRange(est) : getDomainAge(state.scores[d], state.ageGroup);
  };
  const domainComparison = (d: MilestoneDomain) => {
    const est = estimates[d];
    return est ? compareToAge(est, chronoMonths) : null;
  };
  const { stage, emoji, description } = devMonths != null
    ? stageForMonths(devMonths)
    : getLearningStage(totalScore, state.ageGroup);
  const developmentalAge = overall
    ? formatAgeRange(overall).replace(/^about/, 'About')
    : `About ${getDevAge(totalScore, state.ageGroup)}`;

  return (
    <AssessmentContext.Provider value={{
      state,
      loaded,
      setChildInfo,
      setDomainEvidence,
      setAssessmentType,
      setDomainScore,
      setSensoryScore,
      completeSensory,
      completeAssessment,
      setFineMotorInputMethod,
      setGraspPattern,
      setFineMotorSubScores,
      resetAssessment,
      totalScore,
      learningStage: stage,
      stageEmoji: emoji,
      stageDescription: description,
      developmentalAge,
      domainAge: (score) => getDomainAge(score, state.ageGroup),
      chronoMonths,
      estimates,
      devMonths,
      domainRange,
      domainComparison,
      primarySensoryPattern: pattern,
      sensoryPatternEmoji: sEmoji,
      sensoryPatternDescription: sDesc,
    }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
