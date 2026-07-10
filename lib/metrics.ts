// ── Quiet measurement log ──
// Games emit metric events here; scoring/dashboard code reads them later.
// Nothing in this file is ever shown to the child.

export interface QuestMetric {
  domain: string;              // e.g. 'fine motor'
  taskId: string;              // e.g. 'firefly-catch'
  ts: number;                  // when it was recorded
  data: Record<string, number>;
}

const KEY = 'kailia_quest_metrics_v1';
const MAX_EVENTS = 500; // keep the log from growing forever

export function logQuestMetric(domain: string, taskId: string, data: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    const list: QuestMetric[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    list.push({ domain, taskId, ts: Date.now(), data });
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_EVENTS)));
  } catch { /* measurement must never break play */ }
}

export function getQuestMetrics(): QuestMetric[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
