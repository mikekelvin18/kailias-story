// Kailia — bold sticker-style character, matching the reference portrait
// used on the main page (public/kailia-avatar.png): deep purple hair worn
// in two buns with soft cat ears, long twin-tails, and big warm eyes.
// Placeholder SVG drawing; swap in real art via characters.config.ts.

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
  const SK = '#3a2a4a'; // soft dark plum outline — friendlier than near-black
  const HAIR = '#7C4DE0';
  const HAIR_DK = '#5B32B8';
  const IRIS = '#4C2E7A';

  // Mouth shapes — soft, gently-open smiles. No bared-open "scream" shapes.
  const mouths: Record<Expression, React.ReactNode> = {
    happy:       <path d="M 41 74 Q 50 81 59 74" stroke={SK} strokeWidth={SW} fill="#FF8FAB" strokeLinecap="round" />,
    excited:     <path d="M 40 73 Q 50 85 60 73 Q 50 79 40 73 Z" stroke={SK} strokeWidth="2" fill="#FF6F91" strokeLinecap="round" />,
    thinking:    <path d="M 43 75 Q 50 72 57 75" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    celebrating: <path d="M 40 73 Q 50 85 60 73 Q 50 79 40 73 Z" stroke={SK} strokeWidth="2" fill="#FF6F91" strokeLinecap="round" />,
  };

  // Big warm eyes: white base always visible, a rounded iris (not a solid
  // black void), and two soft highlight dots for sparkle.
  const eye = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy="60" rx="10.5" ry="11.5" fill="white" stroke={SK} strokeWidth={SW} />
      <circle cx={cx} cy="61.5" r="6.5" fill={IRIS} />
      <circle cx={cx} cy="61.5" r="3" fill="#1a1108" />
      <circle cx={cx - 2.6} cy="57.5" r="2.3" fill="white" />
      <circle cx={cx + 3} cy="65" r="1.1" fill="white" opacity="0.85" />
      {/* soft upper lash */}
      <path d={`M ${cx - 9} 53 Q ${cx} 49 ${cx + 9} 53`} stroke={SK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  );

  const eyes: Record<Expression, React.ReactNode> = {
    happy: <>{eye(35)}{eye(65)}</>,
    excited: (
      <>
        <ellipse cx="35" cy="59" rx="11.5" ry="12.5" fill="white" stroke={SK} strokeWidth={SW} />
        <ellipse cx="65" cy="59" rx="11.5" ry="12.5" fill="white" stroke={SK} strokeWidth={SW} />
        <circle cx="35" cy="61" r="7" fill={IRIS} />
        <circle cx="65" cy="61" r="7" fill={IRIS} />
        <circle cx="35" cy="61" r="3.2" fill="#1a1108" />
        <circle cx="65" cy="61" r="3.2" fill="#1a1108" />
        <circle cx="32" cy="56" r="2.5" fill="white" />
        <circle cx="62" cy="56" r="2.5" fill="white" />
      </>
    ),
    thinking: (
      <>
        <path d="M 25 60 Q 35 55 45 60" stroke={SK} strokeWidth={SW + 1} fill="none" strokeLinecap="round" />
        <path d="M 55 60 Q 65 55 75 60" stroke={SK} strokeWidth={SW + 1} fill="none" strokeLinecap="round" />
      </>
    ),
    celebrating: (
      <>
        <text x="26" y="66" fontSize="20" fill="#FFD700">★</text>
        <text x="54" y="66" fontSize="20" fill="#FFD700">★</text>
      </>
    ),
  };

  return (
    <svg
      viewBox="0 -14 100 144"
      width={size}
      height={size * 1.44}
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
      <ellipse cx="11" cy="66" rx="10.5" ry="27" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <ellipse cx="89" cy="66" rx="10.5" ry="27" fill={HAIR} stroke={SK} strokeWidth={SW} />

      {/* ── Hair mass (behind face) ── */}
      <ellipse cx="50" cy="28" rx="37" ry="28" fill={HAIR} stroke={SK} strokeWidth={SW} />

      {/* ── Buns ── */}
      <circle cx="20" cy="16" r="14" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <circle cx="80" cy="16" r="14" fill={HAIR} stroke={SK} strokeWidth={SW} />
      <ellipse cx="16" cy="11" rx="4.5" ry="3" fill={HAIR_DK} opacity="0.5" transform="rotate(-20 16 11)" />
      <ellipse cx="84" cy="11" rx="4.5" ry="3" fill={HAIR_DK} opacity="0.5" transform="rotate(20 84 11)" />

      {/* ── Cat ears (soft rounded shape, not sharp points) ── */}
      <ellipse cx="17" cy="-2" rx="9" ry="14" fill={HAIR} stroke={SK} strokeWidth={SW} transform="rotate(-18 17 -2)" />
      <ellipse cx="83" cy="-2" rx="9" ry="14" fill={HAIR} stroke={SK} strokeWidth={SW} transform="rotate(18 83 -2)" />
      <ellipse cx="17" cy="0" rx="4" ry="8" fill="#FBCFE8" transform="rotate(-18 17 0)" />
      <ellipse cx="83" cy="0" rx="4" ry="8" fill="#FBCFE8" transform="rotate(18 83 0)" />

      {/* ── Face ── */}
      <circle cx="50" cy="58" r="32" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />

      {/* ── Bangs (soft scalloped waves, not sharp zigzag) ── */}
      <path d="M 18 36 Q 15 6 30 4 Q 40 -1 50 5 Q 60 -1 70 4 Q 85 6 82 36
                Q 76 22 68 27 Q 63 14 56 24 Q 50 15 44 24 Q 37 14 32 27 Q 24 22 18 36 Z"
        fill={HAIR} stroke={SK} strokeWidth={SW} strokeLinejoin="round" />

      {/* ── Eyebrows (soft, friendly) ── */}
      {expression !== 'thinking' && (
        <>
          <path d="M 28 44 Q 35 41 42 44" stroke={SK} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 58 44 Q 65 41 72 44" stroke={SK} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}

      {/* ── Eyes ── */}
      {eyes[expression]}

      {/* ── Nose ── */}
      <ellipse cx="50" cy="65" rx="2.5" ry="1.8" fill="#E8A882" />

      {/* ── Mouth ── */}
      {mouths[expression]}

      {/* ── Blush ── */}
      <circle cx="25" cy="70" r="7.5" fill="#FFB3C6" opacity="0.55" />
      <circle cx="75" cy="70" r="7.5" fill="#FFB3C6" opacity="0.55" />
    </svg>
  );
}
