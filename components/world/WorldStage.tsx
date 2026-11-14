'use client';

// ── World stage: the window onto a place ──
// A place is drawn once at a fixed world size (e.g. 2400 x 1000 px) and
// this stage fits it to the screen:
//   • scale: the whole world height fits, but never so small that less
//     than MIN_VISIBLE world px of width shows (tall phones then get extra
//     sky above the place instead of a tiny garden)
//   • camera: follows `focusX` with a soft lag, only panning, never zooming
//   • depth: background layers drift slower than the ground (parallax),
//     foreground layers faster; off when motion is reduced
// It writes the camera straight to the DOM every frame, so following
// Kailia never re-renders the painted scene.
//
// Children are positioned in world px. useStage().toWorld() turns a
// pointer position into world px for dragging.

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const MIN_VISIBLE = 820;

interface StageApi {
  toWorld: (clientX: number, clientY: number) => { x: number; y: number };
  scale: number;
  /** left edge of what is visible, in world px */
  viewLeft: () => number;
  viewWidth: number;
}

const StageCtx = createContext<StageApi | null>(null);

export function useStage() {
  const s = useContext(StageCtx);
  if (!s) throw new Error('useStage outside WorldStage');
  return s;
}

export interface Layer { node: ReactNode; factor: number }

interface Props {
  width: number;
  height: number;
  focusX: number;
  /** hold the camera still (e.g. while something is being dragged) */
  freeze?: boolean;
  reducedMotion: boolean;
  /** fixed to the screen, behind everything (sky, sun, clouds) */
  sky: ReactNode;
  back: Layer[];
  front: Layer[];
  /** the play layer: ground, objects, characters (world px) */
  children: ReactNode;
  onGround: (x: number, y: number) => void;
  /** fixed to the screen, above everything (buttons, speech) */
  hud: ReactNode;
}

export default function WorldStage({ width, height, focusX, freeze, reducedMotion, sky, back, front, children, onGround, hud }: Props) {
  const viewRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const cam = useRef<number | null>(null);
  const target = useRef({ focusX, freeze, reducedMotion });
  useLayoutEffect(() => { target.current = { focusX, freeze, reducedMotion }; });

  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // tall phones: let the place fill at least ~72% of the height and pan
  // sideways, rather than shrinking the whole width onto the screen
  const s = size.w ? Math.min(size.h / height, Math.max(size.w / MIN_VISIBLE, (size.h * 0.72) / height)) : 1;
  const visW = size.w / s;
  const offY = Math.max(0, size.h - height * s);
  const layers = [...back, ...front];

  // the camera loop: ease toward the focus, write transforms directly
  useEffect(() => {
    if (!size.w) return;
    let raf = 0;
    let written = Number.NaN;
    const tick = () => {
      const t = target.current;
      const goal = visW >= width ? -(visW - width) / 2 : Math.max(0, Math.min(width - visW, t.focusX - visW / 2));
      if (cam.current === null || t.reducedMotion) cam.current = t.freeze && cam.current !== null ? cam.current : goal;
      else if (!t.freeze) cam.current += (goal - cam.current) * 0.08;
      const c = cam.current;
      // only touch the DOM when the camera really moved
      if (Math.abs(c - written) < 0.05) { raf = requestAnimationFrame(tick); return; }
      written = c;
      if (worldRef.current) worldRef.current.style.transform = `translate3d(${-c * s}px, ${offY}px, 0) scale(${s})`;
      layerRefs.current.forEach((el, i) => {
        if (!el) return;
        const f = t.reducedMotion ? 1 : layers[i]?.factor ?? 1;
        el.style.transform = `translate3d(${c * (1 - f)}px, 0, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // layers only change factor by index, which is fixed per place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, s, visW, offY, width]);

  const api: StageApi = {
    scale: s,
    viewWidth: visW,
    viewLeft: () => cam.current ?? 0,
    toWorld: (cx, cy) => {
      const r = viewRef.current!.getBoundingClientRect();
      return { x: (cx - r.left) / s + (cam.current ?? 0), y: (cy - r.top - offY) / s };
    },
  };

  const layerDiv = (l: Layer, i: number) => (
    <div key={i} ref={el => { layerRefs.current[i] = el; }} aria-hidden="true"
      className="absolute left-0 top-0" style={{ width, height, willChange: 'transform', pointerEvents: 'none' }}>
      {l.node}
    </div>
  );

  return (
    <StageCtx.Provider value={api}>
      <div ref={viewRef} className="fixed inset-0 overflow-hidden select-none" style={{ touchAction: 'none' }}
        // focusing a button off-screen would scroll this box and break the
        // camera; the camera alone decides what is visible
        onScroll={e => { e.currentTarget.scrollTop = 0; e.currentTarget.scrollLeft = 0; }}>
        <div className="absolute inset-0" aria-hidden="true">{sky}</div>
        {size.w > 0 && (
          <div ref={worldRef} className="absolute left-0 top-0" style={{ width, height, transformOrigin: '0 0', willChange: 'transform' }}>
            {back.map((l, i) => layerDiv(l, i))}
            {/* the ground: a tap here walks Kailia */}
            <div className="absolute inset-0" style={{ top: -height }}
              onClick={e => { const p = api.toWorld(e.clientX, e.clientY); onGround(p.x, p.y); }} />
            {children}
            {front.map((l, i) => layerDiv(l, back.length + i))}
          </div>
        )}
        {hud}
      </div>
    </StageCtx.Provider>
  );
}
