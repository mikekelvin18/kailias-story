// ── The painted picture library ──
// Small painted pictures (fruit, shapes, treats, veg, animals, story
// objects, faces) used by every game in place of emoji. Each is drawn on
// a 40×40 grid with the warm brown outline and the shared brush filter.
// <Thing id="cat" /> draws one; <Things ids={['icecream', 'happy']} />
// draws a little row. 'noel' is Noel himself, and any CritterSprite
// species (fox, owl, rabbit…) is drawn by CritterSprite.

import type { ReactNode } from 'react';
import PandaSprite from '@/components/characters/PandaSprite';
import { CritterSprite, type SpeciesKey } from '@/components/characters/CritterSprite';

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
  // ── app icons ──
  map: (
    <>
      <path d="M4 9 L14 5 L26 9 L36 5 L36 31 L26 35 L14 31 L4 35z" fill="#FDE68A" />
      <path d="M14 5 V31 M26 9 V35" fill="none" strokeWidth="1.2" />
      <path d="M8 26 Q14 18 20 24 Q25 28 30 16" fill="none" stroke="#E53935" strokeWidth="1.8" strokeDasharray="2.5 2.5" />
      <path d="M28 12 L32 16 M32 12 L28 16" fill="none" stroke="#E53935" strokeWidth="2" />
    </>
  ),
  backpack: (
    <>
      <path d="M14 8 Q14 3 20 3 Q26 3 26 8" fill="none" strokeWidth="2.2" />
      <path d="M8 16 Q8 8 20 8 Q32 8 32 16 L32 34 Q32 37 29 37 L11 37 Q8 37 8 34z" fill="#F87171" />
      <path d="M12 24 L28 24 L28 33 L12 33z" fill="#FCA5A5" />
      <path d="M12 27 H28" fill="none" strokeWidth="1.2" />
      <circle cx="20" cy="15" r="2" fill="#FDE047" />
    </>
  ),
  printer: (
    <>
      <path d="M11 4 L29 4 L29 14 L11 14z" fill="#FFFFFF" />
      <rect x="4" y="13" width="32" height="15" rx="4" fill="#94A3B8" />
      <circle cx="30" cy="18" r="1.6" fill="#4ADE80" />
      <path d="M11 24 L29 24 L29 37 L11 37z" fill="#FFFFFF" />
      <path d="M14 29 H26 M14 33 H23" fill="none" strokeWidth="1.2" stroke="#A78BFA" />
    </>
  ),
  // ── animals ──
  bird: (
    <>
      <path d="M29 22 L37 26 L30 28z" fill="#3B82F6" />
      <circle cx="18" cy="21" r="12" fill="#60A5FA" />
      <path d="M12 22 Q19 17 26 23 Q20 30 12 22z" fill="#93C5FD" />
      <path d="M8 18 L2 17 L7 21z" fill="#F59E0B" />
      <circle cx="12" cy="16" r="1.7" fill={SK} stroke="none" />
      <circle cx="9" cy="20" r="1.8" fill="#FCA5A5" opacity="0.8" stroke="none" />
      <path d="M16 33 L15 37 M21 33 L22 37" fill="none" />
      <path d="M17 9 Q19 4 22 8" fill="none" strokeWidth="1.4" />
    </>
  ),
  ladybug: (
    <>
      <circle cx="20" cy="10" r="5" fill="#3b2416" />
      <path d="M8 22 Q8 11 20 11 Q32 11 32 22 Q32 34 20 34 Q8 34 8 22z" fill="#E53935" />
      <path d="M20 11 V34" fill="none" />
      {[[14, 18], [26, 18], [13, 26], [27, 26], [20, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill={SK} stroke="none" />)}
      {shine(13, 15, 1.6, 2.4)}
    </>
  ),
  fish: (
    <>
      <path d="M30 20 L38 13 L37 27z" fill="#38BDF8" />
      <path d="M4 20 Q12 9 24 11 Q32 13 32 20 Q32 27 24 29 Q12 31 4 20z" fill="#7DD3FC" />
      <path d="M17 12 Q19 20 17 28" fill="none" strokeWidth="1.2" />
      <circle cx="10" cy="18" r="1.8" fill={SK} stroke="none" />
      {shine(22, 15, 2.6, 1.6)}
    </>
  ),
  'fish-orange': (
    <>
      <path d="M30 20 L38 12 L37 28z" fill="#FB923C" />
      <path d="M4 20 Q12 9 24 11 Q32 13 32 20 Q32 27 24 29 Q12 31 4 20z" fill="#FDBA74" />
      <path d="M15 11 Q18 20 15 29 M22 11 Q25 20 22 29" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
      <circle cx="10" cy="18" r="1.8" fill={SK} stroke="none" />
    </>
  ),
  caterpillar: (
    <>
      {[[8, 26], [15, 23], [22, 25], [29, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill={i % 2 ? '#86EFAC' : '#4ADE80'} />)}
      <circle cx="33" cy="16" r="6.5" fill="#4ADE80" />
      <path d="M31 10 L29 5 M35 10 L37 5" fill="none" />
      <circle cx="35" cy="15" r="1.4" fill={SK} stroke="none" />
      <path d="M32 19 Q34 21 36 19" fill="none" strokeWidth="1.2" />
    </>
  ),
  snake: (
    <>
      <path d="M6 30 Q6 24 12 24 Q18 24 18 30 Q18 35 24 35 Q30 35 30 28 L30 18" fill="none" stroke="#4ADE80" strokeWidth="6" />
      <path d="M6 30 Q6 24 12 24 Q18 24 18 30 Q18 35 24 35 Q30 35 30 28 L30 18" fill="none" stroke={SK} strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="30" cy="14" rx="6" ry="5" fill="#4ADE80" />
      <circle cx="28" cy="13" r="1.3" fill={SK} stroke="none" /><circle cx="32.5" cy="13" r="1.3" fill={SK} stroke="none" />
      <path d="M30 19 L30 22 L28 24 M30 22 L32 24" fill="none" stroke="#E53935" strokeWidth="1.2" />
    </>
  ),
  dog: (
    <>
      <path d="M8 30 Q8 22 16 22 L28 22 Q33 22 33 28 L33 33 L8 33z" fill="#D6A26B" />
      <path d="M33 26 Q38 22 37 17" fill="none" strokeWidth="2.4" />
      <circle cx="15" cy="15" r="8" fill="#E8BC86" />
      <path d="M8 11 Q4 16 7 22 Q10 18 10 12z" fill="#8B5A2B" />
      <path d="M22 11 Q26 16 23 22 Q20 18 20 12z" fill="#8B5A2B" />
      <circle cx="12.5" cy="14" r="1.3" fill={SK} stroke="none" /><circle cx="17.5" cy="14" r="1.3" fill={SK} stroke="none" />
      <ellipse cx="15" cy="18" rx="2" ry="1.4" fill={SK} />
    </>
  ),
  cat: (
    <>
      <path d="M10 33 Q8 22 15 21 L25 21 Q32 22 30 33z" fill="#FDBA74" />
      <path d="M30 30 Q37 28 35 20" fill="none" stroke="#FDBA74" strokeWidth="3.4" />
      <path d="M30 30 Q37 28 35 20" fill="none" strokeWidth="0.8" />
      <path d="M8 8 L12 14 L28 14 L32 8 L32 18 Q32 25 20 25 Q8 25 8 18z" fill="#FDBA74" />
      <path d="M9.5 10 L11.5 13 M30.5 10 L28.5 13" fill="none" stroke="#F9A8D4" />
      <circle cx="15" cy="18" r="1.4" fill={SK} stroke="none" /><circle cx="25" cy="18" r="1.4" fill={SK} stroke="none" />
      <path d="M19 21 L21 21 L20 22.4z" fill="#F472B6" />
      <path d="M4 19 L11 20 M4 22 L11 21.5 M36 19 L29 20 M36 22 L29 21.5" fill="none" strokeWidth="0.9" />
    </>
  ),
  snail: (
    <>
      <path d="M4 32 Q12 30 18 30 L34 30 Q37 30 37 26 L35 18 Q33 22 31 26 L8 28 Q4 29 4 32z" fill="#FDE68A" />
      <path d="M33 18 L32 11 M36 19 L38 12" fill="none" />
      <circle cx="18" cy="20" r="10" fill="#F59E0B" />
      <path d="M18 20 Q18 16 21 17 Q24 19 22 23 Q18 26 15 22 Q13 16 18 13 Q25 11 27 18" fill="none" strokeWidth="1.4" />
    </>
  ),
  octopus: (
    <>
      {[8, 14, 20, 26, 32].map((x, i) => <path key={i} d={`M${x} 22 Q${x + (i % 2 ? 3 : -3)} 30 ${x} 36`} fill="none" stroke="#F472B6" strokeWidth="4" />)}
      <path d="M6 22 Q6 6 20 6 Q34 6 34 22z" fill="#F472B6" />
      <circle cx="15" cy="16" r="1.8" fill={SK} stroke="none" /><circle cx="25" cy="16" r="1.8" fill={SK} stroke="none" />
      <path d="M17 20 Q20 22 23 20" fill="none" strokeWidth="1.2" />
      {shine(13, 11, 2.4, 1.6)}
    </>
  ),
  crab: (
    <>
      <path d="M8 28 L4 33 M12 30 L9 35 M32 28 L36 33 M28 30 L31 35" fill="none" strokeWidth="1.8" />
      <path d="M8 14 Q4 8 8 5 Q8 9 11 10 Q11 6 14 6 Q13 12 10 15z" fill="#EF4444" />
      <path d="M32 14 Q36 8 32 5 Q32 9 29 10 Q29 6 26 6 Q27 12 30 15z" fill="#EF4444" />
      <ellipse cx="20" cy="24" rx="13" ry="8" fill="#EF4444" />
      <path d="M16 16 V12 M24 16 V12" fill="none" />
      <circle cx="16" cy="11" r="1.8" fill="#FFFFFF" /><circle cx="24" cy="11" r="1.8" fill="#FFFFFF" />
      <path d="M17 26 Q20 28 23 26" fill="none" strokeWidth="1.2" />
    </>
  ),
  cow: (
    <>
      <path d="M8 10 Q4 8 5 13 Q8 14 10 13z M32 10 Q36 8 35 13 Q32 14 30 13z" fill="#FFFFFF" />
      <path d="M12 8 Q12 4 14 5 M28 8 Q28 4 26 5" fill="none" />
      <path d="M9 12 Q9 6 20 6 Q31 6 31 12 L30 24 L10 24z" fill="#FFFFFF" />
      <path d="M11 9 Q16 9 15 15 Q11 16 10 13z" fill="#3b2416" stroke="none" />
      <ellipse cx="20" cy="27" rx="11" ry="7" fill="#F9A8D4" />
      <ellipse cx="16" cy="27" rx="1.4" ry="2" fill={SK} stroke="none" /><ellipse cx="24" cy="27" rx="1.4" ry="2" fill={SK} stroke="none" />
      <circle cx="15" cy="17" r="1.6" fill={SK} stroke="none" /><circle cx="25" cy="17" r="1.6" fill={SK} stroke="none" />
    </>
  ),
  lion: (
    <>
      <circle cx="20" cy="20" r="16" fill="#D97706" />
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => <circle key={a} cx="20" cy="5.5" r="4" fill="#B45309" transform={`rotate(${a} 20 20)`} />)}
      <circle cx="20" cy="21" r="11" fill="#FCD34D" />
      <circle cx="11" cy="12" r="3" fill="#FCD34D" /><circle cx="29" cy="12" r="3" fill="#FCD34D" />
      <circle cx="16" cy="19" r="1.5" fill={SK} stroke="none" /><circle cx="24" cy="19" r="1.5" fill={SK} stroke="none" />
      <path d="M18 23 L22 23 L20 25.5z" fill={SK} />
      <path d="M17 27 Q20 29 23 27" fill="none" strokeWidth="1.2" />
    </>
  ),
  elephant: (
    <>
      <path d="M10 30 L10 36 L15 36 L15 31 M25 31 L25 36 L30 36 L30 30" fill="#A1A1AA" />
      <ellipse cx="21" cy="25" rx="13" ry="9" fill="#A1A1AA" />
      <path d="M4 12 Q2 22 9 24 Q13 20 12 12z" fill="#D4D4D8" />
      <circle cx="13" cy="15" r="8" fill="#A1A1AA" />
      <path d="M7 19 Q4 26 7 32 Q9 33 9 30 Q8 26 11 21" fill="#A1A1AA" />
      <circle cx="14" cy="13" r="1.4" fill={SK} stroke="none" />
      <path d="M34 22 Q37 24 36 28" fill="none" />
    </>
  ),
  penguin: (
    <>
      <path d="M20 4 Q31 4 31 18 L32 32 Q32 36 20 36 Q8 36 8 32 L9 18 Q9 4 20 4z" fill="#334155" />
      <path d="M20 12 Q27 12 27 22 Q27 33 20 33 Q13 33 13 22 Q13 12 20 12z" fill="#FFFFFF" />
      <circle cx="16" cy="10" r="1.6" fill="#FFFFFF" stroke="none" /><circle cx="24" cy="10" r="1.6" fill="#FFFFFF" stroke="none" />
      <path d="M18 13 L22 13 L20 16z" fill="#F59E0B" />
      <path d="M14 36 L12 38 L18 38z M26 36 L28 38 L22 38z" fill="#F59E0B" />
    </>
  ),
  bat: (
    <>
      <path d="M20 14 Q12 6 3 12 Q7 14 6 18 Q10 16 12 20 Q15 17 20 22 Q25 17 28 20 Q30 16 34 18 Q33 14 37 12 Q28 6 20 14z" fill="#7C3AED" />
      <ellipse cx="20" cy="18" rx="5" ry="6" fill="#6D28D9" />
      <path d="M16 13 L16 9 L18 12 M24 13 L24 9 L22 12" fill="#6D28D9" />
      <circle cx="18" cy="17" r="1.2" fill="#FFFFFF" stroke="none" /><circle cx="22" cy="17" r="1.2" fill="#FFFFFF" stroke="none" />
    </>
  ),
  pig: (
    <>
      <path d="M8 10 L12 4 L15 10z M32 10 L28 4 L25 10z" fill="#F9A8D4" />
      <circle cx="20" cy="20" r="14" fill="#FBCFE8" />
      <ellipse cx="20" cy="24" rx="6" ry="4.4" fill="#F9A8D4" />
      <ellipse cx="18" cy="24" rx="1.1" ry="1.6" fill={SK} stroke="none" /><ellipse cx="22" cy="24" rx="1.1" ry="1.6" fill={SK} stroke="none" />
      <circle cx="14" cy="16" r="1.5" fill={SK} stroke="none" /><circle cx="26" cy="16" r="1.5" fill={SK} stroke="none" />
      <circle cx="10" cy="22" r="2" fill="#F472B6" opacity="0.6" stroke="none" /><circle cx="30" cy="22" r="2" fill="#F472B6" opacity="0.6" stroke="none" />
    </>
  ),
  // ── story & word objects ──
  moon: (
    <>
      <path d="M26 5 Q12 7 12 20 Q12 33 26 35 Q8 38 5 22 Q4 6 26 5z" fill="#FDE68A" />
      <circle cx="11" cy="16" r="1.6" fill="#FCD34D" stroke="none" /><circle cx="12" cy="26" r="2" fill="#FCD34D" stroke="none" />
    </>
  ),
  car: (
    <>
      <path d="M4 28 L4 22 Q4 19 8 18 L12 11 Q13 9 16 9 L26 9 Q29 9 31 12 L34 18 Q37 19 37 23 L37 28z" fill="#EF4444" />
      <path d="M14 12 L12 18 L19 18 L19 12z M22 12 L22 18 L31 18 L28 12z" fill="#BFDBFE" />
      <circle cx="12" cy="29" r="4.5" fill="#334155" /><circle cx="29" cy="29" r="4.5" fill="#334155" />
      <circle cx="12" cy="29" r="1.6" fill="#E5E7EB" stroke="none" /><circle cx="29" cy="29" r="1.6" fill="#E5E7EB" stroke="none" />
    </>
  ),
  flower: (
    <>
      <path d="M20 22 Q19 30 20 38" fill="none" stroke="#16A34A" strokeWidth="2.4" />
      <path d="M20 31 Q26 26 30 29 Q25 34 20 31z" fill="#4ADE80" />
      {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="20" cy="9" rx="5" ry="6.5" fill="#F9A8D4" transform={`rotate(${a} 20 16)`} />)}
      <circle cx="20" cy="16" r="4.4" fill="#FDE047" />
    </>
  ),
  house: (
    <>
      <path d="M4 19 L20 5 L36 19z" fill="#F87171" />
      <rect x="8" y="18" width="24" height="18" fill="#FEF3C7" />
      <rect x="17" y="25" width="7" height="11" fill="#B45309" />
      <rect x="10.5" y="21" width="5" height="5" fill="#BFDBFE" /><rect x="26" y="21" width="4.5" height="5" fill="#BFDBFE" />
    </>
  ),
  log: (
    <>
      <path d="M8 14 L32 14 Q36 20 32 27 L8 27z" fill="#A16207" />
      <ellipse cx="8" cy="20.5" rx="4" ry="6.5" fill="#FDE68A" />
      <ellipse cx="8" cy="20.5" rx="1.8" ry="3" fill="none" strokeWidth="1" />
      <path d="M14 18 L26 18 M16 23 L30 23" fill="none" strokeWidth="1" opacity="0.6" />
    </>
  ),
  icecream: (
    <>
      <path d="M12 20 L20 38 L28 20z" fill="#E7A65A" />
      <path d="M14 25 L26 25 M16 30 L24 30" fill="none" strokeWidth="1" opacity="0.55" />
      <circle cx="20" cy="13" r="9" fill="#F9A8D4" />
      <path d="M11 17 Q14 21 17 18 Q20 22 23 18 Q26 21 29 17" fill="#F9A8D4" />
      <circle cx="20" cy="4.5" r="2.6" fill="#E53935" />
      {shine(16, 10)}
    </>
  ),
  'icecream-fallen': (
    <>
      <path d="M4 33 Q6 26 14 26 Q20 22 26 27 Q34 26 34 33z" fill="#F9A8D4" />
      <path d="M22 25 L35 16 L36 26z" fill="#E7A65A" />
      <circle cx="9" cy="23" r="1.6" fill="#F9A8D4" /><circle cx="32" cy="12" r="1.2" fill="#F9A8D4" />
    </>
  ),
  hat: (
    <>
      <ellipse cx="20" cy="31" rx="17" ry="4.5" fill="#334155" />
      <path d="M10 31 L11 9 Q20 6 29 9 L30 31z" fill="#475569" />
      <path d="M10.6 24 L29.4 24 L29.6 28 L10.4 28z" fill="#E53935" />
    </>
  ),
  splat: (
    <>
      <path d="M20 6 L23 14 L31 9 L28 17 L37 19 L28 23 L33 31 L24 27 L20 36 L17 27 L8 31 L12 23 L3 19 L12 17 L9 9 L17 14z" fill="#FDE047" />
      <circle cx="20" cy="20" r="4" fill="#FB923C" />
    </>
  ),
  cloud: (
    <>
      <path d="M9 28 Q2 28 3 21 Q5 15 11 17 Q12 9 20 9 Q28 9 29 16 Q37 15 37 22 Q37 28 31 28z" fill="#FFFFFF" />
      {shine(14, 15, 3, 1.8)}
    </>
  ),
  rain: (
    <>
      <path d="M9 22 Q2 22 3 15 Q5 9 11 11 Q12 3 20 3 Q28 3 29 10 Q37 9 37 16 Q37 22 31 22z" fill="#CBD5E1" />
      {[11, 20, 29].map((x, i) => <path key={x} d={`M${x} ${27 + (i % 2) * 3} Q${x - 2} ${31 + (i % 2) * 3} ${x} ${33 + (i % 2) * 3} Q${x + 2} ${31 + (i % 2) * 3} ${x} ${27 + (i % 2) * 3}z`} fill="#60A5FA" />)}
    </>
  ),
  spoon: (
    <>
      <ellipse cx="14" cy="14" rx="6" ry="8.5" fill="#E5E7EB" transform="rotate(-35 14 14)" />
      <path d="M18 20 L33 36" fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <path d="M18 20 L33 36" fill="none" strokeWidth="0.8" />
      <path d="M2 30 L8 30 M3 35 L10 35" fill="none" stroke="#93C5FD" strokeWidth="2" />
    </>
  ),
  teddy: (
    <>
      <circle cx="11" cy="8" r="4.5" fill="#C08457" /><circle cx="29" cy="8" r="4.5" fill="#C08457" />
      <ellipse cx="20" cy="29" rx="11" ry="9" fill="#C08457" />
      <circle cx="9" cy="35" r="4" fill="#C08457" /><circle cx="31" cy="35" r="4" fill="#C08457" />
      <circle cx="20" cy="15" r="10" fill="#D6A26B" />
      <ellipse cx="20" cy="19" rx="4.5" ry="3.4" fill="#FDE7D0" />
      <circle cx="16" cy="13" r="1.5" fill={SK} stroke="none" /><circle cx="24" cy="13" r="1.5" fill={SK} stroke="none" />
      <ellipse cx="20" cy="17.5" rx="1.6" ry="1.1" fill={SK} />
      <ellipse cx="20" cy="30" rx="5" ry="5" fill="#E8BC86" />
    </>
  ),
  flashlight: (
    <>
      <path d="M22 13 L38 5 L38 35 L22 27z" fill="#FEF08A" opacity="0.75" stroke="none" />
      <rect x="3" y="15" width="14" height="10" rx="2" fill="#3B82F6" />
      <path d="M17 13 L23 11 L23 29 L17 27z" fill="#93C5FD" />
      <circle cx="9" cy="20" r="1.8" fill="#FDE047" />
    </>
  ),
  bed: (
    <>
      <path d="M4 34 L4 14 M36 34 L36 22" fill="none" strokeWidth="3" stroke="#92400E" />
      <rect x="4" y="22" width="32" height="9" fill="#93C5FD" />
      <path d="M14 22 L36 22 L36 26 L14 28z" fill="#C4B5FD" />
      <ellipse cx="10" cy="20" rx="5" ry="3" fill="#FFFFFF" />
    </>
  ),
  bricks: (
    <>
      <rect x="3" y="6" width="34" height="28" fill="#F87171" />
      <path d="M3 13 H37 M3 20 H37 M3 27 H37 M14 6 V13 M27 6 V13 M8 13 V20 M21 13 V20 M33 13 V20 M14 20 V27 M27 20 V27 M8 27 V34 M21 27 V34 M33 27 V34" fill="none" stroke="#FEE2E2" strokeWidth="1.4" />
    </>
  ),
  speech: (
    <>
      <path d="M6 7 L34 7 Q37 7 37 10 L37 24 Q37 27 34 27 L17 27 L10 34 L11 27 L6 27 Q3 27 3 24 L3 10 Q3 7 6 7z" fill="#FFFFFF" />
      <circle cx="13" cy="17" r="2" fill={SK} stroke="none" /><circle cx="20" cy="17" r="2" fill={SK} stroke="none" /><circle cx="27" cy="17" r="2" fill={SK} stroke="none" />
    </>
  ),
  bulb: (
    <>
      {[-60, -30, 0, 30, 60].map(a => <path key={a} d="M20 4 V1" stroke="#F59E0B" strokeWidth="2" transform={`rotate(${a} 20 16)`} />)}
      <path d="M20 5 Q30 5 30 15 Q30 20 25 24 L25 28 L15 28 L15 24 Q10 20 10 15 Q10 5 20 5z" fill="#FDE047" />
      <rect x="15" y="28" width="10" height="6" rx="1.5" fill="#94A3B8" />
      <path d="M15 31 H25" fill="none" strokeWidth="1" />
      {shine(15, 12)}
    </>
  ),
  tree: (
    <>
      <path d="M17 24 L16 37 L24 37 L23 24z" fill="#92400E" />
      <circle cx="20" cy="14" r="10" fill="#4ADE80" />
      <circle cx="11" cy="20" r="6.5" fill="#22C55E" /><circle cx="29" cy="20" r="6.5" fill="#22C55E" />
      {shine(16, 9, 3, 2)}
    </>
  ),
  shovel: (
    <>
      <path d="M8 4 L14 4 L11 7z M11 6 L22 24" fill="none" stroke="#92400E" strokeWidth="3" />
      <path d="M20 21 L28 17 Q36 22 36 32 Q30 37 22 33 Q18 28 20 21z" fill="#94A3B8" />
      {shine(27, 24, 1.6, 2.6)}
    </>
  ),
  'cup-straw': (
    <>
      <path d="M23 3 L26 3 L22 14" fill="none" stroke="#F472B6" strokeWidth="2.4" />
      <path d="M10 12 L30 12 L27 36 L13 36z" fill="#BAE6FD" />
      <path d="M11 18 L29 18 L27 36 L13 36z" fill="#60A5FA" />
      {shine(15, 24, 1.4, 3.4)}
    </>
  ),
  sparkle: (
    <>
      <path d="M20 2 C21 13 26 19 37 20 C26 21 21 27 20 38 C19 27 14 21 3 20 C14 19 19 13 20 2Z" fill="#FDE047" />
      <path d="M33 4 C33.5 7.5 35 9 38 9.5 C35 10 33.5 11.5 33 15 C32.5 11.5 31 10 28 9.5 C31 9 32.5 7.5 33 4Z" fill="#FFFFFF" />
    </>
  ),
  basket: (
    <>
      <path d="M10 18 Q10 6 20 6 Q30 6 30 18" fill="none" stroke="#B45309" strokeWidth="2.6" />
      <path d="M4 17 L36 17 L32 35 L8 35z" fill="#D97706" />
      <path d="M6 23 H34 M7 29 H33 M14 17 L15 35 M20 17 V35 M26 17 L25 35" fill="none" strokeWidth="1" opacity="0.55" />
      <path d="M4 17 L12 17 L10 22 L6 22z M20 17 L28 17 L26 22 L22 22z" fill="#EF4444" />
    </>
  ),
  sandwich: (
    <>
      <path d="M4 26 L20 8 L36 26z" fill="#FDE68A" />
      <path d="M4 26 Q20 22 36 26 L36 29 Q20 25 4 29z" fill="#4ADE80" />
      <path d="M4 29 Q20 25 36 29 L36 32 L4 32z" fill="#F87171" />
      <path d="M4 32 L36 32 L36 35 L4 35z" fill="#FDE68A" />
      <circle cx="16" cy="20" r="1.4" fill={SK} stroke="none" /><circle cx="24" cy="20" r="1.4" fill={SK} stroke="none" />
      <path d="M17 23 Q20 25 23 23" fill="none" strokeWidth="1" />
    </>
  ),
  note: (
    <>
      <path d="M14 30 L14 8 L34 4 L34 26" fill="none" strokeWidth="2.6" />
      <path d="M14 8 L34 4 L34 10 L14 14z" fill={SK} />
      <ellipse cx="10" cy="30" rx="5.5" ry="4.2" fill="#A78BFA" transform="rotate(-20 10 30)" />
      <ellipse cx="30" cy="26" rx="5.5" ry="4.2" fill="#A78BFA" transform="rotate(-20 30 26)" />
    </>
  ),
  seed: (
    <>
      <path d="M4 32 Q20 26 36 32 L36 38 L4 38z" fill="#A16207" />
      <ellipse cx="20" cy="28" rx="4" ry="5.5" fill="#D97706" transform="rotate(20 20 28)" />
      {shine(18.5, 26, 1, 2)}
    </>
  ),
  sprout: (
    <>
      <path d="M4 32 Q20 26 36 32 L36 38 L4 38z" fill="#A16207" />
      <path d="M20 30 Q19 20 20 14" fill="none" stroke="#16A34A" strokeWidth="2.4" />
      <path d="M20 16 Q10 6 6 14 Q12 20 20 16z" fill="#4ADE80" />
      <path d="M20 16 Q30 6 34 14 Q28 20 20 16z" fill="#86EFAC" />
    </>
  ),
  book: (
    <>
      <path d="M20 10 Q12 5 3 8 L3 33 Q12 30 20 35 Q28 30 37 33 L37 8 Q28 5 20 10z" fill="#FFFFFF" />
      <path d="M20 10 V35" fill="none" />
      <path d="M7 14 H16 M7 19 H16 M7 24 H14 M24 14 H33 M24 19 H33 M24 24 H31" fill="none" strokeWidth="1" opacity="0.5" />
      <path d="M3 33 Q12 30 20 35 Q28 30 37 33 L37 36 Q28 33 20 38 Q12 33 3 36z" fill="#A78BFA" />
    </>
  ),
  kite: (
    <>
      <path d="M22 4 L34 16 L22 28 L12 16z" fill="#F472B6" />
      <path d="M22 4 L22 28 M12 16 L34 16" fill="none" strokeWidth="1.2" />
      <path d="M22 28 Q16 32 20 34 Q24 36 16 39" fill="none" strokeWidth="1.2" />
      <path d="M18 32 L15 30 L16 34z M18 37 L15 35 L16 39z" fill="#FDE047" />
    </>
  ),
  ground: (
    <>
      <path d="M2 24 Q10 18 20 22 Q30 18 38 24 L38 36 L2 36z" fill="#86EFAC" />
      <path d="M2 30 Q10 26 20 29 Q30 26 38 30 L38 36 L2 36z" fill="#A16207" />
      <path d="M8 22 L9 18 M13 21 L13 17 M27 21 L28 17 M32 22 L33 18" fill="none" stroke="#16A34A" strokeWidth="1.4" />
    </>
  ),
  rocket: (
    <>
      <path d="M20 3 Q30 12 28 28 L12 28 Q10 12 20 3z" fill="#E5E7EB" />
      <circle cx="20" cy="15" r="3.6" fill="#60A5FA" />
      <path d="M12 22 L6 32 L12 30z M28 22 L34 32 L28 30z" fill="#EF4444" />
      <path d="M15 28 Q20 40 25 28z" fill="#FB923C" />
    </>
  ),
  'cookie-broken': (
    <>
      <path d="M5 20 Q5 7 18 6 L20 13 L15 19 L19 25 L16 33 Q5 31 5 20z" fill="#D4A15A" />
      <path d="M24 8 Q35 10 35 21 Q35 32 22 34 L25 26 L21 20 L26 14z" fill="#D4A15A" />
      {[[11, 13], [10, 25], [29, 15], [29, 27]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#5B3A1E" stroke="none" />)}
    </>
  ),
  carousel: (
    <>
      <path d="M4 14 L20 4 L36 14z" fill="#F472B6" />
      <path d="M4 14 Q8 18 12 14 Q16 18 20 14 Q24 18 28 14 Q32 18 36 14" fill="#FBCFE8" />
      <path d="M10 16 V34 M30 16 V34 M20 16 V34" fill="none" stroke="#FDE047" strokeWidth="2" />
      <ellipse cx="20" cy="26" rx="6" ry="4" fill="#FFFFFF" />
      <path d="M4 34 L36 34 L36 37 L4 37z" fill="#A78BFA" />
    </>
  ),
  // ── faces (round stickers, not people) ──
  happy: (
    <>
      <circle cx="20" cy="20" r="16" fill="#FDE047" />
      <circle cx="14" cy="16" r="2" fill={SK} stroke="none" /><circle cx="26" cy="16" r="2" fill={SK} stroke="none" />
      <path d="M12 23 Q20 31 28 23" fill="none" strokeWidth="2" />
      <circle cx="10" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" stroke="none" /><circle cx="30" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" stroke="none" />
    </>
  ),
  sad: (
    <>
      <circle cx="20" cy="20" r="16" fill="#93C5FD" />
      <circle cx="14" cy="16" r="2" fill={SK} stroke="none" /><circle cx="26" cy="16" r="2" fill={SK} stroke="none" />
      <path d="M13 28 Q20 22 27 28" fill="none" strokeWidth="2" />
      <path d="M27 19 Q25 23 27 25 Q29 23 27 19z" fill="#FFFFFF" strokeWidth="1" />
    </>
  ),
  yum: (
    <>
      <circle cx="20" cy="20" r="16" fill="#FDE047" />
      <path d="M11 16 Q14 13 17 16 M23 16 Q26 13 29 16" fill="none" strokeWidth="2" />
      <path d="M12 23 Q20 31 28 23z" fill="#FFFFFF" strokeWidth="1.6" />
      <path d="M22 26 Q25 32 28 26" fill="#F472B6" strokeWidth="1.2" />
    </>
  ),
  'heart-pink': (
    <>
      <path d="M20 34 C8 25 4 18 6 12 C8 6 16 5 20 11 C24 5 32 6 34 12 C36 18 32 25 20 34z" fill="#F472B6" />
      {shine(12, 13, 2, 3)}
    </>
  ),
  'heart-green': (
    <>
      <path d="M20 34 C8 25 4 18 6 12 C8 6 16 5 20 11 C24 5 32 6 34 12 C36 18 32 25 20 34z" fill="#4ADE80" />
      {shine(12, 13, 2, 3)}
    </>
  ),

};

const CRITTERS = new Set<string>(['dragon', 'owl', 'raccoon', 'parrot', 'peacock', 'rabbit', 'koala', 'deer', 'swan', 'fox', 'frog', 'turtle', 'squirrel', 'hedgehog', 'bee', 'butterfly']);

/** is there a painted picture for this id? */
export const hasThing = (id: string) => id in DRAW || id === 'noel' || CRITTERS.has(id);

/** one painted picture: Noel, a critter, or a drawn piece */
export function Thing({ id, size, animate = false }: { id: string; size: number; animate?: boolean }) {
  if (id === 'noel') return <PandaSprite size={size} expression="happy" />;
  if (CRITTERS.has(id)) return <CritterSprite species={id as SpeciesKey} size={size} animate={animate} />;
  const art = DRAW[id];
  if (!art) return null;   // never fall back to emoji: a missing id simply draws nothing
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible', display: 'inline-block' }}>
      <g filter="url(#kp-brush)" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">{art}</g>
    </svg>
  );
}

/** a little row of pictures, e.g. a story scene ['icecream', 'happy'] */
export function Things({ ids, size, gap = 4 }: { ids: string[]; size: number; gap?: number }) {
  return (
    <span className="inline-flex items-end justify-center" style={{ gap }} aria-hidden="true">
      {ids.map((id, i) => <Thing key={i} id={id} size={size} />)}
    </span>
  );
}
