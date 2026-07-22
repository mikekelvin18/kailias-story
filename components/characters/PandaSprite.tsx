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
  const SK = '#3a2a28'; // soft warm dark brown — friendlier than near-black

  const mouths: Record<Expression, React.ReactNode> = {
    happy:       <path d="M 42 70 Q 50 77 58 70" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    excited:     <path d="M 41 69 Q 50 82 59 69 Q 50 75 41 69 Z" stroke={SK} strokeWidth="2" fill="#FF8080" strokeLinecap="round" />,
    thinking:    <path d="M 43 71 Q 50 67 57 71" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
    celebrating: <path d="M 40 68 Q 50 81 60 68 Q 50 74 40 68 Z" stroke={SK} strokeWidth="2" fill="#FF8080" strokeLinecap="round" />,
    sleepy:      <path d="M 44 71 Q 50 74 56 71" stroke={SK} strokeWidth={SW} fill="none" strokeLinecap="round" />,
  };

  // Eye patches sized so the white eyeball dominates — a small dark patch
  // with a big friendly white eye reads as cute; a big black patch with a
  // small eye reads as a blank stare, which is what made Noel look scary.
  const eyes: Record<Expression, React.ReactNode> = {
    happy: (
      <>
        <ellipse cx="35" cy="52" rx="12" ry="11" fill={SK} />
        <ellipse cx="65" cy="52" rx="12" ry="11" fill={SK} />
        <circle cx="35" cy="53" r="8.5" fill="white" />
        <circle cx="65" cy="53" r="8.5" fill="white" />
        <circle cx="35" cy="54.5" r="4.2" fill={SK} />
        <circle cx="65" cy="54.5" r="4.2" fill={SK} />
        <circle cx="37.5" cy="50.5" r="2" fill="white" />
        <circle cx="67.5" cy="50.5" r="2" fill="white" />
      </>
    ),
    excited: (
      <>
        <ellipse cx="35" cy="52" rx="12" ry="11" fill={SK} />
        <ellipse cx="65" cy="52" rx="12" ry="11" fill={SK} />
        <circle cx="35" cy="53" r="9" fill="white" />
        <circle cx="65" cy="53" r="9" fill="white" />
        <circle cx="35" cy="54.5" r="5" fill={SK} />
        <circle cx="65" cy="54.5" r="5" fill={SK} />
        <circle cx="37.5" cy="50" r="2.2" fill="white" />
        <circle cx="67.5" cy="50" r="2.2" fill="white" />
      </>
    ),
    thinking: (
      <>
        <ellipse cx="35" cy="52" rx="12" ry="11" fill={SK} />
        <ellipse cx="65" cy="52" rx="12" ry="11" fill={SK} />
        {/* Half-closed eyes */}
        <path d="M 23 54 Q 35 48 47 54 Q 35 58 23 54" fill="white" />
        <path d="M 53 54 Q 65 48 77 54 Q 65 58 53 54" fill="white" />
        <circle cx="35" cy="54" r="3" fill={SK} />
        <circle cx="65" cy="54" r="3" fill={SK} />
      </>
    ),
    celebrating: (
      <>
        <ellipse cx="35" cy="52" rx="12" ry="11" fill={SK} />
        <ellipse cx="65" cy="52" rx="12" ry="11" fill={SK} />
        <text x="22" y="60" fontSize="16" fill="#FFD700">★</text>
        <text x="52" y="60" fontSize="16" fill="#FFD700">★</text>
      </>
    ),
    sleepy: (
      <>
        <ellipse cx="35" cy="52" rx="12" ry="11" fill={SK} />
        <ellipse cx="65" cy="52" rx="12" ry="11" fill={SK} />
        {/* Closed eyes */}
        <path d="M 24 54 Q 35 50 46 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 54 54 Q 65 50 76 54" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <text x="72" y="28" fontSize="14">💤</text>
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 120 140"
      width={size * 1.2}
      height={size * 1.4}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Shadow ── */}
      <ellipse cx="60" cy="136" rx="38" ry="5" fill="rgba(0,0,0,0.1)" />

      {/* ── Body — big and round ── */}
      <ellipse cx="60" cy="106" rx="42" ry="34" fill="white" stroke={SK} strokeWidth={SW} />
      {/* Tummy oval */}
      <ellipse cx="60" cy="108" rx="26" ry="22" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />

      {/* Purple scarf — matches Kailia */}
      <ellipse cx="60" cy="80" rx="27" ry="9" fill="#7C3AED" stroke={SK} strokeWidth="2" />
      {/* Scarf knot dangle */}
      <rect x="34" y="80" width="12" height="19" rx="6" fill="#7C3AED" stroke={SK} strokeWidth="2" />

      {/* Bamboo in right hand */}
      <rect x="92" y="88" width="7" height="34" rx="3.5" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <ellipse cx="95.5" cy="88" rx="6" ry="5" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
      <rect x="90" y="98" width="12" height="4.5" rx="2" fill="#22c55e" />
      <rect x="90" y="112" width="12" height="4.5" rx="2" fill="#22c55e" />

      {/* Arms (stubby, round and chunky) */}
      <ellipse cx="15" cy="108" rx="15" ry="11" fill={SK} stroke={SK} strokeWidth="1" transform="rotate(-15 15 108)" />
      <ellipse cx="105" cy="108" rx="15" ry="11" fill={SK} stroke={SK} strokeWidth="1" transform="rotate(15 105 108)" />

      {/* Legs */}
      <ellipse cx="41" cy="137" rx="15" ry="8" fill={SK} />
      <ellipse cx="79" cy="137" rx="15" ry="8" fill={SK} />

      {/* ── Head — bigger ── */}
      <circle cx="60" cy="46" r="44" fill="white" stroke={SK} strokeWidth={SW} />

      {/* ── Ears (black patches on top) ── */}
      <circle cx="20" cy="12" r="18" fill={SK} stroke={SK} strokeWidth="1" />
      <circle cx="100" cy="12" r="18" fill={SK} stroke={SK} strokeWidth="1" />
      {/* Ear inner colour */}
      <circle cx="20" cy="12" r="10" fill="#2a1a18" />
      <circle cx="100" cy="12" r="10" fill="#2a1a18" />

      {/* ── Eyes ── */}
      <g transform="translate(10, -2)">{eyes[expression]}</g>

      {/* ── Nose ── */}
      <ellipse cx="60" cy="62" rx="7" ry="5" fill={SK} />
      <ellipse cx="59" cy="61" rx="2.3" ry="1.7" fill="#e8d8c8" opacity="0.4" />

      {/* ── Mouth ── */}
      <g transform="translate(10, 0)">{mouths[expression]}</g>

      {/* ── Cheeks ── */}
      <circle cx="30" cy="64" r="10" fill="#FFB3C6" opacity="0.5" />
      <circle cx="90" cy="64" r="10" fill="#FFB3C6" opacity="0.5" />
    </svg>
  );
}
