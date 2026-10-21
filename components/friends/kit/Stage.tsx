'use client';

// ── Stage: each friend's painted little world ──
// Every friend game happens inside its friend's place, not in a grey box:
// Sage's moonlit sky, Flick's sunny glade, Ember's glowing cave, Nova's
// rainbow clouds, Shelly's sea and Kiko's jungle. Each scene is painted
// (kp-brush) and alive: clouds drift, fireflies wander, embers rise,
// leaves fall, sparkles twinkle. The scene is decoration only; it never
// catches taps, so the game on top of it always gets them.

import { useId, type CSSProperties, type ReactNode } from 'react';

export type World = 'sage' | 'flick' | 'ember' | 'nova' | 'shelly' | 'kiko';

/** a stable "random" number in [0, 1) for decoration i, channel k */
export const seeded = (i: number, k = 0) => {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function Cloud({ w, top, dur, delay, opacity }: { w: number; top: string; dur: number; delay: number; opacity: number }) {
  return (
    <div className="fg-drift absolute left-0" style={{ top, animationDuration: `${dur}s`, animationDelay: `${-delay}s`, opacity }}>
      <svg viewBox="0 0 100 50" width={w} aria-hidden="true">
        <g filter="url(#kp-brush)" fill="#FFFFFF">
          <ellipse cx="30" cy="32" rx="22" ry="14" />
          <ellipse cx="55" cy="24" rx="24" ry="18" />
          <ellipse cx="76" cy="33" rx="17" ry="12" />
          <ellipse cx="52" cy="38" rx="40" ry="10" />
        </g>
      </svg>
    </div>
  );
}

/** little lights that rise and fade: fireflies, embers, bubbles, motes */
function Risers({ n, color, size, glow, rise = 260, sway = 14, seed = 1, round = true }: {
  n: number; color: string; size: number; glow?: boolean; rise?: number; sway?: number; seed?: number; round?: boolean;
}) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const s = size * (0.6 + seeded(i, seed) * 0.8);
        return (
          <span key={i} className="fg-rise absolute" style={{
            left: `${4 + seeded(i, seed + 1) * 92}%`, bottom: `${-4 + seeded(i, seed + 2) * 30}%`,
            width: s, height: s, borderRadius: round ? '50%' : 2,
            background: glow ? `radial-gradient(circle, #FFFFFF 0%, ${color} 45%, ${color}00 72%)` : color,
            border: glow ? undefined : '1.5px solid rgba(255,255,255,0.7)',
            animationDuration: `${5 + seeded(i, seed + 3) * 6}s`, animationDelay: `${-seeded(i, seed + 4) * 10}s`,
            ['--rise' as string]: `${rise * (0.6 + seeded(i, seed + 5) * 0.6)}px`,
            ['--sway' as string]: `${(seeded(i, seed + 6) - 0.5) * 2 * sway}px`,
          } as CSSProperties} />
        );
      })}
    </>
  );
}

function Leaves({ n, colors, seed = 9 }: { n: number; colors: string[]; seed?: number }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="fg-fall absolute top-[-6%]" style={{
          left: `${seeded(i, seed) * 95}%`,
          animationDuration: `${7 + seeded(i, seed + 1) * 6}s`, animationDelay: `${-seeded(i, seed + 2) * 12}s`,
          ['--sway' as string]: `${(seeded(i, seed + 3) - 0.5) * 60}px`,
          ['--fall' as string]: '420px',
        } as CSSProperties}>
          <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
            <path d="M1 6 Q8 -2 15 6 Q8 14 1 6z" fill={colors[i % colors.length]} stroke="#3b2416" strokeWidth="0.8" />
            <path d="M2 6 H13" stroke="#3b2416" strokeWidth="0.6" opacity="0.6" />
          </svg>
        </span>
      ))}
    </>
  );
}

function Twinkles({ n, color = '#FFFFFF', top = 70, seed = 3 }: { n: number; color?: string; top?: number; seed?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x = seeded(i, seed) * 100, y = seeded(i, seed + 1) * top, r = 0.35 + seeded(i, seed + 2) * 0.6;
        return <circle key={i} cx={x} cy={y} r={r} fill={color} className="fg-twinkle"
          style={{ animationDelay: `${-seeded(i, seed + 3) * 2.4}s`, animationDuration: `${1.8 + seeded(i, seed + 4) * 2}s` }} />;
      })}
    </svg>
  );
}

function Backdrop({ world }: { world: World }) {
  const id = useId().replace(/:/g, '');
  const g = (n: string) => `${n}-${id}`;
  const sk = '#3b2416';
  switch (world) {
    case 'sage':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#151A4A" /><stop offset="0.7" stopColor="#3B3F94" /><stop offset="1" stopColor="#6A5BB5" /></linearGradient>
              <radialGradient id={g('moon')}><stop offset="0.45" stopColor="#FFF4C2" stopOpacity="0.7" /><stop offset="1" stopColor="#FFF4C2" stopOpacity="0" /></radialGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('sky')})`} />
            <circle cx="17" cy="14" r="20" fill={`url(#${g('moon')})`} className="fg-glow" />
            <g filter="url(#kp-brush)">
              <circle cx="17" cy="14" r="8" fill="#FFF1B8" stroke={sk} strokeWidth="0.6" />
              <circle cx="14.5" cy="12" r="1.4" fill="#F2DC8E" /><circle cx="20" cy="16.5" r="1" fill="#F2DC8E" />
              <path d="M0 88 Q18 78 34 86 T70 84 T100 82 V100 H0z" fill="#2A2A6E" />
              <path d="M0 94 Q25 88 50 94 T100 92 V100 H0z" fill="#1E1F55" />
              {/* Sage's tower */}
              <path d="M6 100 V74 H18 V100z" fill="#2D2A6A" stroke={sk} strokeWidth="0.5" />
              <path d="M4 75 L12 64 L20 75z" fill="#463F8F" stroke={sk} strokeWidth="0.5" />
              <rect x="10.5" y="80" width="3" height="4.5" rx="1.5" fill="#FFD966" className="fg-glow" />
            </g>
          </svg>
          <Twinkles n={34} top={75} />
          <Cloud w={90} top="22%" dur={70} delay={10} opacity={0.18} />
          <Cloud w={60} top="52%" dur={55} delay={35} opacity={0.12} />
          <Risers n={6} color="#FFE59A" size={7} glow rise={300} seed={21} />
        </>
      );
    case 'flick':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BDEFD0" /><stop offset="0.55" stopColor="#6FC08F" /><stop offset="1" stopColor="#3C8E5C" /></linearGradient>
              <linearGradient id={g('ray')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFBE0" stopOpacity="0.55" /><stop offset="1" stopColor="#FFFBE0" stopOpacity="0" /></linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('sky')})`} />
            <g className="fg-glow">
              <path d="M8 -5 L24 -5 L44 100 L28 100z" fill={`url(#${g('ray')})`} />
              <path d="M40 -5 L50 -5 L70 100 L58 100z" fill={`url(#${g('ray')})`} opacity="0.7" />
            </g>
            <g filter="url(#kp-brush)">
              <ellipse cx="10" cy="40" rx="18" ry="26" fill="#4FA36E" opacity="0.55" />
              <ellipse cx="92" cy="34" rx="16" ry="24" fill="#4FA36E" opacity="0.55" />
              <path d="M0 86 Q25 76 50 84 T100 80 V100 H0z" fill="#58B36F" stroke={sk} strokeWidth="0.5" />
              <path d="M0 93 Q30 88 60 93 T100 91 V100 H0z" fill="#3F9152" />
              {[8, 22, 37, 61, 74, 89].map((x, i) => (
                <g key={x} className="fg-sway" style={{ transformOrigin: `${x}% 92%`, animationDelay: `${-i * 0.7}s` }}>
                  <path d={`M${x} 93 q-1.5 -5 -3 -6 M${x} 93 q0 -6 1 -8 M${x} 93 q1.5 -4 3.5 -5`} stroke="#2F7A41" strokeWidth="0.9" fill="none" strokeLinecap="round" />
                </g>
              ))}
              <circle cx="16" cy="90" r="1.6" fill="#FFB4C8" stroke={sk} strokeWidth="0.3" />
              <circle cx="68" cy="88" r="1.6" fill="#FFE07A" stroke={sk} strokeWidth="0.3" />
            </g>
          </svg>
          <Risers n={9} color="#FFF59A" size={9} glow rise={180} sway={26} seed={4} />
          <Leaves n={6} colors={['#F7B267', '#9ED36A', '#F4845F']} />
        </>
      );
    case 'ember':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <radialGradient id={g('cave')} cx="0.5" cy="0.55" r="0.75"><stop offset="0" stopColor="#8A3B2B" /><stop offset="0.6" stopColor="#4B1D1B" /><stop offset="1" stopColor="#240C10" /></radialGradient>
              <radialGradient id={g('cr')}><stop offset="0" stopColor="#FF9AD5" stopOpacity="0.8" /><stop offset="1" stopColor="#FF9AD5" stopOpacity="0" /></radialGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('cave')})`} />
            {[[10, 84], [90, 80], [86, 14]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="13" fill={`url(#${g('cr')})`} className="fg-glow" style={{ animationDelay: `${-i}s` }} />
            ))}
            <g filter="url(#kp-brush)">
              <path d="M0 0 H100 V8 Q85 14 75 9 Q62 16 50 10 Q36 17 24 10 Q12 15 0 9z" fill="#2B1013" stroke={sk} strokeWidth="0.5" />
              <path d="M30 9 l2 7 l2 -7z M62 11 l1.6 6 l1.6 -6z M80 9 l1.4 5 l1.4 -5z" fill="#2B1013" />
              <path d="M0 90 Q20 84 40 89 T80 87 T100 88 V100 H0z" fill="#3A1517" stroke={sk} strokeWidth="0.5" />
              {/* glowing crystals */}
              <path d="M5 90 L8 76 L11 90z M10 90 L13 80 L16 90z" fill="#F472B6" stroke={sk} strokeWidth="0.4" />
              <path d="M86 88 L89 72 L92 88z M91 88 L94 78 L97 88z" fill="#A78BFA" stroke={sk} strokeWidth="0.4" />
              <path d="M82 18 L85 8 L88 18z" fill="#F9A8D4" stroke={sk} strokeWidth="0.4" />
              <path d="M7 77 L8 76 L8.6 82z" fill="#FFFFFF" opacity="0.7" />
              {/* a heap of coins */}
              <ellipse cx="72" cy="92" rx="9" ry="3" fill="#F2C14E" stroke={sk} strokeWidth="0.4" />
              <ellipse cx="72" cy="90" rx="6" ry="2.4" fill="#FFD966" stroke={sk} strokeWidth="0.4" />
            </g>
          </svg>
          <Risers n={14} color="#FF9F43" size={5} glow rise={320} sway={18} seed={7} />
        </>
      );
    case 'nova':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E1E62" /><stop offset="0.6" stopColor="#6A3F9E" /><stop offset="1" stopColor="#E59BC8" /></linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('sky')})`} />
            <g fill="none" strokeWidth="2.4" opacity="0.2">
              {['#FF6B6B', '#FFB347', '#FFE66D', '#7BE495', '#6FB7FF', '#B28DFF'].map((c, i) => (
                <path key={c} d={`M-10 ${104 + i * 2.6} A 62 62 0 0 1 110 ${104 + i * 2.6}`} stroke={c} transform="translate(0 -18)" />
              ))}
            </g>
            <g filter="url(#kp-brush)" fill="#FFFFFF">
              <ellipse cx="14" cy="96" rx="22" ry="8" opacity="0.85" /><ellipse cx="30" cy="99" rx="20" ry="6" opacity="0.85" />
              <ellipse cx="84" cy="97" rx="24" ry="8" opacity="0.85" /><ellipse cx="62" cy="100" rx="18" ry="5" opacity="0.85" />
            </g>
          </svg>
          <Twinkles n={28} color="#FFF6FF" top={70} seed={13} />
          <Cloud w={80} top="30%" dur={60} delay={20} opacity={0.2} />
          <Risers n={8} color="#FFC4F0" size={7} glow rise={260} seed={31} />
        </>
      );
    case 'shelly':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD9B8" /><stop offset="0.45" stopColor="#9BE3E0" /><stop offset="1" stopColor="#5CC2CF" /></linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('sky')})`} />
          </svg>
          <Cloud w={80} top="8%" dur={80} delay={15} opacity={0.75} />
          <Cloud w={56} top="20%" dur={64} delay={45} opacity={0.6} />
        </>
      );
    case 'kiko':
      return (
        <>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFF5A8" /><stop offset="0.5" stopColor="#7CC46A" /><stop offset="1" stopColor="#3E8A3C" /></linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${g('sky')})`} />
            {[[18, 30], [70, 18], [50, 60], [86, 52]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="9" fill="#FFFBD0" opacity="0.16" />
            ))}
            <g filter="url(#kp-brush)">
              {/* hanging vines */}
              {[12, 34, 64, 90].map((x, i) => (
                <g key={x} className="fg-sway" style={{ transformOrigin: `${x}% 0%`, animationDelay: `${-i}s`, animationDuration: `${4 + i * 0.6}s` }}>
                  <path d={`M${x} 0 Q${x + 3} ${10 + i * 3} ${x} ${18 + i * 4}`} stroke="#2F6B2A" strokeWidth="1" fill="none" />
                  <ellipse cx={x + 1.5} cy={10 + i * 3} rx="2.2" ry="1.1" fill="#5DB04E" />
                  <ellipse cx={x - 0.5} cy={16 + i * 4} rx="2" ry="1" fill="#6CC35B" />
                </g>
              ))}
              <path d="M0 90 Q30 84 60 90 T100 88 V100 H0z" fill="#3A7E35" stroke={sk} strokeWidth="0.5" />
            </g>
          </svg>
          {/* big framing leaves */}
          {[{ l: '-8%', t: '58%', r: 20, s: 1 }, { l: '86%', t: '62%', r: -30, s: -1 }, { l: '80%', t: '-6%', r: 200, s: 1 }].map((p, i) => (
            <div key={i} className="fg-sway absolute" style={{ left: p.l, top: p.t, transformOrigin: '20% 80%', animationDelay: `${-i * 1.3}s`, animationDuration: '5s' }}>
              <svg width="78" height="60" viewBox="0 0 80 60" style={{ transform: `rotate(${p.r}deg) scaleX(${p.s})` }} aria-hidden="true">
                <g filter="url(#kp-brush)">
                  <path d="M4 50 Q20 0 76 6 Q60 50 4 50z" fill="#4CAF50" stroke={sk} strokeWidth="1.2" />
                  <path d="M6 48 Q36 30 72 9" stroke="#2E7D32" strokeWidth="1.4" fill="none" />
                </g>
              </svg>
            </div>
          ))}
          <Leaves n={4} colors={['#9ED36A', '#C6E86B']} seed={17} />
        </>
      );
  }
}

export default function Stage({ world, children, className, style }: {
  world: World; children?: ReactNode; className?: string; style?: CSSProperties;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-[28px] select-none ${className ?? ''}`}
      style={{ boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.35), 0 10px 0 rgba(0,0,0,0.22)', ...style }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"><Backdrop world={world} /></div>
      {children}
    </div>
  );
}
