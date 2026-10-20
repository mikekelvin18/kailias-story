// ── Living decorations ──
// Drawn, animated stand-ins for the emoji that used to float around the
// map and home screen (☀️ 🌙 ✨ ⭐ 🦋 🌸 🔮). Each one has its own small,
// natural motion instead of the same generic bob: the sun's rays turn
// slowly and its glow breathes, sparkles twinkle, the butterfly flaps,
// the flower sways in the breeze, birds glide. Soft gradients and no
// heavy outlines, so they sit in the same soft sky as the clouds.
// Animations live in globals.css under "Living decorations"; "Reduce
// motion" stills them all.

import { useId, type CSSProperties } from 'react';

interface Props {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function useIds(...names: string[]) {
  const id = useId().replace(/:/g, '');
  return names.map(n => `${n}-${id}`);
}

export function Sun({ size = 40, className, style }: Props) {
  const [glow, body] = useIds('sunGlow', 'sunBody');
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0.3" stopColor="#FFE58A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE58A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={body} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FFF8D2" />
          <stop offset="0.55" stopColor="#FFD84A" />
          <stop offset="1" stopColor="#F9A825" />
        </radialGradient>
      </defs>
      <circle r="48" fill={`url(#${glow})`} className="deco-breathe" />
      <g className="deco-spin">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M -4 -27 Q 0 -40 4 -27 Z" fill="#FFCE3A" opacity="0.85" transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <circle r="22" fill={`url(#${body})`} />
    </svg>
  );
}

export function Moon({ size = 40, className, style }: Props) {
  const [glow, body, cut] = useIds('moonGlow', 'moonBody', 'moonCut');
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0.3" stopColor="#E9EEFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#E9EEFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={body} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFFDF2" />
          <stop offset="1" stopColor="#E8DDB5" />
        </radialGradient>
        <mask id={cut}>
          <rect x="-50" y="-50" width="100" height="100" fill="white" />
          <circle cx="12" cy="-8" r="20" fill="black" />
        </mask>
      </defs>
      <circle r="46" fill={`url(#${glow})`} className="deco-breathe" />
      <circle r="24" fill={`url(#${body})`} mask={`url(#${cut})`} />
    </svg>
  );
}

// A soft four-point twinkle — replaces ✨ ⭐ 🌟 💫.
export function Sparkle({ size = 18, className, style, color = '#FFD54F' }: Props & { color?: string }) {
  const [glow] = useIds('spark');
  return (
    <svg viewBox="-20 -20 40 40" width={size} height={size} className={`deco-twinkle ${className ?? ''}`} style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="14" fill={`url(#${glow})`} />
      <path d="M 0 -18 Q 2.2 -2.2 18 0 Q 2.2 2.2 0 18 Q -2.2 2.2 -18 0 Q -2.2 -2.2 0 -18 Z" fill={color} />
      <circle r="3" fill="#FFFFFF" />
    </svg>
  );
}

export function Butterfly({ size = 22, className, style }: Props) {
  const [wing] = useIds('wing');
  // Each wing pair is squashed sideways in turn (scaleX), which reads as a
  // flap seen from above. The whole butterfly also drifts on a small loop.
  return (
    <span className={`deco-flutter-path ${className ?? ''}`} style={{ display: 'inline-block', ...style }}>
      <svg viewBox="-24 -20 48 40" width={size} height={size * 0.85} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <radialGradient id={wing} cx="0.3" cy="0.4" r="0.8">
            <stop offset="0" stopColor="#FFE7F3" />
            <stop offset="0.5" stopColor="#F9A8D4" />
            <stop offset="1" stopColor="#C084FC" />
          </radialGradient>
        </defs>
        <g className="deco-wing">
          <ellipse cx="-11" cy="-7" rx="11" ry="9" fill={`url(#${wing})`} transform="rotate(-20 -11 -7)" />
          <ellipse cx="-8" cy="8" rx="7" ry="6" fill={`url(#${wing})`} transform="rotate(25 -8 8)" />
          <ellipse cx="11" cy="-7" rx="11" ry="9" fill={`url(#${wing})`} transform="rotate(20 11 -7)" />
          <ellipse cx="8" cy="8" rx="7" ry="6" fill={`url(#${wing})`} transform="rotate(-25 8 8)" />
        </g>
        <rect x="-1.6" y="-9" width="3.2" height="19" rx="1.6" fill="#5B4A6B" />
        <path d="M -1 -9 Q -4 -15 -6 -16 M 1 -9 Q 4 -15 6 -16" stroke="#5B4A6B" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Flower({ size = 22, className, style }: Props) {
  const [petal, centre] = useIds('petal', 'centre');
  return (
    <svg viewBox="-20 -24 40 48" width={size} height={size * 1.2} className={`deco-sway ${className ?? ''}`} style={{ overflow: 'visible', ...style }}>
      <defs>
        <radialGradient id={petal} cx="0.5" cy="0.9" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F9A8D4" />
        </radialGradient>
        <radialGradient id={centre} cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="1" stopColor="#F59E0B" />
        </radialGradient>
      </defs>
      <path d="M 0 2 Q 3 12 0 24" stroke="#4ADE80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="5" cy="15" rx="5" ry="2.5" fill="#86EFAC" transform="rotate(-30 5 15)" />
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={i} cx="0" cy="-12" rx="5.5" ry="8" fill={`url(#${petal})`} transform={`rotate(${i * 72} 0 -4)`} />
      ))}
      <circle cx="0" cy="-4" r="4.5" fill={`url(#${centre})`} />
    </svg>
  );
}

// Two little birds gliding, drawn as soft "m" strokes — far away, simple.
export function Birds({ size = 30, className, style }: Props) {
  return (
    <svg viewBox="0 0 60 30" width={size} height={size / 2} className={`deco-glide ${className ?? ''}`} style={{ overflow: 'visible', ...style }}>
      <g className="deco-flap">
        <path d="M 4 14 Q 9 7 14 14 Q 19 7 24 14" stroke="#475569" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
      <g className="deco-flap" style={{ animationDelay: '0.35s' }}>
        <path d="M 36 22 Q 40 17 44 22 Q 48 17 52 22" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.55" />
      </g>
    </svg>
  );
}
