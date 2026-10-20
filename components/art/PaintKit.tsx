'use client';

// ── Paint kit: the shared "hand-painted" look ──
// One hidden <svg> mounted once in app/layout.tsx that holds the brush
// filters every illustration in the app can borrow by id:
//
//   kp-brush  — rough, slightly wobbly paint edges + dry-brush bristle
//               streaks inside every shape. Static. Use on drawings that
//               move a lot (cheap: the filter is computed once).
//   kp-boil   — the same brush look, but the edges re-wobble 8 times a
//               second like hand-drawn animation ("line boil"), so even a
//               still picture feels alive. Use on idle scenery/critters.
//   kp-edge   — just the wobbly edge, no texture; for small icons where
//               streaks would turn to mush.
//
// In an SVG:   <g filter="url(#kp-brush)"> … </g>
// In CSS:      filter: url(#kp-edge);
//
// Respects reduced motion: the boil stops (stays painted, just still)
// when the parent turns on "Reduce motion" or the device asks for it.

import { useEffect, useState } from 'react';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(root.dataset.reducedMotion === 'true' || mq.matches);
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    mq.addEventListener('change', read);
    return () => { obs.disconnect(); mq.removeEventListener('change', read); };
  }, []);
  return reduced;
}

// Bristle texture: noise stretched along one axis reads as brush streaks.
// Blended "soft-light" so it lightens AND darkens around the paint colour
// instead of just greying it out.
function Bristles({ seed }: { seed: number }) {
  return (
    <>
      <feTurbulence type="fractalNoise" baseFrequency="0.045 0.5" numOctaves="3" seed={seed} result="bristle" />
      <feColorMatrix in="bristle" type="matrix"
        values="0.33 0.17 0.05 0 0.22  0.33 0.17 0.05 0 0.22  0.33 0.17 0.05 0 0.22  0 0 0 0 1" result="bristleGray" />
      <feBlend in="bristleGray" in2="rough" mode="soft-light" result="painted" />
      {/* dabs: a few slightly lighter blotches like wet paint pooling */}
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="1" seed={seed + 4} result="dab" />
      <feColorMatrix in="dab" type="matrix"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.4 0.62" result="dabLight" />
      <feComposite in="dabLight" in2="painted" operator="atop" result="dabbed" />
      <feComposite in="dabbed" in2="rough" operator="in" />
    </>
  );
}

export default function PaintKit() {
  const reduced = useReducedMotion();
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="kp-brush" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <Bristles seed={8} />
        </filter>

        <filter id="kp-boil" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="3" result="warp">
            {!reduced && (
              <animate attributeName="seed" values="3;7;12;5" dur="0.5s" calcMode="discrete" repeatCount="indefinite" />
            )}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <Bristles seed={8} />
        </filter>

        <filter id="kp-edge" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
