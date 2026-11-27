// ── Living sky ──
// Soft, real-looking clouds drifting slowly across the background, like
// looking up at the sky — instead of outlined cartoon clouds or emoji.
// The clouds are pictures (public/scenery/clouds/{day,dusk,night}-{1..4}.webp)
// painted once by scripts/make-clouds.mjs, so phones and tablets only ever
// slide a picture sideways: no per-frame drawing cost.
//
// Three layers at different distances: far clouds are small, faint and
// slow; near clouds are bigger and a little quicker. That speed difference
// (parallax) is what makes the sky read as deep instead of flat.
// Everything is very slow on purpose (1.5 to 4 minutes to cross the
// screen): calm movement, never something a child has to track.
// "Reduce motion" parks every cloud where it is (globals.css).
//
// Placement:
//   'fixed'    — fills the whole screen behind a page. The page's <main>
//                needs `isolation: isolate` so the sky sits above the
//                page's background colour but under all of its content.
//   'absolute' — fills its nearest positioned parent (e.g. the map panel).

import type { CSSProperties } from 'react';

export type SkyMood = 'day' | 'dusk' | 'night';

interface CloudSpec {
  img: 1 | 2 | 3 | 4;
  top: number;      // % from the top of the sky
  width: number;    // px
  secs: number;     // seconds to cross once
  start: number;    // 0–1: how far across it already is when the page opens
  opacity: number;
}

// far → near (later entries paint on top)
const CLOUDS: CloudSpec[] = [
  { img: 3, top: 4,  width: 150, secs: 240, start: 0.15, opacity: 0.55 },
  { img: 2, top: 30, width: 130, secs: 260, start: 0.7,  opacity: 0.5 },
  { img: 4, top: 58, width: 160, secs: 230, start: 0.4,  opacity: 0.45 },
  { img: 1, top: 14, width: 230, secs: 170, start: 0.55, opacity: 0.85 },
  { img: 3, top: 44, width: 210, secs: 180, start: 0.05, opacity: 0.75 },
  { img: 2, top: 76, width: 240, secs: 190, start: 0.85, opacity: 0.7 },
  { img: 4, top: 22, width: 320, secs: 120, start: 0.3,  opacity: 0.95 },
  { img: 1, top: 64, width: 300, secs: 135, start: 0.95, opacity: 0.9 },
];

// Night clouds are moonlit and dimmer so they never glare.
const MOOD_OPACITY: Record<SkyMood, number> = { day: 1, dusk: 0.9, night: 0.55 };

interface Props {
  mood?: SkyMood;
  placement?: 'fixed' | 'absolute';
  /** how many clouds (from far to near); fewer for small panels */
  count?: number;
  /** shrink every cloud, e.g. 0.6 inside a small panel */
  scale?: number;
  stars?: boolean;
  /** overall strength, e.g. lower behind white text */
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}

export default function LivingSky({
  mood = 'day', placement = 'fixed', count = CLOUDS.length, scale = 1, stars, opacity = 1, className, style,
}: Props) {
  const showStars = stars ?? mood === 'night';
  const clouds = CLOUDS.slice(0, count);
  return (
    <div aria-hidden="true" className={`living-sky ${className ?? ''}`}
      style={{ position: placement, inset: 0, zIndex: placement === 'fixed' ? -1 : 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      {showStars && <Starfield />}
      {clouds.map((c, i) => {
        const w = Math.round(c.width * scale);
        return (
          <div key={i} className="sky-lane"
            style={{
              top: `${c.top}%`,
              '--cw': `${w}px`,
              '--rest': `${Math.round(c.start * 100)}%`,
              animationDuration: `${c.secs}s`,
              animationDelay: `${-c.start * c.secs}s`,
            } as CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/scenery/clouds/${mood}-${c.img}.webp`} alt="" width={w} draggable={false}
              style={{ display: 'block', width: w, height: 'auto', opacity: c.opacity * MOOD_OPACITY[mood] * opacity }} />
          </div>
        );
      })}
    </div>
  );
}

// A few soft, slowly twinkling stars for the night sky — drawn glows, not
// emoji. Positions are fixed so server and browser render the same thing.
const STARS: [number, number, number, number][] = [
  [6, 8, 3, 0], [18, 22, 2, 1.2], [31, 5, 2.5, 2.1], [44, 15, 2, 0.6], [58, 7, 3, 1.7],
  [71, 19, 2, 2.6], [84, 6, 2.5, 0.9], [93, 24, 2, 1.9], [12, 38, 2, 2.9], [37, 33, 2.5, 0.3],
  [63, 36, 2, 1.4], [88, 41, 2.5, 2.3], [24, 52, 2, 1.1], [76, 55, 2, 0.4], [50, 48, 1.8, 2.7],
];

function Starfield() {
  return (
    <>
      {STARS.map(([x, y, r, d], i) => (
        <span key={i} className="sky-twinkle"
          style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 3.5, height: r * 3.5, borderRadius: '50%',
            background: 'radial-gradient(circle, #FFFFFF 0%, #FFFFFF 12%, rgba(255,247,214,0.6) 28%, rgba(255,247,214,0) 70%)',
            animationDelay: `${d}s`,
          }} />
      ))}
    </>
  );
}
