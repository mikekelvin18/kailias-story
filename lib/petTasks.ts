// ── Care pet task cards (ages ~4–12) ──
// The Parent & Baby Quest Library covers children up to about age 4
// (pet steps 1–3). These cards cover steps 4–6 for older children: short,
// child-directed, done off-screen, then one tap. Written in the pet's
// own voice and read aloud. DRAFT content: for Kelvin's OT review.
//
//   play → movement & calming (body awareness, balance, heavy work,
//          breathing for self-regulation)
//   care → talking & routines (speech, sequencing, everyday chores)

export interface PetCard {
  id: string;
  need: 'play' | 'care';
  step: 4 | 5 | 6;
  ask: string;      // what the pet says (read aloud)
  tip: string;      // a short note for a grown-up nearby
}

export const PET_CARDS: PetCard[] = [
  // ── Play: movement & calming ──
  { id: 'pp-flower-candle', need: 'play', step: 4,
    ask: 'Let\'s breathe together! Smell the flower… now blow out the candle. Five times!',
    tip: 'Slow nose breath in, long mouth breath out. A calming breath for any time.' },
  { id: 'pp-bear-walk', need: 'play', step: 4,
    ask: 'Can you walk like a big bear? Hands and feet on the floor, all the way to the door and back!',
    tip: 'Weight through hands and shoulders builds core and shoulder strength.' },
  { id: 'pp-freeze-dance', need: 'play', step: 4,
    ask: 'Dance with me! When a grown-up says "freeze", stop like a statue!',
    tip: 'Starting and stopping on a cue practices body control and listening.' },
  { id: 'pp-tree-star', need: 'play', step: 5,
    ask: 'Copy me! Stretch up tall like a tree, then wide like a star. Five times each!',
    tip: 'Big stretches wake up the body and practice copying a movement.' },
  { id: 'pp-flamingo', need: 'play', step: 5,
    ask: 'Stand on one foot like a flamingo and count to five. Now the other foot!',
    tip: 'Balance on each side. A wall or chair nearby is fine to steady on.' },
  { id: 'pp-wall-push', need: 'play', step: 5,
    ask: 'Push the wall like you\'re moving a mountain! Push and count to ten. Three times!',
    tip: '"Heavy work" like this helps many children feel calm and organized.' },
  { id: 'pp-cross-crawl', need: 'play', step: 6,
    ask: 'Touch your hand to the other knee, then switch. Can you do ten without stopping?',
    tip: 'Crossing the middle of the body links both sides working together.' },
  { id: 'pp-square-breath', need: 'play', step: 6,
    ask: 'Draw a square in the air while you breathe. In for four, hold for four, out for four, hold for four!',
    tip: 'Box breathing is a calming tool your child can use on their own.' },
  { id: 'pp-obstacle', need: 'play', step: 6,
    ask: 'Make me an adventure path! Go over a pillow, under a table, and around a chair!',
    tip: 'Over/under/around builds motor planning and position words.' },

  // ── Care: talking & routines ──
  { id: 'pc-name-voices', need: 'care', step: 4,
    ask: 'Say my name three ways: a big loud voice, a tiny whisper, and a silly voice!',
    tip: 'Changing loudness and pitch on purpose is great voice practice.' },
  { id: 'pc-shoes-door', need: 'care', step: 4,
    ask: 'Can you put your shoes by the door so they\'re ready for tomorrow?',
    tip: 'A tiny routine done on their own builds independence.' },
  { id: 'pc-farm-animals', need: 'care', step: 4,
    ask: 'Tell a grown-up two animals that live on a farm, and the sound each one makes!',
    tip: 'Naming and describing builds vocabulary.' },
  { id: 'pc-teeth', need: 'care', step: 5,
    ask: 'Time to brush your teeth! Brush the top, the bottom, and the very back. Then come tell me!',
    tip: 'Following a self-care routine step by step.' },
  { id: 'pc-three-things', need: 'care', step: 5,
    ask: 'Tell a grown-up three things you did today: first, next, and last!',
    tip: 'Retelling in order (first, next, last) builds storytelling.' },
  { id: 'pc-toy-homes', need: 'care', step: 5,
    ask: 'Help five toys get back to their homes. Say where each one goes!',
    tip: 'Tidying with words: sorting plus position words like "in" and "on".' },
  { id: 'pc-rhyme', need: 'care', step: 6,
    ask: 'Say a word that rhymes with "cat". Can you find two more?',
    tip: 'Rhyming is a key early reading skill.' },
  { id: 'pc-pack-bag', need: 'care', step: 6,
    ask: 'Pack your bag for tomorrow. Tell a grown-up what you put inside!',
    tip: 'Planning ahead and checking a list are everyday thinking skills.' },
  { id: 'pc-feelings', need: 'care', step: 6,
    ask: 'Tell a grown-up how you feel today, and why. I like hearing about your day!',
    tip: 'Naming a feeling and a reason builds emotional language.' },
];
