// ── Printable worksheet renderer ──
// Turns a Worksheet's content descriptor into an actual full-page SVG a
// parent can print and a child can trace with a real pencil. Kept as
// plain, print-friendly shapes — no photos, no network calls, nothing
// that isn't already in lib/worksheets.ts.

import type { Worksheet } from '@/lib/worksheets';

const PAGE_W = 800;
const PAGE_H = 1035; // roughly US-letter proportions

const INK = '#94a3b8';   // light guide-line gray — trace over this
const INK_DARK = '#334155';

function TracingRow({ shape, y, w }: { shape: string; y: number; w: number }) {
  const cx = w / 2;
  const common = { fill: 'none' as const, stroke: INK, strokeWidth: 5, strokeDasharray: '10 10', strokeLinecap: 'round' as const };
  switch (shape) {
    case 'line-h':
      return <line x1={60} y1={y} x2={w - 60} y2={y} {...common} />;
    case 'line-v':
      return <line x1={cx} y1={y - 55} x2={cx} y2={y + 55} {...common} />;
    case 'circle':
      return <circle cx={cx} cy={y} r={55} {...common} />;
    case 'square':
      return <rect x={cx - 55} y={y - 55} width={110} height={110} rx={4} {...common} />;
    case 'triangle':
      return <polygon points={`${cx},${y - 60} ${cx - 60},${y + 45} ${cx + 60},${y + 45}`} {...common} />;
    case 'wave':
      return <path d={`M ${cx - 140} ${y} Q ${cx - 70} ${y - 55} ${cx} ${y} Q ${cx + 70} ${y + 55} ${cx + 140} ${y}`} {...common} />;
    case 'zigzag':
      return <polyline points={`${cx - 140},${y + 40} ${cx - 70},${y - 40} ${cx},${y + 40} ${cx + 70},${y - 40} ${cx + 140},${y + 40}`} {...common} />;
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 60 : 26;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${y + r * Math.sin(a)}`;
      }).join(' ');
      return <polygon points={pts} {...common} />;
    }
    case 'spiral': {
      let d = `M ${cx} ${y}`;
      const turns = 3;
      const steps = 60;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const r = t * 62;
        const a = t * turns * Math.PI * 2;
        d += ` L ${cx + r * Math.cos(a)} ${y + r * Math.sin(a)}`;
      }
      return <path d={d} {...common} />;
    }
    case 'figure8':
      return <path d={`M ${cx} ${y} C ${cx - 70} ${y - 60}, ${cx - 70} ${y + 60}, ${cx} ${y} C ${cx + 70} ${y - 60}, ${cx + 70} ${y + 60}, ${cx} ${y}`} {...common} />;
    default:
      return null;
  }
}

function TracingContent({ shape, reps }: { shape: string; reps: number }) {
  const rowH = (PAGE_H - 260) / reps;
  return (
    <>
      {Array.from({ length: reps }, (_, i) => (
        <TracingRow key={i} shape={shape} y={220 + rowH * i + rowH / 2} w={PAGE_W} />
      ))}
    </>
  );
}

function LettersContent({ chars }: { chars: string[] }) {
  const perRow = chars[0]?.length > 1 ? 2 : 4; // whole words get more room per row
  const rows = Math.ceil(chars.length / perRow);
  const rowH = (PAGE_H - 260) / rows;
  const colW = PAGE_W / perRow;
  return (
    <>
      {chars.map((ch, i) => {
        const row = Math.floor(i / perRow), col = i % perRow;
        const x = colW * col + colW / 2;
        const y = 220 + rowH * row + rowH * 0.62;
        return (
          <text key={i} x={x} y={y} textAnchor="middle"
            style={{ fontSize: ch.length > 1 ? 64 : 130, fontWeight: 800, fill: 'none', stroke: INK, strokeWidth: 2.5, fontFamily: 'var(--font-baloo), sans-serif' }}>
            {ch}
          </text>
        );
      })}
    </>
  );
}

function mazePath(complexity: 'simple' | 'medium' | 'complex'): { d: string; points: { x: number; y: number }[] } {
  const turnsByComplexity = { simple: 2, medium: 4, complex: 7 };
  const n = turnsByComplexity[complexity];
  const points = [{ x: 70, y: 220 }];
  let x = 70, y = 220;
  const stepY = (PAGE_H - 300) / (n + 1);
  for (let i = 0; i < n; i++) {
    x = x < PAGE_W / 2 ? PAGE_W - 130 : 70;
    points.push({ x, y });
    y += stepY;
    points.push({ x, y });
  }
  points.push({ x: x < PAGE_W / 2 ? PAGE_W - 130 : 70, y });
  const last = points[points.length - 1];
  points.push({ x: last.x, y: PAGE_H - 80 });
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return { d, points };
}

function MazeContent({ complexity }: { complexity: 'simple' | 'medium' | 'complex' }) {
  const { d, points } = mazePath(complexity);
  const start = points[0], end = points[points.length - 1];
  return (
    <>
      <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={70} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 10" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={start.x} cy={start.y} r={22} fill="#10B981" />
      <text x={start.x} y={start.y + 6} textAnchor="middle" style={{ fontSize: 16, fontWeight: 800, fill: 'white' }}>GO</text>
      <circle cx={end.x} cy={end.y} r={22} fill="#EC4899" />
      <text x={end.x} y={end.y + 6} textAnchor="middle" style={{ fontSize: 14, fontWeight: 800, fill: 'white' }}>END</text>
    </>
  );
}

function CardContent({ items }: { items: string[] }) {
  const rowH = (PAGE_H - 260) / items.length;
  return (
    <>
      {items.map((item, i) => {
        const y = 240 + rowH * i;
        return (
          <g key={i}>
            <rect x={60} y={y} width={40} height={40} rx={8} fill="none" stroke={INK_DARK} strokeWidth={3} />
            <text x={125} y={y + 29} style={{ fontSize: 26, fontWeight: 700, fill: INK_DARK, fontFamily: 'var(--font-baloo), sans-serif' }}>
              {item}
            </text>
          </g>
        );
      })}
    </>
  );
}

export default function WorksheetSheet({ worksheet }: { worksheet: Worksheet }) {
  const c = worksheet.content;
  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} width="100%" style={{ maxWidth: 700, background: 'white' }} xmlns="http://www.w3.org/2000/svg">
      <rect x={0} y={0} width={PAGE_W} height={PAGE_H} fill="white" />
      <text x={PAGE_W / 2} y={70} textAnchor="middle" style={{ fontSize: 44, fontWeight: 800, fill: '#1e1b4b', fontFamily: 'var(--font-baloo), sans-serif' }}>
        {worksheet.emoji} {worksheet.title}
      </text>
      <text x={PAGE_W / 2} y={115} textAnchor="middle" style={{ fontSize: 22, fontWeight: 600, fill: '#6d28d9', fontFamily: 'var(--font-baloo), sans-serif' }}>
        🐼 Noel says: {worksheet.noelTip}
      </text>
      <line x1={50} y1={150} x2={PAGE_W - 50} y2={150} stroke="#e2e8f0" strokeWidth={2} />

      {c.kind === 'tracing' && <TracingContent shape={c.shape} reps={c.reps} />}
      {c.kind === 'letters' && <LettersContent chars={c.chars} />}
      {c.kind === 'maze' && <MazeContent complexity={c.complexity} />}
      {c.kind === 'card' && <CardContent items={c.items} />}

      <text x={PAGE_W / 2} y={PAGE_H - 25} textAnchor="middle" style={{ fontSize: 16, fill: '#94a3b8', fontFamily: 'var(--font-baloo), sans-serif' }}>
        Kailia&apos;s Story — printed for home use
      </text>
    </svg>
  );
}
