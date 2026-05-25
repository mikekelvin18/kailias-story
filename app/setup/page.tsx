'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment } from '@/context/AssessmentContext';

export default function SetupPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [preferParent, setPreferParent] = useState(false);
  const [error, setError] = useState('');
  const { setChildInfo, setAssessmentType } = useAssessment();
  const router = useRouter();

  const handleStart = () => {
    const ageNum = parseInt(age);
    if (!name.trim()) { setError('Please enter your child\'s first name.'); return; }
    if (!age || isNaN(ageNum) || ageNum < 2 || ageNum > 12) {
      setError('Please enter an age between 2 and 12.');
      return;
    }
    setChildInfo(name.trim(), ageNum);
    const type = (preferParent || ageNum <= 4) ? 'checklist' : 'games';
    setAssessmentType(type);
    router.push(type === 'checklist' ? '/assessment/checklist' : '/assessment/games');
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 50%, #667EEA 100%)' }}
    >
      {/* Floating stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['⭐','🌟','✨','💫','🎈','🎀'].map((s, i) => (
          <span
            key={i}
            className="absolute float"
            style={{
              left: `${(i * 19 + 3) % 92}%`,
              top: `${(i * 29 + 5) % 85}%`,
              fontSize: 24,
              animationDelay: `${i * 0.4}s`,
              opacity: 0.7,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="float inline-block mb-4">
            <span style={{ fontSize: 72 }}>🧒</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white drop-shadow-md mb-2">
            Tell Kailia About You!
          </h1>
          <p className="text-teal-100 text-lg">
            So she can find the perfect adventure for your child.
          </p>
        </div>

        <div className="rounded-3xl p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.97)' }}>
          {/* Child name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold text-lg mb-2">
              🌸 Child's First Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Emma"
              className="w-full border-2 border-purple-200 rounded-2xl px-5 py-3 text-lg text-gray-800 focus:outline-none focus:border-purple-500 transition-colors"
              style={{ background: '#F8F0FF' }}
            />
          </div>

          {/* Age */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold text-lg mb-2">
              🎂 Child's Age (2–12)
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i + 2).map(a => (
                <button
                  key={a}
                  onClick={() => setAge(String(a))}
                  className="w-12 h-12 rounded-full font-bold text-lg transition-all hover:scale-110"
                  style={{
                    background: age === String(a) ? '#7C3AED' : '#F3E8FF',
                    color: age === String(a) ? 'white' : '#7C3AED',
                    border: age === String(a) ? '3px solid #7C3AED' : '2px solid #DDD6FE',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Parent preference */}
          <div
            className="mb-6 rounded-2xl p-4 cursor-pointer transition-all"
            style={{
              background: preferParent ? '#EDE9FE' : '#F9FAFB',
              border: preferParent ? '2px solid #7C3AED' : '2px solid #E5E7EB',
            }}
            onClick={() => setPreferParent(p => !p)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{preferParent ? '✅' : '⬜'}</span>
              <div>
                <p className="font-bold text-gray-700">My child prefers parent help</p>
                <p className="text-sm text-gray-500 mt-1">
                  Use a parent questionnaire instead of the child games.
                  Great for younger children, shy kids, or kids who need extra support.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl p-3 text-red-700 font-semibold text-sm" style={{ background: '#FEE2E2' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl font-extrabold text-xl text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
          >
            Start Kailia's Adventure! ✨
          </button>

          <p className="text-center text-gray-400 text-xs mt-4">
            Ages 2–4 use a parent checklist by default. Ages 5–12 play the fun games.
          </p>
        </div>
      </div>
    </main>
  );
}
