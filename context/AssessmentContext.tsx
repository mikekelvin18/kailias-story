'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  ageGroup: AgeGroup;
  assessmentType: 'checklist' | 'games' | null;
  scores: { reading: number; writing: number; communication: number; math: number };
  sensoryScores: SensoryScores;
  sensoryCompleted: boolean;
  fineMotorInputMethod: InputMethod;
  graspPattern: string | null;
  fineMotorSubScores: FineMotorSubScores | null;
}

interface AssessmentContextType {
  state: AssessmentState;
  setChildInfo: (name: string, age: number) => void;
  setAssessmentType: (type: 'checklist' | 'games') => void;
  setDomainScore: (domain: keyof AssessmentState['scores'], score: number) => void;
  setSensoryScore: (pattern: keyof SensoryScores, score: number) => void;
  completeSensory: () => void;
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
  primarySensoryPattern: string;
  sensoryPatternEmoji: string;
  sensoryPatternDescription: string;
}

const defaultState: AssessmentState = {
  childName: '',
  childAge: null,
  ageGroup: null,
  assessmentType: null,
  scores: { reading: 0, writing: 0, communication: 0, math: 0 },
  sensoryScores: { lowRegistration: 0, seeking: 0, sensitive: 0, avoiding: 0 },
  sensoryCompleted: false,
  fineMotorInputMethod: null,
  graspPattern: null,
  fineMotorSubScores: null,
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

function getDomainAge(score: number, group: AgeGroup): string {
  if (group === 'infant') {
    if (score <= 2) return '~6 mo';
    if (score <= 4) return '~7–8 mo';
    if (score <= 6) return '~8–9 mo';
    if (score <= 8) return '~9–10 mo';
    return '~10–11 mo';
  }
  if (group === 'toddler') {
    if (score <= 2) return '~12 mo';
    if (score <= 4) return '~13–15 mo';
    if (score <= 6) return '~15–18 mo';
    if (score <= 8) return '~18–21 mo';
    return '~21–23 mo';
  }
  if (group === 'preschool') {
    if (score <= 2) return '~2 yrs';
    if (score <= 4) return '~2.5 yrs';
    if (score <= 6) return '~3 yrs';
    if (score <= 8) return '~3.5–4 yrs';
    return '~4–5 yrs';
  }
  if (score <= 2) return '~5–6 yrs';
  if (score <= 4) return '~6–7 yrs';
  if (score <= 6) return '~7–9 yrs';
  if (score <= 8) return '~9–11 yrs';
  return '~11–12 yrs';
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

// Sensory pattern analysis
// Internally based on Dunn's Sensory Processing Model (published academic research)
function getSensoryPattern(scores: SensoryScores) {
  const { lowRegistration: lr, seeking: sk, sensitive: se, avoiding: av } = scores;
  const max = Math.max(lr, sk, se, av);
  if (max === 0) return { pattern: '', emoji: '', description: '' };

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

  // Remember assessment results on this device so games can adapt
  // to the child's developmental level even after a page reload.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch { /* start fresh if the saved copy is unreadable */ }
  }, []);

  useEffect(() => {
    try {
      // COPPA: assessment results are child data — only saved once a
      // parent has consented in the Parent Zone.
      const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
      if (!fam?.consent) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state]);

  const setChildInfo = (name: string, age: number) =>
    setState(s => ({ ...s, childName: name, childAge: age, ageGroup: deriveAgeGroup(age) }));

  const setAssessmentType = (type: 'checklist' | 'games') =>
    setState(s => ({ ...s, assessmentType: type }));

  const setDomainScore = (domain: keyof AssessmentState['scores'], score: number) =>
    setState(s => ({ ...s, scores: { ...s.scores, [domain]: score } }));

  const setSensoryScore = (pattern: keyof SensoryScores, score: number) =>
    setState(s => ({ ...s, sensoryScores: { ...s.sensoryScores, [pattern]: score } }));

  const completeSensory = () =>
    setState(s => ({ ...s, sensoryCompleted: true }));

  const setFineMotorInputMethod = (method: InputMethod) =>
    setState(s => ({ ...s, fineMotorInputMethod: method }));

  const setGraspPattern = (pattern: string) =>
    setState(s => ({ ...s, graspPattern: pattern }));

  const setFineMotorSubScores = (scores: FineMotorSubScores) =>
    setState(s => ({ ...s, fineMotorSubScores: scores }));

  const resetAssessment = () => setState(defaultState);

  const totalScore = state.scores.reading + state.scores.writing + state.scores.communication + state.scores.math;
  const { stage, emoji, description } = getLearningStage(totalScore, state.ageGroup);
  const { pattern, emoji: sEmoji, description: sDesc } = getSensoryPattern(state.sensoryScores);

  return (
    <AssessmentContext.Provider value={{
      state,
      setChildInfo,
      setAssessmentType,
      setDomainScore,
      setSensoryScore,
      completeSensory,
      setFineMotorInputMethod,
      setGraspPattern,
      setFineMotorSubScores,
      resetAssessment,
      totalScore,
      learningStage: stage,
      stageEmoji: emoji,
      stageDescription: description,
      developmentalAge: getDevAge(totalScore, state.ageGroup),
      domainAge: (score) => getDomainAge(score, state.ageGroup),
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
