// ── Noel's lines with a changing word in them ──
// "Find Noel and the 3 cookies!", "Look, Shelly found the glowing one!":
// the sentence is fixed but one word changes (a number, a friend's name,
// a shape, an animal). Each changing sentence is listed here once with the
// words that can fill it, and scripts/voice-lines.mjs adds every filled-in
// version to voice/lines.json so Noel records them all.
//
// When a game gets a new sentence like this, add it here (copy the
// sentence, put {pet}, {n}... where the word changes), then re-run
// `node scripts/voice-lines.mjs` and the recorder. A sentence that is not
// listed still works: the device voice reads it.
// The child's own name is never listed and never recorded.

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

const WORDS = {
  pet: ['Shelly', 'Flick', 'Sage', 'Nova', 'Ember', 'Kiko'],
  n: range(1, 20),               // counting games top out at 12; a little room
  few: range(2, 9),
  shape: ['The Bridge', 'The Full Moon', 'The Lightning', 'The River', 'The Great Star', 'The Snail Path'],
  treasure: ['3 bamboo', '3 cookies', '3 stars', '3 lanterns'],
  one: ['bamboo', 'cookie', 'star', 'lantern'],
  lookalike: ['raccoon', 'koala'],
  creature: ['dragon', 'owl', 'raccoon', 'parrot', 'peacock', 'rabbit', 'koala', 'deer', 'swan', 'fox', 'frog',
    'turtle', 'squirrel', 'hedgehog', 'bee', 'butterfly', 'friend'],
  biome: ['Sunny Meadow', 'Golden Dunes', 'Frosty Hills', 'Autumn Grove'],
  land: ['Firefly Forest', "Dragon's Treasure Cave", 'Whispering Signposts', 'Village of the Story Keepers',
    'Echo Caves', "Owl's Tower", 'Space Outpost', 'Coral Reef'],
  color: ['red', 'blue', 'green', 'purple'],
  story: ['The Fallen Ice Cream', 'The Lost Teddy', 'The Rainy Day', 'The Little Seed'],
  quest: ['Forest Trail', 'Crystal Caves', "Dragon's Lair", 'Sky Kingdom', "Wizard's Tower"],
  food: ['a long noodle', 'a round cookie', 'wiggly spaghetti', 'a crunchy pretzel', 'a star cookie', 'a cinnamon roll'],
  letter: ['L', 'V', 'N', 'M', 'W', 'Z', 'U', 'C', 'J', 'S', 'T', 'H', 'E', 'A', 'K'],
  level: range(1, 30),
  stars: range(2, 15),
};

/** letter -> its words in Star Letters (components/friends/games/StarLetters.tsx) */
const LETTER_WORDS = {
  L: ['lion', 'leaf', 'lamp'], V: ['van', 'vase', 'vet'], N: ['nest', 'net', 'nose'], M: ['moon', 'map', 'milk'],
  W: ['web', 'wing', 'water'], Z: ['zoo', 'zip', 'zebra'], U: ['up', 'under', 'umbrella'], C: ['cat', 'cup', 'cake'],
  J: ['jam', 'jet', 'juice'], S: ['sun', 'sock', 'star'], T: ['top', 'tree', 'toy'], H: ['hat', 'hen', 'hug'],
  E: ['egg', 'elf', 'end'], A: ['ant', 'apple', 'arm'], K: ['kite', 'key', 'king'],
};

const TEMPLATES = [
  // a friend helps (every world-map game)
  'Psst! {pet} found the baby with the fewest.',
  '{pet} is standing by the stone that fits.',
  '{pet} will sit by the crystal the song starts on.',
  '{pet} is sitting by the crystal the song starts on.',
  '{pet} shows the way.',
  '{pet} is doing a happy dance.',
  '{pet} found where the trail wakes up next.',
  '{pet} looks ready for an adventure today!',
  '{pet} is sitting right under something!',
  'Look up above {pet}!',
  '{pet} is bouncing by the glowing one.',
  'Flip one — {pet} will help you find its twin!',
  'Look, {pet} is at the {color} cauldron.',
  'Drop the {color} potion there!',
  'Look, {pet} found the glowing one!',
  'Ooh, look where {pet} is!',
  '{pet} found a snack to start again with.',
  'Look, {pet} is under what REALLY happens!',
  '{pet} ran over to help.',
  // counting
  'Every baby has {n}.',
  'Every baby dragon has {n}!',
  'One berry is left for Kailia.',
  '{few} berries are left for Kailia.',
  'That makes {n}.',
  'She wished for {n}.',
  'The dragon counted {n}.',
  "That's {n} too many!",
  '{few} still hiding in the tall grass…',
  '1 still hiding in the tall grass…',
  // shapes in the sky
  'Watch the firefly draw {shape}… remember it!',
  'Trace {shape}: follow the firefly and the glowing dots!',
  'Trace {shape} carefully!',
  '{shape} shines again!',
  // hide and seek
  'Find Noel and the {treasure}!',
  "Ooh, close — that's a {lookalike}, not Noel!",
  'A {one}!',
  // the journey
  'Welcome to the {biome}!',
  'A wild {creature} appeared!',
  'The {creature} joined your party!',
  'The {creature} joins the journey!',
  'How many {creature}s do you see?',
  'Which picture shows the {creature}?',
  "Let's visit {land} first — together!",
  '"{story}" — page one!',
  '{quest} conquered!',
  // the daily pet
  "It's me, {pet}!",
  "I'm {pet}!",
  'Trace {food} to keep the egg cozy!',
  'Will you trace me {food}?',
  "{few} more days and I'll grow!",
  // the friends' adventures
  'Level {level} done!',
  'Watch me fly across {stars} stars!',
  "Let's draw the letter {letter}!",
  '{letter}!',
  'Which word starts with {letter}?',
];

export function dynamicLines() {
  const out = new Set();
  const fill = (text) => {
    const m = text.match(/\{(\w+)\}/);
    if (!m) { out.add(text); return; }
    for (const w of WORDS[m[1]]) fill(text.replace(m[0], w));
  };
  TEMPLATES.forEach(fill);
  for (const [ch, words] of Object.entries(LETTER_WORDS)) {
    for (const w of words) { out.add(`${w}!`); out.add(`${ch} is for ${w}.`); }
  }
  return [...out];
}
