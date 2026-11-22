'use client';

// ── The Space Outpost ──
// A painted, living backdrop for Cargo Count: a deep violet sky with
// slow, soft stars (no blinking: nothing may look like a cargo pod), a
// ringed planet that turns, a far comet drifting by, and the grey-blue
// moon ground with craters and the outpost's glass dome, its window
// lights breathing. Kept low in contrast during play so the pods are
// what stands out. Decoration only: it never catches taps.

import { useId, type CSSProperties } from 'react';
import { seeded } from '@/components/friends/kit/Stage';

export default function SpaceScene() {
  const id = useId().replace(/:/g, '');
  const g = (n: string) => `${n}-${id}`;
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120B33" />
            <stop offset="0.6" stopColor="#24195A" />
            <stop offset="1" stopColor="#3A2D74" />
          </linearGradient>
          <radialGradient id={g('neb')} cx="0.7" cy="0.25" r="0.5">
            <stop offset="0" stopColor="#7C5CD6" stopOpacity="0.35" />
            <stop offset="1" stopColor="#7C5CD6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={g('neb2')} cx="0.15" cy="0.55" r="0.45">
            <stop offset="0" stopColor="#2FB5C8" stopOpacity="0.18" />
            <stop offset="1" stopColor="#2FB5C8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={g('planet')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F5B38A" />
            <stop offset="1" stopColor="#C2648E" />
          </linearGradient>
          <radialGradient id={g('dome')} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#CFF4FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#6FB7D9" stopOpacity="0.25" />
          </radialGradient>
        </defs>
        <rect width="100" height="133" fill={`url(#${g('sky')})`} />
        <rect width="100" height="133" fill={`url(#${g('neb')})`} />
        <rect width="100" height="133" fill={`url(#${g('neb2')})`} />
        {/* soft, still stars */}
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={seeded(i, 41) * 100} cy={seeded(i, 42) * 86} r={0.18 + seeded(i, 43) * 0.32} fill="#E6E0FF" opacity={0.25 + seeded(i, 44) * 0.3} />
        ))}
        <g filter="url(#kp-brush)">
          {/* the ringed planet, turning slowly */}
          <g transform="translate(16 18)">
            <ellipse cx="0" cy="0" rx="15" ry="4" fill="none" stroke="#F9D9A8" strokeWidth="1.4" opacity="0.55" transform="rotate(-16)" />
            <circle cx="0" cy="0" r="8.5" fill={`url(#${g('planet')})`} stroke={sk} strokeWidth="0.5" />
            <g className="cc-spin" style={{ transformOrigin: '0px 0px', transformBox: 'view-box' } as CSSProperties}>
              <path d="M-8 -2 Q0 -4 8 -2" stroke="#E38B7A" strokeWidth="1.2" fill="none" opacity="0.7" />
              <path d="M-8 2.5 Q0 1 8 3" stroke="#B7577F" strokeWidth="1" fill="none" opacity="0.6" />
            </g>
            <circle cx="-3" cy="-3.5" r="1.6" fill="#FFFFFF" opacity="0.35" />
            <path d="M-15 0 A15 4 0 0 0 15 0" fill="none" stroke="#F9D9A8" strokeWidth="1.4" opacity="0.9" transform="rotate(-16)" />
          </g>
          {/* a little moon far off */}
          <circle cx="86" cy="12" r="3" fill="#B9B3E3" stroke={sk} strokeWidth="0.35" />
          <circle cx="85" cy="11.3" r="0.7" fill="#9C95CC" />
        </g>
        {/* far comet drifting across */}
        <g className="cc-comet">
          <path d="M0 0 L-10 3" stroke="#BDEBFF" strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />
          <circle cx="0" cy="0" r="0.8" fill="#FFFFFF" opacity="0.8" />
        </g>
        <g filter="url(#kp-brush)">
          {/* far moon hills */}
          <path d="M0 98 Q14 90 28 95 T58 92 T100 94 V133 H0z" fill="#3C3F7A" />
          {/* the outpost dome with breathing window lights */}
          <g transform="translate(46 96)">
            <rect x="-11" y="-1" width="22" height="3" rx="1" fill="#6A6FA8" stroke={sk} strokeWidth="0.4" />
            <path d="M-10 -1 A10 9 0 0 1 10 -1z" fill={`url(#${g('dome')})`} stroke={sk} strokeWidth="0.5" />
            <path d="M-6 -5 Q-3 -8 1 -8.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" opacity="0.6" strokeLinecap="round" />
            {[-6, -2, 2, 6].map((x, i) => (
              <rect key={i} x={x - 0.9} y="-0.4" width="1.8" height="1.4" rx="0.3" fill="#FFE38A" className="fg-glow" style={{ animationDelay: `${-i * 0.7}s` }} />
            ))}
            <path d="M8 -4 L8 -10 M8 -10 L10.5 -10" stroke={sk} strokeWidth="0.45" />
            <circle cx="10.6" cy="-10" r="0.8" fill="#FF8FA3" className="fg-glow" />
          </g>
          {/* near moon ground */}
          <path d="M0 108 Q22 102 48 106 T100 104 V133 H0z" fill="#5B5F9E" stroke={sk} strokeWidth="0.5" />
          <path d="M0 120 Q30 115 60 119 T100 117 V133 H0z" fill="#4C5090" />
          {/* craters */}
          {[[12, 112, 4], [62, 111, 2.6], [30, 125, 3.4], [88, 124, 2.4]].map(([x, y, r], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.36} fill="#40447F" stroke={sk} strokeWidth="0.35" />
              <path d={`M${x - r * 0.8} ${y - r * 0.05} Q${x} ${y + r * 0.32} ${x + r * 0.8} ${y - r * 0.05}`} stroke="#7E83C2" strokeWidth="0.4" fill="none" />
            </g>
          ))}
          {/* little glowing moon pebbles */}
          {[[22, 116], [52, 114], [74, 122], [6, 126]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.8" fill="#9EF0E3" className="fg-glow" style={{ animationDelay: `${-i * 0.8}s` }} />
          ))}
        </g>
      </svg>
      {/* slow space dust drifting past */}
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${4 + seeded(i, 50) * 92}%`, bottom: `${30 + seeded(i, 51) * 40}%`, width: 3, height: 3,
          background: 'rgba(214,206,255,0.45)',
          animationDuration: `${10 + seeded(i, 52) * 8}s`, animationDelay: `${-seeded(i, 53) * 12}s`,
          ['--rise' as string]: `${60 + seeded(i, 54) * 60}px`, ['--sway' as string]: `${(seeded(i, 55) - 0.5) * 60}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}
