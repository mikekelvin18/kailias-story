'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import LivingSky from '@/components/scenery/LivingSky';
import { DEMO_GAME_PATH, isDemoActive, startDemo } from '@/lib/demo';
import { useAssessment } from '@/context/AssessmentContext';

// "Try one game first": a family can play Firefly Catch before signing
// up or agreeing to anything. Coming back here after playing, the page
// asks whether they'd like the whole adventure.
export default function TryPage() {
  const router = useRouter();
  const { state, loaded } = useAssessment();
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    // already set up? the real map is the better place to be
    if (loaded && state.assessmentCompleted) { router.replace('/play'); return; }
    setPlayed(isDemoActive()); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loaded, state.assessmentCompleted, router]);

  const play = () => { startDemo(); router.push(DEMO_GAME_PATH); };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden text-center"
      style={{ background: 'linear-gradient(135deg, #0F3D2E 0%, #14532D 55%, #1E3A8A 100%)' }}>
      <LivingSky mood="night" placement="absolute" opacity={0.6} />
      <div className="relative z-10 max-w-md w-full">
        <div className="flex items-end justify-center gap-1 mb-4" style={{ minHeight: 140 }}>
          <KailiaSprite size={110} expression={played ? 'celebrating' : 'happy'} />
          <PandaSprite size={120} expression={played ? 'excited' : 'happy'} />
        </div>

        {!played ? (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">Try a game with Kailia</h1>
            <p className="text-lg text-emerald-50 mt-2">
              Help Kailia catch fireflies to light her lantern. No sign-up, and nothing is saved.
            </p>
            <button onClick={play}
              className="mt-7 w-full sm:w-auto px-12 py-4 rounded-full text-2xl font-extrabold shadow-xl transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#3B0764' }}>
              Play Firefly Catch →
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">Want the whole adventure?</h1>
            <p className="text-lg text-emerald-50 mt-2">
              Six lands, a daily pet friend, and a clear picture of how your child is growing.
              A grown-up sets it up in about a minute.
            </p>
            <Link href="/story"
              className="mt-7 block w-full px-12 py-4 rounded-full text-2xl font-extrabold shadow-xl transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#3B0764' }}>
              Start the adventure →
            </Link>
            <button onClick={play}
              className="mt-3 w-full py-3.5 rounded-full text-lg font-extrabold transition-transform hover:scale-[1.02]"
              style={{ background: 'white', color: '#14532D' }}>
              Play again
            </button>
          </>
        )}
        <p className="mt-6 text-sm">
          <Link href="/" className="font-bold text-white underline underline-offset-4" style={{ opacity: 0.85 }}>← Front page</Link>
        </p>
      </div>
    </main>
  );
}
