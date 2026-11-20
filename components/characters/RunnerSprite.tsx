// Running-scene sprite for the side-scroller "Kailia's Trail" — cycles
// through the real run-cycle art (public/characters/{kailia,noel}/
// run-{1..5}.png) so arms and legs actually swing while she runs, instead
// of a single static side-profile portrait (which only ever shows one
// arm — fine for a standing portrait, wrong for "running"). Idle uses the
// smooth front-facing portrait, matching the rest of the site.
//
// Where WebGL is available the cycle plays through the mesh rig instead
// (RigCanvas + RUN_RIGS in rigs.ts): the same drawn frames, but with hair,
// cape and scarf streaming behind, and the idle portrait blinking and
// breathing. The plain <img> below stays as the fallback.
//
// action="jump" plays the drawn jump (jump-1…jump-4: crouch, take off, in
// the air, land) once and holds the landing; the caller switches back to
// run or idle when the hop is over (about half a second at the default 8 fps).

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { characterArt } from './characters.config';
import RigCanvas from './RigCanvas';
import { JUMP_RIGS, RUN_RIGS, rigFor } from './rigs';

type Cycle = 'run' | 'jump';
const FRAMES: Record<Cycle, number> = { run: 5, jump: 4 };

interface Props {
  character: 'kailia' | 'noel';
  action: 'run' | 'jump' | 'idle';
  width: number;
  height: number;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function RunnerSprite({ character, action, width, height, fps, className, style }: Props) {
  const imgFps = fps ?? 8;
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const [rigReady, setRigReady] = useState(false);
  const onRigReady = useCallback((r: boolean) => setRigReady(r), []);
  // picture sizes (px of the art) of each cycle's shared box and of the portrait
  const [dims, setDims] = useState<Record<Cycle | 'idle', [number, number]> | null>(null);

  // Preload every run frame before the animation ever swaps `src` between
  // them — without this, cycling src 8x/sec on a cold cache leaves the
  // <img> showing a blank/loading frame most of the time, which (combined
  // with the drop-shadow filter) reads as a dark silhouette instead of Noel.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const urls = [...frameUrls(character, 'run'), ...frameUrls(character, 'jump')];
    const imgs = urls.map(url => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (!cancelled && loaded === urls.length) setReady(true);
      };
      img.src = url;
      return img;
    });
    const portrait = new window.Image();
    portrait.onload = () => {
      if (cancelled || !imgs.every(i => i.naturalWidth)) return;
      const box = (some: HTMLImageElement[]): [number, number] =>
        [Math.max(...some.map(i => i.naturalWidth)), Math.max(...some.map(i => i.naturalHeight))];
      setDims({ run: box(imgs.slice(0, FRAMES.run)), jump: box(imgs.slice(FRAMES.run)), idle: [portrait.naturalWidth, portrait.naturalHeight] });
    };
    // loaded after the run frames, so they have their sizes by then
    Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(() => { portrait.src = characterArt(character, 'portrait-front'); });
    return () => { cancelled = true; };
  }, [character]);

  useEffect(() => {
    if (action === 'idle') { setFrame(0); return; }
    const n = FRAMES[action];
    setFrame(0);
    const id = setInterval(() => setFrame(f => action === 'jump' ? Math.min(f + 1, n - 1) : (f + 1) % n), 1000 / imgFps);
    return () => clearInterval(id);
  }, [action, imgFps]);

  // While the run frames are still preloading, hold on a STATIC run frame
  // (run-1) rather than the idle portrait — the portrait is a tall
  // full-body image, and squeezing it into this box's short/wide aspect
  // via objectFit:contain leaves most of the box empty, which reads as a
  // faded/translucent character rather than just "not animated yet".
  const src = action === 'idle'
    ? characterArt(character, 'portrait-front')
    : frameUrls(character, action)[ready ? frame : 0];

  // a new rig object would restart the canvas, so build it only when these change
  const cycleRig = useMemo(() => {
    if (action === 'idle') return null;
    const rig = (action === 'run' ? RUN_RIGS : JUMP_RIGS)[character];
    return fps ? { ...rig, fps } : rig;
  }, [action, character, fps]);

  const idleSrc = characterArt(character, 'portrait-front');
  const idleRig = rigFor(idleSrc);
  // Fit like objectFit: contain. The run box sets the scale for both drawn
  // cycles, and the jump box stands on the run box's floor, so she stays the
  // same size when she jumps and the drawn take-off really lifts her.
  let box: { left: number; top: number; w: number; h: number } | null = null;
  if (dims) {
    const [rw, rh] = action === 'idle' ? dims.idle : dims.run;
    const k = Math.min(width / rw, height / rh);
    const [cw, ch] = dims[action];
    const floor = (height + rh * k) / 2;
    box = { left: (width - cw * k) / 2, top: floor - ch * k, w: cw * k, h: ch * k };
  }

  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', width, height, verticalAlign: 'bottom', ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={character}
        width={width}
        height={height}
        className="character-art-shadow"
        style={{ display: 'block', objectFit: 'contain', width, height, opacity: rigReady ? 0 : 1 }}
      />
      {box && (
        <span style={{ position: 'absolute', left: box.left, top: box.top, width: box.w, height: box.h, pointerEvents: 'none' }}>
          {action === 'idle' || !cycleRig
            ? idleRig && <RigCanvas key="idle" src={idleSrc} rig={idleRig} poke={0} onReady={onRigReady} />
            : <RigCanvas key={action} src={`${action}:${character}`} frames={frameUrls(character, action)}
                rig={cycleRig} poke={0} onReady={onRigReady} />}
        </span>
      )}
    </span>
  );
}

// one array per character and cycle, so RigCanvas sees the same frames prop every render
const URLS: Partial<Record<string, string[]>> = {};
function frameUrls(character: 'kailia' | 'noel', cycle: Cycle) {
  return URLS[`${character}-${cycle}`] ??= Array.from({ length: FRAMES[cycle] }, (_, i) =>
    characterArt(character, `${cycle}-${i + 1}` as `run-${1 | 2 | 3 | 4 | 5}` | `jump-${1 | 2 | 3 | 4}`));
}
