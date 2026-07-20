'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';

// ─── Moonlight Match ──────────────────────────────────────────────────────────
// The owl's memory riddle: moonlit feathers hide sleeping creatures — flip
// two, find the pairs. Video-game feel: 3D card flips, combo streaks with
// rising chimes, endless levels that add pairs and new content sets.
// Measures visual memory: flips needed per pair, mismatches, time.

interface CardT {
  id: number;
  face: string;      // what's shown when flipped
  matchKey: string;  // two cards share this to form a pair
  state: 'down' | 'up' | 'matched';
}

const CREATURES = ['🦊', '🐰', '🦉', '🐸', '🦋', '🐝', '🐢', '🦄', '🐞', '🐿️'];
const SHAPES = ['🔵', '🔺', '🟩', '⭐', '❤️', '🟣', '🌙', '☀️', '🍀', '💎'];
const LETTERS = ['Aa', 'Bb', 'Dd', 'Ee', 'Gg', 'Mm', 'Rr', 'Ss', 'Tt', 'Ff'];

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound is a bonus */ }
}

const sfx = {
  flip: () => playNotes([{ f: 520, t: 0, d: 0.07 }]),
  // combo chimes rise in pitch with the streak
  match: (streak: number) => playNotes([{ f: 660 + streak * 80, t: 0, d: 0.12 }, { f: 880 + streak * 80, t: 0.08, d: 0.2 }]),
  miss: () => playNotes([{ f: 240, t: 0, d: 0.16 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function MoonlightMatchPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<CardT[]>([]);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState<{ id: number; text: string } | null>(null);
  const [noelLine, setNoelLine] = useState('Flip two feathers — find the sleeping friends that match!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const openRef = useRef<number | null>(null);
  const statsRef = useRef({ flips: 0, mismatches: 0, startedAt: 0, bestStreak: 0 });

  useEffect(() => { setLevel(nextGameLevel('moonlight-match')); }, []);

  // pairs grow with level; the starting size and cap follow the child's tier
  const pairsForLevel = useCallback((lvl: number) => {
    const base = tier === 'tiny' ? 2 : tier === 'small' ? 3 : 4;
    const cap = tier === 'tiny' ? 6 : tier === 'small' ? 8 : 10;
    return Math.min(base + (lvl - 1), cap);
  }, [tier]);

  const startLevel = useCallback((lvl: number) => {
    const pairs = pairsForLevel(lvl);
    // content rotates by level; readers sometimes get letter pairs (A ↔ a)
    const useLetters = tier === 'big' && lvl % 3 === 0;
    const pool = useLetters ? LETTERS : lvl % 2 === 0 ? SHAPES : CREATURES;
    const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck: CardT[] = chosen.flatMap((key, i) => {
      const [a, b] = useLetters ? [key[0], key[1]] : [key, key];
      return [
        { id: i * 2, face: a, matchKey: key, state: 'down' as const },
        { id: i * 2 + 1, face: b, matchKey: key, state: 'down' as const },
      ];
    }).sort(() => Math.random() - 0.5);
    statsRef.current = { flips: 0, mismatches: 0, startedAt: Date.now(), bestStreak: 0 };
    openRef.current = null;
    busyRef.current = false;
    completedRef.current = false;
    setStreak(0);
    setCards(deck);
    setNoelLine(useLetters
      ? 'Tricky level — match the BIG letter with its little twin!'
      : 'Flip two feathers — find the friends that match!');
    setNoelMood('excited');
    setPhase('playing');
  }, [pairsForLevel, tier]);

  function flip(cardId: number) {
    if (phase !== 'playing' || busyRef.current) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.state !== 'down') return;
    sfx.flip();
    statsRef.current.flips += 1;
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, state: 'up' } : c)));

    if (openRef.current === null) { openRef.current = cardId; return; }

    const first = cards.find(c => c.id === openRef.current)!;
    openRef.current = null;
    busyRef.current = true;

    if (first.matchKey === card.matchKey) {
      const newStreak = streak + 1;
      setTimeout(() => {
        sfx.match(newStreak);
        setStreak(newStreak);
        statsRef.current.bestStreak = Math.max(statsRef.current.bestStreak, newStreak);
        setBurst({ id: Date.now(), text: newStreak >= 2 ? `✨ Combo ×${newStreak}!` : '✨ Match!' });
        setCards(prev => prev.map(c => (c.matchKey === card.matchKey ? { ...c, state: 'matched' as const } : c)));
        busyRef.current = false;
      }, 350);
    } else {
      statsRef.current.mismatches += 1;
      setTimeout(() => {
        sfx.miss();
        setStreak(0);
        setNoelLine('Hmm, not twins! Remember where they sleep…');
        setNoelMood('thinking');
        setCards(prev => prev.map(c => (c.state === 'up' ? { ...c, state: 'down' } : c)));
        busyRef.current = false;
      }, 750);
    }
  }

  function completeLevel() {
    const s = statsRef.current;
    const pairs = pairsForLevel(level);
    logQuestMetric('processing', 'moonlight-match', {
      level, pairs, flips: s.flips, mismatches: s.mismatches,
      memoryEfficiency: Math.round(((pairs * 2) / Math.max(1, s.flips)) * 100),
      bestStreak: s.bestStreak,
      totalMs: Date.now() - s.startedAt,
    });
    awardStarlight(Math.max(8, 12 + level * 3 - s.mismatches));
    recordGameLevel('moonlight-match', level);
    sfx.fanfare();
    setNoelMood('celebrating');
    setPhase('levelDone');
  }

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 900);
    return () => clearTimeout(t);
  }, [burst]);

  // level completion lives OUTSIDE state updaters so it fires exactly once
  useEffect(() => {
    if (phase !== 'playing' || cards.length === 0) return;
    if (cards.every(c => c.state === 'matched') && !completedRef.current) {
      completedRef.current = true;
      const t = setTimeout(() => completeLevel(), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, phase]);

  const pairs = pairsForLevel(level);
  const cols = pairs <= 3 ? 3 : pairs <= 6 ? 4 : pairs <= 8 ? 4 : 5;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #0c0a2e 0%, #1e1b4b 55%, #312e81 100%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        {['🌙', '⭐', '✨', '☁️'].map((e, i) => (
          <span key={i} className="absolute sparkle" style={{ left: `${[6, 82, 45, 68][i]}%`, top: [6, 30, 90, 150][i], fontSize: [30, 16, 14, 24][i], opacity: 0.5, animationDelay: `${i * 0.6}s`, pointerEvents: 'none' }}>{e}</span>
        ))}

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="text-sm font-bold text-indigo-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🦉 Moonlight Match <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="text-sm font-extrabold text-yellow-300 w-14 text-right">
            {streak >= 2 ? `🔥×${streak}` : ''}
          </span>
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-8 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={90} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="text-6xl mb-4 float">🦉</span>
              <KailiaSprite size={110} expression="thinking" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                The wise owl hid her friends under <strong>moonlit feathers</strong>! 🪶
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Flip two at a time and remember where everyone sleeps. Match pairs in a row for
                <strong> combo magic</strong>! ✨
              </p>
            </div>
            <button onClick={() => startLevel(level)}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Level {level} — flip! 🪶
            </button>
            <SkillIntro gameId="moonlight-match" />
          </div>
        )}

        {/* ── The board ── */}
        {phase !== 'intro' && (
          <div className="relative z-10">
            <div className="grid gap-2.5 mt-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {cards.map(c => (
                <button key={c.id} data-mkey={c.matchKey} data-state={c.state} onClick={() => flip(c.id)}
                  className="relative w-full"
                  style={{ aspectRatio: '3 / 4', perspective: 600 }}>
                  <div className="absolute inset-0 transition-transform duration-300"
                    style={{ transformStyle: 'preserve-3d', transform: c.state === 'down' ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
                    {/* feather back */}
                    <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #4338CA, #6D28D9)', border: '2px solid #818CF8', boxShadow: '0 3px 10px rgba(0,0,0,0.4)' }}>
                      🪶
                    </div>
                    {/* face */}
                    <div className={`absolute inset-0 rounded-2xl flex items-center justify-center font-extrabold ${c.state === 'matched' ? 'star-burst' : ''}`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                        fontSize: c.face.length === 1 && /[A-Za-z]/.test(c.face) ? 34 : 30,
                        color: '#312E81',
                        background: c.state === 'matched' ? 'linear-gradient(135deg, #FEF9C3, #FDE68A)' : 'white',
                        border: c.state === 'matched' ? '2.5px solid #FBBF24' : '2px solid #C7D2FE',
                        boxShadow: c.state === 'matched' ? '0 0 14px rgba(253,224,71,0.6)' : '0 3px 10px rgba(0,0,0,0.3)' }}>
                      {c.face}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* combo burst */}
            {burst && (
              <p key={burst.id} className="text-center text-2xl font-extrabold text-yellow-300 drop-shadow mt-3 pop">{burst.text}</p>
            )}

            {/* Noel guide */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Level complete ── */}
      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #312e81ee, #6d28d9ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">🦉</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-indigo-100 font-semibold mb-1">Every friend found their twin under the moon! 🌙</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">
              ✨ +{Math.max(8, 12 + level * 3 - statsRef.current.mismatches)} starlight
              {statsRef.current.bestStreak >= 2 && ` · best combo ×${statsRef.current.bestStreak}!`}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                Back to the map 🗺️
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
