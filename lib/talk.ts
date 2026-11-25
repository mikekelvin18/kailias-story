// ── "Your turn to talk" ──
// Now and then Kailia stops in the story or a talking game, her mouth icon
// bounces, and she invites the child to say something out loud: an animal
// noise, a word, a little phrase, or the story in their own words. Then she
// waits (3, 5 or 8 seconds, the grown-ups choose) and carries on.
//
// Nothing is ever recorded: the app never asks for the microphone. A
// grown-up can tap a small corner button to note how it went ("Said it",
// "Tried", "Not yet"). Only that tap is saved, on this device, under the
// child's profile (`kailia_talk_v1`, in CHILD_DATA_KEYS), and the parent
// pages show it as gentle notes under "Talking & listening", never a score.
//
// The words match the six printable "Talking practice" cards
// (lib/worksheets.ts, `talk-practice`), so what a child practises on paper
// is what Kailia asks for in the games.

import { activeChild, hasActiveConsent, scopedKey } from './family';
import { ageInMonths } from './milestones';
import { loadA11y, TALK_WAITS } from './accessibility';

/** How a child is invited to talk, by age (Grok review, 2026-11-25). */
export type TalkBand = 'together' | 'little' | 'early' | 'big';
export const TALK_BAND_INFO: Record<TalkBand, { label: string; asks: string }> = {
  together: { label: 'under 3', asks: 'sounds and animal noises' },
  little:   { label: '3–4',     asks: 'single words' },
  early:    { label: '5–6',     asks: 'short phrases and "what happens next?"' },
  big:      { label: '7 and up', asks: 'telling the story in their own words and naming feelings' },
};

/** The talking band from the child's birth month and year (no profile = 'little'). */
export function talkBand(months?: number | null): TalkBand {
  let m = months ?? null;
  if (m == null) {
    const c = typeof window !== 'undefined' ? activeChild() : null;
    m = c ? ageInMonths(c.birthYear, c.birthMonth) : null;
  }
  if (m == null) return 'little';
  if (m < 36) return 'together';
  if (m < 60) return 'little';
  if (m < 84) return 'early';
  return 'big';
}

/** The six talking words: one per printable card, each with something to say at every band. */
export interface TalkWord {
  id: string;
  word: string;
  /** a picture under public/ (painted art the games already use) */
  art: string;
  /** together: a sound to copy */
  sound: string;
  /** early: a short phrase to say */
  phrase: string;
  /** big: something to tell */
  tell: string;
}

export const TALK_WORDS: TalkWord[] = [
  { id: 'firefly', word: 'firefly', art: '/art/lands/firefly-forest.webp',
    sound: 'Can you whisper "glow, glow"?', phrase: 'The firefly is glowing.', tell: 'Where do you think the fireflies fly at night?' },
  { id: 'dragon', word: 'dragon', art: '/art/pets/ember.webp',
    sound: 'Can you roar like a dragon? Rawr!', phrase: 'The dragon is hungry.', tell: 'How do you think the dragon feels when it shares?' },
  { id: 'owl', word: 'owl', art: '/art/pets/sage.webp',
    sound: 'Can you hoot like an owl? Hoo, hoo!', phrase: 'The owl can fly up high.', tell: 'What would you ask a wise owl?' },
  { id: 'panda', word: 'panda', art: '/characters/painted/noel/portrait-front.png',
    sound: 'Can you yawn like a sleepy panda? Aaah!', phrase: 'Noel is my friend.', tell: 'What do you think Noel will do next?' },
  { id: 'bee', word: 'bee', art: '/art/critters/bee.webp',
    sound: 'Can you buzz like a bee? Bzzz!', phrase: 'The bee likes flowers.', tell: 'Tell me about a time you saw a bee.' },
  { id: 'frog', word: 'frog', art: '/art/critters/frog.webp',
    sound: 'Can you croak like a frog? Ribbit!', phrase: 'The frog can jump.', tell: 'Tell me the story of the frog in your own words.' },
];

/** Where Kailia stops to let the child talk. */
export type TalkPlace = 'story' | 'story-sparks' | 'trail-walk' | 'echo-song';

// Each place leans on the words that live there, plus its own "what
// happens next?" and "tell it back" invitations for the older bands.
const PLACE_WORDS: Record<TalkPlace, string[]> = {
  story: ['panda', 'firefly', 'dragon'],
  'story-sparks': ['dragon', 'frog', 'panda'],
  'trail-walk': ['owl', 'bee', 'firefly'],
  'echo-song': ['bee', 'frog', 'owl'],
};
const PLACE_NEXT: Record<TalkPlace, string[]> = {
  story: ['What do you think we will find on the map?', 'Which land do you want to visit first? Why?'],
  'story-sparks': ['What do you think happens next in the story?', 'What do you think Noel will do?'],
  'trail-walk': ['Where do you think the trail goes next?', 'Who do you think we will meet on the trail?'],
  'echo-song': ['Can you sing the song back to me?', 'What does this song sound like to you?'],
};
const PLACE_TELL: Record<TalkPlace, string[]> = {
  story: ['Can you tell me our story so far, in your own words?', 'How do you feel about going on an adventure?'],
  'story-sparks': ['Can you tell me this story so far, in your own words?', 'How do you think everyone in the story feels right now?'],
  'trail-walk': ['Can you tell me what happened on the trail so far?', 'How would you feel if you met a wild animal on the trail?'],
  'echo-song': ['Can you tell me what the echo song was like?', 'How does this song make you feel? Happy? Sleepy?'],
};

export interface TalkPrompt {
  /** stable id for the parent notes ("dragon-sound", "story-sparks-next-1"...), never free text */
  id: string;
  /** what Kailia says, starting with "Your turn!" */
  text: string;
  /** the word the child is invited to say, when there is one (shown big) */
  word?: string;
  band: TalkBand;
}

/** Kailia's invitation for this place, band and turn number (n picks a different one each time). */
export function talkPrompt(place: TalkPlace, band: TalkBand, n = 0): TalkPrompt {
  const words = PLACE_WORDS[place].map(id => TALK_WORDS.find(w => w.id === id)!);
  const w = words[n % words.length];
  if (band === 'together') return { id: `${w.id}-sound`, text: `Your turn! ${w.sound}`, band };
  if (band === 'little') return { id: `${w.id}-word`, text: `Your turn! Can you say "${w.word}"?`, word: w.word, band };
  if (band === 'early') {
    // every other turn: a phrase to say, or "what happens next?"
    if (n % 2 === 0) { const say = w.phrase.replace(/\.$/, ''); return { id: `${w.id}-phrase`, text: `Your turn! Can you say "${say}"?`, word: say, band }; }
    const i = Math.floor(n / 2) % PLACE_NEXT[place].length;
    return { id: `${place}-next-${i}`, text: `Your turn! ${PLACE_NEXT[place][i]}`, band };
  }
  const i = n % PLACE_TELL[place].length;
  return { id: `${place}-tell-${i}`, text: `Your turn! ${PLACE_TELL[place][i]}`, band };
}

/** Every sentence Kailia can say here (for recording her voice ahead of time). */
export function allTalkLines(): string[] {
  const out = new Set<string>();
  (Object.keys(PLACE_WORDS) as TalkPlace[]).forEach(place => {
    (['together', 'little', 'early', 'big'] as TalkBand[]).forEach(band => {
      for (let n = 0; n < 6; n++) out.add(talkPrompt(place, band, n).text);
    });
  });
  TALK_THANKS.forEach(t => out.add(t));
  return [...out];
}

/** What Kailia says when the wait is over: thanks for any try, never "wrong". */
export const TALK_THANKS = ['Thank you! I love hearing you.', 'Great talking! Let\'s keep going.', 'Ooh, I liked that! On we go.'];

// ── Settings ──
export function talkPausesOn(): boolean { return loadA11y().talkPauses !== false; }
export function talkWaitSeconds(): number {
  const w = Number(loadA11y().talkWait);
  return (TALK_WAITS as readonly number[]).includes(w) ? w : 5;
}

// ── How it went (the grown-up's tap) ──
export type TalkRating = 'said' | 'tried' | 'notyet';
export const TALK_RATING_LABEL: Record<TalkRating, string> = { said: 'Said it', tried: 'Tried', notyet: 'Not yet' };

export interface TalkNote { ts: number; place: TalkPlace; prompt: string; band: TalkBand; rating: TalkRating }

const KEY = 'kailia_talk_v1';
const MAX = 300;

/** Save a grown-up's tap. Only with the family's consent; only these fixed fields, never text or sound. */
export function recordTalk(place: TalkPlace, prompt: TalkPrompt, rating: TalkRating) {
  if (typeof window === 'undefined' || !hasActiveConsent()) return;
  try {
    const list = loadTalkNotes();
    list.push({ ts: Date.now(), place, prompt: prompt.id, band: prompt.band, rating });
    localStorage.setItem(scopedKey(KEY), JSON.stringify(list.slice(-MAX)));
  } catch { /* never block play */ }
}

export function loadTalkNotes(): TalkNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(scopedKey(KEY)) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

const PLACE_NAME: Record<TalkPlace, string> = {
  story: 'the story', 'story-sparks': 'Story Sparks', 'trail-walk': "Kailia's Trail", 'echo-song': 'Echo Song',
};

/** Plain, gentle sentences for the parent pages, never a score. */
export function talkSummary(notes = loadTalkNotes()): string[] {
  if (!notes.length) return [];
  const recent = notes.filter(n => Date.now() - n.ts < 30 * 86400000);
  const use = recent.length ? recent : notes;
  const said = use.filter(n => n.rating === 'said').length;
  const tried = use.filter(n => n.rating === 'tried').length;
  const notYet = use.filter(n => n.rating === 'notyet').length;
  const out: string[] = [];
  const places = [...new Set(use.map(n => PLACE_NAME[n.place]))];
  out.push(`Talked with Kailia ${use.length} time${use.length === 1 ? '' : 's'} lately (in ${places.join(', ')}).`);
  if (said) out.push(`Joined in out loud ${said} time${said === 1 ? '' : 's'}${tried ? `, and gave it a go ${tried} more` : ''}.`);
  else if (tried) out.push(`Gave it a go ${tried} time${tried === 1 ? '' : 's'}: every try counts.`);
  if (notYet && notYet >= said + tried) out.push('Often listening quietly for now, which is a normal part of learning to talk. Saying the words together, slowly, helps.');
  const band = use[use.length - 1].band;
  out.push(`Kailia is asking for ${TALK_BAND_INFO[band].asks}. The printable Talking practice cards use the same words.`);
  return out;
}
