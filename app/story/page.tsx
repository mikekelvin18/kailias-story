'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PANELS = [
  {
    emoji: '🌈',
    bg: 'linear-gradient(135deg, #667EEA, #764BA2)',
    title: 'Meet Kailia!',
    text: 'Deep in a colorful world filled with floating letters and magical numbers, there lived a curious girl named Kailia. She had bright eyes that sparkled like stars and a smile that could light up the darkest library.',
  },
  {
    emoji: '📚',
    bg: 'linear-gradient(135deg, #F093FB, #F5576C)',
    title: 'The World of Words',
    text: 'Kailia\'s world was full of wonder — bouncing letters that sang songs, numbers that danced on lily pads, and stories hiding behind every door. But the adventures were better when she had a friend along!',
  },
  {
    emoji: '🗺️',
    bg: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
    title: 'A Special Map',
    text: 'One day, Kailia found a magical map. It showed four hidden lands: the Land of Reading, the Land of Writing, the Land of Talking, and the Land of Numbers. "I can\'t explore them all alone," she said.',
  },
  {
    emoji: '⭐',
    bg: 'linear-gradient(135deg, #F6D365, #FDA085)',
    title: 'She Needs YOU!',
    text: 'Kailia looked around and smiled right at you. "I\'ve been waiting for you! Every adventure is different because every learner is special. Let\'s discover your path together — there\'s no wrong way to explore!"',
  },
];

export default function StoryPage() {
  const [panel, setPanel] = useState(0);
  const router = useRouter();
  const current = PANELS[panel];
  const isLast = panel === PANELS.length - 1;

  const next = () => {
    if (isLast) {
      router.push('/setup');
    } else {
      setPanel(p => p + 1);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-all duration-500"
      style={{ background: current.bg }}
    >
      <div className="max-w-lg w-full text-center">
        {/* Progress dots */}
        <div className="flex justify-center gap-3 mb-10">
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

        {/* Emoji */}
        <div className="float mb-8">
          <span style={{ fontSize: 96 }}>{current.emoji}</span>
        </div>

        {/* Story card */}
        <div
          className="rounded-3xl p-8 mb-8 shadow-2xl bounce-in"
          key={panel}
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">{current.title}</h2>
          <p className="text-gray-600 text-lg leading-relaxed">{current.text}</p>
        </div>

        <button
          onClick={next}
          className="text-xl font-bold px-10 py-4 rounded-full shadow-xl text-white transition-transform hover:scale-105"
          style={{ background: 'rgba(255,255,255,0.25)', border: '3px solid white' }}
        >
          {isLast ? "Let's Begin! 🚀" : 'Next →'}
        </button>
      </div>
    </main>
  );
}
