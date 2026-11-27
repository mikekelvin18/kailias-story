'use client';
// Sets <html data-bigkid> from the active child's "Big Kid look" (Family page),
// which app/globals.css uses to drop sparkles and shrink the cast a little.
import { useEffect } from 'react';
import { useChildGamePrefs } from '@/hooks/useGameFit';

export default function BigKidLook() {
  const { bigKidLook } = useChildGamePrefs();
  useEffect(() => {
    document.documentElement.dataset.bigkid = String(!!bigKidLook);
  }, [bigKidLook]);
  return null;
}
