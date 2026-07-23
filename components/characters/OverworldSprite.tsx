// Directional sprite for the top-down "Kailia's Journey" world — uses the
// same smooth turnaround art as the rest of the site (public/characters/
// {kailia,noel}/portrait-{front,back,left,right}.png) so the overworld
// avatar matches the character's look everywhere else, instead of a
// separate lower-res pixel-art sheet that clashed with it.

import Image from 'next/image';

export type Facing = 'front' | 'back' | 'left' | 'right';

interface Props {
  character: 'kailia' | 'noel';
  facing: Facing;
  walking?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function OverworldSprite({ character, facing, walking = false, size = 48, className, style }: Props) {
  return (
    <Image
      src={`/characters/${character}/portrait-${facing}.png`}
      alt={character}
      width={size}
      height={size * 1.3}
      unoptimized
      className={`character-art-shadow ${walking ? 'overworld-bob' : ''} ${className ?? ''}`}
      style={{ objectFit: 'contain', ...style }}
    />
  );
}
