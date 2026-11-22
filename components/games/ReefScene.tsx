'use client';

// ── The Coral Reef ──
// A painted, living backdrop for Reef Explorer: deep blue water with
// slow shimmering light rays, swaying kelp, painted corals (branch,
// brain and fan), a sandy floor with shells, and bubbles rising. Quiet
// colors: the sea friends are what stand out once the flashlight finds
// them. Decoration only: it never catches taps.

import { useId, type CSSProperties } from 'react';
import { seeded } from '@/components/friends/kit/Stage';

function Kelp({ x, h, i, color }: { x: number; h: number; i: number; color: string }) {
  return (
    <g className="fg-sway" style={{ transformOrigin: `${x}px 133px`, transformBox: 'view-box', animationDuration: `${4 + seeded(i, 61) * 3}s`, animationDelay: `${-seeded(i, 62) * 5}s` } as CSSProperties}>
      <path d={`M${x} 133 Q${x - 4} ${133 - h * 0.35} ${x + 1} ${133 - h * 0.6} T${x - 1} ${133 - h}`} stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {[0.3, 0.55, 0.8].map((t, k) => (
        <ellipse key={k} cx={x + (k % 2 ? 2.4 : -2.4)} cy={133 - h * t} rx="2.6" ry="1.1" fill={color} transform={`rotate(${k % 2 ? -30 : 30} ${x} ${133 - h * t})`} />
      ))}
    </g>
  );
}

export default function ReefScene() {
  const id = useId().replace(/:/g, '');
  const g = (n: string) => `${n}-${id}`;
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g('sea')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B6C9A" />
            <stop offset="0.5" stopColor="#0F4C75" />
            <stop offset="1" stopColor="#0A3557" />
          </linearGradient>
          <linearGradient id={g('ray')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#CFF6FF" stopOpacity="0.35" />
            <stop offset="1" stopColor="#CFF6FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={g('sand')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D9C08F" />
            <stop offset="1" stopColor="#B99A66" />
          </linearGradient>
        </defs>
        <rect width="100" height="133" fill={`url(#${g('sea')})`} />
        {/* light rays from the surface, shimmering slowly */}
        {[12, 34, 58, 80].map((x, i) => (
          <path key={i} className="rf-ray" d={`M${x - 4} 0 L${x + 4} 0 L${x + 16} 100 L${x - 2} 100z`} fill={`url(#${g('ray')})`} style={{ animationDelay: `${-i * 1.7}s` }} />
        ))}
        {/* far reef silhouette */}
        <path d="M0 100 Q10 92 18 97 Q26 88 36 95 Q48 90 58 96 Q70 88 80 95 Q90 91 100 96 V133 H0z" fill="#0D4166" opacity="0.8" />
        {/* kelp */}
        {[6, 27, 70, 93].map((x, i) => <Kelp key={i} x={x} h={34 + seeded(i, 63) * 18} i={i} color={i % 2 ? '#2F8F6B' : '#3FA37A'} />)}
        <g filter="url(#kp-brush)">
          {/* sand */}
          <path d="M0 114 Q25 108 50 112 T100 110 V133 H0z" fill={`url(#${g('sand')})`} stroke={sk} strokeWidth="0.5" />
          {/* branch coral */}
          <g transform="translate(14 114)">
            <path d="M0 0 L0 -10 M0 -6 L-5 -12 M0 -8 L5 -15 M-5 -12 L-6 -16 M5 -15 L8 -18" stroke="#F27D8F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </g>
          {/* brain coral */}
          <g transform="translate(40 113)">
            <path d="M-8 0 A8 6 0 0 1 8 0z" fill="#E9A06B" stroke={sk} strokeWidth="0.5" />
            <path d="M-5 -1 q2 -3 4 0 q2 -3 4 0 M-6 -3 q3 -2 6 0" stroke="#B9703E" strokeWidth="0.6" fill="none" />
          </g>
          {/* fan coral */}
          <g transform="translate(84 111)">
            <path d="M0 0 L-8 -14 Q0 -20 8 -14z" fill="#B57BE0" stroke={sk} strokeWidth="0.5" opacity="0.9" />
            <path d="M0 0 L-5 -14 M0 0 L0 -17 M0 0 L5 -14" stroke="#7E4BB3" strokeWidth="0.5" />
          </g>
          {/* tube coral */}
          <g transform="translate(62 114)">
            {[-3, 0, 3].map((x, i) => <rect key={i} x={x - 1.1} y={-6 - i * 2} width="2.2" height={6 + i * 2} rx="1" fill="#F6C453" stroke={sk} strokeWidth="0.4" />)}
          </g>
          {/* shells and pebbles */}
          {[[24, 122], [52, 126], [76, 121], [92, 128]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x - 2} ${y} Q${x} ${y - 3} ${x + 2} ${y}z`} fill="#F7E3D0" stroke={sk} strokeWidth="0.35" />
              <circle cx={x + 5} cy={y + 2} r="0.8" fill="#A88A5C" />
            </g>
          ))}
        </g>
      </svg>
      {/* bubbles rising */}
      {Array.from({ length: 10 }, (_, i) => {
        const s = 4 + seeded(i, 70) * 6;
        return (
          <span key={i} className="fg-rise absolute rounded-full" style={{
            left: `${4 + seeded(i, 71) * 92}%`, bottom: `${6 + seeded(i, 72) * 30}%`, width: s, height: s,
            border: '1.5px solid rgba(220,250,255,0.6)', background: 'rgba(220,250,255,0.12)',
            animationDuration: `${6 + seeded(i, 73) * 6}s`, animationDelay: `${-seeded(i, 74) * 10}s`,
            ['--rise' as string]: `${140 + seeded(i, 75) * 160}px`, ['--sway' as string]: `${(seeded(i, 76) - 0.5) * 30}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}
