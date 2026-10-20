'use client';

// ── Live character ──
// Makes the still Kailia/Noel portrait move like a character in a real
// game, using only the one front-facing picture:
//   • breathing: the body gently rises and settles from the feet
//   • blinking: real eyelids close over the eyes every few seconds
//   • excited/celebrating: a happy hop loop with squash & stretch
//   • tap/click: a jelly squish and a hop, so kids can poke them
//   • depth: soft light from the upper left and shade on the lower right,
//     painted only inside the character's own outline (a mask made from
//     the same picture), a soft ground shadow that shrinks when they hop,
//     and a slow, small body turn — so the flat picture reads as a
//     rounded figure standing in the scene, not a sticker on top of it
// Each character blinks on its own rhythm (derived from useId, not
// Math.random, so server and browser agree). "Reduce motion" turns it
// all off via globals.css.

import { useId, useState } from 'react';
import Image from 'next/image';

// Eye positions measured on portrait-front.png (pixels of the source art).
// The overlay SVG uses the same pixel grid, so these line up exactly.
const RIGS = {
  kailia: {
    w: 361, h: 600, aspect: 1.3,
    lid: '#F7D6B8', lash: '#3a2a4a',
    eyes: [[122, 207], [240, 207]] as [number, number][], rx: 27, ry: 30,
  },
  noel: {
    w: 376, h: 493, aspect: 1.2,
    lid: '#221B20', lash: '#6b5f68',
    eyes: [[132, 150], [245, 150]] as [number, number][], rx: 22, ry: 24,
  },
};

interface Props {
  character: 'kailia' | 'noel';
  src: string;
  size: number;
  mood: 'calm' | 'excited';
  className?: string;
  style?: React.CSSProperties;
}

export default function LiveCharacter({ character, src, size, mood, className, style }: Props) {
  const rig = RIGS[character];
  const id = useId();
  const [poked, setPoked] = useState(0);
  // stable per-instance offsets so a row of characters never moves in sync
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const blinkDelay = `${(seed % 37) / 10}s`;
  const breathDelay = `${-(seed % 23) / 10}s`;

  const anim = poked ? 'live-poke' : mood === 'excited' ? 'live-hop' : 'live-breathe';
  const mask: React.CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
    WebkitMaskSize: 'contain', maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-block', position: 'relative', width: size, height: size * rig.aspect, cursor: 'pointer', ...style }}
      onClick={() => setPoked(p => p + 1)}
    >
      {/* ground shadow: stays on the floor, shrinks and fades as they rise */}
      <span key={`s${poked}`} className={`${anim}-shadow live-ground`} aria-hidden="true"
        style={{ animationDelay: poked ? undefined : breathDelay }} />
      <span className="live-turn" style={{ display: 'block', position: 'absolute', inset: 0, animationDelay: breathDelay }}>
      <span
        key={poked}
        className={anim}
        onAnimationEnd={e => { if (e.animationName === 'live-poke') setPoked(0); }}
        style={{ display: 'block', position: 'absolute', inset: 0, transformOrigin: '50% 100%', animationDelay: poked ? undefined : breathDelay }}
      >
        <Image src={src} alt={character === 'kailia' ? 'Kailia' : 'Noel'} width={size} height={size * rig.aspect}
          draggable={false} className="live-art" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        {/* light and shade, clipped to the character's outline */}
        <span aria-hidden="true" className="live-shade" style={mask} />
        <span aria-hidden="true" className="live-light" style={mask} />
        <svg viewBox={`0 0 ${rig.w} ${rig.h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {rig.eyes.map(([cx, cy]) => (
            <g key={cx} className="live-lid" style={{ animationDelay: blinkDelay, transformOrigin: `${cx}px ${cy - rig.ry}px` }}>
              <ellipse cx={cx} cy={cy} rx={rig.rx} ry={rig.ry} fill={rig.lid} />
              <path d={`M ${cx - rig.rx} ${cy + rig.ry * 0.25} Q ${cx} ${cy + rig.ry * 1.05} ${cx + rig.rx} ${cy + rig.ry * 0.25}`}
                fill="none" stroke={rig.lash} strokeWidth="5" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      </span>
      </span>
    </span>
  );
}
