// ── Milestone ladders + developmental-age estimator ──
//
// The single place that decides how answers become a developmental-age
// RANGE. Parent-facing only: ages appear on /results and /progress, never
// on a child screen (CLAUDE.md, Kelvin 2026-10-21). Nothing here imports
// app code, so it can be checked on its own: node scripts/milestones.test.mjs
//
// HOW IT WORKS (plain English, for clinical review)
// 1. Every skill area has a LADDER of milestones, each tagged with the age
//    in months by which MOST children (about 3 in 4) can do it. Under 5 we
//    use the CDC/AAP "Learn the Signs. Act Early." checklists (2022
//    revision), which were deliberately set at the age ~75% of children
//    reach the skill. Fine-motor items not on the CDC list use classic OT
//    norms (Beery VMI shape copying, scissor and grasp progressions).
//    School-age items use end-of-grade U.S. standards (Common Core ELA and
//    Math, ASHA language expectations): end of K ≈ 6 yrs, Grade 1 ≈ 7 …
//    Grade 6 ≈ 12.
// 2. The parent questionnaire starts with milestones around the child's
//    own age, then works like a standardized test's "basal and ceiling":
//    if the hardest ones were all "yes" it asks a few harder ones; if the
//    easiest ones weren't all "yes" it asks a few easier ones. That keeps
//    a child who is ahead or behind from hitting the top or bottom of a
//    fixed list.
// 3. Each answer is weighed with a simple item-response model: a child
//    whose skills sit right at a milestone's age has a 75% chance of a
//    "yes", more if they're older developmentally, less if younger.
//    "Sometimes" counts as half. Combining every answer gives a likelihood
//    for each possible developmental age; the middle 80% of that becomes
//    the range we show ("about 2½ to 3½ years"). Fewer or mixed answers
//    honestly produce a wider range.
// 4. A gentle pull toward the child's real age (a weak "prior") keeps a
//    handful of answers from producing an extreme estimate.
//
// Tuning knobs are the constants just below. Item ages can be edited
// freely; nothing else needs to change.

export type MilestoneDomain = 'communication' | 'reading' | 'writing' | 'math';
export const MILESTONE_DOMAINS: MilestoneDomain[] = ['communication', 'reading', 'writing', 'math'];

export interface Milestone {
  id: string;
  months: number;  // age by which most (~75%) children do this
  q: string;       // asked to the parent
  src: 'CDC' | 'OT' | 'ASHA' | 'CCSS' | 'Dev'; // where the age comes from
}

/** One observation fed to the estimator. */
export interface Evidence {
  id: string;
  months: number;  // the item's typical age
  r: number;       // 1 = yes / correct, 0.5 = sometimes, 0 = not yet / missed
  kind: 'parent' | 'choice3' | 'observed';
}

export interface AgeEstimate {
  low: number;     // months, 10th percentile
  mid: number;     // months, median
  high: number;    // months, 90th percentile
  items: number;   // how many answers it rests on
}

// ─── Model constants (review with real data) ─────────────────────────────
const SPREAD = 0.13;            // how gradually a skill "switches on" (log-age units)
const AT_AGE_PASS = 0.75;       // pass chance for a child exactly at the milestone age
const PRIOR_SD = 0.45;          // weak pull toward real age (log units; ≈ ±45%)
const MIN_M = 1, MAX_M = 192;   // search 1 month … 16 years
const GUESS: Record<Evidence['kind'], number> = { parent: 0.03, choice3: 1 / 3, observed: 0.05 };
const LAPSE = 0.04;             // a capable child still sometimes slips

// ─── Ladders ─────────────────────────────────────────────────────────────
// Ordered easy → hard. Keep ids stable: saved answers refer to them.

export const LADDERS: Record<MilestoneDomain, Milestone[]> = {
  communication: [
    { id: 'c-coo',        months: 4,   src: 'CDC', q: 'Does your baby coo or make sounds back when you talk to them?' },
    { id: 'c-turns',      months: 6,   src: 'CDC', q: 'Does your baby take turns making sounds with you, or squeal and laugh?' },
    { id: 'c-babble',     months: 9,   src: 'CDC', q: 'Does your baby babble repeated sounds like "mamama" or "bababa"?' },
    { id: 'c-armsup',     months: 9,   src: 'CDC', q: 'Does your baby lift their arms to be picked up?' },
    { id: 'c-wave',       months: 12,  src: 'CDC', q: 'Does your child wave bye-bye?' },
    { id: 'c-mama',       months: 12,  src: 'CDC', q: 'Does your child call you "mama," "dada," or another special name?' },
    { id: 'c-no',         months: 12,  src: 'CDC', q: 'Does your child understand "no" (pauses or stops when you say it)?' },
    { id: 'c-2words',     months: 15,  src: 'CDC', q: 'Does your child say one or two words besides "mama" or "dada," like "ba" for ball?' },
    { id: 'c-gesturedir', months: 15,  src: 'CDC', q: 'Does your child follow a direction given with words AND a gesture, like "give me the toy" while you hold out your hand?' },
    { id: 'c-3words',     months: 18,  src: 'CDC', q: 'Does your child try to say three or more words besides "mama" or "dada"?' },
    { id: 'c-1step',      months: 18,  src: 'CDC', q: 'Does your child follow a one-step direction with NO gesture, like "give it to me"?' },
    { id: 'c-2together',  months: 24,  src: 'CDC', q: 'Does your child put two words together, like "more milk" or "bye daddy"?' },
    { id: 'c-gestures',   months: 24,  src: 'CDC', q: 'Does your child use gestures beyond waving and pointing, like blowing a kiss or nodding yes?' },
    { id: 'c-50words',    months: 30,  src: 'CDC', q: 'Does your child say about 50 words?' },
    { id: 'c-pronouns',   months: 30,  src: 'CDC', q: 'Does your child use words like "I," "me," or "we"?' },
    { id: 'c-action',     months: 30,  src: 'CDC', q: 'Does your child say two or more words that include an action word, like "doggie run"?' },
    { id: 'c-convo2',     months: 36,  src: 'CDC', q: 'Does your child talk with you in a conversation, going back and forth at least two times?' },
    { id: 'c-whq',        months: 36,  src: 'CDC', q: 'Does your child ask "who," "what," "where," or "why" questions?' },
    { id: 'c-intelligible', months: 36, src: 'CDC', q: 'Can people outside the family understand most of what your child says?' },
    { id: 'c-4words',     months: 48,  src: 'CDC', q: 'Does your child say sentences with four or more words?' },
    { id: 'c-tellday',    months: 48,  src: 'CDC', q: 'Does your child tell you about at least one thing that happened during their day?' },
    { id: 'c-whatfor',    months: 48,  src: 'CDC', q: 'Does your child answer simple questions like "What is a coat for?"' },
    { id: 'c-story2',     months: 60,  src: 'CDC', q: 'Does your child tell a story they heard or made up, with at least two events?' },
    { id: 'c-convo3',     months: 60,  src: 'CDC', q: 'Does your child keep a conversation going for more than three back-and-forth turns?' },
    { id: 'c-bookq',      months: 60,  src: 'CDC', q: 'After you read a book together, does your child answer simple questions about it?' },
    { id: 'c-3step',      months: 72,  src: 'ASHA', q: 'Does your child follow three-step directions, like "get your shoes, put them on, and wait by the door"?' },
    { id: 'c-retell',     months: 72,  src: 'CCSS', q: 'Does your child retell a story with a clear beginning, middle, and end?' },
    { id: 'c-explain',    months: 84,  src: 'CCSS', q: 'Does your child explain how or why something happens, in complete sentences?' },
    { id: 'c-askmore',    months: 84,  src: 'CCSS', q: 'Does your child ask questions to find out more about what someone said?' },
    { id: 'c-jokes',      months: 96,  src: 'ASHA', q: 'Does your child understand and tell jokes or riddles that play on words?' },
    { id: 'c-listener',   months: 102, src: 'ASHA', q: 'Does your child change how they talk for different listeners, like a baby versus a teacher?' },
    { id: 'c-report',     months: 108, src: 'CCSS', q: 'Can your child give a short talk about a topic, with facts and details in a sensible order?' },
    { id: 'c-idioms',     months: 120, src: 'CCSS', q: 'Does your child understand sayings that don\'t mean exactly what they say, like "break a leg"?' },
    { id: 'c-summarize',  months: 126, src: 'CCSS', q: 'Can your child sum up what someone else said in a discussion?' },
    { id: 'c-sarcasm',    months: 132, src: 'Dev',  q: 'Does your child pick up on sarcasm or a joking tone of voice?' },
    { id: 'c-argue',      months: 144, src: 'CCSS', q: 'Can your child make a convincing argument, giving reasons and answering the other side?' },
  ],
  reading: [
    { id: 'r-voice',      months: 4,   src: 'CDC', q: 'Does your baby turn toward the sound of your voice?' },
    { id: 'r-lookbook',   months: 7,   src: 'Dev', q: 'Does your baby look at bright pictures or a book with you, even briefly?' },
    { id: 'r-patpics',    months: 10,  src: 'ASHA', q: 'Does your baby pat or touch the pictures in a book?' },
    { id: 'r-lookname',   months: 13,  src: 'ASHA', q: 'When you name a familiar person or thing ("Where\'s the dog?"), does your child look at it?' },
    { id: 'r-pages',      months: 15,  src: 'ASHA', q: 'Does your child help turn the pages of a board book (several at once is fine)?' },
    { id: 'r-bringbook',  months: 18,  src: 'ASHA', q: 'Does your child bring you a book to read together?' },
    { id: 'r-pointpic',   months: 24,  src: 'CDC', q: 'Does your child point to pictures in a book when you ask, like "Where\'s the cat?"' },
    { id: 'r-namepic',    months: 30,  src: 'CDC', q: 'Does your child name pictures in a book when you point and ask "What\'s this?"' },
    { id: 'r-fillin',     months: 33,  src: 'ASHA', q: 'Does your child fill in a missing word in a favorite rhyme, song, or book?' },
    { id: 'r-pretend',    months: 36,  src: 'ASHA', q: 'Does your child pretend to read, telling the story from the pictures?' },
    { id: 'r-logos',      months: 42,  src: 'ASHA', q: 'Does your child recognize familiar signs or logos, like a favorite store\'s sign?' },
    { id: 'r-ownname',    months: 48,  src: 'ASHA', q: 'Does your child recognize their own name in print?' },
    { id: 'r-rhymewords', months: 48,  src: 'CDC', q: 'Does your child say some of the words from a song, story, or nursery rhyme?' },
    { id: 'r-rhyme',      months: 54,  src: 'ASHA', q: 'Does your child notice when two words rhyme, like "cat" and "hat"?' },
    { id: 'r-letters',    months: 60,  src: 'CCSS', q: 'Does your child name most of the capital letters?' },
    { id: 'r-sounds',     months: 66,  src: 'CCSS', q: 'Does your child know the sounds some letters make, like "B says /b/"?' },
    { id: 'r-cvc',        months: 72,  src: 'CCSS', q: 'Does your child read simple words like "cat," "dog," and "sun" by sounding them out?' },
    { id: 'r-sight',      months: 72,  src: 'CCSS', q: 'Does your child read some common words by sight, like "the," "and," and "is"?' },
    { id: 'r-easybooks',  months: 84,  src: 'CCSS', q: 'Does your child read simple storybooks on their own, sounding out new words?' },
    { id: 'r-chapter',    months: 96,  src: 'CCSS', q: 'Does your child read short chapter books smoothly, with expression?' },
    { id: 'r-retellread', months: 96,  src: 'CCSS', q: 'Can your child retell what happened in a story they read by themselves?' },
    { id: 'r-mainidea',   months: 108, src: 'CCSS', q: 'Does your child read to learn new facts, and tell you the main idea?' },
    { id: 'r-infer',      months: 120, src: 'CCSS', q: 'Can your child work out something a book doesn\'t say directly, like why a character acted a certain way?' },
    { id: 'r-compare',    months: 132, src: 'CCSS', q: 'Can your child compare two books or articles about the same topic?' },
    { id: 'r-theme',      months: 144, src: 'CCSS', q: 'Can your child explain the theme or lesson of a longer book, with examples?' },
  ],
  writing: [
    { id: 'w-hold',       months: 4,   src: 'CDC', q: 'Does your baby hold a toy when you put it in their hand?' },
    { id: 'w-reach',      months: 6,   src: 'CDC', q: 'Does your baby reach out to grab a toy they want?' },
    { id: 'w-transfer',   months: 9,   src: 'CDC', q: 'Does your baby move a toy from one hand to the other?' },
    { id: 'w-rake',       months: 9,   src: 'CDC', q: 'Does your baby rake small food toward themselves with their fingers?' },
    { id: 'w-pincer',     months: 12,  src: 'CDC', q: 'Does your child pick up small things, like a piece of cereal, between thumb and pointer finger?' },
    { id: 'w-incup',      months: 12,  src: 'CDC', q: 'Does your child put something into a container, like a block into a cup?' },
    { id: 'w-stack2',     months: 15,  src: 'CDC', q: 'Does your child stack at least two small blocks?' },
    { id: 'w-scribble',   months: 18,  src: 'CDC', q: 'Does your child scribble with a crayon?' },
    { id: 'w-cup',        months: 18,  src: 'CDC', q: 'Does your child drink from a cup without a lid (some spills are fine) and feed themselves with fingers?' },
    { id: 'w-spoon',      months: 24,  src: 'CDC', q: 'Does your child eat with a spoon?' },
    { id: 'w-stack6',     months: 24,  src: 'OT',  q: 'Does your child stack 4 to 6 blocks?' },
    { id: 'w-twist',      months: 30,  src: 'CDC', q: 'Does your child twist things, like turning a doorknob or unscrewing a lid?' },
    { id: 'w-onepage',    months: 30,  src: 'CDC', q: 'Does your child turn book pages one at a time?' },
    { id: 'w-vline',      months: 30,  src: 'OT',  q: 'After watching you, does your child draw a straight up-and-down line?' },
    { id: 'w-beads',      months: 36,  src: 'CDC', q: 'Does your child string large beads or pasta onto a string?' },
    { id: 'w-circle',     months: 36,  src: 'CDC', q: 'Does your child draw a circle after you show them how?' },
    { id: 'w-snip',       months: 36,  src: 'OT',  q: 'Does your child snip paper with child scissors?' },
    { id: 'w-fingers',    months: 48,  src: 'CDC', q: 'Does your child hold a crayon or pencil between fingers and thumb, not in a fist?' },
    { id: 'w-unbutton',   months: 48,  src: 'CDC', q: 'Does your child undo some buttons?' },
    { id: 'w-cross',      months: 48,  src: 'OT',  q: 'Does your child copy a cross (+)?' },
    { id: 'w-cutline',    months: 54,  src: 'OT',  q: 'Does your child cut along a straight line with scissors?' },
    { id: 'w-button',     months: 60,  src: 'CDC', q: 'Does your child do up some buttons?' },
    { id: 'w-nameletters', months: 60, src: 'CDC', q: 'Does your child write some of the letters in their name?' },
    { id: 'w-square',     months: 60,  src: 'OT',  q: 'Does your child copy a square with four clear corners?' },
    { id: 'w-cutcircle',  months: 66,  src: 'OT',  q: 'Does your child cut out a simple shape like a circle, staying close to the line?' },
    { id: 'w-name',       months: 72,  src: 'CCSS', q: 'Does your child write their first name clearly?' },
    { id: 'w-triangle',   months: 72,  src: 'OT',  q: 'Does your child copy a triangle?' },
    { id: 'w-shoes',      months: 78,  src: 'OT',  q: 'Does your child tie their shoes (slowly is fine)?' },
    { id: 'w-print',      months: 84,  src: 'CCSS', q: 'Does your child print all the letters clearly, mostly sitting on the line?' },
    { id: 'w-sentences',  months: 96,  src: 'CCSS', q: 'Does your child write a few sentences with spaces between words and letters the right size?' },
    { id: 'w-steady',     months: 108, src: 'OT',  q: 'Does your child write neatly at a steady speed without their hand tiring quickly?' },
    { id: 'w-page',       months: 120, src: 'CCSS', q: 'Does your child write a paragraph or more that others can easily read?' },
    { id: 'w-copyboard',  months: 132, src: 'OT',  q: 'Does your child take notes or copy from the board quickly and accurately?' },
    { id: 'w-long',       months: 144, src: 'CCSS', q: 'Does your child write several paragraphs neatly, by hand or on a keyboard?' },
  ],
  math: [
    { id: 'm-watch',      months: 3,   src: 'CDC', q: 'Does your baby follow a moving toy or face with their eyes?' },
    { id: 'm-mouth',      months: 6,   src: 'CDC', q: 'Does your baby put things in their mouth to explore them?' },
    { id: 'm-dropped',    months: 9,   src: 'CDC', q: 'Does your baby look for a toy when it drops out of sight?' },
    { id: 'm-bang',       months: 9,   src: 'CDC', q: 'Does your baby bang two things together?' },
    { id: 'm-hidden',     months: 12,  src: 'CDC', q: 'Does your child find a toy they watched you hide, like under a blanket?' },
    { id: 'm-useright',   months: 15,  src: 'CDC', q: 'Does your child try to use things the right way, like a phone, cup, or book?' },
    { id: 'm-chores',     months: 18,  src: 'CDC', q: 'Does your child copy you doing chores, like sweeping?' },
    { id: 'm-pushcar',    months: 18,  src: 'CDC', q: 'Does your child play with toys in a simple way, like pushing a toy car?' },
    { id: 'm-switches',   months: 24,  src: 'CDC', q: 'Does your child try to work switches, knobs, or buttons on a toy?' },
    { id: 'm-sorter',     months: 24,  src: 'Dev', q: 'Does your child finish a simple shape sorter or a 2–3 piece puzzle?' },
    { id: 'm-pretend',    months: 30,  src: 'CDC', q: 'Does your child pretend, like feeding a doll or using a block as a phone?' },
    { id: 'm-stool',      months: 30,  src: 'CDC', q: 'Does your child solve simple problems, like standing on a stool to reach something?' },
    { id: 'm-onecolor',   months: 30,  src: 'CDC', q: 'Does your child know at least one color (for example, picks the red crayon when asked)?' },
    { id: 'm-one',        months: 33,  src: 'Dev', q: 'When you ask for just one, does your child give you exactly one?' },
    { id: 'm-sort',       months: 42,  src: 'Dev', q: 'Does your child sort things by color or by shape?' },
    { id: 'm-colors',     months: 48,  src: 'CDC', q: 'Does your child name a few colors?' },
    { id: 'm-nextstory',  months: 48,  src: 'CDC', q: 'Does your child tell what comes next in a story they know well?' },
    { id: 'm-more',       months: 48,  src: 'Dev', q: 'Can your child tell which group has more, like 5 crackers versus 2?' },
    { id: 'm-count5',     months: 54,  src: 'Dev', q: 'Does your child count 5 objects correctly, touching each one once?' },
    { id: 'm-count10',    months: 60,  src: 'CDC', q: 'Does your child count to 10?' },
    { id: 'm-numerals',   months: 60,  src: 'CDC', q: 'Does your child name some numbers from 1 to 5 when you point to them?' },
    { id: 'm-addobj',     months: 66,  src: 'CCSS', q: 'Does your child solve little adding problems with fingers or objects, like 2 + 3?' },
    { id: 'm-within5',    months: 72,  src: 'CCSS', q: 'Does your child add and take away within 5 quickly, without objects?' },
    { id: 'm-within20',   months: 84,  src: 'CCSS', q: 'Does your child add and subtract within 20, like 8 + 6 or 13 − 5?' },
    { id: 'm-2digit',     months: 96,  src: 'CCSS', q: 'Does your child add and subtract two-digit numbers, like 45 + 28?' },
    { id: 'm-timemoney',  months: 96,  src: 'CCSS', q: 'Does your child tell time to five minutes and count coins?' },
    { id: 'm-times',      months: 108, src: 'CCSS', q: 'Does your child know multiplication facts, like 6 × 7?' },
    { id: 'm-fractions',  months: 108, src: 'CCSS', q: 'Does your child understand simple fractions, like ½ and ¼ of a pizza?' },
    { id: 'm-multidigit', months: 120, src: 'CCSS', q: 'Does your child multiply bigger numbers, like 24 × 6, and divide with remainders?' },
    { id: 'm-equivfrac',  months: 120, src: 'CCSS', q: 'Does your child know that 2/4 is the same as 1/2?' },
    { id: 'm-decimals',   months: 132, src: 'CCSS', q: 'Does your child add fractions and work with decimals, like 0.5 + 0.25?' },
    { id: 'm-ratio',      months: 144, src: 'CCSS', q: 'Does your child solve ratio or percent problems, like "20% off"?' },
  ],
};

const BY_ID: Record<string, Milestone> = Object.fromEntries(
  MILESTONE_DOMAINS.flatMap(d => LADDERS[d].map(m => [m.id, m])),
);
export function milestoneById(id: string): Milestone | undefined { return BY_ID[id]; }

// ─── Choosing questions (start near age, then basal / ceiling) ───────────

export const START_ITEMS = 6;
export const MAX_ITEMS = 12;
export const MAX_EXTRA_ROUNDS = 3;

/** The first questions for one area: spread across about 0.6× to 1.3× the child's age. */
export function startingItems(domain: MilestoneDomain, ageMonths: number): Milestone[] {
  const ladder = LADDERS[domain];
  const age = Math.max(3, ageMonths);
  let pool = ladder.filter(m => m.months >= age * 0.6 && m.months <= age * 1.3);
  if (pool.length < 4) {
    // Too few nearby (very young or very old) — take the closest by age ratio.
    pool = [...ladder]
      .sort((a, b) => Math.abs(Math.log(a.months / age)) - Math.abs(Math.log(b.months / age)))
      .slice(0, 4);
  }
  pool.sort((a, b) => a.months - b.months);
  if (pool.length <= START_ITEMS) return pool;
  // Evenly spread, always keeping the easiest and the hardest.
  const picked: Milestone[] = [];
  for (let i = 0; i < START_ITEMS; i++) {
    picked.push(pool[Math.round((i * (pool.length - 1)) / (START_ITEMS - 1))]);
  }
  return [...new Set(picked)];
}

/**
 * After a round of answers, the same "basal and ceiling" idea standardized
 * tests use: keep going harder until at least two "not yet" answers sit
 * above the child's skills (a ceiling), and easier until at least two
 * "yes" answers sit below them (a basal). Empty once both are found.
 */
export function followUpItems(
  domain: MilestoneDomain,
  asked: Milestone[],
  answers: Record<string, number>,   // id → 1 / 0.5 / 0
): Milestone[] {
  if (asked.length >= MAX_ITEMS) return [];
  const ladder = LADDERS[domain];
  const askedIds = new Set(asked.map(m => m.id));
  const sorted = [...asked].sort((a, b) => a.months - b.months);
  const lo = sorted[0].months, hi = sorted[sorted.length - 1].months;
  const yes = sorted.filter(m => answers[m.id] === 1);
  const notYet = sorted.filter(m => answers[m.id] === 0);
  const extra: Milestone[] = [];

  // Ceiling: two "not yet"s, and the hardest answer isn't a "yes".
  const needCeiling = notYet.length < 2 || answers[sorted[sorted.length - 1].id] === 1;
  // Basal: two "yes"es, and the easiest answer is a "yes".
  const needBasal = yes.length < 2 || answers[sorted[0].id] !== 1;
  if (needCeiling) extra.push(...ladder.filter(m => !askedIds.has(m.id) && m.months > hi).slice(0, 2));
  if (needBasal) extra.push(...ladder.filter(m => !askedIds.has(m.id) && m.months < lo).slice(-2));
  return extra.slice(0, MAX_ITEMS - asked.length).sort((a, b) => a.months - b.months);
}

// ─── The estimator ───────────────────────────────────────────────────────

const GRID: number[] = (() => {
  const g: number[] = [];
  const steps = 360;
  for (let i = 0; i <= steps; i++) g.push(Math.exp(Math.log(MIN_M) + (i / steps) * (Math.log(MAX_M) - Math.log(MIN_M))));
  return g;
})();

const OFFSET = Math.log(AT_AGE_PASS / (1 - AT_AGE_PASS)); // pass = 75% when dev age = item age

function passChance(devMonths: number, e: Evidence): number {
  const core = 1 / (1 + Math.exp(-((Math.log(devMonths) - Math.log(e.months)) / SPREAD + OFFSET)));
  const g = GUESS[e.kind];
  return g + (1 - g - LAPSE) * core;
}

/** Developmental-age range from a set of answers. Null when there's nothing to go on. */
export function estimateAge(evidence: Evidence[], ageMonths: number | null): AgeEstimate | null {
  if (!evidence.length) return null;
  const logPost = GRID.map(d => {
    let lp = 0;
    if (ageMonths && ageMonths > 0) {
      const z = (Math.log(d) - Math.log(ageMonths)) / PRIOR_SD;
      lp -= 0.5 * z * z;
    }
    for (const e of evidence) {
      const p = passChance(d, e);
      lp += e.r * Math.log(p) + (1 - e.r) * Math.log(1 - p);
    }
    return lp;
  });
  const max = Math.max(...logPost);
  const w = logPost.map(v => Math.exp(v - max));
  const total = w.reduce((a, b) => a + b, 0);
  const quantile = (q: number) => {
    let acc = 0;
    for (let i = 0; i < GRID.length; i++) {
      acc += w[i] / total;
      if (acc >= q) return GRID[i];
    }
    return GRID[GRID.length - 1];
  };
  return { low: quantile(0.1), mid: quantile(0.5), high: quantile(0.9), items: evidence.length };
}

// ─── Plain-language output ───────────────────────────────────────────────

function halfYears(h: number): string {
  const whole = Math.floor(h);
  const half = h - whole >= 0.5;
  if (whole === 0) return '½';
  return `${whole}${half ? '½' : ''}`;
}

/** "about 14 to 18 months", "about 2½ to 3½ years" — always a range. */
export function formatAgeRange(est: AgeEstimate): string {
  let lo = est.low;
  const hi = est.high;
  if (hi < 24) {
    let a = Math.max(1, Math.round(lo)), b = Math.round(hi);
    if (b - a < 2) { a = Math.max(1, a - 1); b = a + 2; }
    return `about ${a} to ${b} months`;
  }
  lo = Math.max(lo, 1);
  if (lo < 24) {
    const a = Math.max(1, Math.round(lo));
    const b = Math.max(2.5, Math.round(hi / 6) / 2);
    return `about ${a} months to ${halfYears(b)} years`;
  }
  // Nearest half year (floor/ceil would widen every range by up to a year).
  let a = Math.round(lo / 6) / 2, b = Math.round(hi / 6) / 2;
  if (b - a < 1) {
    // Very consistent answers can give a narrow range; still show at least a year, centred.
    const centre = (lo + hi) / 24;
    a = Math.max(2, Math.round((centre - 0.5) * 2) / 2);
    b = a + 1;
  }
  if (b > 12) return a >= 12 ? 'about 12 years or more' : `about ${halfYears(a)} to 12+ years`;
  return `about ${halfYears(a)} to ${halfYears(b)} years`;
}

export type AgeComparison = 'ahead' | 'onTrack' | 'growing';

/**
 * How the range sits next to the child's real age. "growing" only when
 * even the TOP of the range is clearly below their age — the same idea as
 * the CDC's "talk with your doctor" prompt. Never shown to the child.
 */
export function compareToAge(est: AgeEstimate, ageMonths: number | null): AgeComparison {
  if (!ageMonths) return 'onTrack';
  if (est.high < ageMonths * 0.85 - 1) return 'growing';
  if (est.low > ageMonths * 1.12 + 1) return 'ahead';
  return 'onTrack';
}

export const COMPARISON_TEXT: Record<AgeComparison, { label: string; color: string; note: string }> = {
  ahead:   { label: 'Ahead of their age',   color: '#059669', note: 'Already doing things most children a bit older do.' },
  onTrack: { label: 'Right around their age', color: '#2563EB', note: 'Doing what most children their age do.' },
  growing: { label: 'A skill to grow',      color: '#D97706', note: 'Some skills most children this age have aren\'t showing yet. Worth practicing, and worth mentioning at the next check-up.' },
};

/** Whole months from a birth month/year (assumes mid-month birth). */
export function ageInMonths(birthYear: number, birthMonth: number, now = new Date()): number {
  const m = (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - birthMonth) + (now.getDate() - 15) / 30;
  return Math.max(0, Math.round(m * 10) / 10);
}
