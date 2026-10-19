// ── Grasp-pattern hands ──
// Realistic, textbook-style drawings of a young child's right hand
// holding a pencil in each of the five pencil grips the parent
// quick-check asks about (palmar, digital pronate, quadrupod, static/
// immature tripod, dynamic tripod), drawn like an OT handout: natural
// child proportions (big palm, short fingers), smooth tapered fingers
// that bend at real joints, soft shading, a thin line, short nails, and
// a sleeve so the hand is attached to an arm. Side view from the thumb
// side with the pencil tip on the paper, so the five can be compared:
// which fingers touch the pencil, where, and how open the thumb–index
// "O" (the web space) is.
//
// Each finger is a centre line through its joints (knuckle → middle
// joint → top joint → fingertip) plus a width at each joint; the outline
// is generated from that, so a pose is adjusted by moving a joint.

import { useId, type ReactNode } from 'react';

export type GripKey = 'palmar' | 'digital_pronate' | 'quadrupod' | 'immature_tripod' | 'dynamic_tripod';

const LINE = '#7a4a36';
const SKIN = '#F3C6A5';
const SKIN_FAR = '#DFA585';   // fingers on the far side of the pencil
const SHADE = '#C98466';
const LIGHT = '#FCE1CC';
const NAIL = '#F9DAD2';

type P = [number, number];

// Catmull-Rom through the joints → a smooth bending centre line.
function sample(pts: P[], widths: number[], steps = 10) {
  const out: { p: P; w: number }[] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      const e = t * t * (3 - 2 * t);
      out.push({ p: [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])], w: widths[i] + (widths[i + 1] - widths[i]) * e });
    }
  }
  out.push({ p: pts[pts.length - 1], w: widths[widths.length - 1] });
  return out;
}

function fingerGeometry(pts: P[], widths: number[]) {
  const s = sample(pts, widths);
  const n = s.length;
  const L: P[] = [], R: P[] = [];
  s.forEach((q, i) => {
    const a = s[Math.max(0, i - 1)].p, b = s[Math.min(n - 1, i + 1)].p;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    L.push([q.p[0] + nx * q.w / 2, q.p[1] + ny * q.w / 2]);
    R.push([q.p[0] - nx * q.w / 2, q.p[1] - ny * q.w / 2]);
  });
  // rounded fingertip cap
  const e = s[n - 1], pe = s[n - 2].p;
  const tl = Math.hypot(e.p[0] - pe[0], e.p[1] - pe[1]) || 1;
  const tx = (e.p[0] - pe[0]) / tl, ty = (e.p[1] - pe[1]) / tl, k = e.w * 0.62;
  const lE = L[n - 1], rE = R[n - 1];
  const f = (v: number) => v.toFixed(2);
  const d = `M ${L.map(q => q.map(f).join(' ')).join(' L ')} C ${f(lE[0] + tx * k)} ${f(lE[1] + ty * k)} ${f(rE[0] + tx * k)} ${f(rE[1] + ty * k)} ${f(rE[0])} ${f(rE[1])} L ${R.slice().reverse().map(q => q.map(f).join(' ')).join(' L ')} Z`;
  // which side faces down (gets the shadow)
  const avg = (A: P[]) => A.reduce((t, q) => t + q[1], 0) / A.length;
  const down = avg(L) > avg(R) ? L : R, up = down === L ? R : L;
  return { d, down, up, s };
}

const poly = (A: P[]) => 'M ' + A.map(q => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join(' L ');

// One finger or thumb. `nail`: draw the nail on the upper (+1) or lower
// (-1) edge near the tip, or not at all (0) when the tip faces away.
function Finger({ pts, w, far = false, nail = 1 }: { pts: P[]; w: number[]; far?: boolean; nail?: -1 | 0 | 1 }) {
  const id = useId().replace(/:/g, '');
  const g = fingerGeometry(pts, w);
  const n = g.s.length;
  const edge = nail === 1 ? g.up : g.down;
  const tipW = w[w.length - 1];
  // The finger fades in from its knuckle, so it grows out of the hand
  // instead of being a separate piece laid on top of it.
  const [b0, b1] = [pts[0], pts[1]];
  const fade: P = [b0[0] + (b1[0] - b0[0]) * 0.55, b0[1] + (b1[1] - b0[1]) * 0.55];
  return (
    <g mask={`url(#m${id})`}>
      <defs>
        <clipPath id={`c${id}`}><path d={g.d} /></clipPath>
        <linearGradient id={`g${id}`} gradientUnits="userSpaceOnUse" x1={b0[0]} y1={b0[1]} x2={fade[0]} y2={fade[1]}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
          <rect x="0" y="0" width="160" height="160" fill={`url(#g${id})`} />
        </mask>
      </defs>
      <path d={g.d} fill={far ? SKIN_FAR : SKIN} />
      <g clipPath={`url(#c${id})`}>
        <path d={poly(g.down)} fill="none" stroke={SHADE} strokeWidth={tipW * 0.9} opacity={far ? 0.5 : 0.55} filter="url(#gh-soft)" />
        <path d={poly(g.up.slice(2, -3))} fill="none" stroke={LIGHT} strokeWidth={tipW * 0.35} opacity={far ? 0.25 : 0.7} filter="url(#gh-soft)" />
        {/* faint skin creases across the back of each bent joint */}
        {pts.slice(1, -1).map((q, i) => (
          <circle key={i} cx={q[0]} cy={q[1]} r={w[i + 1] * 0.55} fill="none" stroke={LINE} strokeWidth="0.5" opacity="0.22"
            strokeDasharray={`${w[i + 1] * 0.5} 99`} />
        ))}
      </g>
      {nail !== 0 && (() => {
        const a = edge[n - 6], b = edge[n - 1];
        const c = g.s[n - 1].p;
        const mx = (a[0] + b[0]) / 2 * 0.7 + c[0] * 0.3, my = (a[1] + b[1]) / 2 * 0.7 + c[1] * 0.3;
        return <path d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={NAIL} strokeWidth={tipW * 0.32}
          strokeLinecap="round" opacity="0.95" />;
      })()}
      <path d={g.d} fill="none" stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" />
    </g>
  );
}

// The body of the hand (palm/back of hand + wrist), drawn by hand per grip.
function HandBody({ d, shade }: { d: string; shade?: string }) {
  return (
    <g>
      <path d={d} fill={SKIN} />
      {shade && <path d={shade} fill={SHADE} opacity="0.35" filter="url(#gh-soft)" />}
      <path d={d} fill="none" stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" />
    </g>
  );
}

// A soft cotton sleeve over the forearm, entering from the right edge.
function Sleeve({ d }: { d: string }) {
  return (
    <g>
      <path d={d} fill="#BFD7F2" stroke={LINE} strokeWidth="1.1" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#E8F1FB" strokeWidth="3" opacity="0.5" strokeDasharray="2 9" />
    </g>
  );
}

function Pencil({ tip, end, w = 8 }: { tip: P; end: P; w?: number }) {
  const dx = end[0] - tip[0], dy = end[1] - tip[1];
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`}>
      <path d={`M 0 0 L 13 ${-w / 2} L 13 ${w / 2} Z`} fill="#EBCB9B" stroke={LINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d={`M 0 0 L 4 ${-w / 7} L 4 ${w / 7} Z`} fill="#3d3a3a" />
      <rect x="13" y={-w / 2} width={len - 22} height={w} fill="#F5B731" stroke={LINE} strokeWidth="0.9" />
      <rect x="13" y={-w / 2 + 1} width={len - 22} height={w * 0.25} fill="#FBD978" />
      <rect x="13" y={w / 2 - w * 0.28} width={len - 22} height={w * 0.26} fill="#D89515" opacity="0.6" />
      <rect x={len - 9} y={-w / 2 - 0.3} width="3.5" height={w + 0.6} fill="#BFC5CC" stroke={LINE} strokeWidth="0.7" />
      <rect x={len - 5.5} y={-w / 2} width="5.5" height={w} rx="2" fill="#EE9AA9" stroke={LINE} strokeWidth="0.9" />
    </g>
  );
}

function Paper() {
  return (
    <g>
      <rect x="0" y="138" width="160" height="22" fill="#FFFFFF" />
      <line x1="0" y1="138" x2="160" y2="138" stroke={LINE} strokeWidth="1" opacity="0.5" />
      <path d="M 36 147 q 6 -5 12 0 t 12 0" fill="none" stroke="#6E8FE0" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

// ─── The five grips ──────────────────────────────────────────────────────

// Mature, dynamic tripod: pencil pinched between the PADS of thumb and
// index, resting on the side of the middle finger near its tip; ring and
// little finger curled into the palm; a round open "O" between thumb and
// index; the side of the hand rests on the paper.
function DynamicTripod() {
  return (
    <>
      <Sleeve d="M 136 84 L 160 86 L 160 132 L 134 130 Q 128 108 136 84 Z" />
      {/* little and ring finger curled under (far side) */}
      <Finger far nail={0} pts={[[110, 118], [104, 130], [96, 132]]} w={[9, 8, 7]} />
      <Finger far nail={0} pts={[[104, 112], [96, 126], [86, 130]]} w={[9.5, 8.5, 7.5]} />
      {/* middle finger: pencil lies on its side near the tip */}
      <Finger far nail={-1} pts={[[102, 104], [88, 113], [74, 120], [62, 122]]} w={[10, 9.5, 8.6, 7.8]} />
      <HandBody
        d="M 92 97 C 98 86 116 82 138 86 L 138 128 C 128 134 116 136 106 132 C 100 128 96 124 94 120 C 98 112 98 104 92 97 Z"
        shade="M 100 128 C 112 134 128 132 138 126 L 138 132 L 104 134 Z" />
      <Pencil tip={[40, 138]} end={[128, 32]} />
      {/* index finger arches over the pencil, its pad on top */}
      <Finger nail={1} pts={[[98, 96], [83, 90], [71, 98], [63, 106]]} w={[10.5, 10, 9, 8.2]} />
      {/* thumb: pad on the near side of the pencil; web space open */}
      <Finger nail={1} pts={[[100, 122], [88, 119], [76, 116], [67, 110]]} w={[12.5, 11.5, 10.5, 9.4]} />
    </>
  );
}

// Static / immature tripod: the same three fingers, but held stiffly
// higher up the pencil, and the thumb wraps ACROSS the pencil over the
// index finger, so the web space is closed (no "O").
function ImmatureTripod() {
  return (
    <>
      <Sleeve d="M 136 84 L 160 86 L 160 132 L 134 130 Q 128 108 136 84 Z" />
      <Finger far nail={0} pts={[[110, 118], [104, 130], [96, 132]]} w={[9, 8, 7]} />
      <Finger far nail={0} pts={[[104, 112], [96, 126], [86, 130]]} w={[9.5, 8.5, 7.5]} />
      <Finger far nail={-1} pts={[[102, 104], [90, 114], [78, 120], [68, 120]]} w={[10, 9.5, 8.6, 7.8]} />
      <HandBody
        d="M 92 97 C 98 86 116 82 138 86 L 138 128 C 128 134 116 136 106 132 C 100 128 96 124 94 120 C 98 112 98 104 92 97 Z"
        shade="M 100 128 C 112 134 128 132 138 126 L 138 132 L 104 134 Z" />
      <Pencil tip={[52, 138]} end={[120, 26]} />
      {/* index lies flat along the pencil */}
      <Finger nail={1} pts={[[100, 94], [88, 89], [78, 92], [70, 99]]} w={[10.5, 10, 9, 8.2]} />
      {/* thumb crosses over the pencil and the index: web space closed */}
      <Finger nail={1} pts={[[102, 122], [90, 114], [80, 104], [74, 94]]} w={[12.5, 11.5, 10.5, 9.4]} />
    </>
  );
}

// Quadrupod: thumb, index, middle AND ring finger on the pencil; only
// the little finger is curled away.
function Quadrupod() {
  return (
    <>
      <Sleeve d="M 136 84 L 160 86 L 160 132 L 134 130 Q 128 108 136 84 Z" />
      <Finger far nail={0} pts={[[110, 120], [104, 132], [96, 134]]} w={[9, 8, 7]} />
      {/* ring finger reaches the pencil under the middle finger */}
      <Finger far nail={-1} pts={[[106, 114], [92, 124], [76, 130], [60, 128]]} w={[9.5, 9, 8.2, 7.4]} />
      <Finger far nail={-1} pts={[[102, 104], [88, 111], [74, 116], [62, 118]]} w={[10, 9.5, 8.6, 7.8]} />
      <HandBody
        d="M 92 97 C 98 86 116 82 138 86 L 138 128 C 128 134 116 136 106 132 C 100 128 96 124 94 120 C 98 112 98 104 92 97 Z"
        shade="M 100 128 C 112 134 128 132 138 126 L 138 132 L 104 134 Z" />
      <Pencil tip={[40, 138]} end={[128, 32]} />
      <Finger nail={1} pts={[[98, 96], [83, 90], [71, 98], [63, 106]]} w={[10.5, 10, 9, 8.2]} />
      <Finger nail={1} pts={[[100, 122], [88, 119], [76, 116], [67, 110]]} w={[12.5, 11.5, 10.5, 9.4]} />
    </>
  );
}

// Digital pronate: palm faces DOWN with the back of the hand on top; the
// fingers wrap down over the pencil, the index stretched along it toward
// the tip, and the end of the pencil sits in the palm. The whole forearm
// moves to draw.
function DigitalPronate() {
  return (
    <>
      <Sleeve d="M 138 70 L 160 72 L 160 110 L 136 108 Q 132 90 138 70 Z" />
      <Finger far nail={0} pts={[[118, 102], [116, 114], [110, 119]]} w={[9, 8, 7]} />
      <Finger far nail={0} pts={[[110, 104], [106, 116], [98, 121]]} w={[9.5, 8.5, 7.5]} />
      <Pencil tip={[40, 138]} end={[132, 83]} />
      <HandBody
        d="M 76 100 C 80 80 104 70 130 72 L 140 72 L 140 108 L 130 108 C 116 110 100 112 90 112 C 84 110 78 106 76 100 Z"
        shade="M 82 108 C 100 112 124 110 140 104 L 140 110 L 86 114 Z" />
      {/* middle finger curls over the front of the pencil */}
      <Finger nail={0} pts={[[98, 104], [92, 116], [82, 122], [76, 118]]} w={[10, 9.5, 8.6, 7.8]} />
      {/* index stretched down along the top of the pencil */}
      <Finger nail={1} pts={[[86, 100], [72, 108], [60, 116], [50, 124]]} w={[10.5, 10, 9, 8.2]} />
      {/* thumb presses the pencil from below on the near side */}
      <Finger nail={0} pts={[[102, 112], [90, 120], [80, 125]]} w={[12, 11, 10]} />
    </>
  );
}

// Palmar (fisted) grasp: the pencil is held in a closed fist like a
// dagger, the tip coming out the LITTLE-FINGER side down to the paper and
// the thumb wrapped over the curled fingers. The whole arm moves from the
// shoulder.
function Palmar() {
  return (
    <>
      <Sleeve d="M 136 54 L 160 56 L 160 106 L 134 104 Q 130 80 136 54 Z" />
      <Pencil tip={[70, 138]} end={[84, 26]} w={8.5} />
      <HandBody
        d="M 84 52 C 100 46 122 50 138 56 L 138 104 C 120 112 100 112 88 106 C 82 92 80 66 84 52 Z"
        shade="M 88 100 C 104 108 124 106 138 100 L 138 106 L 90 108 Z" />
      {/* four curled fingers, nails tucked toward the palm */}
      <Finger nail={0} pts={[[104, 60], [88, 58], [79, 63], [82, 71]]} w={[10.5, 10, 9.2, 8.4]} />
      <Finger nail={0} pts={[[104, 73], [87, 72], [78, 77], [81, 85]]} w={[10.5, 10, 9.2, 8.4]} />
      <Finger nail={0} pts={[[104, 86], [88, 86], [80, 91], [83, 98]]} w={[10, 9.5, 8.8, 8]} />
      <Finger nail={0} pts={[[102, 98], [90, 99], [84, 103], [86, 109]]} w={[9, 8.5, 8, 7.2]} />
      {/* thumb wrapped across the top of the fist */}
      <Finger nail={1} pts={[[116, 66], [104, 54], [90, 50], [80, 54]]} w={[12.5, 11.5, 10.5, 9.4]} />
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

export default function GraspHand({ grip, size = 72, background = '#FBF6EE' }: { grip: GripKey; size?: number; background?: string }) {
  const Grip = GRIPS[grip] ?? DynamicTripod;
  return (
    <svg viewBox="28 22 132 132" width={size} height={size} role="img"
      aria-label={`${grip.replace(/_/g, ' ')} pencil grip`} style={{ display: 'block', borderRadius: 12, background, overflow: 'hidden' }}>
      <defs>
        <filter id="gh-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <Paper />
      <Grip />
    </svg>
  );
}
