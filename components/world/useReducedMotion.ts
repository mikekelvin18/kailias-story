'use client';

// True when the app's "Reduce motion" setting or the device asks for less
// movement. Follows changes while the screen is open.

import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(root.dataset.reducedMotion === 'true' || mq.matches);
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    mq.addEventListener('change', read);
    const first = requestAnimationFrame(read);
    return () => { cancelAnimationFrame(first); obs.disconnect(); mq.removeEventListener('change', read); };
  }, []);
  return reduced;
}
