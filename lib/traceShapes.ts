// ── Tracing shapes ──
// The glowing-trail shapes used by Firefly Trails and by the care pet's
// Feed task. Points are 0–1 across and down a square box, in drawing
// order, so a tracer can check how far a finger strays from the path.

/** The pet's food shapes (each has a food drawing in components/carepet/PetFood). */
export type FoodShapeKind = 'line' | 'circle' | 'zigzag' | 'wave' | 'star' | 'spiral';
/** Every sky picture Firefly Trails can draw. */
export type ShapeKind = FoodShapeKind | 'heart' | 'mountain' | 'triangle' | 'square' | 'loops' | 'eight';

export function shapePoints(kind: ShapeKind, n = 64): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => pts.push({ x, y });
  if (kind === 'line') for (let i = 0; i < n; i++) push(0.1 + 0.8 * (i / (n - 1)), 0.5);
  if (kind === 'circle') for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + 2 * Math.PI * (i / (n - 1)); push(0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)); }
  if (kind === 'zigzag') { const vs = [[0.08, 0.7], [0.3, 0.3], [0.5, 0.7], [0.7, 0.3], [0.92, 0.7]]; const per = Math.floor(n / (vs.length - 1)); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'wave') for (let i = 0; i < n; i++) { const t = i / (n - 1); push(0.08 + 0.84 * t, 0.5 + 0.22 * Math.sin(t * Math.PI * 3)); }
  if (kind === 'star') { const vs: number[][] = []; for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + k * (2 * Math.PI / 5); const a2 = a1 + Math.PI / 5; vs.push([0.5 + 0.36 * Math.cos(a1), 0.5 + 0.36 * Math.sin(a1)]); vs.push([0.5 + 0.15 * Math.cos(a2), 0.5 + 0.15 * Math.sin(a2)]); } vs.push(vs[0]); const per = Math.max(2, Math.floor(n / (vs.length - 1))); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'spiral') for (let i = 0; i < n; i++) { const t = i / (n - 1); const a = t * Math.PI * 4; const r = 0.06 + 0.3 * t; push(0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)); }
  // corner-to-corner outlines, walked at an even pace
  const poly = (vs: number[][]) => {
    const per = Math.max(2, Math.floor(n / (vs.length - 1)));
    for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); }
    push(vs[vs.length - 1][0], vs[vs.length - 1][1]);
  };
  if (kind === 'mountain') poly([[0.08, 0.74], [0.3, 0.3], [0.48, 0.58], [0.68, 0.22], [0.92, 0.74]]);
  if (kind === 'triangle') poly([[0.5, 0.16], [0.86, 0.8], [0.14, 0.8], [0.5, 0.16]]);
  if (kind === 'square') poly([[0.18, 0.18], [0.82, 0.18], [0.82, 0.82], [0.18, 0.82], [0.18, 0.18]]);
  if (kind === 'heart') for (let i = 0; i < n; i++) {
    const a = 2 * Math.PI * (i / (n - 1));
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    push(0.5 + x / 46, 0.47 - y / 46);
  }
  if (kind === 'loops') for (let i = 0; i < n; i++) {   // a row of three cursive loops
    const th = (i / (n - 1)) * Math.PI * 6;
    push(0.12 + 0.0403 * th - 0.11 * Math.sin(th), 0.52 - 0.16 * Math.cos(th) + 0.08);
  }
  if (kind === 'eight') for (let i = 0; i < n; i++) {   // a figure eight, like a snowman
    const a = 2 * Math.PI * (i / (n - 1));
    push(0.5 + 0.22 * Math.sin(2 * a), 0.5 - 0.34 * Math.cos(a));
  }
  return pts;
}

/**
 * The same picture, turned and/or flipped, kept inside the box: so a
 * level can trace a known shape that still looks new.
 */
export function transformPoints(pts: { x: number; y: number }[], turnDeg = 0, mirror = false): { x: number; y: number }[] {
  const a = (turnDeg * Math.PI) / 180;
  const moved = pts.map(p => {
    const x0 = (mirror ? 1 - p.x : p.x) - 0.5, y0 = p.y - 0.5;
    return { x: 0.5 + x0 * Math.cos(a) - y0 * Math.sin(a), y: 0.5 + x0 * Math.sin(a) + y0 * Math.cos(a) };
  });
  // shrink back into the box if a turn pushed a corner out
  const xs = moved.map(p => p.x), ys = moved.map(p => p.y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const k = span > 0.86 ? 0.86 / span : 1;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return moved.map(p => ({ x: 0.5 + (p.x - cx) * k, y: 0.5 + (p.y - cy) * k }));
}

export const toPath = (pts: { x: number; y: number }[], scale = 100) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * scale).toFixed(1)} ${(p.y * scale).toFixed(1)}`).join(' ');
