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

// ─── Echo Song ────────────────────────────────────────────────────────────────
// Simon-style sequence memory in Echo Caves: the crystals sing a little
// melody (light + tone), the child echoes it back by tapping. Levels grow
// the melody; misses just replay it — never a failure state.
// Measures auditory-visual sequence memory span (processing domain).

const CRYSTALS = [
  { emoji: '🔷', tone: 262, glow: '#60A5FA' },
  { emoji: '💚', tone: 330, glow: '#4ADE80' },
  { emoji: '💜', tone: 392, glow: '#C084FC' },
  { emoji: '🧡', tone: 523, glow: '#FB923C' },
];

function tone(f: number, d = 0.32) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = f;
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + d);
  } catch { /* sound optional */ }
}

const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3), i * 120));

export default function EchoSongPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'showing' | 'echo' | 'levelDone'>('intro');
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [noelLine, setNoelLine] = useState('Listen to the crystal song — then sing it back with your taps!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');

  const posRef = useRef(0);
  const statsRef = useRef({ attempts: 0, replays: 0, startedAt: 0 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { setLevel(nextGameLevel('echo-song')); return () => timersRef.current.forEach(clearTimeout); }, []);

  const seqLen = useCallback((lvl: number) => {
    const base = tier === 'tiny' ? 2 : tier === 'small' ? 2 : 3;
    return Math.min(base + (lvl - 1), 8);
  }, [tier]);

  const playSeq = useCallback((s: number[]) => {
    setPhase('showing');
    setProgress(0);
    posRef.current = 0;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const gap = tier === 'big' ? 620 : 780;
    s.forEach((c, i) => {
      timersRef.current.push(setTimeout(() => { setLit(c); tone(CRYSTALS[c].tone); }, 500 + i * gap));
      timersRef.current.push(setTimeout(() => setLit(null), 500 + i * gap + gap * 0.6));
    });
    timersRef.current.push(setTimeout(() => {
      setPhase('echo');
      setNoelLine('Your turn — echo the song!');
      setNoelMood('excited');
    }, 500 + s.length * gap + 200));
  }, [tier]);

  const startLevel = useCallback((lvl: number) => {
    const s = Array.from({ length: seqLen(lvl) }, () => Math.floor(Math.random() * 4));
    statsRef.current = { attempts: 0, replays: 0, startedAt: Date.now() };
    setSeq(s);
    setNoelLine('Shhh… listen to the crystals sing!');
    setNoelMood('happy');
    playSeq(s);
  }, [seqLen, playSeq]);

  function tap(c: number) {
    if (phase !== 'echo') return;
    setLit(c); tone(CRYSTALS[c].tone, 0.25);
    setTimeout(() => setLit(null), 220);
    if (c === seq[posRef.current]) {
      posRef.current += 1;
      setProgress(posRef.current);
      if (posRef.current === seq.length) {
        // level cleared!
        const s = statsRef.current;
        logQuestMetric('processing', 'echo-song', {
          level, sequenceLength: seq.length, wrongTaps: s.attempts,
          replays: s.replays, totalMs: Date.now() - s.startedAt,
        });
        awardStarlight(Math.max(8, 10 + seq.length * 2 - s.attempts * 2));
        recordGameLevel('echo-song', level);
        fanfare();
        setNoelMood('celebrating');
        setPhase('levelDone');
      }
    } else {
      statsRef.current.attempts += 1;
      statsRef.current.replays += 1;
      setNoelLine('Oops, the echo slipped! Listen once more — you almost have it!');
      setNoelMood('thinking');
      setTimeout(() => playSeq(seq), 900);
    }
  }

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #082f49 0%, #0e7490 80%, #155e75 130%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        {['🔮', '💠', '✨', '🪨'].map((e, i) => (
          <span key={i} className="absolute sparkle" style={{ left: `${[8, 80, 50, 15][i]}%`, top: [70, 40, 8, 160][i], fontSize: [24, 18, 14, 26][i], opacity: 0.5, animationDelay: `${i * 0.6}s`, pointerEvents: 'none' }}>{e}</span>
        ))}

        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="text-sm font-bold text-cyan-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            🎶 Echo Song <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="text-xs font-bold text-cyan-200 w-14 text-right">
            {phase === 'echo' || phase === 'showing' ? `${progress}/${seq.length}` : ''}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-8 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={90} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={110} expression="excited" className="float" />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-700 text-lg leading-relaxed mb-3">
                Deep in Echo Caves, the <strong>crystals sing</strong>! 🎶
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Listen to their little song… then <strong>echo it back</strong> by tapping the
                crystals in the same order!
              </p>
            </div>
            <button onClick={() => startLevel(level)}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Level {level} — listen! 🎶
            </button>
            <SkillIntro gameId="echo-song" />
          </div>
        )}

        {(phase === 'showing' || phase === 'echo') && (
          <div className="relative z-10">
            <p className="text-center text-sm font-extrabold mb-3 mt-2"
              style={{ color: phase === 'showing' ? '#FDE047' : '#A5F3FC' }}>
              {phase === 'showing' ? '🎵 The crystals are singing…' : '👆 Your turn — echo the song!'}
            </p>
            <div className="grid grid-cols-2 gap-4 px-6">
              {CRYSTALS.map((c, i) => (
                <button key={i} data-crystal={i} onClick={() => tap(i)}
                  className="rounded-3xl flex items-center justify-center transition-all"
                  style={{
                    aspectRatio: '1', fontSize: 54,
                    background: lit === i ? c.glow : 'rgba(255,255,255,0.1)',
                    border: `3px solid ${lit === i ? 'white' : c.glow + '66'}`,
                    boxShadow: lit === i ? `0 0 34px ${c.glow}` : 'none',
                    transform: lit === i ? 'scale(1.08)' : 'scale(1)',
                    cursor: phase === 'echo' ? 'pointer' : 'default',
                    opacity: phase === 'showing' && lit !== i ? 0.75 : 1,
                  }}>
                  {c.emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 rounded-2xl p-2.5"
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

      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #164e63ee, #0e7490ee)' }}>
          <div className="text-center bounce-in">
            <span className="block text-7xl mb-3 star-burst">🔮</span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={100} expression="celebrating" className="float" />
              <KailiaSprite size={120} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-cyan-100 font-semibold mb-1">A {seq.length}-note song, echoed perfectly! The caves are ringing! 🎶</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">✨ +{Math.max(8, 10 + seq.length * 2 - statsRef.current.attempts * 2)} starlight</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                Level {level + 1} ▶
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105 inline-block"
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
