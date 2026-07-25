// ── Printable Worksheets library ──
// Real paper activities a parent prints at home: tracing sheets, line
// mazes, reading practice, and screen-free exercise cards, spanning all
// six domains. This is the ONE place in the app that touches the photo
// exception — see CLAUDE.md Privacy & COPPA rule 4 before changing
// anything here. A worksheet is "content" only: what to print and how
// a parent marks it done. Progress lives in lib/worksheetProgress.ts;
// photos (only for verifyMethod 'photo') live in lib/photos.ts.

import type { DifficultyTier } from './difficulty';

export type WorksheetCategory = 'tracing' | 'letters' | 'maze' | 'reading' | 'exercise' | 'communication';
export type Domain = 'fine-motor' | 'math' | 'reading' | 'communication' | 'sensory' | 'processing';

// tracing/maze sheets render an actual SVG path a child draws over —
// 'photo' worksheets ask a parent to snap the finished paper page;
// 'tap' worksheets are done off-paper-in-hand (exercise, communication
// prompt cards) so a simple "we did it!" tap is all that makes sense.
export type VerifyMethod = 'photo' | 'tap';

export interface TracingShape {
  kind: 'tracing';
  // a simple path descriptor rendered big on a printable page — see
  // components/worksheets/TracingSheet.tsx for how each `shape` draws
  shape: 'line-h' | 'line-v' | 'circle' | 'square' | 'triangle' | 'wave' | 'zigzag' | 'spiral' | 'star' | 'figure8';
  reps: number; // how many times the shape repeats down the page
}

export interface LetterContent {
  kind: 'letters';
  chars: string[]; // uppercase letters or digits to trace, in order
}

export interface MazeContent {
  kind: 'maze';
  complexity: 'simple' | 'medium' | 'complex';
}

export interface CardContent {
  kind: 'card';
  // a printable card of short prompts/steps — exercise moves or
  // communication phrases — no drawing involved
  items: string[];
}

export type WorksheetContent = TracingShape | LetterContent | MazeContent | CardContent;

export interface Worksheet {
  id: string;
  category: WorksheetCategory;
  domain: Domain;
  tier: DifficultyTier;
  title: string;
  emoji: string;
  blurb: string;         // shown in the library card
  noelTip: string;       // shown at the top of the printed page
  verifyMethod: VerifyMethod;
  content: WorksheetContent;
}

export const CATEGORY_INFO: Record<WorksheetCategory, { label: string; emoji: string }> = {
  tracing: { label: 'Tracing Shapes', emoji: '✏️' },
  letters: { label: 'Letters & Numbers', emoji: '🔤' },
  maze: { label: 'Line Mazes', emoji: '🧩' },
  reading: { label: 'Reading Practice', emoji: '📖' },
  exercise: { label: 'Move & Play', emoji: '🤸' },
  communication: { label: 'Talking Practice', emoji: '💬' },
};

const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const WORKSHEETS: Worksheet[] = [
  // ── Tracing: simple shapes → curves, easy to hard ──
  { id: 'trace-line-h', category: 'tracing', domain: 'fine-motor', tier: 'tiny', title: 'Straight Lines', emoji: '➖',
    blurb: 'Big, wide lines — the very first tracing step.', noelTip: 'Go slow and steady, left to right!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'line-h', reps: 4 } },
  { id: 'trace-line-v', category: 'tracing', domain: 'fine-motor', tier: 'tiny', title: 'Up-and-Down Lines', emoji: '❕',
    blurb: 'Top-to-bottom lines to build pencil control.', noelTip: 'Start at the top dot and go down!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'line-v', reps: 4 } },
  { id: 'trace-circle', category: 'tracing', domain: 'fine-motor', tier: 'tiny', title: 'Big Circles', emoji: '⭕',
    blurb: 'Round and round — a favorite first shape.', noelTip: 'Follow the dots all the way around!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'circle', reps: 3 } },
  { id: 'trace-square', category: 'tracing', domain: 'fine-motor', tier: 'small', title: 'Squares', emoji: '⬜',
    blurb: 'Straight sides and sharp corners.', noelTip: 'Corners are tricky — take your time turning!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'square', reps: 3 } },
  { id: 'trace-triangle', category: 'tracing', domain: 'fine-motor', tier: 'small', title: 'Triangles', emoji: '🔺',
    blurb: 'Three sides, three corners.', noelTip: 'Three straight sides make a triangle!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'triangle', reps: 3 } },
  { id: 'trace-wave', category: 'tracing', domain: 'fine-motor', tier: 'small', title: 'Wavy Lines', emoji: '〰️',
    blurb: 'Smooth curves — a step up from straight lines.', noelTip: 'Ride the wave up and down, nice and smooth!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'wave', reps: 3 } },
  { id: 'trace-zigzag', category: 'tracing', domain: 'fine-motor', tier: 'small', title: 'Zigzag Lines', emoji: '⚡',
    blurb: 'Sharp back-and-forth turns.', noelTip: 'Quick turns — up, down, up, down!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'zigzag', reps: 3 } },
  { id: 'trace-star', category: 'tracing', domain: 'fine-motor', tier: 'big', title: 'Stars', emoji: '⭐',
    blurb: 'A shape with five sharp points.', noelTip: 'Five points, one line — don’t lift your pencil!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'star', reps: 2 } },
  { id: 'trace-spiral', category: 'tracing', domain: 'fine-motor', tier: 'big', title: 'Spirals', emoji: '🌀',
    blurb: 'A curling line from outside to in.', noelTip: 'Start outside and curl your way to the middle!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'spiral', reps: 2 } },
  { id: 'trace-figure8', category: 'tracing', domain: 'fine-motor', tier: 'big', title: 'Figure-8s', emoji: '♾️',
    blurb: 'A crossing loop — great wrist practice.', noelTip: 'Cross in the middle without stopping!',
    verifyMethod: 'photo', content: { kind: 'tracing', shape: 'figure8', reps: 2 } },

  // ── Letters & Numbers ──
  { id: 'letters-abc-1', category: 'letters', domain: 'reading', tier: 'small', title: 'Letters A–M', emoji: '🅰️',
    blurb: 'First half of the alphabet, big and bold.', noelTip: 'Say the letter’s name as you trace it!',
    verifyMethod: 'photo', content: { kind: 'letters', chars: LETTERS.slice(0, 13) } },
  { id: 'letters-abc-2', category: 'letters', domain: 'reading', tier: 'small', title: 'Letters N–Z', emoji: '🆉',
    blurb: 'Second half of the alphabet.', noelTip: 'You know these too — keep going!',
    verifyMethod: 'photo', content: { kind: 'letters', chars: LETTERS.slice(13) } },
  { id: 'numbers-0-9', category: 'letters', domain: 'math', tier: 'small', title: 'Numbers 0–9', emoji: '🔢',
    blurb: 'Every digit, ready to trace.', noelTip: 'Count out loud as you trace each number!',
    verifyMethod: 'photo', content: { kind: 'letters', chars: NUMBERS } },

  // ── Line mazes ──
  { id: 'maze-simple', category: 'maze', domain: 'processing', tier: 'tiny', title: 'Simple Path Maze', emoji: '🧸',
    blurb: 'One wide, easy path from start to finish.', noelTip: 'Follow the path with your finger first, then your pencil!',
    verifyMethod: 'photo', content: { kind: 'maze', complexity: 'simple' } },
  { id: 'maze-medium', category: 'maze', domain: 'processing', tier: 'small', title: 'Winding Maze', emoji: '🌲',
    blurb: 'A few turns to think through.', noelTip: 'Go slow at the turns — no crossing the walls!',
    verifyMethod: 'photo', content: { kind: 'maze', complexity: 'medium' } },
  { id: 'maze-complex', category: 'maze', domain: 'processing', tier: 'big', title: 'Twisty Maze', emoji: '🏰',
    blurb: 'A real puzzle with dead ends.', noelTip: 'If it’s a dead end, back up and try another way!',
    verifyMethod: 'photo', content: { kind: 'maze', complexity: 'complex' } },

  // ── Reading practice (word-level, beyond single letters) ──
  { id: 'reading-cvc-words', category: 'reading', domain: 'reading', tier: 'small', title: 'Simple Words', emoji: '🐱',
    blurb: 'Short 3-letter words to trace and sound out.', noelTip: 'Sound out each letter, then say the whole word!',
    verifyMethod: 'photo', content: { kind: 'letters', chars: ['CAT', 'DOG', 'SUN', 'BUS', 'HAT', 'CUP'] } },
  { id: 'reading-sight-words', category: 'reading', domain: 'reading', tier: 'big', title: 'Sight Words', emoji: '👀',
    blurb: 'Common words good readers know by heart.', noelTip: 'These words show up everywhere — great job learning them!',
    verifyMethod: 'photo', content: { kind: 'letters', chars: ['THE', 'AND', 'YOU', 'SAID', 'WERE', 'THERE'] } },

  // ── Move & Play (screen-free exercise, no photo needed) ──
  { id: 'exercise-warmup', category: 'exercise', domain: 'sensory', tier: 'tiny', title: 'Wiggle Warm-Up', emoji: '🤸',
    blurb: 'Five gentle moves to get the wiggles out.', noelTip: 'Pick a card and do it together — no rush!',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      'March in place, 10 big steps',
      'Reach up high, then touch your toes — 5 times',
      'Spin around slowly, 3 times',
      'Freeze like a statue for 5 seconds',
      'Big stretch: arms out wide like an airplane',
    ] } },
  { id: 'exercise-animal-walks', category: 'exercise', domain: 'sensory', tier: 'small', title: 'Animal Walks', emoji: '🐻',
    blurb: 'Move like different animals across the room.', noelTip: 'Which animal walk is the silliest?',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      'Bear walk: hands and feet on the floor, walk slowly',
      'Bunny hops: two feet together, hop forward',
      'Crab walk: sit, hands behind you, walk sideways',
      'Snake slither: lie down and wiggle across the floor',
      'Flamingo stand: balance on one foot, then the other',
    ] } },
  { id: 'exercise-balance-focus', category: 'exercise', domain: 'sensory', tier: 'big', title: 'Balance & Focus', emoji: '🧘',
    blurb: 'Trickier balance moves for steady confidence.', noelTip: 'Balance is tricky — a few wobbles is totally normal!',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      'Walk a straight line (use tape or a rug edge), heel to toe',
      'Stand on one foot and count to 10',
      'Balance a small book on your head, walk 5 steps',
      'Hop on one foot, 5 times, then switch feet',
      'Close your eyes and stand still for 5 seconds',
    ] } },

  // ── Talking Practice (communication, screen-free) ──
  { id: 'talk-manners', category: 'communication', domain: 'communication', tier: 'tiny', title: 'Kind Words', emoji: '🙏',
    blurb: 'Practice saying simple polite phrases together.', noelTip: 'Take turns saying each one out loud!',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      '"Please" — when you want something',
      '"Thank you" — when someone helps you',
      '"I’m sorry" — when you make a mistake',
      '"Can I have a turn?" — when sharing',
      '"I need help" — when something is hard',
    ] } },
  { id: 'talk-feelings', category: 'communication', domain: 'communication', tier: 'small', title: 'Naming Feelings', emoji: '😊',
    blurb: 'Practice putting feelings into words.', noelTip: 'Point to a face and ask "when do you feel this way?"',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      '"I feel happy when..."',
      '"I feel sad when..."',
      '"I feel excited when..."',
      '"I feel worried when..."',
      '"I feel proud when..."',
    ] } },
  { id: 'talk-conversation', category: 'communication', domain: 'communication', tier: 'big', title: 'Conversation Starters', emoji: '💬',
    blurb: 'Practice a back-and-forth chat.', noelTip: 'Ask a question, listen to the answer, then ask another!',
    verifyMethod: 'tap', content: { kind: 'card', items: [
      'What was your favorite part of today?',
      'If you could visit anywhere, where would you go?',
      'What made you laugh this week?',
      'Tell me about a time you helped someone.',
      'What do you want to learn about next?',
    ] } },
];

export function worksheetsByCategory(category: WorksheetCategory): Worksheet[] {
  return WORKSHEETS.filter(w => w.category === category);
}

export function findWorksheet(id: string): Worksheet | undefined {
  return WORKSHEETS.find(w => w.id === id);
}
