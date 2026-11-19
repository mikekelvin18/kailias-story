// ── Placement questions (the first check-up's reading, communication and math games) ──
// Kept apart from the page so the automatic checks (tests/logic) can read
// every question and prove its answer key is right. Each question's
// `months` is the age by which most children answer it (lib/milestones.ts).

import { screenCeiling, aheadCeiling, challengeCeiling } from './milestones';

export interface Question {
  text: string;
  type: 'choice' | 'input';
  options?: { label: string; correct: boolean }[];
  correctAnswer?: string;
  /** Age (months) by which most children answer this correctly — see lib/milestones.ts. */
  months: number;
  points: { correct: number; partial?: number; wrong: number };
}

export interface DomainGame {
  key: 'reading' | 'writing' | 'communication' | 'math';
  label: string;
  emoji: string;
  scenario: string;
  color: string;
  light: string;
  questions: Question[];
}

// ─── Regular games (Reading, Communication, Math) ─────────────────────────────

export const GAMES: DomainGame[] = [
  {
    key: 'reading', label: "Kailia's Treasure Hunt", emoji: '📖',
    scenario: 'Kailia is packing her backpack for a treasure hunt. Help her find the right things!',
    color: '#2563EB', light: '#EFF6FF',
    questions: [
      { text: 'Kailia found three things: an 🍎 apple, a ⚽ ball, and a 🐱 cat. Can you tap the BALL?', type: 'choice', months: 30,
        options: [{ label: '🍎 Apple', correct: false }, { label: '⚽ Ball', correct: true }, { label: '🐱 Cat', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Which word starts with the same sound as "ball"?', type: 'choice', months: 60,
        options: [{ label: '🦁 Lion', correct: false }, { label: '🦋 Butterfly', correct: true }, { label: '🐠 Fish', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Read this sentence: "The dog runs fast." What is the dog doing?', type: 'choice', months: 78,
        options: [{ label: 'Sleeping 😴', correct: false }, { label: 'Running 🏃', correct: true }, { label: 'Eating 🍖', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia sees a sign that says STOP. What does it mean?', type: 'choice', months: 60,
        options: [{ label: 'Go fast!', correct: false }, { label: "Don't move forward", correct: true }, { label: 'Turn around', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia reads: "The sky is blue. The grass is green." What color is the sky?', type: 'choice', months: 72,
        options: [{ label: '🟢 Green', correct: false }, { label: '🔵 Blue', correct: true }, { label: '🟡 Yellow', correct: false }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
  {
    key: 'communication', label: "Kailia's Talking Friend", emoji: '🗣️',
    scenario: "Kailia loves to chat! She has some questions for you. Help her understand the world.",
    color: '#7C3AED', light: '#F5F3FF',
    questions: [
      { text: 'Kailia shows you a picture of someone with tears on their face. How is this person feeling?', type: 'choice', months: 42,
        options: [{ label: '😄 Happy', correct: false }, { label: '😢 Sad', correct: true }, { label: '😠 Angry', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia lost her backpack. What would you say to help her?', type: 'choice', months: 60,
        options: [{ label: '"That\'s funny!"', correct: false }, { label: '"Where did you last see it? I can help you look!"', correct: true }, { label: '"I don\'t know."', correct: false }],
        points: { correct: 2, partial: 1, wrong: 0 } },
      { text: 'Put these in order: Kailia woke up. She ate breakfast. She went to school. What did she do SECOND?', type: 'choice', months: 66,
        options: [{ label: 'Went to school 🏫', correct: false }, { label: 'Woke up 😴', correct: false }, { label: 'Ate breakfast 🥣', correct: true }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia says "I went to the park and I saw a..." Which ending makes the most sense?', type: 'choice', months: 54,
        options: [{ label: 'flying car going to the moon', correct: false }, { label: 'puppy playing with a ball', correct: true }, { label: 'sandwich jumping', correct: false }],
        points: { correct: 2, partial: 1, wrong: 0 } },
      { text: "Kailia's friend says \"I feel scared.\" What's the kindest thing to do?", type: 'choice', months: 60,
        options: [{ label: 'Laugh at them', correct: false }, { label: 'Walk away', correct: false }, { label: '"I\'m here for you. Do you want to talk?"', correct: true }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
  {
    key: 'math', label: "Kailia's Cookie Quest", emoji: '🍪',
    scenario: "Kailia is sharing snacks with her friends! Help her count, add, and share fairly.",
    color: '#D97706', light: '#FFFBEB',
    questions: [
      { text: 'Kailia has these cookies: 🍪🍪🍪. How many cookies does she have?', type: 'choice', months: 42,
        options: [{ label: '2', correct: false }, { label: '3', correct: true }, { label: '4', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia has 2 cookies 🍪🍪. She gets 3 more 🍪🍪🍪. How many does she have now?', type: 'choice', months: 66,
        options: [{ label: '4', correct: false }, { label: '5', correct: true }, { label: '6', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia has 10 cookies. She eats 4. How many are left?', type: 'choice', months: 84,
        options: [{ label: '5', correct: false }, { label: '6', correct: true }, { label: '7', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia shares 12 cookies equally among 3 friends (including herself). How many each?', type: 'choice', months: 108,
        options: [{ label: '3', correct: false }, { label: '4', correct: true }, { label: '6', correct: false }],
        points: { correct: 2, wrong: 0 } },
      { text: 'Kailia baked 2 trays of cookies. Each tray has 8 cookies. How many total?', type: 'choice', months: 102,
        options: [{ label: '10', correct: false }, { label: '14', correct: false }, { label: '16', correct: true }],
        points: { correct: 2, wrong: 0 } },
    ],
  },
];

// Harder rungs so older or advanced children don't top out (ages are the
// end of the U.S. grade where the skill is expected: Grade 1 ≈ 7 yrs …
// Grade 6 ≈ 12). With these, each game is a ladder from about 3 to 12.
const right = (label: string) => ({ label, correct: true });
const other = (label: string) => ({ label, correct: false });
const EXTRA_QUESTIONS: Record<'reading' | 'communication' | 'math', Question[]> = {
  reading: [
    { text: 'Which word says "ship"?', type: 'choice', months: 84,
      options: [other('chip'), right('ship'), other('shop')], points: { correct: 2, wrong: 0 } },
    { text: 'Read: "Mia was so unhappy when the rain started." How did Mia feel?', type: 'choice', months: 96,
      options: [other('Very glad'), right('Not happy'), other('Sleepy')], points: { correct: 2, wrong: 0 } },
    { text: 'Read: "Max grabbed his umbrella and his rain boots before he went outside." What was the weather probably like?', type: 'choice', months: 108,
      options: [other('Hot and sunny'), right('Rainy'), other('Snowy and windy')], points: { correct: 2, wrong: 0 } },
    { text: 'Read: "Bees carry pollen from flower to flower. This helps new plants grow. Without bees, many fruits could not grow." What is this mostly about?', type: 'choice', months: 114,
      options: [other('How bees make honey'), right('How bees help plants grow'), other('Why flowers are pretty')], points: { correct: 2, wrong: 0 } },
    { text: 'Read: "During the race, Leo\'s heart was a drum." What does the writer mean?', type: 'choice', months: 126,
      options: [other('Leo played music'), right('Leo\'s heart was beating hard'), other('Leo was carrying a drum')], points: { correct: 2, wrong: 0 } },
    { text: 'Read: "Although Ana practiced every day, she still felt nervous before the show." Which is true?', type: 'choice', months: 138,
      options: [right('Ana practiced and was still nervous'), other('Ana never practiced'), other('Ana was not nervous because she practiced')], points: { correct: 2, wrong: 0 } },
  ],
  communication: [
    { text: 'Your friend says, "I went to the beach!" Which question helps you learn the most about the trip?', type: 'choice', months: 84,
      options: [other('"Was it a beach?"'), right('"What was your favorite part?"'), other('"Okay."')], points: { correct: 2, wrong: 0 } },
    { text: 'Why is this joke funny? "What do you call a sleeping dinosaur? A dino-snore!"', type: 'choice', months: 96,
      options: [right('"Snore" sounds like "saur"'), other('Dinosaurs are big'), other('It isn\'t a question')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia wants to explain to a little 3-year-old how to wash hands. Which is best?', type: 'choice', months: 108,
      options: [other('"Apply surfactant to the epidermis."'), right('"Soap, scrub, scrub, then rinse!"'), other('Say nothing and walk away')], points: { correct: 2, wrong: 0 } },
    { text: 'Noel says, "It\'s raining cats and dogs!" What does he mean?', type: 'choice', months: 120,
      options: [other('Pets are falling from the sky'), right('It\'s raining really hard'), other('The animals want to come inside')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia drops her ice cream and groans, "Oh, GREAT. Just perfect." How does she really feel?', type: 'choice', months: 132,
      options: [other('Happy and excited'), right('Upset'), other('Hungry for more')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia wants the class to plant a garden. Which reason would convince the most people?', type: 'choice', months: 144,
      options: [other('"Because I said so."'), right('"We could grow food to share and learn how plants grow."'), other('"Gardens are green."')], points: { correct: 2, wrong: 0 } },
  ],
  math: [
    { text: 'Which plate has MORE cookies? Plate A: 🍪🍪🍪🍪🍪  Plate B: 🍪🍪', type: 'choice', months: 48,
      options: [right('Plate A'), other('Plate B'), other('They are the same')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia has 8 cookies and gets 6 more. How many now?', type: 'choice', months: 84,
      options: [other('12'), right('14'), other('16')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia baked 45 cookies on Monday and 28 on Tuesday. How many altogether?', type: 'choice', months: 96,
      options: [other('63'), right('73'), other('83')], points: { correct: 2, wrong: 0 } },
    { text: 'There are 7 bags with 8 cookies in each bag. How many cookies?', type: 'choice', months: 108,
      options: [other('54'), right('56'), other('63')], points: { correct: 2, wrong: 0 } },
    { text: 'Which is the same amount as ½ of a pizza?', type: 'choice', months: 120,
      options: [right('2/4 of the pizza'), other('1/4 of the pizza'), other('2/3 of the pizza')], points: { correct: 2, wrong: 0 } },
    { text: 'Kailia makes 24 cookies a day for 6 days. How many cookies?', type: 'choice', months: 120,
      options: [other('124'), right('144'), other('148')], points: { correct: 2, wrong: 0 } },
    { text: 'What is 0.5 + 0.25?', type: 'choice', months: 132,
      options: [other('0.30'), right('0.75'), other('0.525')], points: { correct: 2, wrong: 0 } },
    { text: 'For every 2 chocolate cookies there are 3 sugar cookies. If there are 10 chocolate cookies, how many sugar cookies?', type: 'choice', months: 144,
      options: [other('12'), right('15'), other('13')], points: { correct: 2, wrong: 0 } },
  ],
};

// Each game's full ladder, easiest first.
export const BANK: Record<string, Question[]> = Object.fromEntries(
  GAMES.map(g => [g.key, [...g.questions, ...EXTRA_QUESTIONS[g.key as keyof typeof EXTRA_QUESTIONS]].sort((a, b) => a.months - b.months)]),
);

// Adaptive like a hearing test or an eye chart: start a little below the
// child's age, step up after a right answer, step down after a miss.
export const QUESTIONS_PER_GAME = 6;
export function firstQuestion(bank: Question[], ageMonths: number): number {
  const target = ageMonths * 0.85;
  let best = 0;
  bank.forEach((q, i) => { if (Math.abs(q.months - target) < Math.abs(bank[best].months - target)) best = i; });
  return best;
}
export function nextQuestion(bank: Question[], asked: number[], lastIdx: number, lastRight: boolean, ageMonths: number, rightIdx: number[] = []): number | null {
  // Normally never past the screen's ceiling (lib/milestones.ts), so a
  // proud or lucky run can't invent a 10-year-old level. But a child who
  // has got EVERY question at or above their age right may be really
  // ahead (Kelvin: "state facts with range"), so the ladder keeps climbing
  // (up to 1.6× their age) until it finds where their skills stop. Only a
  // range with that ceiling found is shown as "ahead".
  const aboveAge = asked.filter(i => bank[i].months >= ageMonths);
  const acedAboveAge = aboveAge.length >= 2 && aboveAge.every(i => rightIdx.includes(i));
  const roof = acedAboveAge ? aheadCeiling(ageMonths) : screenCeiling(ageMonths);
  const open = bank.map((_, i) => i).filter(i => !asked.includes(i) && bank[i].months <= roof);
  if (!open.length) return null;
  const up = open.filter(i => i > lastIdx), down = open.filter(i => i < lastIdx);
  if (lastRight && up.length) return up[0];
  if (!lastRight && down.length) return down[down.length - 1];
  return (lastRight ? down[down.length - 1] : up[0]) ?? null;
}

// Challenge round (results page, a grown-up's choice for a child they think
// is ahead): only questions above the child's age, up to challengeCeiling,
// a few per area, skipping any already answered in the placement. Same
// step-up / step-down rule, so it finds where the child's skills stop.
export const CHALLENGE_QS = 4;
export const CHALLENGE_STEPS = [0, 2, 3]; // reading, communication, math (no tracing)
export function challengeOpen(bank: Question[], ageMonths: number, skip: number[], asked: number[]): number[] {
  const roof = challengeCeiling(ageMonths);
  return bank.map((_, i) => i).filter(i => bank[i].months > ageMonths && bank[i].months <= roof && !skip.includes(i) && !asked.includes(i));
}
export function nextChallenge(bank: Question[], ageMonths: number, skip: number[], asked: number[], lastIdx: number, lastRight: boolean): number | null {
  const open = challengeOpen(bank, ageMonths, skip, asked);
  if (!open.length) return null;
  if (lastIdx < 0) return open[0];
  const up = open.filter(i => i > lastIdx), down = open.filter(i => i < lastIdx);
  if (lastRight) return up[0] ?? null;
  // A miss with nothing easier left to try is the ceiling: stop here, so a
  // lucky guess on a harder question can't stretch the range.
  return down[down.length - 1] ?? null;
}

/** One answer in the placement, as the page records it. */
export interface PlacementAnswer { idx: number; right: boolean; months: number }

/**
 * After an answer: the next placement question to ask, or null when this
 * area is done. Six questions, plus up to two extra rungs for a child who
 * got everything above their age right (to find their ceiling).
 */
export function nextPlacementQuestion(bank: Question[], answers: PlacementAnswer[], ageMonths: number): number | null {
  const asked = answers.map(a => a.idx);
  const last = answers[answers.length - 1];
  const isLastQ = asked.length >= Math.min(QUESTIONS_PER_GAME, bank.length);
  const aceExtra = answers.length >= QUESTIONS_PER_GAME && answers.filter(a => a.months >= ageMonths).every(a => a.right)
    && answers.some(a => a.months >= ageMonths) && asked.length < QUESTIONS_PER_GAME + 2;
  if (isLastQ && !aceExtra) return null;
  return nextQuestion(bank, asked, last.idx, last.right, ageMonths, answers.filter(a => a.right).map(a => a.idx));
}

