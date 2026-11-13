// ── Critter Sprite ──
// Animated chibi-style creature illustrations, drawn in the same bold
// sticker style as Kailia and Noel (thick dark outline, big shiny eyes,
// blush cheeks) — replacing plain animal emoji everywhere a "wild
// creature" appears in the adventure games. One flexible SVG builder
// covers every species so adding a new one is a config entry, not a
// new drawing from scratch.
//
// Every critter idly bobs and blinks; species with wings/tails/ears get
// their own extra motion (flutter, wag) layered on top.

import type { CSSProperties } from 'react';
import { CRITTER_ART } from './critterArt';

export type SpeciesKey =
  | 'dragon' | 'owl' | 'raccoon' | 'parrot' | 'peacock' | 'rabbit' | 'koala'
  | 'deer' | 'swan' | 'fox' | 'frog' | 'turtle' | 'squirrel' | 'hedgehog'
  | 'bee' | 'butterfly';

// Maps the exact emoji characters used throughout lib/creatureChallenges.ts
// to a species drawing. Anything not listed here (gems, colors, flags…)
// simply isn't a critter and should keep rendering as plain emoji.
export const EMOJI_SPECIES: Record<string, SpeciesKey> = {
  '🐉': 'dragon', '🐲': 'dragon', '🦉': 'owl', '🦝': 'raccoon', '🦜': 'parrot',
  '🦚': 'peacock', '🐰': 'rabbit', '🐨': 'koala', '🦌': 'deer', '🦢': 'swan',
  '🦊': 'fox', '🐸': 'frog', '🐢': 'turtle', '🐿️': 'squirrel', '🦔': 'hedgehog',
  '🐝': 'bee', '🦋': 'butterfly',
};

interface Props {
  species: SpeciesKey;
  size?: number;
  className?: string;
  style?: CSSProperties;
  animate?: boolean; // set false for tiny inline usages (option buttons) to save motion
}

// The drawings themselves live in ./critterArt (one per species).
export function CritterSprite({ species, size = 64, className, style, animate = true }: Props) {
  return (
    <svg viewBox="-4 -16 128 136" width={size} height={size} className={`${animate ? 'critter-bob' : ''} ${className ?? ''}`}
      style={{ overflow: 'visible', ...style }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {CRITTER_ART[species](animate)}
    </svg>
  );
}

// Convenience wrapper: pass the emoji already used throughout the game
// data, get back the matching animated critter — or the raw emoji if
// it isn't a creature (gems, colors, flags, etc.), so callers never
// need an if/else at the call site.
export function Critter({ emoji, size = 64, className, style, animate = true }:
  { emoji: string; size?: number; className?: string; style?: CSSProperties; animate?: boolean }) {
  const species = EMOJI_SPECIES[emoji];
  if (!species) return <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, ...style }}>{emoji}</span>;
  return <CritterSprite species={species} size={size} className={className} style={style} animate={animate} />;
}
