'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type AgeGroup = 'infant' | 'toddler' | 'preschool' | 'schoolAge' | null;

export interface AssessmentState {
  childName: string;
  childAge: number | null;       // 0.5 = 6-11mo, 1 = 12-23mo, 2-12 = years
  ageGroup: AgeGroup;
  assessmentType: 'checklist' | 'games' | null;
  scores: {
    reading: number;
    writing: number;
    communication: number;
    math: number;
  };
}

interface AssessmentContextType {
  state: AssessmentState;
  setChildInfo: (name: string, age: number) => void;
  setAssessmentType: (type: 'checklist' | 'games') => void;
  setDomainScore: (domain: keyof AssessmentState['scores'], score: number) => void;
  resetAssessment: () => void;
  totalScore: number;
  learningStage: string;
  stageEmoji: string;
  stageDescription: string;
  developmentalAge: string;
  domainAge: (score: number) => string;
}

const defaultState: AssessmentState = {
  childName: '',
  childAge: null,
  ageGroup: null,
  assessmentType: null,
  scores: { reading: 0, writing: 0, communication: 0, math: 0 },
};

function deriveAgeGroup(age: number): AgeGroup {
  if (age === 0.5) return 'infant';
  if (age === 1)   return 'toddler';
  if (age <= 4)    return 'preschool';
  return 'schoolAge';
}

// Overall developmental age label from total score (0–40), adjusted per age group
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
  // schoolAge
  if (total <= 10) return '5–6 years';
  if (total <= 20) return '6–8 years';
  if (total <= 30) return '8–10 years';
  return '10–12 years';
}

// Per-domain age badge, calibrated to age group
function getDomainAge(score: number, group: AgeGroup): string {
  if (group === 'infant') {
    if (score <= 2)  return '~6 mo';
    if (score <= 4)  return '~7–8 mo';
    if (score <= 6)  return '~8–9 mo';
    if (score <= 8)  return '~9–10 mo';
    return '~10–11 mo';
  }
  if (group === 'toddler') {
    if (score <= 2)  return '~12 mo';
    if (score <= 4)  return '~13–15 mo';
    if (score <= 6)  return '~15–18 mo';
    if (score <= 8)  return '~18–21 mo';
    return '~21–23 mo';
  }
  if (group === 'preschool') {
    if (score <= 2)  return '~2 yrs';
    if (score <= 4)  return '~2.5 yrs';
    if (score <= 6)  return '~3 yrs';
    if (score <= 8)  return '~3.5–4 yrs';
    return '~4–5 yrs';
  }
  // schoolAge
  if (score <= 2)  return '~5–6 yrs';
  if (score <= 4)  return '~6–7 yrs';
  if (score <= 6)  return '~7–9 yrs';
  if (score <= 8)  return '~9–11 yrs';
  return '~11–12 yrs';
}

function getLearningStage(total: number, group: AgeGroup) {
  if (group === 'infant') {
    if (total <= 10) return { stage: 'Early Explorer',     emoji: '🌱', description: 'Beginning the sensory and social journey — building the very first foundations of learning.' };
    if (total <= 20) return { stage: 'Growing Learner',    emoji: '🌿', description: 'Actively discovering the world through touch, sight, sound, and smiles.' };
    if (total <= 30) return { stage: 'Curious Explorer',   emoji: '⭐', description: 'Reaching, grasping, and communicating — showing strong early development.' };
    return             { stage: 'Bright Starter',          emoji: '🌟', description: 'Demonstrating excellent early milestone achievement — ready to move into toddlerhood.' };
  }
  if (group === 'toddler') {
    if (total <= 10) return { stage: 'Early Explorer',     emoji: '🌱', description: 'Beginning to communicate and explore — first words and first steps are on the way!' };
    if (total <= 20) return { stage: 'Growing Learner',    emoji: '🌿', description: 'Building words, movements, and curiosity — the world is opening up fast.' };
    if (total <= 30) return { stage: 'Curious Explorer',   emoji: '⭐', description: 'Talking, pointing, and playing with purpose — strong toddler development.' };
    return             { stage: 'Bright Starter',          emoji: '🌟', description: 'Excellent toddler milestone achievement — thriving across all areas.' };
  }
  // preschool + schoolAge share these stages
  if (total <= 10) return { stage: 'Early Explorer',       emoji: '🌱', description: 'Just beginning the adventure — discovering the world through senses and play.' };
  if (total <= 20) return { stage: 'Skill Builder',        emoji: '🔧', description: 'Building foundations — growing stronger in reading, writing, talking, and counting.' };
  if (total <= 30) return { stage: 'Confident Explorer',   emoji: '🚀', description: 'Gaining confidence — tackling bigger challenges with curiosity and courage.' };
  return             { stage: 'Independent Thinker',       emoji: '🧠', description: 'Ready to lead — solving problems, thinking deeply, and creating new ideas.' };
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(defaultState);

  const setChildInfo = (name: string, age: number) =>
    setState(s => ({ ...s, childName: name, childAge: age, ageGroup: deriveAgeGroup(age) }));

  const setAssessmentType = (type: 'checklist' | 'games') =>
    setState(s => ({ ...s, assessmentType: type }));

  const setDomainScore = (domain: keyof AssessmentState['scores'], score: number) =>
    setState(s => ({ ...s, scores: { ...s.scores, [domain]: score } }));

  const resetAssessment = () => setState(defaultState);

  const totalScore =
    state.scores.reading + state.scores.writing + state.scores.communication + state.scores.math;

  const { stage, emoji, description } = getLearningStage(totalScore, state.ageGroup);

  return (
    <AssessmentContext.Provider value={{
      state,
      setChildInfo,
      setAssessmentType,
      setDomainScore,
      resetAssessment,
      totalScore,
      learningStage: stage,
      stageEmoji: emoji,
      stageDescription: description,
      developmentalAge: getDevAge(totalScore, state.ageGroup),
      domainAge: (score) => getDomainAge(score, state.ageGroup),
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
