// ── Strengths view for grown-ups ──
// The results and progress pages lead with what a child is shining at,
// what they're growing in, and specific quests to try next (Kelvin chose
// 2026-11-25: strengths first, the rough age range only in a "Details"
// section). Built from what the app already has: the check-up's estimate
// per skill compared with the child's own age (lib/milestones.ts), and the
// games they've finished. No new data is collected for it.

import { LANDS } from './adventure';
import type { AgeComparison, AgeEstimate, MilestoneDomain } from './milestones';
import type { GameSummary } from './gameSummary';

export const STRENGTHS_LINE =
  'This is for fun and connection. It is not a medical or developmental assessment. If you have concerns, talk to your pediatrician.';

export interface SkillInfo { key: MilestoneDomain; label: string; land: string; landId: string; shine: string; grow: string; home: string }
export const SKILLS: SkillInfo[] = [
  { key: 'writing', label: 'Hand skills', land: 'Firefly Forest', landId: 'firefly-forest',
    shine: 'steady fingers for tracing, tapping and drawing', grow: 'finger strength and control for tracing and drawing',
    home: 'Play-dough snakes, peeling stickers and drawing big circles together.' },
  { key: 'communication', label: 'Talking & listening', land: 'Story Village', landId: 'story-keepers',
    shine: 'understanding stories and using words', grow: 'putting thoughts into words and following a story',
    home: 'Pause while reading a picture book and ask "What happens next?" Use the Talking practice cards.' },
  { key: 'math', label: 'Counting & sorting', land: "Dragon's Cave", landId: 'dragons-cave',
    shine: 'counting, matching amounts and spotting patterns', grow: 'counting one by one and comparing amounts',
    home: 'Count stairs, snacks or socks out loud together, touching each one.' },
  { key: 'reading', label: 'Letters & sounds', land: 'Whispering Signposts', landId: 'whispering-signposts',
    shine: 'letter sounds, rhymes and early words', grow: 'hearing the sounds inside words',
    home: 'Play "I spy something that starts with mmm" and make up silly rhymes.' },
  { key: 'processing', label: 'Thinking & remembering', land: "Owl's Tower", landId: 'owls-tower',
    shine: 'remembering steps and noticing details', grow: 'holding a few steps in mind at once',
    home: 'Give two-step helper jobs ("Get your shoes, then your hat") and play "What\'s missing?"' },
];

const GAME_SKILL: Record<string, MilestoneDomain> = {
  'fine motor': 'writing', 'fine-motor': 'writing', math: 'math', reading: 'reading',
  communication: 'communication', processing: 'processing', sensory: 'processing',
};

export interface StrengthItem { skill: SkillInfo; why: string }
export interface TryNext { title: string; href: string; why: string }
export interface StrengthsView { shining: StrengthItem[]; growing: StrengthItem[]; tryNext: TryNext[]; home: string[]; empty: boolean }

export function buildStrengths(opts: {
  estimates: Partial<Record<MilestoneDomain, AgeEstimate>>;
  chronoMonths: number | null;
  compare: (d: MilestoneDomain) => AgeComparison | null;
  scores?: Partial<Record<string, number>>;
  games?: GameSummary[];
}): StrengthsView {
  const { estimates, chronoMonths, compare, scores = {}, games = [] } = opts;
  // how strong each checked skill looks next to the child's own age (1 = right at it)
  const rated = SKILLS.map(skill => {
    const est = estimates[skill.key];
    const ratio = est && chronoMonths ? est.mid / chronoMonths : (scores[skill.key] ?? 0) / 10 + 0.5;
    const played = games.filter(g => GAME_SKILL[g.domain] === skill.key).reduce((t, g) => t + g.finished, 0);
    return { skill, ratio, cmp: compare(skill.key), checked: !!est || (scores[skill.key] ?? 0) > 0, played };
  }).filter(r => r.checked);

  if (!rated.length) return { shining: [], growing: [], tryNext: [], home: [], empty: true };

  const byStrong = [...rated].sort((a, b) => (b.ratio + b.played * 0.01) - (a.ratio + a.played * 0.01));
  // always find something to shine at: the strongest skills that aren't "a skill to grow"
  let shine = byStrong.filter(r => r.cmp !== 'growing').slice(0, 2);
  if (!shine.length) shine = byStrong.slice(0, 1);
  let grow = byStrong.filter(r => r.cmp === 'growing' && !shine.includes(r)).reverse().slice(0, 2);
  // nothing flagged: the gentlest next step is the skill with the most room
  if (!grow.length && byStrong.length > 2) grow = [byStrong[byStrong.length - 1]];

  const shining = shine.map(r => ({
    skill: r.skill,
    why: `${r.skill.shine[0].toUpperCase()}${r.skill.shine.slice(1)}${r.played ? `, and ${r.played} ${r.skill.land} game${r.played === 1 ? '' : 's'} finished` : ''}.`,
  }));
  const growing = grow.map(r => ({ skill: r.skill, why: `${r.skill.grow[0].toUpperCase()}${r.skill.grow.slice(1)}.` }));

  // specific quests for each skill to grow (or the strongest one, to keep the fun going)
  const focus = (growing.length ? growing : shining).map(g => g.skill);
  const tryNext: TryNext[] = [];
  focus.forEach(skill => {
    const land = LANDS.find(l => l.id === skill.landId);
    land?.quests.slice(0, 2).forEach(q => tryNext.push({ title: `${q.title} in ${land.name}`, href: q.href, why: q.desc }));
  });
  if (focus.some(s => s.key === 'communication')) {
    tryNext.push({ title: 'Talking practice cards', href: '/printables/talk-practice', why: 'Six printable cards with the same words Kailia asks for in the games.' });
  }
  return { shining, growing, tryNext: tryNext.slice(0, 4), home: focus.map(s => s.home), empty: false };
}
