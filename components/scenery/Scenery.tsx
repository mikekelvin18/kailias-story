// ── Illustrated scenery ──
// Replaces flat emoji (🏔️ 🌲 ☁️ 🌋 🍄) with small layered SVG illustrations
// drawn in the same bold-outline, gradient-shaded style as the character
// sprites (KailiaSprite/PandaSprite/CritterSprite) — so the world map and
// game backgrounds read as one consistent illustrated place instead of a
// scatter of plain system emoji. Procedural, not photographic: no image
// generation tool is available, so depth/richness comes from layering,
// gradients, and shading rather than photo-real textures.

import type { CSSProperties } from 'react';

interface Props {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const SK = '#1a1108';
let uid = 0;
function useGradId(prefix: string) {
  uid += 1;
  return `${prefix}-${uid}`;
}

export function Mountain({ size = 48, className, style }: Props) {
  const g1 = useGradId('mtn');
  const g2 = useGradId('mtnSnow');
  return (
    <svg viewBox="0 0 100 70" width={size} height={size * 0.7} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={g2} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      {/* back peak */}
      <path d="M 38 68 L 62 22 L 86 68 Z" fill="#CBD5E1" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      {/* front peak */}
      <path d="M 4 68 L 34 14 L 64 68 Z" fill={`url(#${g1})`} stroke={SK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 34 14 L 24 34 L 44 34 Z" fill={`url(#${g2})`} stroke={SK} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Volcano({ size = 48, className, style }: Props) {
  const g1 = useGradId('volc');
  return (
    <svg viewBox="0 0 100 70" width={size} height={size * 0.7} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#7C2D12" />
        </linearGradient>
      </defs>
      <path d="M 6 68 L 36 16 L 64 68 Z" fill={`url(#${g1})`} stroke={SK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 24 34 L 36 16 L 48 34 Z" fill="#F97316" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="36" cy="17" rx="7" ry="4" fill="#FDE047" opacity="0.9" />
      <path d="M 38 8 Q 44 2 40 -4" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function PineTree({ size = 36, className, style }: Props) {
  const g1 = useGradId('pine');
  return (
    <svg viewBox="0 0 60 80" width={size} height={size * 1.33} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="74" rx="14" ry="4" fill="#00000022" />
      <rect x="25" y="56" width="10" height="16" rx="2" fill="#92400E" stroke={SK} strokeWidth="2" />
      <path d="M 30 4 L 50 34 L 40 34 L 54 58 L 6 58 L 20 34 L 10 34 Z" fill={`url(#${g1})`} stroke={SK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 30 4 L 42 26 L 36 26 Z" fill="#86EFAC" opacity="0.6" />
    </svg>
  );
}

export function Cloud({ size = 40, className, style }: Props) {
  const g1 = useGradId('cloud');
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DCE7F5" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="38" rx="24" ry="18" fill={`url(#${g1})`} stroke={SK} strokeWidth="2" />
      <ellipse cx="55" cy="30" rx="26" ry="20" fill={`url(#${g1})`} stroke={SK} strokeWidth="2" />
      <ellipse cx="78" cy="40" rx="18" ry="14" fill={`url(#${g1})`} stroke={SK} strokeWidth="2" />
      <ellipse cx="52" cy="46" rx="40" ry="12" fill={`url(#${g1})`} stroke={SK} strokeWidth="2" />
    </svg>
  );
}

export function Mushroom({ size = 28, className, style }: Props) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="34" width="12" height="20" rx="4" fill="#FEF3E2" stroke={SK} strokeWidth="2" />
      <path d="M 6 34 Q 6 12 30 12 Q 54 12 54 34 Z" fill="#EF4444" stroke={SK} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="20" cy="24" rx="5" ry="4" fill="#FEF3E2" />
      <ellipse cx="38" cy="20" rx="4" ry="3.5" fill="#FEF3E2" />
      <ellipse cx="30" cy="30" rx="4.5" ry="3.5" fill="#FEF3E2" />
    </svg>
  );
}

export function Rainbow({ size = 44, className, style }: Props) {
  const bands = ['#EF4444', '#F97316', '#FDE047', '#4ADE80', '#38BDF8', '#818CF8'];
  return (
    <svg viewBox="0 0 100 55" width={size} height={size * 0.55} className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      {bands.map((c, i) => (
        <path key={c} d={`M ${5 + i * 1.5} 52 A ${45 - i * 7.5} ${45 - i * 7.5} 0 0 1 ${95 - i * 1.5} 52`}
          fill="none" stroke={c} strokeWidth="7" strokeLinecap="round" />
      ))}
    </svg>
  );
}
