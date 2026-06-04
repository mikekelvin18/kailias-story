'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Story decks by level ─────────────────────────────────────────────────────

interface StoryCard { id: number; emoji: string; text: string; }
interface Story { title: string; cards: StoryCard[]; moral?: string; }

const DECKS: Story[][] = [
  // Level 0 — 3-5 year (2-3 cards, emoji-heavy)
  [
    { title: "Kailia's Morning", cards: [
      { id:1, emoji:'😴', text:'Kailia wakes up.' },
      { id:2, emoji:'🥣', text:'She eats breakfast.' },
      { id:3, emoji:'🎒', text:'She goes to school.' },
    ]},
    { title: "The Little Seed", cards: [
      { id:1, emoji:'🌱', text:'A seed is planted.' },
      { id:2, emoji:'💧', text:'It gets watered.' },
      { id:3, emoji:'🌻', text:'A flower grows!' },
    ]},
    { title: "Bedtime", cards: [
      { id:1, emoji:'🛁', text:'Take a bath.' },
      { id:2, emoji:'📖', text:'Read a book.' },
      { id:3, emoji:'😴', text:'Go to sleep.' },
    ]},
  ],
  // Level 1 — 5-7 year (3-4 cards)
  [
    { title: "Kailia Bakes Cookies", cards: [
      { id:1, emoji:'📝', text:'Get the recipe.' },
      { id:2, emoji:'🥚', text:'Mix the ingredients.' },
      { id:3, emoji:'🔥', text:'Bake in the oven.' },
      { id:4, emoji:'🍪', text:'Eat the cookies!' },
    ]},
    { title: "The Lost Puppy", cards: [
      { id:1, emoji:'🐶', text:'A puppy gets lost.' },
      { id:2, emoji:'😢', text:'The puppy is sad and alone.' },
      { id:3, emoji:'👧', text:'A girl finds the puppy.' },
      { id:4, emoji:'🏠', text:'The puppy goes home.' },
    ]},
    { title: "Growing a Garden", cards: [
      { id:1, emoji:'🌍', text:'Dig the soil.' },
      { id:2, emoji:'🌰', text:'Plant the seeds.' },
      { id:3, emoji:'☀️', text:'Water and wait.' },
      { id:4, emoji:'🥕', text:'Pick the vegetables!' },
    ]},
  ],
  // Level 2 — 7-10 year (4 cards, more complex narrative)
  [
    { title: "The Science Fair", cards: [
      { id:1, emoji:'💡', text:'Kailia has an idea for an experiment.' },
      { id:2, emoji:'📚', text:'She researches and gathers materials.' },
      { id:3, emoji:'🔬', text:'She conducts the experiment.' },
      { id:4, emoji:'🏆', text:'She wins first place at the fair!' },
    ]},
    { title: "A Day at the Beach", cards: [
      { id:1, emoji:'🚗', text:'The family drives to the beach.' },
      { id:2, emoji:'🏖️', text:'They build sandcastles.' },
      { id:3, emoji:'🌊', text:'A big wave knocks the castle down.' },
      { id:4, emoji:'😄', text:'They laugh and build an even bigger one.' },
    ]},
    { title: "The Broken Bike", cards: [
      { id:1, emoji:'🚲', text:"Kailia's bike chain breaks." },
      { id:2, emoji:'🔍', text:'She figures out what is wrong.' },
      { id:3, emoji:'🔧', text:'She learns how to fix it.' },
      { id:4, emoji:'🌟', text:'She rides proudly down the street!' },
    ], moral: 'When something breaks, we can learn to fix it ourselves.' },
  ],
  // Level 3 — 10-12 year (4 cards + moral/inference)
  [
    { title: "The New Student", cards: [
      { id:1, emoji:'🏫', text:'A new student arrives at school feeling nervous.' },
      { id:2, emoji:'😶', text:'No one talks to her at lunch. She sits alone.' },
      { id:3, emoji:'🤝', text:'Kailia invites her to sit with the group.' },
      { id:4, emoji:'👭', text:'They become best friends over time.' },
    ], moral: 'One small act of kindness can change everything.' },
    { title: "The Lost Key", cards: [
      { id:1, emoji:'🔑', text:'Kailia loses the key to her journal.' },
      { id:2, emoji:'🔎', text:'She searches everywhere but cannot find it.' },
      { id:3, emoji:'🛋️', text:'She retraces her steps to the couch.' },
      { id:4, emoji:'😊', text:'The key was hidden under the cushion all along.' },
    ], moral: 'When you lose something, think about where you last had it.' },
  ],
];

function getLevelFromStage(stage: string, age: number | null): number {
  const a = age ?? 8;
  if (a <= 4) return 0;
  if (a <= 7) return 1;
  if (a <= 10) return 2;
  return 3;
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const LEVEL_LABELS = ['Beginner', 'Junior', 'Reader', 'Explorer'];
const COLORS = ['#EC4899','#7C3AED','#2563EB','#059669'];

export default function StoryPage() {
  const { state, learningStage } = useAssessment();
  const defaultLevel = getLevelFromStage(learningStage, state.childAge);
  const [level, setLevel] = useState(defaultLevel);
  const [storyIdx, setStoryIdx] = useState(0);
  const [phase, setPhase]   = useState<'sort'|'result'>('sort');
  const [score, setScore]   = useState(0);
  const [played, setPlayed] = useState(0);
  const [dragging, setDragging] = useState<number|null>(null);
  const [cards, setCards] = useState<StoryCard[]>(() => shuffle(DECKS[defaultLevel][0].cards));

  const deck  = DECKS[level];
  const story = deck[storyIdx % deck.length];
  const color = COLORS[level];

  const loadStory = (lvl: number, idx: number) => {
    const s = DECKS[lvl][idx % DECKS[lvl].length];
    setCards(shuffle(s.cards));
    setPhase('sort');
  };

  const handleLevelChange = (l: number) => {
    setLevel(l); setStoryIdx(0); setScore(0); setPlayed(0);
    setDragging(null); loadStory(l, 0);
  };

  const handleDragStart = (idx: number) => setDragging(idx);
  const handleDragOver  = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (toIdx: number) => {
    if (dragging === null || dragging === toIdx) return;
    const next = [...cards];
    const [item] = next.splice(dragging, 1);
    next.splice(toIdx, 0, item);
    setCards(next);
    setDragging(null);
  };

  const handleCheck = () => {
    const correct = cards.every((c, i) => c.id === story.cards[i].id);
    setPlayed(p => p + 1);
    if (correct) setScore(s => s + 1);
    setPhase('result');
  };

  const handleNext = () => {
    const next = (storyIdx + 1) % deck.length;
    setStoryIdx(next);
    loadStory(level, next);
  };

  const accuracy = played > 0 ? Math.round((score / played) * 100) : 100;
  const isCorrect = cards.every((c, i) => c.id === story.cards[i].id);

  // Simple touch-based reorder using move-up / move-down buttons for mobile
  const moveCard = (idx: number, dir: -1|1) => {
    const to = idx + dir;
    if (to < 0 || to >= cards.length) return;
    const next = [...cards];
    [next[idx], next[to]] = [next[to], next[idx]];
    setCards(next);
  };

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: `linear-gradient(135deg, #500724, ${color}88, #1a1a2e)` }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-pink-200 text-sm font-bold hover:text-white">← Games</Link>
          <h1 className="text-2xl font-extrabold text-white">🃏 Story Flip</h1>
          <span className="text-pink-200 text-sm font-bold">{score}/{played}</span>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {LEVEL_LABELS.map((l, i) => (
            <button key={i} onClick={() => handleLevelChange(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: i===level ? COLORS[i] : 'rgba(255,255,255,0.1)',
                color: i===level ? 'white' : 'rgba(255,255,255,0.6)',
                border: `1.5px solid ${i===level ? COLORS[i] : 'rgba(255,255,255,0.15)'}`,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="rounded-2xl p-3 mb-4 flex justify-between"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <div className="text-center">
            <p className="text-xl font-extrabold text-yellow-300">{accuracy}%</p>
            <p className="text-xs text-pink-200">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm">{story.title}</p>
            <p className="text-pink-200 text-xs">Put the cards in order!</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-green-300">{score}</p>
            <p className="text-xs text-pink-200">Correct</p>
          </div>
        </div>

        {/* Cards */}
        {phase === 'sort' && (
          <div className="space-y-3 mb-5">
            {cards.map((card, idx) => (
              <div key={card.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className="rounded-2xl p-4 flex items-center gap-4 shadow-lg transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing select-none"
                style={{
                  background: dragging === idx ? `${color}30` : 'rgba(255,255,255,0.92)',
                  border: `2px solid ${dragging === idx ? color : 'rgba(255,255,255,0.4)'}`,
                  transform: dragging === idx ? 'scale(1.03)' : undefined,
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0"
                  style={{ background: color }}>
                  {idx + 1}
                </div>
                <span className="text-3xl flex-shrink-0">{card.emoji}</span>
                <p className="text-gray-800 font-semibold text-sm flex-1">{card.text}</p>
                {/* Mobile move buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveCard(idx, -1)} disabled={idx===0}
                    className="w-7 h-7 rounded-lg text-xs font-bold disabled:opacity-20 transition-all hover:scale-110"
                    style={{ background: color, color:'white' }}>↑</button>
                  <button onClick={() => moveCard(idx, 1)} disabled={idx===cards.length-1}
                    className="w-7 h-7 rounded-lg text-xs font-bold disabled:opacity-20 transition-all hover:scale-110"
                    style={{ background: color, color:'white' }}>↓</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Check button */}
        {phase === 'sort' && (
          <button onClick={handleCheck}
            className="w-full py-4 rounded-full font-extrabold text-xl text-white shadow-lg hover:scale-105 transition-all"
            style={{ background: `linear-gradient(135deg, ${color}, #EC4899)` }}>
            Check My Order! ✅
          </button>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="rounded-3xl p-7 text-center bounce-in shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.95)', border: `3px solid ${isCorrect ? '#059669' : '#EF4444'}` }}>
            <div className="text-6xl mb-3">{isCorrect ? '🎉' : '🔄'}</div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: isCorrect ? '#059669' : '#EF4444' }}>
              {isCorrect ? 'Perfect Order!' : 'Not quite — try again!'}
            </h2>

            {/* Show correct order */}
            <div className="text-left space-y-2 mb-4">
              {story.cards.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl"
                  style={{ background: isCorrect ? '#D1FAE5' : '#F3F4F6' }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: color }}>{i+1}</span>
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <span className="text-gray-700 text-sm font-medium">{c.text}</span>
                </div>
              ))}
            </div>

            {story.moral && (
              <div className="rounded-2xl p-4 mb-4 text-left"
                style={{ background: `${color}15`, border: `2px solid ${color}44` }}>
                <p className="text-sm font-bold" style={{ color }}>💜 Story lesson:</p>
                <p className="text-gray-700 text-sm italic mt-1">"{story.moral}"</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!isCorrect && (
                <button onClick={() => { setCards(shuffle(story.cards)); setPhase('sort'); }}
                  className="px-5 py-3 rounded-full font-bold text-gray-600 border-2 border-gray-300 hover:scale-105 transition-all text-sm">
                  🔄 Try Again
                </button>
              )}
              <button onClick={handleNext}
                className="px-6 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all text-sm"
                style={{ background: `linear-gradient(135deg, ${color}, #7C3AED)` }}>
                Next Story →
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-pink-200 text-xs mt-4">
          💡 Drag cards (or use ↑↓ buttons) to put them in the right order!
        </p>
      </div>
    </main>
  );
}
