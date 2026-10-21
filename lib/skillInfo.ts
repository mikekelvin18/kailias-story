// ── Parent-facing skill notes, one per game ──
// Shown as a small collapsible "For grown-ups" box on each game's intro
// screen: which skills the game targets and what it quietly notices.
// Written in plain parent language — no clinical jargon, no scores talk.

export interface SkillNote {
  skills: string[];        // short chips, e.g. "🤲 Fine motor"
  builds: string;          // what the game develops
  notices: string;         // what the app quietly observes
}

export const SKILL_INFO: Record<string, SkillNote> = {
  'night-flight': {
    skills: ['Visual memory', 'Sequencing'],
    builds: 'Holding a path of places in mind and repeating it in order: visual-spatial working memory.',
    notices: 'The longest star path remembered, and how it grows over time.',
  },
  'vine-weave': {
    skills: ['Fine motor', 'Planning'],
    builds: 'Slow, controlled finger movement through narrow gaps, planning a route ahead, and hand steadiness.',
    notices: 'How often the vine brushes a branch, and how long each vine takes.',
  },
  'gem-scales': {
    skills: ['Counting', 'Early adding'],
    builds: 'One-to-one counting, "same as" and "more or less", counting by twos with gem pairs, and putting two heaps together.',
    notices: 'The biggest amount balanced and how many extra moves were needed.',
  },
  'star-letters': {
    skills: ['Letters', 'First sounds', 'Fine motor'],
    builds: 'Letter shapes stroke by stroke, letter names, and hearing the first sound of a word.',
    notices: 'Stray taps while joining the stars, and whether the matching word was found.',
  },
  'slow-waves': {
    skills: ['Calm', 'Body awareness'],
    builds: 'Slow belly breathing paced by the tide, a simple calming tool for big feelings.',
    notices: 'How closely holding and letting go matched the tide, and the breath length managed.',
  },
  'kiko-says': {
    skills: ['Listening', 'Following directions'],
    builds: 'Understanding spoken directions with describing words and remembering steps in order. Kiko only talks; nothing records your child.',
    notices: 'How many steps were followed, and how often Kiko was asked to repeat or show the words.',
  },
  'potion-sort': {
    skills: ['🧠 Processing', '⚡ Sorting speed'],
    builds: 'Sorting by category under time pressure, quick color/rule matching, and impulse control (waiting for the right bin).',
    notices: 'Sorting accuracy, average decision speed, and how many colors your child can juggle at once.',
  },
  'firefly-catch': {
    skills: ['🤲 Fine motor', '⚡ Reaction speed'],
    builds: 'Finger accuracy on moving targets, controlled dragging, and hand–eye coordination.',
    notices: 'How precisely and quickly taps land, and how steadily your child drags.',
  },
  'snack-quest': {
    skills: ['🔢 Math', '🧠 Planning'],
    builds: 'Counting with one-to-one correspondence, early addition ("how many more?"), and route planning.',
    notices: 'Counting accuracy, first-try deliveries, and the biggest number handled confidently.',
  },
  'sky-mail': {
    skills: ['🔢 Math', '📖 Reading', '🤲 Fine motor', '🗣️ Feelings', '🌈 Matching', '🧠 Impulse control'],
    builds: 'Each mailbag targets one skill — from comparing amounts to judging word order to resisting a misleading word.',
    notices: 'Accuracy per deck, decision speed, and how straight and confident each swipe is.',
  },
  'moonlight-match': {
    skills: ['🧠 Visual memory', '📖 Letters (older kids)'],
    builds: 'Holding locations in mind, matching pairs, and — for readers — linking capital and lowercase letters.',
    notices: 'How many flips each pair takes and how streaks grow with focus.',
  },
  'echo-song': {
    skills: ['🧠 Sequence memory', '🌈 Listening'],
    builds: 'Holding a growing sound-and-light sequence in mind and repeating it in order.',
    notices: 'The longest melody echoed correctly — a classic working-memory span.',
  },
  'story-sparks': {
    skills: ['🗣️ Communication', '🧠 Social thinking'],
    builds: 'Predicting what sensibly happens next in a story — the root of narrative and social understanding. Read the pages aloud together!',
    notices: 'How often the sensible continuation is chosen over the silly one.',
  },
  'hidden-friends': {
    skills: ['🧠 Visual search', '🌈 Discrimination'],
    builds: 'Scanning a busy scene systematically and telling look-alikes apart.',
    notices: 'Search time and taps on look-alikes before finding the real targets.',
  },
  'fine-motor': {
    skills: ['🤲 Pre-writing control'],
    builds: 'Steady tracing within boundaries — the movement foundation of handwriting.',
    notices: 'How closely the traced line follows the path, smoothness, and pen lifts.',
  },
  'firefly-trails': {
    skills: ['🤲 Fine motor', '🧠 Visual memory'],
    builds: 'Controlled tracing of shapes and patterns; higher levels fade the guide so your child traces from memory — pre-writing and recall in one.',
    notices: 'How closely the trail is followed, wobble from the path, and how much of a faded shape is remembered.',
  },
  'journey': {
    skills: ['🔢 Math', '🧠 Memory', '🌈 Matching', '🗣️ Feelings', '📖 Words'],
    builds: 'An explorable RPG-style world where every creature encountered poses a different kind of little challenge — a gentle mixed workout across skills, Pokémon-adventure style.',
    notices: 'Which challenge types are solved first-try, and which need another look.',
  },
  'trail-walk': {
    skills: ['🔢 Math', '🧠 Memory', '🌈 Matching', '🗣️ Feelings', '📖 Words'],
    builds: 'A relaxed walking adventure where every creature met poses a different kind of little challenge — a gentle mixed workout across skills.',
    notices: 'Which challenge types are solved first-try, and which need another look.',
  },
};
