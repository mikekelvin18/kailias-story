'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (loaded && !state.assessmentCompleted) {
      router.replace('/setup');
    }
  }, [loaded, state.assessmentCompleted, router]);

  if (!loaded || !state.assessmentCompleted) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 30%, #bef264 70%, #86efac 100%)' }}>
        <KailiaSprite size={80} expression="thinking" className="float" />
      </main>
    );
  }

  return <>{children}</>;
}
