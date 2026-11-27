// ── Where's Noel? pieces ──
// Simple painted objects for the busy seek-and-find scenes, each drawn in
// a 100 × 100 box (centre 50,50, resting on about y = 94) with the warm
// brown outline. Bright, light bodies so they read on every scene.
// Animals in the crowd are the chibi critters (CritterSprite), not these.

import type { ReactNode } from 'react';

const SK = '#3b2416';
const S = 4; // outline width in the 100-box

export type PieceKind =
  | 'pine' | 'tree' | 'mushroom' | 'flower' | 'leaf' | 'strawberry' | 'bush' | 'acorn' | 'bamboo'
  | 'basket' | 'apple' | 'carrot' | 'bread' | 'cheese' | 'grapes' | 'pot' | 'bucket' | 'pretzel' | 'cookie'
  | 'snowman' | 'snowflake' | 'peak' | 'ice' | 'cloud' | 'star'
  | 'moon' | 'tulip' | 'fern' | 'sparkle' | 'lantern';

export const PIECES: Record<PieceKind, ReactNode> = {
  pine: (
    <>
      <rect x="44" y="76" width="12" height="18" rx="3" fill="#B7793F" stroke={SK} strokeWidth={S} />
      <path d="M50 6 L80 52 H64 L86 80 H14 L36 52 H20z" fill="#5FBF6A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M50 14 L38 48 M46 56 L30 76" stroke="#B5EBA9" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  tree: (
    <>
      <path d="M44 94 L46 62 H54 L56 94z" fill="#B7793F" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="50" cy="40" r="32" fill="#7ACB5A" stroke={SK} strokeWidth={S} />
      <circle cx="38" cy="30" r="9" fill="#B5EBA9" />
      <circle cx="62" cy="48" r="4" fill="#F87171" stroke={SK} strokeWidth="2" />
      <circle cx="40" cy="54" r="4" fill="#F87171" stroke={SK} strokeWidth="2" />
    </>
  ),
  mushroom: (
    <>
      <path d="M38 94 Q36 70 42 56 H58 Q64 70 62 94z" fill="#FFF4DE" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M8 58 Q12 14 50 12 Q88 14 92 58z" fill="#F05A5A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="32" cy="38" r="7" fill="#FFFFFF" /><circle cx="58" cy="28" r="6" fill="#FFFFFF" /><circle cx="72" cy="46" r="5" fill="#FFFFFF" />
    </>
  ),
  flower: (
    <>
      <path d="M50 94 V52" stroke="#3E9A4A" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 78 Q32 70 28 80 Q40 88 50 80" fill="#6CC36B" stroke={SK} strokeWidth="3" />
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="50" cy="20" rx="12" ry="16" fill="#FF9EC7" stroke={SK} strokeWidth="3.4" transform={`rotate(${a} 50 38)`} />
      ))}
      <circle cx="50" cy="38" r="10" fill="#FFD84D" stroke={SK} strokeWidth="3.4" />
    </>
  ),
  leaf: (
    <>
      <path d="M12 82 Q16 18 88 14 Q84 80 12 82z" fill="#8BD46A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 80 Q46 52 84 18" stroke={SK} strokeWidth="3" fill="none" />
      <path d="M40 58 L36 40 M56 42 L54 26 M44 56 L62 58 M60 40 L76 44" stroke={SK} strokeWidth="2" opacity="0.6" />
    </>
  ),
  strawberry: (
    <>
      <path d="M50 92 Q14 66 22 40 Q50 30 78 40 Q86 66 50 92z" fill="#F0525A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M28 38 L40 22 L50 34 L60 22 L72 38 Q50 46 28 38z" fill="#5FBF6A" stroke={SK} strokeWidth="3.4" strokeLinejoin="round" />
      {[[38, 52], [56, 50], [46, 66], [62, 64], [50, 80], [34, 64]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.4" ry="3.4" fill="#FFE27A" />)}
    </>
  ),
  bush: (
    <>
      <path d="M8 92 Q4 66 24 62 Q24 36 48 40 Q60 22 76 42 Q96 46 92 70 Q98 92 80 92z" fill="#6CC36B" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M26 66 Q34 56 44 60 M60 52 Q70 46 78 54" stroke="#B5EBA9" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  acorn: (
    <>
      <path d="M26 46 Q24 86 50 92 Q76 86 74 46z" fill="#E0A458" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M18 48 Q20 24 50 22 Q80 24 82 48z" fill="#9A6234" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M50 22 Q52 10 60 8" stroke={SK} strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="62" rx="5" ry="10" fill="#FFF1D6" opacity="0.7" />
    </>
  ),
  bamboo: (
    <>
      <rect x="38" y="8" width="24" height="86" rx="8" fill="#9BE36B" stroke={SK} strokeWidth={S} />
      <path d="M38 36 H62 M38 64 H62" stroke={SK} strokeWidth={S} />
      <path d="M44 14 V32 M44 42 V60 M44 70 V88" stroke="#E2FFC8" strokeWidth="4" strokeLinecap="round" />
      <path d="M62 34 Q84 20 92 30 Q80 42 62 38z" fill="#5FBF6A" stroke={SK} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  basket: (
    <>
      <path d="M24 46 Q50 0 76 46" stroke={SK} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M24 46 Q50 0 76 46" stroke="#E0A458" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M10 44 H90 L80 92 H20z" fill="#E0A458" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 60 H86 M17 76 H83 M34 46 L36 92 M50 46 V92 M66 46 L64 92" stroke={SK} strokeWidth="2.4" opacity="0.55" />
    </>
  ),
  apple: (
    <>
      <path d="M50 30 Q22 14 14 44 Q12 80 36 92 Q50 86 64 92 Q88 80 86 44 Q78 14 50 30z" fill="#F0525A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M50 30 Q50 18 56 8" stroke={SK} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M56 18 Q70 6 80 14 Q70 26 56 18z" fill="#5FBF6A" stroke={SK} strokeWidth="3" />
      <ellipse cx="32" cy="46" rx="6" ry="10" fill="#FFFFFF" opacity="0.55" />
    </>
  ),
  carrot: (
    <>
      <path d="M40 30 Q22 30 28 46 L54 94 Q60 90 72 46 Q74 30 58 30z" fill="#FB923C" stroke={SK} strokeWidth={S} strokeLinejoin="round" transform="rotate(-18 50 60)" />
      <path d="M44 28 Q34 8 40 4 Q50 14 50 28 Q56 6 66 8 Q64 22 56 30z" fill="#5FBF6A" stroke={SK} strokeWidth="3" strokeLinejoin="round" transform="rotate(-18 50 60)" />
      <path d="M36 50 H48 M42 64 H52 M48 78 H56" stroke={SK} strokeWidth="2.4" opacity="0.6" transform="rotate(-18 50 60)" />
    </>
  ),
  bread: (
    <>
      <path d="M8 64 Q8 34 50 30 Q92 34 92 64 Q92 80 50 82 Q8 80 8 64z" fill="#E7A65A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 44 L36 60 M48 40 L54 58 M66 42 L72 58" stroke="#FFE7B8" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  cheese: (
    <>
      <path d="M8 76 L84 44 L92 76z" fill="#FFD84D" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M8 76 H92 V90 H8z" fill="#F5C33B" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="60" cy="64" r="5" fill="#E6A817" /><circle cx="78" cy="82" r="4" fill="#E6A817" /><circle cx="34" cy="83" r="3.4" fill="#E6A817" />
    </>
  ),
  grapes: (
    <>
      <path d="M50 18 Q52 8 60 6" stroke={SK} strokeWidth="5" fill="none" strokeLinecap="round" />
      {[[36, 30], [52, 28], [68, 30], [44, 46], [60, 46], [36, 62], [52, 62], [68, 60], [44, 78], [58, 78], [51, 92]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y - 4} r="9.5" fill="#B57CF0" stroke={SK} strokeWidth="3" />
      ))}
      <circle cx="33" cy="23" r="3" fill="#FFFFFF" opacity="0.7" />
    </>
  ),
  pot: (
    <>
      <path d="M36 14 H64 V26 Q86 40 82 66 Q78 92 50 92 Q22 92 18 66 Q14 40 36 26z" fill="#E07A4F" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M22 54 Q50 64 78 54" stroke="#FFE1C4" strokeWidth="5" fill="none" />
      <rect x="32" y="8" width="36" height="10" rx="4" fill="#E07A4F" stroke={SK} strokeWidth={S} />
    </>
  ),
  bucket: (
    <>
      <path d="M22 30 Q50 -4 78 30" stroke={SK} strokeWidth="4" fill="none" />
      <path d="M14 30 H86 L76 92 H24z" fill="#7CC4F0" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M16 44 H84" stroke={SK} strokeWidth="3" opacity="0.6" />
      <ellipse cx="50" cy="30" rx="36" ry="6" fill="#4A9BD0" stroke={SK} strokeWidth="3" />
    </>
  ),
  pretzel: (
    <>
      <path d="M50 54 Q22 20 16 42 Q12 66 36 80 Q50 88 64 80 Q88 66 84 42 Q78 20 50 54z M36 80 L64 40 M64 80 L36 40"
        fill="none" stroke={SK} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 54 Q22 20 16 42 Q12 66 36 80 Q50 88 64 80 Q88 66 84 42 Q78 20 50 54z M36 80 L64 40 M64 80 L36 40"
        fill="none" stroke="#C98642" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      {[[22, 46], [78, 46], [50, 82], [44, 60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#FFFFFF" />)}
    </>
  ),
  cookie: (
    <>
      <circle cx="50" cy="52" r="40" fill="#E2A65E" stroke={SK} strokeWidth={S} />
      <circle cx="50" cy="52" r="32" fill="#EDB873" />
      {[[36, 38], [60, 34], [64, 58], [42, 64], [52, 50], [30, 56]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="4" fill="#6B3E1E" />)}
    </>
  ),
  snowman: (
    <>
      <circle cx="50" cy="70" r="24" fill="#FFFFFF" stroke={SK} strokeWidth={S} />
      <circle cx="50" cy="34" r="17" fill="#FFFFFF" stroke={SK} strokeWidth={S} />
      <path d="M36 22 H64 L60 6 H40z" fill="#4B5563" stroke={SK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="44" cy="32" r="2.6" fill={SK} /><circle cx="56" cy="32" r="2.6" fill={SK} />
      <path d="M50 37 L62 40 L50 41z" fill="#FB923C" stroke={SK} strokeWidth="1.6" />
      <path d="M34 50 Q50 58 66 50 L68 56 Q50 64 32 56z" fill="#F05A5A" stroke={SK} strokeWidth="2.4" />
      <circle cx="50" cy="66" r="2.6" fill={SK} /><circle cx="50" cy="78" r="2.6" fill={SK} />
    </>
  ),
  snowflake: (
    <>
      {[0, 60, 120].map(a => (
        <g key={a} transform={`rotate(${a} 50 50)`}>
          <path d="M50 10 V90 M40 18 L50 28 L60 18 M40 82 L50 72 L60 82" stroke={SK} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 10 V90 M40 18 L50 28 L60 18 M40 82 L50 72 L60 82" stroke="#E0F4FF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </>
  ),
  peak: (
    <>
      <path d="M4 92 L40 20 L58 50 L68 36 L96 92z" fill="#8FA9C8" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 40 L40 20 L52 40 L46 36 L40 44 L34 36z M62 44 L68 36 L76 50 L70 48z" fill="#FFFFFF" stroke={SK} strokeWidth="2.4" strokeLinejoin="round" />
    </>
  ),
  ice: (
    <>
      <path d="M18 34 L50 20 L82 34 V74 L50 90 L18 74z" fill="#BDEBFF" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M18 34 L50 48 L82 34 M50 48 V90" stroke={SK} strokeWidth="3" fill="none" />
      <path d="M26 44 L26 64" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  cloud: (
    <path d="M18 78 Q4 76 8 60 Q12 46 28 50 Q30 26 52 28 Q70 22 76 44 Q96 44 92 62 Q92 78 76 78z" fill="#FFFFFF" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
  ),
  star: (
    <>
      <path d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36z" fill="#FDE047" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="40" cy="40" r="5" fill="#FFFBE0" />
    </>
  ),
  moon: (
    <>
      <path d="M62 8 Q20 14 20 52 Q22 90 64 92 Q36 76 38 50 Q40 22 62 8z" fill="#FFE58A" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="30" cy="54" r="4" fill="#F2C94C" /><circle cx="38" cy="74" r="3" fill="#F2C94C" />
    </>
  ),
  tulip: (
    <>
      <path d="M50 94 V50" stroke="#3E9A4A" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 80 Q66 64 74 74 Q64 86 50 84" fill="#6CC36B" stroke={SK} strokeWidth="3" />
      <path d="M28 20 L38 32 L50 16 L62 32 L72 20 Q78 56 50 56 Q22 56 28 20z" fill="#F08AD0" stroke={SK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  fern: (
    <>
      <path d="M50 94 Q48 50 62 10" stroke="#6CC36B" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map(i => {
        const y = 80 - i * 15, x = 49 + i * 2.5;
        return (
          <g key={i}>
            <path d={`M${x} ${y} Q${x - 22} ${y - 8} ${x - 30} ${y + 2} Q${x - 16} ${y + 8} ${x} ${y}z`} fill="#A8EC8E" stroke={SK} strokeWidth="2.6" />
            <path d={`M${x} ${y} Q${x + 22} ${y - 10} ${x + 28} ${y} Q${x + 14} ${y + 8} ${x} ${y}z`} fill="#A8EC8E" stroke={SK} strokeWidth="2.6" />
          </g>
        );
      })}
    </>
  ),
  sparkle: (
    <>
      <path d="M50 6 Q56 44 94 50 Q56 56 50 94 Q44 56 6 50 Q44 44 50 6z" fill="#FFF6B0" stroke={SK} strokeWidth="3.4" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
    </>
  ),
  lantern: (
    <>
      <path d="M40 16 Q50 2 60 16" stroke={SK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="34" y="14" width="32" height="8" rx="3" fill="#C9822F" stroke={SK} strokeWidth="3.4" />
      <path d="M22 50 Q22 24 50 22 Q78 24 78 50 Q78 78 50 80 Q22 78 22 50z" fill="#FF7A59" stroke={SK} strokeWidth={S} />
      <path d="M50 22 V80 M36 26 Q30 50 36 76 M64 26 Q70 50 64 76" stroke={SK} strokeWidth="2.4" opacity="0.5" fill="none" />
      <ellipse cx="50" cy="52" rx="10" ry="16" fill="#FFE58A" opacity="0.85" />
      <rect x="38" y="78" width="24" height="8" rx="3" fill="#C9822F" stroke={SK} strokeWidth="3.4" />
      <path d="M50 86 V96" stroke="#F05A5A" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
};

/** one piece as a standalone little picture (for the find list and intro) */
export function PieceIcon({ kind, size, dim = false }: { kind: PieceKind; size: number; dim?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'inline-block', overflow: 'visible', opacity: dim ? 0.35 : 1 }}>
      <g filter="url(#kp-brush)">{PIECES[kind]}</g>
    </svg>
  );
}
