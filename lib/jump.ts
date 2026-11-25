// ── Jump links (preview builds only) ──
// A "jump link" like /go/pet-popup or /go/game/moonlight-match?level=3 sets
// up a ready-made test child on this device with the right progress and
// opens straight on that screen or pop-up, so Kelvin can check one fix from
// his phone without going through sign-up and the parent section first.
//
// OFF on the real public site: app/go/* answers "not found" unless
// jumpLinksEnabled() (lib/jumpGate.ts, server-side) says this is a Vercel preview,
// local development, or KAILIA_JUMP_LINKS=on.
//
// Privacy: the test child is a made-up profile ("Robin") that lives only on
// this device like any other profile, and the grown-up can delete it in the
// Parent Zone. If the device already has a family, that family and its other
// children are kept; only the test child is (re)made and switched to.

import { CHILD_DATA_KEYS } from './family';
import { LANDS } from './adventure';
import { COMPANIONS } from './rewards';

export const JUMP_CHILD_ID = 'child-jump';

// Game route folder → the id the game saves its level under.
const GAME_IDS: Record<string, string> = {
  reading: 'word-wizard', sensory: 'sense-explorer',
  'fine-motor': 'fine-motor', 'firefly-catch': 'firefly-catch', 'firefly-trails': 'firefly-trails',
  'snack-quest': 'snack-quest', 'dragon-bridge': 'dragon-bridge', journey: 'journey',
  'trail-walk': 'trail-walk', 'story-sparks': 'story-sparks', 'echo-song': 'echo-song',
  'hidden-friends': 'hidden-friends', 'moonlight-match': 'moonlight-match',
  'potion-sort': 'potion-sort', 'sky-mail': 'sky-mail',
  'cargo-count': 'cargo-count', 'reef-explorer': 'reef-explorer',
};
// Names people say for a game → its route folder.
const GAME_ALIASES: Record<string, string> = {
  'word-wizard': 'reading', 'maze-runner': 'fine-motor', maze: 'fine-motor',
  'sense-explorer': 'sensory', 'wheres-noel': 'hidden-friends',
};
export const GAME_ROUTES = Object.keys(GAME_IDS);

const LAND_IDS = ['firefly-forest', 'dragons-cave', 'whispering-signposts', 'story-keepers', 'echo-caves', 'owls-tower', 'space-outpost', 'coral-reef'];
const FRIEND_SLUGS = ['sage', 'flick', 'ember', 'nova', 'shelly', 'kiko'];
const BUDDIES = ['fox', 'turtle', 'owl', 'unicorn', 'dragon', 'parrot'];
const BUDDY_BY_NAME: Record<string, string> = { flick: 'fox', shelly: 'turtle', sage: 'owl', nova: 'unicorn', ember: 'dragon', kiko: 'parrot' };

// Every jump link, for the /go list and for the guide in CLAUDE.md.
export const JUMP_LINKS: { group: string; items: { href: string; label: string }[] }[] = [
  { group: 'Pop-ups on the map', items: [
    { href: '/go/pet-popup', label: 'Daily pet pop-up (new egg)' },
    { href: '/go/pet-popup?pet=baby', label: 'Daily pet pop-up (baby pet)' },
    { href: '/go/pet-popup?pet=grown', label: 'Daily pet pop-up (grown pet)' },
    { href: '/go/pet-popup?pet=little&task=play', label: 'Daily pet pop-up, Play task' },
    { href: '/go/pet-popup?pet=little&task=care', label: 'Daily pet pop-up, Care task' },
    { href: '/go/daily-quests', label: "Today's grown-up quests pop-up (2-year-old)" },
    { href: '/go/new-friend', label: 'New friend unlocked pop-up' },
    { href: '/go/land-done', label: 'Land finished party' },
    { href: '/go/land/dragons-cave', label: "A land's quest sheet (Dragon's Cave)" },
  ]},
  { group: 'Map', items: [
    { href: '/go/map', label: 'Map, just starting' },
    { href: '/go/map?all=1', label: 'Map, everything unlocked' },
    { href: '/go/garden', label: "Kailia's Garden" },
    { href: '/go/friends', label: "Friends' adventures" },
    { href: '/go/friend/sage', label: "Sage's trail" },
  ]},
  { group: 'Games (add ?level=N for any level)', items: GAME_ROUTES.map(g => ({ href: `/go/game/${g}?level=1`, label: g.replace(/-/g, ' ') })) },
  { group: 'Grown-up pages', items: [
    { href: '/go/results', label: 'Check-up results' },
    { href: '/go/progress', label: 'Progress' },
    { href: '/go/family', label: 'Parent Zone' },
    { href: '/go/activities', label: 'Parent & Baby quests' },
    { href: '/go/printables', label: 'Printables' },
    { href: '/go/upgrade', label: 'Plus plan page' },
  ]},
  { group: 'Start of the app', items: [
    { href: '/review', label: 'Reviewer guide (no sign-up, for outside reviewers)' },
    { href: '/go/review', label: 'Reviewer start: map with everything open' },
    { href: '/go/home', label: 'Front page' },
    { href: '/go/story', label: 'Story opening' },
    { href: '/go/setup', label: 'First check-up (fresh child)' },
    { href: '/go/try', label: 'Try one game (no account)' },
  ]},
];

export interface JumpPlan {
  path: string;            // where to land
  fresh?: boolean;         // no family/child at all (try page)
  noAssessment?: boolean;  // child exists but hasn't done the check-up
  ageMonths: number;
  buddy: string;
  all: boolean;            // every land done + every friend unlocked
  levels: Record<string, number>; // game id → level to open on
  pet: 'none' | 'egg' | 'baby' | 'little' | 'grown';
  petTask: 'feed' | 'play' | 'care' | null; // today's pet task
  dailyPopup: boolean;
  newFriend: boolean;
  landDone: boolean;
  openLand: string | null;
  plus: boolean | null;    // null = leave as it is
}

/** Works out what to set up from the link. Returns null for an unknown link. */
export function planJump(parts: string[], q: Record<string, string | undefined>): JumpPlan | null {
  const [what = 'map', arg] = parts.map(p => decodeURIComponent(p).toLowerCase());
  const years = Number(q.age);
  const level = Math.max(1, Math.min(999, Math.floor(Number(q.level) || 1)));
  const buddyQ = (q.buddy ?? '').toLowerCase();
  const plan: JumpPlan = {
    path: '/play', ageMonths: years > 0 && years < 18 ? Math.round(years * 12) : 72,
    buddy: BUDDIES.includes(buddyQ) ? buddyQ : BUDDY_BY_NAME[buddyQ] ?? 'fox',
    all: q.all === '1' || q.all === 'yes', levels: {}, pet: 'none', petTask: null,
    dailyPopup: false, newFriend: false, landDone: false, openLand: null,
    plus: q.plus === '1' ? true : q.plus === '0' ? false : null,
  };
  const petQ = (q.pet ?? '').toLowerCase();
  const simple: Record<string, string> = {
    map: '/play', home: '/', story: '/story', results: '/results', progress: '/progress',
    family: '/family', 'parent-zone': '/family', activities: '/activities', printables: '/printables',
    upgrade: '/upgrade', plus: '/upgrade', garden: '/play/garden',
  };
  if (simple[what]) plan.path = simple[what];
  else if (what === 'pet-popup' || what === 'pet') {
    plan.pet = (['egg', 'baby', 'little', 'grown'] as const).find(s => s === petQ) ?? 'egg';
    const t = (q.task ?? '').toLowerCase();
    plan.petTask = (['feed', 'play', 'care'] as const).find(n => n === t) ?? null;
    // the egg's first day is always Feed; another task needs a hatched pet
    if (plan.petTask && plan.petTask !== 'feed' && plan.pet === 'egg') plan.pet = 'baby';
  } else if (what === 'daily-quests') {
    plan.dailyPopup = true;
    if (!(years > 0)) plan.ageMonths = 26;
  } else if (what === 'new-friend') plan.newFriend = true;
  else if (what === 'land-done') plan.landDone = true;
  else if (what === 'land') {
    if (!arg || !LAND_IDS.includes(arg)) return null;
    plan.openLand = arg;
    if (arg === 'space-outpost' || arg === 'coral-reef') plan.all = true;
  } else if (what === 'friends') { plan.all = true; plan.path = '/play/friends'; }
  else if (what === 'friend') {
    if (!arg || !FRIEND_SLUGS.includes(arg)) return null;
    plan.all = true; plan.path = `/play/friends/${arg}`;
  } else if (what === 'game') {
    const route = GAME_ALIASES[arg ?? ''] ?? arg ?? '';
    if (!GAME_IDS[route]) return null;
    plan.path = `/play/${route}`;
    plan.levels[GAME_IDS[route]] = level;
    // some games start older children further up; a 4-year-old opens on the level asked for
    if (!(years > 0)) plan.ageMonths = 48;
    if (level >= 6 && plan.plus === null) plan.plus = true; // levels 6+ are Plus
  } else if (what === 'review') {
    // outside reviewers: a finished check-up, every land and friend open,
    // Plus on so no level is locked, and the map with nothing popping up
    plan.all = true;
    if (plan.plus === null) plan.plus = true;
  } else if (what === 'setup') { plan.path = '/setup'; plan.noAssessment = true; }
  else if (what === 'try') { plan.path = '/try'; plan.fresh = true; }
  else return null;
  // a grown pet is past the free days: give it Plus so it still pops up
  if ((plan.pet === 'little' || plan.pet === 'grown') && plan.plus === null) plan.plus = true;
  return plan;
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Sets up this device for the plan (runs in the browser). */
export function applyJump(plan: JumpPlan) {
  const ls = localStorage;
  const at = new Date().toISOString();
  const key = (base: string) => `${base}::${JUMP_CHILD_ID}`;
  try { sessionStorage.removeItem('kailia_launch_land'); sessionStorage.removeItem('kailia_demo_session'); } catch { /* fine */ }

  let fam: { children?: { id: string }[]; consent?: unknown; activeChildId?: string | null } | null = null;
  try { fam = JSON.parse(ls.getItem('kailia_family_v1') ?? 'null'); } catch { fam = null; }

  // the test child always starts clean
  CHILD_DATA_KEYS.forEach(b => ls.removeItem(key(b)));

  if (plan.fresh) {
    // "try before sign-up" needs a device with no family on it
    ls.removeItem('kailia_family_v1');
    return;
  }

  const now = new Date();
  const born = new Date(now.getFullYear(), now.getMonth() - plan.ageMonths, 1);
  const child = { id: JUMP_CHILD_ID, nickname: 'Robin', birthYear: born.getFullYear(), birthMonth: born.getMonth() + 1, avatar: plan.buddy, createdAt: at };
  const others = (fam?.children ?? []).filter(c => c.id !== JUMP_CHILD_ID);
  ls.setItem('kailia_family_v1', JSON.stringify({
    id: 'fam-preview', createdAt: at, photoConsent: null, migratedLegacyData: true,
    consent: { agreedAt: at, policyVersion: '2026-07-draft-1', method: 'checkbox' },
    ...(fam ?? {}),
    children: [...others, child],
    activeChildId: JUMP_CHILD_ID,
  }));

  const m = plan.ageMonths;
  if (!plan.noAssessment) {
    // a game link opens exactly the level asked for: low check-up scores so
    // no game bumps its start level up from the check-up
    const s = Object.keys(plan.levels).length ? 0 : plan.all ? 10 : 4;
    ls.setItem(key('kailia_assessment_v1'), JSON.stringify({
      childName: 'Robin', childAge: Math.floor(m / 12), childAgeMonths: m,
      ageGroup: m < 12 ? 'infant' : m < 24 ? 'toddler' : m <= 59 ? 'preschool' : 'schoolAge',
      assessmentType: 'checklist', assessmentCompleted: true, sensoryCompleted: true,
      scores: { reading: s, writing: s, communication: s, math: s },
      sensoryScores: { lowRegistration: 0, seeking: 0, sensitive: 0, avoiding: 0 },
      fineMotorInputMethod: null, graspPattern: null, fineMotorSubScores: null, evidence: {},
    }));
  }

  // map progress
  const played: Record<string, string[]> = {};
  if (plan.all) LANDS.forEach(l => { played[l.id] = l.quests.map(q => q.href); });
  if (plan.landDone) played[LANDS[0].id] = LANDS[0].quests.map(q => q.href);
  ls.setItem(key('kailia_adventure_v1'), JSON.stringify({
    played, celebrated: plan.landDone ? [] : Object.keys(played),
  }));

  // starlight, game levels, friends
  const gameLevels: Record<string, number> = {};
  for (const [g, l] of Object.entries(plan.levels)) gameLevels[g] = l - 1;
  const starlight = plan.all ? 600 : plan.newFriend ? COMPANIONS[0].at : 0;
  ls.setItem(key('kailia_rewards_v1'), JSON.stringify({
    starlight, gameLevels,
    celebratedCompanions: plan.newFriend ? [] : COMPANIONS.filter(c => c.at <= starlight).map(c => c.name),
  }));

  const today = dayKey();
  // the grown-ups' daily quests pop-up shows only when asked for
  if (!plan.dailyPopup) ls.setItem(key('kailia_daily_seen_v1'), today);

  // daily pet: pops up by itself on the map when it hasn't today. Every
  // other link marks it as already popped up today so it stays out of the way.
  // A hatched pet gets made-up happy days ending yesterday, so it greets
  // "Hi, it's me!" and today's task is the one after the last day's.
  const happyDays = { none: 0, egg: 0, baby: 1, little: 5, grown: 12 }[plan.pet];
  const needs = ['feed', 'play', 'care'] as const;
  const step = plan.ageMonths < 48 ? 2 : 4;
  const wanted = needs.indexOf(plan.petTask ?? needs[happyDays % 3]);
  const history = Array.from({ length: happyDays }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (happyDays - i));
    return { day: dayKey(d), need: needs[(wanted - (happyDays - i) + 300) % 3], step, outcome: 'win' };
  });
  ls.setItem(key('kailia_pet_v1'), JSON.stringify({
    v: 1, startedDay: history[0]?.day ?? today, lastVisitDay: history[history.length - 1]?.day ?? null,
    lastAutoOpenDay: plan.pet === 'none' ? today : null,
    happyDays, today: null, steps: { feed: step, play: step, care: step }, winStreak: { feed: 0, play: 0, care: 0 }, history,
  }));

  if (plan.plus !== null) ls.setItem('kailia_premium_v1', plan.plus ? 'true' : 'false');

  try {
    if (plan.openLand) sessionStorage.setItem('kailia_jump_open_land', plan.openLand);
    else sessionStorage.removeItem('kailia_jump_open_land');
  } catch { /* fine */ }
}
