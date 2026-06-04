'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Sensory game types ───────────────────────────────────────────────────────
// Each round: find all items matching the target category

interface SensoryRound {
  prompt: string;
  target: string;       // category label
  targetColor: string;
  items: { emoji: string; category: string; }[];
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

// ─── Content banks ────────────────────────────────────────────────────────────

const COLOR_ROUNDS: SensoryRound[] = [
  { prompt: 'Tap all the 🔴 RED things!', target:'red', targetColor:'#EF4444',
    items: shuffle([
      {emoji:'🍎',category:'red'},{emoji:'🌹',category:'red'},{emoji:'🍓',category:'red'},
      {emoji:'🌊',category:'blue'},{emoji:'🍋',category:'yellow'},{emoji:'🌿',category:'green'},
      {emoji:'🍊',category:'orange'},{emoji:'🍇',category:'purple'},{emoji:'🎈',category:'red'},
      {emoji:'🌸',category:'pink'},{emoji:'🥕',category:'orange'},{emoji:'❄️',category:'blue'},
    ])},
  { prompt: 'Tap all the 🔵 BLUE things!', target:'blue', targetColor:'#3B82F6',
    items: shuffle([
      {emoji:'🌊',category:'blue'},{emoji:'💙',category:'blue'},{emoji:'🫐',category:'blue'},
      {emoji:'🍎',category:'red'},{emoji:'🌻',category:'yellow'},{emoji:'🐸',category:'green'},
      {emoji:'🏔️',category:'blue'},{emoji:'🍇',category:'purple'},{emoji:'🐟',category:'blue'},
      {emoji:'🌺',category:'red'},{emoji:'🌙',category:'yellow'},{emoji:'🍊',category:'orange'},
    ])},
  { prompt: 'Tap all the 🟡 YELLOW things!', target:'yellow', targetColor:'#F59E0B',
    items: shuffle([
      {emoji:'⭐',category:'yellow'},{emoji:'🌻',category:'yellow'},{emoji:'🍋',category:'yellow'},
      {emoji:'🍎',category:'red'},{emoji:'🐸',category:'green'},{emoji:'🌊',category:'blue'},
      {emoji:'🌙',category:'yellow'},{emoji:'🍌',category:'yellow'},{emoji:'🦁',category:'yellow'},
      {emoji:'🍇',category:'purple'},{emoji:'🌹',category:'red'},{emoji:'❄️',category:'blue'},
    ])},
];

const SHAPE_ROUNDS: SensoryRound[] = [
  { prompt: 'Find all the ROUND things! ⚪', target:'round', targetColor:'#7C3AED',
    items: shuffle([
      {emoji:'🍕',category:'triangle'},{emoji:'⚽',category:'round'},{emoji:'🌙',category:'crescent'},
      {emoji:'🎱',category:'round'},{emoji:'🟥',category:'square'},{emoji:'🔵',category:'round'},
      {emoji:'🍩',category:'round'},{emoji:'⬡',category:'hexagon'},{emoji:'🟢',category:'round'},
      {emoji:'🏀',category:'round'},{emoji:'🔷',category:'diamond'},{emoji:'⭕',category:'round'},
    ])},
  { prompt: 'Find things that have WINGS! 🪶', target:'wings', targetColor:'#059669',
    items: shuffle([
      {emoji:'🦋',category:'wings'},{emoji:'🐦',category:'wings'},{emoji:'🐟',category:'fins'},
      {emoji:'🦅',category:'wings'},{emoji:'🐛',category:'crawl'},{emoji:'🐝',category:'wings'},
      {emoji:'🐢',category:'crawl'},{emoji:'🦜',category:'wings'},{emoji:'🐍',category:'crawl'},
      {emoji:'🦆',category:'wings'},{emoji:'🐕',category:'legs'},{emoji:'🐞',category:'wings'},
    ])},
];

const PATTERN_ROUNDS: SensoryRound[] = [
  { prompt: 'Tap all the SWEET foods! 🍬', target:'sweet', targetColor:'#EC4899',
    items: shuffle([
      {emoji:'🍰',category:'sweet'},{emoji:'🥦',category:'veggie'},{emoji:'🍭',category:'sweet'},
      {emoji:'🥕',category:'veggie'},{emoji:'🍫',category:'sweet'},{emoji:'🧅',category:'veggie'},
      {emoji:'🍩',category:'sweet'},{emoji:'🥬',category:'veggie'},{emoji:'🍪',category:'sweet'},
      {emoji:'🍒',category:'sweet'},{emoji:'🥒',category:'veggie'},{emoji:'🍬',category:'sweet'},
    ])},
  { prompt: 'Tap all the ANIMALS with 4 legs! 🐾', target:'4legs', targetColor:'#D97706',
    items: shuffle([
      {emoji:'🐶',category:'4legs'},{emoji:'🐦',category:'wings'},{emoji:'🐱',category:'4legs'},
      {emoji:'🐟',category:'fins'},{emoji:'🐮',category:'4legs'},{emoji:'🐍',category:'crawl'},
      {emoji:'🦁',category:'4legs'},{emoji:'🦋',category:'wings'},{emoji:'🐘',category:'4legs'},
      {emoji:'🐠',category:'fins'},{emoji:'🐴',category:'4legs'},{emoji:'🦅',category:'wings'},
    ])},
];

const ALL_ROUNDS = [...COLOR_ROUNDS, ...SHAPE_ROUNDS, ...PATTERN_ROUNDS];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SensoryGamePage() {
  const { state, primarySensoryPattern } = useAssessment();

  const [roundPool] = useState<SensoryRound[]>(() => shuffle(ALL_ROUNDS));
  const [roundIdx, setRoundIdx]   = useState(0);
  const [tapped, setTapped]       = useState<Set<number>>(new Set());
  const [wrong, setWrong]         = useState<Set<number>>(new Set());
  const [phase, setPhase]         = useState<'playing'|'result'>('playing');
  const [score, setScore]         = useState(0);
  const [total, setTotal]         = useState(0);

  const round = roundPool[roundIdx % roundPool.length];
  const targets = round.items.filter(i => i.category === round.target);
  const targetCount = targets.length;
  const foundCount = [...tapped].filter(i => round.items[i]?.category === round.target).length;

  const handleTap = (idx: number) => {
    if (phase !== 'playing' || tapped.has(idx)) return;
    const item = round.items[idx];
    if (item.category === round.target) {
      const next = new Set(tapped); next.add(idx); setTapped(next);
      if (next.size - [...next].filter(i => round.items[i]?.category !== round.target).length === targetCount) {
        // All targets found
        const foundTargets = [...next].filter(i => round.items[i]?.category === round.target).length;
        if (foundTargets === targetCount) {
          setScore(s => s + 1); setTotal(t => t + 1); setPhase('result');
        }
      }
    } else {
      const w = new Set(wrong); w.add(idx); setWrong(w);
      setTimeout(() => { setWrong(prev => { const n = new Set(prev); n.delete(idx); return n; }); }, 600);
    }
  };

  const handleDone = () => {
    setTotal(t => t + 1); setPhase('result');
  };

  const nextRound = () => {
    setRoundIdx(r => r + 1);
    setTapped(new Set()); setWrong(new Set()); setPhase('playing');
  };

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;
  const missedTargets = round.items.filter((item, i) => item.category === round.target && !tapped.has(i));

  // Show sensory style tip if we have one
  const sensoryTip = primarySensoryPattern === 'Sensory Seeking'
    ? '🎢 Try the color rounds — lots of things to find!'
    : primarySensoryPattern === 'Sensory Sensitive'
    ? '🌊 Take your time — no rush!'
    : null;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #0c4a6e, #0891b2, #67e8f9)' }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-cyan-100 text-sm font-bold hover:text-white">← Games</Link>
          <h1 className="text-2xl font-extrabold text-white">🌈 Sense Explorer</h1>
          <span className="text-white text-sm font-bold">{score}/{total}</span>
        </div>

        {/* Stats */}
        <div className="rounded-2xl p-3 mb-4 flex justify-between items-center"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)' }}>
          <div className="text-center">
            <p className="text-xl font-extrabold text-yellow-300">{accuracy}%</p>
            <p className="text-xs text-cyan-200">Accuracy</p>
          </div>
          <div className="text-center px-3">
            <p className="text-white font-bold text-sm">{foundCount}/{targetCount} found</p>
            <div className="h-2 rounded-full mt-1" style={{ background:'rgba(255,255,255,0.2)', width:80 }}>
              <div className="h-2 rounded-full transition-all" style={{ width:`${(foundCount/targetCount)*100}%`, background: round.targetColor }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-green-300">{score}</p>
            <p className="text-xs text-cyan-200">Rounds ✓</p>
          </div>
        </div>

        {/* Prompt */}
        {phase === 'playing' && (
          <>
            <div className="rounded-2xl p-4 mb-4 text-center shadow-lg"
              style={{ background: `${round.targetColor}22`, border: `2px solid ${round.targetColor}` }}>
              <p className="text-xl font-extrabold text-white">{round.prompt}</p>
              <p className="text-sm text-white opacity-70 mt-1">Tap everything that matches — avoid the wrong ones!</p>
            </div>

            {/* Item grid */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {round.items.map((item, idx) => {
                const isTapped  = tapped.has(idx) && item.category === round.target;
                const isWrong   = wrong.has(idx);
                return (
                  <button key={idx} onClick={() => handleTap(idx)}
                    className={`aspect-square rounded-2xl flex items-center justify-center text-4xl transition-all hover:scale-110 active:scale-95 ${isWrong ? 'shake' : ''} ${isTapped ? 'pop' : ''}`}
                    style={{
                      background: isTapped
                        ? `${round.targetColor}30`
                        : isWrong
                        ? 'rgba(239,68,68,0.25)'
                        : 'rgba(255,255,255,0.15)',
                      border: isTapped
                        ? `3px solid ${round.targetColor}`
                        : isWrong
                        ? '3px solid #EF4444'
                        : '1.5px solid rgba(255,255,255,0.2)',
                      opacity: isTapped ? 0.5 : 1,
                    }}>
                    {isTapped ? '✓' : item.emoji}
                  </button>
                );
              })}
            </div>

            <button onClick={handleDone}
              className="w-full py-3 rounded-full font-bold text-white hover:scale-105 transition-all"
              style={{ background: `linear-gradient(135deg, ${round.targetColor}, #7C3AED)` }}>
              I'm Done! ✅
            </button>
          </>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="rounded-3xl p-7 text-center bounce-in shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.95)', border: `3px solid ${foundCount === targetCount ? '#059669' : '#F59E0B'}` }}>
            <div className="text-6xl mb-2">{foundCount === targetCount ? '🎉' : foundCount >= targetCount/2 ? '🌟' : '💪'}</div>
            <h2 className="text-2xl font-extrabold mb-1"
              style={{ color: foundCount === targetCount ? '#059669' : '#D97706' }}>
              {foundCount === targetCount ? 'Perfect! All found!' : `Found ${foundCount} of ${targetCount}!`}
            </h2>

            {/* Show correct items */}
            <div className="flex flex-wrap gap-2 justify-center my-4">
              {round.items.filter(i => i.category === round.target).map((i, idx) => (
                <span key={idx} className="text-3xl">{i.emoji}</span>
              ))}
            </div>
            <p className="text-gray-500 text-sm mb-4">
              These were all the <strong style={{ color: round.targetColor }}>{round.target}</strong> ones!
            </p>

            <button onClick={nextRound}
              className="px-8 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all"
              style={{ background: `linear-gradient(135deg, ${round.targetColor}, #EC4899)` }}>
              Next Round! →
            </button>
          </div>
        )}

        {/* Sensory tip */}
        {sensoryTip && (
          <div className="mt-4 rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <p className="text-cyan-100 text-xs">{sensoryTip}</p>
          </div>
        )}

        <p className="text-center text-cyan-200 text-xs mt-3">
          💡 Look carefully — some items can look similar!
        </p>
      </div>
    </main>
  );
}
