// Kailia — bold sticker-style character, matching the reference portrait
// used on the main page (public/kailia-avatar.png): deep purple hair worn
// in two buns with little cat ears, long twin-tails, and big sparkly
// dark eyes. Placeholder SVG drawing; swap in real art via characters.config.ts.

import Image from 'next/image';
import { CHARACTER_IMAGES, type CharacterExpression } from './characters.config';

type Expression = Extract<CharacterExpression, 'happy' | 'excited' | 'thinking' | 'celebrating'>;

interface Props {
  size?: number;
  expression?: Expression;
  className?: string;
  style?: React.CSSProperties;
}

export default function KailiaSprite({ size = 120, expression = 'happy', className, style }: Props) {
  const imagePath = CHARACTER_IMAGES.kailia[expression];
  if (imagePath) {
    return (
      <Image
        src={imagePath}
        alt="Kailia"
        width={size}
        height={size * 1.3}
        className={className}
        style={{ objectFit: 'contain', ...style }}
      />
    );
  }

  const SW = 3; // stroke width
  const SK = '#1a1108'; // stroke color
  const HAIR = '#6D28D9';
  const HAIR_DK = '#4C1D95';

  // Mouth shapes — big open laugh for happy/excited, matching the reference
  const mouths: Record<Expression, React.ReactNode> = {
    happy:       <path d="M 40 76 Q 50 87 60 76 Q 50 81 40 76 Z" stroke={SK} strokeWidth="2" fill="#E11D48" strokeLinecap="round" />,
    excited:     <ellipse cx="50" cy="77" rx="9" ry="7" fill={SK} />,
    thinking:    <path d="M 43 75 Q 50 72 57 75" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    celebrating: <path d="M 39 75 Q 50 89 61 75 Q 50 82 39 75 Z" stroke={SK} strokeWidth="2" fill="#E11D48" strokeLinecap="round" />,
  };

  // Big near-solid sparkly eyes with a crescent shine, like the reference art
  const sparkleEye = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy="62" rx="10" ry="12" fill={SK} />
      <path d={`M ${cx - 7} 54 Q ${cx - 2} 51 ${cx + 3} 54`} stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx={cx - 3} cy="57" r="2.6" fill="white" />
      <circle cx={cx + 4} cy="68" r="1.4" fill="white" />
    </g>
  );

  const eyes: Record<Expression, React.ReactNode> = {
    happy: <>{sparkleEye(35)}{sparkleEye(65)}</>,
    excited: (
      <>
        <ellipse cx="35" cy="61" rx="11" ry="13" fill={SK} />
        <ellipse cx="65" cy="61" rx="11" ry="13" fill={SK} />
        <circle cx="32" cy="56" r="3" fill="white" />
        <circle cx="62" cy="56" r="3" fill="white" />
        <circle cx="39" cy="67" r="1.6" fill="white" />
        <circle cx="69" cy="67" r="1.6" fill="white" />
      </>
    ),
    thinking: (
      <>
        <path d="M 25 62 Q 35 56 45 62" stroke={SK} strokeWidth={SW + 1} fill="none" strokeLinecap="round" />
        <path d="M 55 62 Q 65 56 75 62" stroke={SK} strokeWidth={SW + 1} fill="none" strokeLinecap="round" />
      </>
    ),
    celebrating: (
      <>
        <text x="26" y="68" fontSize="20" fill="#FFD700">★</text>
        <text x="54" y="68" fontSize="20" fill="#FFD700">★</text>
      </>
    ),
  };

  return (
    <svg
      viewBox="0 -18 100 148"
      width={size}
      height={size * 1.48}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Body ── */}
      <rect x="22" y="98" width="56" height="38" rx="12" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      <text x="50" y="125" fontSize="16" textAnchor="middle" fill="white">⭐</text>
      <rect x="6"  y="98" width="18" height="30" rx="9" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      <rect x="76" y="98" width="18" height="30" rx="9" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      <circle cx="15" cy="128" r="8" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />
      <circle cx="85" cy="128" r="8" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />
      <rect x="28" y="131" width="18" height="7" rx="3" fill="#3B5BDB" stroke={SK} strokeWidth="2" />
      <rect x="54" y="131" width="18" height="7" rx="3" fill="#3B5BDB" stroke={SK} strokeWidth="2" />

      {/* ── Neck ── */}
      <rect x="43" y="92" width="14" height="10" rx="5" fill="#FCD5AE" />

      {/* ── Twin-tails (hang past shoulders, behind face) ── */}
      <ellipse cx="10" cy="70" rx="11" ry="30" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <ellipse cx="90" cy="70" rx="11" ry="30" fill={HAIR} stroke={SK} strokeWidth={SW} />

      {/* ── Hair mass (behind face) ── */}
      <ellipse cx="50" cy="30" rx="38" ry="30" fill={HAIR} stroke={SK} strokeWidth={SW} />

      {/* ── Buns ── */}
      <circle cx="19" cy="16" r="15" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <circle cx="81" cy="16" r="15" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <ellipse cx="15" cy="11" rx="5" ry="3.5" fill={HAIR_DK} opacity="0.6" transform="rotate(-20 15 11)" />
      <ellipse cx="85" cy="11" rx="5" ry="3.5" fill={HAIR_DK} opacity="0.6" transform="rotate(20 85 11)" />

      {/* ── Cat ears (on top of buns) ── */}
      <path d="M 8 6 L 15 -16 L 29 3 Z" fill={HAIR} stroke={SK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M 92 6 L 85 -16 L 71 3 Z" fill={HAIR} stroke={SK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M 13 3 L 16 -8 L 23 1 Z" fill="#FBCFE8" />
      <path d="M 87 3 L 84 -8 L 77 1 Z" fill="#FBCFE8" />

      {/* ── Face ── */}
      <circle cx="50" cy="60" r="33" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />

      {/* ── Bangs (jagged center part) ── */}
      <path d="M 17 38 Q 14 8 30 6 Q 34 -4 42 8 Q 50 -6 58 8 Q 66 -4 70 6 Q 86 8 83 38
                Q 74 22 68 30 Q 62 14 56 26 Q 50 12 44 26 Q 38 14 32 30 Q 26 22 17 38 Z"
        fill={HAIR} stroke={SK} strokeWidth={SW} strokeLinejoin="round" />

      {/* ── Eyes ── */}
      {eyes[expression]}

      {/* ── Nose ── */}
      <ellipse cx="50" cy="65" rx="3" ry="2" fill="#E8A882" />

      {/* ── Mouth ── */}
      {mouths[expression]}

      {/* ── Blush ── */}
      <circle cx="25" cy="72" r="8" fill="#FFB3C6" opacity="0.55" />
      <circle cx="75" cy="72" r="8" fill="#FFB3C6" opacity="0.55" />
    </svg>
  );
}
