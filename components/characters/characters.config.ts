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
export const CHARACTER_IMAGES: Record<'kailia' | 'noel', Partial<Record<CharacterExpression, string>>> = {
  kailia: {
    happy: '/characters/kailia/portrait-front.png',
    excited: '/characters/kailia/portrait-front.png',
    thinking: '/characters/kailia/portrait-front.png',
    celebrating: '/characters/kailia/portrait-front.png',
  },
  noel: {
    happy: '/characters/noel/portrait-front.png',
    excited: '/characters/noel/portrait-front.png',
    thinking: '/characters/noel/portrait-front.png',
    celebrating: '/characters/noel/portrait-front.png',
    sleepy: '/characters/noel/portrait-front.png',
  },
};
