'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAssessment } from '@/context/AssessmentContext';

// ─── Level config ──────────────────────────────────────────────────────────────

interface LevelConfig {
  cols: number;
  rows: number;
  targetEmoji: string;
  targetLabel: string;
  distractors: string[];
  targetCount: number;
  timeLimit: number | null; // null = no timer
  label: string;
}

const LEVELS: LevelConfig[] = [
  // Level 1 — ages 3-5, no timer
  { cols: 4, rows: 3, targetEmoji: '⭐', targetLabel: 'stars', distractors: ['🍎','🌸','🎈','🐱'], targetCount: 4, timeLimit: null, label: 'Beginner' },
  // Level 2 — ages 5-7, 90s
  { cols: 5, rows: 4, targetEmoji: '🦋', targetLabel: 'butterflies', distractors: ['🌻','🍊','🎀','🍦','🐸'], targetCount: 6, timeLimit: 90, label: 'Junior' },
  // Level 3 — ages 7-9, 60s
  { cols: 6, rows: 4, targetEmoji: '🌙', targetLabel: 'moons', distractors: ['🌟','☀️','⚡','🌈','💧','🔮'], targetCount: 7, timeLimit: 60, label: 'Explorer' },
  // Level 4 — ages 9-11, 45s
  { cols: 7, rows: 5, targetEmoji: '🔑', targetLabel: 'keys', distractors: ['🗝️','🔐','🔒','🎸','🔔','🎵','🎹'], targetCount: 8, timeLimit: 45, label: 'Advanced' },
  // Level 5 — ages 11+, 30s
  { cols: 8, rows: 5, targetEmoji: '🎯', targetLabel: 'targets', distractors: ['🏹','🎳','🎪','🎲','🎰','🎭','🃏','🎮'], targetCount: 10, timeLimit: 30, label: 'Expert' },
];

function getLevelIdx(stage: string, age: number | null): number {
  const a = age ?? 8;
  if (a <= 4) return 0;
  if (a <= 6) return 1;
  if (a <= 8) return 2;
  if (a <= 10) return 3;
  return 4;
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

interface Cell { id: number; emoji: string; isTarget: boolean; found: boolean; wrong: boolean; }

function buildGrid(cfg: LevelConfig): Cell[] {
  const total = cfg.cols * cfg.rows;
  const cells: Cell[] = Array.from({ length: total }, (_, i) => ({
    id: i, emoji: cfg.distractors[i % cfg.distractors.length], isTarget: false, found: false, wrong: false,
  }));
  // Place targets at random positions
  const positions = [...Array(total).keys()].sort(() => Math.random() - 0.5).slice(0, cfg.targetCount);
  positions.forEach(pos => { cells[pos].emoji = cfg.targetEmoji; cells[pos].isTarget = true; });
  // Shuffle distractors too
  cells.forEach((c, i) => {
    if (!c.isTarget) c.emoji = cfg.distractors[Math.floor(Math.random() * cfg.distractors.length)];
  });
  return cells;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VisualScanPage() {
  const { state, learningStage } = useAssessment();
  const levelIdx = getLevelIdx(learningStage, state.childAge);
  const [currentLevel, setCurrentLevel] = useState(levelIdx);
  const cfg = LEVELS[currentLevel];

  const [cells, setCells]           = useState<Cell[]>(() => buildGrid(cfg));
  const [found, setFound]           = useState(0);
  const [misses, setMisses]         = useState(0);
  const [timeLeft, setTimeLeft]     = useState(cfg.timeLimit);
  const [phase, setPhase]           = useState<'playing'|'win'|'timeout'>('playing');
  const [showFlash, setShowFlash]   = useState<'correct'|'wrong'|null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((lvl: number) => {
    const c = LEVELS[lvl];
    setCells(buildGrid(c));
    setFound(0); setMisses(0);
    setTimeLeft(c.timeLimit);
    setPhase('playing'); setShowFlash(null);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing' || cfg.timeLimit === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) { setPhase('timeout'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, cfg.timeLimit, currentLevel]);

  const handleTap = (id: number) => {
    if (phase !== 'playing') return;
    const cell = cells[id];
    if (cell.found) return;

    if (cell.isTarget) {
      const next = cells.map(c => c.id === id ? { ...c, found: true, wrong: false } : c);
      setCells(next);
      const newFound = found + 1;
      setFound(newFound);
      setShowFlash('correct');
      setTimeout(() => setShowFlash(null), 400);
      if (newFound >= cfg.targetCount) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('win');
      }
    } else {
      setCells(prev => prev.map(c => c.id === id ? { ...c, wrong: true } : c));
      setTimeout(() => setCells(prev => prev.map(c => c.id === id ? { ...c, wrong: false } : c)), 400);
      setMisses(m => m + 1);
      setShowFlash('wrong');
      setTimeout(() => setShowFlash(null), 400);
    }
  };

  const handleLevelChange = (lvl: number) => {
    setCurrentLevel(lvl);
    startGame(lvl);
  };

  const accuracy = found + misses > 0 ? Math.round((found / (found + misses)) * 100) : 100;
  const timeUsed = cfg.timeLimit !== null && timeLeft !== null ? cfg.timeLimit - timeLeft : 0;

  const cellSize = cfg.cols <= 4 ? 72 : cfg.cols <= 5 ? 60 : cfg.cols <= 6 ? 52 : cfg.cols <= 7 ? 46 : 40;
  const emojiSize = cfg.cols <= 4 ? 32 : cfg.cols <= 5 ? 28 : cfg.cols <= 6 ? 24 : cfg.cols <= 7 ? 22 : 18;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg, #1a1a2e, #4c1d95, #1e3a8a)' }}>
      {/* Flash overlay */}
      {showFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl bounce-in">{showFlash === 'correct' ? '✅' : '❌'}</div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/play" className="text-purple-300 text-sm font-bold hover:text-white">← Games</Link>
          <h1 className="text-2xl font-extrabold text-white">🔍 Star Hunt</h1>
          <div className="text-right">
            <p className="text-purple-300 text-xs">{cfg.label}</p>
          </div>
        </div>

        {/* Level selector */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {LEVELS.map((l, i) => (
            <button key={i} onClick={() => handleLevelChange(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{
                background: i === currentLevel ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                color: i === currentLevel ? 'white' : '#C4B5FD',
                border: `1.5px solid ${i === currentLevel ? '#7C3AED' : 'rgba(167,139,250,0.3)'}`,
              }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-yellow-300">{found}/{cfg.targetCount}</p>
            <p className="text-purple-300 text-xs">Found</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-white">Find all <span className="text-3xl">{cfg.targetEmoji}</span></p>
            <p className="text-purple-300 text-xs">{cfg.targetLabel}</p>
          </div>
          <div className="text-center">
            {cfg.timeLimit !== null ? (
              <>
                <p className={`text-2xl font-extrabold ${(timeLeft ?? 0) <= 10 ? 'text-red-400' : 'text-green-400'}`}>{timeLeft}s</p>
                <p className="text-purple-300 text-xs">Time left</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-green-400">∞</p>
                <p className="text-purple-300 text-xs">No timer</p>
              </>
            )}
          </div>
        </div>

        {/* Grid */}
        {phase === 'playing' && (
          <div className="rounded-3xl overflow-hidden p-4 mb-4"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(167,139,250,0.3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`, gap: 6 }}>
              {cells.map(cell => (
                <button key={cell.id}
                  onClick={() => handleTap(cell.id)}
                  className={`rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${cell.found ? 'opacity-30' : ''} ${cell.wrong ? 'shake' : ''}`}
                  style={{
                    width: cellSize, height: cellSize,
                    background: cell.found
                      ? 'rgba(16,185,129,0.2)'
                      : cell.wrong
                      ? 'rgba(239,68,68,0.3)'
                      : 'rgba(255,255,255,0.08)',
                    border: cell.found
                      ? '2px solid #10B981'
                      : cell.wrong
                      ? '2px solid #EF4444'
                      : '1.5px solid rgba(255,255,255,0.1)',
                    fontSize: emojiSize,
                  }}>
                  {cell.found ? '✓' : cell.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {phase === 'playing' && (
          <div className="h-3 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-3 rounded-full transition-all" style={{ width: `${(found / cfg.targetCount) * 100}%`, background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
          </div>
        )}

        {/* Win screen */}
        {phase === 'win' && (
          <div className="rounded-3xl p-8 text-center bounce-in"
            style={{ background: 'rgba(255,255,255,0.12)', border: '3px solid #7C3AED' }}>
            <div className="text-7xl mb-3 float">🎉</div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Amazing! All {cfg.targetCount} found!</h2>
            <div className="flex justify-center gap-6 mb-5">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-yellow-300">{accuracy}%</p>
                <p className="text-purple-300 text-sm">Accuracy</p>
              </div>
              {cfg.timeLimit !== null && (
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-green-400">{timeUsed}s</p>
                  <p className="text-purple-300 text-sm">Time used</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-extrabold text-red-400">{misses}</p>
                <p className="text-purple-300 text-sm">Misses</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => startGame(currentLevel)}
                className="px-6 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                🔄 Play Again
              </button>
              {currentLevel < LEVELS.length - 1 && (
                <button onClick={() => handleLevelChange(currentLevel + 1)}
                  className="px-6 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #059669, #2563EB)' }}>
                  Next Level →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Timeout screen */}
        {phase === 'timeout' && (
          <div className="rounded-3xl p-8 text-center bounce-in"
            style={{ background: 'rgba(239,68,68,0.15)', border: '3px solid #EF4444' }}>
            <div className="text-7xl mb-3">⏰</div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Time's up!</h2>
            <p className="text-purple-200 mb-4">You found <strong className="text-yellow-300">{found}</strong> out of {cfg.targetCount} {cfg.targetLabel}. Keep practicing!</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => startGame(currentLevel)}
                className="px-8 py-3 rounded-full font-extrabold text-white hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                🔄 Try Again
              </button>
              {currentLevel > 0 && (
                <button onClick={() => handleLevelChange(currentLevel - 1)}
                  className="px-6 py-3 rounded-full font-bold text-white hover:scale-105 transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
                  Easier Level
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tip */}
        {phase === 'playing' && (
          <p className="text-center text-purple-400 text-xs mt-3">
            💡 Tip: Scan slowly from left to right — like reading a book!
          </p>
        )}
      </div>
    </main>
  );
}
