// ── Things the friends want (painted, 20 × 20) ──
// Shared by every game that hands things out or asks for them: Dragon
// Bridge's sharing rounds, Snack Quest's snacks, patterns of things.
// The list itself lives in lib/things.ts.

import type { Thing } from '@/lib/things';

const SK = '#3b2416';

// Everything the friends can want, drawn in the painted style on a
// 20 × 20 box: small, bold shapes that read at a glance on a phone.
export function ThingShape({ k }: { k: Thing }) {
  switch (k) {
    case 'apple': return (<g>
      <path d="M10 6 Q4 3 2.6 9 Q2 15 6 18 Q8 19.2 10 18 Q12 19.2 14 18 Q18 15 17.4 9 Q16 3 10 6z" fill="#EF4444" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 6 Q10.4 3.5 11.6 2" stroke={SK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M11.4 3.6 Q14.6 1.6 16 3.8 Q13.4 5.4 11.4 3.6z" fill="#22C55E" stroke={SK} strokeWidth="1" />
      <ellipse cx="6.4" cy="9.4" rx="1.6" ry="2.4" fill="#FFFFFF" opacity="0.6" /></g>);
    case 'ball': return (<g>
      <circle cx="10" cy="10.5" r="8.2" fill="#3B82F6" stroke={SK} strokeWidth="1.5" />
      <path d="M2.2 9 Q10 13 17.8 9 L17.6 12.4 Q10 16.4 2.4 12.4z" fill="#FDE047" stroke={SK} strokeWidth="1" />
      <path d="M10 2.3 Q6.4 10 10 18.7" stroke="#EF4444" strokeWidth="2" fill="none" />
      <circle cx="6.6" cy="6.6" r="1.8" fill="#FFFFFF" opacity="0.7" /></g>);
    case 'carrot': return (<g>
      <path d="M6 7 L14 7 L10.6 19 Q10 19.8 9.4 19z" fill="#F97316" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.4 10.5 H9.6 M8.4 13.5 H10.4" stroke="#C2410C" strokeWidth="1" />
      <path d="M10 7 L7 1.6 M10 7 L10 1 M10 7 L13 1.6" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" /></g>);
    case 'acorn': return (<g>
      <path d="M4.6 9 Q4.4 16 10 19 Q15.6 16 15.4 9z" fill="#D9A066" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 9.4 Q3 4.4 10 4.2 Q17 4.4 17 9.4z" fill="#8A5A32" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.6 6.6 L14.4 6.6" stroke="#5B3A1E" strokeWidth="0.9" />
      <path d="M10 4.2 L10.6 1.6" stroke={SK} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="7.4" cy="12.4" rx="1.1" ry="2" fill="#FFFFFF" opacity="0.5" /></g>);
    case 'cookie': return (<g>
      <circle cx="10" cy="10.5" r="8.4" fill="#E9B872" stroke={SK} strokeWidth="1.5" />
      {[[7, 7.6], [12.6, 8.4], [9, 13.4], [13.4, 13], [5.8, 11.6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="#5B3A1E" />)}</g>);
    case 'flower': return (<g>
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="10" cy="5.4" rx="3.4" ry="4.4" fill="#F472B6" stroke={SK} strokeWidth="1.2" transform={`rotate(${a} 10 10.5)`} />
      ))}
      <circle cx="10" cy="10.5" r="3" fill="#FDE047" stroke={SK} strokeWidth="1.2" /></g>);
    case 'coin': return (<g>
      <circle cx="10" cy="10.5" r="8.2" fill="#FACC15" stroke={SK} strokeWidth="1.5" />
      <circle cx="10" cy="10.5" r="5.4" fill="none" stroke="#CA8A04" strokeWidth="1.2" />
      <path d="M10 7 L11 9.6 L13.6 9.8 L11.6 11.4 L12.3 14 L10 12.6 L7.7 14 L8.4 11.4 L6.4 9.8 L9 9.6z" fill="#FEF08A" stroke="#A16207" strokeWidth="0.6" />
      <path d="M4.6 7.4 Q6 4.6 9 3.8" stroke="#FFFFFF" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8" /></g>);
    case 'shell': return (<g>
      <path d="M10 18.6 L2 9.6 Q3 2.4 10 2.2 Q17 2.4 18 9.6z" fill="#FBCFE8" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 18.6 L5.4 4.4 M10 18.6 L10 2.4 M10 18.6 L14.6 4.4 M10 18.6 L2.8 8 M10 18.6 L17.2 8" stroke="#EC4899" strokeWidth="0.9" fill="none" />
      <path d="M7.6 17 H12.4 L10 19.4z" fill="#F9A8D4" stroke={SK} strokeWidth="1" /></g>);
    case 'leaf': return (<g>
      <path d="M3 17 Q2 6 16.6 2.6 Q19 14 6 17.6z" fill="#4ADE80" stroke={SK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 17.6 Q9 10 15 4.6 M7.4 12.4 L7 9 M10 9.8 L12.4 10.8" stroke="#15803D" strokeWidth="1.1" fill="none" strokeLinecap="round" /></g>);
    default: return (<g>
      <circle cx="10" cy="11" r="8" fill="#6366F1" stroke={SK} strokeWidth="1.6" />
      <path d="M7 3.5 L10 6 L13 3.5" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="9" r="2.2" fill="#FFFFFF" opacity="0.7" /></g>);
  }
}

export function ThingIcon({ k, size }: { k: Thing; size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 2px #FFFFFF)' }}>
      <ThingShape k={k} />
    </svg>
  );
}

