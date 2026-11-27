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
import { TEST_TAP_KEY } from './testMode';

/** components/ParentGate.tsx remembers a grown-up pass under this key. */
const GROWNUP_PASS_KEY = 'kailia_grownup_pass_v1';

export const JUMP_CHILD_ID = 'child-jump';
/** sessionStorage hints a jump link leaves for the screen it opens */
export const JUMP_TALK_KEY = 'kailia_jump_talk';
export const JUMP_FEELINGS_KEY = 'kailia_jump_feelings';
export const JUMP_BREAK_KEY = 'kailia_jump_break';
/** The outside reviewers' test child (/go/review): made once, then reused by
 *  every jump link that doesn't need a different made-up state, so a reviewer
 *  never loses progress by following a link (reviewer 2026-11-25). */
// ONE test child, always (Grok 2026-11-27: every "starts fresh" link made
// another Robin). Reviewers and every other link share this fixed id; a
// "starts fresh" link sets the same Robin up from scratch and tucks the
// reviewer's progress away (REVIEW_BACKUP) until the next ordinary link.
export const REVIEW_CHILD_ID = JUMP_CHILD_ID;
/** the id older builds gave the reviewers' Robin: folded into the one Robin on load */
const OLD_REVIEW_CHILD_ID = 'child-review';
const REVIEW_MARK = 'kailia_review_profile_v1'; // on this device: a reviewer started at /go/review
const REVIEW_BACKUP = 'kailia_review_backup_v1'; // the reviewer's Robin, while a "starts fresh" link borrows it
const ROBIN_ENTRY = '__robin';

type Fam = { id?: string; children?: { id: string; nickname?: string }[]; consent?: unknown; activeChildId?: string | null };

/** Every made-up Robin on this device other than the one fixed test child:
 *  the old reviewer id, and Robins that jump links made in a family they
 *  created themselves ('fam-preview'). A real family's own child called Robin
 *  is never touched. */
function strayRobins(fam: Fam | null): string[] {
  if (!fam?.children) return [];
  const preview = fam.id === 'fam-preview';
  const seen = new Set<string>();
  const stray: string[] = [];
  for (const c of fam.children) {
    if (c.id === JUMP_CHILD_ID) { if (seen.has(c.id)) stray.push(c.id); seen.add(c.id); continue; }
    if (c.id === OLD_REVIEW_CHILD_ID || (preview && c.nickname === 'Robin')) stray.push(c.id);
  }
  return stray;
}

/** Folds duplicate test Robins into one (runs on every jump link, and on the
 *  /review page). The old reviewer Robin's progress moves to the one Robin. */
export function cleanUpTestRobins(): void {
  const ls = localStorage;
  let fam: Fam | null = null;
  try { fam = JSON.parse(ls.getItem('kailia_family_v1') ?? 'null'); } catch { return; }
  const stray = strayRobins(fam);
  if (!fam || !stray.length) return;
  const keep = (fam.children ?? []).some(c => c.id === JUMP_CHILD_ID);
  if (stray.includes(OLD_REVIEW_CHILD_ID) && !keep) {
    CHILD_DATA_KEYS.forEach(b => {
      const v = ls.getItem(`${b}::${OLD_REVIEW_CHILD_ID}`);
      if (v !== null) ls.setItem(`${b}::${JUMP_CHILD_ID}`, v);
    });
  }
  for (const id of stray) if (id !== JUMP_CHILD_ID) CHILD_DATA_KEYS.forEach(b => ls.removeItem(`${b}::${id}`));
  const children: { id: string; nickname?: string }[] = [];
  let hasOne = false;
  for (const c of fam.children ?? []) {
    if (c.id === JUMP_CHILD_ID) { if (hasOne) continue; hasOne = true; children.push(c); continue; }
    if (stray.includes(c.id)) {
      if (c.id === OLD_REVIEW_CHILD_ID && !keep && !hasOne) { hasOne = true; children.push({ ...c, id: JUMP_CHILD_ID }); }
      continue;
    }
    children.push(c);
  }
  const active = fam.activeChildId && stray.includes(fam.activeChildId) ? (hasOne ? JUMP_CHILD_ID : children[0]?.id ?? null) : fam.activeChildId;
  ls.setItem('kailia_family_v1', JSON.stringify({ ...fam, children, activeChildId: active }));
}

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
    { href: '/go/feelings?land=dragons-cave', label: 'Feelings check-in after a land (tap Worried for the breathing bubble)' },
    { href: '/go/break', label: 'Break reminder (movement quest)' },
    { href: '/go/done-today', label: '"Done for today" cozy ending' },
  ]},
  { group: 'Talking', items: [
    { href: '/go/talk?place=story-sparks&age=4', label: '"Your turn!" in Story Sparks (age 4: one word)' },
    { href: '/go/talk?place=story-sparks&age=2', label: '"Your turn!" (age 2: animal sounds)' },
    { href: '/go/talk?place=trail-walk&age=6', label: "\"Your turn!\" in Kailia's Trail (age 6: phrases, what happens next)" },
    { href: '/go/talk?place=echo-song&age=8', label: '"Your turn!" in Echo Song (age 8: tell it in your own words)' },
    { href: '/go/talk?place=story', label: '"Your turn!" in the story opening' },
    { href: '/go/talk-cards', label: 'Printable Talking practice cards' },
    { href: '/go/senses', label: 'Parent Zone: senses, talking and break settings' },
  ]},
  { group: 'Map', items: [
    { href: '/go/map', label: 'Map, just starting' },
    { href: '/go/map?all=1', label: 'Map, everything unlocked' },
    { href: '/go/garden', label: "Kailia's Garden" },
    { href: '/go/friends', label: "Friends' adventures" },
    { href: '/go/friend/sage', label: "Sage's trail" },
  ]},
  { group: 'Games (add ?level=N for any level, or leave it off and add ?age=N to see where a child that age starts)', items: GAME_ROUTES.map(g => ({ href: `/go/game/${g}?level=1`, label: g.replace(/-/g, ' ') })) },
  { group: 'Grown-up pages', items: [
    { href: '/go/results', label: 'Check-up results' },
    { href: '/go/progress', label: 'Progress' },
    { href: '/go/challenge', label: 'Challenge round (harder check-up questions)' },
    { href: '/go/family', label: 'Parent Zone' },
    { href: '/go/activities', label: 'Parent & Baby quests' },
    { href: '/go/printables', label: 'Printables' },
    { href: '/go/upgrade', label: 'Plans page (grown-up check first)' },
    { href: '/go/upgrade?plus=0', label: 'Plans page, family without a plan' },
    { href: '/go/game/moonlight-match?level=5&plus=0', label: 'Level map without a plan (gold keys on 6+)' },
    { href: '/go/about', label: 'About page' },
    { href: '/go/terms', label: 'Terms of Use (draft)' },
    { href: '/go/privacy', label: 'Privacy page' },
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
  calm: boolean | null;    // ?calm=1|0: calm mode on or off (null = leave as it is)
  review: boolean;         // /go/review: the reviewers' profile, every level open
  /** /go/results and /go/progress: a real milestone check-up (answers per skill), so the age card shows its range bar */
  checkup?: boolean;
  /** one-time hints for the screen it opens (sessionStorage key → value), e.g. show a talking moment straight away */
  session: Record<string, string>;
  /** a link that needs its own made-up state (day one, a 2-year-old, a fresh
   *  sign-up...): it always uses the scratch test child, never the reviewer's */
  scratch: boolean;
}

/** A made-up check-up for the results/progress links: yes to milestones up
 *  to about the child's age, "sometimes" just past it, "not yet" beyond.
 *  Reading a little ahead and counting a little behind, so the strengths
 *  and the skill-by-skill list both have something to show. */
function sampleCheckup(m: number) {
  const shift: Record<string, number> = { reading: 6, writing: 0, communication: 0, math: -6, processing: 0 };
  const out: Record<string, { id: string; months: number; r: number; kind: 'choice3' }[]> = {};
  for (const [d, k] of Object.entries(shift)) {
    out[d] = [-30, -24, -18, -12, -6, 0, 6, 12, 18].map((o, i) => ({
      id: `${d}-jump-${i}`, months: Math.max(6, m + o), r: o <= k ? 1 : o <= k + 6 ? 0.5 : 0, kind: 'choice3',
    }));
  }
  return out;
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
    calm: q.calm === '1' ? true : q.calm === '0' ? false : null,
    session: q.test === 'tap' ? { [TEST_TAP_KEY]: '1' } : q.test === 'off' ? { [TEST_TAP_KEY]: '0' } : {},
    review: what === 'review', scratch: years > 0 || (what === 'map' && !(q.all === '1' || q.all === 'yes')),
  };
  const petQ = (q.pet ?? '').toLowerCase();
  const simple: Record<string, string> = {
    map: '/play', home: '/', story: '/story', results: '/results', progress: '/progress',
    family: '/family', 'parent-zone': '/family', activities: '/activities', printables: '/printables',
    upgrade: '/upgrade', plus: '/upgrade', garden: '/play/garden',
    about: '/about', terms: '/terms', privacy: '/privacy', retention: '/retention',
  };
  if (simple[what]) {
    plan.path = simple[what];
    if (what === 'results' || what === 'progress') plan.checkup = true;
  }
  // Muse round 7: reviewers guessed /go/challenge and got "path is hidden".
  // It now opens the grown-ups' Challenge round (harder check-up questions)
  // after a finished check-up, like the button on the results page.
  else if (what === 'challenge') { plan.path = '/assessment/games?challenge=1'; plan.checkup = true; }
  else if (what === 'pet-popup' || what === 'pet') {
    plan.pet = (['egg', 'baby', 'little', 'grown'] as const).find(s => s === petQ) ?? 'egg';
    const t = (q.task ?? '').toLowerCase();
    plan.petTask = (['feed', 'play', 'care'] as const).find(n => n === t) ?? null;
    // the egg's first day is always Feed; another task needs a hatched pet
    if (plan.petTask && plan.petTask !== 'feed' && plan.pet === 'egg') plan.pet = 'baby';
  } else if (what === 'daily-quests') {
    plan.dailyPopup = true; plan.scratch = true;
    if (!(years > 0)) plan.ageMonths = 26;
  } else if (what === 'new-friend') { plan.newFriend = true; plan.scratch = true; }
  else if (what === 'land-done') { plan.landDone = true; plan.scratch = true; }
  // ── talking, feelings and breaks (thread "Add talking, sensory and feelings features") ──
  else if (what === 'talk') {
    // a "Your turn!" moment opens straight away (?place=story|story-sparks|trail-walk|echo-song, ?age=2|3|6|8 for each age's kind of ask)
    const place = (q.place ?? 'story-sparks').toLowerCase();
    if (!['story', 'story-sparks', 'trail-walk', 'echo-song'].includes(place)) return null;
    plan.path = place === 'story' ? '/story' : `/play/${place}`;
    plan.session[JUMP_TALK_KEY] = place;
  } else if (what === 'feelings') {
    const land = (q.land ?? 'dragons-cave').toLowerCase();
    if (!LAND_IDS.slice(0, 6).includes(land)) return null;
    plan.session[JUMP_FEELINGS_KEY] = land;
  } else if (what === 'break') { plan.session[JUMP_BREAK_KEY] = 'break'; }
  else if (what === 'done-today') { plan.session[JUMP_BREAK_KEY] = 'done'; }
  else if (what === 'test-mode') {
    // reviewers: tap instead of drag in Garden, Maze Runner and Potion Sort
    // (lib/testMode.ts); ?on=0 switches it off again. Back to the guide.
    plan.path = '/review'; plan.session[TEST_TAP_KEY] = q.on === '0' ? '0' : '1';
  }
  else if (what === 'senses' || what === 'play-settings') { plan.path = '/family#senses'; }
  else if (what === 'talk-cards') { plan.path = '/printables/talk-practice'; }
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
    // ?level=N opens that level; without it the game opens where a new
    // player of this age starts (lib/ageFit.ts), e.g. /go/game/echo-song?age=8
    if (q.level != null) plan.levels[GAME_IDS[route]] = level;
    if (!(years > 0)) plan.ageMonths = 48;
    if (level >= 6 && plan.plus === null) plan.plus = true; // levels 6+ are Plus
  } else if (what === 'review') {
    // outside reviewers: a finished check-up, every land and friend open,
    // Plus on so no level is locked, and the map with nothing popping up
    plan.all = true; plan.scratch = false;
    if (plan.plus === null) plan.plus = true;
  } else if (what === 'setup') { plan.path = '/setup'; plan.noAssessment = true; plan.scratch = true; }
  else if (what === 'try') { plan.path = '/try'; plan.fresh = true; plan.scratch = true; }
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
  try { sessionStorage.removeItem('kailia_launch_land'); sessionStorage.removeItem('kailia_demo_session'); } catch { /* fine */ }

  cleanUpTestRobins();
  let fam: Fam | null = null;
  try { fam = JSON.parse(ls.getItem('kailia_family_v1') ?? 'null'); } catch { fam = null; }

  // A reviewer (started at /go/review) keeps one profile across every link
  // that doesn't need a made-up state of its own: their progress stays.
  const wasReviewer = ls.getItem(REVIEW_MARK) === '1';
  if (plan.review) ls.setItem(REVIEW_MARK, '1');
  const reviewing = !plan.scratch && (plan.review || wasReviewer);
  const childId = JUMP_CHILD_ID;
  const key = (base: string) => `${base}::${childId}`;
  const robinThere = (fam?.children ?? []).some(c => c.id === childId);
  if (plan.scratch && wasReviewer && robinThere && !ls.getItem(REVIEW_BACKUP)) {
    // a "starts fresh" link borrows Robin: keep the reviewer's progress safe
    const saved: Record<string, string> = {};
    CHILD_DATA_KEYS.forEach(b => { const v = ls.getItem(key(b)); if (v !== null) saved[b] = v; });
    // and who Robin was (age, buddy), since a fresh link may change them
    saved[ROBIN_ENTRY] = JSON.stringify((fam?.children ?? []).find(c => c.id === childId));
    ls.setItem(REVIEW_BACKUP, JSON.stringify(saved));
  }
  if (reviewing && ls.getItem(REVIEW_BACKUP)) {
    // back from a "starts fresh" link: Robin gets the reviewer's progress back
    let saved: Record<string, string> = {};
    try { saved = JSON.parse(ls.getItem(REVIEW_BACKUP) ?? '{}') ?? {}; } catch { saved = {}; }
    CHILD_DATA_KEYS.forEach(b => { if (saved[b] != null) ls.setItem(key(b), saved[b]); else ls.removeItem(key(b)); });
    ls.removeItem(REVIEW_BACKUP);
    let entry: { id: string } | null = null;
    try { entry = saved[ROBIN_ENTRY] ? JSON.parse(saved[ROBIN_ENTRY]) : null; } catch { entry = null; }
    if (entry && fam?.children) {
      fam = { ...fam, children: fam.children.map(c => (c.id === childId ? entry! : c)) };
      ls.setItem('kailia_family_v1', JSON.stringify(fam));
    }
  }
  const hasProfile = robinThere && !!ls.getItem(key('kailia_assessment_v1'));
  if (reviewing && wasReviewer && hasProfile && fam) { reuseReviewProfile(plan, fam, key); return; }

  // the test child starts clean
  CHILD_DATA_KEYS.forEach(b => ls.removeItem(key(b)));

  if (plan.fresh) {
    // "try before sign-up" needs a device with no family on it
    ls.removeItem('kailia_family_v1');
    return;
  }

  const now = new Date();
  const born = new Date(now.getFullYear(), now.getMonth() - plan.ageMonths, 1);
  const child = { id: childId, nickname: 'Robin', birthYear: born.getFullYear(), birthMonth: born.getMonth() + 1, avatar: plan.buddy, createdAt: at };
  const others = (fam?.children ?? []).filter(c => c.id !== childId);
  ls.setItem('kailia_family_v1', JSON.stringify({
    id: 'fam-preview', createdAt: at, photoConsent: null, migratedLegacyData: true,
    consent: { agreedAt: at, policyVersion: '2026-07-draft-1', method: 'checkbox' },
    ...(fam ?? {}),
    children: [...others, child],
    activeChildId: childId,
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
      fineMotorInputMethod: null, graspPattern: null, fineMotorSubScores: null,
      evidence: plan.checkup ? sampleCheckup(m) : {},
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
  // the reviewers' profile: every level of every game (and friend trail) is
  // open on the level map; each game still starts on level 1 (or the level a
  // link asks for) and moves up as it is played (reviewNext, lib/rewards.ts)
  let reviewNext: Record<string, number> | undefined;
  if (reviewing) {
    reviewNext = {};
    for (const g of [...Object.values(GAME_IDS), ...FRIEND_SLUGS.map(f => `${f}-trail`)]) gameLevels[g] = REVIEW_LEVELS;
    for (const [g, l] of Object.entries(plan.levels)) reviewNext[g] = l;
  }
  const starlight = plan.all ? 600 : plan.newFriend ? COMPANIONS[0].at : 0;
  ls.setItem(key('kailia_rewards_v1'), JSON.stringify({
    starlight, gameLevels, ...(reviewNext ? { reviewNext } : {}),
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
  // ?plus=0 also previews the paywall as if it were switched on (lib/premium.ts),
  // so a reviewer can see the free part; any other plan choice turns that off
  if (plan.plus === false) ls.setItem('kailia_paywall_preview_v1', 'on');
  else if (plan.plus === true) ls.removeItem('kailia_paywall_preview_v1');
  setCalm(ls, plan.calm);
  setSessionHints(plan);

  try {
    if (plan.openLand) sessionStorage.setItem('kailia_jump_open_land', plan.openLand);
    else sessionStorage.removeItem('kailia_jump_open_land');
  } catch { /* fine */ }
}

/** Levels opened for the reviewers: all 30 of the ladder (lib/levels.ts). */
const REVIEW_LEVELS = 30;

/** A reviewer following another link: keep their profile and progress, and
 *  only set up what this link is about (a game's level, the pet pop-up, a
 *  land's quest sheet). */
function reuseReviewProfile(plan: JumpPlan, fam: object, key: (b: string) => string) {
  const ls = localStorage;
  ls.setItem('kailia_family_v1', JSON.stringify({ ...fam, activeChildId: JUMP_CHILD_ID }));
  // a game link opens on the level it names (progress is kept)
  if (Object.keys(plan.levels).length) {
    let r: { reviewNext?: Record<string, number> } = {};
    try { r = JSON.parse(ls.getItem(key('kailia_rewards_v1')) ?? '{}') ?? {}; } catch { r = {}; }
    r.reviewNext = { ...(r.reviewNext ?? {}), ...plan.levels };
    ls.setItem(key('kailia_rewards_v1'), JSON.stringify(r));
  }
  const today = dayKey();
  if (!plan.dailyPopup) ls.setItem(key('kailia_daily_seen_v1'), today);
  // the pet pop-up links set the pet up as asked; every other link leaves it alone
  if (plan.pet !== 'none') {
    const happyDays = { none: 0, egg: 0, baby: 1, little: 5, grown: 12 }[plan.pet];
    const needs = ['feed', 'play', 'care'] as const;
    const step = 4;
    const wanted = needs.indexOf(plan.petTask ?? needs[happyDays % 3]);
    const history = Array.from({ length: happyDays }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (happyDays - i));
      return { day: dayKey(d), need: needs[(wanted - (happyDays - i) + 300) % 3], step, outcome: 'win' };
    });
    ls.setItem(key('kailia_pet_v1'), JSON.stringify({
      v: 1, startedDay: history[0]?.day ?? today, lastVisitDay: history[history.length - 1]?.day ?? null,
      lastAutoOpenDay: null, happyDays, today: null, steps: { feed: step, play: step, care: step }, winStreak: { feed: 0, play: 0, care: 0 }, history,
    }));
  }
  if (plan.plus !== null) ls.setItem('kailia_premium_v1', plan.plus ? 'true' : 'false');
  // ?plus=0 also previews the paywall as if it were switched on (lib/premium.ts),
  // so a reviewer can see the free part; any other plan choice turns that off
  if (plan.plus === false) ls.setItem('kailia_paywall_preview_v1', 'on');
  else if (plan.plus === true) ls.removeItem('kailia_paywall_preview_v1');
  setCalm(ls, plan.calm);
  setSessionHints(plan);
  try {
    if (plan.openLand) sessionStorage.setItem('kailia_jump_open_land', plan.openLand);
    else sessionStorage.removeItem('kailia_jump_open_land');
  } catch { /* fine */ }
}

function setSessionHints(plan: JumpPlan) {
  try {
    [JUMP_TALK_KEY, JUMP_FEELINGS_KEY, JUMP_BREAK_KEY].forEach(k => sessionStorage.removeItem(k));
    for (const [k, v] of Object.entries(plan.session)) sessionStorage.setItem(k, v);
    // a jump link (previews only) counts as having passed the grown-up check
    // for this visit, so Kelvin, reviewers and the look checks land on the
    // real page. Add ?gate=1 to see the check itself. Real visits keep it.
    if (new URLSearchParams(location.search).get('gate') === '1') sessionStorage.removeItem(GROWNUP_PASS_KEY);
    else sessionStorage.setItem(GROWNUP_PASS_KEY, String(Date.now()));
  } catch { /* fine */ }
}

/** ?calm=1|0 on any jump link: calm mode (a display setting, not child data). */
function setCalm(ls: Storage, calm: boolean | null) {
  if (calm === null) return;
  try {
    const a = JSON.parse(ls.getItem('kailia_a11y_v1') ?? '{}');
    ls.setItem('kailia_a11y_v1', JSON.stringify({ ...a, calmMode: calm }));
  } catch { /* ignore */ }
}
