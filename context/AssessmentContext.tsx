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
}

const defaultState: AssessmentState = {
  childName: '',
  childAge: null,
  assessmentType: null,
  scores: { reading: 0, writing: 0, communication: 0, math: 0 },
};

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(defaultState);

  const setChildInfo = (name: string, age: number) => {
    setState(s => ({ ...s, childName: name, childAge: age }));
  };

  const setAssessmentType = (type: 'checklist' | 'games') => {
    setState(s => ({ ...s, assessmentType: type }));
  };

  const setDomainScore = (domain: keyof AssessmentState['scores'], score: number) => {
    setState(s => ({ ...s, scores: { ...s.scores, [domain]: score } }));
  };

  const resetAssessment = () => setState(defaultState);

  const totalScore =
    state.scores.reading + state.scores.writing + state.scores.communication + state.scores.math;

  const getLearningStage = (total: number) => {
    if (total <= 10) return { stage: 'Early Explorer', emoji: '🌱', description: 'Just beginning the adventure — discovering the world through senses and play.' };
    if (total <= 20) return { stage: 'Skill Builder', emoji: '🔧', description: 'Building foundations — growing stronger in reading, writing, talking, and counting.' };
    if (total <= 30) return { stage: 'Confident Explorer', emoji: '🚀', description: 'Gaining confidence — tackling bigger challenges with curiosity and courage.' };
    return { stage: 'Independent Thinker', emoji: '🧠', description: 'Ready to lead — solving problems, thinking deeply, and creating new ideas.' };
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
