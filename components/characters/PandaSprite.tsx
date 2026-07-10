// Noel — Giant Panda best friend. Bold sticker-style. Simple = cute.
// Placeholder SVG drawing; swap in real art via characters.config.ts.

import Image from 'next/image';
import { CHARACTER_IMAGES, type CharacterExpression } from './characters.config';

type Expression = CharacterExpression;

interface Props {
  size?: number;
  expression?: Expression;
  className?: string;
  style?: React.CSSProperties;
}

export default function PandaSprite({ size = 120, expression = 'happy', className, style }: Props) {
  const imagePath = CHARACTER_IMAGES.noel[expression];
  if (imagePath) {
    return (
      <Image
        src={imagePath}
        alt="Noel"
        width={size}
        height={size * 1.2}
        className={className}
        style={{ objectFit: 'contain', ...style }}
      />
    );
  }

  const SW = 3;
  const SK = '#1a1108';

  const mouths: Record<Expression, React.ReactNode> = {
    happy:       <path d="M 42 70 Q 50 79 58 70" stroke={SK} strokeWidth={SW} fill="#FF8080" strokeLinecap="round" />,
    excited:     <ellipse cx="50" cy="72" rx="10" ry="8" fill={SK} />,
    thinking:    <path d="M 43 71 Q 50 67 57 71" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    celebrating: <path d="M 39 69 Q 50 80 61 69" stroke={SK} strokeWidth={SW} fill="#FF8080" strokeLinecap="round" />,
    sleepy:      <path d="M 44 71 Q 50 74 56 71" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
  };

  const eyes: Record<Expression, React.ReactNode> = {
    happy: (
      <>
        {/* Eye patches */}
        <ellipse cx="35" cy="52" rx="13" ry="12" fill={SK} />
        <ellipse cx="65" cy="52" rx="13" ry="12" fill={SK} />
        {/* White eyeballs */}
        <circle cx="35" cy="53" r="7" fill="white" />
        <circle cx="65" cy="53" r="7" fill="white" />
        {/* Pupils */}
        <circle cx="35" cy="54" r="4" fill={SK} />
        <circle cx="65" cy="54" r="4" fill={SK} />
        {/* Shine */}
        <circle cx="37" cy="51" r="1.8" fill="white" />
        <circle cx="67" cy="51" r="1.8" fill="white" />
      </>
    ),
    excited: (
      <>
        <ellipse cx="35" cy="52" rx="13" ry="12" fill={SK} />
        <ellipse cx="65" cy="52" rx="13" ry="12" fill={SK} />
        <circle cx="35" cy="53" r="8" fill="white" />
        <circle cx="65" cy="53" r="8" fill="white" />
        <circle cx="35" cy="54" r="5" fill={SK} />
        <circle cx="65" cy="54" r="5" fill={SK} />
        <circle cx="37" cy="50" r="2" fill="white" />
        <circle cx="67" cy="50" r="2" fill="white" />
      </>
    ),
    thinking: (
      <>
        <ellipse cx="35" cy="52" rx="13" ry="12" fill={SK} />
        <ellipse cx="65" cy="52" rx="13" ry="12" fill={SK} />
        {/* Half-closed eyes */}
        <path d="M 23 54 Q 35 48 47 54 Q 35 58 23 54" fill="white" />
        <path d="M 53 54 Q 65 48 77 54 Q 65 58 53 54" fill="white" />
        <circle cx="35" cy="54" r="3" fill={SK} />
        <circle cx="65" cy="54" r="3" fill={SK} />
      </>
    ),
    celebrating: (
      <>
        <ellipse cx="35" cy="52" rx="13" ry="12" fill={SK} />
        <ellipse cx="65" cy="52" rx="13" ry="12" fill={SK} />
        <text x="22" y="60" fontSize="16" fill="#FFD700">★</text>
        <text x="52" y="60" fontSize="16" fill="#FFD700">★</text>
      </>
    ),
    sleepy: (
      <>
        <ellipse cx="35" cy="52" rx="13" ry="12" fill={SK} />
        <ellipse cx="65" cy="52" rx="13" ry="12" fill={SK} />
        {/* Closed eyes */}
        <path d="M 24 54 Q 35 50 46 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 54 54 Q 65 50 76 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="72" y="28" fontSize="14">💤</text>
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Shadow ── */}
      <ellipse cx="50" cy="117" rx="28" ry="4" fill="rgba(0,0,0,0.1)" />

      {/* ── Body ── */}
      <ellipse cx="50" cy="97" rx="30" ry="26" fill="white" stroke={SK} strokeWidth={SW} />
      {/* Tummy oval */}
      <ellipse cx="50" cy="97" rx="18" ry="16" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />

      {/* Purple scarf — matches Kailia */}
      <ellipse cx="50" cy="77" rx="22" ry="8" fill="#7C3AED" stroke={SK} strokeWidth="2" />
      {/* Scarf knot dangle */}
      <rect x="28" y="77" width="10" height="16" rx="5" fill="#7C3AED" stroke={SK} strokeWidth="2" />

      {/* Bamboo in right hand */}
      <rect x="76" y="82" width="6" height="30" rx="3" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <ellipse cx="79" cy="82" rx="5" ry="4" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
      <rect x="74" y="90" width="10" height="4" rx="2" fill="#22c55e" />
      <rect x="74" y="102" width="10" height="4" rx="2" fill="#22c55e" />

      {/* Arms (stubby) */}
      <ellipse cx="17" cy="98" rx="11" ry="8" fill={SK} stroke={SK} strokeWidth="1" transform="rotate(-20 17 98)" />
      <ellipse cx="83" cy="98" rx="11" ry="8" fill={SK} stroke={SK} strokeWidth="1" transform="rotate(20 83 98)" />

      {/* Legs */}
      <ellipse cx="36" cy="118" rx="11" ry="6" fill={SK} />
      <ellipse cx="64" cy="118" rx="11" ry="6" fill={SK} />

      {/* ── Head ── */}
      <circle cx="50" cy="48" r="38" fill="white" stroke={SK} strokeWidth={SW} />

      {/* ── Ears (black patches on top) ── */}
      <circle cx="16" cy="17" r="16" fill={SK} stroke={SK} strokeWidth="1" />
      <circle cx="84" cy="17" r="16" fill={SK} stroke={SK} strokeWidth="1" />
      {/* Ear inner colour */}
      <circle cx="16" cy="17" r="9" fill="#2a1a18" />
      <circle cx="84" cy="17" r="9" fill="#2a1a18" />

      {/* ── Eyes ── */}
      {eyes[expression]}

      {/* ── Nose ── */}
      <ellipse cx="50" cy="63" rx="6" ry="4" fill={SK} />
      <ellipse cx="49" cy="62" rx="2" ry="1.5" fill="#3a2a28" />

      {/* ── Mouth ── */}
      {mouths[expression]}

      {/* ── Cheeks ── */}
      <circle cx="24" cy="65" r="9" fill="#FFB3C6" opacity="0.5" />
      <circle cx="76" cy="65" r="9" fill="#FFB3C6" opacity="0.5" />
    </svg>
  );
}
