// ── Tracing shapes ──
// The glowing-trail shapes used by Firefly Trails and by the care pet's
// Feed task. Points are 0–1 across and down a square box, in drawing
// order, so a tracer can check how far a finger strays from the path.

export type ShapeKind = 'line' | 'circle' | 'zigzag' | 'wave' | 'star' | 'spiral';

export function shapePoints(kind: ShapeKind, n = 64): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => pts.push({ x, y });
  if (kind === 'line') for (let i = 0; i < n; i++) push(0.1 + 0.8 * (i / (n - 1)), 0.5);
  if (kind === 'circle') for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + 2 * Math.PI * (i / (n - 1)); push(0.5 + 0.34 * Math.cos(a), 0.5 + 0.34 * Math.sin(a)); }
  if (kind === 'zigzag') { const vs = [[0.08, 0.7], [0.3, 0.3], [0.5, 0.7], [0.7, 0.3], [0.92, 0.7]]; const per = Math.floor(n / (vs.length - 1)); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'wave') for (let i = 0; i < n; i++) { const t = i / (n - 1); push(0.08 + 0.84 * t, 0.5 + 0.22 * Math.sin(t * Math.PI * 3)); }
  if (kind === 'star') { const vs: number[][] = []; for (let k = 0; k < 5; k++) { const a1 = -Math.PI / 2 + k * (2 * Math.PI / 5); const a2 = a1 + Math.PI / 5; vs.push([0.5 + 0.36 * Math.cos(a1), 0.5 + 0.36 * Math.sin(a1)]); vs.push([0.5 + 0.15 * Math.cos(a2), 0.5 + 0.15 * Math.sin(a2)]); } vs.push(vs[0]); const per = Math.max(2, Math.floor(n / (vs.length - 1))); for (let s = 0; s < vs.length - 1; s++) for (let i = 0; i < per; i++) { const t = i / per; push(vs[s][0] + (vs[s + 1][0] - vs[s][0]) * t, vs[s][1] + (vs[s + 1][1] - vs[s][1]) * t); } }
  if (kind === 'spiral') for (let i = 0; i < n; i++) { const t = i / (n - 1); const a = t * Math.PI * 4; const r = 0.06 + 0.3 * t; push(0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)); }
  return pts;
}

export const toPath = (pts: { x: number; y: number }[], scale = 100) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(p.x * scale).toFixed(1)} ${(p.y * scale).toFixed(1)}`).join(' ');
