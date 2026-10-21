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
//
// A pet with a rig in rigs.ts also moves its parts (blinks, head tilt,
// wing and tail) on top of this whole-picture motion, via RigCanvas.

import { useCallback, useId, useRef, useState } from 'react';
import RigCanvas from './RigCanvas';
import { rigFor } from './rigs';

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
  const [taps, setTaps] = useState(0);
  const [rigReady, setRigReady] = useState(false);
  const onRigReady = useCallback((ready: boolean) => setRigReady(ready), []);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const delay = `${-(seed % 29) / 10}s`;
  const idle = kind === 'land' ? 'art-float' : 'art-breathe';
  const anim = poked ? 'live-poke' : idle;
  const rig = kind === 'pet' ? rigFor(src) : null;

  const poke = () => {
    setPoked(p => p + 1);
    setTaps(t => t + 1);
    // restart the squish if it is already playing (the body is not
    // remounted, so a rigged pet's canvas survives the tap)
    const el = bodyRef.current;
    if (el && poked) { el.style.animation = 'none'; void el.offsetHeight; el.style.animation = ''; }
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-block', position: 'relative', width: size, cursor: pokeable ? 'pointer' : undefined, ...style }}
      onClick={pokeable ? poke : undefined}
    >
      <span key={`s${poked}`} aria-hidden="true" className={`${anim}-shadow live-ground`}
        style={{ animationDelay: poked ? undefined : delay, ...(kind === 'land' ? { left: '12%', right: '12%', bottom: '-6%', height: '12%' } : null) }} />
      <span
        ref={bodyRef}
        className={anim}
        onAnimationEnd={e => { if (e.animationName === 'live-poke') setPoked(0); }}
        style={{ display: 'block', position: 'relative', transformOrigin: '50% 100%', animationDelay: poked ? undefined : delay }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false} className="live-art"
          style={{ display: 'block', width: '100%', height: 'auto', opacity: rigReady ? 0 : 1 }} />
        {rig && <RigCanvas src={src} rig={rig} poke={taps} seed={seed} onReady={onRigReady} />}
      </span>
    </span>
  );
}
