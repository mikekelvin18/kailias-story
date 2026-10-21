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

'use client';

import { useCallback, useEffect, useState } from 'react';
import { characterArt } from './characters.config';
import RigCanvas from './RigCanvas';
import { RUN_RIGS, rigFor } from './rigs';

const RUN_FRAMES = 5;

interface Props {
  character: 'kailia' | 'noel';
  action: 'run' | 'idle';
  width: number;
  height: number;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function RunnerSprite({ character, action, width, height, fps = 8, className, style }: Props) {
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const [rigReady, setRigReady] = useState(false);
  const onRigReady = useCallback((r: boolean) => setRigReady(r), []);
  // width ÷ height of what is showing, to place the rig like objectFit: contain
  const [aspect, setAspect] = useState<{ run: number; idle: number } | null>(null);

  // Preload every run frame before the animation ever swaps `src` between
  // them — without this, cycling src 8x/sec on a cold cache leaves the
  // <img> showing a blank/loading frame most of the time, which (combined
  // with the drop-shadow filter) reads as a dark silhouette instead of Noel.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const urls = runUrls(character);
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
      const w = Math.max(...imgs.map(i => i.naturalWidth)), h = Math.max(...imgs.map(i => i.naturalHeight));
      setAspect({ run: w / h, idle: portrait.naturalWidth / portrait.naturalHeight });
    };
    // loaded after the run frames, so they have their sizes by then
    Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(() => { portrait.src = characterArt(character, 'portrait-front'); });
    return () => { cancelled = true; };
  }, [character]);

  useEffect(() => {
    if (action !== 'run') { setFrame(0); return; }
    const id = setInterval(() => setFrame(f => (f + 1) % RUN_FRAMES), 1000 / fps);
    return () => clearInterval(id);
  }, [action, fps]);

  // While the run frames are still preloading, hold on a STATIC run frame
  // (run-1) rather than the idle portrait — the portrait is a tall
  // full-body image, and squeezing it into this box's short/wide aspect
  // via objectFit:contain leaves most of the box empty, which reads as a
  // faded/translucent character rather than just "not animated yet".
  const src = action === 'run'
    ? characterArt(character, `run-${(ready ? frame + 1 : 1) as 1 | 2 | 3 | 4 | 5}`)
    : characterArt(character, 'portrait-front');

  const idleSrc = characterArt(character, 'portrait-front');
  const idleRig = rigFor(idleSrc);
  const a = aspect ? (action === 'run' ? aspect.run : aspect.idle) : 0;
  const boxW = a ? Math.min(width, height * a) : 0;
  const boxH = a ? boxW / a : 0;

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
      {a > 0 && (
        <span style={{ position: 'absolute', left: (width - boxW) / 2, top: (height - boxH) / 2, width: boxW, height: boxH, pointerEvents: 'none' }}>
          {action === 'run'
            ? <RigCanvas key="run" src={`run:${character}`} frames={runUrls(character)} rig={RUN_RIGS[character]} poke={0} onReady={onRigReady} />
            : idleRig && <RigCanvas key="idle" src={idleSrc} rig={idleRig} poke={0} onReady={onRigReady} />}
        </span>
      )}
    </span>
  );
}

const RUN_URLS: Partial<Record<'kailia' | 'noel', string[]>> = {};
function runUrls(character: 'kailia' | 'noel') {
  return RUN_URLS[character] ??= Array.from({ length: RUN_FRAMES }, (_, i) => characterArt(character, `run-${(i + 1) as 1 | 2 | 3 | 4 | 5}`));
}
