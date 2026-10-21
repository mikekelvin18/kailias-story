'use client';

// ── Kailia's Garden: things you can touch ──
// Each prop is a small drawing in its own box (sizes in world px) with
// the states the quest needs. They know nothing about the quest: the game
// tells them their state (open, pouring, bloomed, rustling…).
//
// TEMPORARY ART: drawn in code to match Kelvin's painted style until
// painted pictures replace them (see assets.ts).

import { INK, LINE, PALETTE as P, SHADOW } from '@/lib/world/artBible';

const brush = 'url(#kp-brush)';

export function ToyChest({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 150 130" width="150" height="130" className="overflow-visible" aria-hidden="true">
      <ellipse cx="75" cy="124" rx="72" ry="9" fill={SHADOW} />
      <g filter={brush} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        {/* inside of the box shows when the lid is up */}
        <rect x="12" y="52" width="126" height="18" fill="#5E3A22" />
        <path d="M8 60 H142 V118 Q142 124 136 124 H14 Q8 124 8 118Z" fill={P.wood} />
        <path d="M8 84 H142" stroke={P.woodDeep} strokeWidth="5" />
        <path d="M28 60 V124 M122 60 V124" stroke={P.woodDeep} strokeWidth="8" />
        {/* the star painted on the front: this is where the star ball lives */}
        <path d="M75 72l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill={P.starGold} strokeWidth="2" />
        <g style={{ transform: open ? 'rotate(-62deg)' : 'none', transformOrigin: '10px 58px', transition: 'transform 0.45s cubic-bezier(.3,1.6,.5,1)' }}>
          <path d="M6 60 Q6 24 75 22 Q144 24 144 60Z" fill="#D99A66" />
          <path d="M28 58 Q28 32 32 28 M122 58 Q122 32 118 28" stroke={P.woodDeep} strokeWidth="8" fill="none" />
          <rect x="66" y="50" width="18" height="14" rx="3" fill={P.starGold} strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}

export function WateringCan({ tilt }: { tilt: boolean }) {
  return (
    <svg viewBox="0 0 140 110" width="140" height="110" className="overflow-visible" aria-hidden="true">
      {!tilt && <ellipse cx="66" cy="104" rx="52" ry="7" fill={SHADOW} />}
      <g style={{ transform: tilt ? 'rotate(-34deg)' : 'none', transformOrigin: '60px 70px', transition: 'transform 0.25s ease-out' }}>
        <g filter={brush} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
          <path d="M84 62 L128 26 L134 32 L96 76Z" fill="#5FA8D3" />
          <ellipse cx="132" cy="28" rx="9" ry="13" transform="rotate(40 132 28)" fill="#7CC0E6" />
          <path d="M22 40 Q22 34 28 34 H92 Q98 34 98 40 V96 Q98 102 92 102 H28 Q22 102 22 96Z" fill="#7CC0E6" />
          <path d="M36 34 Q36 6 60 6 Q84 6 84 34" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
          <path d="M36 34 Q36 6 60 6 Q84 6 84 34" fill="none" stroke="#5FA8D3" strokeWidth="7" strokeLinecap="round" />
          <path d="M22 56 H98" stroke="#5FA8D3" strokeWidth="5" />
          <path d="M32 46 Q34 42 40 42" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      </g>
      {tilt && (
        <g aria-hidden="true">
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i} className="gw-drip" cx={150 + (i % 3) * 8} cy={40} r="5" fill="#8FD3F0" stroke="#4B9FC4" strokeWidth="1.5"
              style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </g>
      )}
    </svg>
  );
}

/** the sunflower: drooped and asleep until watered, then blooms and points right */
export function Sunflower({ lift, bloomed }: { lift: number; bloomed: boolean }) {
  // head angle: 70° drooped → 0° upright → -14° when it points across the stream
  const angle = bloomed ? -14 : 70 * (1 - lift);
  const petals = Array.from({ length: 14 }, (_, i) => i * (360 / 14));
  return (
    <svg viewBox="0 0 220 340" width="220" height="340" className="overflow-visible" aria-hidden="true">
      <ellipse cx="110" cy="334" rx="46" ry="8" fill={SHADOW} />
      <g filter={brush} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <path d="M108 334 Q100 240 112 150" fill="none" stroke={INK} strokeWidth="16" strokeLinecap="round" />
        <path d="M108 334 Q100 240 112 150" fill="none" stroke={P.leafDeep} strokeWidth="10" strokeLinecap="round" />
        <path d="M104 270 Q60 250 44 214 Q86 214 106 252Z" fill={P.leaf} />
        <path d="M106 226 Q150 214 172 180 Q130 176 106 208Z" fill={P.leaf} />
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '112px 150px', transition: 'transform 0.5s cubic-bezier(.3,1.4,.5,1)' }}>
          <g transform="translate(112 92)">
            {petals.map(a => (
              <ellipse key={a} cx="0" cy={bloomed ? -50 : -36} rx="13" ry={bloomed ? 26 : 16} transform={`rotate(${a})`}
                fill={bloomed ? P.petal : '#E8C65A'} style={{ transition: 'all 0.6s cubic-bezier(.3,1.5,.5,1)' }} />
            ))}
            <circle r={bloomed ? 38 : 32} fill="#8C5A35" style={{ transition: 'r 0.5s' }} />
            {/* face */}
            {bloomed ? (
              <g stroke="none">
                <circle cx="-13" cy="-6" r="6" fill={INK} /><circle cx="13" cy="-6" r="6" fill={INK} />
                <circle cx="-11" cy="-8" r="2" fill="#FFFFFF" /><circle cx="15" cy="-8" r="2" fill="#FFFFFF" />
                <path d="M-12 10 Q0 22 12 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
                <circle cx="-24" cy="8" r="6" fill={P.blush} opacity="0.8" /><circle cx="24" cy="8" r="6" fill={P.blush} opacity="0.8" />
              </g>
            ) : (
              <g fill="none" strokeWidth="4" strokeLinecap="round">
                <path d="M-19 -4 Q-13 2 -7 -4 M7 -4 Q13 2 19 -4" />
                <path d="M-5 12 Q0 15 5 12" />
              </g>
            )}
          </g>
        </g>
        {/* a simple pot */}
        <path d="M78 300 H142 L136 334 H84Z" fill="#D9715B" />
        <rect x="72" y="292" width="76" height="16" rx="5" fill="#E58A70" />
      </g>
      {!bloomed && lift < 0.1 && (
        <g className="gw-zzz" fill={INK} stroke="none" fontFamily="var(--font-baloo), sans-serif" fontWeight="800">
          <text x="150" y="110" fontSize="22">z</text><text x="166" y="88" fontSize="28">z</text>
        </g>
      )}
    </svg>
  );
}

export function Stone({ v }: { v: number }) {
  const fills = ['#BDB6AA', '#C7C0B3', '#B2AB9E', '#C2B9A9'];
  return (
    <svg viewBox="0 0 96 64" width="96" height="64" className="overflow-visible" aria-hidden="true">
      <ellipse cx="48" cy="58" rx="42" ry="6" fill={SHADOW} />
      <g filter={brush} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <path d={v % 2 ? 'M8 44 Q4 22 26 14 Q50 6 74 14 Q92 22 88 42 Q84 56 48 56 Q12 56 8 44Z' : 'M6 40 Q8 18 34 12 Q64 8 82 20 Q94 32 86 46 Q74 58 44 56 Q10 54 6 40Z'}
          fill={fills[v % 4]} />
        <path d="M22 26 Q34 18 50 18" stroke="#E4DED4" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M18 48 Q48 54 80 44" stroke={P.stoneDeep} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

/** the glowing spot in the water where a stone can go */
export function StoneSlot() {
  return (
    <svg viewBox="0 0 96 50" width="96" height="50" className="overflow-visible" aria-hidden="true">
      <ellipse className="gw-slot" cx="48" cy="25" rx="40" ry="17" fill="#FFF8D6" fillOpacity="0.35" stroke="#FFF3B0" strokeWidth="4" strokeDasharray="10 8" />
    </svg>
  );
}

const BUSH_COLORS = [
  { body: P.leaf, deep: P.leafDeep, dot: '#E9534A' },
  { body: '#7DC98A', deep: '#4E9E60', dot: '#FFFFFF' },
  { body: '#66B87A', deep: '#3E8A52', dot: '#B994F2' },
  { body: '#82CF7C', deep: '#4F9E4E', dot: P.petal },
];

export function Bush({ v, searched }: { v: number; searched: boolean }) {
  const c = BUSH_COLORS[v % BUSH_COLORS.length];
  return (
    <svg viewBox="0 0 190 140" width="190" height="140" className="overflow-visible" aria-hidden="true">
      <ellipse cx="95" cy="134" rx="86" ry="10" fill={SHADOW} />
      <g filter={brush} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <path d="M14 128 Q2 100 22 84 Q16 52 48 44 Q60 14 96 18 Q130 12 144 44 Q178 50 172 84 Q190 102 176 128Z" fill={c.body} />
        <path d="M40 92 Q60 76 84 84 M110 70 Q130 56 150 72 M60 58 Q76 48 96 54" stroke={c.deep} strokeWidth="6" fill="none" strokeLinecap="round" />
        {!searched && [[44, 70], [80, 40], [126, 46], [150, 96], [100, 104], [58, 112]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" fill={c.dot} strokeWidth="2" />
        ))}
      </g>
    </svg>
  );
}

export function StarBall({ size = 64, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="overflow-visible" aria-hidden="true">
      {glow && <circle className="fg-glow" cx="32" cy="32" r="34" fill="#FFF3B0" opacity="0.6" />}
      <circle cx="32" cy="32" r="26" fill={P.starGold} stroke={INK} strokeWidth="3" />
      <path d="M32 14l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#FFF8DA" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 34 Q32 46 56 34" stroke={P.starGoldDeep} strokeWidth="3" fill="none" />
      <path d="M16 20 Q22 12 30 11" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function Ladybug({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 34" width={size} height={size * 0.85} className="overflow-visible" aria-hidden="true">
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <circle cx="31" cy="17" r="7" fill={INK} />
        <path d="M4 18 Q4 4 18 4 Q32 4 32 18 Q32 30 18 30 Q4 30 4 18Z" fill="#E9534A" />
        <path d="M18 4 V30" />
        <circle cx="11" cy="12" r="3" fill={INK} stroke="none" /><circle cx="25" cy="13" r="3" fill={INK} stroke="none" />
        <circle cx="12" cy="23" r="2.6" fill={INK} stroke="none" /><circle cx="24" cy="24" r="2.6" fill={INK} stroke="none" />
        <path d="M10 8 Q13 6 16 6" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
      </g>
    </svg>
  );
}

export function Frog({ hop }: { hop: boolean }) {
  return (
    <svg viewBox="0 0 120 80" width="120" height="80" className="overflow-visible" aria-hidden="true">
      <ellipse cx="60" cy="62" rx="56" ry="15" fill="#5CB57A" stroke={INK} strokeWidth={LINE} />
      <path d="M60 62 L104 56" stroke={INK} strokeWidth="2" />
      <g className={hop ? 'gw-hop' : 'gw-breathe'} style={{ transformOrigin: '60px 64px' }}>
        <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
          <path d="M30 60 Q26 34 46 28 Q60 24 74 28 Q94 34 90 60Z" fill="#8BD06F" />
          <circle cx="46" cy="26" r="11" fill="#8BD06F" /><circle cx="74" cy="26" r="11" fill="#8BD06F" />
          <circle cx="46" cy="25" r="5" fill={INK} /><circle cx="74" cy="25" r="5" fill={INK} />
          <path d="M48 44 Q60 52 72 44" fill="none" strokeLinecap="round" />
          <path d="M28 60 Q20 62 22 56 M92 60 Q100 62 98 56" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function LeafPile({ scattered }: { scattered: boolean }) {
  const leaves = [[20, 40, '#F7B267'], [44, 30, '#F4845F'], [70, 36, '#E9C46A'], [96, 28, '#F7B267'], [118, 40, '#F4845F'], [56, 48, '#E9C46A'], [86, 50, '#F7B267']] as const;
  return (
    <svg viewBox="0 0 140 70" width="140" height="70" className="overflow-visible" aria-hidden="true">
      <ellipse cx="70" cy="62" rx="64" ry="8" fill={SHADOW} />
      <g stroke={INK} strokeWidth="2.5">
        {leaves.map(([x, y, c], i) => (
          <g key={i} style={{ transform: scattered ? `translate(${(i - 3) * 30}px, ${-30 - (i % 3) * 20}px) rotate(${(i - 3) * 50}deg)` : 'none',
            opacity: scattered ? 0 : 1, transition: `transform 0.7s cubic-bezier(.2,.8,.3,1) ${i * 0.03}s, opacity 0.5s ease ${0.4 + i * 0.03}s`,
            transformOrigin: `${x}px ${y}px` }}>
            <path d={`M${x - 16} ${y} Q${x} ${y - 16} ${x + 16} ${y} Q${x} ${y + 16} ${x - 16} ${y}Z`} fill={c} />
            <path d={`M${x - 12} ${y} H${x + 12}`} strokeWidth="1.5" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** little friends that pop out of bushes that do not hide the ball */
export function Butterfly() {
  return (
    <svg viewBox="0 0 60 50" width="60" height="50" className="overflow-visible" aria-hidden="true">
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <g className="gw-flap" style={{ transformOrigin: '30px 25px' }}>
          <path d="M30 24 Q12 2 4 14 Q0 28 28 28Z" fill="#B994F2" />
          <path d="M30 24 Q48 2 56 14 Q60 28 32 28Z" fill="#B994F2" />
          <path d="M28 28 Q10 34 14 44 Q22 48 30 30Z" fill={P.blush} />
          <path d="M32 28 Q50 34 46 44 Q38 48 30 30Z" fill={P.blush} />
        </g>
        <path d="M30 16 V40" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Snail() {
  return (
    <svg viewBox="0 0 70 50" width="70" height="50" className="overflow-visible" aria-hidden="true">
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M4 46 Q30 40 62 46 Q66 34 56 30 L60 14 M56 30 L50 14" fill="#F2D6A2" strokeLinecap="round" />
        <circle cx="30" cy="28" r="17" fill="#D99A66" />
        <path d="M30 28 m-9 0 a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5" fill="none" />
        <circle cx="60" cy="13" r="3" fill={INK} /><circle cx="50" cy="13" r="3" fill={INK} />
      </g>
    </svg>
  );
}

/** the shelf by the cottage window where stickers (found treasures) sit */
export function TreasureShelf({ ball, ladybugs }: { ball: boolean; ladybugs: number }) {
  return (
    <svg viewBox="0 0 130 60" width="130" height="60" className="overflow-visible" aria-hidden="true">
      <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <rect x="4" y="44" width="122" height="12" rx="4" fill={P.wood} />
        <path d="M18 56 L26 60 M112 56 L104 60" strokeWidth="4" />
      </g>
      {ball && <g transform="translate(14 6)"><StarBall size={40} glow={false} /></g>}
      {Array.from({ length: ladybugs }, (_, i) => (
        <g key={i} transform={`translate(${62 + i * 20} ${28})`}><Ladybug size={20} /></g>
      ))}
    </svg>
  );
}
