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
import LiveArt from './LiveArt';

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

// Each side animal is one of Kelvin's painted pictures. Fox, owl, turtle
// and dragon are the pets Flick, Sage, Shelly and Ember. With `animate`
// the picture is alive (LiveArt: breathing, hops, blinking, and moving
// ears, wings, arms and tails from its rig in rigs.ts); without it, it is
// a still picture. The old code drawings in ./critterArt are only a
// fallback for a species with no picture.
const PET_FOR: Partial<Record<SpeciesKey, [string, number]>> = {
  // picture, width as a share of its height
  fox: ['/art/pets/flick.webp', 0.75], owl: ['/art/pets/sage.webp', 0.8],
  turtle: ['/art/pets/shelly.webp', 0.77], dragon: ['/art/pets/ember.webp', 0.82],
};
const NO_PICTURE = new Set<SpeciesKey>([]);

export function CritterSprite({ species, size = 64, className, style, animate = true }: Props) {
  if (NO_PICTURE.has(species)) {
    return (
      <svg viewBox="-4 -16 128 136" width={size} height={size} className={`${animate ? 'critter-bob' : ''} ${className ?? ''}`}
        style={{ overflow: 'visible', ...style }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {CRITTER_ART[species](animate)}
      </svg>
    );
  }
  const pet = PET_FOR[species];
  const src = pet ? pet[0] : `/art/critters/${species}.webp`;
  const width = Math.round(size * Math.min(1, pet ? pet[1] : 1));
  return (
    <span className={className} aria-hidden="true"
      style={{ display: 'inline-flex', alignItems: 'flex-end', justifyContent: 'center', width: size, height: size, verticalAlign: 'middle', ...style }}>
      {animate
        ? <LiveArt src={src} alt="" size={width} />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={src} alt="" draggable={false} style={{ display: 'block', width, height: 'auto', maxHeight: size }} />}
    </span>
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
