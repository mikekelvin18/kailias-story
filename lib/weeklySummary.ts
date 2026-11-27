// ── This week, in plain words (grown-ups only) ──
// A gentle weekly recap for the Family page: "This week Robin practiced
// counting 4 times!" Built ONLY from what is already on this device (the
// quest log, together-quest taps and the care pet's days). Nothing is
// sent anywhere, nothing new is stored, and there are no scores: just
// counts of practice, so it celebrates effort.

import { getQuestMetrics } from './metrics';
import { allReportEntries } from './activities';
import { loadPet } from './kailiaPet';
import { activeChild, loadFamily } from './family';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// what each skill area is, in a parent's words
export const AREA_WORDS: Record<string, string> = {
  'fine motor': 'using their hands',
  math: 'counting',
  reading: 'letters and words',
  communication: 'talking and stories',
  sensory: 'listening and looking',
  processing: 'memory and thinking',
};

export interface WeekLine { area: string; words: string; times: number }

export interface WeekSummary {
  lines: WeekLine[];          // most practiced first
  togetherQuests: number;     // Parent & Baby / together quests reported done or tried
  petDays: number;            // days the care pet got its daily task this week (0–7)
  total: number;
}

function dateDaysAgo(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function weekSummary(now = Date.now()): WeekSummary {
  const childId = activeChild(loadFamily())?.id;
  const counts: Record<string, number> = {};
  for (const m of getQuestMetrics()) {
    if (now - m.ts > WEEK_MS) continue;
    if (childId && m.childId && m.childId !== childId) continue;
    counts[m.domain] = (counts[m.domain] ?? 0) + 1;
  }
  const since = dateDaysAgo(6);
  let togetherQuests = 0;
  for (const r of allReportEntries()) {
    if (r.date < since) continue;
    if (r.score === 0) continue;   // "not yet" isn't counted as practice
    togetherQuests++;
    counts[r.domain] = (counts[r.domain] ?? 0) + 1;
  }
  const pet = loadPet();
  const petDays = pet ? new Set(pet.history.filter(h => h.day >= since).map(h => h.day)).size : 0;

  const lines = Object.entries(counts)
    .filter(([area]) => AREA_WORDS[area])
    .map(([area, times]) => ({ area, words: AREA_WORDS[area], times }))
    .sort((a, b) => b.times - a.times);
  return { lines, togetherQuests, petDays, total: lines.reduce((s, l) => s + l.times, 0) };
}
