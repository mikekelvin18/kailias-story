'use client';

import { useEffect } from 'react';
import { loadA11y, applyA11y } from '@/lib/accessibility';

// Applies saved accessibility prefs to <html> as soon as the app mounts,
// so globals.css's [data-reduced-motion], [data-text-size], etc. rules
// take effect on every page without each page needing to know about it.
export default function AccessibilityProvider() {
  useEffect(() => {
    applyA11y(loadA11y());
  }, []);
  return null;
}
