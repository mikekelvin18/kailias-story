'use client';

// ── Things in a place ──
// Thing: something you can tap (a bush, the frog, a ladybug).
// DragThing: something you can pick up and move (the can, a stone, the ball).
// Both are real buttons (keyboard and screen readers reach them), sit with
// their bottom-centre on (x, y) in world px, get a hit area at least
// SIZES.minTarget big, and are drawn on top of things further back.

import type { CSSProperties, ReactNode } from 'react';
import { SIZES } from '@/lib/world/artBible';
import { useDraggable } from './useDraggable';

interface Base {
  x: number;
  y: number;
  /** drawing size */
  w: number;
  h: number;
  label: string;
  children: ReactNode;
  className?: string;
  /** depth override (default: y) */
  z?: number;
  style?: CSSProperties;
  /** move smoothly to new positions (off while dragging) */
  glide?: number;
}

function box({ x, y, w, h, z, glide }: Base): CSSProperties {
  const hw = Math.max(w, SIZES.minTarget), hh = Math.max(h, SIZES.minTarget);
  return {
    position: 'absolute', left: x - hw / 2, top: y - hh, width: hw, height: hh, zIndex: z ?? Math.round(y),
    background: 'none', border: 0, padding: 0, cursor: 'pointer', touchAction: 'none',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    transition: glide ? `left ${glide}ms cubic-bezier(.3,1.2,.5,1), top ${glide}ms cubic-bezier(.3,1.2,.5,1)` : undefined,
  };
}

export function Thing(props: Base & { onTap: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={props.label} disabled={props.disabled}
      className={`gw-touch ${props.className ?? ''}`} style={{ ...box(props), ...props.style }}
      onClick={e => { e.stopPropagation(); props.onTap(); }}>
      <span style={{ display: 'block', width: props.w, height: props.h, position: 'relative' }}>{props.children}</span>
    </button>
  );
}

export function DragThing(props: Base & {
  onStart?: (p: { x: number; y: number }) => void;
  onMove: (p: { x: number; y: number }) => void;
  onDrop: (p: { x: number; y: number }, vel: { x: number; y: number }) => void;
  onTap: (from: 'pointer' | 'key') => void;
  onPress?: (down: boolean) => void;
  disabled?: boolean;
  dragging?: boolean;
}) {
  const handlers = useDraggable(props);
  return (
    <button type="button" aria-label={props.label} aria-disabled={props.disabled || undefined}
      className={`gw-touch ${props.dragging ? 'gw-held' : ''} ${props.className ?? ''}`}
      style={{ ...box(props), cursor: props.disabled ? 'default' : props.dragging ? 'grabbing' : 'grab', ...props.style }}
      {...handlers}>
      <span style={{ display: 'block', width: props.w, height: props.h, position: 'relative', pointerEvents: 'none' }}>{props.children}</span>
    </button>
  );
}
