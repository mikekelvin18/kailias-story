// ── The contract between the app and the game ──
// The adventure world is split in two:
//   • the game layer (components/world/) draws the place, moves Kailia and
//     the pet, runs the quest and sends plain events — it never reads or
//     writes storage and never decides what an action "means"
//   • the app layer (app/play/garden + lib/world/) hands the game a pet, a
//     saved progress and the task demands, and turns the events into saved
//     progress, starlight and numbers-only observations
// These types are the only thing both sides share.

import type { QuestProgress, StepId } from './quest';

export type Via = 'drag' | 'tap';

export type WorldEvent =
  /** the pet has told its problem and the child said "let's help" */
  | { type: 'intro-done' }
  /** the watering can was let go; onTarget = over the sunflower */
  | { type: 'can-drop'; onTarget: boolean; via: Via }
  /** the can was held over the sunflower long enough */
  | { type: 'flower-watered'; via: Via }
  /** a stepping stone was let go; placed = it snapped into a gap */
  | { type: 'stone-drop'; placed: boolean; via: Via }
  /** a bush was searched */
  | { type: 'bush-search'; found: boolean }
  /** the game offered extra help on a step (level 1 = Noel's reminder, 2 = the pet shows) */
  | { type: 'hint'; step: StepId; level: 1 | 2 }
  /** the star ball was handed back to the pet */
  | { type: 'ball-given'; via: Via }
  /** the ball was let go somewhere other than the pet */
  | { type: 'give-miss' }
  /** an optional discovery */
  | { type: 'ladybug'; id: string }
  | { type: 'explore'; thing: string }
  | { type: 'fetch' }
  /** progress changed: the app saves this snapshot */
  | { type: 'progress'; quest: QuestProgress; ladybugs: string[] }
  /** a step started or finished (the observer times steps with these) */
  | { type: 'step-start'; step: StepId }
  | { type: 'step-complete'; step: StepId }
  | { type: 'quest-complete' };

/** How demanding each activity is. Picked by the app (lib/world/demands.ts). */
export interface Demands {
  /** 'easier' | 'just right' | 'harder', for display only */
  label: string;
  /** numeric level 1–3, recorded with every observation */
  level: 1 | 2 | 3;
  /** stepping stones needed for the bridge */
  stones: 2 | 3 | 4;
  /** how close (world px) a stone or the can must be to count as placed */
  snap: number;
  /** how long the can must be held over the flower */
  holdMs: number;
  /** hiding spots in the back garden */
  spots: number;
  /** how much of the ball peeks out of its bush, 0–1 */
  peek: number;
  /** searches that miss before the pet shows where to look */
  hintAfter: number;
  /** seconds of no progress before Noel repeats the step */
  remindAfterS: number;
  /** let a tap move things instead of dragging */
  tapToMove: boolean;
}

export interface PetInfo {
  name: string;
  art: string;
  kind: string;
}
