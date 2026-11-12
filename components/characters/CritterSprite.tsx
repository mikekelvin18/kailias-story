// ── Critter Sprite ──
// Animated chibi-style creature illustrations, drawn in the same bold
// sticker style as Kailia and Noel (thick dark outline, big shiny eyes,
// blush cheeks) — replacing plain animal emoji everywhere a "wild
// creature" appears in the adventure games. One flexible SVG builder
// covers every species so adding a new one is a config entry, not a
// new drawing from scratch.
//
// Every critter idly bobs and blinks; species with wings/tails/ears get
// their own extra motion (flutter, wag) layered on top.

import type { CSSProperties, ReactNode } from 'react';

export type SpeciesKey =
  | 'dragon' | 'owl' | 'raccoon' | 'parrot' | 'peacock' | 'rabbit' | 'koala'
  | 'deer' | 'swan' | 'fox' | 'frog' | 'turtle' | 'squirrel' | 'hedgehog'
  | 'bee' | 'butterfly';

// Maps the exact emoji characters used throughout lib/creatureChallenges.ts
// to a species drawing. Anything not listed here (gems, colors, flags…)
// simply isn't a critter and should keep rendering as plain emoji.
export const EMOJI_SPECIES: Record<string, SpeciesKey> = {
  '🐉': 'dragon', '🐲': 'dragon', '🦉': 'owl', '🦝': 'raccoon', '🦜': 'parrot',
  '🦚': 'peacock', '🐰': 'rabbit', '🐨': 'koala', '🦌': 'deer', '🦢': 'swan',
  '🦊': 'fox', '🐸': 'frog', '🐢': 'turtle', '🐿️': 'squirrel', '🦔': 'hedgehog',
  '🐝': 'bee', '🦋': 'butterfly',
};

const SK = '#3b2416'; // warm painted contour, not black ink
const SW = 3;
const line = { stroke: SK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

// ── shared face parts ──
function Eyes({ x1, x2, y, r = 7.5, blink, look = 0 }: { x1: number; x2: number; y: number; r?: number; blink: boolean; look?: number }) {
  return (
    <g className={blink ? 'critter-blink' : ''} style={{ transformOrigin: `${(x1 + x2) / 2}px ${y}px` }}>
      {[x1, x2].map(x => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r * 0.82} ry={r} fill={SK} />
          <circle cx={x + look + r * 0.28} cy={y - r * 0.38} r={r * 0.36} fill="#FFFFFF" />
          <circle cx={x + look - r * 0.3} cy={y + r * 0.42} r={r * 0.16} fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
}
const Blush = ({ x1, x2, y, r = 5.5 }: { x1: number; x2: number; y: number; r?: number }) => (
  <><ellipse cx={x1} cy={y} rx={r} ry={r * 0.66} fill="#FF8FAB" opacity="0.55" /><ellipse cx={x2} cy={y} rx={r} ry={r * 0.66} fill="#FF8FAB" opacity="0.55" /></>
);
const Smile = ({ x, y, w = 7 }: { x: number; y: number; w?: number }) => (
  <path d={`M ${x - w} ${y} Q ${x - w / 2} ${y + w * 0.7} ${x} ${y} Q ${x + w / 2} ${y + w * 0.7} ${x + w} ${y}`} fill="none" stroke={SK} strokeWidth="2.4" strokeLinecap="round" />
);
const Feet = ({ c }: { c: string }) => (
  <><ellipse cx="39" cy="90" rx="8.5" ry="5.5" fill={c} {...line} /><ellipse cx="61" cy="90" rx="8.5" ry="5.5" fill={c} {...line} /></>
);
const Shine = ({ x, y, rx = 5, ry = 3 }: { x: number; y: number; rx?: number; ry?: number }) =>
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#FFFFFF" opacity="0.45" transform={`rotate(-25 ${x} ${y})`} />;

type Art = (a: boolean) => ReactNode;

// Each species is its own little drawing (100×100): the same chibi
// proportions as Kailia and Noel (big head, small round body), but each
// with the shapes that make it itself: the owl's face disc and wings, the
// fox's white muzzle and dark ear tips, the frog's wide grin, the turtle's
// patterned shell. a = animated (wag, flap, flutter and blink loops).
const ART: Record<SpeciesKey, Art> = {
  dragon: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '70px 80px' }}>
        <path d="M 66 82 Q 90 86 92 70 Q 93 62 86 62 Q 88 70 80 74 Q 72 76 66 74 Z" fill="#4ADE80" {...line} />
        <path d="M 86 62 L 94 56 L 92 66 Z" fill="#16A34A" {...line} strokeWidth="2" />
      </g>
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 66px' }}>
        <path d="M 30 62 Q 10 50 8 62 Q 14 64 12 72 Q 20 68 30 72 Z" fill="#86EFAC" {...line} strokeWidth="2.4" />
        <path d="M 70 62 Q 90 50 92 62 Q 86 64 88 72 Q 80 68 70 72 Z" fill="#86EFAC" {...line} strokeWidth="2.4" />
      </g>
      <Feet c="#16A34A" />
      <ellipse cx="50" cy="73" rx="22" ry="18" fill="#4ADE80" {...line} />
      <ellipse cx="50" cy="77" rx="12" ry="12" fill="#ECFDF5" />
      <path d="M 41 72 Q 50 75 59 72 M 41 78 Q 50 81 59 78 M 42 84 Q 50 87 58 84" fill="none" stroke="#A7F3D0" strokeWidth="2" />
      <path d="M 34 22 L 30 6 L 42 16 Z M 66 22 L 70 6 L 58 16 Z" fill="#FDE68A" {...line} strokeWidth="2.4" />
      <path d="M 44 16 L 47 8 L 50 15 L 53 8 L 56 16 Z" fill="#16A34A" {...line} strokeWidth="2" />
      <circle cx="50" cy="40" r="25" fill="#4ADE80" {...line} />
      <ellipse cx="50" cy="52" rx="15" ry="9" fill="#86EFAC" {...line} strokeWidth="2.2" />
      <circle cx="45" cy="50" r="1.6" fill={SK} /><circle cx="55" cy="50" r="1.6" fill={SK} />
      <Eyes x1={39} x2={61} y={35} blink={a} />
      <Smile x={50} y={56} w={5} />
      <Blush x1={30} x2={70} y={45} />
      <Shine x={38} y={22} />
    </>
  ),
  owl: a => (
    <>
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 60px' }}>
        <path d="M 26 50 Q 12 62 18 82 Q 28 80 32 66 Z" fill="#8B5E3C" {...line} />
        <path d="M 74 50 Q 88 62 82 82 Q 72 80 68 66 Z" fill="#8B5E3C" {...line} />
      </g>
      <path d="M 40 92 L 37 96 M 44 92 L 44 97 M 56 92 L 56 97 M 60 92 L 63 96" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 50 8 Q 80 8 80 44 Q 80 92 50 92 Q 20 92 20 44 Q 20 8 50 8 Z" fill="#B08968" {...line} />
      <path d="M 26 14 L 22 0 L 36 10 Z M 74 14 L 78 0 L 64 10 Z" fill="#8B5E3C" {...line} strokeWidth="2.4" />
      <ellipse cx="50" cy="74" rx="17" ry="15" fill="#F5E6D3" />
      {[[44, 68], [56, 68], [50, 76], [43, 82], [57, 82]].map(([x, y], i) => <path key={i} d={`M ${x - 3} ${y} Q ${x} ${y + 3} ${x + 3} ${y}`} fill="none" stroke="#C9A27E" strokeWidth="1.8" strokeLinecap="round" />)}
      <path d="M 50 26 Q 40 18 30 22 Q 22 30 26 42 Q 30 52 42 50 Q 48 48 50 44 Q 52 48 58 50 Q 70 52 74 42 Q 78 30 70 22 Q 60 18 50 26 Z" fill="#F5E6D3" {...line} strokeWidth="2.4" />
      <Eyes x1={38} x2={62} y={36} r={9} blink={a} />
      <path d="M 46 44 L 54 44 L 50 52 Z" fill="#F59E0B" {...line} strokeWidth="2" />
      <Blush x1={29} x2={71} y={48} r={4.5} />
    </>
  ),
  raccoon: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '70px 78px' }}>
        <path d="M 66 80 Q 84 84 90 66 Q 94 54 86 52 Q 80 66 66 70 Z" fill="#9CA3AF" {...line} />
        <path d="M 82 72 L 90 64 M 77 76 L 86 72 M 86 58 L 92 58" stroke="#374151" strokeWidth="5" strokeLinecap="round" />
      </g>
      <Feet c="#374151" />
      <ellipse cx="50" cy="73" rx="22" ry="18" fill="#9CA3AF" {...line} />
      <ellipse cx="50" cy="77" rx="12" ry="12" fill="#F3F4F6" />
      <path d="M 26 26 L 22 6 L 42 18 Z M 74 26 L 78 6 L 58 18 Z" fill="#9CA3AF" {...line} />
      <path d="M 27 21 L 25 11 L 35 18 Z M 73 21 L 75 11 L 65 18 Z" fill="#F3F4F6" />
      <circle cx="50" cy="40" r="26" fill="#9CA3AF" {...line} />
      <path d="M 24 36 Q 32 26 44 32 Q 50 36 56 32 Q 68 26 76 36 Q 70 46 60 44 Q 50 42 40 44 Q 30 46 24 36 Z" fill="#374151" />
      <ellipse cx="50" cy="52" rx="11" ry="8" fill="#F3F4F6" {...line} strokeWidth="2" />
      <ellipse cx="50" cy="47" rx="4" ry="3" fill={SK} />
      <Eyes x1={38} x2={62} y={37} r={6.5} blink={a} />
      <Smile x={50} y={53} w={4} />
      <Blush x1={28} x2={72} y={50} />
    </>
  ),
  parrot: a => (
    <>
      <path d="M 44 86 L 38 99 L 50 92 L 62 99 L 56 86 Z" fill="#3B82F6" {...line} strokeWidth="2.4" />
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 62px' }}>
        <path d="M 28 56 Q 16 66 22 84 Q 32 80 34 66 Z" fill="#3B82F6" {...line} strokeWidth="2.4" />
        <path d="M 72 56 Q 84 66 78 84 Q 68 80 66 66 Z" fill="#3B82F6" {...line} strokeWidth="2.4" />
      </g>
      <path d="M 40 92 L 38 97 M 60 92 L 62 97" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="50" cy="72" rx="21" ry="20" fill="#4ADE80" {...line} />
      <ellipse cx="50" cy="76" rx="11" ry="12" fill="#FEF08A" />
      <path d="M 44 16 Q 40 2 48 4 Q 50 10 50 14 Q 54 2 60 6 Q 56 12 56 16 Z" fill="#EF4444" {...line} strokeWidth="2.2" />
      <circle cx="50" cy="38" r="24" fill="#EF4444" {...line} />
      <ellipse cx="38" cy="38" rx="9" ry="10" fill="#FFFFFF" /><ellipse cx="62" cy="38" rx="9" ry="10" fill="#FFFFFF" />
      <Eyes x1={38} x2={62} y={37} r={6} blink={a} />
      <path d="M 42 46 Q 50 40 58 46 Q 60 56 50 62 Q 50 54 44 52 Z" fill="#FBBF24" {...line} strokeWidth="2.4" />
      <path d="M 44 52 Q 50 50 56 50" fill="none" stroke={SK} strokeWidth="1.6" />
      <Shine x={38} y={22} />
    </>
  ),
  peacock: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '50px 70px' }}>
        {[-60, -36, -12, 12, 36, 60].map((r, i) => (
          <g key={i} transform={`rotate(${r} 50 72)`}>
            <path d="M 50 72 Q 40 40 50 16 Q 60 40 50 72 Z" fill="#0EA5A4" stroke="#0F766E" strokeWidth="1.6" />
            <ellipse cx="50" cy="24" rx="6" ry="7" fill="#22D3EE" stroke="#0F766E" strokeWidth="1.4" />
            <ellipse cx="50" cy="25" rx="3" ry="3.6" fill="#1E3A8A" />
            <circle cx="50" cy="24" r="1.3" fill="#FDE047" />
          </g>
        ))}
      </g>
      <Feet c="#6B7280" />
      <ellipse cx="50" cy="74" rx="18" ry="17" fill="#2563EB" {...line} />
      <path d="M 50 22 L 50 10 M 44 22 L 40 11 M 56 22 L 60 11" stroke={SK} strokeWidth="1.6" />
      <circle cx="50" cy="9" r="3" fill="#22D3EE" {...line} strokeWidth="1.6" /><circle cx="40" cy="10" r="3" fill="#22D3EE" {...line} strokeWidth="1.6" /><circle cx="60" cy="10" r="3" fill="#22D3EE" {...line} strokeWidth="1.6" />
      <circle cx="50" cy="42" r="21" fill="#2563EB" {...line} />
      <path d="M 34 34 Q 42 30 46 38 M 66 34 Q 58 30 54 38" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <Eyes x1={40} x2={60} y={40} r={6} blink={a} />
      <path d="M 46 48 L 54 48 L 50 55 Z" fill="#F59E0B" {...line} strokeWidth="2" />
      <Blush x1={33} x2={67} y={50} r={4.5} />
    </>
  ),
  rabbit: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '50px 24px' }}>
        <path d="M 36 22 Q 26 -6 34 -4 Q 44 -2 44 20 Z" fill="#F8FAFC" {...line} />
        <path d="M 64 22 Q 74 -6 66 -4 Q 56 -2 56 20 Z" fill="#F8FAFC" {...line} />
        <path d="M 37 18 Q 32 2 36 2 Q 40 4 41 18 Z M 63 18 Q 68 2 64 2 Q 60 4 59 18 Z" fill="#FBCFE8" />
      </g>
      <circle cx="72" cy="80" r="7" fill="#FFFFFF" {...line} strokeWidth="2.4" />
      <Feet c="#F1F5F9" />
      <ellipse cx="50" cy="74" rx="21" ry="17" fill="#F8FAFC" {...line} />
      <circle cx="50" cy="42" r="25" fill="#F8FAFC" {...line} />
      <Eyes x1={39} x2={61} y={39} blink={a} />
      <ellipse cx="45.5" cy="52" rx="5" ry="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.4" /><ellipse cx="54.5" cy="52" rx="5" ry="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.4" />
      <path d="M 47 47 L 53 47 L 50 50.5 Z" fill="#F472B6" stroke={SK} strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="47.5" y="55" width="5" height="5" rx="1" fill="#FFFFFF" stroke={SK} strokeWidth="1.4" />
      <Blush x1={30} x2={70} y={49} />
    </>
  ),
  koala: a => (
    <>
      <Feet c="#6B7280" />
      <ellipse cx="50" cy="74" rx="22" ry="18" fill="#9CA3AF" {...line} />
      <ellipse cx="50" cy="78" rx="12" ry="11" fill="#E5E7EB" />
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '50px 40px' }}>
        <circle cx="22" cy="26" r="15" fill="#9CA3AF" {...line} /><circle cx="78" cy="26" r="15" fill="#9CA3AF" {...line} />
        <circle cx="23" cy="27" r="9" fill="#F3F4F6" /><circle cx="77" cy="27" r="9" fill="#F3F4F6" />
      </g>
      <circle cx="50" cy="42" r="25" fill="#9CA3AF" {...line} />
      <Eyes x1={37} x2={63} y={38} r={6} blink={a} />
      <path d="M 43 40 Q 43 56 50 57 Q 57 56 57 40 Q 50 36 43 40 Z" fill="#374151" {...line} strokeWidth="2" />
      <ellipse cx="47" cy="44" rx="2" ry="3" fill="#FFFFFF" opacity="0.5" />
      <Smile x={50} y={60} w={4} />
      <Blush x1={30} x2={70} y={50} />
    </>
  ),
  deer: a => (
    <>
      <Feet c="#7C4A2D" />
      <ellipse cx="50" cy="74" rx="21" ry="17" fill="#D2A679" {...line} />
      <ellipse cx="50" cy="78" rx="11" ry="10" fill="#FDF3E7" />
      {[[36, 66], [62, 64], [66, 76], [34, 78]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" fill="#FDF3E7" />)}
      <path d="M 38 20 Q 30 6 32 0 M 33 10 Q 26 8 24 2 M 62 20 Q 70 6 68 0 M 67 10 Q 74 8 76 2" fill="none" stroke="#8B5A2B" strokeWidth="4.5" strokeLinecap="round" />
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '50px 34px' }}>
        <path d="M 28 34 Q 10 30 12 22 Q 22 22 32 28 Z M 72 34 Q 90 30 88 22 Q 78 22 68 28 Z" fill="#D2A679" {...line} strokeWidth="2.4" />
        <path d="M 26 31 Q 16 28 17 25 Q 23 25 29 29 Z M 74 31 Q 84 28 83 25 Q 77 25 71 29 Z" fill="#FBCFE8" />
      </g>
      <circle cx="50" cy="42" r="24" fill="#D2A679" {...line} />
      <ellipse cx="50" cy="54" rx="11" ry="8" fill="#FDF3E7" />
      <ellipse cx="50" cy="49" rx="4" ry="3" fill={SK} />
      <Eyes x1={39} x2={61} y={38} blink={a} />
      <Smile x={50} y={55} w={4} />
      <Blush x1={31} x2={69} y={48} />
    </>
  ),
  swan: a => (
    <>
      <path d="M 40 92 L 38 97 M 56 92 L 58 97" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 14 70 Q 14 90 46 92 Q 80 92 86 74 Q 88 64 78 66 Q 66 70 56 64 Q 40 56 26 60 Q 14 62 14 70 Z" fill="#FFFFFF" {...line} />
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 70px' }}>
        <path d="M 30 70 Q 44 58 70 70 Q 56 84 34 80 Q 28 76 30 70 Z" fill="#F1F5F9" {...line} strokeWidth="2.2" />
      </g>
      <path d="M 66 66 Q 78 50 66 38 Q 58 30 62 22" fill="none" stroke={SK} strokeWidth="13" strokeLinecap="round" />
      <path d="M 66 66 Q 78 50 66 38 Q 58 30 62 22" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
      <circle cx="62" cy="20" r="14" fill="#FFFFFF" {...line} />
      <path d="M 73 16 L 88 20 L 73 25 Z" fill="#F97316" {...line} strokeWidth="2.2" />
      <path d="M 70 15 Q 74 13 75 18 Q 72 20 70 15 Z" fill={SK} />
      <Eyes x1={56} x2={66} y={18} r={4.5} blink={a} />
      <ellipse cx="54" cy="25" rx="3.5" ry="2.3" fill="#FF8FAB" opacity="0.6" />
    </>
  ),
  fox: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '68px 80px' }}>
        <path d="M 64 82 Q 92 90 94 64 Q 94 50 84 46 Q 86 60 76 68 Q 70 72 64 72 Z" fill="#FB923C" {...line} />
        <path d="M 84 46 Q 94 50 94 62 Q 88 58 86 52 Z" fill="#FFFFFF" />
      </g>
      <Feet c="#7C2D12" />
      <ellipse cx="50" cy="74" rx="20" ry="17" fill="#FB923C" {...line} />
      <path d="M 40 62 Q 50 92 60 62 Z" fill="#FFF7ED" />
      <path d="M 24 30 L 20 4 L 44 20 Z M 76 30 L 80 4 L 56 20 Z" fill="#FB923C" {...line} />
      <path d="M 21 11 L 20 4 L 28 9 Z M 79 11 L 80 4 L 72 9 Z" fill="#3b2416" />
      <path d="M 25 25 L 23 12 L 36 20 Z M 75 25 L 77 12 L 64 20 Z" fill="#FFF7ED" />
      <circle cx="50" cy="42" r="25" fill="#FB923C" {...line} />
      <path d="M 26 46 Q 36 40 46 48 Q 50 62 50 62 Q 50 62 54 48 Q 64 40 74 46 Q 70 64 50 66 Q 30 64 26 46 Z" fill="#FFF7ED" />
      <ellipse cx="50" cy="52" rx="4" ry="3" fill={SK} />
      <Eyes x1={38} x2={62} y={39} blink={a} />
      <Smile x={50} y={57} w={4} />
      <Blush x1={30} x2={70} y={49} />
    </>
  ),
  frog: a => (
    <>
      <path d="M 26 88 Q 16 92 20 96 L 34 94 Z M 74 88 Q 84 92 80 96 L 66 94 Z" fill="#16A34A" {...line} strokeWidth="2.4" />
      <ellipse cx="50" cy="76" rx="24" ry="17" fill="#4ADE80" {...line} />
      <ellipse cx="50" cy="80" rx="15" ry="11" fill="#ECFCCB" />
      <ellipse cx="38" cy="90" rx="7" ry="4" fill="#22C55E" {...line} strokeWidth="2.4" /><ellipse cx="62" cy="90" rx="7" ry="4" fill="#22C55E" {...line} strokeWidth="2.4" />
      <circle cx="34" cy="24" r="12" fill="#4ADE80" {...line} /><circle cx="66" cy="24" r="12" fill="#4ADE80" {...line} />
      <ellipse cx="50" cy="46" rx="32" ry="22" fill="#4ADE80" {...line} />
      <circle cx="34" cy="24" r="8.5" fill="#FFFFFF" /><circle cx="66" cy="24" r="8.5" fill="#FFFFFF" />
      <Eyes x1={34} x2={66} y={25} r={5.5} blink={a} />
      <path d="M 30 50 Q 50 66 70 50" fill="#F87171" {...line} strokeWidth="2.4" />
      <path d="M 42 56 Q 50 60 58 56" fill="none" stroke="#FCA5A5" strokeWidth="2" />
      <circle cx="44" cy="40" r="1.4" fill={SK} /><circle cx="56" cy="40" r="1.4" fill={SK} />
      <Blush x1={26} x2={74} y={46} />
      <circle cx="68" cy="68" r="2.4" fill="#22C55E" /><circle cx="33" cy="72" r="2" fill="#22C55E" />
    </>
  ),
  turtle: a => (
    <>
      <path d="M 18 86 Q 12 92 18 94 L 28 90 Z M 82 86 Q 88 92 82 94 L 72 90 Z" fill="#A3E635" {...line} strokeWidth="2.4" />
      <path d="M 12 78 Q 12 48 50 46 Q 88 48 88 78 Q 70 86 50 86 Q 30 86 12 78 Z" fill="#65A30D" {...line} />
      <path d="M 40 52 L 60 52 L 66 66 L 56 78 L 44 78 L 34 66 Z" fill="#84CC16" {...line} strokeWidth="2" />
      <path d="M 40 52 L 30 52 L 20 64 L 34 66 M 60 52 L 70 52 L 80 64 L 66 66 M 44 78 L 36 84 M 56 78 L 64 84 M 20 64 L 16 76 M 80 64 L 84 76" fill="none" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M 12 78 Q 50 92 88 78" fill="none" stroke="#FDE68A" strokeWidth="4" />
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '50px 50px' }}>
        <circle cx="50" cy="32" r="21" fill="#A3E635" {...line} />
        <Eyes x1={41} x2={59} y={30} r={6.5} blink={a} />
        <Smile x={50} y={41} w={5} />
        <Blush x1={34} x2={66} y={38} r={4.5} />
        <Shine x={40} y={18} rx={4} ry={2.4} />
      </g>
    </>
  ),
  squirrel: a => (
    <>
      <g className={a ? 'critter-wag' : ''} style={{ transformOrigin: '66px 82px' }}>
        <path d="M 62 84 Q 92 88 92 58 Q 92 28 72 26 Q 62 26 64 36 Q 80 36 80 54 Q 80 70 62 70 Z" fill="#C2793B" {...line} />
        <path d="M 72 32 Q 86 34 86 52" fill="none" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </g>
      <Feet c="#92400E" />
      <ellipse cx="46" cy="74" rx="20" ry="17" fill="#C2793B" {...line} />
      <ellipse cx="46" cy="78" rx="11" ry="11" fill="#FEF3C7" />
      <path d="M 24 26 L 22 8 L 36 18 Z M 64 26 L 66 8 L 52 18 Z" fill="#C2793B" {...line} />
      <path d="M 22 8 L 20 2 M 66 8 L 68 2" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="42" r="23" fill="#C2793B" {...line} />
      <ellipse cx="44" cy="52" rx="12" ry="9" fill="#FEF3C7" />
      <ellipse cx="44" cy="47" rx="3.5" ry="2.6" fill={SK} />
      <Eyes x1={34} x2={54} y={38} r={6.5} blink={a} />
      <path d="M 41.5 52 L 41.5 56 L 46.5 56 L 46.5 52" fill="#FFFFFF" stroke={SK} strokeWidth="1.4" />
      <Blush x1={26} x2={62} y={48} />
    </>
  ),
  hedgehog: a => (
    <>
      <path d={'M 14 70 ' + Array.from({ length: 13 }, (_, i) => { const t = Math.PI * (1.05 + i * 0.075); const r1 = 40, r2 = 30; const x1 = 50 + Math.cos(t) * r1, y1 = 58 + Math.sin(t) * r1 * 0.9; const t2 = t + 0.0375 * Math.PI; const x2 = 50 + Math.cos(t2) * r2, y2 = 58 + Math.sin(t2) * r2 * 0.9; return `L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`; }).join(' ') + ' L 86 70 Q 86 92 50 92 Q 14 92 14 70 Z'} fill="#78350F" {...line} strokeWidth="2.6" />
      <Feet c="#5B3A1E" />
      <ellipse cx="50" cy="72" rx="24" ry="19" fill="#E8C9A0" {...line} />
      <circle cx="50" cy="48" r="22" fill="#E8C9A0" {...line} />
      <path d="M 28 40 Q 36 26 50 28 Q 64 26 72 40 Q 62 32 50 36 Q 38 32 28 40 Z" fill="#78350F" />
      <circle cx="31" cy="34" r="6" fill="#E8C9A0" {...line} strokeWidth="2.2" /><circle cx="69" cy="34" r="6" fill="#E8C9A0" {...line} strokeWidth="2.2" />
      <Eyes x1={41} x2={59} y={47} r={6} blink={a} />
      <ellipse cx="50" cy="56" rx="4" ry="3" fill={SK} />
      <Smile x={50} y={61} w={4} />
      <Blush x1={33} x2={67} y={56} r={4.5} />
    </>
  ),
  bee: a => (
    <>
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 46px' }}>
        <ellipse cx="30" cy="30" rx="15" ry="11" fill="#E0F2FE" opacity="0.85" stroke="#7DD3FC" strokeWidth="2.4" transform="rotate(-30 30 30)" />
        <ellipse cx="70" cy="30" rx="15" ry="11" fill="#E0F2FE" opacity="0.85" stroke="#7DD3FC" strokeWidth="2.4" transform="rotate(30 70 30)" />
      </g>
      <path d="M 50 92 L 46 84 L 54 84 Z" fill={SK} />
      <ellipse cx="50" cy="60" rx="28" ry="27" fill="#FDE047" {...line} />
      <path d="M 25 66 Q 50 72 75 66 L 74 74 Q 50 80 26 74 Z M 32 80 Q 50 85 68 80 Q 62 88 50 88 Q 38 88 32 80 Z" fill={SK} />
      <path d="M 40 36 Q 34 22 30 20 M 60 36 Q 66 22 70 20" fill="none" stroke={SK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="30" cy="19" r="3.4" fill={SK} /><circle cx="70" cy="19" r="3.4" fill={SK} />
      <Eyes x1={40} x2={60} y={52} r={6.5} blink={a} />
      <Smile x={50} y={61} w={4} />
      <Blush x1={30} x2={70} y={58} r={4.5} />
      <Shine x={36} y={42} />
    </>
  ),
  butterfly: a => (
    <>
      <g className={a ? 'critter-flutter' : ''} style={{ transformOrigin: '50px 56px' }}>
        <path d="M 46 52 Q 26 14 10 26 Q 2 40 22 56 Q 6 66 16 82 Q 30 92 46 66 Z" fill="#C084FC" {...line} />
        <path d="M 54 52 Q 74 14 90 26 Q 98 40 78 56 Q 94 66 84 82 Q 70 92 54 66 Z" fill="#C084FC" {...line} />
        <circle cx="24" cy="36" r="7" fill="#F5D0FE" /><circle cx="76" cy="36" r="7" fill="#F5D0FE" />
        <circle cx="24" cy="36" r="3" fill="#FDE047" /><circle cx="76" cy="36" r="3" fill="#FDE047" />
        <circle cx="26" cy="72" r="5" fill="#F9A8D4" /><circle cx="74" cy="72" r="5" fill="#F9A8D4" />
      </g>
      <ellipse cx="50" cy="70" rx="7" ry="18" fill="#7C3AED" {...line} />
      <path d="M 46 30 Q 40 14 36 12 M 54 30 Q 60 14 64 12" fill="none" stroke={SK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="36" cy="11" r="3" fill="#7C3AED" /><circle cx="64" cy="11" r="3" fill="#7C3AED" />
      <circle cx="50" cy="42" r="15" fill="#A78BFA" {...line} />
      <Eyes x1={44} x2={56} y={41} r={4.8} blink={a} />
      <Smile x={50} y={48} w={3.4} />
      <Blush x1={39} x2={61} y={47} r={3.4} />
    </>
  ),
};

interface Props {
  species: SpeciesKey;
  size?: number;
  className?: string;
  style?: CSSProperties;
  animate?: boolean; // set false for tiny inline usages (option buttons) to save motion
}

export function CritterSprite({ species, size = 64, className, style, animate = true }: Props) {
  return (
    <svg viewBox="0 -6 100 106" width={size} height={size} className={`${animate ? 'critter-bob' : ''} ${className ?? ''}`}
      style={{ overflow: 'visible', ...style }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* hand-painted brush look (components/art/PaintKit.tsx); the
          boiling edge only while animated, so tiny static icons stay calm */}
      <g filter={animate ? 'url(#kp-boil)' : 'url(#kp-brush)'}>
        {ART[species](animate)}
      </g>
    </svg>
  );
}

// Convenience wrapper: pass the emoji already used throughout the game
// data, get back the matching animated critter — or the raw emoji if
// it isn't a creature (gems, colors, flags, etc.), so callers never
// need an if/else at the call site.
export function Critter({ emoji, size = 64, className, style, animate = true }:
  { emoji: string; size?: number; className?: string; style?: CSSProperties; animate?: boolean }) {
  const species = EMOJI_SPECIES[emoji];
  if (!species) return <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1, ...style }}>{emoji}</span>;
  return <CritterSprite species={species} size={size} className={className} style={style} animate={animate} />;
}
