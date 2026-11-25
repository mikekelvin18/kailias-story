'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { roundEase } from '@/lib/ageBands';
import { useGameFit, openingLevel } from '@/hooks/useGameFit';
import { moonPairs } from '@/lib/gameCurves';
import { levelStory } from '@/lib/variety';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import { GameBackdrop, GameFinish, GameIntro, GOLD, PlayButton, SoftButton, GoArrow } from '@/components/games/GameFrame';
import LevelPath from '@/components/LevelPath';
import { shuffled } from '@/lib/shuffle';
import { logQuestMetric } from '@/lib/metrics';
import { awardStarlight, recordGameLevel, levelStarlight } from '@/lib/rewards';
import NightForest from '@/components/games/NightForest';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import StoryGuest from '@/components/games/StoryGuest';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { chime } from '@/components/friends/voice';
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

// the sleeping creatures, painted (components/art/things)
const CREATURES = ['pic:fox', 'pic:rabbit', 'pic:owl', 'pic:frog', 'pic:butterfly', 'pic:bee', 'pic:turtle', 'pic:hedgehog', 'pic:ladybug', 'pic:squirrel', 'pic:penguin', 'pic:octopus'];
const SHAPES = SHAPE_KINDS.map(k => `shape:${k}`);
const LETTERS = ['Aa', 'Bb', 'Dd', 'Ee', 'Gg', 'Mm', 'Rr', 'Ss', 'Tt', 'Ff', 'Hh', 'Nn'];

import { soundEnabled } from '@/lib/accessibility';
import { Thing } from '@/components/art/things';
import { audioCtx, sfxOut } from '@/lib/sfx';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const ctx = audioCtx();
    if (!ctx) return;
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain).connect(sfxOut(ctx));
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
const SKY = 46;     // px of night sky above the board, so the moon is never hidden under a card

function CardFace({ face, cols }: { face: string; cols: number }) {
  const big = cols <= 3 ? 1.35 : cols === 4 ? 1.1 : 0.9;
  if (face.startsWith('shape:')) return <Shape kind={face.slice(6) as ShapeKind} size={Math.round(44 * big)} />;
  if (face.startsWith('pic:')) return <Thing id={face.slice(4)} size={Math.round(50 * big)} />;
  const isLetter = face.length === 1 && /[A-Za-z]/.test(face);
  return <span style={{ fontSize: Math.round((isLetter ? 36 : 32) * big), lineHeight: 1 }}>{face}</span>;
}

// ── Why the owl hid her friends tonight: a new little story every level ──
// (Kelvin 2026-11-23.) Dealt fairly from this deck (lib/variety.ts).
const MOON_STORIES = [
  'Tonight is the owl\'s moon party, and every friend needs a partner to dance with!',
  'The friends are playing hide and seek with their twins!',
  'The owl is taking a class photo. Everyone must stand next to their twin!',
  'A sleepy wind mixed up all the feathers. Let\'s put the twins back together!',
  'The friends are going on a moon picnic, two by two!',
  'It\'s twin day at owl school!',
  'The stars are counting the friends. Find every pair!',
  'The owl lost her glasses! Help her find the matching friends.',
  'Every friend is looking for a buddy to share a story with.',
  'The moon is shining extra bright. Time for the twins to wake up!',
  'The friends are getting ready for a sleepover, two in every bed!',
  'The owl is building a feather boat, and friends ride in pairs!',
];

export default function MoonlightMatchPage() {
  const fit = useGameFit('moonlight-match');
  const tier = fit.tier;
  // two wrong cards stay open longer for little ones (Muse: they flipped back too fast)
  const flipBackMs = Math.min(1800, Math.round(750 / fit.look.speed));

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
  // Cards turned up or matched, updated the instant a tap lands (the cards
  // state only catches up on the next render, so fast taps used to see a
  // stale "face down" card and judge a card against itself or a third
  // card; Muse round 4).
  const upRef = useRef<Set<number>>(new Set());
  const missRunRef = useRef(0); // mismatches in a row (for the friend's hint)
  const statsRef = useRef({ flips: 0, mismatches: 0, startedAt: 0, bestStreak: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<Record<number, HTMLButtonElement | null>>({});

  // a new player starts on their own level (hooks/useGameFit.ts)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved level is only readable after mount
  useEffect(() => { setLevel(openingLevel('moonlight-match', fit.startLevel)); }, [fit.startLevel]);

  // pairs grow with level; the starting size and cap follow the child's tier
  // (lib/gameCurves.ts: one more pair every three levels, capped by stage)
  const pairsForLevel = useCallback((lvl: number) => moonPairs(lvl, tier, fit.fitMonths), [tier, fit.fitMonths]);

  const startLevel = useCallback((lvl: number) => {
    const story = levelStory(MOON_STORIES, 'moonlight-match', lvl);
    const pairs = pairsForLevel(lvl);
    // content rotates by level; readers sometimes get letter pairs (A ↔ a)
    const useLetters = tier === 'big' && lvl % 3 === 0;
    // (there are 10 shapes, so the biggest boards use creatures)
    const pool = useLetters ? LETTERS : lvl % 2 === 0 && pairs <= SHAPES.length ? SHAPES : CREATURES;
    const chosen = shuffled(pool).slice(0, pairs);
    const deck: CardT[] = shuffled(chosen.flatMap((key, i) => {
      const [a, b] = useLetters ? [key[0], key[1]] : [key, key];
      return [
        { id: i * 2, face: a, matchKey: key, state: 'down' as const },
        { id: i * 2 + 1, face: b, matchKey: key, state: 'down' as const },
      ];
    }));
    statsRef.current = { flips: 0, mismatches: 0, startedAt: Date.now(), bestStreak: 0 };
    openRef.current = null;
    upRef.current = new Set();
    busyRef.current = false;
    completedRef.current = false;
    missRunRef.current = 0;
    setStreak(0);
    setCards(deck);
    setHintId(null);
    setKailiaX(28);
    setPetX(74);
    setNoelLine(`${story} ${useLetters
      ? 'Tricky level — match the BIG letter with its little twin!'
      : 'Flip two feathers — find the friends that match!'}`);
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
    if (!card || card.state !== 'down' || upRef.current.has(cardId)) return;
    upRef.current.add(cardId);
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
    busyRef.current = true; // no taps count until these two are judged

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
        // only these two turn back over
        setCards(prev => prev.map(c => (c.id === first.id || c.id === card.id ? { ...c, state: 'down' } : c)));
        upRef.current.delete(first.id); upRef.current.delete(card.id);
        // wait for the two feathers to finish turning back over before the
        // next tap counts, so a quick tap never lands on a half-turned card
        setTimeout(() => { busyRef.current = false; }, 450);
      }, flipBackMs);
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
    awardStarlight(levelStarlight(level, s.mismatches));
    recordGameLevel('moonlight-match', level, roundEase(Math.max(0, s.mismatches - pairs), pairs));
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
  const cols = pairs <= 2 ? 2 : pairs <= 3 ? 3 : pairs <= 8 ? 4 : 5;

  return (
    <main className="relative overflow-hidden min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #0c0a2e 0%, #1e1b4b 55%, #312e81 100%)', isolation: 'isolate' }}>
      <GameBackdrop mode="play" />
      <div data-play-col className="max-w-md mx-auto px-3 relative">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 px-1 relative z-10" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
          <Link href="/play" className="kp-back h-12 px-4 inline-flex items-center rounded-full text-base font-bold text-white"
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
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <GameIntro
              title="Moonlight Match"
              theme={{ bg: 'radial-gradient(130% 85% at 50% 0%, #5b21b6 0%, #312e81 50%, #1e1b4b 100%)', accent: '#A78BFA', accent2: '#7C3AED' }}
              pet={pet}
              story={<><p>
                The wise owl hid her friends under <strong>moonlit feathers</strong>! {levelStory(MOON_STORIES, 'moonlight-match', level)}
              </p>
              <p>
                Flip two at a time and remember where everyone sleeps. Match pairs in a row for
                <strong> combo magic</strong>!
              </p></>}
              extras={<div className="flex items-end justify-center gap-3"><span className="mb-3 float inline-block" style={{ animationDelay: '0.5s' }}>
                <Feather size={46} color="#E9E1FF" vein="#7C6BD6" />
              </span></div>}
              levels={<LevelPath gameId="moonlight-match" level={level} onPick={setLevel} startLevel={fit.startLevel} />}
              startLabel={<>Level {level} — flip!</>}
              onStart={() => startLevel(level)}
              footer={<SkillIntro gameId="moonlight-match" />}
            />
          </div>
        )}

        {/* ── The board, in the moonlit glade ── */}
        {phase !== 'intro' && (
          <div className="relative z-10">
            <div ref={stageRef} data-play-field data-cards className="relative w-full rounded-[28px] overflow-hidden select-none mt-1"
              style={{ ['--cols' as string]: cols, ['--rows' as string]: Math.ceil(cards.length / cols) || 1, ['--ground' as string]: `${GROUND}px`, ['--top-pad' as string]: `${SKY}px`, boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>
              <NightForest glow={cards.length ? cards.filter(c => c.state === 'matched').length / cards.length : 0} />

              <div className="relative grid gap-2.5 px-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, paddingTop: SKY, paddingBottom: GROUND, zIndex: 8 }}>
                {cards.map(c => (
                  <button key={c.id} ref={el => { cardEls.current[c.id] = el; }}
                    data-mkey={c.matchKey} data-state={c.state} data-hint={hintId === c.id && c.state === 'down' ? '1' : undefined} onClick={() => flip(c.id)}
                    aria-label={c.state === 'down' ? 'Sleeping feather' : c.face.replace(/^(shape|pic):/, '')}
                    className="relative w-full"
                    style={{ aspectRatio: '3 / 4', perspective: 600 }}>
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
                    {/* the friend's hint (Muse round 5: it was hidden under the 3D card):
                        a thick golden ring drawn above the card, glowing and bobbing */}
                    {hintId === c.id && c.state === 'down' && (
                      <span className="mm-hint absolute -inset-1.5 rounded-[20px] pointer-events-none" style={{ zIndex: 5 }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Kailia and the friend, in the glade below the board */}
              {/* the wise owl from the story hosts the game (unless the owl is the friend playing along) */}
              <StoryGuest who={pet.name === 'Sage' ? null : 'owl'} x={90} y={95} size={50} z={8} />
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
              <div data-read-aloud className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <GameFinish
            title={`Level ${level} complete!`}
            theme={{ bg: 'linear-gradient(135deg, #1e1b4b, #5b21b6)', accent: '#A78BFA', accent2: '#7C3AED' }}
            pet={pet}
            trophy={<span className="inline-block" style={{ filter: 'drop-shadow(0 0 18px rgba(255,241,184,0.7))' }}><Shape kind="moon" size={84} /></span>}
            message={<>Every friend found their twin under the moon. {pet.name} is doing a happy dance!{statsRef.current.bestStreak >= 2 && <><br />Best combo ×{statsRef.current.bestStreak}!</>}</>}
            earned={levelStarlight(level, statsRef.current.mismatches)}
            actions={<>
              <PlayButton theme={GOLD} onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}>Level {level + 1} <GoArrow /></PlayButton>
              <SoftButton href="/play">Back to the map</SoftButton>
            </>}
          />
        </div>
      )}
    </main>
  );
}
