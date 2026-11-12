'use client';

import Link from 'next/link';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import LivingSky from '@/components/scenery/LivingSky';
import { Sparkle } from '@/components/scenery/SkyDecor';
import { useAssessment } from '@/context/AssessmentContext';
import { SETUP_STEPS } from '@/components/ui/StepGuide';

const SPARKLE_COLORS = ['#FFF3B0', '#FFE08A', '#FFFFFF', '#F5D0FE', '#FDE68A'];

// What a parent gets, in three short promises. Plain colored numbers,
// no emoji art (design bar: no emojis as art anywhere).
const PROMISES = [
  { color: '#F59E0B', title: 'Your child plays', text: 'Short story quests with Kailia and Noel across six magical lands.' },
  { color: '#8B5CF6', title: 'You see how they grow', text: 'Quiet check-ins on hands, words, numbers, senses and memory, in plain language.' },
  { color: '#10B981', title: 'You play together', text: 'Noel suggests tiny real-world quests for the two of you, about 5 minutes a day.' },
];

export default function LandingPage() {
  // A family that already finished setup goes straight back to the map
  // instead of being sent through the story intro again.
  const { state, loaded } = useAssessment();
  const returning = loaded && state.assessmentCompleted;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 pt-8 pb-12 sm:justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)' }}
    >
      {/* Soft dusk clouds drifting behind everything, with drawn sparkles
          twinkling between them (no emoji). */}
      <LivingSky mood="dusk" placement="absolute" opacity={0.7} />
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${(i * 17 + 5) % 95}%`, top: `${(i * 23 + 8) % 90}%` }}
          >
            <Sparkle size={14 + (i % 3) * 7} color={SPARKLE_COLORS[i % SPARKLE_COLORS.length]}
              style={{ animationDelay: `${i * 0.37}s` }} />
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Kailia and Noel, standing together and breathing, blinking and
            turning a little; tap either one and they hop. */}
        <div className="flex items-end justify-center gap-2 mb-4" style={{ minHeight: 130 }}>
          <KailiaSprite size={104} expression="happy" />
          <PandaSprite size={114} expression="happy" />
        </div>

        <h1
          className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg"
          style={{ textShadow: '2px 4px 8px rgba(0,0,0,0.3)' }}
        >
          Kailia&apos;s Story
        </h1>
        <p className="text-xl sm:text-2xl text-white mb-6 font-semibold max-w-md mx-auto leading-snug" style={{ textShadow: '0 2px 6px rgba(60,20,110,0.55)' }}>
          A magical adventure that grows with your child.
        </p>

        {/* The one main action sits right under the promise, so it is on
            the first screen of a phone, not below a wall of text. */}
        <Link
          href={returning ? '/play' : '/story'}
          className="inline-block text-2xl font-bold text-purple-900 px-12 py-5 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 hover:shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
        >
          {returning ? `Continue${state.childName ? ` with ${state.childName}` : ' the adventure'} →` : 'Start the Adventure →'}
        </Link>
        {!returning && (
          <div className="mt-3">
            <Link href="/try" className="inline-block px-6 py-2.5 rounded-full text-base font-extrabold text-white transition-transform hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.75)' }}>
              Try one game first, no sign-up
            </Link>
          </div>
        )}
        <p className="mt-3 text-sm font-semibold text-white" style={{ opacity: 0.92 }}>
          {returning
            ? 'Welcome back! Kailia and Noel saved your place on the map.'
            : 'Free to start · a grown-up sets up in about a minute · ages 6 months to 12 years'}
        </p>

        {/* What a parent gets, so the first tap isn't a leap of faith */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3 text-left">
          {PROMISES.map((p, i) => (
            <div key={p.title} className="rounded-3xl p-4 shadow-xl" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-extrabold text-sm mb-2"
                style={{ background: p.color }} aria-hidden="true">{i + 1}</span>
              <p className="font-extrabold text-gray-800 leading-tight">{p.title}</p>
              <p className="text-sm text-gray-600 mt-1 leading-snug">{p.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-2xl px-4 py-3 text-sm text-purple-900 text-left sm:text-center" style={{ background: '#F3E8FF' }}>
          <strong>For parents:</strong> it never feels like a test to your child. Activities are
          inspired by child development research and checked against everyday milestones.
          Everything stays on this device.
        </p>

        {/* How first-time setup goes, step by step */}
        {!returning && (
          <ol className="mt-6 flex flex-wrap justify-center gap-2" aria-label="How it works">
            {SETUP_STEPS.map((s, i) => (
              <li key={s.label} className="text-sm font-bold text-white rounded-full px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span style={{ opacity: 0.8 }}>{i + 1}.</span> {s.label}
              </li>
            ))}
          </ol>
        )}

        {/* Footer: privacy links (parent-facing) */}
        <p className="mt-8 text-sm text-white flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/family" className="underline underline-offset-4 py-1">Parent Zone</Link>
          <Link href="/privacy" className="underline underline-offset-4 py-1" style={{ opacity: 0.85 }}>Privacy Policy</Link>
          <Link href="/retention" className="underline underline-offset-4 py-1" style={{ opacity: 0.85 }}>Data Retention</Link>
        </p>
      </div>
    </main>
  );
}
