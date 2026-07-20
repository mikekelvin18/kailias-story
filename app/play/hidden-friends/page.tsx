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

// ─── Where's Noel? ────────────────────────────────────────────────────────────
// Seek-and-find in the Where's-Waldo tradition: busy story scenes packed
// with look-alike creatures and objects. Noel is hiding among other bears,
// plus themed treasures among their own foils. Levels add clutter and
// shrink everything. Measures visual scanning & discrimination.

interface SceneDef {
  name: string; emoji: string; story: string;
  bg: string;
  distractors: string[];        // the crowd (includes look-alike foils!)
  treasure: { emoji: string; count: number; label: string };
}

const SCENES: SceneDef[] = [
  {
    name: 'The Forest Party', emoji: '🌲',
    story: 'The forest creatures threw a berry party — but Noel wandered off for a nap! Find him hiding among the other bears… and his 3 bamboo snacks!',
    bg: 'linear-gradient(180deg, #14532d, #166534 60%, #365314)',
    distractors: ['🌲', '🌳', '🍄', '🦊', '🐰', '🦉', '🐿️', '🌸', '🍃', '🐻', '🐨', '🐻‍❄️', '🦝', '🍓'],
    treasure: { emoji: '🎋', count: 3, label: 'bamboo' },
  },
  {
    name: 'The Busy Market', emoji: '🏘️',
    story: 'Market day in the village! Noel went shopping and got lost in the crowd. Find him — and the 3 cookies he dropped!',
    bg: 'linear-gradient(180deg, #7c2d12, #9a3412 60%, #78350f)',
    distractors: ['🧺', '🍎', '🥕', '🍞', '🧀', '🍇', '🏺', '🪣', '🐓', '🐻', '🐨', '🦝', '🥯', '🥨', '🎪'],
    treasure: { emoji: '🍪', count: 3, label: 'cookies' },
  },
  {
    name: 'The Snowy Peaks', emoji: '❄️',
    story: 'Brrr! Noel climbed the snowy mountain — but pandas look a LOT like snow! Spot him among the polar bears, and find 3 golden stars in the snow!',
    bg: 'linear-gradient(180deg, #1e3a8a, #1d4ed8 60%, #312e81)',
    distractors: ['⛄', '❄️', '🏔️', '🐧', '🦌', '🌲', '🧊', '🐻‍❄️', '🐨', '🐻', '🦉', '☁️'],
    treasure: { emoji: '⭐', count: 3, label: 'stars' },
  },
  {
    name: 'The Night Garden', emoji: '🌙',
    story: 'The moon garden blooms at midnight! Noel snuck in to smell the flowers. Find him in the shadows — and light the 3 lost lanterns!',
    bg: 'linear-gradient(180deg, #1e1b4b, #4c1d95 60%, #171123)',
    distractors: ['🌙', '⭐', '🦉', '🌺', '🍄', '🌿', '🦇', '🐻', '🐨', '🐻‍❄️', '🌷', '✨', '🪻'],
    treasure: { emoji: '🏮', count: 3, label: 'lanterns' },
  },
];

interface Placed {
  id: number; emoji: string; x: number; y: number; size: number; rot: number;
  kind: 'crowd' | 'noel' | 'treasure';
  found: boolean;
}

function playNotes(notes: { f: number; t: number; d: number }[]) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + d);
    });
  } catch { /* sound optional */ }
}
const sfx = {
  found: () => playNotes([{ f: 784, t: 0, d: 0.1 }, { f: 1047, t: 0.08, d: 0.2 }]),
  noel: () => playNotes([{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.1, d: 0.12 }, { f: 784, t: 0.2, d: 0.25 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

export default function WheresNoelPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [items, setItems] = useState<Placed[]>([]);
  const [noelLine, setNoelLine] = useState('');
  const statsRef = useRef({ wrongTaps: 0, startedAt: 0 });

  useEffect(() => { setLevel(nextGameLevel('hidden-friends')); }, []);

  const scene = SCENES[(level - 1) % SCENES.length];

  const startLevel = useCallback(() => {
    // clutter grows with level; the littlest ones get fewer, bigger things
    const base = tier === 'tiny' ? 30 : tier === 'small' ? 45 : 60;
    const crowdCount = Math.min(base + (level - 1) * 12, 150);
    const sizeBase = (tier === 'tiny' ? 34 : 28) - Math.min(8, (level - 1) * 1.5);

    const placed: Placed[] = [];
    let id = 0;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const spot = () => ({ x: rnd(3, 92), y: rnd(3, 93) });

    for (let i = 0; i < crowdCount; i++) {
      placed.push({ id: ++id, emoji: scene.distractors[i % scene.distractors.length],
        ...spot(), size: rnd(sizeBase * 0.8, sizeBase * 1.25), rot: rnd(-25, 25), kind: 'crowd', found: false });
    }
    for (let i = 0; i < scene.treasure.count; i++) {
      placed.push({ id: ++id, emoji: scene.treasure.emoji, ...spot(),
        size: rnd(sizeBase * 0.85, sizeBase * 1.1), rot: rnd(-20, 20), kind: 'treasure', found: false });
    }
    placed.push({ id: ++id, emoji: '🐼', ...spot(), size: sizeBase, rot: rnd(-15, 15), kind: 'noel', found: false });

    // shuffle so Noel isn't always rendered on top
    placed.sort(() => Math.random() - 0.5);
    statsRef.current = { wrongTaps: 0, startedAt: Date.now() };
    setItems(placed);
    setNoelLine(`Find Noel 🐼 and the ${scene.treasure.count} ${scene.treasure.label} ${scene.treasure.emoji}!`);
    setPhase('playing');
  }, [level, scene, tier]);

  function tapItem(it: Placed) {
    if (phase !== 'playing' || it.found) return;
    if (it.kind === 'crowd') {
      statsRef.current.wrongTaps += 1;
      setNoelLine(it.emoji === '🐨' || it.emoji === '🐻' || it.emoji === '🐻‍❄️'
        ? 'Ooh, close — that bear is not Noel! Look for the panda!'
        : 'Keep looking — scan slowly, corner to corner!');
      return;
    }
    if (it.kind === 'noel') sfx.noel(); else sfx.found();
    setItems(prev => prev.map(p => (p.id === it.id ? { ...p, found: true } : p)));
    setNoelLine(it.kind === 'noel' ? 'You found Noel! 🎉' : `A ${scene.treasure.label.replace(/s$/, '')}! Keep going!`);
  }

  // level complete when every target is found
  useEffect(() => {
    if (phase !== 'playing' || items.length === 0) return;
    const targets = items.filter(i => i.kind !== 'crowd');
    if (targets.length && targets.every(t => t.found)) {
      const s = statsRef.current;
      logQuestMetric('processing', 'hidden-friends', {
        level, targets: targets.length, wrongTaps: s.wrongTaps, totalMs: Date.now() - s.startedAt,
      });
      awardStarlight(Math.max(8, 14 + level * 2 - s.wrongTaps));
      recordGameLevel('hidden-friends', level);
      const t = setTimeout(() => { sfx.fanfare(); setPhase('levelDone'); }, 600);
      return () => clearTimeout(t);
    }
  }, [items, phase, level, scene]);

  const targetsLeft = items.filter(i => i.kind !== 'crowd' && !i.found);
  const noelFound = items.some(i => i.kind === 'noel' && i.found);
  const treasuresFound = items.filter(i => i.kind === 'treasure' && i.found).length;

  return (
    <main className="min-h-screen pb-6" style={{ background: '#0f172a' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="text-sm font-bold text-slate-300">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🔍 Where&apos;s Noel? <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="w-10" />
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in">
            <div className="flex items-end justify-center gap-1 mb-4">
              <span className="text-6xl mb-3 float">🔍</span>
              <KailiaSprite size={110} expression="thinking" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{scene.emoji} Chapter {level}: {scene.name}</p>
              <p className="text-gray-700 text-lg leading-relaxed">{scene.story}</p>
            </div>
            <button onClick={startLevel}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Start the search! 🔍
            </button>
            <SkillIntro gameId="hidden-friends" />
          </div>
        )}

        {phase !== 'intro' && (
          <>
            {/* find-list HUD */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${noelFound ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-800'}`}>
                🐼 Noel {noelFound && '✓'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${treasuresFound === scene.treasure.count ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-800'}`}>
                {scene.treasure.emoji} {treasuresFound}/{scene.treasure.count}
              </span>
            </div>

            {/* the busy scene */}
            <div className="relative w-full rounded-3xl overflow-hidden select-none"
              style={{ aspectRatio: '3 / 3.6', background: scene.bg, border: '3px solid rgba(255,255,255,0.2)', touchAction: 'manipulation' }}>
              {items.map(it => (
                <button key={it.id} data-kind={it.kind} data-found={it.found}
                  onClick={() => tapItem(it)}
                  className={`absolute ${it.found ? 'star-burst' : ''}`}
                  style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: it.size,
                    transform: `rotate(${it.rot}deg)`, lineHeight: 1,
                    filter: it.found ? 'drop-shadow(0 0 10px #FDE047)' : 'none',
                    zIndex: it.found ? 5 : 1, padding: 2, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {it.emoji}
                  {it.found && <span className="absolute -top-2 -right-2 text-sm">✨</span>}
                </button>
              ))}
            </div>

            {/* Noel guide (he narrates his own rescue) */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={targetsLeft.length === 0 ? 'celebrating' : 'thinking'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-800 bg-white relative">
                <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: '9px solid white' }} />
                {noelLine}
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #0f172aee, #334155ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">{scene.emoji}</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Found everyone!</h2>
            <p className="text-slate-200 font-semibold mb-1">Chapter {level}: {scene.name} — complete! 🔍</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(8, 14 + level * 2 - statsRef.current.wrongTaps)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Next chapter ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
