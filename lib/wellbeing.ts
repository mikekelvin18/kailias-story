// ── Feelings check-ins, breaks and "Done for today" ──
// All on this device, all gentle.
//   • After each land, Kailia says how SHE felt there and the child taps one
//     of four big faces. Worried or sad gets a short breathing bubble with
//     Noel. The tap is kept (`kailia_feelings_v1`) and shown to grown-ups
//     as notes, never a score.
//   • Play time is counted per day (`kailia_playtime_v1`) so a break
//     reminder and a "Done for today" ending can come at the time the
//     grown-ups chose. Both keys are child data: in CHILD_DATA_KEYS and the
//     data inventory, deleted with the profile, saved only with consent.

import { activeChild, hasActiveConsent, scopedKey } from './family';
import { ageInMonths } from './milestones';
import { loadA11y } from './accessibility';

// ── Feelings ──
export type Feeling = 'happy' | 'calm' | 'worried' | 'sad';
export const FEELINGS: { id: Feeling; label: string; color: string }[] = [
  { id: 'happy', label: 'Happy', color: '#FACC15' },
  { id: 'calm', label: 'Calm', color: '#4ADE80' },
  { id: 'worried', label: 'Worried', color: '#C4B5FD' },
  { id: 'sad', label: 'Sad', color: '#7DD3FC' },
];

/** Kailia shares her own feeling about each land first, so it's safe to share one back. */
export const LAND_FEELING: Record<string, string> = {
  'firefly-forest': 'I felt a little scared of the dark forest, but the fireflies made me feel brave!',
  'dragons-cave': "I felt a little nervous in the dragon's cave! But the dragons were so friendly.",
  'whispering-signposts': 'I felt curious at the whispering signposts. What would they say next?',
  'story-keepers': 'I felt cozy in the story village. I love stories!',
  'echo-caves': 'I felt a little shy in the echo caves. Everything was so loud and sparkly!',
  'owls-tower': "I felt proud at the top of the owl's tower. We climbed so high!",
};
export const FEELING_ASK = 'How do you feel right now? Tap a face.';
export const FEELING_REPLY: Record<Feeling, string> = {
  happy: 'Yay! I feel happy too!',
  calm: 'Calm is a lovely way to feel.',
  worried: "It's okay to feel worried. Let's take some big breaths with Noel.",
  sad: "It's okay to feel sad. Noel is here. Let's breathe together.",
};
export const BREATHE_LINES = ['Breathe in...', 'and breathe out...'];
export const BREATHE_DONE = 'You did it. I am right here with you.';

export interface FeelingNote { ts: number; land: string; feeling: Feeling; breathed: boolean }
const FEEL_KEY = 'kailia_feelings_v1';

export function loadFeelings(): FeelingNote[] {
  if (typeof window === 'undefined') return [];
  try { const v = JSON.parse(localStorage.getItem(scopedKey(FEEL_KEY)) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
export function recordFeeling(land: string, feeling: Feeling, breathed = false) {
  if (typeof window === 'undefined' || !hasActiveConsent()) return;
  try {
    const list = loadFeelings();
    list.push({ ts: Date.now(), land, feeling, breathed });
    localStorage.setItem(scopedKey(FEEL_KEY), JSON.stringify(list.slice(-200)));
  } catch { /* never block play */ }
}

const LAND_NAME: Record<string, string> = {
  'firefly-forest': 'Firefly Forest', 'dragons-cave': "Dragon's Cave", 'whispering-signposts': 'Whispering Signposts',
  'story-keepers': 'Story Village', 'echo-caves': 'Echo Caves', 'owls-tower': "Owl's Tower",
};
/** Plain notes for grown-ups: what the child tapped after each land. */
export function feelingSummary(notes = loadFeelings()): string[] {
  return [...notes].reverse().slice(0, 8).map(n => {
    const f = FEELINGS.find(x => x.id === n.feeling)?.label.toLowerCase() ?? n.feeling;
    return `After ${LAND_NAME[n.land] ?? n.land}: felt ${f}${n.breathed ? ', and took some calm breaths with Noel' : ''} (${new Date(n.ts).toLocaleDateString()}).`;
  });
}

// ── Play time ──
const TIME_KEY = 'kailia_playtime_v1';
interface PlayDay { day: string; ms: number }
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Without consent nothing is stored on the device: the count lives only
// for this visit (sessionStorage), so the reminders still work.
function store(): Storage | null {
  try { return hasActiveConsent() ? localStorage : sessionStorage; } catch { return null; }
}
export function playedTodayMs(): number {
  try {
    const v: PlayDay | null = JSON.parse(store()?.getItem(scopedKey(TIME_KEY)) ?? 'null');
    return v && v.day === today() ? v.ms : 0;
  } catch { return 0; }
}
export function addPlayTime(ms: number) {
  try {
    const s = store(); if (!s) return;
    s.setItem(scopedKey(TIME_KEY), JSON.stringify({ day: today(), ms: playedTodayMs() + ms }));
  } catch { /* fine */ }
}

/** Break reminder minutes from the grown-ups' setting: 'auto' = 15 under 5, 20 from 5. 0 = off. */
export function breakMinutes(): number {
  const b = loadA11y().breakMinutes;
  if (b === 0) return 0;
  if (b === 10 || b === 15 || b === 20) return b;
  const c = typeof window !== 'undefined' ? activeChild() : null;
  const m = c ? ageInMonths(c.birthYear, c.birthMonth) : null;
  return m != null && m < 60 ? 15 : 20;
}
export function dailyMinutes(): number {
  const d = Number(loadA11y().dailyMinutes);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/** A grown-up gave a little more time today (Done for today → "10 more minutes"). */
const EXTRA_KEY = 'kailia_playtime_extra';
export function extraMinutesToday(): number {
  try { const v = JSON.parse(sessionStorage.getItem(EXTRA_KEY) ?? 'null'); return v?.day === today() ? v.min : 0; } catch { return 0; }
}
export function addExtraMinutes(min: number) {
  try { sessionStorage.setItem(EXTRA_KEY, JSON.stringify({ day: today(), min: extraMinutesToday() + min })); } catch { /* fine */ }
}
export function doneForToday(): boolean {
  const d = dailyMinutes();
  return d > 0 && playedTodayMs() >= (d + extraMinutesToday()) * 60000;
}

/** Movement ideas for the break screen (with a grown-up, no screen needed). */
export const MOVE_QUEST = [
  'Stretch up tall like a tree',
  'Hop like a bunny, five times',
  'Wiggle your fingers and toes',
  'Look far away out of a window',
];
export const BREAK_LINE = "Let's give our eyes a rest! Want to do a movement quest with a grown-up?";
export const DONE_LINE = "We played so much today! Noel is getting sleepy. See you tomorrow!";
