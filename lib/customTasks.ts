// ── Custom Quests ──
// Lets a parent add their own practice goals (an IEP/OT goal, "practice
// saying thank you," "practice tying shoes," anything specific to their
// child) and have Noel weave them into the daily quest screen alongside
// the built-in Parent & Baby Quest Library — same report flow (Did it /
// Tried with help / Not yet), same measurement shape.
//
// The parent types the text, never the child (COPPA: children never
// enter personal info). Only completion scores are logged to metrics —
// the free-text goal itself never reaches lib/metrics.ts.

import { scopedKey } from './family';
import type { ActivityDomain, ParentActivity } from './activities';
import { DOMAIN_META } from './activities';

export interface CustomTask {
  id: string;
  text: string;        // the parent's own words, e.g. "Practice saying thank you"
  domain: ActivityDomain;
  createdAt: string;
}

const KEY = 'kailia_custom_tasks_v1';

export function loadCustomTasks(): CustomTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(scopedKey(KEY));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(tasks: CustomTask[]) {
  try {
    const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
    if (!fam?.consent) return; // COPPA: no consent, no saving
    localStorage.setItem(scopedKey(KEY), JSON.stringify(tasks));
  } catch { /* ignore */ }
}

export function addCustomTask(text: string, domain: ActivityDomain): CustomTask[] {
  const tasks = loadCustomTasks();
  const task: CustomTask = { id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: text.trim(), domain, createdAt: new Date().toISOString() };
  const next = [...tasks, task];
  save(next);
  return next;
}

export function removeCustomTask(id: string): CustomTask[] {
  const next = loadCustomTasks().filter(t => t.id !== id);
  save(next);
  return next;
}

// Adapts a CustomTask into the same shape as a library ParentActivity, so
// it can reuse ActivityCard and reportActivity/streak tracking as-is.
export function customTaskAsActivity(task: CustomTask): ParentActivity {
  return {
    id: task.id,
    band: 3, // custom tasks aren't band-gated; feed the daily-report system at any band
    domain: task.domain,
    emoji: DOMAIN_META[task.domain].emoji,
    title: task.text,
    noel: `${DOMAIN_META[task.domain].emoji} A special quest from your grown-up!`,
    materials: 'Whatever your grown-up has ready',
    steps: [task.text],
    watchFor: 'However your grown-up wants to track this one.',
    minutes: 3,
  };
}
