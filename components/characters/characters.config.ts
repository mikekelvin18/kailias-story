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
// Six curated buddies a parent picks from. They use the companion pets' pictures
// and Noel's portrait; any without an `image` shows the matching drawn critter from CritterSprite.tsx. To swap in
// a real picture: drop e.g. `avatar-fox.png` into `public/avatars/` and fill
// in its `image` line below — nothing else changes.
export type AvatarId = 'turtle' | 'fox' | 'owl' | 'unicorn' | 'panda' | 'dragon';

export const CHILD_AVATARS: { id: AvatarId; name: string; tint: string; image?: string;
  // Head-and-shoulders crop of a full-body picture, in the picture's own
  // pixels: [face center x, face center y, square size, picture width]
  crop?: [number, number, number, number] }[] = [
  { id: 'fox',     name: 'Flick',  tint: '#FFE8D6', image: '/art/pets/flick.webp', crop: [205, 170, 360, 384] },
  { id: 'turtle',  name: 'Shelly', tint: '#DCFCE7', image: '/art/pets/shelly.webp', crop: [205, 140, 300, 394] },
  { id: 'owl',     name: 'Sage',   tint: '#EDE9FE', image: '/art/pets/sage.webp', crop: [210, 170, 370, 408] },
  { id: 'unicorn', name: 'Nova',   tint: '#FCE7F3', image: '/art/pets/nova.webp', crop: [290, 175, 310, 438] },
  { id: 'dragon',  name: 'Ember',  tint: '#FEF9C3', image: '/art/pets/ember.webp', crop: [222, 160, 320, 422] },
  { id: 'panda',   name: 'Noel',   tint: '#E0F2FE', image: '/characters/noel/portrait-front.png', crop: [188, 140, 340, 376] },
];
