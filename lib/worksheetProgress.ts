// ── Printable Worksheet progress ──
// Tracks which worksheets a family has marked done. Consent-gated like
// every other child-data store (see lib/rewards.ts for the same
// pattern), and registered in lib/family.ts's CHILD_DATA_KEYS so
// parental deletion wipes it. Completion here is separate from the
// PHOTO itself — a photo-verified worksheet's actual image lives only
// in lib/photos.ts (IndexedDB), never here.

export interface WorksheetRecord {
  completedAt: string;
  hasPhoto: boolean;
}

export type WorksheetProgress = Record<string, WorksheetRecord>;

import { scopedKey } from './family';

const KEY = 'kailia_worksheet_progress_v1';

function consented(): boolean {
  try { return !!JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null')?.consent; }
  catch { return false; }
}

export function loadWorksheetProgress(): WorksheetProgress {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(scopedKey(KEY)) ?? '{}'); }
  catch { return {}; }
}

export function markWorksheetDone(worksheetId: string, hasPhoto: boolean) {
  if (!consented()) return; // COPPA: no consent → nothing recorded
  const p = loadWorksheetProgress();
  p[worksheetId] = { completedAt: new Date().toISOString(), hasPhoto };
  try { localStorage.setItem(scopedKey(KEY), JSON.stringify(p)); } catch { /* ignore */ }
}

export function unmarkWorksheet(worksheetId: string) {
  const p = loadWorksheetProgress();
  delete p[worksheetId];
  try { localStorage.setItem(scopedKey(KEY), JSON.stringify(p)); } catch { /* ignore */ }
}

export function isWorksheetDone(worksheetId: string): boolean {
  return !!loadWorksheetProgress()[worksheetId];
}
