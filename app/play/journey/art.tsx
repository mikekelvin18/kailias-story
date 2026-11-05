'use client';

// ── Kailia's Journey: painted world pieces ──
// Everything on the overworld is drawn here in the shared painted style
// (kp-brush, warm brown outline) instead of emoji: trees, ponds, cacti,
// rocks, ice, logs, flowers, the winding trail, swaying tall grass and the
// waving goal flag. Plus the little pictures the wild creatures' riddles
// need: colour blobs, feeling scenes and happy / sad faces.

import type { CSSProperties, ReactNode } from 'react';
import { seeded } from '@/components/friends/kit/Stage';

const SK = '#3b2416';

export type Obstacle = 'tree' | 'pond' | 'cactus' | 'boulder' | 'pine' | 'iceblock' | 'maple' | 'log';
export type Decor = 'flower' | 'clover' | 'pebbles' | 'drygrass' | 'snowmound' | 'crystal' | 'leaves' | 'mushroom';

// each drawn in a 44 × 44 tile box; tall things reach up into the tile above
const OBSTACLES: Record<Obstacle, ReactNode> = {
  tree: (
    <>
      <path d="M19 42 L20 26 H24 L25 42z" fill="#B7793F" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="22" cy="40.5" rx="12" ry="3" fill="rgba(0,0,0,0.18)" />
      <circle cx="22" cy="12" r="17" fill="#5DB65A" stroke={SK} strokeWidth="1.8" />
      <circle cx="15" cy="6" r="5" fill="#9EE08A" />
      <circle cx="28" cy="18" r="2" fill="#F87171" stroke={SK} strokeWidth="0.8" />
    </>
  ),
  pond: (
    <>
      <path d="M4 22 Q4 6 22 6 Q40 6 40 22 Q40 39 22 39 Q4 39 4 22z" fill="#5BB8F0" stroke={SK} strokeWidth="1.8" />
      <path d="M9 20 Q10 11 20 10" stroke="#D6F1FF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="31" cy="29" rx="5" ry="2.6" fill="#7ACB5A" stroke={SK} strokeWidth="1" />
    </>
  ),
  cactus: (
    <>
      <ellipse cx="22" cy="41" rx="10" ry="2.6" fill="rgba(0,0,0,0.18)" />
      <path d="M17 41 V8 Q17 2 22 2 Q27 2 27 8 V41z" fill="#5DB65A" stroke={SK} strokeWidth="1.8" />
      <path d="M17 26 H11 Q8 26 8 22 V14 Q8 11 10.5 11 Q13 11 13 14 V20 H17" fill="#5DB65A" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M27 20 H32 V12 Q32 9 34.5 9 Q37 9 37 12 V20 Q37 25 33 25 H27" fill="#5DB65A" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M20 8 V36" stroke="#9EE08A" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="22" cy="3" r="2.2" fill="#F9A8D4" stroke={SK} strokeWidth="0.8" />
    </>
  ),
  boulder: (
    <>
      <ellipse cx="22" cy="40" rx="16" ry="3" fill="rgba(0,0,0,0.18)" />
      <path d="M5 38 Q3 22 14 16 Q24 8 34 16 Q42 24 39 38z" fill="#B9A58C" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 22 Q18 16 26 17" stroke="#E9DCC8" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M24 26 L28 32 M30 24 L33 29" stroke={SK} strokeWidth="1" opacity="0.5" />
    </>
  ),
  pine: (
    <>
      <rect x="19.5" y="32" width="5" height="10" rx="1.5" fill="#B7793F" stroke={SK} strokeWidth="1.4" />
      <ellipse cx="22" cy="41" rx="11" ry="2.6" fill="rgba(0,0,0,0.15)" />
      <path d="M22 -6 L35 14 H29 L39 33 H5 L15 14 H9z" fill="#3F9E6A" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 -6 L28 4 Q22 7 16 4z M15 14 Q22 18 29 14 L31 18 Q22 22 13 18z" fill="#FFFFFF" />
    </>
  ),
  iceblock: (
    <>
      <ellipse cx="22" cy="40" rx="15" ry="3" fill="rgba(0,0,0,0.12)" />
      <path d="M7 16 L22 9 L37 16 V34 L22 41 L7 34z" fill="#BDEBFF" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 16 L22 23 L37 16 M22 23 V41" stroke={SK} strokeWidth="1.2" fill="none" />
      <path d="M11 21 V30" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  maple: (
    <>
      <path d="M19 42 L20 26 H24 L25 42z" fill="#9A6234" stroke={SK} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx="22" cy="40.5" rx="12" ry="3" fill="rgba(0,0,0,0.18)" />
      <path d="M6 18 Q2 6 14 4 Q18 -6 28 -2 Q40 -2 38 10 Q44 20 34 26 Q24 32 12 28 Q2 26 6 18z" fill="#F08A3C" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="14" cy="8" r="4.4" fill="#FFC27A" />
      <circle cx="30" cy="18" r="3.6" fill="#E25D3A" />
    </>
  ),
  log: (
    <>
      <ellipse cx="22" cy="38" rx="17" ry="3" fill="rgba(0,0,0,0.18)" />
      <path d="M6 22 H36 V36 H6z" fill="#B7793F" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cx="36" cy="29" rx="5" ry="7" fill="#E7B77A" stroke={SK} strokeWidth="1.6" />
      <ellipse cx="36" cy="29" rx="2" ry="3" fill="none" stroke={SK} strokeWidth="0.9" />
      <path d="M10 26 H28 M12 32 H26" stroke={SK} strokeWidth="1" opacity="0.5" />
      <path d="M16 22 Q18 16 22 18" stroke="#5DB65A" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
};

const DECOR: Record<Decor, ReactNode> = {
  flower: (
    <>
      <path d="M22 38 V26" stroke="#3E9A4A" strokeWidth="1.8" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="22" cy="17" rx="3.6" ry="5" fill="#FF9EC7" stroke={SK} strokeWidth="1" transform={`rotate(${a} 22 22)`} />)}
      <circle cx="22" cy="22" r="3" fill="#FFD84D" stroke={SK} strokeWidth="1" />
    </>
  ),
  clover: (
    <>
      <path d="M22 38 Q22 32 24 28" stroke="#3E9A4A" strokeWidth="1.6" fill="none" />
      {[0, 120, 240].map(a => <circle key={a} cx="22" cy="22" r="5" fill="#7ACB5A" stroke={SK} strokeWidth="1" transform={`rotate(${a} 22 28) translate(0 -1)`} />)}
    </>
  ),
  pebbles: (
    <>
      <ellipse cx="16" cy="30" rx="6" ry="4" fill="#D9C7A8" stroke={SK} strokeWidth="1.2" />
      <ellipse cx="27" cy="33" rx="4.6" ry="3.2" fill="#C7B08A" stroke={SK} strokeWidth="1.2" />
      <ellipse cx="24" cy="25" rx="3.4" ry="2.4" fill="#E6D8BE" stroke={SK} strokeWidth="1" />
    </>
  ),
  drygrass: (
    <path d="M22 38 Q18 26 12 22 M22 38 Q22 24 24 16 M22 38 Q26 28 32 24 M22 38 Q16 32 10 32" stroke="#B8862F" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  snowmound: (
    <>
      <path d="M6 36 Q10 22 22 22 Q34 22 38 36z" fill="#FFFFFF" stroke="#7FA3C7" strokeWidth="1.4" />
      <path d="M12 30 Q16 26 21 26" stroke="#DCEBFA" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  crystal: (
    <>
      <path d="M18 36 L16 24 L20 14 L24 24 L22 36z" fill="#A5E1FF" stroke={SK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M24 36 L24 26 L28 20 L31 27 L28 36z" fill="#C9F0FF" stroke={SK} strokeWidth="1.2" strokeLinejoin="round" />
    </>
  ),
  leaves: (
    <>
      <path d="M8 30 Q12 22 20 26 Q16 34 8 30z" fill="#F08A3C" stroke={SK} strokeWidth="1" />
      <path d="M22 34 Q28 26 36 30 Q30 38 22 34z" fill="#E25D3A" stroke={SK} strokeWidth="1" />
      <path d="M18 20 Q22 14 28 18 Q24 24 18 20z" fill="#F7B267" stroke={SK} strokeWidth="1" />
    </>
  ),
  mushroom: (
    <>
      <path d="M19 38 Q18 30 20 26 H24 Q26 30 25 38z" fill="#FFF4DE" stroke={SK} strokeWidth="1.2" />
      <path d="M11 27 Q12 15 22 15 Q32 15 33 27z" fill="#F05A5A" stroke={SK} strokeWidth="1.4" />
      <circle cx="18" cy="21" r="1.8" fill="#FFFFFF" /><circle cx="26" cy="20" r="1.5" fill="#FFFFFF" />
    </>
  ),
};

export interface MapPiece { x: number; y: number; kind: Obstacle | Decor; }

/** The whole map's still drawing (ground tufts, trail, trees, rocks…), one
 *  painted SVG so the brush filter is worked out once, not per tile. */
export function MapArt({ cols, rows, tile, path, pieces, ground, trail, tuft }: {
  cols: number; rows: number; tile: number; path: { x: number; y: number }[]; pieces: MapPiece[];
  ground: string; trail: string; tuft: string;
}) {
  const pts = path.map(p => `${p.x * tile + tile / 2},${p.y * tile + tile / 2}`).join(' ');
  const W = cols * tile, H = rows * tile;
  return (
    <svg className="absolute left-0 top-0 pointer-events-none" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <rect width={W} height={H} fill={ground} />
      <g filter="url(#kp-brush)">
        {/* soft patches and tufts so the ground isn't flat */}
        {Array.from({ length: 26 }, (_, i) => (
          <ellipse key={`p${i}`} cx={seeded(i, 201) * W} cy={seeded(i, 202) * H} rx={30 + seeded(i, 203) * 40} ry={18 + seeded(i, 204) * 22} fill={tuft} opacity="0.16" />
        ))}
        {Array.from({ length: 90 }, (_, i) => {
          const x = seeded(i, 211) * W, y = seeded(i, 212) * H;
          return <path key={`t${i}`} d={`M${x} ${y} l-3 -6 M${x} ${y} l0 -8 M${x} ${y} l3 -6`} stroke={tuft} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />;
        })}
        {/* the winding trail */}
        <polyline points={pts} fill="none" stroke={SK} strokeOpacity="0.45" strokeWidth={tile * 0.78} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke={trail} strokeWidth={tile * 0.7} strokeLinecap="round" strokeLinejoin="round" />
        {path.filter((_, i) => i % 2 === 0).map((p, i) => (
          <ellipse key={`s${i}`} cx={p.x * tile + tile / 2 + (seeded(i, 221) - 0.5) * 18} cy={p.y * tile + tile / 2 + (seeded(i, 222) - 0.5) * 18}
            rx="2.4" ry="1.6" fill={SK} opacity="0.18" />
        ))}
        {/* trees, rocks, flowers: back rows first so the front ones overlap */}
        {[...pieces].sort((a, b) => a.y - b.y).map((p, i) => (
          <g key={i} transform={`translate(${p.x * tile} ${p.y * tile}) scale(${tile / 44})`}>
            {(OBSTACLES as Record<string, ReactNode>)[p.kind] ?? (DECOR as Record<string, ReactNode>)[p.kind]}
          </g>
        ))}
      </g>
    </svg>
  );
}

/** a pond's ripples, drawn on top of the still map so only they move */
export function PondRipple({ x, y, tile }: { x: number; y: number; tile: number }) {
  return (
    <svg className="absolute pointer-events-none" width={tile} height={tile} viewBox="0 0 44 44"
      style={{ left: x * tile, top: y * tile }} aria-hidden="true">
      <ellipse cx="20" cy="24" rx="8" ry="4" fill="none" stroke="#FFFFFF" strokeWidth="1.4" className="fg-glow" style={{ animationDuration: '2.2s' }} />
      <ellipse cx="20" cy="24" rx="13" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1" className="fg-glow" style={{ animationDuration: '2.2s', animationDelay: '-1.1s' }} />
    </svg>
  );
}

/** tall grass where a wild friend hides: blades sway and a sparkle twinkles */
export function TallGrass({ size, color, style, sparkle = true, className }: { size: number; color: string; style?: CSSProperties; sparkle?: boolean; className?: string }) {
  const blades = [
    'M8 42 Q6 24 2 14', 'M14 42 Q14 20 12 6', 'M20 42 Q22 22 22 4', 'M26 42 Q28 22 32 8', 'M32 42 Q34 26 40 16', 'M38 42 Q38 30 42 24',
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className} style={{ overflow: 'visible', ...style }} aria-hidden="true">
      <g filter="url(#kp-edge)">
        {blades.map((d, i) => (
          <g key={i} className="fg-sway" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animationDuration: `${1.6 + (i % 3) * 0.4}s`, animationDelay: `${-i * 0.3}s` }}>
            <path d={d} stroke={SK} strokeWidth="5.4" fill="none" strokeLinecap="round" />
            <path d={d} stroke={i % 2 ? color : '#9EE08A'} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
      {sparkle && (
        <path d="M36 2 Q37 7 42 8 Q37 9 36 14 Q35 9 30 8 Q35 7 36 2z" fill="#FFF6B0" stroke={SK} strokeWidth="0.8" className="fg-twinkle" />
      )}
    </svg>
  );
}

/** the goal flag, cloth waving on its pole */
export function Flag({ size, ready, glow = true, style }: { size: number; ready: boolean; glow?: boolean; style?: CSSProperties }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 44 62" style={{ overflow: 'visible', ...style }} aria-hidden="true">
      {ready && glow && <circle cx="22" cy="30" r="20" fill="#FDE047" opacity="0.6" className="fg-glow" style={{ filter: "blur(7px)" }} />}
      <g filter="url(#kp-edge)">
        <ellipse cx="12" cy="59" rx="9" ry="2.6" fill="rgba(0,0,0,0.2)" />
        <path d="M12 60 V4" stroke={SK} strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="12" cy="4" r="3" fill="#FDE047" stroke={SK} strokeWidth="1.4" />
        <g className="fg-sway" style={{ transformBox: 'fill-box', transformOrigin: '0% 50%', animationDuration: '1.4s' }}>
          <path d="M13 7 Q24 3 40 10 Q30 16 40 24 Q26 20 13 25z" fill={ready ? '#FDE047' : '#F05A5A'} stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M17 11 Q24 9 31 12" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity="0.7" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/** a little satchel for the friends Kailia has met */
export function Satchel({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-0.25em' }}>
      <path d="M8 8 Q8 3 12 3 Q16 3 16 8" stroke="#3b2416" strokeWidth="1.8" fill="none" />
      <path d="M3 9 H21 L19 21 H5z" fill="#E0A458" stroke="#3b2416" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 9 Q12 15 21 9" fill="#C9822F" stroke="#3b2416" strokeWidth="1.4" />
      <circle cx="12" cy="13" r="1.6" fill="#FDE047" stroke="#3b2416" strokeWidth="0.8" />
    </svg>
  );
}

// ── Riddle pictures ──

export const COLOR_OF: Record<string, { hex: string; name: string }> = {
  '🔴': { hex: '#EF4444', name: 'red' }, '🔵': { hex: '#3B82F6', name: 'blue' }, '🟢': { hex: '#22C55E', name: 'green' },
  '🟡': { hex: '#FACC15', name: 'yellow' }, '🟣': { hex: '#A855F7', name: 'purple' }, '🟠': { hex: '#F97316', name: 'orange' },
};

/** a round dab of paint in one colour */
export function PaintBlob({ hex, size }: { hex: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'inline-block' }}>
      <g filter="url(#kp-brush)">
        <path d="M20 3 Q31 2 35 11 Q40 20 35 29 Q29 38 19 37 Q8 37 4 28 Q1 18 6 10 Q11 3 20 3z" fill={hex} stroke="#3b2416" strokeWidth="2" />
        <ellipse cx="14" cy="13" rx="4" ry="2.6" fill="#FFFFFF" opacity="0.55" />
      </g>
    </svg>
  );
}

/** a simple happy or sad face (a round sticker, not a person) */
export function FeelingFace({ happy, size }: { happy: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'inline-block' }}>
      <g filter="url(#kp-edge)">
        <circle cx="20" cy="20" r="17" fill={happy ? '#FDE047' : '#93C5FD'} stroke="#3b2416" strokeWidth="2" />
        <circle cx="14" cy="16" r="2.2" fill="#3b2416" /><circle cx="26" cy="16" r="2.2" fill="#3b2416" />
        {happy
          ? <><path d="M12 23 Q20 31 28 23" stroke="#3b2416" strokeWidth="2.2" fill="none" strokeLinecap="round" /><circle cx="10" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" /><circle cx="30" cy="22" r="2.4" fill="#FCA5A5" opacity="0.8" /></>
          : <><path d="M13 28 Q20 22 27 28" stroke="#3b2416" strokeWidth="2.2" fill="none" strokeLinecap="round" /><path d="M27 19 Q25 23 27 25 Q29 23 27 19z" fill="#FFFFFF" stroke="#3b2416" strokeWidth="1" /></>}
      </g>
    </svg>
  );
}

// the feeling riddles' little scenes, by their emoji key in lib/creatureChallenges.ts
const SCENE: Record<string, { label: string; art: ReactNode }> = {
  '🎂🎈': { label: 'a birthday cake and a balloon', art: (
    <>
      <path d="M8 46 H40 V30 H8z" fill="#FBCFE8" stroke={SK} strokeWidth="2" />
      <path d="M8 34 Q16 40 24 34 Q32 40 40 34" stroke="#FFFFFF" strokeWidth="3" fill="none" />
      <rect x="22" y="20" width="4" height="10" fill="#93C5FD" stroke={SK} strokeWidth="1.4" />
      <path d="M24 12 Q27 16 24 20 Q21 16 24 12z" fill="#FDE047" stroke={SK} strokeWidth="1.2" />
      <ellipse cx="60" cy="18" rx="10" ry="12" fill="#F87171" stroke={SK} strokeWidth="2" />
      <path d="M60 30 Q56 38 62 46" stroke={SK} strokeWidth="1.4" fill="none" />
      <ellipse cx="56" cy="13" rx="2.6" ry="3.6" fill="#FFFFFF" opacity="0.7" />
    </>
  ) },
  '💔🧸': { label: 'a broken heart and a tear', art: (
    <>
      <path d="M24 44 L8 26 Q2 16 12 10 Q20 6 24 14 L20 22 L27 28 L22 36z" fill="#F87171" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 42 L33 34 L28 28 L33 20 L30 14 Q34 6 42 10 Q50 16 44 26z" fill="#F87171" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M62 8 Q72 24 72 32 Q72 42 62 42 Q52 42 52 32 Q52 24 62 8z" fill="#93C5FD" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="58" cy="30" rx="2.4" ry="4" fill="#FFFFFF" opacity="0.8" />
    </>
  ) },
  '🍦☀️': { label: 'an ice cream on a sunny day', art: (
    <>
      <path d="M14 26 L22 48 L30 26z" fill="#E7A65A" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 31 L27 31 M18.5 37 L25.5 37" stroke={SK} strokeWidth="1" opacity="0.5" />
      <circle cx="22" cy="20" r="10" fill="#FBCFE8" stroke={SK} strokeWidth="2" />
      <circle cx="19" cy="17" r="2" fill="#FFFFFF" />
      <circle cx="60" cy="24" r="10" fill="#FDE047" stroke={SK} strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <path key={a} d="M60 9 V4" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${a} 60 24)`} />)}
    </>
  ) },
  '🌧️⚽': { label: 'a rain cloud over a ball', art: (
    <>
      <path d="M14 26 Q6 26 8 18 Q10 10 20 13 Q24 4 34 8 Q42 6 42 16 Q50 18 46 26z" fill="#CBD5E1" stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      {[16, 26, 36].map(x => <path key={x} d={`M${x} 31 Q${x - 2} 35 ${x} 37 Q${x + 2} 35 ${x} 31z`} fill="#60A5FA" stroke={SK} strokeWidth="1" />)}
      <circle cx="62" cy="36" r="11" fill="#FFFFFF" stroke={SK} strokeWidth="2" />
      <path d="M62 30 L67 33 L65 39 L59 39 L57 33z" fill="#3b2416" />
    </>
  ) },
  '🎁🎀': { label: 'a present with a bow', art: (
    <>
      <rect x="12" y="24" width="30" height="22" fill="#A78BFA" stroke={SK} strokeWidth="2" />
      <rect x="10" y="18" width="34" height="8" fill="#C4B5FD" stroke={SK} strokeWidth="2" />
      <path d="M27 18 V46" stroke="#FDE047" strokeWidth="4" />
      <path d="M27 18 Q18 8 16 14 Q16 18 27 18 Q36 8 38 14 Q38 18 27 18z" fill="#FDE047" stroke={SK} strokeWidth="1.6" />
      <path d="M62 24 Q52 14 50 22 Q50 28 62 26 Q74 14 76 22 Q76 28 62 26z" fill="#F472B6" stroke={SK} strokeWidth="1.6" />
      <circle cx="62" cy="25" r="3" fill="#F472B6" stroke={SK} strokeWidth="1.4" />
      <path d="M60 27 L56 38 M64 27 L68 38" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
    </>
  ) },
  '🤕🩹': { label: 'an ouch and a bandage', art: (
    <>
      <path d="M22 10 L25 20 L35 18 L28 26 L34 34 L24 31 L20 41 L17 31 L7 33 L13 25 L6 17 L16 19z" fill="#FCA5A5" stroke={SK} strokeWidth="1.8" strokeLinejoin="round" />
      <g transform="rotate(-30 62 28)">
        <rect x="44" y="21" width="36" height="14" rx="7" fill="#F5D0A9" stroke={SK} strokeWidth="2" />
        <rect x="55" y="21" width="14" height="14" fill="#FDE7D0" stroke={SK} strokeWidth="1.4" />
        {[[49, 26], [49, 30], [75, 26], [75, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill={SK} />)}
      </g>
    </>
  ) },
};

/** the picture for a feeling riddle; unknown keys fall back to their text */
export function FeelingScene({ k, height }: { k: string; height: number }) {
  const sc = SCENE[k];
  if (!sc) return <span style={{ fontSize: height * 0.6 }}>{k}</span>;
  return (
    <svg width={height * 1.6} height={height} viewBox="0 0 80 50" role="img" aria-label={sc.label} style={{ display: 'inline-block' }}>
      <g filter="url(#kp-brush)">{sc.art}</g>
    </svg>
  );
}
