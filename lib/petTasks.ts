// ── Care pet task cards (ages ~4–12) ──
// The Parent & Baby Quest Library covers children up to about age 4
// (pet steps 1–3). These cards cover steps 4–6 for older children: short,
// child-directed, done for real, in the pet's own voice and read aloud.
// DRAFT content: for Kelvin's OT review.
//
//   play → movement & calming (body awareness, balance, heavy work,
//          breathing for self-regulation)
//   care → talking & routines (speech, sequencing, everyday chores)
//
// Each card also says how the pop-up plays it on screen (`game`):
//   breathe → a breathing guide the pet breathes along with (no clock to
//             beat: it only paces the breath, and can be finished early)
//   count   → the pet shows the move; the child taps the pet each time
//   steps   → a short list the child ticks off as they do each part

export type PetMove = 'stretch' | 'star' | 'hop' | 'balance' | 'push' | 'cross' | 'march' | 'dance';

export type PetGame =
  | { type: 'breathe'; pattern: 'flower' | 'box'; rounds: number }
  | { type: 'count'; move: PetMove; reps: number; tapLabel: string }
  | { type: 'steps'; steps: string[] };

export interface PetCard {
  id: string;
  need: 'play' | 'care';
  step: 4 | 5 | 6;
  ask: string;      // what the pet says (read aloud)
  tip: string;      // a short note for a grown-up nearby
  game: PetGame;
}

export const PET_CARDS: PetCard[] = [
  // ── Play: movement & calming ──
  { id: 'pp-flower-candle', need: 'play', step: 4,
    ask: 'Let\'s breathe together! Smell the flower, then blow out the candle. Five times!',
    tip: 'Slow nose breath in, long mouth breath out. A calming breath for any time.',
    game: { type: 'breathe', pattern: 'flower', rounds: 5 } },
  { id: 'pp-bear-walk', need: 'play', step: 4,
    ask: 'Walk like a big bear, hands and feet on the floor! Go to the door and come back.',
    tip: 'Weight through hands and shoulders builds core and shoulder strength.',
    game: { type: 'count', move: 'march', reps: 2, tapLabel: 'Tap me at the door, and again when you\'re back!' } },
  { id: 'pp-freeze-dance', need: 'play', step: 4,
    ask: 'Dance with me! When a grown-up says "freeze", stop like a statue!',
    tip: 'Starting and stopping on a cue practices body control and listening.',
    game: { type: 'count', move: 'dance', reps: 3, tapLabel: 'Tap me every time you freeze!' } },
  { id: 'pp-tree-star', need: 'play', step: 5,
    ask: 'Copy me! Stretch up tall like a tree, then wide like a star. Five times!',
    tip: 'Big stretches wake up the body and practice copying a movement.',
    game: { type: 'count', move: 'stretch', reps: 5, tapLabel: 'Tap me after each tree and star!' } },
  { id: 'pp-flamingo', need: 'play', step: 5,
    ask: 'Stand on one foot like a flamingo and count to five. Then the other foot!',
    tip: 'Balance on each side. A wall or chair nearby is fine to steady on.',
    game: { type: 'count', move: 'balance', reps: 2, tapLabel: 'Tap me after each foot!' } },
  { id: 'pp-wall-push', need: 'play', step: 5,
    ask: 'Push the wall like you\'re moving a mountain! Push and count to ten. Three times!',
    tip: '"Heavy work" like this helps many children feel calm and organized.',
    game: { type: 'count', move: 'push', reps: 3, tapLabel: 'Tap me after each big push!' } },
  { id: 'pp-cross-crawl', need: 'play', step: 6,
    ask: 'Touch your hand to the other knee, then switch. Ten times, like me!',
    tip: 'Crossing the middle of the body links both sides working together.',
    game: { type: 'count', move: 'cross', reps: 10, tapLabel: 'Tap me for each knee!' } },
  { id: 'pp-square-breath', need: 'play', step: 6,
    ask: 'Let\'s do square breathing. In, hold, out, hold. Follow the light around the square!',
    tip: 'Box breathing is a calming tool your child can use on their own.',
    game: { type: 'breathe', pattern: 'box', rounds: 3 } },
  { id: 'pp-obstacle', need: 'play', step: 6,
    ask: 'Make me an adventure path! Over a pillow, under a table, and around a chair!',
    tip: 'Over, under and around builds motor planning and position words.',
    game: { type: 'steps', steps: ['Over a pillow', 'Under a table', 'Around a chair'] } },

  // ── Care: talking & routines ──
  { id: 'pc-name-voices', need: 'care', step: 4,
    ask: 'Say my name three ways: a big loud voice, a tiny whisper, and a silly voice!',
    tip: 'Changing loudness and pitch on purpose is great voice practice.',
    game: { type: 'steps', steps: ['Big loud voice', 'Tiny whisper', 'Silly voice'] } },
  { id: 'pc-shoes-door', need: 'care', step: 4,
    ask: 'Can you put your shoes by the door, so they\'re ready for tomorrow?',
    tip: 'A tiny routine done on their own builds independence.',
    game: { type: 'steps', steps: ['Find your shoes', 'Put them by the door'] } },
  { id: 'pc-farm-animals', need: 'care', step: 4,
    ask: 'Tell a grown-up two animals that live on a farm, and the sound each one makes!',
    tip: 'Naming and describing builds vocabulary.',
    game: { type: 'steps', steps: ['First animal and its sound', 'Second animal and its sound'] } },
  { id: 'pc-teeth', need: 'care', step: 5,
    ask: 'Time to brush your teeth! The top, the bottom, and the very back.',
    tip: 'Following a self-care routine step by step.',
    game: { type: 'steps', steps: ['Top teeth', 'Bottom teeth', 'The very back'] } },
  { id: 'pc-three-things', need: 'care', step: 5,
    ask: 'Tell a grown-up three things you did today: first, next, and last!',
    tip: 'Retelling in order (first, next, last) builds storytelling.',
    game: { type: 'steps', steps: ['First', 'Next', 'Last'] } },
  { id: 'pc-toy-homes', need: 'care', step: 5,
    ask: 'Help five toys get back to their homes. Say where each one goes!',
    tip: 'Tidying with words: sorting plus position words like "in" and "on".',
    game: { type: 'count', move: 'hop', reps: 5, tapLabel: 'Tap me for each toy you put away!' } },
  { id: 'pc-rhyme', need: 'care', step: 6,
    ask: 'Say a word that rhymes with "cat". Can you find two more?',
    tip: 'Rhyming is a key early reading skill.',
    game: { type: 'steps', steps: ['One rhyme', 'Two rhymes', 'Three rhymes!'] } },
  { id: 'pc-pack-bag', need: 'care', step: 6,
    ask: 'Pack your bag for tomorrow, then tell a grown-up what you put inside!',
    tip: 'Planning ahead and checking a list are everyday thinking skills.',
    game: { type: 'steps', steps: ['Pack your bag', 'Tell a grown-up what\'s inside'] } },
  { id: 'pc-feelings', need: 'care', step: 6,
    ask: 'Tell a grown-up how you feel today, and why. I like hearing about your day!',
    tip: 'Naming a feeling and a reason builds emotional language.',
    game: { type: 'steps', steps: ['Say how you feel', 'Say why'] } },
];
