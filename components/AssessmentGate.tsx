'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DEMO_GAME_PATH, isDemoActive } from '@/lib/demo';
import { loadFamily, activeChild, setActiveChild, type ChildProfile } from '@/lib/family';
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

  // Another child on this device who has finished the check-up (Muse
  // round 6): instead of jumping straight to /setup, say whose check-up is
  // unfinished and offer to switch, so a map with "0 starlight, locked
  // lands" never looks like lost progress.
  const [others, setOthers] = useState<{ me: ChildProfile | null; ready: ChildProfile[] } | null>(null);
  useEffect(() => {
    if (!loaded || state.assessmentCompleted || demoAllowed) return;
    if (demo) { router.replace('/try'); return; }
    const fam = loadFamily();
    const me = activeChild(fam);
    const ready = (fam?.children ?? []).filter(c => {
      if (c.id === me?.id) return false;
      try { return !!JSON.parse(localStorage.getItem(`kailia_assessment_v1::${c.id}`) ?? '{}')?.assessmentCompleted; } catch { return false; }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this device
    if (ready.length) setOthers({ me, ready });
    else router.replace('/setup');
  }, [loaded, state.assessmentCompleted, router, demo, demoAllowed]);

  if (loaded && !state.assessmentCompleted && !demoAllowed && others) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 30%, #bef264 70%, #86efac 100%)' }}>
        <div data-unfinished-checkup className="max-w-sm w-full rounded-3xl bg-white p-6 shadow-xl text-center">
          <KailiaSprite size={72} expression="happy" className="mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-800 mt-2">
            {others.me?.nickname ?? 'This child'} hasn&apos;t finished the first check-up yet
          </h1>
          <p className="text-slate-600 mt-2">The map opens once it&apos;s done. Noel keeps the answers given so far.</p>
          <button onClick={() => router.push('/setup')}
            className="mt-5 w-full min-h-[48px] rounded-full font-extrabold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #059669, #7C3AED)' }}>
            {others.me ? `Finish ${others.me.nickname}’s check-up` : 'Finish the check-up'}
          </button>
          {others.ready.map(c => (
            <button key={c.id} onClick={() => { setActiveChild(c.id); setOthers(null); }}
              className="mt-3 w-full min-h-[48px] rounded-full font-bold text-base border-2"
              style={{ borderColor: '#7C3AED', color: '#5B21B6' }}>
              Switch to {c.nickname}
            </button>
          ))}
        </div>
      </main>
    );
  }

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
