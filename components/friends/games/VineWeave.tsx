'use client';

// ── Vine Weave (Flick · clever hands) ──
// Grow a magic vine with one finger: drag the glowing tip from the seed,
// through the gap in each pair of branches, to the flower. Leaves sprout
// along the vine as it grows and Flick scampers along the ground under
// the tip, cheering at every gap. Brushing a branch only shakes a few
// leaves loose (the vine keeps growing), so a bump is never a dead end.
// At the flower it blooms and Flick leaps up to it.
// Difficulty: more branch pairs, narrower gaps, gaps further apart.
// Notices: branch bumps, gates passed, time (steady, planned finger moves).

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
import { tones } from '../voice';

interface Gate { x: number; y: number; h: number }
interface Pt { x: number; y: number }

function makeGates(difficulty: number): Gate[] {
  const n = 2 + Math.floor(difficulty / 3);
  const h = Math.max(7, 15 - difficulty * 0.9);             // half the gap height
  const spread = 12 + difficulty * 3;                        // how far gaps jump up and down
  let y = 50;
  return Array.from({ length: n }, (_, i) => {
    y = Math.min(72, Math.max(22, y + (Math.random() < 0.5 ? -1 : 1) * (spread * (0.5 + Math.random() / 2))));
    return { x: 20 + (i + 0.5) * (62 / n), y, h };
  });
}

const START: Pt = { x: 8, y: 52 };

export default function VineWeave({ difficulty, accent, say, onDone, pet, reaction }: RoundProps) {
  const [gates] = useState(() => makeGates(difficulty));
  const flower = { x: 91, y: gates[gates.length - 1].y };

  const [pts, setPts] = useState<Pt[]>([START]);
  const [leaves, setLeaves] = useState<{ x: number; y: number; a: number; side: number }[]>([]);
  const [wiggle, setWiggle] = useState(-1);
  const [passed, setPassed] = useState(0);
  const [bloom, setBloom] = useState(false);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const [flick, setFlick] = useState<Pt>({ x: 10, y: 98 });
  const { layer, fire } = useBursts();
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const st = useRef({ next: 0, touches: 0, startedAt: 0, done: false, grown: 0 });

  useEffect(() => { if (reaction === 'win') setMood('cheer'); }, [reaction, setMood]);

  function toLocal(e: React.PointerEvent): Pt {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  function down(e: React.PointerEvent) {
    if (st.current.done) return;
    const p = toLocal(e), tip = pts[pts.length - 1];
    if (Math.hypot(p.x - tip.x, p.y - tip.y) > 14) { say('Put your finger on the glowing tip!'); return; }
    drag.current = true;
    if (!st.current.startedAt) st.current.startedAt = Date.now();
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!drag.current || st.current.done) return;
    const p = toLocal(e), prev = pts[pts.length - 1];
    const step = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (step < 1.2) return;
    const s = st.current;
    const g = gates[s.next];
    if (g && prev.x < g.x && p.x >= g.x) {
      const y = prev.y + ((g.x - prev.x) / (p.x - prev.x)) * (p.y - prev.y);
      if (Math.abs(y - g.y) > g.h) {
        s.touches++;
        setWiggle(s.next);
        setTimeout(() => setWiggle(-1), 500);
        tones([{ f: 300, t: 0, d: 0.14 }]);
        fire(g.x, y, ['#7BC86C', '#F7B267', '#B5E48C'], 7, 40);
        setMood('oops');
      } else {
        tones([{ f: 660 + s.next * 70, t: 0, d: 0.12 }, { f: 880 + s.next * 70, t: 0.08, d: 0.16 }]);
        fire(g.x, g.y, [accent, '#FFFFFF', '#FFE066'], 10, 46);
        setMood('cheer');
      }
      s.next++;
      setPassed(s.next);
    }
    // a new leaf every few steps of growth, alternating sides
    s.grown += step;
    if (s.grown > 7) {
      s.grown = 0;
      const a = (Math.atan2(p.y - prev.y, p.x - prev.x) * 180) / Math.PI;
      setLeaves(l => [...l, { x: p.x, y: p.y, a, side: l.length % 2 ? 1 : -1 }]);
    }
    setPts(ps => [...ps, p]);
    setFlick({ x: Math.max(8, Math.min(92, p.x)), y: 98 });
    if (s.next >= gates.length && Math.hypot(p.x - flower.x, p.y - flower.y) < 8) {
      s.done = true;
      drag.current = false;
      setBloom(true);
      tones([{ f: 784, t: 0, d: 0.16 }, { f: 988, t: 0.12, d: 0.16 }, { f: 1175, t: 0.24, d: 0.3 }]);
      fire(flower.x, flower.y, [accent, '#FF9EC7', '#FFE066', '#FFFFFF'], 18, 80);
      setFlick({ x: 84, y: flower.y + 18 });
      setMood('cheer');
      setTimeout(() => onDone({ ok: s.touches <= 1, data: { bumps: s.touches, gates: gates.length, traceMs: Date.now() - s.startedAt } }), 900);
    }
  }

  function up() { drag.current = false; }

  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const tip = pts[pts.length - 1];

  return (
    <Stage world="flick" className="aspect-[4/4.6]">
      <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full block"
        style={{ touchAction: 'none', zIndex: 4 }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="img" aria-label="Drag the vine through the gaps to the flower">
        {/* the seed pot */}
        <g filter="url(#kp-brush)">
          <path d="M2 58 L14 58 L12 66 L4 66z" fill="#C8794A" stroke="#3b2416" strokeWidth="0.7" />
          <rect x="1.4" y="56" width="13.2" height="3" rx="1" fill="#E0925C" stroke="#3b2416" strokeWidth="0.6" />
        </g>
        {/* branch pairs */}
        {gates.map((g, i) => (
          <g key={i} className={wiggle === i ? 'shake' : undefined} style={{ transformOrigin: `${g.x}px ${g.y}px`, transformBox: 'view-box' }}>
            {[[-2, g.y - g.h], [g.y + g.h, 102]].map(([a, b], k) => (
              <g key={k} filter="url(#kp-brush)">
                <path d={`M ${g.x} ${a} C ${g.x - 3.5} ${(a + b) / 2}, ${g.x + 3.5} ${(a + b) / 2}, ${g.x} ${b}`}
                  stroke="#3b2416" strokeWidth="5.4" strokeLinecap="round" fill="none" />
                <path d={`M ${g.x} ${a} C ${g.x - 3.5} ${(a + b) / 2}, ${g.x + 3.5} ${(a + b) / 2}, ${g.x} ${b}`}
                  stroke="#9A6235" strokeWidth="3.8" strokeLinecap="round" fill="none" />
                <ellipse cx={g.x + 3.4} cy={k ? b - 5 : a + 5} rx="3.4" ry="1.7" fill="#5DBB63" stroke="#3b2416" strokeWidth="0.4" transform={`rotate(-30 ${g.x + 3.4} ${k ? b - 5 : a + 5})`} />
                <ellipse cx={g.x - 3.4} cy={(a + b) / 2} rx="3.4" ry="1.7" fill="#7BD07F" stroke="#3b2416" strokeWidth="0.4" transform={`rotate(30 ${g.x - 3.4} ${(a + b) / 2})`} />
              </g>
            ))}
            {/* a little glow in the gap that lights up once passed */}
            <circle cx={g.x} cy={g.y} r={Math.min(4, g.h * 0.4)} fill={i < passed ? accent : '#FFFFFF'} opacity={i < passed ? 0.45 : 0.25} className={i === passed ? 'fg-glow' : undefined}
              style={{ ['--glow' as string]: 0.3 } as React.CSSProperties} />
          </g>
        ))}
        {/* the flower to reach, on its own stem */}
        <path d={`M ${flower.x} 102 Q ${flower.x + 4} ${(flower.y + 102) / 2} ${flower.x} ${flower.y + 3}`} stroke="#3F9142" strokeWidth="1.6" fill="none" />
        <g transform={`translate(${flower.x} ${flower.y})`}>
          <g className={bloom ? 'fg-bloom' : 'fg-sway'} style={{ transformOrigin: 'center', transformBox: 'fill-box' }}>
            {[0, 72, 144, 216, 288].map(a => (
              <ellipse key={a} cx="0" cy="-3.6" rx="2.6" ry="3.8" fill={bloom ? '#FF8FC0' : accent} stroke="#3b2416" strokeWidth="0.5" transform={`rotate(${a})`} />
            ))}
            <circle r="2.3" fill="#FDE68A" stroke="#3b2416" strokeWidth="0.5" />
          </g>
        </g>
        {/* the vine so far: dark edge, green body, a light stripe */}
        <path d={d} stroke="#2E6B2E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={d} stroke="#6CC24A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={d} stroke="#B9F08F" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
        {leaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a + l.side * 55})`}>
            <path d="M0 0 Q3 -2.4 6 0 Q3 2.4 0 0z" fill={i % 3 ? '#5DBB63' : '#8BD45E'} stroke="#2E6B2E" strokeWidth="0.4" className="fg-sprout" />
          </g>
        ))}
        {/* the growing tip: where to put your finger */}
        {!bloom && <>
          <circle cx={tip.x} cy={tip.y} r="6.5" fill="#FFF8B0" opacity="0.35" className="soft-pulse" />
          <circle cx={tip.x} cy={tip.y} r="3.6" fill="#B6F58C" stroke="#FFFFFF" strokeWidth="1" />
        </>}
      </svg>
      <Actor art={pet.art} name={pet.name} x={flick.x} y={flick.y} h={58} mood={mood} moodKey={moodKey} moveMs={bloom ? 600 : 260} z={5} />
      {layer}
    </Stage>
  );
}
