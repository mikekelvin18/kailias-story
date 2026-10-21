// ── A drawn firefly ──
// A round little beetle (warm orange with a cream rim, so it reads on the
// dark night sky) with flapping wings, big eyes and a tail that
// glows and pulses. `angle` turns it to face where it is flying; `sleepy`
// closes its eyes and slows the wings (the "carry them home" round).
// Drawn in the warm brown outline of the painted kit, never an emoji.

import type { CSSProperties } from 'react';

interface Props {
  size: number;
  /** degrees; 0 = flying right */
  angle?: number;
  sleepy?: boolean;
  /** 0–1 extra brightness, e.g. while being dragged */
  lit?: number;
  seed?: number;
  style?: CSSProperties;
}

export default function GlowBug({ size, angle = 0, sleepy, lit = 0, seed = 0, style }: Props) {
  const sk = '#3b2416';
  const faceLeft = Math.abs(((angle % 360) + 360) % 360 - 180) < 90;
  const tilt = faceLeft ? angle - 180 : angle;
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={`gb-halo-${seed}`}>
          <stop offset="0" stopColor="#FFF7B0" stopOpacity={0.95} />
          <stop offset="0.45" stopColor="#FDE047" stopOpacity={0.55 + lit * 0.3} />
          <stop offset="1" stopColor="#FDE047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="8" r="48" fill={`url(#gb-halo-${seed})`} className="gb-pulse" style={{ animationDelay: `${-seed * 0.37}s` }} />
      <g transform={`rotate(${tilt * 0.5}) scale(${faceLeft ? -1 : 1} 1)`}>
        {/* a cream "sticker" rim behind the bug, so it stands out on a night sky */}
        <g fill="#FFF6D6" stroke="#FFF6D6" strokeWidth="9" strokeLinejoin="round">
          <ellipse cx="-14" cy="6" rx="14" ry="12" />
          <ellipse cx="4" cy="0" rx="14" ry="12" />
          <circle cx="18" cy="-4" r="10" />
        </g>
        {/* back wings */}
        <g className={sleepy ? 'gb-wing-slow' : 'gb-wing'} style={{ transformOrigin: '-2px -10px', animationDelay: `${-seed * 0.05}s` }}>
          <ellipse cx="-12" cy="-22" rx="11" ry="17" fill="#E9F6FF" fillOpacity="0.95" stroke={sk} strokeWidth="2.2" transform="rotate(-25 -12 -22)" />
        </g>
        {/* glowing tail */}
        <ellipse cx="-14" cy="6" rx="14" ry="12" fill="#FFF27A" stroke={sk} strokeWidth="2.6" className="gb-pulse" />
        <ellipse cx="-17" cy="3" rx="5" ry="4" fill="#FFFDE0" />
        {/* body + head */}
        <ellipse cx="4" cy="0" rx="14" ry="12" fill="#FF8A3D" stroke={sk} strokeWidth="2.6" />
        <circle cx="18" cy="-4" r="10" fill="#F26B3A" stroke={sk} strokeWidth="2.6" />
        <path d="M20 -13 q2 -10 9 -12 M15 -13 q-1 -10 4 -14" stroke={sk} strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="-25" r="2.6" fill="#FFE066" stroke={sk} strokeWidth="1.2" />
        {sleepy ? (
          <path d="M18 -4 q3 3 6 0" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="21" cy="-5" r="4" fill="#FFFFFF" />
            <circle cx="22.3" cy="-4.6" r="2" fill="#3b2416" />
            <circle cx="23" cy="-5.6" r="0.8" fill="#FFFFFF" />
          </>
        )}
        <circle cx="15" cy="1" r="2.4" fill="#FF5C8A" opacity="0.8" />
        {/* front wing */}
        <g className={sleepy ? 'gb-wing-slow' : 'gb-wing'} style={{ transformOrigin: '2px -10px', animationDelay: `${-seed * 0.05 - 0.06}s` }}>
          <ellipse cx="4" cy="-24" rx="10" ry="16" fill="#FFFFFF" fillOpacity="0.95" stroke={sk} strokeWidth="2.2" transform="rotate(15 4 -24)" />
        </g>
      </g>
    </svg>
  );
}
