// ── Family account (parent-first, COPPA-aligned) ──
// Parents own the account and create child profiles. A child profile holds
// the ABSOLUTE MINIMUM: nickname, birth month/year, avatar emoji. Nothing
// else — no photos, no email, no location, no last name.
//
// Everything lives on this device (localStorage). When cloud sync is added
// later, this module is the single gateway it must go through, and the
// consent record here is where stronger verification (e.g. card
// verification via the payment system) plugs in.

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

export interface FamilyAccount {
  id: string;
  createdAt: string;
  consent: ParentConsent | null;
  children: ChildProfile[];
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
];

export function loadFamily(): FamilyAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
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
    children: [],
  };
  f.consent = { agreedAt: new Date().toISOString(), policyVersion: POLICY_VERSION, method };
  save(f);
  return f;
}

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
  save(f);
  return f;
}

export function activeChild(f?: FamilyAccount | null): ChildProfile | null {
  const fam = f === undefined ? loadFamily() : f;
  return fam?.children[0] ?? null;
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
export function deleteChildAndData(childId: string) {
  const f = loadFamily();
  if (!f) return;
  f.children = f.children.filter(c => c.id !== childId);
  save(f);
  CHILD_DATA_KEYS.forEach(k => localStorage.removeItem(k));
}

export function deleteEverything() {
  CHILD_DATA_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(FAMILY_KEY);
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

  const daily = read('kailia_daily_v1');
  if (daily && Object.keys(daily).length) {
    const labels = ['not yet', 'tried with help', 'did it'];
    sections.push({ label: '☀️ Daily quest reports', items:
      Object.entries(daily as Record<string, Record<string, number>>).flatMap(([date, acts]) =>
        Object.entries(acts).map(([id, score]) => `${date} — ${id.replace(/^b\d-/, '')}: ${labels[score] ?? score}`)),
    });
  }

  if (!sections.length) sections.push({ label: 'Nothing yet', items: ['No data has been stored on this device.'] });
  return sections;
}
