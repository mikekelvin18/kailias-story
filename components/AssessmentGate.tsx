'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DEMO_GAME_PATH, isDemoActive } from '@/lib/demo';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';

// Shared gate for every child-facing content route (the world map, the
// quest library, printables) — used by each of their layout.tsx files.
// A child can't reach any quest or worksheet without an assessment on
// file for the active profile, so difficulty/adaptivity always has real
// data behind it instead of silently defaulting.
//
// This has to be duplicated per top-level route (not just /play/*)
// because Next.js layouts only nest within their own route tree —
// /activities and /printables are siblings of /play, not children of
// it, so wrapping only app/play/layout.tsx left them completely
// unprotected: the bottom nav's Quests/Print tabs could reach real
// content without ever passing through /setup.
export default function AssessmentGate({ children }: { children: React.ReactNode }) {
  const { state, loaded } = useAssessment();
  const router = useRouter();
  const pathname = usePathname();
  // Try-before-sign-up: a family that tapped "Try one game first" on the
  // front page may play the one demo game. Nothing is saved (every store
  // is consent-gated and there is no consent yet); any other page sends
  // them back to the "liked it?" screen instead of the setup steps.
  const demo = loaded && !state.assessmentCompleted && isDemoActive();
  const demoAllowed = demo && pathname === DEMO_GAME_PATH;

  useEffect(() => {
    if (loaded && !state.assessmentCompleted && !demoAllowed) {
      router.replace(demo ? '/try' : '/setup');
    }
  }, [loaded, state.assessmentCompleted, router, demo, demoAllowed]);

  if (demoAllowed) {
    return (
      <>
        {children}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 shadow-lg text-sm font-bold whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.96)', color: '#3B0764' }}>
          <span>Trying it out · nothing is saved</span>
          <Link href="/try" className="rounded-full px-3 py-1 text-white" style={{ background: '#7C3AED' }}>Done</Link>
        </div>
        <div className="kp-paper" aria-hidden="true" />
      </>
    );
  }

  if (!loaded || !state.assessmentCompleted) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 30%, #bef264 70%, #86efac 100%)' }}>
        <KailiaSprite size={80} expression="thinking" className="float" />
      </main>
    );
  }

  return (
    <>
      {children}
      {/* hand-painted paper grain over every child-facing screen (globals.css) */}
      <div className="kp-paper" aria-hidden="true" />
    </>
  );
}
