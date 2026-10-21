'use client';

// ── Press, drag, let go ──
// Pointer handlers for anything a child can pick up in a place. Works the
// same with a finger, a mouse or a pen. A press that hardly moves is a tap
// (onTap), so children who tap instead of drag are never stuck; Enter or
// Space does the same tap from a keyboard. Positions come back in world px.

import { useRef } from 'react';
import { useStage } from './WorldStage';

type P = { x: number; y: number };

interface Opts {
  onStart?: (p: P) => void;
  onMove: (p: P) => void;
  /** vel = world px per second at the moment of release (for throws) */
  onDrop: (p: P, vel: P) => void;
  /** a press without a drag; `key` when it came from Enter or Space */
  onTap: (from: 'pointer' | 'key') => void;
  /** finger or button down / up, dragging or not (for press-and-hold) */
  onPress?: (down: boolean) => void;
  disabled?: boolean;
}

const TAP_SLOP = 8; // screen px

export function useDraggable({ onStart, onMove, onDrop, onTap, onPress, disabled }: Opts) {
  const stage = useStage();
  const st = useRef<{ id: number; sx: number; sy: number; dragging: boolean; trail: { p: P; t: number }[] } | null>(null);

  return {
    onPointerDown(e: React.PointerEvent) {
      if (disabled || st.current) return;
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      st.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, dragging: false, trail: [] };
      onPress?.(true);
    },
    onPointerMove(e: React.PointerEvent) {
      const s = st.current;
      if (!s || s.id !== e.pointerId) return;
      const p = stage.toWorld(e.clientX, e.clientY);
      if (!s.dragging && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) > TAP_SLOP) {
        s.dragging = true;
        onStart?.(p);
      }
      if (s.dragging) {
        s.trail = [...s.trail.slice(-5), { p, t: performance.now() }];
        onMove(p);
      }
    },
    onPointerUp(e: React.PointerEvent) {
      const s = st.current;
      if (!s || s.id !== e.pointerId) return;
      st.current = null;
      e.stopPropagation();
      onPress?.(false);
      if (!s.dragging) { onTap('pointer'); return; }
      const p = stage.toWorld(e.clientX, e.clientY);
      const first = s.trail[0];
      const dt = first ? (performance.now() - first.t) / 1000 : 0;
      const vel = first && dt > 0.01 ? { x: (p.x - first.p.x) / dt, y: (p.y - first.p.y) / dt } : { x: 0, y: 0 };
      onDrop(p, vel);
    },
    onPointerCancel(e: React.PointerEvent) {
      const s = st.current;
      if (!s || s.id !== e.pointerId) return;
      st.current = null;
      onPress?.(false);
      if (s.dragging) {
        const last = s.trail.at(-1)?.p;
        if (last) onDrop(last, { x: 0, y: 0 });
      }
    },
    onClick(e: React.MouseEvent) { e.stopPropagation(); },
    onKeyDown(e: React.KeyboardEvent) {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap('key'); }
    },
  };
}
