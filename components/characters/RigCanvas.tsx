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
  /** a drawn cycle instead of one picture (e.g. run-1…run-5); src is then only a key */
  frames?: string[];
  rig: PetRig;
  /** changes on every tap, so the parts react */
  poke: number;
  seed?: number;
  onReady: (ready: boolean) => void;
}

export default function RigCanvas({ src, frames, rig, poke, seed = 0, onReady }: Props) {
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
    const urls = frames ?? [src];
    Promise.all(urls.map(u => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = u;
    }))).then(imgs => {
      if (cancelled) return;
      const pics = imgs.length === 1 ? imgs[0] : sameSize(imgs);
      const w = 'naturalWidth' in pics ? pics.naturalWidth : pics[0].width;
      const h = 'naturalHeight' in pics ? pics.naturalHeight : pics[0].height;
      const m = rig.pad * w * 2;
      setAspect(`${w + m} / ${h + m}`);
      playerRef.current = startRig(canvas, pics, rig, still, seed);
      onReady(!!playerRef.current);
      // the browser drops the oldest drawing contexts when a page has too
      // many; show the plain picture again instead of a blank canvas
      canvas.addEventListener('webglcontextlost', () => onReady(false), { once: true });
    }, () => { /* a picture failed to load: keep the plain picture */ });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      onReady(false);
    };
  }, [src, frames, rig, still, seed, onReady]);

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

// Drawn cycles come as pictures of slightly different sizes; put each on a
// canvas of the largest size, feet on the floor and centred, so the cycle
// does not jitter.
function sameSize(imgs: HTMLImageElement[]) {
  const w = Math.max(...imgs.map(i => i.naturalWidth));
  const h = Math.max(...imgs.map(i => i.naturalHeight));
  return imgs.map(img => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')!.drawImage(img, Math.round((w - img.naturalWidth) / 2), h - img.naturalHeight);
    return c;
  });
}
