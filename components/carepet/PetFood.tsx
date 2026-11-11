// ── The food the child traced ──
// The traced path drawn as real food (a noodle, a cookie, spaghetti, a
// pretzel, a star cookie, a cinnamon roll), so the payoff is "you made
// this". Drawn in SVG with the warm brown outline, never emoji.

import { ShapeKind, shapePoints, toPath } from '@/lib/traceShapes';

const OUTLINE = '#3b2416';

interface Style { fill?: string; stroke: string; width: number; dots: string[]; closed?: boolean; base?: string }

const FOOD: Record<ShapeKind, Style> = {
  line:   { stroke: '#FCE7A8', width: 11, dots: ['#F4C95D'] },
  circle: { fill: '#D9A066', stroke: '#C88A4F', width: 6, dots: ['#5B3A1E'], closed: true },
  wave:   { stroke: '#FCD34D', width: 9, dots: ['#DC2626', '#16A34A'] },
  zigzag: { stroke: '#B45309', width: 10, dots: ['#FFFFFF'] },
  star:   { fill: '#FCD34D', stroke: '#E5A82E', width: 5, dots: ['#F472B6', '#60A5FA', '#FFFFFF'], closed: true },
  spiral: { stroke: '#C2410C', width: 7, dots: ['#FFF7ED'], base: '#FDBA74' },
};

export default function PetFood({ shape, size, className, style }: { shape: ShapeKind; size: number; className?: string; style?: React.CSSProperties }) {
  const f = FOOD[shape];
  const pts = shapePoints(shape, 48);
  const d = toPath(pts) + (f.closed ? ' Z' : '');
  const dots = pts.filter((_, i) => i % 5 === 2);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className} style={style}>
      <g filter="url(#kp-brush)">
        {f.base && <circle cx="50" cy="50" r="38" fill={f.base} stroke={OUTLINE} strokeWidth="2.5" />}
        {/* outline first, then the food on top, so it reads as one thick drawn piece */}
        <path d={d} fill={f.fill ? f.fill : 'none'} stroke={OUTLINE} strokeWidth={f.width + 4} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill={f.fill ?? 'none'} stroke={f.stroke} strokeWidth={f.width} strokeLinecap="round" strokeLinejoin="round" />
        {dots.map((p, i) => {
          // chips and sprinkles sit inside filled food, on the line otherwise
          const x = f.closed ? 50 + (p.x * 100 - 50) * 0.55 : p.x * 100;
          const y = f.closed ? 50 + (p.y * 100 - 50) * 0.55 : p.y * 100;
          return <circle key={i} cx={x} cy={y} r={f.closed ? 2.4 : 1.6} fill={f.dots[i % f.dots.length]} />;
        })}
      </g>
    </svg>
  );
}
