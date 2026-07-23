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

  useEffect(() => {
    if (action !== 'run') { setFrame(0); return; }
    const id = setInterval(() => setFrame(f => (f + 1) % RUN_FRAMES), 1000 / fps);
    return () => clearInterval(id);
  }, [action, fps]);

  const src = action === 'run'
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
