// ── Grasp-pattern hands ──
// Painted illustrations of a child's right hand holding a pencil in each
// of the five pencil grips the parent quick-check asks about (palmar,
// digital pronate, quadrupod, static/immature tripod, dynamic tripod).
// Drawn side-on from the thumb side, pencil tip down on the paper, so the
// five pictures can be compared at a glance: what changes is which
// fingers touch the pencil, where, and how open the thumb-index "O" is.
//
// Each finger is a chain of joints (knuckle → middle joint → top joint →
// fingertip) drawn as a rounded painted stroke, so poses are easy to
// adjust: move a joint, the finger follows. Uses the shared brush filter
// from components/art/PaintKit.tsx.

import type { ReactNode } from 'react';

export type GripKey = 'palmar' | 'digital_pronate' | 'quadrupod' | 'immature_tripod' | 'dynamic_tripod';

const OUT = '#8a4e34';   // warm painted contour
const SKIN = '#F7CBA6';
const SKIN_FAR = '#E9AE88'; // fingers on the far side of the pencil
const SKIN_HI = '#FDE2CB';
const NAIL = '#FCE6DA';

type P = [number, number];

// One finger (or thumb): rounded segments through its joints, outline
// first then fill, plus a nail on the tip facing the viewer when `nail`.
function Finger({ pts, w, far = false, nail = true }: { pts: P[]; w: number; far?: boolean; nail?: boolean }) {
  // Each segment a little thinner than the one before, so fingers taper
  // toward the tip like a real (chubby, little) hand instead of tubes.
  const segs = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, sw: w * (1 - 0.07 * i) }));
  const seg = (a: P, b: P) => `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const tipW = segs[segs.length - 1].sw;
  return (
    <g>
      {segs.map((s, i) => (
        <path key={`o${i}`} d={seg(s.a, s.b)} stroke={OUT} strokeWidth={s.sw + 3} strokeLinecap="round" />
      ))}
      {segs.map((s, i) => (
        <path key={`f${i}`} d={seg(s.a, s.b)} stroke={far ? SKIN_FAR : SKIN} strokeWidth={s.sw} strokeLinecap="round" />
      ))}
      {/* soft light along the top of each finger */}
      {segs.map((s, i) => (
        <path key={`h${i}`} d={seg(s.a, s.b)} stroke={SKIN_HI} strokeWidth={s.sw * 0.26} strokeLinecap="round"
          opacity={far ? 0.2 : 0.5} transform={`translate(${-s.sw * 0.1} ${-s.sw * 0.17})`} />
      ))}
      {/* knuckle creases: a short line across the finger at each joint */}
      {pts.slice(1, -1).map((p, i) => {
        const [q, r] = [pts[i], pts[i + 2]];
        const n = Math.atan2(r[1] - q[1], r[0] - q[0]) + Math.PI / 2;
        const h = w * 0.22;
        return (
          <path key={`k${i}`} d={`M ${p[0] - Math.cos(n) * h} ${p[1] - Math.sin(n) * h} L ${p[0] + Math.cos(n) * h * 0.3} ${p[1] + Math.sin(n) * h * 0.3}`}
            stroke={OUT} strokeWidth="0.9" strokeLinecap="round" opacity="0.4" />
        );
      })}
      {nail && (
        <ellipse cx={b[0] - Math.cos(ang) * tipW * 0.16} cy={b[1] - Math.sin(ang) * tipW * 0.16}
          rx={tipW * 0.3} ry={tipW * 0.22} transform={`rotate(${(ang * 180) / Math.PI} ${b[0]} ${b[1]})`}
          fill={NAIL} stroke={OUT} strokeWidth="0.8" opacity={far ? 0.6 : 1} />
      )}
    </g>
  );
}

function Blob({ d, far = false }: { d: string; far?: boolean }) {
  return <path d={d} fill={far ? SKIN_FAR : SKIN} stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />;
}

// A pencil from tip to end, `w` thick.
function Pencil({ tip, end, w = 7 }: { tip: P; end: P; w?: number }) {
  const dx = end[0] - tip[0], dy = end[1] - tip[1];
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`}>
      <path d={`M 0 0 L 10 ${-w / 2} L 10 ${w / 2} Z`} fill="#F2D3A1" stroke={OUT} strokeWidth="1" strokeLinejoin="round" />
      <path d={`M 0 0 L 3.4 ${-w / 6} L 3.4 ${w / 6} Z`} fill="#3b2416" />
      <rect x="10" y={-w / 2} width={len - 16} height={w} fill="#FFC23C" stroke={OUT} strokeWidth="1" />
      <rect x="10" y={-w / 2 + 1} width={len - 16} height={w * 0.28} fill="#FFE08A" />
      <rect x={len - 6} y={-w / 2} width="6" height={w} rx="2" fill="#F48FA8" stroke={OUT} strokeWidth="1" />
      <rect x={len - 8} y={-w / 2} width="3" height={w} fill="#C9CED6" stroke={OUT} strokeWidth="0.8" />
    </g>
  );
}

function Paper() {
  return (
    <g>
      <path d="M 4 108 Q 60 104 116 109 L 116 120 L 4 120 Z" fill="#FFFDF7" stroke={OUT} strokeWidth="1" opacity="0.9" />
      <path d="M 14 106.5 Q 22 103 30 106" fill="none" stroke="#7C9CF5" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

// ─── The five grips ──────────────────────────────────────────────────────

// Mature, dynamic tripod: pencil pinched between the PADS of thumb and
// index, resting on the side of the middle finger; ring and pinky curled
// into the palm for stability; a round open "O" between thumb and index.
function DynamicTripod() {
  return (
    <>
      {/* ring & little finger tucked into the palm (far side) */}
      <Finger far pts={[[88, 84], [82, 95], [74, 98]]} w={9} nail={false} />
      <Finger far pts={[[84, 79], [76, 91], [66, 95], [60, 92]]} w={9.5} nail={false} />
      {/* middle finger: pencil rests on its side, near the last joint */}
      <Finger far pts={[[80, 72], [68, 84], [55, 92], [45, 91]]} w={10} />
      <Blob d="M 74 60 Q 96 52 112 66 L 120 72 L 120 104 L 104 104 Q 92 100 84 90 Q 72 76 74 60 Z" />
      <Pencil tip={[24, 106]} end={[98, 26]} />
      {/* index finger arches over the pencil, pad on top */}
      <Finger pts={[[80, 64], [67, 58], [57, 66], [50, 76]]} w={10.5} />
      {/* thumb: pad pressing from the near side, web space open */}
      <Finger pts={[[92, 90], [77, 94], [64, 90], [55, 82]]} w={12} />
      <path d="M 62 76 Q 66 82 72 80" fill="none" stroke={OUT} strokeWidth="1" opacity="0.4" />
    </>
  );
}

// Static / immature tripod: the same three fingers, but the thumb wraps
// ACROSS the pencil and over the index (web space closed), fingers held
// stiff, grip higher up the pencil — movement comes from the wrist/arm.
function ImmatureTripod() {
  return (
    <>
      <Finger far pts={[[90, 80], [86, 92], [78, 96]]} w={9} nail={false} />
      <Finger far pts={[[86, 74], [80, 86], [70, 92]]} w={9.5} nail={false} />
      <Finger far pts={[[82, 66], [70, 76], [58, 82], [50, 80]]} w={10} />
      <Blob d="M 78 52 Q 100 46 114 60 L 120 66 L 120 100 L 106 100 Q 92 94 86 84 Q 76 70 78 52 Z" />
      <Pencil tip={[34, 106]} end={[94, 18]} />
      {/* index pressed flat along the pencil */}
      <Finger pts={[[82, 56], [70, 56], [60, 62], [54, 70]]} w={10.5} />
      {/* thumb crosses OVER the pencil and the index — closed web space */}
      <Finger pts={[[98, 78], [80, 78], [64, 70], [54, 62]]} w={11.5} />
    </>
  );
}

// Quadrupod: thumb, index, middle AND ring finger on the pencil — the
// pencil rests on the ring finger instead of the middle finger.
function Quadrupod() {
  return (
    <>
      <Finger far pts={[[88, 86], [82, 97], [74, 100]]} w={9} nail={false} />
      {/* ring finger now reaches the pencil too */}
      <Finger far pts={[[84, 80], [72, 92], [58, 98], [46, 97]]} w={9.5} />
      <Finger far pts={[[80, 72], [68, 82], [56, 88], [46, 88]]} w={10} />
      <Blob d="M 74 60 Q 96 52 112 66 L 120 72 L 120 106 L 104 106 Q 92 102 84 92 Q 72 76 74 60 Z" />
      <Pencil tip={[26, 108]} end={[96, 26]} />
      <Finger pts={[[80, 64], [67, 60], [57, 68], [50, 78]]} w={10.5} />
      <Finger pts={[[92, 92], [77, 96], [64, 92], [55, 84]]} w={12} />
    </>
  );
}

// Digital pronate: palm faces DOWN; all fingers wrap the pencil from
// above with the index stretched along it toward the tip; the end of the
// pencil sits in the palm. The whole forearm moves to draw.
function DigitalPronate() {
  return (
    <>
      {/* fingers curl down around the pencil from above (far side) */}
      <Finger far pts={[[86, 50], [84, 62], [78, 70]]} w={9} nail={false} />
      <Finger far pts={[[78, 48], [74, 62], [68, 70]]} w={9.5} nail={false} />
      <Pencil tip={[22, 108]} end={[104, 52]} w={7} />
      {/* back of the hand on top, knuckles up */}
      <Blob d="M 60 52 Q 66 34 88 34 Q 108 34 118 46 L 120 50 L 120 76 L 100 76 Q 88 78 76 76 Q 62 72 60 52 Z" />
      <path d="M 70 42 Q 74 38 80 40 M 82 38 Q 86 35 92 37 M 94 37 Q 98 35 104 38" fill="none" stroke={OUT} strokeWidth="1" opacity="0.45" />
      {/* middle finger wraps over the pencil */}
      <Finger pts={[[70, 50], [62, 62], [58, 74], [62, 80]]} w={10} nail={false} />
      {/* index stretched down along the top of the pencil, pointing to the tip */}
      <Finger pts={[[64, 54], [52, 72], [42, 84], [36, 92]]} w={10.5} />
      {/* thumb presses the pencil from the side */}
      <Finger pts={[[92, 72], [78, 82], [66, 86], [58, 84]]} w={11.5} />
    </>
  );
}

// Palmar (fisted) grasp: the pencil is held in a fist like a dagger, tip
// coming out the LITTLE-FINGER side down to the paper, thumb wrapped over
// the curled fingers on top. The whole arm moves from the shoulder.
function Palmar() {
  return (
    <>
      <Pencil tip={[50, 108]} end={[70, 10]} w={8} />
      {/* the fist: palm block */}
      <Blob d="M 66 30 Q 92 26 110 40 L 120 46 L 120 84 L 106 84 Q 90 88 76 84 Q 66 70 66 30 Z" />
      {/* four curled fingers stacked down the front of the fist */}
      <Finger pts={[[80, 38], [62, 36], [54, 42], [58, 50]]} w={11} nail={false} />
      <Finger pts={[[80, 50], [62, 49], [54, 55], [58, 62]]} w={11} nail={false} />
      <Finger pts={[[80, 62], [62, 62], [55, 68], [59, 74]]} w={10.5} nail={false} />
      <Finger pts={[[80, 73], [64, 74], [58, 79], [62, 84]]} w={9.5} nail={false} />
      {/* thumb wrapped over the top of the fingers */}
      <Finger pts={[[96, 36], [80, 28], [66, 30], [58, 38]]} w={11.5} />
    </>
  );
}

const GRIPS: Record<GripKey, () => ReactNode> = {
  palmar: Palmar,
  digital_pronate: DigitalPronate,
  quadrupod: Quadrupod,
  immature_tripod: ImmatureTripod,
  dynamic_tripod: DynamicTripod,
};

export default function GraspHand({ grip, size = 72, background = '#FFF7EC' }: { grip: GripKey; size?: number; background?: string }) {
  const Grip = GRIPS[grip] ?? DynamicTripod;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img"
      aria-label={`${grip.replace(/_/g, ' ')} pencil grip`} style={{ display: 'block', borderRadius: 12, background }}>
      <g filter="url(#kp-brush)">
        <Paper />
        <Grip />
      </g>
    </svg>
  );
}
