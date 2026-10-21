// ── Friends' adventures ──
// Each companion owns one skill and has its own trail of quests in its own
// little world (agreed with Kelvin 2026-10-21). A trail is 6 chapters of
// 5 stops (30 in all); stop 5 of each chapter is the "rescue" that ends
// that chapter's story. The trails open once all six main lands are
// finished (adventure.ts isBonusLandUnlocked): "after everything".
//
// Engines × content: every stop today is an existing game. Each friend's
// own signature game (Night Flight, Vine Weave, Gem Scales, Star Letters,
// Slow Waves, Call and Answer) replaces one of its stops as it is built.
//
// Progress is just the number of stops reached per trail, kept with the
// other game levels in kailia_rewards_v1 (recordGameLevel(trailId, n)),
// so it is consent-gated and covered by deletion already.

import { COMPANIONS } from './rewards';

export interface TrailStop {
  title: string;
  href: string;     // the game this stop plays
}

export interface Trail {
  pet: string;      // COMPANIONS name
  slug: string;     // URL piece: /play/friends/<slug> (no child data)
  skillLabel: string;   // kid words for the skill
  world: string;
  color: string;    // accent
  sky: string;      // page background
  ink: string;      // text on the background
  intro: string;    // the friend's own line on the trail
  chapters: { name: string; line: string }[];   // 6 chapters
  stops: TrailStop[];                           // 5 stops, played every chapter
}

export const STOPS_PER_CHAPTER = 5;
export const CHAPTER_COUNT = 6;
export const TRAIL_LENGTH = STOPS_PER_CHAPTER * CHAPTER_COUNT;

export const TRAILS: Trail[] = [
  {
    pet: 'Sage', slug: 'sage', skillLabel: 'Memory & thinking', world: "Sage's Moonlit Tower",
    color: '#FFE08A', sky: '#262B66', ink: '#FFFFFF',
    intro: 'Hoo! The night wind is full of puzzles. Will you think them through with me?',
    chapters: [
      { name: 'The Lost Feathers', line: 'The wind hid my moon feathers. Can you remember where each one landed?' },
      { name: 'The Sleepy Library', line: 'My books fell asleep in the wrong places. Let’s sort them out!' },
      { name: 'The Starry Stairs', line: 'Each stair lights up in a pattern. Watch closely!' },
      { name: 'The Whispering Doors', line: 'Behind which door did the owlets hide? Let’s find out.' },
      { name: 'The Cloud Maze', line: 'The clouds keep moving. Hold the way in your head!' },
      { name: 'The Moon Party', line: 'Everyone is coming to the moon party. Let’s get it all ready!' },
    ],
    stops: [
      { title: 'Feather Match', href: '/play/moonlight-match' },
      { title: 'Potion Sort', href: '/play/potion-sort' },
      { title: 'Sky Mail', href: '/play/sky-mail' },
      { title: 'Find the Owlets', href: '/play/hidden-friends' },
      { title: 'Moonlight Rescue', href: '/play/moonlight-match' },
    ],
  },
  {
    pet: 'Flick', slug: 'flick', skillLabel: 'Clever hands', world: "Flick's Twisty Woods",
    color: '#FDBA74', sky: '#13402F', ink: '#FFFFFF',
    intro: 'Quick paws, careful paws! Follow my tail through the woods.',
    chapters: [
      { name: 'The Tail Trail', line: 'My tail left a glowing trail. Can you trace it with me?' },
      { name: 'Falling Leaves', line: 'The leaves are dancing down. Catch them before they land!' },
      { name: 'The Den Maze', line: 'My den is at the end of a twisty path. Stay on the path!' },
      { name: 'Berry Drop', line: 'Let’s drop each berry in the right basket.' },
      { name: 'The Wobbly Bridge', line: 'Steady, steady. One careful step at a time.' },
      { name: 'Home Before Dark', line: 'The fireflies light our way home. Let’s go!' },
    ],
    stops: [
      { title: 'Tail Trails', href: '/play/firefly-trails' },
      { title: 'Leaf Catch', href: '/play/firefly-catch' },
      { title: 'Den Maze', href: '/play/fine-motor' },
      { title: 'Berry Drop', href: '/play/potion-sort' },
      { title: 'The Bridge Home', href: '/play/fine-motor' },
    ],
  },
  {
    pet: 'Ember', slug: 'ember', skillLabel: 'Counting', world: "Ember's Treasure Hills",
    color: '#FCA5A5', sky: '#4A1E1E', ink: '#FFFFFF',
    intro: 'I love treasure, and I love counting it even more! Help me count?',
    chapters: [
      { name: 'Gem Gathering', line: 'My gems rolled everywhere. Let’s gather just the right number!' },
      { name: 'The Toll Bridge', line: 'The bridge troll wants exactly the right toll.' },
      { name: 'Number Mail', line: 'Letters full of numbers are flying in. Catch and sort them!' },
      { name: 'Dot Pairs', line: 'Match the treasure dots that go together.' },
      { name: 'The Dragon Feast', line: 'Every baby dragon gets the same number of snacks.' },
      { name: 'The Treasure Count', line: 'The biggest treasure of all. Count it with me!' },
    ],
    stops: [
      { title: 'Gem Gather', href: '/play/snack-quest' },
      { title: 'Number Mail', href: '/play/sky-mail' },
      { title: 'Dot Pairs', href: '/play/moonlight-match' },
      { title: 'Toll Trail', href: '/play/snack-quest' },
      { title: 'Treasure Rescue', href: '/play/snack-quest' },
    ],
  },
  {
    pet: 'Nova', slug: 'nova', skillLabel: 'Letters & sounds', world: "Nova's Rainbow Meadow",
    color: '#F9A8D4', sky: '#3B2463', ink: '#FFFFFF',
    intro: 'Every letter makes a sound, and every sound makes a little magic!',
    chapters: [
      { name: 'Word Spells', line: 'Match each word to its picture to cast a spell.' },
      { name: 'The Rhyme Trail', line: 'Walk the trail and find the words that rhyme!' },
      { name: 'Riddle Road', line: 'The creatures on the road have riddles for us.' },
      { name: 'Letter Mail', line: 'Sort the flying letters into the right boxes.' },
      { name: 'The Sign Forest', line: 'Read the signs to find the way.' },
      { name: 'The Lost Letters', line: 'Some letters fell off the rainbow. Let’s put them back!' },
    ],
    stops: [
      { title: 'Word Spells', href: '/play/reading' },
      { title: 'Rhyme Trail', href: '/play/trail-walk' },
      { title: 'Riddle Road', href: '/play/journey' },
      { title: 'Letter Mail', href: '/play/sky-mail' },
      { title: 'Rainbow Rescue', href: '/play/reading' },
    ],
  },
  {
    pet: 'Shelly', slug: 'shelly', skillLabel: 'Senses & calm', world: "Shelly's Quiet Reef",
    color: '#99F6E4', sky: '#0F3E4A', ink: '#FFFFFF',
    intro: 'Slow and steady. Let’s look and listen very closely together.',
    chapters: [
      { name: 'Crystal Spots', line: 'One crystal is a little different. Can you spot it?' },
      { name: 'The Shell Song', line: 'The shells sing a tune. Can you sing it back?' },
      { name: 'Hidden Shells', line: 'My shell friends are hiding. Look carefully!' },
      { name: 'Glow Fish', line: 'Follow the glowing fish with your eyes.' },
      { name: 'The Bubble Garden', line: 'Colors, sounds and textures everywhere. Let’s explore.' },
      { name: 'The Quiet Reef', line: 'The reef is resting. Let’s find every little treasure.' },
    ],
    stops: [
      { title: 'Crystal Spot', href: '/play/sensory' },
      { title: 'Shell Song', href: '/play/echo-song' },
      { title: 'Hidden Shells', href: '/play/hidden-friends' },
      { title: 'Glow Catch', href: '/play/firefly-catch' },
      { title: 'Reef Rescue', href: '/play/sensory' },
    ],
  },
  {
    pet: 'Kiko', slug: 'kiko', skillLabel: 'Talking & listening', world: "Kiko's Chatter Jungle",
    color: '#BEF264', sky: '#1F3B16', ink: '#FFFFFF',
    intro: 'Hello hello! Let’s tell stories, sing songs and talk together!',
    chapters: [
      { name: 'Story Sparks', line: 'The storybooks lost their pages. What happens next?' },
      { name: 'Copy My Song', line: 'Listen to my song, then sing it back!' },
      { name: 'Silly Sentences', line: 'Some of these sentences are very silly. Sort them out!' },
      { name: 'Talk Together', line: 'Time to talk with your grown-up. I’ll listen too!' },
      { name: 'The Jungle Show', line: 'Every animal wants to tell a story.' },
      { name: 'Kiko’s Big Show', line: 'The big show is tonight. Let’s tell the best story ever!' },
    ],
    stops: [
      { title: 'Story Sparks', href: '/play/story-sparks' },
      { title: 'Copy My Song', href: '/play/echo-song' },
      { title: 'Silly Sentences', href: '/play/sky-mail' },
      { title: 'Talk Together', href: '/activities' },
      { title: 'Big Show Rescue', href: '/play/story-sparks' },
    ],
  },
];

export function trailId(t: Trail) { return `${t.slug}-trail`; }

export function findTrail(slug: string): Trail | undefined {
  return TRAILS.find(t => t.slug === slug);
}

export function companionFor(t: Trail) {
  return COMPANIONS.find(c => c.name === t.pet)!;
}

/** chapter index (0-based) for the next stop to play, given stops reached */
export function currentChapter(reached: number) {
  return Math.min(CHAPTER_COUNT - 1, Math.floor(reached / STOPS_PER_CHAPTER));
}
