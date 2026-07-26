'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';

// Gate for the ENTIRE world map and every quest under it (/play/*, via
// Next.js layout nesting — one check covers all of them, including
// direct/bookmarked links to a specific quest). A child can't reach any
// game without an assessment on file for the active profile, so
// difficulty/adaptivity always has real data behind it instead of
// silently defaulting.
export default function PlayLayout({ children }: { children: React.ReactNode }) {
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
