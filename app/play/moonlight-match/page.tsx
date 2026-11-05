'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import NightForest from '@/components/games/NightForest';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import { Feather, Flame, Shape, SHAPE_KINDS, type ShapeKind } from '../_pieces/pieces';

// ─── Moonlight Match ──────────────────────────────────────────────────────────
// The owl's memory riddle: moonlit feathers hide sleeping creatures — flip
// two, find the pairs. Video-game feel: 3D card flips, combo streaks with
// rising chimes, endless levels that add pairs and new content sets.
// Measures visual memory: flips needed per pair, mismatches, time.
//
// The board lies in the moonlit forest glade. Kailia scurries under every
// feather the child lifts and jumps for joy at a pair; the friend cheers,
// wobbles along on a miss and, after two misses in a row, runs under the
// twin of the feather that is open and bounces to point it out.

interface CardT {
  id: number;
  face: string;      // what's shown when flipped ('shape:star' = a drawn shape)
  matchKey: string;  // two cards share this to form a pair
  state: 'down' | 'up' | 'matched';
}

// the sleeping creatures are still emoji pictures (no drawn animals yet)
const CREATURES = ['🦊', '🐰', '🦉', '🐸', '🦋', '🐝', '🐢', '🦄', '🐞', '🐿️'];
const SHAPES = SHAPE_KINDS.map(k => `shape:${k}`);
const LETTERS = ['Aa', 'Bb', 'Dd', 'Ee', 'Gg', 'Mm', 'Rr', 'Ss', 'Tt', 'Ff'];

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
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

const MATCH_LINES = ['Twins! They woke up and waved!', 'You remembered! Wonderful!', 'Another pair found!', 'Look at Kailia jump!'];

const clampPct = (v: number) => Math.max(10, Math.min(90, v));
// the friend never stands right on top of Kailia: nudge it beside her
const besideKailia = (petX: number, kailiaX: number) =>
  Math.abs(petX - kailiaX) >= 15 ? petX : clampPct(kailiaX + (kailiaX > 50 ? -17 : 17));

const GROUND = 112; // px of glade below the board, where Kailia and the friend stand

function CardFace({ face, cols }: { face: string; cols: number }) {
  const big = cols <= 3 ? 1.35 : cols === 4 ? 1.1 : 0.9;
  if (face.startsWith('shape:')) return <Shape kind={face.slice(6) as ShapeKind} size={Math.round(44 * big)} />;
  const isLetter = face.length === 1 && /[A-Za-z]/.test(face);
  return <span style={{ fontSize: Math.round((isLetter ? 36 : 32) * big), lineHeight: 1 }}>{face}</span>;
}

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

  // Kailia and the friend in the glade (x, y = % of the scene, at the feet)
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(28);
  const [petX, setPetX] = useState(74);
  const [kailiaHop, setKailiaHop] = useState(0);
  const [hintId, setHintId] = useState<number | null>(null);
  const { layer: burstLayer, fire } = useBursts();

  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const openRef = useRef<number | null>(null);
  const missRunRef = useRef(0); // mismatches in a row (for the friend's hint)
  const statsRef = useRef({ flips: 0, mismatches: 0, startedAt: 0, bestStreak: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<Record<number, HTMLButtonElement | null>>({});

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
    missRunRef.current = 0;
    setStreak(0);
    setCards(deck);
    setHintId(null);
    setKailiaX(28);
    setPetX(74);
    setNoelLine(useLetters
      ? 'Tricky level — match the BIG letter with its little twin!'
      : 'Flip two feathers — find the friends that match!');
    setNoelMood('excited');
    setPhase('playing');
  }, [pairsForLevel, tier]);

  // where a card sits in the scene, in % (for Kailia, the friend and sparkles)
  function spotOf(id: number) {
    const el = cardEls.current[id], st = stageRef.current;
    if (!el || !st) return { x: 50, y: 40 };
    const r = el.getBoundingClientRect(), s = st.getBoundingClientRect();
    return { x: ((r.left + r.width / 2 - s.left) / s.width) * 100, y: ((r.top + r.height / 2 - s.top) / s.height) * 100 };
  }

  function runKailiaTo(x: number) {
    const kx = clampPct(x);
    setKailiaX(kx);
    setPetX(p => besideKailia(p, kx));
    return kx;
  }

  function flip(cardId: number) {
    if (phase !== 'playing' || busyRef.current) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.state !== 'down') return;
    sfx.flip();
    statsRef.current.flips += 1;
    setCards(prev => prev.map(c => (c.id === cardId ? { ...c, state: 'up' } : c)));
    // Kailia scurries under the feather the child lifts
    const kx = runKailiaTo(spotOf(cardId).x);

    if (openRef.current === null) {
      openRef.current = cardId;
      // two misses in a row: the friend runs under this one's twin and bounces
      if (missRunRef.current >= 2) {
        const twin = cards.find(c => c.matchKey === card.matchKey && c.id !== cardId);
        if (twin) {
          setHintId(twin.id);
          setPetMood('talk');
          const tx = clampPct(spotOf(twin.id).x);
          setPetX(Math.abs(tx - kx) < 15 ? clampPct(tx + (tx > 50 ? -15 : 15)) : tx);
        }
      }
      return;
    }

    const first = cards.find(c => c.id === openRef.current)!;
    openRef.current = null;
    busyRef.current = true;

    if (first.matchKey === card.matchKey) {
      const newStreak = streak + 1;
      setTimeout(() => {
        sfx.match(newStreak);
        setStreak(newStreak);
        statsRef.current.bestStreak = Math.max(statsRef.current.bestStreak, newStreak);
        setBurst({ id: Date.now(), text: newStreak >= 2 ? `Combo ×${newStreak}!` : 'Match!' });
        setCards(prev => prev.map(c => (c.matchKey === card.matchKey ? { ...c, state: 'matched' as const } : c)));
        // sparkles on both twins, Kailia jumps, the friend cheers
        for (const id of [first.id, card.id]) { const s = spotOf(id); fire(s.x, s.y, ['#FFE066', '#FFF7B0', '#FFFFFF', '#C4B5FD'], 12, 60); }
        setKailiaHop(n => n + 1);
        setPetMood('cheer');
        setPetX(p => besideKailia(p, kx));
        setHintId(null);
        missRunRef.current = 0;
        setNoelLine(MATCH_LINES[newStreak % MATCH_LINES.length]);
        setNoelMood('excited');
        busyRef.current = false;
      }, 350);
    } else {
      statsRef.current.mismatches += 1;
      missRunRef.current += 1;
      setTimeout(() => {
        sfx.miss();
        setStreak(0);
        setNoelLine(missRunRef.current >= 2
          ? `Hmm, not twins! Flip one — ${pet.name} will help you find its twin!`
          : 'Hmm, not twins! Remember where they sleep…');
        setNoelMood('thinking');
        setPetMood('oops');
        setHintId(null);
        setPetX(p => besideKailia(p, kx));
        setCards(prev => prev.map(c => (c.state === 'up' ? { ...c, state: 'down' } : c)));
        busyRef.current = false;
      }, 750);
    }
  }

  function tickle() {
    setPetMood('dance');
    chime.tap();
    setTimeout(() => setPetMood('idle'), 1300);
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

        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Moonlight Match <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="w-14 flex items-center justify-end gap-0.5 text-sm font-extrabold text-yellow-300">
            {streak >= 2 && phase === 'playing' && <><Flame size={22} />×{streak}</>}
          </span>
        </div>

        {/* ── Intro ── */}
        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={120} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={92} expression="thinking" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 66)} kind="pet" />
              <span className="mb-3 float inline-block" style={{ animationDelay: '0.5s' }}>
                <Feather size={46} color="#E9E1FF" vein="#7C6BD6" />
              </span>
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                The wise owl hid her friends under <strong>moonlit feathers</strong>!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                Flip two at a time and remember where everyone sleeps. Match pairs in a row for
                <strong> combo magic</strong>!
              </p>
            </div>
            <LevelPath gameId="moonlight-match" level={level} onPick={setLevel} />
            <button onClick={() => startLevel(level)}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Level {level} — flip!
            </button>
            <SkillIntro gameId="moonlight-match" />
          </div>
        )}

        {/* ── The board, in the moonlit glade ── */}
        {phase !== 'intro' && (
          <div className="relative z-10">
            <div ref={stageRef} className="relative w-full rounded-[28px] overflow-hidden select-none mt-1"
              style={{ boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <NightForest glow={cards.length ? cards.filter(c => c.state === 'matched').length / cards.length : 0} />

              <div className="relative grid gap-2.5 px-3 pt-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, paddingBottom: GROUND, zIndex: 8 }}>
                {cards.map(c => (
                  <button key={c.id} ref={el => { cardEls.current[c.id] = el; }}
                    data-mkey={c.matchKey} data-state={c.state} onClick={() => flip(c.id)}
                    aria-label={c.state === 'down' ? 'Sleeping feather' : c.face.replace('shape:', '')}
                    className="relative w-full"
                    style={{ aspectRatio: '3 / 4', perspective: 600 }}>
                    {hintId === c.id && c.state === 'down' && (
                      <span className="absolute -inset-1 rounded-[18px] hint-glow pointer-events-none" style={{ border: '3px solid rgba(255,255,255,0.9)', zIndex: 2 }} />
                    )}
                    <div className="absolute inset-0 transition-transform duration-300"
                      style={{ transformStyle: 'preserve-3d', transform: c.state === 'down' ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
                      {/* feather back: light and moonlit so it shows on the night glade */}
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                        style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(160deg, #FFF8E1 0%, #E4DBFF 100%)', border: '2.5px solid #3b2416',
                          boxShadow: '0 0 12px rgba(255,244,194,0.35), 0 4px 0 rgba(0,0,0,0.3)' }}>
                        <Feather size={cols <= 3 ? 54 : cols === 4 ? 44 : 34} color="#C9B8FF" vein="#5B48B8"
                          style={{ transform: `rotate(${(c.id * 37) % 30 - 15}deg)` }} />
                      </div>
                      {/* face */}
                      <div className="absolute inset-0 rounded-2xl flex items-center justify-center font-extrabold"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                          color: '#312E81',
                          background: c.state === 'matched' ? 'linear-gradient(135deg, #FEF9C3, #FDE68A)' : 'white',
                          border: c.state === 'matched' ? '2.5px solid #F59E0B' : '2.5px solid #3b2416',
                          boxShadow: c.state === 'matched' ? '0 0 16px rgba(253,224,71,0.75)' : '0 4px 0 rgba(0,0,0,0.3)' }}>
                        {/* the joy-spin lives on the picture, not the card, so it never undoes the flip */}
                        <span className={`inline-flex ${c.state === 'matched' ? 'star-burst' : ''}`}><CardFace face={c.face} cols={cols} /></span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Kailia and the friend, in the glade below the board */}
              <KailiaActor x={kailiaX} y={96} h={80} hop={kailiaHop} z={9} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petX} y={95} h={58}
                  mood={petMood} moodKey={petMoodKey} moveMs={900} onTap={tickle} z={9} />
              </div>

              {burstLayer}

              {/* combo burst */}
              {burst && (
                <p key={burst.id} className="absolute left-0 right-0 text-center text-2xl font-extrabold text-yellow-300 pop pointer-events-none"
                  style={{ bottom: GROUND - 34, zIndex: 31, textShadow: '0 2px 0 #3b2416, 0 0 10px rgba(0,0,0,0.6)' }}>
                  <StarIcon size={24} /> {burst.text}
                </p>
              )}
            </div>

            {/* Noel guide */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={noelMood} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
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
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #5b21b6)' }}>
          <div className="text-center bounce-in">
            <span className="inline-block mb-3 star-burst" style={{ filter: 'drop-shadow(0 0 18px rgba(255,241,184,0.7))' }}><Shape kind="moon" size={84} /></span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-indigo-100 font-semibold mb-1">Every friend found their twin under the moon. {pet.name} is doing a happy dance!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6">
              <StarIcon /> +{Math.max(8, 12 + level * 3 - statsRef.current.mismatches)} starlight
              {statsRef.current.bestStreak >= 2 && ` · best combo ×${statsRef.current.bestStreak}!`}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-indigo-950 shadow-xl transition-transform hover:scale-105 inline-block"
                style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
                <span className="whitespace-nowrap">Back to the map</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
