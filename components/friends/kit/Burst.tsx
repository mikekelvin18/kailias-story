'use client';

// ── Bursts: a pop of sparkles where something good happened ──
// fire(x, y) at a % spot in the stage; little stars and dots fly out,
// spin and fade. v2: a soft flash and a ring pop at the centre, and the
// bits fly up in an arc and tumble down with a little gravity, in three
// shapes (stars, glowing dots, sparkle crosses). Purely for joy, nothing
// is measured.

import { useCallback, useState, type CSSProperties } from 'react';

type Shape = 'star' | 'dot' | 'twinkle';
interface Bit { id: number; x: number; y: number; dx: number; dy: number; rot: number; color: string; shape: Shape; size: number; delay: number }
interface Ring { id: number; x: number; y: number; color: string; size: number }

let next = 1;

export function useBursts() {
  const [bits, setBits] = useState<Bit[]>([]);
  const [rings, setRings] = useState<Ring[]>([]);

  const fire = useCallback((x: number, y: number, colors: string[] = ['#FFE066', '#FFFFFF', '#FF9EC7', '#8BE3FF'], n = 12, spread = 70) => {
    const made: Bit[] = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const r = spread * (0.55 + Math.random() * 0.6);
      return {
        id: next++, x, y, dx: Math.cos(a) * r, dy: Math.sin(a) * r - 18, rot: (Math.random() - 0.5) * 540,
        color: colors[i % colors.length], shape: (['star', 'star', 'dot', 'twinkle'] as Shape[])[i % 4],
        size: 9 + Math.random() * 11, delay: Math.random() * 60,
      };
    });
    const ring: Ring = { id: next++, x, y, color: colors[0], size: Math.max(40, spread * 1.3) };
    setBits(b => [...b, ...made]);
    setRings(r => [...r, ring]);
    const ids = new Set(made.map(m => m.id));
    setTimeout(() => setBits(b => b.filter(m => !ids.has(m.id))), 1200);
    setTimeout(() => setRings(r => r.filter(m => m.id !== ring.id)), 700);
  }, []);

  const layer = (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 30 }} aria-hidden="true">
      {rings.map(r => (
        <span key={r.id} className="absolute" style={{ left: `${r.x}%`, top: `${r.y}%`, width: r.size, height: r.size }}>
          <span className="fg-flash absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, #FFFFFF 0%, ${r.color} 35%, transparent 70%)` }} />
          <span className="fg-ring absolute inset-0 rounded-full" style={{ border: `4px solid ${r.color}`, boxShadow: `0 0 12px ${r.color}` }} />
        </span>
      ))}
      {bits.map(b => (
        <span key={b.id} className="fg-burst absolute" style={{
          left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size, animationDelay: `${b.delay}ms`,
          ['--dx' as string]: `${b.dx}px`, ['--dy' as string]: `${b.dy}px`, ['--rot' as string]: `${b.rot}deg`,
        } as CSSProperties}>
          {b.shape === 'star' ? (
            <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 1.5l3 7.2 7.6.6-5.8 5 1.8 7.4L12 17.8l-6.6 3.9 1.8-7.4-5.8-5 7.6-.6z" fill={b.color} stroke="#FFFFFF" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          ) : b.shape === 'twinkle' ? (
            <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px ${b.color})` }}><path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" fill={b.color} /></svg>
          ) : (
            <span className="block w-full h-full rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}`, transform: 'scale(0.7)' }} />
          )}
        </span>
      ))}
    </div>
  );

  return { layer, fire };
}
