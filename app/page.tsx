'use client';

import Link from 'next/link';
import KailiaAvatar from '@/components/KailiaAvatar';

const STARS = ['⭐', '🌟', '✨', '💫', '🌠'];

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%)' }}
    >
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl float sparkle"
            style={{
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 23 + 8) % 90}%`,
              animationDelay: `${i * 0.3}s`,
              fontSize: `${16 + (i % 3) * 8}px`,
            }}
          >
            {STARS[i % STARS.length]}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Kailia character (emoji-based, no licensing needed) */}
        <div className="float mb-6">
          <div className="inline-flex items-center justify-center" style={{ width: 150, height: 150 }}>
            <KailiaAvatar size={150} />
          </div>
        </div>

        <h1
          className="text-5xl font-extrabold text-white mb-3 drop-shadow-lg"
          style={{ textShadow: '2px 4px 8px rgba(0,0,0,0.3)' }}
        >
          Kailia's Story
        </h1>
        <p className="text-2xl text-purple-100 mb-8 font-semibold">
          A Magical Learning Adventure
        </p>

        {/* Story intro card */}
        <div
          className="rounded-3xl p-8 mb-8 shadow-2xl text-left"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            <span className="text-3xl mr-2">🌈</span>
            <strong>Kailia</strong> lives in a colorful world where words, numbers, and stories come alive!
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            She loves going on adventures — but she needs a special helper. Someone just like <strong>you!</strong>
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            <span className="text-2xl mr-2">🗺️</span>
            To join her journey, Kailia wants to learn what amazing things you already know.
            <strong> Let's find out together!</strong>
          </p>

          <div
            className="mt-6 rounded-2xl p-4 text-sm text-purple-700"
            style={{ background: '#F3E8FF' }}
          >
            <span className="text-lg mr-2">💜</span>
            <strong>For parents:</strong> This is a fun learning journey, not a test. We use
            play-based activities inspired by child development research to match your child
            with the right learning path.
          </div>
        </div>

        <Link
          href="/story"
          className="inline-block text-2xl font-bold text-purple-800 px-12 py-5 rounded-full shadow-xl transition-transform hover:scale-105 hover:shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FF8C00)' }}
        >
          Start the Adventure! 🚀
        </Link>

        <p className="mt-6 text-purple-200 text-sm">
          Free • No sign-up required • For ages 2–12
        </p>
      </div>
    </main>
  );
}
