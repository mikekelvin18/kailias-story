'use client';

// ── Vine Weave (Flick · clever hands) ──
// Grow a vine with one finger: drag it from the bud, through the gap in
// each pair of branches, to the flower. Brushing a branch only makes it
// wiggle (and the vine keeps growing), so a bump is never a dead end.
// Difficulty: more branch pairs, narrower gaps, gaps further apart.
// Notices: branch bumps, gates passed, time (steady, planned finger moves).

import { useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { tones } from '../voice';

interface Gate { x: number; y: number; h: number }

function makeGates(difficulty: number): Gate[] {
  const n = 2 + Math.floor(difficulty / 3);
  const h = Math.max(7, 15 - difficulty * 0.9);             // half the gap height
  const spread = 12 + difficulty * 3;                        // how far gaps jump up and down
  let y = 50;
  return Array.from({ length: n }, (_, i) => {
    y = Math.min(80, Math.max(20, y + (Math.random() < 0.5 ? -1 : 1) * (spread * (0.5 + Math.random() / 2))));
    return { x: 18 + (i + 0.5) * (66 / n), y, h };
  });
}

export default function VineWeave({ difficulty, accent, say, onDone }: RoundProps) {
  const [gates] = useState(() => makeGates(difficulty));
  const flower = { x: 93, y: gates[gates.length - 1].y };
  const startPt = { x: 6, y: 50 };

  const [pts, setPts] = useState([startPt]);
  const [wiggle, setWiggle] = useState(-1);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const st = useRef({ next: 0, touches: 0, startedAt: 0, done: false });

  function toLocal(e: React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  }

  function down(e: React.PointerEvent) {
    if (st.current.done) return;
    const p = toLocal(e), tip = pts[pts.length - 1];
    if (Math.hypot(p.x - tip.x, p.y - tip.y) > 14) { say('Start from the end of the vine!'); return; }
    drag.current = true;
    if (!st.current.startedAt) st.current.startedAt = Date.now();
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!drag.current || st.current.done) return;
    const p = toLocal(e), prev = pts[pts.length - 1];
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < 1.2) return;
    const s = st.current;
    const g = gates[s.next];
    if (g && prev.x < g.x && p.x >= g.x) {
      const y = prev.y + ((g.x - prev.x) / (p.x - prev.x)) * (p.y - prev.y);
      if (Math.abs(y - g.y) > g.h) {
        s.touches++;
        setWiggle(s.next);
        setTimeout(() => setWiggle(-1), 450);
        tones([{ f: 300, t: 0, d: 0.14 }]);
      } else {
        tones([{ f: 660 + s.next * 70, t: 0, d: 0.14 }]);
      }
      s.next++;
    }
    setPts(ps => [...ps, p]);
    if (s.next >= gates.length && Math.hypot(p.x - flower.x, p.y - flower.y) < 8) {
      s.done = true;
      drag.current = false;
      onDone({ ok: s.touches <= 1, data: { bumps: s.touches, gates: gates.length, traceMs: Date.now() - s.startedAt } });
    }
  }

  function up() { drag.current = false; }

  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="w-full rounded-3xl overflow-hidden select-none" style={{ background: 'rgba(255,255,255,0.07)', touchAction: 'none' }}>
      <svg ref={svgRef} viewBox="0 0 100 100" className="w-full aspect-square block"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="img" aria-label="Drag the vine through the gaps to the flower">
        {/* branch pairs */}
        {gates.map((g, i) => (
          <g key={i} className={wiggle === i ? 'shake' : undefined} style={{ transformOrigin: `${g.x}px ${g.y}px` }}>
            {[[0, g.y - g.h], [g.y + g.h, 100]].map(([a, b], k) => (
              <g key={k}>
                <path d={`M ${g.x} ${a} C ${g.x - 3} ${(a + b) / 2}, ${g.x + 3} ${(a + b) / 2}, ${g.x} ${b}`}
                  stroke="#7A4A26" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <ellipse cx={g.x + 3} cy={k ? b - 4 : a + 4} rx="3" ry="1.6" fill="#4CAF50" transform={`rotate(-30 ${g.x + 3} ${k ? b - 4 : a + 4})`} />
                <ellipse cx={g.x - 3} cy={(a + b) / 2} rx="3" ry="1.6" fill="#66BB6A" transform={`rotate(30 ${g.x - 3} ${(a + b) / 2})`} />
              </g>
            ))}
          </g>
        ))}
        {/* the flower to reach */}
        <g transform={`translate(${flower.x} ${flower.y})`}>
          {[0, 72, 144, 216, 288].map(a => (
            <ellipse key={a} cx="0" cy="-3.2" rx="2.2" ry="3.2" fill={accent} transform={`rotate(${a})`} />
          ))}
          <circle r="2" fill="#FDE68A" />
        </g>
        {/* the vine so far */}
        <path d={d} stroke="#3F9142" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* the growing tip: where to put your finger */}
        <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.6" fill="#8BD48E" stroke="#FFFFFF" strokeWidth="1" className="soft-pulse" />
      </svg>
    </div>
  );
}
