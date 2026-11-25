// ── The things friends want ──
// Everything the games hand out or ask for (berries, toys, apples…). The
// drawings are in components/games/Things.tsx.

export const THINGS = ['berry', 'apple', 'ball', 'carrot', 'acorn', 'cookie', 'flower', 'coin', 'shell', 'leaf'] as const;
export type Thing = typeof THINGS[number];
export const PLURAL: Record<Thing, string> = {
  berry: 'berries', apple: 'apples', ball: 'balls', carrot: 'carrots', acorn: 'acorns',
  cookie: 'cookies', flower: 'flowers', coin: 'gold coins', shell: 'shells', leaf: 'leaves',
};
