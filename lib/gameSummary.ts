// ── Games played, for the grown-ups' progress report ──
// Rolls the quiet game log (lib/metrics.ts) up into one plain line per
// game: how many times it was finished, the highest level reached and
// when it was last played. Numbers only, read from this device.

import { getQuestMetrics, type QuestMetric } from './metrics';
import { LANDS, BONUS_LANDS } from './adventure';

export interface GameSummary {
  id: string;
  title: string;
  domain: string;
  finished: number;
  highestLevel: number;
  lastPlayed: number;
}

// task ids that are one step inside a bigger game (a single riddle on a
// walk, one mailbag of Sky Mail) roll up into that game
function baseId(taskId: string): string {
  for (const g of ['sky-mail', 'journey', 'trail-walk']) if (taskId.startsWith(`${g}-`)) return g;
  return taskId;
}
// sub-steps that are logged on top of the game's own finish entry, so
// they must not be counted as extra plays
function isSubStep(taskId: string): boolean {
  return taskId.startsWith('journey-') || taskId.startsWith('trail-walk-');
}

const HREF_OF: Record<string, string> = { 'word-wizard': '/play/reading', 'sense-explorer': '/play/sensory' };

function titleOf(id: string): string {
  const href = HREF_OF[id] ?? `/play/${id}`;
  for (const land of [...LANDS, ...BONUS_LANDS]) {
    const q = land.quests.find(x => x.href === href);
    if (q) return q.title;
  }
  return id.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}

export function gameSummaries(list: QuestMetric[] = getQuestMetrics()): GameSummary[] {
  const by = new Map<string, GameSummary>();
  for (const m of list) {
    const id = baseId(m.taskId);
    const row = by.get(id) ?? { id, title: titleOf(id), domain: m.domain, finished: 0, highestLevel: 0, lastPlayed: 0 };
    if (!isSubStep(m.taskId)) row.finished += 1;
    const lvl = Number(m.data.level);
    if (Number.isFinite(lvl)) row.highestLevel = Math.max(row.highestLevel, lvl);
    row.lastPlayed = Math.max(row.lastPlayed, m.ts);
    by.set(id, row);
  }
  return [...by.values()].filter(r => r.finished > 0).sort((a, b) => b.lastPlayed - a.lastPlayed);
}
