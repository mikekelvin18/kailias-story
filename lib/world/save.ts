// ── Saved progress in the adventure world ──
// One key per child (scopedKey), consent-gated like every other child-data
// store, and listed in CHILD_DATA_KEYS so "delete child" and "delete
// everything" wipe it. Holds quest steps, found discoveries, stickers and
// the grown-up settings. Numbers and fixed ids only, never free text.

import { scopedKey, hasActiveConsent } from '@/lib/family';
import { DEFAULT_GROWN_UP, type GrownUpSettings } from './demands';
import type { QuestProgress } from './quest';

export const WORLD_KEY = 'kailia_world_v1';

export interface WorldSave {
  v: 1;
  garden: {
    quest: QuestProgress | null;
    ladybugs: string[];
    stickers: string[];
    /** times the quest was finished (first time earns full starlight) */
    finished: number;
  };
  grownUp: GrownUpSettings;
}

const empty = (): WorldSave => ({
  v: 1,
  garden: { quest: null, ladybugs: [], stickers: [], finished: 0 },
  grownUp: { ...DEFAULT_GROWN_UP },
});

export function loadWorld(): WorldSave {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(scopedKey(WORLD_KEY));
    if (!raw) return empty();
    const s = JSON.parse(raw);
    const e = empty();
    return { ...e, ...s, garden: { ...e.garden, ...s.garden }, grownUp: { ...e.grownUp, ...s.grownUp } };
  } catch { return empty(); }
}

export function saveWorld(s: WorldSave) {
  if (!hasActiveConsent()) return; // COPPA: no consent → nothing recorded
  try { localStorage.setItem(scopedKey(WORLD_KEY), JSON.stringify(s)); } catch { /* storage full or blocked */ }
}

export function updateWorld(fn: (s: WorldSave) => WorldSave): WorldSave {
  const next = fn(loadWorld());
  saveWorld(next);
  return next;
}
