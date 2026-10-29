// ── Kailia's adapter for the care pet ──
// Connects the app-neutral engine (lib/carepet/engine.ts) to Kailia:
//   • saving: one consent-gated, per-child record (kailia_pet_v1, listed
//     in CHILD_DATA_KEYS so parental deletion wipes it)
//   • starting difficulty: from the assessment (band / tier)
//   • activities: Feed = a tracing shape; Play and Care = Parent & Baby
//     Quest Library cards at steps 1–3, pet cards (lib/petTasks.ts) at 4–6
//   • measurement: each finished task logs one number-only metric
//   • free days: the engine's trial, unlocked by lib/premium.ts

import {
  CarePetState, Need, Outcome, createPet, isPetState, visit, completeToday, greetingFor,
  isLocked, markAutoOpened, DEFAULT_CONFIG,
} from './carepet/engine';
import { scopedKey } from './family';
import { logQuestMetric } from './metrics';
import { isPremium } from './premium';
import { ACTIVITIES, ParentActivity, reportActivity, ReportScore } from './activities';
import { PET_CARDS, PetCard } from './petTasks';
import { developmentalBand, difficultyTier } from './difficulty';
import type { AgeGroup } from '@/context/AssessmentContext';
import type { ShapeKind } from './traceShapes';

const KEY = 'kailia_pet_v1';
export const PET_CONFIG = DEFAULT_CONFIG;

function consented(): boolean {
  try { return !!JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null')?.consent; }
  catch { return false; }
}

export function loadPet(): CarePetState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = JSON.parse(localStorage.getItem(scopedKey(KEY)) ?? 'null');
    return isPetState(raw) ? raw : null;
  } catch { return null; }
}

export function savePet(s: CarePetState) {
  if (!consented()) return; // COPPA: no consent → nothing recorded
  try { localStorage.setItem(scopedKey(KEY), JSON.stringify(s)); } catch { /* ignore */ }
}

// Band 1–3 start at steps 1–3; school age starts at 4 (or 5 if confident).
export function startStep(ageGroup: AgeGroup, totalScore: number): number {
  const band = developmentalBand(ageGroup, totalScore);
  if (band !== null) return band;
  return difficultyTier(ageGroup, totalScore) === 'big' ? 5 : 4;
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Loads (or hatches a fresh record for) the active child and rolls the day
// over. Returns null when no parent consent exists, so nothing can grow
// that would then vanish on reload.
export function openPet(ageGroup: AgeGroup, totalScore: number) {
  if (!consented()) return null;
  const day = today();
  const existing = loadPet();
  const base = existing ?? createPet(startStep(ageGroup, totalScore), day, PET_CONFIG);
  const { state } = visit(base, day, PET_CONFIG);
  savePet(state);
  return { state, greeting: greetingFor(state, day) };
}

export function noteAutoOpened(s: CarePetState): CarePetState {
  const next = markAutoOpened(s, today());
  savePet(next);
  return next;
}

export function petLocked(s: CarePetState): boolean {
  return isLocked(s, today(), isPremium(), PET_CONFIG);
}

// ── Today's activity ──

export interface FeedTask { kind: 'feed'; step: number; shape: ShapeKind; food: string; tolerance: number }
export interface CardTask { kind: 'play' | 'care'; step: number; ask: string; title?: string; steps?: string[]; tip: string; activity?: ParentActivity; card?: PetCard }
export type PetTask = FeedTask | CardTask;

// Each step is a harder shape with a tighter path (tolerance in px, for a
// tracing box about 280–320px across). Always the full glowing guide:
// the pet never asks a child to trace from memory against a clock.
const FEED_STEPS: { shape: ShapeKind; food: string; tolerance: number }[] = [
  { shape: 'line',   food: 'a long noodle',     tolerance: 42 },
  { shape: 'circle', food: 'a round cookie',    tolerance: 38 },
  { shape: 'wave',   food: 'wiggly spaghetti',  tolerance: 34 },
  { shape: 'zigzag', food: 'a crunchy pretzel', tolerance: 30 },
  { shape: 'star',   food: 'a star cookie',     tolerance: 27 },
  { shape: 'spiral', food: 'a cinnamon roll',   tolerance: 24 },
];

function pick<T>(list: T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return list[(h >>> 0) % list.length];
}

export function taskFor(need: Need, step: number, day: string = today()): PetTask {
  if (need === 'feed') {
    const f = FEED_STEPS[Math.min(FEED_STEPS.length, Math.max(1, step)) - 1];
    return { kind: 'feed', step, ...f };
  }
  if (step <= 3) {
    const domain = need === 'play' ? 'sensory' : 'communication';
    const pool = ACTIVITIES.filter(a => a.band === step && a.domain === domain);
    const a = pick(pool, `${day}-${need}`);
    return { kind: need, step, ask: a.noel, title: a.title, steps: a.steps, tip: a.watchFor, activity: a };
  }
  const exact = PET_CARDS.filter(c => c.need === need && c.step === step);
  const c = pick(exact.length ? exact : PET_CARDS.filter(x => x.need === need), `${day}-${need}`);
  return { kind: need, step, ask: c.ask, tip: c.tip, card: c };
}

// ── Finishing ──

const DOMAIN: Record<Need, string> = { feed: 'fine motor', play: 'sensory', care: 'communication' };

export function finishToday(s: CarePetState, task: PetTask, outcome: Outcome, extra: Record<string, number> = {}) {
  const r = completeToday(s, today(), outcome, PET_CONFIG);
  if (r.state === s) return r;
  savePet(r.state);
  const score = outcome === 'win' ? 2 : outcome === 'help' ? 1 : 0;
  if (task.kind !== 'feed' && task.activity) {
    // also counts in the Quest Library's reports (and logs its metric)
    reportActivity(task.activity, score as ReportScore);
  }
  logQuestMetric(DOMAIN[task.kind], `pet-${task.kind}`, { step: task.step, score, stepChange: r.stepChange, ...extra });
  return r;
}
