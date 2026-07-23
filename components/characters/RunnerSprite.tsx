// Running-scene sprite for the side-scroller "Kailia's Trail" — cycles
// through the real run-cycle art (public/characters/{kailia,noel}/
// run-{1..5}.png) so arms and legs actually swing while she runs, instead
// of a single static side-profile portrait (which only ever shows one
// arm — fine for a standing portrait, wrong for "running"). Idle uses the
// smooth front-facing portrait, matching the rest of the site.

'use client';

import { useEffect, useState } from 'react';

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

  // Preload every run frame before the animation ever swaps `src` between
  // them — without this, cycling src 8x/sec on a cold cache leaves the
  // <img> showing a blank/loading frame most of the time, which (combined
  // with the drop-shadow filter) reads as a dark silhouette instead of Noel.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const urls = Array.from({ length: RUN_FRAMES }, (_, i) => `/characters/${character}/run-${i + 1}.png`);
    urls.forEach(url => {
      const img = new window.Image();
      img.onload = img.onerror = () => {
        loaded += 1;
        if (!cancelled && loaded === urls.length) setReady(true);
      };
      img.src = url;
    });
    return () => { cancelled = true; };
  }, [character]);

  useEffect(() => {
    if (action !== 'run') { setFrame(0); return; }
    const id = setInterval(() => setFrame(f => (f + 1) % RUN_FRAMES), 1000 / fps);
    return () => clearInterval(id);
  }, [action, fps]);

  // While the run frames are still preloading, hold on the idle portrait
  // (already showing, already loaded) instead of cycling through frames
  // that would each trigger a fresh, slow network fetch.
  const src = action === 'run' && ready
    ? `/characters/${character}/run-${frame + 1}.png`
    : `/characters/${character}/portrait-front.png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={character}
      width={width}
      height={height}
      className={`character-art-shadow ${className ?? ''}`}
      style={{ objectFit: 'contain', ...style }}
    />
  );
}
