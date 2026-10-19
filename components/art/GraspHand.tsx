// ── Grasp-pattern hands ──
// Friendly cartoon line drawings of Kailia's right hand holding a pencil
// in each of the five pencil grips the parent quick-check asks about
// (palmar, digital pronate, quadrupod, static/immature tripod, dynamic
// tripod). Poses follow the classic OT figures (e.g. Dennis & Swinth
// 2001, Fig. 1) seen from the writer's own angle, redrawn from scratch
// in a soft cartoon style: clean dark outline, flat skin colour, a nail
// on the thumb so it reads as a thumb, and Kailia's purple cuff.
//
// Fingers are a centre line through the joints plus a width at each
// joint (the outline is generated), so a pose is adjusted by moving a
// joint; the hand and thumb are one hand-drawn outline per grip.

import { useId, type ReactNode } from 'react';

export type GripKey = 'palmar' | 'digital_pronate' | 'quadrupod' | 'immature_tripod' | 'dynamic_tripod';

const LINE = '#4a3128';
const SKIN = '#FFE0C9';
const SKIN_FAR = '#F6C9AB';   // fingers on the far side of the pencil
const SHADE = '#C98466';

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

// Picture-book chubbiness: fingers are drawn this much wider than an
// adult-proportioned hand so they read as a little kid's soft hand.
const CHUBBY = 1;

// One finger or thumb, picture-book style: flat skin, one soft shadow
// band on the underside, a small shine on top, a clean outline. No nails
// or creases (those details are what made earlier versions look creepy).
// A near finger's knuckle is covered by a skin patch so it grows out of
// the hand instead of looking stuck on.
function Finger({ pts, w, far = false }: { pts: P[]; w: number[]; far?: boolean; nail?: -1 | 0 | 1 }) {
  const id = useId().replace(/:/g, '');
  const ww = w.map(v => v * CHUBBY);
  const g = fingerGeometry(pts, ww);
  const tipW = ww[ww.length - 1];
  return (
    <g>
      <defs><clipPath id={`c${id}`}><path d={g.d} /></clipPath></defs>
      <path d={g.d} fill={far ? SKIN_FAR : SKIN} />
      <g clipPath={`url(#c${id})`}>
        <path d={poly(g.down)} fill="none" stroke={far ? SHADE : SKIN_FAR} strokeWidth={tipW * 0.55} opacity={far ? 0.45 : 0.9} />
        {!far && <path d={poly(g.up.slice(-12, -3))} fill="none" stroke="#fff" strokeWidth={tipW * 0.16} strokeLinecap="round"
          opacity="0.6" transform={`translate(${(g.s[g.s.length - 1].p[0] - g.up[g.up.length - 1][0]) * 0.35} ${(g.s[g.s.length - 1].p[1] - g.up[g.up.length - 1][1]) * 0.35})`} />}
      </g>
      <path d={g.d} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      {!far && <circle cx={pts[0][0]} cy={pts[0][1]} r={ww[0] * 0.62} fill={SKIN} />}
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

// ─── The five grips ──────────────────────────────────────────────────────
// Seen from the writer's own angle (looking down at the back of the
// right hand, pencil nearly upright, tip at the bottom), the way OT
// handouts show grips, so where each finger sits on the pencil is plain.
// The thumb is part of the hand's outline (a wide base that tapers to a
// rounded pad with a nail), never a separate tube.

const L = { stroke: LINE, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Nail({ cx, cy, rot }: { cx: number; cy: number; rot: number }) {
  return <ellipse cx={cx} cy={cy} rx="4.2" ry="3" transform={`rotate(${rot} ${cx} ${cy})`} fill="#FFF3EA" stroke={LINE} strokeWidth="1.2" />;
}

function Cuff({ y, h }: { y: number; h: number }) {
  return (
    <g>
      <rect x="104" y={y} width="20" height={h} rx="4" fill="#FFFFFF" {...L} />
      <rect x="104" y={y} width="7" height={h} rx="3" fill="#8B5CF6" {...L} />
    </g>
  );
}

// Knuckle bumps and a crease or two on the back of the hand.
function Knuckles({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={LINE} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />;
}

// The back of the hand with the thumb growing out of it toward the pencil,
// leaving an open "O" between thumb and index.
const TRIPOD_HAND_OPEN =
  'M 108 44 C 98 40 90 43 84 50 C 82 55 80 59 77 62 C 69 67 58 73 47 76 C 39 77 35 83 38 88 ' +
  'C 41 93 52 92 62 90 C 70 89 74 92 78 96 C 90 100 100 98 108 94 Z';

function DynamicTripod() {
  return (
    <>
      {/* ring and little finger curled under the palm */}
      <Finger far pts={[[94, 98], [86, 104], [80, 103]]} w={[10, 9, 8]} />
      <Finger far pts={[[86, 98], [76, 105], [68, 104]]} w={[10.5, 9.5, 8.5]} />
      {/* middle finger: the pencil rests on its side */}
      <Finger far pts={[[80, 92], [66, 100], [55, 98]]} w={[11, 10, 9]} />
      <Pencil tip={[46, 112]} end={[60, 6]} />
      <path d={TRIPOD_HAND_OPEN} fill={SKIN} {...L} />
      <Nail cx={41} cy={81} rot={-20} />
      <Knuckles d="M 92 47 q 3 -2 6 0 M 99 46 q 3 -2 6 0 M 60 86 q 3 2 6 1" />
      {/* index finger arches over and its pad sits on the pencil */}
      <Finger pts={[[86, 54], [73, 48], [62, 55], [55, 69]]} w={[12, 11, 10, 9.4]} />
      <Cuff y={40} h={58} />
    </>
  );
}

function Quadrupod() {
  return (
    <>
      <Finger far pts={[[94, 98], [86, 104], [80, 103]]} w={[10, 9, 8]} />
      {/* ring finger also reaches the pencil, under the middle finger */}
      <Finger far pts={[[88, 100], [70, 108], [54, 106]]} w={[10.5, 9.5, 8.5]} />
      <Finger far pts={[[80, 92], [66, 99], [55, 97]]} w={[11, 10, 9]} />
      <Pencil tip={[46, 112]} end={[60, 6]} />
      <path d={TRIPOD_HAND_OPEN} fill={SKIN} {...L} />
      <Nail cx={41} cy={81} rot={-20} />
      <Knuckles d="M 92 47 q 3 -2 6 0 M 99 46 q 3 -2 6 0 M 60 86 q 3 2 6 1" />
      <Finger pts={[[86, 54], [73, 48], [62, 55], [55, 69]]} w={[12, 11, 10, 9.4]} />
      <Cuff y={40} h={60} />
    </>
  );
}

// Static / immature tripod: the thumb wraps right across the pencil and
// over the index fingertip, so there is no "O" between them.
function ImmatureTripod() {
  return (
    <>
      <Finger far pts={[[94, 98], [86, 104], [80, 103]]} w={[10, 9, 8]} />
      <Finger far pts={[[86, 98], [76, 105], [68, 104]]} w={[10.5, 9.5, 8.5]} />
      <Finger far pts={[[80, 92], [66, 100], [55, 98]]} w={[11, 10, 9]} />
      <Pencil tip={[46, 112]} end={[60, 6]} />
      <Finger pts={[[86, 54], [72, 50], [61, 56], [53, 66]]} w={[12, 11, 10, 9.4]} />
      <path
        d="M 108 44 C 98 40 90 43 84 52 C 80 57 74 60 66 62 C 56 64 44 64 36 66 C 29 68 29 77 36 79 C 46 81 58 84 66 88 C 72 91 74 93 78 96 C 90 100 100 98 108 94 Z"
        fill={SKIN} {...L} />
      <Nail cx={38} cy={70} rot={-5} />
      <Knuckles d="M 92 47 q 3 -2 6 0 M 99 46 q 3 -2 6 0 M 56 76 q 3 2 6 1" />
      <Cuff y={40} h={58} />
    </>
  );
}

// Digital pronate: palm faces DOWN; the index finger points down along
// the pencil toward the tip, the other fingers wrap it, the thumb presses
// its side.
function DigitalPronate() {
  return (
    <>
      <Finger far pts={[[96, 50], [88, 66], [82, 74]]} w={[11, 10, 9]} />
      <Finger far pts={[[88, 52], [78, 68], [70, 78]]} w={[11.5, 10.5, 9.5]} />
      <Pencil tip={[28, 112]} end={[86, 30]} />
      <path
        d="M 112 18 C 100 12 82 14 72 24 C 64 32 60 42 64 48 C 70 54 80 56 92 56 C 100 56 108 52 112 46 Z"
        fill={SKIN} {...L} />
      <Knuckles d="M 76 44 q 3 -2 6 0 M 84 46 q 3 -2 6 0 M 92 46 q 3 -2 6 0" />
      {/* thumb on the left side of the pencil */}
      <path d="M 70 28 C 62 32 54 40 50 50 C 47 57 50 63 56 62 C 61 61 64 55 67 48 C 70 42 74 38 76 34 Z" fill={SKIN} {...L} />
      <Nail cx={52} cy={56} rot={-70} />
      {/* index stretched down along the pencil, pointing at the tip */}
      <Finger pts={[[78, 46], [64, 64], [52, 80], [42, 94]]} w={[12.5, 11.5, 10.5, 9.6]} />
      <Nail cx={45} cy={90} rot={-55} />
      <Cuff y={14} h={42} />
    </>
  );
}

// Palmar (fisted) grasp: a closed fist around the pencil like a dagger,
// the tip coming out by the little finger, the thumb across the top.
function Palmar() {
  const bump = (y: number, x0: number, h: number) => (
    <rect key={y} x={x0} y={y} width={70 - x0} height={h} rx={h / 2} fill={SKIN} {...L} />
  );
  return (
    <>
      <Pencil tip={[42, 112]} end={[48, 6]} w={8.5} />
      <path d="M 108 34 C 96 28 78 27 64 32 L 62 96 C 76 100 96 98 108 92 Z" fill={SKIN} {...L} />
      {bump(40, 30, 15)}
      {bump(54, 28, 15)}
      {bump(68, 29, 14)}
      {bump(81, 33, 12)}
      {/* hide the bumps' right ends inside the fist */}
      <rect x="62" y="41" width="9" height="51" fill={SKIN} />
      {/* thumb wrapped across the top of the fist */}
      <path d="M 82 30 C 72 26 56 26 42 30 C 34 32 32 41 39 44 C 48 47 62 44 74 42 C 80 41 84 36 82 30 Z" fill={SKIN} {...L} />
      <Nail cx={41} cy={37} rot={-8} />
      <Knuckles d="M 86 50 q 3 2 6 0 M 86 64 q 3 2 6 0" />
      <Cuff y={30} h={66} />
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
    <svg viewBox="0 0 120 120" width={size} height={size} role="img"
      aria-label={`${grip.replace(/_/g, ' ')} pencil grip`} style={{ display: 'block', borderRadius: 12, background, overflow: 'hidden' }}>
      <Grip />
    </svg>
  );
}
