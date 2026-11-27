// ── Art bible, as code ──
// The visual rules for the adventure world (Kailia's Garden and every
// place after it) live here as tokens, so a colour or a timing changes in
// one spot. The full written art bible is in the project doc "Premium
// adventure world: audit, plan and art bible"; this file is its source of
// truth for code.
//
// One sentence: a hand-painted storybook miniature where every object
// looks like a small wooden or felt toy, outlined in the same warm brown
// as Kelvin's painted characters, lit by one soft sun from the upper left.

export const INK = '#3B2416';

export const PALETTE = {
  ink: INK,
  paper: '#FFF6E5',
  paperEdge: '#EAD9BC',
  leaf: '#6CC07F',
  leafDeep: '#3F9152',
  leafDark: '#2F7A41',
  grass: '#8FD18A',
  grassDeep: '#74BD72',
  sky: '#CDEFFB',
  skyDeep: '#8ED3F0',
  hillFar: '#A9DDB4',
  hillMid: '#86CC94',
  water: '#7CC6E0',
  waterDeep: '#58AFCF',
  wood: '#C98B57',
  woodDeep: '#9C6438',
  stone: '#B9B2A6',
  stoneDeep: '#948C7E',
  path: '#EBD3A4',
  roof: '#D9715B',
  roofDeep: '#B5513F',
  wall: '#FBE8C8',
  starGold: '#F6C445',
  starGoldDeep: '#E0A21E',
  violet: '#6B3FA0',
  petal: '#FFD23F',
  blush: '#FF9EC7',
} as const;

/** a soft contact shadow under anything standing on the ground (sun upper left) */
export const SHADOW = 'rgba(59, 36, 22, 0.22)';

/** outline weight in world pixels (the world is drawn at 2400 x 1000) */
export const LINE = 3;

export const TIMING = {
  /** world pixels per second */
  walkSpeed: 260,
  petSpeed: 300,
  /** run cycle frames per second */
  runFps: 8,
  /** wind-up before an action */
  anticipationMs: 100,
  /** the longest any child waits on an animation; a tap always skips */
  maxWaitMs: 1200,
  fadeMs: 300,
  /** one-shot reactions */
  reactMs: 900,
} as const;

/** sizes in world pixels; Kailia is the reference */
export const SIZES = {
  kailiaH: 250,
  noelH: 210, // sitting on the bench, so a little shorter than standing
  petH: 160,
  /** nothing tappable is smaller than this, before the screen scale */
  minTarget: 110,
} as const;
