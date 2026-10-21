'use client';

// ── Live art ──
// Brings one of Kelvin's still pictures (a pet, a land) to life with the
// same motion language as LiveCharacter, minus the blinking rig:
//   • 'pet'  — breathes from the feet, takes a small happy hop now and
//              then, and squishes + hops when tapped
//   • 'land' — floats gently like an island in the sky, with a soft shadow
//              below that shrinks as it rises
// Every instance runs on its own rhythm (seeded from useId) so a row of
// pets never moves in step. "Reduce motion" stills it (globals.css).
//
// Pictures live in public/art/{pets,lands}/; see the art kit doc for how
// they are made.

import { useId, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  /** width (px, or any CSS width); height follows the picture */
  size: number | string;
  kind?: 'pet' | 'land';
  /** let a tap squish and hop it (off when it sits inside a button) */
  pokeable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LiveArt({ src, alt, size, kind = 'pet', pokeable = kind === 'pet', className, style }: Props) {
  const id = useId();
  const [poked, setPoked] = useState(0);
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const delay = `${-(seed % 29) / 10}s`;
  const idle = kind === 'land' ? 'art-float' : 'art-breathe';
  const anim = poked ? 'live-poke' : idle;

  return (
    <span
      className={className}
      style={{ display: 'inline-block', position: 'relative', width: size, cursor: pokeable ? 'pointer' : undefined, ...style }}
      onClick={pokeable ? () => setPoked(p => p + 1) : undefined}
    >
      <span key={`s${poked}`} aria-hidden="true" className={`${anim}-shadow live-ground`}
        style={{ animationDelay: poked ? undefined : delay, ...(kind === 'land' ? { left: '12%', right: '12%', bottom: '-6%', height: '12%' } : null) }} />
      <span
        key={poked}
        className={anim}
        onAnimationEnd={e => { if (e.animationName === 'live-poke') setPoked(0); }}
        style={{ display: 'block', position: 'relative', transformOrigin: '50% 100%', animationDelay: poked ? undefined : delay }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false} className="live-art"
          style={{ display: 'block', width: '100%', height: 'auto' }} />
      </span>
    </span>
  );
}
