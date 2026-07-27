// ── Family account (parent-first, COPPA-aligned) ──
// Parents own the account and create child profiles. A child profile holds
// the ABSOLUTE MINIMUM: nickname, birth month/year, avatar emoji. Nothing
// else — no photos, no email, no location, no last name.
//
// Everything lives on this device (localStorage). When cloud sync is added
// later, this module is the single gateway it must go through, and the
// consent record here is where stronger verification (e.g. card
// verification via the payment system) plugs in.

import { deleteAllPhotos, deletePhotosForChild } from './photos';

export interface ParentConsent {
  agreedAt: string;               // ISO timestamp of active agreement
  policyVersion: string;          // which privacy notice they agreed to
  method: 'checkbox' | 'card-verification'; // stronger methods added later
}

export interface ChildProfile {
  id: string;
  nickname: string;               // first name or nickname ONLY
  birthYear: number;              // for developmental-age comparison
  birthMonth: number;             // 1–12
  avatar: string;                 // emoji chosen by the parent
  createdAt: string;
}

// A separate, narrower consent from the general child-data consent
// above — shown the first time a parent tries to attach a worksheet
// photo, before the file picker ever opens. See CLAUDE.md Privacy &
// COPPA rule 4. Photos themselves never touch this record; they live
// only in lib/photos.ts (on-device IndexedDB).
export interface PhotoConsent {
  agreedAt: string;
}

export interface FamilyAccount {
  id: string;
  createdAt: string;
  consent: ParentConsent | null;
  photoConsent: PhotoConsent | null;
  children: ChildProfile[];
  activeChildId?: string | null;    // which child's data every game reads/writes
  migratedLegacyData?: boolean;     // one-time flag, see migrateLegacyData()
}

export const POLICY_VERSION = '2026-07-draft-1';

const FAMILY_KEY = 'kailia_family_v1';

// Every localStorage key that can hold child data. Deletion helpers wipe
// these; add new keys HERE whenever a feature stores anything new.
export const CHILD_DATA_KEYS = [
  'kailia_assessment_v1',      // assessment answers & scores
  'kailia_adventure_v1',       // world-map progress & stars
  'kailia_quest_metrics_v1',   // game measurement events
  'kailia_daily_v1',           // parent activity reports
  'kailia_daily_seen_v1',      // daily popup shown flag
  'kailias_play_count',        // games played counter
  'kailia_rewards_v1',         // starlight points, game levels, companions
  'kailia_worksheet_progress_v1', // printable worksheet completion records
  'kailia_custom_tasks_v1',    // parent-authored custom quest goals
];

// One-time migration for accounts created before multi-child support:
// every CHILD_DATA_KEYS entry used to be a single global key holding
// that one child's data. Now every key is namespaced per child
// (see scopedKey below) so a second child's progress can't bleed into
// the first's. This copies each legacy key's value under the first
// child's namespaced key — the legacy key is left in place (harmless,
// just unused going forward) rather than deleted, so a bug here can
// never destroy data that hasn't been safely copied first.
function migrateLegacyData(f: FamilyAccount) {
  if (f.migratedLegacyData) return;
  const child = f.children[0];
  if (child) {
    CHILD_DATA_KEYS.forEach(base => {
      const legacy = localStorage.getItem(base);
      if (legacy !== null && localStorage.getItem(`${base}::${child.id}`) === null) {
        localStorage.setItem(`${base}::${child.id}`, legacy);
      }
    });
    if (!f.activeChildId) f.activeChildId = child.id;
  }
  f.migratedLegacyData = true;
  localStorage.setItem(FAMILY_KEY, JSON.stringify(f));
}

export function loadFamily(): FamilyAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) return null;
    const f: FamilyAccount = { photoConsent: null, activeChildId: null, ...JSON.parse(raw) };
    migrateLegacyData(f);
    return f;
  } catch { return null; }
}

// Every localStorage feature module calls this to read/write ONLY the
// currently active child's data, e.g. scopedKey('kailia_rewards_v1').
// Falls back to the un-namespaced key if no child is active yet (e.g.
// mid-onboarding), which also keeps this compatible with any code path
// that runs before a family/child exists.
export function scopedKey(base: string): string {
  const id = loadFamily()?.activeChildId;
  return id ? `${base}::${id}` : base;
}

function save(f: FamilyAccount) {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(f));
}

export function hasConsent(f: FamilyAccount | null): boolean {
  return !!f?.consent;
}

// The one question every data-writing module asks before saving anything.
// No consent on file → no collection, full stop (games still play fine,
// they just don't record).
export function hasActiveConsent(): boolean {
  return !!loadFamily()?.consent;
}

// Creates the parent account at the moment of consent — no consent, no account.
export function recordConsent(method: ParentConsent['method'] = 'checkbox'): FamilyAccount {
  const f: FamilyAccount = loadFamily() ?? {
    id: `fam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    consent: null,
    photoConsent: null,
    children: [],
  };
  f.consent = { agreedAt: new Date().toISOString(), policyVersion: POLICY_VERSION, method };
  save(f);
  return f;
}

// The separate, narrower consent for the ONE photo exception (printable
// worksheets). Shown in plain language before any file picker opens.
export function hasPhotoConsent(): boolean {
  return !!loadFamily()?.photoConsent;
}

export function recordPhotoConsent(): FamilyAccount | null {
  const f = loadFamily();
  if (!f) return null; // must already have the general consent/account first
  f.photoConsent = { agreedAt: new Date().toISOString() };
  save(f);
  return f;
}

// Adds a child profile — a family can have more than one (siblings at
// different developmental stages). The first child added automatically
// becomes active; later ones don't switch the active child on their
// own (use setActiveChild), so adding a second kid never yanks the
// screen away from whoever's currently playing.
export function addChild(input: { nickname: string; birthYear: number; birthMonth: number; avatar: string }): FamilyAccount | null {
  const f = loadFamily();
  if (!f || !f.consent) return null;   // consent must come first, always
  const child: ChildProfile = {
    id: `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nickname: input.nickname.trim().slice(0, 30),
    birthYear: input.birthYear,
    birthMonth: input.birthMonth,
    avatar: input.avatar,
    createdAt: new Date().toISOString(),
  };
  f.children.push(child);
  if (!f.activeChildId) f.activeChildId = child.id;
  save(f);
  return f;
}

// The child whose data every game currently reads/writes.
export function activeChild(f?: FamilyAccount | null): ChildProfile | null {
  const fam = f === undefined ? loadFamily() : f;
  if (!fam) return null;
  return fam.children.find(c => c.id === fam.activeChildId) ?? fam.children[0] ?? null;
}

// Switches which child is "active" — every game/quest from this point
// on reads and writes that child's own namespaced data (see scopedKey).
export const ACTIVE_CHILD_CHANGED_EVENT = 'kailia-active-child-changed';

export function setActiveChild(childId: string): FamilyAccount | null {
  const f = loadFamily();
  if (!f || !f.children.some(c => c.id === childId)) return null;
  f.activeChildId = childId;
  save(f);
  // Long-lived providers (e.g. AssessmentContext, mounted once at the
  // root layout) cache per-child state in React rather than re-reading
  // localStorage on every render — they need a signal to reload.
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ACTIVE_CHILD_CHANGED_EVENT));
  return f;
}

export function childAgeYears(c: ChildProfile): number {
  const now = new Date();
  const months = (now.getFullYear() - c.birthYear) * 12 + (now.getMonth() + 1 - c.birthMonth);
  if (months < 12) return 0.5;
  if (months < 24) return 1;
  return Math.floor(months / 12);
}

// Deletion is immediate and complete on this device (stronger than the
// 30-day rule in the retention policy, which covers any future servers).
// Async because worksheet photos live in IndexedDB (lib/photos.ts), not
// localStorage — treat any new photo-storing path the same way, or
// deletion is incomplete (see CLAUDE.md rule 4).
export async function deleteChildAndData(childId: string) {
  const f = loadFamily();
  if (!f) return;
  f.children = f.children.filter(c => c.id !== childId);
  if (f.activeChildId === childId) f.activeChildId = f.children[0]?.id ?? null;
  save(f);
  CHILD_DATA_KEYS.forEach(base => {
    localStorage.removeItem(`${base}::${childId}`);
    // also clear the un-namespaced legacy key — it only ever held data
    // for whichever child migrateLegacyData ran against, but clearing
    // it here is a harmless no-op for every other child
    localStorage.removeItem(base);
  });
  await deletePhotosForChild(childId);
}

export async function deleteEverything() {
  const f = loadFamily();
  f?.children.forEach(c => CHILD_DATA_KEYS.forEach(base => localStorage.removeItem(`${base}::${c.id}`)));
  CHILD_DATA_KEYS.forEach(base => localStorage.removeItem(base));
  localStorage.removeItem(FAMILY_KEY);
  await deleteAllPhotos();
}

// ── "View my child's data" — everything stored, in readable form ──

export interface DataSection { label: string; items: string[]; }

export function childDataInventory(): DataSection[] {
  if (typeof window === 'undefined') return [];
  const sections: DataSection[] = [];
  const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { return null; } };

  const fam = loadFamily();
  const child = activeChild(fam);
  if (child) {
    sections.push({ label: '👤 Profile', items: [
      `Nickname: ${child.nickname}`,
      `Born: ${String(child.birthMonth).padStart(2, '0')}/${child.birthYear}`,
      `Avatar: ${child.avatar}`,
      `Profile created: ${new Date(child.createdAt).toLocaleDateString()}`,
    ]});
  }

  const a = read('kailia_assessment_v1');
  if (a?.childName) {
    sections.push({ label: '📋 Assessment', items: [
      `Name used in stories: ${a.childName}`,
      `Age group: ${a.ageGroup ?? '—'}`,
      `Skill scores — reading ${a.scores?.reading ?? 0}, writing ${a.scores?.writing ?? 0}, talking ${a.scores?.communication ?? 0}, math ${a.scores?.math ?? 0} (each out of 10)`,
      `Sensory answers: ${a.sensoryCompleted ? 'completed' : 'not completed'}`,
    ]});
  }

  const adv = read('kailia_adventure_v1');
  if (adv?.played && Object.keys(adv.played).length) {
    sections.push({ label: '🗺️ Adventure progress', items:
      Object.entries(adv.played as Record<string, string[]>).map(([land, quests]) => `${land}: ${quests.length} quest(s) played`),
    });
  }

  const metrics = read('kailia_quest_metrics_v1');
  if (Array.isArray(metrics) && metrics.length) {
    sections.push({ label: '🎯 Game measurements', items: metrics.slice(-25).map((m: { taskId: string; domain: string; ts: number; data: Record<string, number> }) =>
      `${new Date(m.ts).toLocaleDateString()} — ${m.taskId} (${m.domain}): ${Object.entries(m.data).map(([k, v]) => `${k} ${v}`).join(', ')}`),
    });
  }

  const rewards = read('kailia_rewards_v1');
  if (rewards?.starlight) {
    sections.push({ label: '✨ Rewards', items: [
      `Starlight collected: ${rewards.starlight}`,
      ...Object.entries(rewards.gameLevels ?? {}).map(([g, l]) => `${g}: reached level ${l}`),
    ]});
  }

  const daily = read('kailia_daily_v1');
  if (daily && Object.keys(daily).length) {
    const labels = ['not yet', 'tried with help', 'did it'];
    sections.push({ label: '☀️ Daily quest reports', items:
      Object.entries(daily as Record<string, Record<string, number>>).flatMap(([date, acts]) =>
        Object.entries(acts).map(([id, score]) => `${date} — ${id.replace(/^b\d-/, '')}: ${labels[score] ?? score}`)),
    });
  }

  const worksheets = read('kailia_worksheet_progress_v1');
  if (worksheets && Object.keys(worksheets).length) {
    sections.push({ label: '🖨️ Printable worksheets', items:
      Object.entries(worksheets as Record<string, { completedAt: string; hasPhoto: boolean }>).map(([id, rec]) =>
        `${id} — done ${new Date(rec.completedAt).toLocaleDateString()}${rec.hasPhoto ? ' (photo saved on this device only)' : ''}`),
    });
  }

  const customTasks = read('kailia_custom_tasks_v1');
  if (Array.isArray(customTasks) && customTasks.length) {
    sections.push({ label: '📝 Custom quests (parent-authored)', items:
      (customTasks as { text: string; domain: string }[]).map(t => `"${t.text}" (${t.domain})`),
    });
  }

  if (!sections.length) sections.push({ label: 'Nothing yet', items: ['No data has been stored on this device.'] });
  return sections;
}
