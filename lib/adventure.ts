// ── The adventure world ──
// One place that defines the six lands, which mini-games (quests) live in
// each land, and how the child's progress is saved on this device.

export interface Quest {
  href: string;      // route of an existing mini-game
  emoji: string;
  title: string;
  desc: string;
}

export interface Land {
  id: string;
  name: string;
  domain: string;          // developmental domain (internal)
  emoji: string;
  color: string;           // main theme color
  glow: string;            // glow / accent
  sky: string;             // chip background on the map
  x: number;               // map position, viewBox units (0-400)
  y: number;               // map position, viewBox units (0-640)
  tagline: string;
  noelIntro: string;       // what Noel says when the land is opened
  quests: Quest[];
}

export const LANDS: Land[] = [
  {
    id: 'firefly-forest',
    name: 'Firefly Forest',
    domain: 'fine motor',
    emoji: '🌲',
    color: '#059669', glow: '#4ade80', sky: '#ECFDF5',
    x: 72, y: 556,
    tagline: 'Glowing paths and busy little hands',
    noelIntro: "Ooh, the fireflies lost their way! Can you help Kailia trace the glowing trails? Steady hands, here we go!",
    quests: [
      { href: '/play/fine-motor', emoji: '✨', title: 'Maze Runner', desc: 'Guide Kailia through 5 magical mazes without touching the walls!' },
      { href: '/play/firefly-catch', emoji: '🏮', title: 'Firefly Catch', desc: "Catch the glowing fireflies and light Kailia's lantern!" },
    ],
  },
  {
    id: 'dragons-cave',
    name: "Dragon's Treasure Cave",
    domain: 'math',
    emoji: '🐉',
    color: '#D97706', glow: '#FDE68A', sky: '#FFFBEB',
    x: 312, y: 474,
    tagline: 'Count the gems, feed the dragons',
    noelIntro: "A dragon guards this cave! Don't worry — she's friendly. She just LOVES counting cookies. Can you help Kailia count?",
    quests: [
      { href: '/play/snack-quest', emoji: '🐲', title: 'Snack Quest', desc: 'Play as Kailia or Noel — gather snacks and feed the baby dragon exactly what she asks for!' },
    ],
  },
  {
    id: 'whispering-signposts',
    name: 'Whispering Signposts',
    domain: 'reading',
    emoji: '🪧',
    color: '#2563EB', glow: '#93C5FD', sky: '#EFF6FF',
    x: 84, y: 386,
    tagline: 'Words that light the way',
    noelIntro: "These old signposts whisper words! Match the right word and the path lights up. Kailia can't read them alone — help her!",
    quests: [
      { href: '/play/reading', emoji: '📖', title: 'Word Wizard', desc: 'Match words to pictures and unlock magical spells!' },
    ],
  },
  {
    id: 'story-keepers',
    name: 'Village of the Story Keepers',
    domain: 'communication',
    emoji: '🏘️',
    color: '#EC4899', glow: '#FBCFE8', sky: '#FDF2F8',
    x: 316, y: 296,
    tagline: 'Every door opens with a story',
    noelIntro: "The Story Keepers mixed up all their tales! Put Kailia's adventure back in order and the village doors will open!",
    quests: [
      { href: '/play/story-sparks', emoji: '✨', title: 'Story Sparks', desc: 'The storybooks lost their pages! Choose what really happens next and bring each tale back to life!' },
    ],
  },
  {
    id: 'echo-caves',
    name: 'Echo Caves',
    domain: 'sensory',
    emoji: '🔮',
    color: '#0891B2', glow: '#A5F3FC', sky: '#ECFEFF',
    x: 88, y: 204,
    tagline: 'Crystals, colors and curious sounds',
    noelIntro: "Shhh… hear that? The caves echo with colors and sounds! Find the ones that match and the crystals will glow!",
    quests: [
      { href: '/play/sensory', emoji: '🌈', title: 'Sense Explorer', desc: "Match colors, sounds and patterns deep in the glowing caves!" },
      { href: '/play/echo-song', emoji: '🎶', title: 'Echo Song', desc: 'The crystals sing a little melody — listen closely and echo it back!' },
    ],
  },
  {
    id: 'owls-tower',
    name: "Owl's Tower",
    domain: 'processing',
    emoji: '🦉',
    color: '#7C3AED', glow: '#DDD6FE', sky: '#F5F3FF',
    x: 290, y: 92,
    tagline: 'Riddles at the top of the world',
    noelIntro: "The wise old owl only opens her tower for sharp eyes! Find every hidden star before her hourglass runs out!",
    quests: [
      { href: '/play/hidden-friends', emoji: '🔍', title: "Where's Noel?", desc: 'Busy storybook scenes hide a napping panda and lost treasures — search every corner!' },
      { href: '/play/sky-mail', emoji: '📬', title: 'Sky Mail', desc: "The wind stole Noel's letters! Swipe each one into the right mailbox — math, silly sentences, and wind rides!" },
      { href: '/play/moonlight-match', emoji: '🪶', title: 'Moonlight Match', desc: 'The owl hid her friends under moonlit feathers — flip, remember, and match the pairs!' },
    ],
  },
];

// ── Progress (saved on this device) ──

const KEY = 'kailia_adventure_v1';

export interface AdventureProgress {
  // landId -> list of quest hrefs the child has played
  played: Record<string, string[]>;
  // land ids already celebrated with the big “land complete” screen
  celebrated: string[];
}

const empty: AdventureProgress = { played: {}, celebrated: [] };

export function loadProgress(): AdventureProgress {
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

function save(p: AdventureProgress) {
  // COPPA: without parental consent, progress lives only for this visit —
  // the map still plays, but nothing about the child is stored.
  try {
    const fam = JSON.parse(localStorage.getItem('kailia_family_v1') ?? 'null');
    if (!fam?.consent) return;
  } catch { return; }
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function recordQuestPlay(landId: string, href: string): AdventureProgress {
  const p = loadProgress();
  const list = p.played[landId] ?? [];
  if (!list.includes(href)) p.played[landId] = [...list, href];
  save(p);
  return p;
}

export function markCelebrated(landId: string): AdventureProgress {
  const p = loadProgress();
  if (!p.celebrated.includes(landId)) p.celebrated = [...p.celebrated, landId];
  save(p);
  return p;
}

export function landStars(p: AdventureProgress, land: Land): number {
  return (p.played[land.id] ?? []).length;
}

export function isLandComplete(p: AdventureProgress, land: Land): boolean {
  return landStars(p, land) >= land.quests.length;
}

// Land 0 is always open; each next land opens once the previous land
// has at least one quest played. Gentle gating — never a hard wall.
export function isLandUnlocked(p: AdventureProgress, index: number): boolean {
  if (index === 0) return true;
  return landStars(p, LANDS[index - 1]) >= 1;
}

// The land Kailia is standing on: first unlocked land that isn't complete
// (or the last land once everything is done).
export function currentLandIndex(p: AdventureProgress): number {
  for (let i = 0; i < LANDS.length; i++) {
    if (isLandUnlocked(p, i) && !isLandComplete(p, LANDS[i])) return i;
  }
  return LANDS.length - 1;
}

export function totalStars(p: AdventureProgress): number {
  return LANDS.reduce((sum, land) => sum + landStars(p, land), 0);
}

export function maxStars(): number {
  return LANDS.reduce((sum, land) => sum + land.quests.length, 0);
}
