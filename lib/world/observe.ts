// ── Quiet observations from the adventure world ──
// Turns the game's events into plain numbers per finished step and hands
// them to the existing consent-gated measurement log (lib/metrics.ts).
// What it records is what happened (tries, misses, seconds, hints, which
// input was used, the demand level), never what it means: no ages, no
// scores, no pass or fail. Interpreting observations belongs to the
// grown-ups' screens and to people, not to the game.

import { logQuestMetric } from '@/lib/metrics';
import type { Demands, WorldEvent } from './events';
import { OT_ACTIVITIES } from './otActivities';
import type { QuestDef, StepId } from './quest';

interface StepTally { startedAt: number; tries: number; misses: number; hints: number; tapped: number }

export function createObserver(def: QuestDef) {
  const steps = new Map<StepId, StepTally>();
  let questStart = 0;
  let remindersTotal = 0;
  let current: StepId | null = null;

  const tally = () => (current ? steps.get(current) : undefined);

  /** d = the demands in force when the event happened */
  return function observe(e: WorldEvent, d: Demands) {
    const t = tally();
    switch (e.type) {
      case 'step-start':
        if (!questStart) questStart = Date.now();
        current = e.step;
        steps.set(e.step, { startedAt: Date.now(), tries: 0, misses: 0, hints: 0, tapped: 0 });
        break;
      case 'can-drop':
      case 'stone-drop':
        if (!t) break;
        t.tries++;
        if (!('placed' in e ? e.placed : e.onTarget)) t.misses++;
        if (e.via === 'tap') t.tapped++;
        break;
      case 'bush-search':
        if (t) { t.tries++; if (!e.found) t.misses++; }
        break;
      case 'give-miss':
        if (t) { t.tries++; t.misses++; }
        break;
      case 'ball-given':
        if (t) { t.tries++; if (e.via === 'tap') t.tapped++; }
        break;
      case 'flower-watered':
        // watered while still hovering: that one carry counts as the try
        if (t && !t.tries) t.tries = 1;
        if (t && e.via === 'tap') t.tapped++;
        break;
      case 'hint':
        if (t) t.hints++;
        remindersTotal++;
        break;
      case 'step-complete': {
        const s = steps.get(e.step);
        const stepDef = def.steps.find(x => x.id === e.step);
        const act = stepDef?.activity ? OT_ACTIVITIES[stepDef.activity] : null;
        if (s && act) {
          logQuestMetric(act.domain, `world-${act.id}`, {
            level: d.level,
            tries: s.tries,
            misses: s.misses,
            hints: s.hints,
            tapped: s.tapped,
            seconds: Math.round((Date.now() - s.startedAt) / 1000),
          });
        }
        break;
      }
      case 'quest-complete':
        logQuestMetric(OT_ACTIVITIES['garden-sequence'].domain, `world-${def.id}`, {
          level: d.level,
          steps: def.steps.length,
          reminders: remindersTotal,
          minutes: questStart ? Math.round((Date.now() - questStart) / 6000) / 10 : 0,
        });
        break;
    }
  };
}
