'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface AssessmentState {
  childName: string;
  childAge: number | null;
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
  developmentalAge: string;       // overall estimated developmental age range
  domainAge: (score: number) => string; // per-domain estimated age range
}

const defaultState: AssessmentState = {
  childName: '',
  childAge: null,
  assessmentType: null,
  scores: { reading: 0, writing: 0, communication: 0, math: 0 },
};

const AssessmentContext = createContext<AssessmentContextType | null>(null);

// Overall developmental age based on total score (0–40)
// Mapped from the RTF spec learning stages → CDC/ASQ age equivalents
function getDevAge(total: number): string {
  if (total <= 10) return '2–4 years';
  if (total <= 20) return '5–7 years';
  if (total <= 30) return '8–10 years';
  return '11–12 years';
}

// Per-domain developmental age based on domain score (0–10)
// Each domain has 5 questions scaled from ~age 2 (Q1) to ~age 12 (Q5)
function getDomainAge(score: number): string {
  if (score <= 2)  return '~2–3 yrs';
  if (score <= 4)  return '~3–5 yrs';
  if (score <= 6)  return '~5–7 yrs';
  if (score <= 8)  return '~7–10 yrs';
  return '~10–12 yrs';
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(defaultState);

  const setChildInfo = (name: string, age: number) =>
    setState(s => ({ ...s, childName: name, childAge: age }));

  const setAssessmentType = (type: 'checklist' | 'games') =>
    setState(s => ({ ...s, assessmentType: type }));

  const setDomainScore = (domain: keyof AssessmentState['scores'], score: number) =>
    setState(s => ({ ...s, scores: { ...s.scores, [domain]: score } }));

  const resetAssessment = () => setState(defaultState);

  const totalScore =
    state.scores.reading + state.scores.writing + state.scores.communication + state.scores.math;

  const getLearningStage = (total: number) => {
    if (total <= 10) return { stage: 'Early Explorer',       emoji: '🌱', description: 'Just beginning the adventure — discovering the world through senses and play.' };
    if (total <= 20) return { stage: 'Skill Builder',        emoji: '🔧', description: 'Building foundations — growing stronger in reading, writing, talking, and counting.' };
    if (total <= 30) return { stage: 'Confident Explorer',   emoji: '🚀', description: 'Gaining confidence — tackling bigger challenges with curiosity and courage.' };
    return             { stage: 'Independent Thinker',       emoji: '🧠', description: 'Ready to lead — solving problems, thinking deeply, and creating new ideas.' };
  };

  const { stage, emoji, description } = getLearningStage(totalScore);

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
      developmentalAge: getDevAge(totalScore),
      domainAge: getDomainAge,
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
