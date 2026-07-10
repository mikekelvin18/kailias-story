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

export const CHARACTER_IMAGES: Record<'kailia' | 'noel', Partial<Record<CharacterExpression, string>>> = {
  kailia: {
    // happy: '/characters/kailia-happy.png',
    // excited: '/characters/kailia-excited.png',
    // thinking: '/characters/kailia-thinking.png',
    // celebrating: '/characters/kailia-celebrating.png',
  },
  noel: {
    // happy: '/characters/noel-happy.png',
    // excited: '/characters/noel-excited.png',
    // thinking: '/characters/noel-thinking.png',
    // celebrating: '/characters/noel-celebrating.png',
    // sleepy: '/characters/noel-sleepy.png',
  },
};
