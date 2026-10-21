// ── Drawn game pieces ──
// Small painted pictures for the Owl's Tower and Story Keepers games
// (Sky Mail, Moonlight Match, Story Sparks) so the child sees drawings,
// not emoji: shapes, berries, treats, arrows, wind riders, faces, the
// mailbox, envelopes, feathers and a storybook. All use the warm brown
// outline and the shared brush filter (kp-edge on small pieces so the
// bristle texture doesn't turn to mush). Decoration only, never measured.
//
// This folder starts with "_" so Next.js never turns it into a route.

import type { CSSProperties } from 'react';

const SK = '#3b2416';

type Svg = { size?: number; className?: string; style?: CSSProperties };

function Frame({ size = 40, className, style, children, brush }: Svg & { children: React.ReactNode; brush?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true"
      style={{ display: 'inline-block', overflow: 'visible', ...style }}>
      <g filter={`url(#${brush || size >= 56 ? 'kp-brush' : 'kp-edge'})`}>{children}</g>
    </svg>
  );
}

// a soft white shine, the same on every piece
const Shine = ({ cx, cy, r = 3 }: { cx: number; cy: number; r?: number }) => (
  <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.7} fill="#FFFFFF" opacity="0.6" transform={`rotate(-30 ${cx} ${cy})`} />
);

// ── Shapes ──
export type ShapeKind = 'circle' | 'triangle' | 'square' | 'star' | 'heart' | 'purple' | 'moon' | 'sun' | 'clover' | 'gem';
export const SHAPE_KINDS: ShapeKind[] = ['circle', 'triangle', 'square', 'star', 'heart', 'purple', 'moon', 'sun', 'clover', 'gem'];

export function Shape({ kind, ...p }: Svg & { kind: ShapeKind }) {
  const w = 2.2;
  return (
    <Frame {...p}>
      {kind === 'circle' && <><circle cx="20" cy="20" r="14" fill="#4FA3F7" stroke={SK} strokeWidth={w} /><Shine cx={14} cy={14} /></>}
      {kind === 'purple' && <><circle cx="20" cy="20" r="14" fill="#A66BE8" stroke={SK} strokeWidth={w} /><Shine cx={14} cy={14} /></>}
      {kind === 'triangle' && <><path d="M20 5 L35 33 H5z" fill="#F2645A" stroke={SK} strokeWidth={w} strokeLinejoin="round" /><Shine cx={16} cy={20} /></>}
      {kind === 'square' && <><rect x="7" y="7" width="26" height="26" rx="3" fill="#58C26B" stroke={SK} strokeWidth={w} /><Shine cx={13} cy={13} /></>}
      {kind === 'star' && <><path d="M20 4l4.6 9.6 10.4 1.4-7.6 7.2 1.9 10.4L20 27.6l-9.3 5 1.9-10.4L5 15l10.4-1.4z" fill="#FFD43B" stroke={SK} strokeWidth={w} strokeLinejoin="round" /><Shine cx={16} cy={15} r={2.4} /></>}
      {kind === 'heart' && <><path d="M20 34 C6 25 4 17 8 11 C12 6 18 8 20 13 C22 8 28 6 32 11 C36 17 34 25 20 34z" fill="#F0507A" stroke={SK} strokeWidth={w} strokeLinejoin="round" /><Shine cx={12} cy={14} /></>}
      {kind === 'moon' && <><path d="M26 5 A15 15 0 1 0 34 29 A12 12 0 1 1 26 5z" fill="#FFE27A" stroke={SK} strokeWidth={w} strokeLinejoin="round" /><Shine cx={12} cy={17} /></>}
      {kind === 'sun' && (
        <>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <path key={i} d={`M${20 + Math.cos(a) * 12} ${20 + Math.sin(a) * 12} L${20 + Math.cos(a) * 18} ${20 + Math.sin(a) * 18}`} stroke="#F59E0B" strokeWidth="3.2" strokeLinecap="round" />;
          })}
          <circle cx="20" cy="20" r="9.5" fill="#FFC93B" stroke={SK} strokeWidth={w} /><Shine cx={17} cy={16} r={2.4} />
        </>
      )}
      {kind === 'clover' && (
        <>
          <path d="M20 22 Q22 30 26 35" stroke="#2F7A41" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {[[20, 11], [11, 20], [29, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7.5" fill="#4CB860" stroke={SK} strokeWidth={w} />)}
          <circle cx="20" cy="20" r="3" fill="#4CB860" />
          <Shine cx={17} cy={9} r={2} />
        </>
      )}
      {kind === 'gem' && <><path d="M11 7 H29 L36 15 L20 35 L4 15z" fill="#5ED6E8" stroke={SK} strokeWidth={w} strokeLinejoin="round" /><path d="M4 15 H36 M15 7 L13 15 L20 35 M25 7 L27 15 L20 35" stroke={SK} strokeWidth="1.2" fill="none" opacity="0.6" /><Shine cx={12} cy={11} r={2.2} /></>}
    </Frame>
  );
}

// ── Berries and treats (for counting) ──
export type BerryKind = 'straw' | 'blue' | 'cherry';
export function Berry({ kind, ...p }: Svg & { kind: BerryKind }) {
  return (
    <Frame {...p}>
      {kind === 'straw' && (
        <>
          <path d="M20 36 C9 30 6 20 9 14 C12 10 28 10 31 14 C34 20 31 30 20 36z" fill="#F0485A" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          {[[15, 18], [24, 17], [19, 24], [13, 25], [26, 25], [20, 31]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="1" ry="1.5" fill="#FFE8A0" />)}
          <path d="M10 13 L15 9 L20 12 L25 9 L30 13 L25 14 L20 16 L15 14z" fill="#4CB860" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
          <Shine cx={13} cy={19} r={2.2} />
        </>
      )}
      {kind === 'blue' && (
        <>
          <circle cx="20" cy="22" r="12" fill="#5B7BE8" stroke={SK} strokeWidth="2.2" />
          <path d="M16 13 L18 16 L20 12 L22 16 L24 13" stroke={SK} strokeWidth="1.6" fill="#3E56B8" strokeLinejoin="round" />
          <Shine cx={14} cy={19} r={2.6} />
        </>
      )}
      {kind === 'cherry' && (
        <>
          <path d="M13 24 Q16 10 26 5 Q24 14 27 24" stroke="#4E7A2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M26 5 Q32 4 34 8 Q29 10 26 5z" fill="#4CB860" stroke={SK} strokeWidth="1.4" />
          <circle cx="12" cy="28" r="8" fill="#E23A4E" stroke={SK} strokeWidth="2.2" />
          <circle cx="27" cy="29" r="8" fill="#E23A4E" stroke={SK} strokeWidth="2.2" />
          <Shine cx={9} cy={25} r={2} /><Shine cx={24} cy={26} r={2} />
        </>
      )}
    </Frame>
  );
}

export type TreatKind = 'straw' | 'cookie' | 'star' | 'apple';
export function Treat({ kind, ...p }: Svg & { kind: TreatKind }) {
  if (kind === 'straw') return <Berry kind="straw" {...p} />;
  if (kind === 'star') return <Shape kind="star" {...p} />;
  return (
    <Frame {...p}>
      {kind === 'cookie' && (
        <>
          <circle cx="20" cy="20" r="14" fill="#E3A35A" stroke={SK} strokeWidth="2.2" />
          {[[14, 15], [24, 13], [26, 23], [16, 26], [20, 19]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#6B3A1E" />)}
          <Shine cx={12} cy={12} r={2.4} />
        </>
      )}
      {kind === 'apple' && (
        <>
          <path d="M20 12 C14 7 5 10 6 20 C7 30 14 35 20 32 C26 35 33 30 34 20 C35 10 26 7 20 12z" fill="#EF4444" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M20 12 Q20 7 23 4" stroke={SK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M22 8 Q28 4 31 8 Q26 11 22 8z" fill="#4CB860" stroke={SK} strokeWidth="1.4" />
          <Shine cx={12} cy={17} r={2.6} />
        </>
      )}
    </Frame>
  );
}

// ── Arrows ──
export type Dir = 'left' | 'right' | 'up' | 'down';
const ROT: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 };
export function Arrow({ dir, color = '#FFD43B', ...p }: Svg & { dir: Dir; color?: string }) {
  return (
    <Frame {...p}>
      <g transform={`rotate(${ROT[dir]} 20 20)`}>
        <path d="M4 15 H21 V7 L36 20 L21 33 V25 H4z" fill={color} stroke={SK} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M7 17.5 H22" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

// ── Wind riders: light things the wind carries (no animals) ──
export type RiderKind = 'leaf' | 'kite' | 'plane' | 'feather' | 'balloon' | 'seed';
export const RIDER_KINDS: RiderKind[] = ['leaf', 'kite', 'plane', 'feather', 'balloon', 'seed'];
export function Rider({ kind, ...p }: Svg & { kind: RiderKind }) {
  return (
    <Frame {...p}>
      {kind === 'leaf' && (
        <>
          <path d="M5 30 Q8 6 35 6 Q34 30 5 30z" fill="#7BCB5A" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M6 29 Q18 18 32 8" stroke={SK} strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M5 30 L2 35" stroke={SK} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === 'kite' && (
        <>
          <path d="M20 3 L32 16 L20 29 L8 16z" fill="#F472B6" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M20 3 V29 M8 16 H32" stroke={SK} strokeWidth="1.3" opacity="0.6" />
          <path d="M20 3 L32 16 L20 16z" fill="#FFD43B" opacity="0.85" />
          <path d="M20 29 q-4 3 0 5 q4 2 0 5" stroke={SK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M17 33 l3 1 l-1 2z M21 37 l3 0.5 l-1.5 2z" fill="#60A5FA" stroke={SK} strokeWidth="0.8" />
        </>
      )}
      {kind === 'plane' && (
        <>
          <path d="M3 21 L37 6 L24 34 L18 24z" fill="#FFFFFF" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M18 24 L37 6 L15 30z" fill="#D9E6FF" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
        </>
      )}
      {kind === 'feather' && <Plume />}
      {kind === 'balloon' && (
        <>
          <ellipse cx="20" cy="15" rx="11" ry="13" fill="#60A5FA" stroke={SK} strokeWidth="2.2" />
          <path d="M18 28 L22 28 L20 31z" fill="#60A5FA" stroke={SK} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M20 31 q-3 3 0 5 q3 2 0 4" stroke={SK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <Shine cx={15} cy={10} r={3} />
        </>
      )}
      {kind === 'seed' && (
        <>
          <path d="M20 22 L20 37" stroke={SK} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="20" cy="37" rx="2" ry="2.6" fill="#B08354" stroke={SK} strokeWidth="1" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i / 8) * Math.PI;
            const x = 20 + Math.cos(a) * 15, y = 20 + Math.sin(a) * 15;
            return <g key={i}><path d={`M20 22 L${x} ${y}`} stroke="#FFFFFF" strokeWidth="1.3" /><circle cx={x} cy={y} r="2.4" fill="#FFFFFF" stroke={SK} strokeWidth="0.8" /></g>;
          })}
        </>
      )}
    </Frame>
  );
}

// the feather on its own (wind rider + Moonlight Match card backs)
function Plume({ color = '#FFF4D6', vein = '#C9822F' }: { color?: string; vein?: string }) {
  return (
    <g transform="rotate(32 20 20)">
      {/* a long soft vane with two little notches, and the quill down the middle */}
      <path d="M20 1.5 C26 5 28.4 11 27.8 16.5 L24.2 17.6 L28 20.2 C27.8 25.5 25.4 29.5 21 32.5 L19 32.5 C14.6 29.5 12.3 25.8 12.2 21.6 L15.8 20.6 L12.3 18.6 C12.2 11.5 14.4 5.5 20 1.5z"
        fill={color} stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 5 V39" stroke={vein} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M20 10 L24.5 7.5 M20 14 L25.5 12 M20 23 L25.5 21 M20 27 L24 26 M20 12 L15.5 10 M20 16.5 L14.5 15 M20 25 L15 23.5"
        stroke={vein} strokeWidth="1" opacity="0.65" strokeLinecap="round" />
    </g>
  );
}
export function Feather({ color, vein, ...p }: Svg & { color?: string; vein?: string }) {
  return <Frame {...p}><Plume color={color} vein={vein} /></Frame>;
}

// ── Little faces (Feeling Finder mailboxes) ──
export function Face({ mood, ...p }: Svg & { mood: 'happy' | 'sad' }) {
  const happy = mood === 'happy';
  return (
    <Frame {...p}>
      <circle cx="20" cy="20" r="15" fill={happy ? '#FFD43B' : '#9CC8F5'} stroke={SK} strokeWidth="2.2" />
      <ellipse cx="14.5" cy="17" rx="1.9" ry="2.6" fill={SK} />
      <ellipse cx="25.5" cy="17" rx="1.9" ry="2.6" fill={SK} />
      {happy
        ? <path d="M12 23 Q20 31 28 23" stroke={SK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        : <path d="M13 28 Q20 22 27 28" stroke={SK} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {happy
        ? <><circle cx="10.5" cy="23" r="2.4" fill="#F98BA8" opacity="0.7" /><circle cx="29.5" cy="23" r="2.4" fill="#F98BA8" opacity="0.7" /></>
        : <path d="M26.5 20.5 q-1.6 3 0 4.2 q1.6 -1.2 0 -4.2z" fill="#4FA3F7" stroke={SK} strokeWidth="0.8" />}
      <Shine cx={13} cy={10} r={2.4} />
    </Frame>
  );
}

// ── Small signs for the word mailboxes ──
export function Check(p: Svg) {
  return <Frame {...p}><path d="M7 21 L16 30 L33 10" stroke="#3FAE5A" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 21 L16 30 L33 10" stroke={SK} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /></Frame>;
}
export function Squiggle(p: Svg) {
  return <Frame {...p}><path d="M4 22 Q9 10 14 20 T24 20 T36 16" stroke="#F472B6" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="33" cy="30" r="2.6" fill="#FFD43B" stroke={SK} strokeWidth="1" /><circle cx="8" cy="31" r="2" fill="#60A5FA" stroke={SK} strokeWidth="1" /></Frame>;
}
export function Notes(p: Svg) {
  return (
    <Frame {...p}>
      <path d="M15 28 V9 L33 5 V24" stroke={SK} strokeWidth="2.6" fill="none" strokeLinejoin="round" />
      <path d="M15 9 L33 5 V10 L15 14z" fill={SK} />
      <ellipse cx="11" cy="29" rx="5" ry="4" fill="#A66BE8" stroke={SK} strokeWidth="2" transform="rotate(-20 11 29)" />
      <ellipse cx="29" cy="25" rx="5" ry="4" fill="#A66BE8" stroke={SK} strokeWidth="2" transform="rotate(-20 29 25)" />
    </Frame>
  );
}
export function Pebbles(p: Svg) {
  // two plain stones that don't match: "no rhyme"
  return (
    <Frame {...p}>
      <ellipse cx="12" cy="24" rx="8" ry="6" fill="#B9B2A6" stroke={SK} strokeWidth="2" />
      <path d="M24 30 L28 15 L36 22 L33 31z" fill="#8E9AAF" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <Shine cx={9} cy={21} r={2} />
    </Frame>
  );
}

// ── Mail ──
export function Envelope({ open = false, ...p }: Svg & { open?: boolean }) {
  return (
    <Frame {...p}>
      <rect x="4" y="10" width="32" height="22" rx="3" fill="#FFF7E6" stroke={SK} strokeWidth="2.2" />
      <path d={open ? 'M4 12 L20 2 L36 12' : 'M5 11 L20 23 L35 11'} stroke={SK} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M15 21 C12 18 14 15 16.5 16.5 C19 15 21 18 18 21 L16.5 22.5z" fill="#F0507A" transform="translate(10 1) scale(0.85)" />
    </Frame>
  );
}

/** a red post box on a short base; flagUp when a letter just landed */
export function Mailbox({ color = '#F2645A', flagUp = false, ...p }: Svg & { color?: string; flagUp?: boolean }) {
  return (
    <Frame {...p} brush>
      <rect x="18" y="26" width="4" height="13" fill="#8A5A3B" stroke={SK} strokeWidth="1.6" />
      <path d="M7 27 V15 A13 11 0 0 1 33 15 V27z" fill={color} stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M10 15 A10 8 0 0 1 22 8" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
      <rect x="12" y="17" width="16" height="3.4" rx="1.7" fill={SK} />
      <g style={{ transformBox: 'view-box', transformOrigin: '33px 22px', transform: `rotate(${flagUp ? -80 : 0}deg)`, transition: 'transform 0.25s cubic-bezier(.3,1.6,.5,1)' }}>
        <path d="M33 22 H38 V25 H33z" fill="#FFD43B" stroke={SK} strokeWidth="1.2" />
        <path d="M37 18 V26" stroke={SK} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M37 18 H40.5 V21 H37z" fill="#FFD43B" stroke={SK} strokeWidth="1.2" />
      </g>
    </Frame>
  );
}

// ── Storybook (Story Sparks) ──
export function Book({ open = false, ...p }: Svg & { open?: boolean }) {
  return (
    <Frame {...p} brush>
      {open ? (
        <>
          <path d="M20 10 Q11 5 3 8 V32 Q11 29 20 34 Q29 29 37 32 V8 Q29 5 20 10z" fill="#FFF7E0" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M20 10 V34" stroke={SK} strokeWidth="1.6" />
          <path d="M7 14 Q12 12 16 14 M7 19 Q12 17 16 19 M7 24 Q12 22 16 24 M24 14 Q28 12 33 14 M24 19 Q28 17 33 19" stroke="#C9A97A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="8" y="5" width="25" height="30" rx="2.5" fill="#A855F7" stroke={SK} strokeWidth="2.2" />
          <path d="M11 35 V5" stroke={SK} strokeWidth="1.6" />
          <rect x="15" y="11" width="14" height="7" rx="1.5" fill="#FFE27A" stroke={SK} strokeWidth="1.2" />
          <path d="M22 22l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="#FFE27A" />
        </>
      )}
    </Frame>
  );
}

/** a little painted flame for the combo streak */
export function Flame(p: Svg) {
  return (
    <Frame {...p}>
      <path d="M20 37 C9 36 6 26 11 18 C13 23 16 23 16 19 C16 12 20 7 24 3 C24 12 34 16 32 27 C31 33 26 37 20 37z" fill="#FF8A3D" stroke={SK} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20 34 C15 33 14 28 17 24 C18 27 21 27 21 24 C23 26 27 29 25 32 C24 33.5 22 34 20 34z" fill="#FFE27A" />
    </Frame>
  );
}
