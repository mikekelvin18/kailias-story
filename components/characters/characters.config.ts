// ── Character art config ──
// This is the ONLY file you need to touch to swap placeholder drawings for
// final artwork. See the "Characters" section in CLAUDE.md for the full
// plain-English how-to.
//
// Steps to swap in a real image for, say, Kailia's "happy" expression:
//   1. Export the image (PNG or SVG, transparent background works best).
//   2. Drop the file into the `public/characters/` folder.
//   3. Add a line below pointing at it, e.g.:
//        happy: '/characters/kailia-happy.png',
//   4. Save. The app will automatically use your image instead of the
//      placeholder SVG drawing for that expression — no other code changes.
//
// Any expression left commented out / missing here keeps using the
// placeholder SVG drawn in KailiaSprite.tsx / PandaSprite.tsx.

export type CharacterExpression = 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy';

// Every expression currently points at the same real-art front portrait —
// we only have one smooth, non-pixelated pose per character (no separate
// drawn expressions yet), so every KailiaSprite/PandaSprite instance across
// the whole site renders the real art instead of the placeholder SVG.
// ── Hand-painted look ──
// true  = every Kailia/Noel picture uses the brush-painted versions in
//         public/characters/painted/ (made by scripts/paint-art.py, which
//         repaints the art with thousands of small oriented brush strokes).
// false = go back to the original smooth art. Nothing else needs to change.
export const PAINTED_ART = true;

export type CharacterPose =
  | 'portrait-front' | 'portrait-back' | 'portrait-left' | 'portrait-right'
  | `run-${1 | 2 | 3 | 4 | 5}` | `jump-${1 | 2 | 3 | 4}`;

// The one place every sprite gets its picture path from, so the switch
// above flips the whole app at once.
export function characterArt(character: 'kailia' | 'noel', pose: CharacterPose): string {
  return PAINTED_ART
    ? `/characters/painted/${character}/${pose}.png`
    : `/characters/${character}/${pose}.png`;
}

const front = (c: 'kailia' | 'noel') => characterArt(c, 'portrait-front');

export const CHARACTER_IMAGES: Record<'kailia' | 'noel', Partial<Record<CharacterExpression, string>>> = {
  kailia: {
    happy: front('kailia'),
    excited: front('kailia'),
    thinking: front('kailia'),
    celebrating: front('kailia'),
  },
  noel: {
    happy: front('noel'),
    excited: front('noel'),
    thinking: front('noel'),
    celebrating: front('noel'),
    sleepy: front('noel'),
  },
};

// ── Child avatars (Parent Zone profile picture) ──
// Six curated buddies a parent picks from. Until real pictures exist, each
// one shows the matching drawn critter from CritterSprite.tsx. To swap in
// a real picture: drop e.g. `avatar-fox.png` into `public/avatars/` and fill
// in its `image` line below — nothing else changes.
export type AvatarId = 'turtle' | 'fox' | 'owl' | 'rabbit' | 'koala' | 'dragon';

export const CHILD_AVATARS: { id: AvatarId; name: string; tint: string; image?: string }[] = [
  { id: 'fox',    name: 'Fox',    tint: '#FFE8D6' /* image: '/avatars/avatar-fox.png' */ },
  { id: 'rabbit', name: 'Bunny',  tint: '#FCE7F3' /* image: '/avatars/avatar-bunny.png' */ },
  { id: 'owl',    name: 'Owl',    tint: '#EDE9FE' /* image: '/avatars/avatar-owl.png' */ },
  { id: 'turtle', name: 'Turtle', tint: '#DCFCE7' /* image: '/avatars/avatar-turtle.png' */ },
  { id: 'koala',  name: 'Koala',  tint: '#E0F2FE' /* image: '/avatars/avatar-koala.png' */ },
  { id: 'dragon', name: 'Dragon', tint: '#FEF9C3' /* image: '/avatars/avatar-dragon.png' */ },
];
