'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepGuide from '@/components/ui/StepGuide';
import { activeChild } from '@/lib/family';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import { useTalkMoment, TalkHost } from '@/components/TalkMoment';
import NarrationPlayer, { type NarrationLine } from '@/components/NarrationPlayer';

// Four short story pages, told by Kailia herself in her own voice (first
// person, short excited lines; the reviewer 2026-11-25), with Noel saying
// his own line in his voice. The narration player reads each page aloud,
// highlights the sentence being read, and has play/pause, replay and speed.
// Each page shows Kailia and Noel themselves (no emoji art), and the story
// names the six real lands the child will visit on the map.
const PANELS: { art: 'meet' | 'noel' | 'map' | 'you'; bg: string; title: string; lines: NarrationLine[] }[] = [
  {
    art: 'meet',
    bg: 'linear-gradient(135deg, #667EEA, #764BA2)',
    title: "Hi! I'm Kailia!",
    lines: [{ who: 'kailia', text: "Hi!! I'm Kailia! I love to explore! In my world, letters sing and numbers dance!" }],
  },
  {
    art: 'noel',
    bg: 'linear-gradient(135deg, #F093FB, #F5576C)',
    title: 'And this is Noel!',
    lines: [
      { who: 'kailia', text: "And this is my best friend Noel! He's a big, gentle panda." },
      { who: 'noel', text: "Let's try together!" },
      { who: 'kailia', text: 'He always says that!' },
    ],
  },
  {
    art: 'map',
    bg: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
    title: 'A Magic Map!',
    lines: [{ who: 'kailia', text: "Look! We found a magic map! It has six lands: a firefly forest, a dragon's cave, talking signposts, a story village, echo caves and a wise owl's tower!" }],
  },
  {
    art: 'you',
    bg: 'linear-gradient(135deg, #F6D365, #FDA085)',
    title: 'We need YOU!',
    lines: [{ who: 'kailia', text: "Will you come with us? There's no wrong way to explore. Let's go!!" }],
  },
];

const LAND_PEEKS = ['firefly-forest', 'dragons-cave', 'whispering-signposts', 'story-keepers', 'echo-caves', 'owls-tower'];

function PanelArt({ art }: { art: (typeof PANELS)[number]['art'] }) {
  if (art === 'map') {
    return (
      <div className="grid grid-cols-3 gap-1 max-w-[300px] mx-auto">
        {LAND_PEEKS.map(id => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={`/art/lands/${id}.webp`} alt="" className="w-full h-auto float"
            style={{ animationDelay: `${(id.length % 6) * 0.3}s` }} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-end justify-center gap-1 pt-4" style={{ minHeight: 166 }}>
      {art !== 'noel' && <KailiaSprite size={art === 'you' ? 120 : 140} expression={art === 'you' ? 'excited' : 'happy'} />}
      {art !== 'meet' && <PandaSprite size={art === 'noel' ? 150 : 128} expression={art === 'you' ? 'excited' : 'happy'} />}
    </div>
  );
}

export default function StoryPage() {
  const [panel, setPanel] = useState(0);
  const router = useRouter();
  const talk = useTalkMoment('story');
  const current = PANELS[panel];
  const isLast = panel === PANELS.length - 1;

  const next = () => {
    if (isLast) {
      // Step 2 is the grown-up setup: go straight there unless a child
      // profile already exists (then on to the adventure check).
      router.push(activeChild() ? '/setup' : '/family');
    } else if (current.art === 'map') {
      // after the magic map, Kailia pauses: "Your turn!" (once a visit)
      talk.maybe(() => setPanel(p => p + 1), 'map');
    } else {
      setPanel(p => p + 1);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-all duration-500"
      style={{ background: current.bg }}
    >
      <div className="max-w-lg w-full text-center">
        <StepGuide step={1} tone="dark" className="mb-6" />

        {/* Story page dots */}
        <div className="flex justify-center gap-3 mb-6" aria-label={`Story page ${panel + 1} of ${PANELS.length}`}>
          {PANELS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === panel ? 32 : 12,
                height: 12,
                background: i <= panel ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>

        {/* Kailia and Noel (or the six lands) for this page */}
        <div className="mb-6 bounce-in" key={`art-${panel}`}>
          <PanelArt art={current.art} />
        </div>

        {/* Story card: Kailia tells it (the player reads it aloud, highlights
            the sentence being read; tap a sentence to hear it again) */}
        <div className="rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl bounce-in" key={panel}
          style={{ background: 'rgba(255,255,255,0.95)' }}>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">{current.title}</h2>
          <NarrationPlayer lines={current.lines} textClassName="text-gray-700 text-xl leading-relaxed" />
        </div>

        <button
          onClick={next}
          className="text-xl font-extrabold px-12 py-4 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={isLast
            ? { background: 'linear-gradient(135deg, #FFD700, #FF8C00)', color: '#3B0764' }
            : { background: 'white', color: '#4C1D95' }}
        >
          {isLast ? "Let's go! →" : 'Next →'}
        </button>
        {!isLast && (
          <button onClick={() => setPanel(PANELS.length - 1)}
            className="block mx-auto mt-3 min-h-[48px] px-4 text-base font-bold text-white underline underline-offset-4" style={{ opacity: 0.9 }}>
            Skip the story
          </button>
        )}
        {isLast && (
          <p className="mt-4 text-sm font-semibold text-white" style={{ opacity: 0.9 }}>
            Next: a grown-up sets up a little profile (about 1 minute).
          </p>
        )}
      </div>
      <TalkHost />
    </main>
  );
}
