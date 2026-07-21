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
