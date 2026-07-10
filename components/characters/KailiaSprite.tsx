// Kailia — bold sticker-style character. Simple = cute.
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
  const SK = '#1a1108'; // stroke color

  // Mouth shapes
  const mouths: Record<Expression, React.ReactNode> = {
    happy:       <path d="M 42 62 Q 50 70 58 62" stroke={SK} strokeWidth={SW} fill="#FF8FAB" strokeLinecap="round" />,
    excited:     <ellipse cx="50" cy="64" rx="9" ry="7" fill={SK} />,
    thinking:    <path d="M 43 63 Q 50 60 57 63" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    celebrating: <path d="M 39 61 Q 50 72 61 61" stroke={SK} strokeWidth={SW} fill="#FF8FAB" strokeLinecap="round" />,
  };

  // Eye shapes
  const eyes: Record<Expression, React.ReactNode> = {
    happy: (
      <>
        <circle cx="37" cy="52" r="9" fill="white" stroke={SK} strokeWidth={SW} />
        <circle cx="37" cy="53" r="5" fill={SK} />
        <circle cx="40" cy="50" r="2" fill="white" />
        <circle cx="63" cy="52" r="9" fill="white" stroke={SK} strokeWidth={SW} />
        <circle cx="63" cy="53" r="5" fill={SK} />
        <circle cx="66" cy="50" r="2" fill="white" />
      </>
    ),
    excited: (
      <>
        <circle cx="37" cy="52" r="10" fill="white" stroke={SK} strokeWidth={SW} />
        <circle cx="37" cy="53" r="6" fill={SK} />
        <circle cx="40" cy="49" r="2.5" fill="white" />
        <circle cx="63" cy="52" r="10" fill="white" stroke={SK} strokeWidth={SW} />
        <circle cx="63" cy="53" r="6" fill={SK} />
        <circle cx="66" cy="49" r="2.5" fill="white" />
      </>
    ),
    thinking: (
      <>
        {/* squinting eyes */}
        <path d="M 28 52 Q 37 47 46 52" stroke={SK} strokeWidth={SW+1} fill="none" strokeLinecap="round" />
        <path d="M 54 52 Q 63 47 72 52" stroke={SK} strokeWidth={SW+1} fill="none" strokeLinecap="round" />
      </>
    ),
    celebrating: (
      <>
        {/* star eyes */}
        <text x="27" y="58" fontSize="18" fill="#FFD700">★</text>
        <text x="53" y="58" fontSize="18" fill="#FFD700">★</text>
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 100 130"
      width={size}
      height={size * 1.3}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Body ── */}
      {/* Purple shirt */}
      <rect x="22" y="90" width="56" height="38" rx="12" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      {/* White star on shirt */}
      <text x="50" y="117" fontSize="16" textAnchor="middle" fill="white">⭐</text>
      {/* Arms */}
      <rect x="6"  y="90" width="18" height="30" rx="9" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      <rect x="76" y="90" width="18" height="30" rx="9" fill="#7C3AED" stroke={SK} strokeWidth={SW} />
      {/* Hands */}
      <circle cx="15" cy="120" r="8" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />
      <circle cx="85" cy="120" r="8" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />
      {/* Legs */}
      <rect x="28" y="123" width="18" height="7" rx="3" fill="#3B5BDB" stroke={SK} strokeWidth="2" />
      <rect x="54" y="123" width="18" height="7" rx="3" fill="#3B5BDB" stroke={SK} strokeWidth="2" />

      {/* ── Neck ── */}
      <rect x="43" y="84" width="14" height="10" rx="5" fill="#FCD5AE" />

      {/* ── Hair (back layer, behind face) ── */}
      {/* Top puff */}
      <ellipse cx="50" cy="22" rx="36" ry="26" fill={SK} />
      {/* Side bobs */}
      <ellipse cx="16" cy="48" rx="12" ry="20" fill={SK} />
      <ellipse cx="84" cy="48" rx="12" ry="20" fill={SK} />

      {/* ── Face ── */}
      <circle cx="50" cy="50" r="34" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />

      {/* ── Bangs ── */}
      <ellipse cx="50" cy="23" rx="30" ry="14" fill={SK} />

      {/* ── Ears ── */}
      <circle cx="16" cy="52" r="9" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />
      <circle cx="84" cy="52" r="9" fill="#FCD5AE" stroke={SK} strokeWidth={SW} />

      {/* ── Eyes ── */}
      {eyes[expression]}

      {/* ── Eyebrows ── */}
      <path d="M 29 42 Q 37 38 45 42" stroke={SK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 55 42 Q 63 38 71 42" stroke={SK} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── Nose ── */}
      <ellipse cx="50" cy="60" rx="3" ry="2" fill="#E8A882" />

      {/* ── Mouth ── */}
      {mouths[expression]}

      {/* ── Blush ── */}
      <circle cx="26" cy="62" r="8" fill="#FFB3C6" opacity="0.5" />
      <circle cx="74" cy="62" r="8" fill="#FFB3C6" opacity="0.5" />

      {/* ── Hair highlight ── */}
      <ellipse cx="38" cy="20" rx="7" ry="3.5" fill="#3a2a18" transform="rotate(-25 38 20)" />
    </svg>
  );
}
