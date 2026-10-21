'use client';

// ── Rig canvas ──
// Draws a rigged pet (see meshRig.ts and rigs.ts) on top of its plain
// picture. The picture stays underneath for layout, screen readers and as
// the fallback: it is only hidden once the moving version has drawn. If
// WebGL is missing it simply stays visible. "Reduce motion" (the app
// setting or the device setting) shows a still frame.

import { useEffect, useRef, useState } from 'react';
import { startRig, type PetRig, type RigPlayer } from './meshRig';

function prefersStill() {
  return document.documentElement.dataset.reducedMotion === 'true'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Props {
  src: string;
  rig: PetRig;
  /** changes on every tap, so the parts react */
  poke: number;
  seed?: number;
  onReady: (ready: boolean) => void;
}

export default function RigCanvas({ src, rig, poke, seed = 0, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<RigPlayer | null>(null);
  const [still, setStill] = useState<boolean | null>(null);
  const [aspect, setAspect] = useState<string | null>(null);

  // follow the Reduce motion settings, including changes while on screen
  useEffect(() => {
    const update = () => setStill(prefersStill());
    update();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    return () => { mq.removeEventListener('change', update); mo.disconnect(); };
  }, []);

  useEffect(() => {
    if (still === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const m = rig.pad * img.naturalWidth * 2;
      setAspect(`${img.naturalWidth + m} / ${img.naturalHeight + m}`);
      playerRef.current = startRig(canvas, img, rig, still, seed);
      onReady(!!playerRef.current);
    };
    img.src = src;
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      onReady(false);
    };
  }, [src, rig, still, seed, onReady]);

  useEffect(() => { if (poke) playerRef.current?.poke(); }, [poke]);

  // The margin around the picture is a fraction of its width on every side;
  // CSS margins in % are always measured against the width, so they match.
  const pad = `${-rig.pad * 100}%`;
  return (
    <canvas key={String(still)} ref={canvasRef} aria-hidden="true" className="live-art"
      style={{ position: 'absolute', left: 0, top: 0, marginLeft: pad, marginTop: pad,
        width: `${100 + 2 * rig.pad * 100}%`, aspectRatio: aspect ?? undefined,
        visibility: aspect ? 'visible' : 'hidden', pointerEvents: 'none' }} />
  );
}
