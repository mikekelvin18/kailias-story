// ── Quests as data ──
// A quest is a list of steps. Each step names what the child sees (a short
// objective), what Noel or the pet says when it starts and when the child
// seems stuck, which OT activity it belongs to, and which game event
// finishes it. advanceQuest() is the whole engine: it takes the progress
// and one event and returns the new progress. Places (components/world/)
// decide what is on screen from the progress; they never hardcode order.
//
// A new story = a new QuestDef plus the place's objects that send its
// events. No new engine.

import type { Demands, WorldEvent } from './events';
import type { OtActivityId } from './otActivities';

export type StepId = string;
type Who = 'noel' | 'pet';

export interface QuestStep {
  id: StepId;
  /** kid-facing objective, two to four words, shown in the pill */
  objective: string;
  /** said when the step starts; {pet} becomes the pet's name */
  intro: { who: Who; line: string };
  /** said when the child has been idle a while on this step */
  remind: { who: Who; line: string };
  activity: OtActivityId | null;
  /** the event that counts toward finishing the step */
  completeOn: WorldEvent['type'];
  /** only events that pass this count (e.g. a stone that really landed) */
  counts?: (e: WorldEvent) => boolean;
  /** how many counted events finish the step (default 1) */
  need?: (d: Demands) => number;
  /** steps that must be done first (default: every earlier step) */
  requires?: StepId[];
}

export interface QuestDef {
  id: string;
  title: string;
  steps: QuestStep[];
  reward: { starlight: number; replayStarlight: number; sticker: string };
}

export interface QuestProgress {
  questId: string;
  done: StepId[];
  /** counted events toward the current multi-part step (stones placed) */
  counts: Record<StepId, number>;
  complete: boolean;
}

export function freshProgress(def: QuestDef): QuestProgress {
  return { questId: def.id, done: [], counts: {}, complete: false };
}

export function stepReady(def: QuestDef, p: QuestProgress, step: QuestStep): boolean {
  const i = def.steps.indexOf(step);
  const reqs = step.requires ?? def.steps.slice(0, i).map(s => s.id);
  return reqs.every(r => p.done.includes(r));
}

/** the step the child is on, or null when the quest is complete */
export function currentStep(def: QuestDef, p: QuestProgress): QuestStep | null {
  return def.steps.find(s => !p.done.includes(s.id) && stepReady(def, p, s)) ?? null;
}

export function isDone(p: QuestProgress, step: StepId) {
  return p.done.includes(step);
}

/**
 * Feed one game event to the quest. Returns the same object when nothing
 * changed, so callers can compare by reference.
 */
export function advanceQuest(def: QuestDef, p: QuestProgress, e: WorldEvent, d: Demands): QuestProgress {
  const step = currentStep(def, p);
  if (!step || e.type !== step.completeOn) return p;
  if (step.counts && !step.counts(e)) return p;
  const n = (p.counts[step.id] ?? 0) + 1;
  const need = step.need?.(d) ?? 1;
  const counts = { ...p.counts, [step.id]: n };
  if (n < need) return { ...p, counts };
  const done = [...p.done, step.id];
  return { ...p, counts, done, complete: def.steps.every(s => done.includes(s.id)) };
}

// ── The first quest: The Lost Star Ball (Kailia's Garden) ──
export const LOST_STAR_BALL: QuestDef = {
  id: 'lost-star-ball',
  title: 'The Lost Star Ball',
  reward: { starlight: 25, replayStarlight: 10, sticker: 'star-ball' },
  steps: [
    {
      id: 'notice',
      objective: 'Help {pet}',
      intro: { who: 'pet', line: 'Oh no! My star ball is gone!' },
      remind: { who: 'noel', line: '{pet} looks sad. Tap {pet} to help!' },
      activity: null,
      completeOn: 'intro-done',
    },
    {
      id: 'water',
      objective: 'Water Sunny',
      intro: { who: 'noel', line: 'Sunny the sunflower sees everything. But she is thirsty! Carry the watering can to her.' },
      remind: { who: 'noel', line: 'Slide the watering can to Sunny and hold it there.' },
      activity: 'garden-water',
      completeOn: 'flower-watered',
    },
    {
      id: 'bridge',
      objective: 'Build a bridge',
      intro: { who: 'noel', line: 'Sunny points across the stream! Let\'s make a stepping-stone bridge.' },
      remind: { who: 'noel', line: 'Slide a stone into a glowing spot in the water.' },
      activity: 'garden-bridge',
      completeOn: 'stone-drop',
      counts: e => e.type === 'stone-drop' && e.placed,
      need: d => d.stones,
    },
    {
      id: 'search',
      objective: 'Find the star ball',
      intro: { who: 'pet', line: 'I smell it! It\'s hiding in a bush somewhere.' },
      remind: { who: 'noel', line: 'Tap the bushes to look inside. Look for a little sparkle!' },
      activity: 'garden-search',
      completeOn: 'bush-search',
      counts: e => e.type === 'bush-search' && e.found,
    },
    {
      id: 'give',
      objective: 'Give it back',
      intro: { who: 'noel', line: 'You found it! Slide the star ball to {pet}.' },
      remind: { who: 'noel', line: 'Slide the star ball over to {pet}.' },
      activity: 'garden-give',
      completeOn: 'ball-given',
    },
  ],
};
