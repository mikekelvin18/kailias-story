// ── Sense Explorer's drawn pieces ──
// Simple painted objects (fruit, shapes, treats, veg) for the hunts,
// in place of emoji. Each is drawn on a 40×40 grid with the warm brown
// outline and the shared brush filter. Ids with no drawing (the animals
// in the wings / four-legs hunts) fall back to showing the id as text.

import type { ReactNode } from 'react';

const SK = '#3b2416';
const shine = (cx: number, cy: number, rx = 2.4, ry = 3.6) =>
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" opacity="0.55" stroke="none" />;

const balloon = (c: string) => (
  <>
    <path d="M20 31 Q17 34 20 36 Q23 38 20 39" fill="none" />
    <ellipse cx="20" cy="16" rx="11" ry="13" fill={c} />
    <path d="M18 29 L22 29 L20 32z" fill={c} />
    {shine(15, 11)}
  </>
);
const heart = (c: string) => (
  <>
    <path d="M20 34 C8 25 4 18 6 12 C8 6 16 5 20 11 C24 5 32 6 34 12 C36 18 32 25 20 34z" fill={c} />
    {shine(12, 13, 2, 3)}
  </>
);
const block = (c: string) => (
  <>
    <rect x="7" y="7" width="26" height="26" rx="3" fill={c} />
    <path d="M11 11 H22" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
  </>
);

export const DRAW: Record<string, ReactNode> = {
  apple: (
    <>
      <path d="M20 12 C12 6 4 12 6 22 C8 32 15 36 20 33 C25 36 32 32 34 22 C36 12 28 6 20 12z" fill="#E53935" />
      <path d="M20 12 Q20 7 23 4" fill="none" />
      <path d="M21 9 Q27 4 31 8 Q26 12 21 9z" fill="#5DBB63" />
      {shine(12, 18)}
    </>
  ),
  strawberry: (
    <>
      <path d="M8 14 Q20 8 32 14 Q32 26 20 36 Q8 26 8 14z" fill="#E53935" />
      <path d="M10 14 L15 9 L18 13 L20 7 L22 13 L25 9 L30 14 Q20 17 10 14z" fill="#5DBB63" />
      {[[15, 20], [23, 20], [19, 25], [26, 25], [20, 30], [13, 24]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#FFE082" stroke="none" />)}
    </>
  ),
  'balloon-red': balloon('#E53935'),
  'balloon-blue': balloon('#1E88E5'),
  'mushroom-red': (
    <>
      <path d="M15 21 L14 33 Q20 36 26 33 L25 21z" fill="#FFF3E0" />
      <path d="M5 21 Q6 7 20 7 Q34 7 35 21z" fill="#E53935" />
      <circle cx="12" cy="15" r="2.2" fill="#FFFFFF" stroke="none" /><circle cx="21" cy="11" r="2" fill="#FFFFFF" stroke="none" /><circle cx="28" cy="16" r="2" fill="#FFFFFF" stroke="none" />
    </>
  ),
  cherries: (
    <>
      <path d="M13 26 Q16 12 26 6 M27 25 Q26 14 26 6" fill="none" />
      <path d="M26 6 Q32 2 35 6 Q30 9 26 6z" fill="#5DBB63" />
      <circle cx="13" cy="28" r="7" fill="#D32F2F" /><circle cx="27" cy="27" r="7" fill="#D32F2F" />
      {shine(11, 26, 1.6, 2.2)}{shine(25, 25, 1.6, 2.2)}
    </>
  ),
  'heart-red': heart('#E53935'),
  'heart-blue': heart('#1E88E5'),
  drop: (
    <>
      <path d="M20 4 C26 14 32 20 32 26 A12 12 0 0 1 8 26 C8 20 14 14 20 4z" fill="#1E88E5" />
      {shine(14, 25, 2, 4)}
    </>
  ),
  blueberries: (
    <>
      <circle cx="21" cy="13" r="7" fill="#3949AB" /><circle cx="13" cy="25" r="8" fill="#3949AB" /><circle cx="28" cy="24" r="8" fill="#3949AB" />
      <path d="M11 22 l2 2 l2 -2 M26 21 l2 2 l2 -2 M19 10 l2 2 l2 -2" fill="none" strokeWidth="1.2" />
    </>
  ),
  'gem-blue': (
    <>
      <path d="M8 15 L14 7 L26 7 L32 15 L20 34z" fill="#42A5F5" />
      <path d="M8 15 H32 M14 7 L17 15 L20 34 L23 15 L26 7" fill="none" strokeWidth="1.1" />
      {shine(14, 11, 1.4, 2)}
    </>
  ),
  'cup-blue': (
    <>
      <path d="M28 16 Q35 16 35 22 Q35 28 28 28" fill="none" strokeWidth="3" />
      <path d="M7 11 H28 V30 Q28 34 24 34 H11 Q7 34 7 30z" fill="#1E88E5" />
      <path d="M11 15 V27" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
    </>
  ),
  star: (
    <>
      <path d="M20 3 L25 14 L37 15 L28 23 L31 35 L20 29 L9 35 L12 23 L3 15 L15 14z" fill="#FFD54F" />
      {shine(16, 16, 1.6, 2.4)}
    </>
  ),
  sunflower: (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="20" cy="9" rx="4" ry="7" fill="#FFC107" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="7" fill="#8D5524" />
    </>
  ),
  lemon: (
    <>
      <path d="M3 20 Q6 9 20 9 Q34 9 37 20 Q34 31 20 31 Q6 31 3 20z" fill="#FFEB3B" />
      {shine(13, 15, 3, 1.8)}
    </>
  ),
  banana: (
    <>
      <path d="M7 10 Q8 31 30 33 Q36 33 35 28 Q16 27 12 8z" fill="#FFE135" />
      <path d="M7 10 L8 6 L12 8" fill="#8D6E63" />
    </>
  ),
  sun: (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M18 6 L20 1 L22 6z" fill="#FFB300" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="10" fill="#FFD54F" />
      {shine(16, 16, 2, 2.4)}
    </>
  ),
  leaf: (
    <>
      <path d="M6 34 Q4 10 34 6 Q32 32 6 34z" fill="#66BB6A" />
      <path d="M6 34 Q18 20 30 10" fill="none" />
    </>
  ),
  grapes: (
    <>
      <path d="M20 8 Q21 4 25 3" fill="none" />
      {[[13, 13], [20, 13], [27, 13], [16, 20], [24, 20], [20, 27]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4.6" fill="#8E24AA" />)}
    </>
  ),
  broccoli: (
    <>
      <path d="M16 22 L14 36 H26 L24 22z" fill="#AED581" />
      <circle cx="12" cy="17" r="7" fill="#43A047" /><circle cx="28" cy="17" r="7" fill="#43A047" />
      <circle cx="20" cy="11" r="8" fill="#43A047" /><circle cx="20" cy="20" r="6" fill="#43A047" />
    </>
  ),
  pear: (
    <>
      <path d="M20 7 Q20 4 23 2" fill="none" />
      <path d="M20 6 Q25 6 25 14 Q33 20 32 28 Q30 36 20 36 Q10 36 8 28 Q7 20 15 14 Q15 6 20 6z" fill="#9CCC65" />
      {shine(14, 25)}
    </>
  ),
  carrot: (
    <>
      <path d="M16 10 L13 3 M20 10 L20 2 M24 10 L27 3" stroke="#43A047" strokeWidth="2.6" fill="none" />
      <path d="M12 10 Q20 8 28 12 L19 37z" fill="#FB8C00" />
      <path d="M16 17 H21 M18 24 H22" fill="none" strokeWidth="1.2" />
    </>
  ),
  orange: (
    <>
      <circle cx="20" cy="22" r="13" fill="#FB8C00" />
      <path d="M20 9 Q25 4 29 7 Q25 11 20 9z" fill="#5DBB63" />
      {shine(14, 18)}
    </>
  ),
  ball: (
    <>
      <circle cx="20" cy="20" r="14" fill="#FFFFFF" />
      <path d="M20 6 Q11 20 20 34 Q7 31 6 20 Q7 9 20 6z" fill="#EF5350" />
      <path d="M20 6 Q29 20 20 34 Q33 31 34 20 Q33 9 20 6z" fill="#42A5F5" />
      <circle cx="20" cy="20" r="14" fill="none" />
    </>
  ),
  'ball-orange': (
    <>
      <circle cx="20" cy="20" r="14" fill="#F57C00" />
      <path d="M6 20 H34 M20 6 V34 M10 10 Q16 20 10 30 M30 10 Q24 20 30 30" fill="none" strokeWidth="1.3" />
    </>
  ),
  donut: (
    <>
      <circle cx="20" cy="20" r="14" fill="#D7A15B" />
      <path d="M8 18 Q9 8 20 7 Q31 8 32 18 Q30 22 27 20 Q24 26 20 23 Q16 27 13 21 Q10 23 8 18z" fill="#F48FB1" />
      <circle cx="20" cy="18" r="4.5" fill="#FFF8E7" />
      <path d="M12 13 l2 1 M26 12 l-1 2 M17 9 l2 0 M28 17 l1 1" stroke="#5E8BFF" strokeWidth="1.6" fill="none" />
    </>
  ),
  button: (
    <>
      <circle cx="20" cy="20" r="14" fill="#42A5F5" />
      <circle cx="20" cy="20" r="9.5" fill="none" strokeWidth="1.2" />
      {[[17, 17], [23, 17], [17, 23], [23, 23]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill={SK} stroke="none" />)}
    </>
  ),
  coin: (
    <>
      <circle cx="20" cy="20" r="14" fill="#FFC107" />
      <circle cx="20" cy="20" r="10" fill="#FFD54F" strokeWidth="1.2" />
      <path d="M20 13 L22 18 L27 18 L23 21 L24.5 26 L20 23 L15.5 26 L17 21 L13 18 L18 18z" fill="#FFB300" strokeWidth="1" />
    </>
  ),
  pizza: (
    <>
      <path d="M6 8 Q20 3 34 8 L20 37z" fill="#FFD54F" />
      <path d="M6 8 Q20 3 34 8 L32.5 12 Q20 7 7.5 12z" fill="#D7A15B" />
      <circle cx="17" cy="16" r="2.8" fill="#E53935" /><circle cx="24" cy="19" r="2.6" fill="#E53935" /><circle cx="20" cy="26" r="2.2" fill="#E53935" />
    </>
  ),
  'block-red': block('#E53935'),
  'block-green': block('#43A047'),
  box: (
    <>
      <rect x="6" y="11" width="28" height="23" rx="2" fill="#C8935A" />
      <path d="M6 11 L10 5 H30 L34 11" fill="#DDAA70" />
      <path d="M17 11 V22 H23 V11" fill="#F5E6C8" strokeWidth="1.2" />
    </>
  ),
  'tri-block': (
    <>
      <path d="M20 5 L36 34 H4z" fill="#EF5350" />
      <path d="M17 14 L12 24" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
    </>
  ),
  cheese: (
    <>
      <path d="M4 30 L32 12 L36 30z" fill="#FFCA28" />
      <path d="M4 30 H36 V35 H4z" fill="#FFB300" />
      <circle cx="24" cy="24" r="2.4" fill="#F9A825" stroke="none" /><circle cx="30" cy="20" r="1.6" fill="#F9A825" stroke="none" /><circle cx="15" cy="27" r="1.6" fill="#F9A825" stroke="none" />
    </>
  ),
  cake: (
    <>
      <path d="M6 18 L30 10 L34 18 V33 H6z" fill="#FFE0B2" />
      <path d="M6 25 H34" stroke="#F48FB1" strokeWidth="3" />
      <path d="M6 18 L30 10 L34 18z" fill="#F48FB1" />
      <circle cx="29" cy="8" r="3" fill="#E53935" />
    </>
  ),
  lollipop: (
    <>
      <path d="M20 24 V38" strokeWidth="3" fill="none" />
      <circle cx="20" cy="14" r="11" fill="#F06292" />
      <path d="M20 14 m-3 0 a3 3 0 1 1 3 3 a6 6 0 1 1 -6 -6 a8.5 8.5 0 0 1 9 -1" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    </>
  ),
  chocolate: (
    <>
      <rect x="9" y="5" width="22" height="30" rx="2" fill="#795548" />
      <path d="M9 15 H31 M20 5 V22" fill="none" strokeWidth="1.2" />
      <path d="M9 22 H31 V33 Q31 35 29 35 H11 Q9 35 9 33z" fill="#E53935" />
    </>
  ),
  cookie: (
    <>
      <circle cx="20" cy="20" r="14" fill="#D7A15B" />
      {[[14, 14], [24, 13], [19, 21], [27, 23], [13, 25], [21, 29]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.9" fill="#5D4037" stroke="none" />)}
    </>
  ),
  onion: (
    <>
      <path d="M20 8 V2 M18 8 Q16 3 14 2" fill="none" stroke="#43A047" strokeWidth="2" />
      <path d="M20 7 Q32 16 30 26 Q28 34 20 34 Q12 34 10 26 Q8 16 20 7z" fill="#CE93D8" />
      <path d="M20 9 Q14 20 17 33 M20 9 Q26 20 23 33" fill="none" strokeWidth="1" />
      <path d="M17 34 L16 38 M20 34 V38 M23 34 L24 38" fill="none" strokeWidth="1.2" />
    </>
  ),
  peas: (
    <>
      <path d="M4 22 Q20 8 36 18 Q20 32 4 22z" fill="#7CB342" />
      <circle cx="13" cy="20" r="3.6" fill="#AED581" /><circle cx="20" cy="19" r="3.6" fill="#AED581" /><circle cx="27" cy="19" r="3.6" fill="#AED581" />
    </>
  ),
  cucumber: (
    <>
      <rect x="4" y="14" width="32" height="12" rx="6" fill="#558B2F" transform="rotate(-25 20 20)" />
      <path d="M12 22 l1 0 M19 18 l1 0 M26 14 l1 0 M15 26 l1 0 M23 22 l1 0" stroke="#C5E1A5" strokeWidth="1.8" />
    </>
  ),
  corn: (
    <>
      <ellipse cx="20" cy="17" rx="7" ry="13" fill="#FFD54F" />
      <path d="M14 11 H26 M13 17 H27 M14 23 H26 M17 5 V29 M23 5 V29" fill="none" strokeWidth="0.9" />
      <path d="M20 35 Q8 29 10 13 Q14 25 20 30 Q26 25 30 13 Q32 29 20 35z" fill="#7CB342" />
    </>
  ),
  potato: (
    <>
      <path d="M6 22 Q5 11 17 10 Q24 7 31 12 Q37 18 33 27 Q28 34 18 32 Q7 31 6 22z" fill="#C8A165" />
      <circle cx="14" cy="18" r="1.2" fill={SK} stroke="none" /><circle cx="24" cy="15" r="1.2" fill={SK} stroke="none" /><circle cx="27" cy="25" r="1.2" fill={SK} stroke="none" />
    </>
  ),
  pepper: (
    <>
      <path d="M20 12 V6 Q22 4 25 6" fill="none" strokeWidth="2.2" />
      <path d="M10 14 Q8 32 16 34 Q20 36 24 34 Q32 32 30 14 Q20 8 10 14z" fill="#43A047" />
      <path d="M20 14 Q18 24 20 34" fill="none" strokeWidth="1" />
      {shine(14, 21)}
    </>
  ),
  eggplant: (
    <>
      <path d="M26 10 Q34 12 32 22 Q30 34 18 35 Q8 35 8 28 Q8 22 16 20 Q20 12 26 10z" fill="#6A1B9A" />
      <path d="M23 8 L30 5 L33 12 Q28 11 23 8z" fill="#43A047" />
      {shine(14, 28, 2.6, 1.6)}
    </>
  ),
};

/** a drawn piece, or (for the animals not drawn yet) its emoji */
export function Thing({ id, size }: { id: string; size: number }) {
  const art = DRAW[id];
  if (!art) return <span aria-hidden="true" style={{ fontSize: size * 0.78, lineHeight: 1 }}>{id}</span>;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <g filter="url(#kp-brush)" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{art}</g>
    </svg>
  );
}
