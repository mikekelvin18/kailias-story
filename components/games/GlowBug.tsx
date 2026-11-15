// ── A drawn firefly ──
// A little mint-green beetle carrying a big warm lantern for a tail. The
// light is the star: a wide soft halo, a bright bulb with a white-hot
// core and small rays, all pulsing slowly. The bug itself has a round head
// with one big shiny eye, a smile, glowing antenna tips and two wings that
// beat fast. It bobs as it flies. `angle` turns it to face where it is
// flying; `sleepy` closes its eyes and slows the wings (the "carry them
// home" round); `happy` is the caught face (squeezed-shut smiling eyes).
// Mint body + yellow light keeps it from reading as a bee, and the cream
// rim keeps it clear on the night sky. Never an emoji.

import type { CSSProperties } from 'react';

interface Props {
  size: number;
  /** degrees; 0 = flying right */
  angle?: number;
  sleepy?: boolean;
  /** the just-caught face */
  happy?: boolean;
  /** 0–1 extra brightness, e.g. while being dragged */
  lit?: number;
  seed?: number;
  style?: CSSProperties;
}

export default function GlowBug({ size, angle = 0, sleepy, happy, lit = 0, seed = 0, style }: Props) {
  const sk = '#3b2416';
  const faceLeft = Math.abs(((angle % 360) + 360) % 360 - 180) < 90;
  const tilt = faceLeft ? angle - 180 : angle;
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={`gb-halo-${seed}`}>
          <stop offset="0" stopColor="#FFFBD0" stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#FFE45C" stopOpacity={0.5 + lit * 0.3} />
          <stop offset="1" stopColor="#FFD23F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`gb-bulb-${seed}`} cx="0.4" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#FFF9A8" />
          <stop offset="1" stopColor="#FFC933" />
        </radialGradient>
        <linearGradient id={`gb-body-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9BF0DC" />
          <stop offset="1" stopColor="#45BFA8" />
        </linearGradient>
      </defs>
      <g className={sleepy ? undefined : 'gb-bob'} style={{ animationDelay: `${-seed * 0.23}s` }}>
        <g transform={`rotate(${tilt * 0.5}) scale(${faceLeft ? -1 : 1} 1)`}>
          {/* the light: wide halo and little rays around the tail */}
          <g className="gb-pulse" style={{ transformOrigin: '-17px 9px', animationDelay: `${-seed * 0.37}s` }}>
            <circle cx="-17" cy="9" r="52" fill={`url(#gb-halo-${seed})`} />
            <g stroke="#FFF3A0" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
              <path d="M-40 9 h-7 M-34 -9 l-5 -5 M-34 27 l-5 5 M-17 31 v7 M-17 -13 v-6" />
            </g>
          </g>
          {/* a cream "sticker" rim behind the bug, so it stands out on a night sky */}
          <g fill="#FFF6D6" stroke="#FFF6D6" strokeWidth="8" strokeLinejoin="round">
            <circle cx="-17" cy="9" r="16" />
            <ellipse cx="5" cy="2" rx="15" ry="13" />
            <circle cx="22" cy="-5" r="14" />
          </g>
          {/* back wing */}
          <g className={sleepy ? 'gb-wing-slow' : 'gb-wing'} style={{ transformOrigin: '0px -9px', animationDelay: `${-seed * 0.05}s` }}>
            <path d="M0 -9 C-22 -14 -26 -40 -10 -42 C2 -42 6 -22 0 -9 Z" fill="#DDF4FF" fillOpacity="0.9" stroke={sk} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
          {/* glowing tail */}
          <circle cx="-17" cy="9" r="16" fill={`url(#gb-bulb-${seed})`} stroke={sk} strokeWidth="2.6" />
          <path d="M-27 2 q3 -7 10 -8" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
          {/* body */}
          <ellipse cx="5" cy="2" rx="15" ry="13" fill={`url(#gb-body-${seed})`} stroke={sk} strokeWidth="2.6" />
          <path d="M-4 -7 q10 6 20 -1" stroke={sk} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M-2 13 q-1 5 -4 7 M8 14 q1 5 4 7" stroke={sk} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* head */}
          <circle cx="22" cy="-5" r="14" fill="#A8F5E3" stroke={sk} strokeWidth="2.6" />
          <path d="M18 -18 q-2 -11 -9 -13 M26 -18 q3 -10 10 -11" stroke={sk} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="9" cy="-31" r="3.4" fill="#FFE45C" stroke={sk} strokeWidth="1.4" className="gb-pulse" />
          <circle cx="36" cy="-29" r="3.4" fill="#FFE45C" stroke={sk} strokeWidth="1.4" className="gb-pulse" />
          {sleepy ? (
            <path d="M20 -6 q4 4 8 0" stroke={sk} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          ) : happy ? (
            <path d="M19 -6 q4.5 -6 9 0" stroke={sk} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          ) : (
            <g className="gb-blink" style={{ transformOrigin: '24px -7px', animationDelay: `${-seed * 0.61}s` }}>
              <circle cx="24" cy="-7" r="6.4" fill="#FFFFFF" stroke={sk} strokeWidth="1.6" />
              <circle cx="25.4" cy="-6.4" r="3.8" fill="#2a1a10" />
              <circle cx="26.8" cy="-8.2" r="1.5" fill="#FFFFFF" />
              <circle cx="24.2" cy="-4.6" r="0.8" fill="#FFFFFF" />
            </g>
          )}
          <path d={happy ? 'M22 2 q5 7 10 0 Z' : 'M24 3 q4 4 8 0'} stroke={sk} strokeWidth="2" fill={happy ? '#FF7A8A' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="17" cy="2" r="3" fill="#FF8FAB" opacity="0.85" />
          {/* front wing */}
          <g className={sleepy ? 'gb-wing-slow' : 'gb-wing'} style={{ transformOrigin: '4px -10px', animationDelay: `${-seed * 0.05 - 0.06}s` }}>
            <path d="M4 -10 C-10 -20 -8 -46 8 -46 C20 -44 16 -22 4 -10 Z" fill="#FFFFFF" fillOpacity="0.92" stroke={sk} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M5 -14 q-2 -14 4 -26" stroke="#B9D8F0" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}
