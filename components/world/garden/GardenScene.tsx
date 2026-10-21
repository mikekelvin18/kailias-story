'use client';

// ── Kailia's Garden: the painted place ──
// The still parts of the garden, in world px (2400 x 1000), split into
// the layers WorldStage moves at different speeds:
//   Sky     — fixed to the screen: soft sky, the sun, drifting clouds
//   Far     — distant hills (drift at 0.3)
//   Mid     — the tree line behind the garden (0.6)
//   Ground  — grass, the path, the stream, the cottage, the fence, the
//             apple tree and birdhouse (moves with the camera)
//   Front   — grass tufts nearest the viewer (1.15)
// Interactive things (chest, can, sunflower, stones, bushes, critters) are
// not here; they live in GardenProps.tsx so they can move and be tapped.
//
// Art rules (lib/world/artBible.ts): one ink outline colour, light from
// the upper left, soft contact shadows, gradients only in sky and water.
// Everything in this file is drawn in code as a TEMPORARY stand-in for
// painted pictures; see assets.ts for the swap list.

import { memo, type CSSProperties } from 'react';
import { INK, LINE, PALETTE as P, SHADOW } from '@/lib/world/artBible';

export const WORLD_W = 2400;
export const WORLD_H = 1000;

// ── the stream: banks narrow toward the horizon ──
export const STREAM = { top: 600, bottom: 1000, l0: 1432, l1: 1352, r0: 1530, r1: 1632 };
export function streamEdges(y: number) {
  const t = Math.max(0, Math.min(1, (y - STREAM.top) / (STREAM.bottom - STREAM.top)));
  return { l: STREAM.l0 + (STREAM.l1 - STREAM.l0) * t, r: STREAM.r0 + (STREAM.r1 - STREAM.r0) * t };
}
/** the row Kailia crosses on */
export const CROSS_Y = 800;

const seeded = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

function Cloud({ w, top, dur, delay, opacity }: { w: number; top: string; dur: number; delay: number; opacity: number }) {
  return (
    <div className="fg-drift absolute left-0" style={{ top, animationDuration: `${dur}s`, animationDelay: `${-delay}s`, opacity }}>
      <svg viewBox="0 0 120 56" width={w} aria-hidden="true">
        <g filter="url(#kp-brush)">
          <path d="M14 46 Q4 46 6 37 Q8 28 20 30 Q22 16 38 17 Q46 4 62 9 Q74 2 84 14 Q100 12 102 26 Q116 28 112 40 Q110 47 100 46 Z"
            fill="#FFFFFF" stroke="#E3F1F8" strokeWidth="2" />
          <path d="M18 44 Q50 50 98 44" stroke="#D5E9F3" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export const GardenSky = memo(function GardenSky() {
  return (
    <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${P.skyDeep} 0%, ${P.sky} 62%, #EAF8FC 100%)` }}>
      {/* the sun, upper left: the one light in every scene */}
      <svg className="absolute" style={{ left: '6%', top: '5%' }} width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="56" fill="#FFF6C9" opacity="0.45" />
        <circle cx="60" cy="60" r="38" fill="#FFE98A" stroke="#F3C94B" strokeWidth="3" />
      </svg>
      <Cloud w={190} top="8%" dur={150} delay={20} opacity={0.95} />
      <Cloud w={130} top="20%" dur={110} delay={70} opacity={0.85} />
      <Cloud w={240} top="3%" dur={190} delay={120} opacity={0.9} />
      <Cloud w={110} top="30%" dur={130} delay={10} opacity={0.7} />
    </div>
  );
});

export const GardenFar = memo(function GardenFar() {
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
      <g filter="url(#kp-brush)">
        <path d="M-400 600 Q-200 420 60 470 Q280 380 520 455 Q760 360 1020 450 Q1260 390 1500 448 Q1760 370 2020 452 Q2260 400 2500 460 Q2700 420 2900 470 V640 H-400Z"
          fill={P.hillFar} stroke="#8FC79C" strokeWidth={LINE} />
        {/* a few far trees: tiny, soft, no outline weight */}
        {Array.from({ length: 22 }, (_, i) => {
          const x = -300 + i * 150 + seeded(i) * 60, y = 470 + seeded(i, 1) * 40, r = 16 + seeded(i, 2) * 10;
          return <g key={i}><rect x={x - 3} y={y} width="6" height={r} fill="#7FB58A" /><circle cx={x} cy={y} r={r} fill="#93CDA0" stroke="#7FB58A" strokeWidth="2" /></g>;
        })}
      </g>
    </svg>
  );
});

export const GardenMid = memo(function GardenMid() {
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
      <g filter="url(#kp-brush)" stroke={INK} strokeWidth={LINE}>
        <path d="M-300 640 V560 Q-200 520 -100 548 Q0 500 120 540 Q260 490 400 532 Q540 488 700 530 Q860 484 1020 528 Q1180 492 1340 534 Q1500 486 1660 530 Q1820 490 1980 532 Q2140 486 2300 530 Q2460 494 2700 540 V640Z"
          fill={P.hillMid} />
        {Array.from({ length: 16 }, (_, i) => {
          const x = -200 + i * 190 + seeded(i, 5) * 70;
          const h = 90 + seeded(i, 6) * 60;
          const w = 70 + seeded(i, 7) * 30;
          const deep = i % 3 === 0;
          return (
            <g key={i}>
              <rect x={x - 8} y={560 - h * 0.35} width="16" height={h * 0.4} fill={P.woodDeep} />
              <path d={`M${x - w} ${560 - h * 0.3} Q${x - w} ${560 - h} ${x} ${560 - h} Q${x + w} ${560 - h} ${x + w} ${560 - h * 0.3} Q${x} ${560 - h * 0.1} ${x - w} ${560 - h * 0.3}Z`}
                fill={deep ? P.leafDeep : P.leaf} />
            </g>
          );
        })}
      </g>
    </svg>
  );
});

function Cottage() {
  return (
    <g>
      <ellipse cx="290" cy="662" rx="230" ry="20" fill={SHADOW} />
      {/* chimney */}
      <path d="M370 330 V250 H418 V372Z" fill="#C7826A" stroke={INK} strokeWidth={LINE} />
      <rect x="362" y="238" width="64" height="18" rx="6" fill="#B06C55" stroke={INK} strokeWidth={LINE} />
      {/* walls */}
      <path d="M128 440 H452 V656 H128Z" fill={P.wall} stroke={INK} strokeWidth={LINE} />
      <path d="M128 600 H452" stroke="#EBCF9E" strokeWidth="8" />
      {/* timber */}
      <path d="M128 440 V656 M452 440 V656" stroke={P.woodDeep} strokeWidth="10" />
      {/* roof: a round thatch-like cap */}
      <path d="M92 462 Q110 410 160 360 Q228 284 290 262 Q352 284 420 360 Q470 410 488 462 Q470 478 446 470 Q418 480 392 470 Q364 482 336 470 Q306 482 280 470 Q252 482 224 470 Q196 482 168 470 Q140 480 112 472 Q94 474 92 462Z"
        fill={P.roof} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M150 420 Q290 380 430 420 M185 375 Q290 340 395 375" stroke={P.roofDeep} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* round window, left */}
      <circle cx="196" cy="530" r="38" fill="#9ED7EE" stroke={INK} strokeWidth={LINE} />
      <path d="M196 492 V568 M158 530 H234" stroke={INK} strokeWidth="5" />
      <path d="M176 512 Q186 502 198 500" stroke="#FFFFFF" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* door */}
      <path d="M248 656 V560 Q248 518 290 518 Q332 518 332 560 V656Z" fill="#8C5A35" stroke={INK} strokeWidth={LINE} />
      <path d="M268 650 V568 Q268 540 290 538 M312 650 V568" stroke="#73472A" strokeWidth="5" fill="none" />
      <circle cx="318" cy="604" r="6" fill={P.starGold} stroke={INK} strokeWidth="2" />
      {/* square window, right, with a flower box */}
      <rect x="352" y="488" width="76" height="70" rx="10" fill="#9ED7EE" stroke={INK} strokeWidth={LINE} />
      <path d="M390 488 V558 M352 523 H428" stroke={INK} strokeWidth="5" />
      <rect x="344" y="560" width="92" height="22" rx="6" fill={P.wood} stroke={INK} strokeWidth={LINE} />
      {[358, 380, 402, 424].map((x, i) => (
        <g key={x}><circle cx={x} cy={552} r="10" fill={i % 2 ? P.blush : P.petal} stroke={INK} strokeWidth="2" /><circle cx={x} cy={552} r="3.5" fill={INK} /></g>
      ))}
      {/* doorstep */}
      <path d="M236 656 H344 L352 670 H228Z" fill={P.stone} stroke={INK} strokeWidth={LINE} />
    </g>
  );
}

function Fence() {
  const posts = Array.from({ length: 15 }, (_, i) => 500 + i * 56);
  return (
    <g>
      <path d="M492 606 H1316 M492 634 H1316" stroke={INK} strokeWidth="14" strokeLinecap="round" />
      <path d="M492 606 H1316 M492 634 H1316" stroke={P.wood} strokeWidth="8" strokeLinecap="round" />
      {posts.map(x => (
        <path key={x} d={`M${x - 11} 652 V592 L${x} 578 L${x + 11} 592 V652Z`} fill="#E2A979" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      ))}
    </g>
  );
}

function Stream() {
  const { top, bottom, l0, l1, r0, r1 } = STREAM;
  return (
    <g>
      <defs>
        <linearGradient id="gw-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9AD6EA" /><stop offset="1" stopColor={P.waterDeep} />
        </linearGradient>
      </defs>
      {/* banks */}
      <path d={`M${l0 - 18} ${top} Q${l0 - 40} 760 ${l1 - 26} ${bottom} H${r1 + 26} Q${r0 + 46} 760 ${r0 + 18} ${top}Z`} fill="#C9A77A" stroke={INK} strokeWidth={LINE} />
      <path d={`M${l0} ${top} Q${l0 - 22} 760 ${l1} ${bottom} H${r1} Q${r0 + 26} 760 ${r0} ${top}Z`} fill="url(#gw-water)" stroke={INK} strokeWidth={LINE} />
    </g>
  );
}

/** the moving water and reeds: kept out of the brush filter (an animated
 *  shape inside a filtered group makes the browser redo the filter over the
 *  whole group every frame) */
function StreamLife() {
  const { l0, l1, r0, r1 } = STREAM;
  return (
    <g>
      {/* ripples drift downstream */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <path key={i} className="gw-ripple" d={`M${1450 + (i % 3) * 30} ${640 + i * 60} q14 -6 28 0 t28 0`}
          stroke="#E6F7FC" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8"
          style={{ animationDelay: `${-i * 0.9}s` }} />
      ))}
      {/* reeds on the banks */}
      {[[l1 - 30, 980], [l0 - 30, 660], [r1 + 22, 960], [r0 + 30, 700]].map(([x, y], i) => (
        <g key={i} className="fg-sway" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-i}s` }}>
          <path d={`M${x} ${y} q-6 -50 -2 -84 M${x + 8} ${y} q4 -44 12 -70 M${x - 8} ${y} q-12 -36 -20 -56`} stroke={P.leafDeep} strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx={x - 2} cy={y - 88} rx="6" ry="16" fill="#8C5A35" stroke={INK} strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

function AppleTree() {
  return (
    <g>
      <ellipse cx="2160" cy="652" rx="130" ry="16" fill={SHADOW} />
      <path d="M2132 652 Q2140 560 2128 480 L2192 480 Q2180 560 2190 652Z" fill={P.woodDeep} stroke={INK} strokeWidth={LINE} />
      <path d="M2160 520 Q2120 470 2080 450 M2166 500 Q2200 460 2240 444" stroke={P.woodDeep} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M2000 430 Q1990 330 2080 300 Q2130 220 2220 260 Q2320 260 2320 350 Q2350 430 2280 470 Q2220 510 2150 490 Q2070 510 2030 480 Q1990 470 2000 430Z"
        fill={P.leaf} stroke={INK} strokeWidth={LINE} />
      <path d="M2050 400 Q2090 360 2140 370 M2190 330 Q2240 320 2270 350" stroke={P.leafDeep} strokeWidth="6" fill="none" strokeLinecap="round" />
      {[[2060, 440], [2120, 330], [2210, 300], [2280, 410], [2170, 450], [2240, 370]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="13" fill="#E9534A" stroke={INK} strokeWidth="2.5" /><circle cx={x - 4} cy={y - 4} r="3.5" fill="#FFFFFF" opacity="0.7" /></g>
      ))}
    </g>
  );
}

function Birdhouse() {
  return (
    <g>
      <ellipse cx="1950" cy="654" rx="40" ry="8" fill={SHADOW} />
      <rect x="1943" y="500" width="14" height="154" fill={P.wood} stroke={INK} strokeWidth={LINE} />
      <path d="M1904 500 V440 L1950 404 L1996 440 V500Z" fill="#7DB6E8" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      <path d="M1894 446 L1950 396 L2006 446" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1894 446 L1950 396 L2006 446" fill="none" stroke={P.roof} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="1950" cy="455" r="13" fill={INK} />
      <rect x="1944" y="474" width="12" height="5" rx="2" fill={P.woodDeep} />
    </g>
  );
}

function FlowerBed({ x, y, seed }: { x: number; y: number; seed: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 14} rx="120" ry="34" fill="#9C6B45" stroke={INK} strokeWidth={LINE} />
      {Array.from({ length: 9 }, (_, i) => {
        const fx = x - 95 + i * 24 + seeded(i, seed) * 10, fy = y - 6 + seeded(i, seed + 1) * 22;
        const c = [P.blush, P.petal, '#B994F2', '#FFFFFF'][i % 4];
        return (
          <g key={i}>
            <path d={`M${fx} ${fy + 20} V${fy}`} stroke={P.leafDeep} strokeWidth="4" />
            <circle cx={fx} cy={fy} r="11" fill={c} stroke={INK} strokeWidth="2.5" />
            <circle cx={fx} cy={fy} r="4" fill={i % 4 === 1 ? '#E08A1E' : P.petal} />
          </g>
        );
      })}
    </g>
  );
}

function Path() {
  const d = 'M290 662 Q420 720 640 760 Q900 800 1120 790 Q1260 786 1360 800 M1620 800 Q1760 790 1880 800 Q2040 812 2200 790';
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth="78" />
      <path d={d} stroke={P.path} strokeWidth="72" />
      {[[520, 726], [760, 774], [990, 794], [1220, 790], [1740, 794], [2010, 806]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="14" ry="6" fill="#D9BC86" />
      ))}
    </g>
  );
}

export const GardenGround = memo(function GardenGround() {
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true">
      <g filter="url(#kp-brush)">
        {/* lawn: lighter toward the viewer, stripes like a toy mat */}
        <path d="M-400 600 Q600 580 1400 600 Q2000 590 2800 604 V1400 H-400Z" fill={P.grass} stroke={INK} strokeWidth={LINE} />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M-400 ${660 + i * 52} Q1200 ${640 + i * 54} 2800 ${662 + i * 52}`} stroke={P.grassDeep} strokeWidth="10" fill="none" opacity="0.35" />
        ))}
        {/* back hedge closing the garden on the right */}
        <path d="M2330 640 Q2320 560 2370 540 Q2420 500 2470 540 Q2520 560 2510 650Z" fill={P.leafDeep} stroke={INK} strokeWidth={LINE} />
        <Path />
        <Stream />
        <Fence />
        <AppleTree />
        <Birdhouse />
        <Cottage />
        <FlowerBed x={230} y={880} seed={3} />
        <FlowerBed x={1980} y={980} seed={8} />
        {/* grass tufts on the lawn */}
        {Array.from({ length: 26 }, (_, i) => {
          const x = 80 + i * 92 + seeded(i, 11) * 40, y = 680 + seeded(i, 12) * 280;
          const e = streamEdges(y);
          if (x > e.l - 40 && x < e.r + 40) return null;
          return <path key={i} d={`M${x - 12} ${y} q2 -18 6 -22 M${x} ${y} q0 -24 2 -30 M${x + 12} ${y} q-2 -18 -6 -22`} stroke={P.leafDeep} strokeWidth="4" fill="none" strokeLinecap="round" />;
        })}
      </g>
    </svg>
  );
});

export const GardenGroundLife = memo(function GardenGroundLife() {
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true">
      <StreamLife />
    </svg>
  );
});

export const GardenFront = memo(function GardenFront() {
  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
      {/* no brush filter here: these sway, and a filter would be redone every frame */}
      <g stroke={INK} strokeWidth={LINE}>
        {[[40, 1010], [520, 1020], [980, 1016], [1900, 1014], [2380, 1012]].map(([x, y], i) => (
          <g key={i} className="fg-sway" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-i * 0.8}s`, '--sway-deg': '3deg' } as CSSProperties}>
            <path d={`M${x - 70} ${y} Q${x - 60} ${y - 70} ${x - 30} ${y - 90} Q${x - 30} ${y - 40} ${x - 10} ${y - 20} Q${x} ${y - 100} ${x + 30} ${y - 120} Q${x + 24} ${y - 50} ${x + 40} ${y - 30} Q${x + 60} ${y - 80} ${x + 80} ${y - 86} Q${x + 70} ${y - 30} ${x + 80} ${y}Z`}
              fill={i % 2 ? P.leafDeep : P.leaf} />
          </g>
        ))}
      </g>
    </svg>
  );
});
