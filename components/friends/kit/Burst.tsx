'use client';

// ── Bursts: a pop of sparkles where something good happened ──
// fire(x, y) at a % spot in the stage; little stars and dots fly out,
// spin and fade. Purely for joy, nothing is measured.

import { useCallback, useState, type CSSProperties } from 'react';

interface Bit { id: number; x: number; y: number; dx: number; dy: number; rot: number; color: string; star: boolean; size: number }

let next = 1;

export function useBursts() {
  const [bits, setBits] = useState<Bit[]>([]);

  const fire = useCallback((x: number, y: number, colors: string[] = ['#FFE066', '#FFFFFF', '#FF9EC7', '#8BE3FF'], n = 12, spread = 70) => {
    const made: Bit[] = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const r = spread * (0.55 + Math.random() * 0.6);
      return {
        id: next++, x, y, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 14, rot: (Math.random() - 0.5) * 360,
        color: colors[i % colors.length], star: i % 3 !== 2, size: 10 + Math.random() * 10,
      };
    });
    setBits(b => [...b, ...made]);
    const ids = new Set(made.map(m => m.id));
    setTimeout(() => setBits(b => b.filter(m => !ids.has(m.id))), 900);
  }, []);

  const layer = (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 30 }} aria-hidden="true">
      {bits.map(b => (
        <span key={b.id} className="fg-burst absolute" style={{
          left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size,
          ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, ['--rot' as string]: `${b.rot}deg`,
        } as CSSProperties}>
          {b.star ? (
            <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1.5l3 7.2 7.6.6-5.8 5 1.8 7.4L12 17.8l-6.6 3.9 1.8-7.4-5.8-5 7.6-.6z" fill={b.color} stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          ) : (
            <span className="block w-full h-full rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
          )}
        </span>
      ))}
    </div>
  );

  return { layer, fire };
}
