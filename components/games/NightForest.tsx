'use client';

// ── The Firefly Forest at night ──
// A painted, living backdrop for the forest games: a deep blue sky with a
// big moon and twinkling stars, three layers of trees that sway at their
// own pace (far ones slow, near ones more), drifting mist, glowing
// mushrooms that breathe light, swaying grass and tiny far-off fireflies.
// Decoration only: it never catches taps. `glow` (0–1) warms the whole
// glade as the lantern fills.

import { useId, type CSSProperties } from 'react';
import { seeded } from '@/components/friends/kit/Stage';

function Pine({ x, base, h, fill, i, sway }: { x: number; base: number; h: number; fill: string; i: number; sway: string }) {
  const w = h * 0.42;
  return (
    <g className={sway} style={{ transformOrigin: `${x}px ${base}px`, transformBox: 'view-box', animationDelay: `${-seeded(i, 7) * 6}s` } as CSSProperties}>
      <rect x={x - w * 0.07} y={base - h * 0.18} width={w * 0.14} height={h * 0.2} fill="#2a1a12" />
      <path d={`M${x} ${base - h} L${x + w * 0.38} ${base - h * 0.62} L${x + w * 0.22} ${base - h * 0.62} L${x + w * 0.5} ${base - h * 0.18} L${x - w * 0.5} ${base - h * 0.18} L${x - w * 0.22} ${base - h * 0.62} L${x - w * 0.38} ${base - h * 0.62}z`}
        fill={fill} stroke="#3b2416" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  );
}

export default function NightForest({ glow = 0 }: { glow?: number }) {
  const id = useId().replace(/:/g, '');
  const g = (n: string) => `${n}-${id}`;
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1238" />
            <stop offset="0.55" stopColor="#1C2E6B" />
            <stop offset="1" stopColor="#24557A" />
          </linearGradient>
          <radialGradient id={g('moon')}><stop offset="0.4" stopColor="#FFF4C2" stopOpacity="0.6" /><stop offset="1" stopColor="#FFF4C2" stopOpacity="0" /></radialGradient>
          <radialGradient id={g('warm')} cx="0.5" cy="0.92" r="0.7"><stop offset="0" stopColor="#FFD86B" stopOpacity="0.55" /><stop offset="1" stopColor="#FFD86B" stopOpacity="0" /></radialGradient>
          <radialGradient id={g('shroom')}><stop offset="0" stopColor="#8BF0FF" stopOpacity="0.7" /><stop offset="1" stopColor="#8BF0FF" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="133" fill={`url(#${g('sky')})`} />
        {/* stars */}
        {Array.from({ length: 30 }, (_, i) => (
          <circle key={i} cx={seeded(i, 1) * 100} cy={seeded(i, 2) * 55} r={0.25 + seeded(i, 3) * 0.5} fill="#FFFFFF" className="fg-twinkle"
            style={{ animationDelay: `${-seeded(i, 4) * 3}s`, animationDuration: `${1.6 + seeded(i, 5) * 2.4}s` }} />
        ))}
        <circle cx="78" cy="18" r="22" fill={`url(#${g('moon')})`} className="fg-glow" />
        <g filter="url(#kp-brush)">
          <circle cx="78" cy="18" r="9" fill="#FFF1B8" stroke={sk} strokeWidth="0.6" />
          <circle cx="75" cy="15.5" r="1.6" fill="#F2DC8E" /><circle cx="81" cy="21" r="1.1" fill="#F2DC8E" />
          {/* far hills and trees */}
          <path d="M0 78 Q20 66 40 74 T80 70 T100 72 V133 H0z" fill="#1A3A5E" />
          {[4, 13, 22, 33, 47, 58, 69, 80, 91].map((x, i) => (
            <Pine key={`f${i}`} x={x} base={78 - seeded(i, 8) * 4} h={18 + seeded(i, 9) * 8} fill="#1E4766" i={i} sway="nf-sway-far" />
          ))}
          {/* middle trees */}
          <path d="M0 96 Q30 86 55 93 T100 90 V133 H0z" fill="#16405A" />
          {[-2, 16, 84, 100].map((x, i) => (
            <Pine key={`m${i}`} x={x} base={97} h={34 + seeded(i, 11) * 10} fill="#1B5B5A" i={i + 20} sway="nf-sway-mid" />
          ))}
        </g>
        {/* the glade warms as the lantern fills */}
        <rect width="100" height="133" fill={`url(#${g('warm')})`} style={{ opacity: glow, transition: 'opacity 0.8s' }} />
        <g filter="url(#kp-brush)">
          {/* near ground */}
          <path d="M0 112 Q25 104 50 110 T100 107 V133 H0z" fill="#1F6B4A" stroke={sk} strokeWidth="0.5" />
          <path d="M0 122 Q30 117 60 121 T100 119 V133 H0z" fill="#185A3D" />
          {/* glowing mushrooms */}
          {[[9, 113, 1], [90, 110, 0.85], [72, 121, 0.7]].map(([x, y, s], i) => (
            <g key={`s${i}`}>
              <circle cx={x} cy={y - 3 * s} r={8 * s} fill={`url(#${g('shroom')})`} className="fg-glow" style={{ animationDelay: `${-i * 0.9}s` }} />
              <rect x={x - 0.9 * s} y={y - 3 * s} width={1.8 * s} height={3.4 * s} rx={0.6} fill="#F6EBD9" stroke={sk} strokeWidth="0.35" />
              <path d={`M${x - 3.4 * s} ${y - 2.6 * s} Q${x} ${y - 7.5 * s} ${x + 3.4 * s} ${y - 2.6 * s}z`} fill="#6FE3F2" stroke={sk} strokeWidth="0.4" />
              <circle cx={x - 1 * s} cy={y - 4.6 * s} r={0.6 * s} fill="#FFFFFF" />
            </g>
          ))}
          {/* grass tufts */}
          {[4, 18, 31, 44, 57, 66, 81, 95].map((x, i) => (
            <g key={`g${i}`} className="fg-sway" style={{ transformOrigin: `${x}px 124px`, transformBox: 'view-box', animationDelay: `${-i * 0.6}s` } as CSSProperties}>
              <path d={`M${x} 124 q-1.5 -5 -3 -6 M${x} 124 q0 -6 1 -8 M${x} 124 q1.5 -4 3.5 -5`} stroke="#3FA36A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      </svg>
      {/* drifting mist */}
      {[0, 1].map(i => (
        <div key={i} className="fg-drift absolute left-0" style={{ top: `${58 + i * 14}%`, animationDuration: `${48 + i * 20}s`, animationDelay: `${-i * 25}s`, opacity: 0.16 }}>
          <svg viewBox="0 0 200 30" width={260} aria-hidden="true">
            <g filter="url(#kp-brush)" fill="#DDEBFF"><ellipse cx="60" cy="16" rx="60" ry="9" /><ellipse cx="130" cy="13" rx="55" ry="11" /></g>
          </svg>
        </div>
      ))}
      {/* tiny far-off fireflies */}
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${4 + seeded(i, 30) * 92}%`, bottom: `${8 + seeded(i, 31) * 40}%`, width: 5, height: 5,
          background: 'radial-gradient(circle, #FFFFFF 0%, #FFF59A 45%, #FFF59A00 72%)',
          animationDuration: `${6 + seeded(i, 32) * 6}s`, animationDelay: `${-seeded(i, 33) * 10}s`,
          ['--rise' as string]: `${120 + seeded(i, 34) * 120}px`, ['--sway' as string]: `${(seeded(i, 35) - 0.5) * 40}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}
