'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { useAssessment } from '@/context/AssessmentContext';
import { difficultyTier, type DifficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel, COMPANIONS } from '@/lib/rewards';
import { soundEnabled } from '@/lib/accessibility';
import { speak } from '@/lib/speak';
import { chapterFor, endlessRamp, isStarLevel } from '@/lib/levels';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet, type PlayPet } from '@/components/games/playPet';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

// ─── Dragon Bridge ──────────────────────────────────────────────────────────
// The second game of the Dragon's Treasure Cave (math). Kailia has to get
// across the glowing crystal river to the dragons' treasure. Two kinds of
// rounds take turns:
//
//  • Fair Shares: hungry baby dragons sit on the far bank. The child taps a
//    baby to toss it a berry from Kailia's basket, until every baby has the
//    SAME. Later levels bring more babies, more berries, and berries that
//    can't be shared evenly (those are a treat for Kailia): early division
//    and remainders, felt rather than taught.
//  • Pattern Stones: a row of stepping stones crosses the river, each with a
//    gem. One or two stones are missing; the child picks the stone that
//    continues the pattern (AB, AAB, ABC, shape patterns, then counting on
//    by 1, 2, 5, 10 and counting back). Kailia hops across when it's done.
//
// Every round won drops a gem into the dragons' treasure chest. Levels never
// end: past level 30 the Star worlds mix every kind of pattern and share,
// with bigger numbers and stones missing in the middle of the row.
// The friend plays along on the near bank (it cheers, wobbles on a miss and
// walks to the right answer after two misses); Ember's picture plays the
// baby dragons, each a different color. A miss is never "wrong".

// ── Gems, shapes and the round plans ──

const GEMS = [
  { hex: '#EF4444', dark: '#991B1B', name: 'red' },
  { hex: '#3B82F6', dark: '#1E3A8A', name: 'blue' },
  { hex: '#FACC15', dark: '#A16207', name: 'yellow' },
  { hex: '#22C55E', dark: '#166534', name: 'green' },
  { hex: '#A855F7', dark: '#6B21A8', name: 'purple' },
];
const SHAPES = ['diamond', 'round', 'triangle'] as const;

interface Tok { c: number; s: number; n?: number }
const same = (a: Tok, b: Tok) => a.c === b.c && a.s === b.s && a.n === b.n;

interface ShareRound { kind: 'share'; babies: number; each: number; extra: number }
interface PatternRound {
  kind: 'pattern';
  seq: Tok[];
  blanks: number[];          // stone indexes the child fills, left to right
  options: Tok[][];          // choices for each blank
  numbers: boolean;
  fam: string;
}
type Round = ShareRound | PatternRound;

type Fam = 'AB' | 'AAB' | 'ABB' | 'ABC' | 'AABB' | 'shapeAB' | 'ABCD' | 'mixABC'
  | 'up1' | 'up2' | 'up3' | 'up5' | 'up10' | 'down1' | 'down2';
const STEP: Partial<Record<Fam, number>> = { up1: 1, up2: 2, up3: 3, up5: 5, up10: 10, down1: -1, down2: -2 };

// the clock, read only in event handlers and timers
const now = () => Date.now();
const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// Which kind of pattern a level asks for: the 30-level ladder climbs
// through them in order; the Star worlds mix all the harder ones.
function famFor(level: number): Fam {
  if (level <= 4) return 'AB';
  if (level <= 8) return pick(['AAB', 'ABB'] as const);
  if (level <= 12) return 'ABC';
  if (level <= 16) return pick(['AABB', 'shapeAB'] as const);
  if (level <= 20) return 'up1';
  if (level <= 24) return 'up2';
  if (level <= 28) return pick(['up5', 'up10'] as const);
  if (level <= 30) return 'down1';
  return pick(['ABCD', 'AABB', 'mixABC', 'shapeAB', 'up2', 'up3', 'up5', 'up10', 'down1', 'down2'] as const);
}

function makePattern(level: number, tier: DifficultyTier): PatternRound {
  const fam = famFor(level);
  const star = isStarLevel(level);
  const tiny = tier === 'tiny';
  const len = level <= 8 || tiny ? 6 : star ? 8 : 7;
  const nOpts = tiny && level <= 8 ? 2 : 3;
  const step = STEP[fam];
  let seq: Tok[];
  let unitLen = 2;

  if (step !== undefined) {
    // counting on (or back) along the stones
    const reach = Math.round(endlessRamp(level, 3, 80, 25));
    let start = step === 1 ? rint(1, reach) : Math.abs(step) * rint(0, Math.max(2, Math.round(reach / Math.abs(step) / 2)));
    if (step < 0) start = Math.abs(step) * (len + rint(0, 4)) + (step === -1 ? rint(0, reach) : 0);
    seq = Array.from({ length: len }, (_, i) => ({ c: -1, s: 0, n: start + i * step }));
    unitLen = 2;
  } else {
    const cols = shuffle([0, 1, 2, 3, 4]);
    const s0 = rint(0, 2);
    const shp = shuffle([0, 1, 2]);
    const T = (ci: number, s = s0): Tok => ({ c: cols[ci], s });
    const unit: Tok[] = {
      AB: [T(0), T(1)],
      AAB: [T(0), T(0), T(1)],
      ABB: [T(0), T(1), T(1)],
      ABC: [T(0), T(1), T(2)],
      AABB: [T(0), T(0), T(1), T(1)],
      ABCD: [T(0), T(1), T(2), T(3)],
      shapeAB: [T(0, shp[0]), T(0, shp[1])],
      mixABC: [T(0, shp[0]), T(1, shp[1]), T(2, shp[2])],
    }[fam as 'AB'];
    unitLen = unit.length;
    seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  }

  // which stones are missing: the last one; later sometimes two, and in
  // the Star worlds sometimes one in the middle (always after a full
  // pattern has been shown)
  const blanks: number[] = [];
  const two = !tiny && ((level >= 21 && Math.random() < 0.4) || (star && Math.random() < 0.55));
  if (star && Math.random() < 0.45) {
    blanks.push(rint(Math.max(unitLen + 1, 3), len - 2));
    if (two) blanks.push(len - 1);
  } else {
    if (two) blanks.push(len - 2);
    blanks.push(len - 1);
  }

  const options = blanks.map(bi => {
    const ans = seq[bi];
    const pool: Tok[] = [];
    if (step !== undefined) {
      const n = ans.n!;
      [n + step, n - step, n + 1, n - 1, n + 2, n + 10, n - 10].forEach(v => { if (v >= 0) pool.push({ c: -1, s: 0, n: v }); });
    } else {
      seq.forEach(t => pool.push(t));
      // a same-color, other-shape gem makes shape patterns a real look
      pool.push({ c: ans.c, s: (ans.s + 1) % 3 }, { c: (ans.c + 1) % 5, s: ans.s });
    }
    const wrong: Tok[] = [];
    for (const t of shuffle(pool)) {
      if (wrong.length >= nOpts - 1) break;
      if (!same(t, ans) && !wrong.some(w => same(w, t))) wrong.push(t);
    }
    return shuffle([ans, ...wrong]);
  });

  return { kind: 'pattern', seq, blanks, options, numbers: step !== undefined, fam };
}

function makeShare(level: number, tier: DifficultyTier): ShareRound {
  const star = isStarLevel(level);
  let babies = level <= 8 ? 2 : level <= 20 ? 3 : level <= 30 ? 4 : rint(2, 5);
  let each = level <= 30 ? Math.min(5, 1 + Math.ceil(level / 6)) : rint(2, 6);
  if (tier === 'tiny') { babies = Math.min(babies, level <= 15 ? 2 : 3); each = Math.min(each, 3); }
  const extra = tier !== 'tiny' && (star ? Math.random() < 0.6 : level >= 26) ? rint(1, babies - 1) : 0;
  return { kind: 'share', babies, each, extra };
}

function planLevel(level: number, tier: DifficultyTier): Round[] {
  const kinds: Round['kind'][] = level <= 2 ? ['share', 'pattern', 'share']
    : level < 15 ? ['share', 'pattern', 'share', 'pattern']
    : ['pattern', 'share', 'pattern', 'share', 'pattern'];
  return kinds.map(k => (k === 'share' ? makeShare(level, tier) : makePattern(level, tier)));
}

// ── Where things stand, in % of the play area ──
const FAR_Y = 44;      // feet on the far bank
const PLATE_Y = 43;    // the baby dragons' berry plates
const STONE_Y = 59;    // stepping stones in the river
const TRAY_Y = 81;     // the stone choices
const BANK_Y = 80;     // the friend's spot on the near bank when it points at a baby
const BASKET = { x: 52, y: 87 };
const GROUND = 99;
const BABY_TINT = ['none', 'hue-rotate(150deg) saturate(1.1)', 'hue-rotate(245deg)', 'hue-rotate(40deg) saturate(1.4) brightness(1.08)', 'hue-rotate(195deg)'];
const nestX = (i: number, k: number) => 8 + ((i + 0.5) / k) * 78;
const stoneX = (j: number, n: number) => 6 + ((j + 0.5) / n) * 88;
const optX = (i: number, n: number) => (n === 2 ? [38, 62] : [32, 54, 76])[i];

function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    notes.forEach(({ f, t, d }) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.11, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch { /* sound is a bonus */ }
}
const sfx = {
  plop: (n: number) => playNotes([{ f: 440 + Math.min(n, 10) * 40, t: 0, d: 0.12 }]),
  back: () => playNotes([{ f: 520, t: 0, d: 0.08 }, { f: 400, t: 0.07, d: 0.1 }]),
  hop: (i: number) => playNotes([{ f: 523 + i * 45, t: 0, d: 0.1 }]),
  good: () => playNotes([{ f: 784, t: 0, d: 0.1 }, { f: 1047, t: 0.08, d: 0.18 }]),
  soft: () => playNotes([{ f: 330, t: 0, d: 0.14 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

const EMBER = COMPANIONS.find(c => c.name === 'Ember')!;
const FLICK = COMPANIONS.find(c => c.name === 'Flick')!;

type NoelMood = 'happy' | 'excited' | 'thinking' | 'celebrating';
interface Flyer { id: number; nest: number; back: boolean; dx: number; dy: number }

export default function DragonBridgePage() {
  const { state, totalScore, devMonths } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore, devMonths);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'roundDone' | 'done'>('intro');
  const [level, setLevel] = useState(1);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- saved progress is only readable after mount
  useEffect(() => { setLevel(nextGameLevel('dragon-bridge')); }, []);

  const [rounds, setRounds] = useState<Round[]>([]);
  const [ri, setRi] = useState(0);
  const round = rounds[ri];

  // fair shares
  const [counts, setCounts] = useState<number[]>([]);
  const [basket, setBasket] = useState(0);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [unfair, setUnfair] = useState(false);
  const [babyFx, setBabyFx] = useState<{ i: number; n: number }>({ i: -1, n: 0 });
  // pattern stones
  const [filled, setFilled] = useState<(Tok | null)[]>([]);
  const [bi, setBi] = useState(0);                  // which blank is being filled
  const [wobble, setWobble] = useState<{ i: number; n: number }>({ i: -1, n: 0 });
  const [hintOpt, setHintOpt] = useState(-1);
  const [hintNest, setHintNest] = useState(-1);
  const [crossing, setCrossing] = useState(false);

  const [noelLine, setNoelLine] = useState('');
  const [noelMood, setNoelMood] = useState<NoelMood>('happy');
  const [chestGems, setChestGems] = useState(0);
  const [earned, setEarned] = useState(0);

  const chosen = usePlayPet();
  const pet: PlayPet = chosen.name === EMBER.name ? FLICK : chosen;   // Ember is busy being the baby dragons
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailia, setKailia] = useState({ x: 16, y: GROUND });
  const [hop, setHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  const areaRef = useRef<HTMLDivElement>(null);
  const flyId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const missRef = useRef(0);                         // misses on the current stone
  const roundStart = useRef(0);
  const m = useRef({ shares: 0, fairFirst: 0, takeBacks: 0, unfairMoments: 0, blanks: 0, firstTry: 0, misses: 0, patternMs: [] as number[], maxBerries: 0, maxNumber: 0, startedAt: 0 });
  const roundClean = useRef(true);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function say(line: string, mood: NoelMood = 'happy', aloud = false) {
    setNoelLine(line); setNoelMood(mood);
    if (aloud) speak(line);
  }

  function startRound(rs: Round[], idx: number) {
    const r = rs[idx];
    setRi(idx);
    setHintOpt(-1); setHintNest(-1); setUnfair(false); setFlyers([]); setCrossing(false);
    missRef.current = 0;
    roundClean.current = true;
    roundStart.current = now();
    if (r.kind === 'share') {
      setCounts(Array(r.babies).fill(0));
      setBasket(r.babies * r.each + r.extra);
      setKailia({ x: 16, y: GROUND });
      m.current.maxBerries = Math.max(m.current.maxBerries, r.babies * r.each + r.extra);
      say(r.extra
        ? `Share the berries so every baby dragon gets the SAME. Any berries that can't be shared are a treat for Kailia!`
        : `The baby dragons are hungry! Tap a baby to give a berry, until everyone has the SAME.`, 'excited', true);
    } else {
      setFilled(r.blanks.map(() => null));
      setBi(0);
      setKailia({ x: 12, y: GROUND });
      r.seq.forEach(t => { if (t.n !== undefined) m.current.maxNumber = Math.max(m.current.maxNumber, t.n); });
      const many = r.blanks.length > 1;
      say(r.numbers
        ? many ? 'Two number stones are missing! Which number comes next? Fill them one by one.' : 'Count along the stones. Which number comes next?'
        : many ? 'Two stones are missing! Look at the pattern and fill them one by one.' : 'Look at the gems on the stones. What comes next in the pattern?', 'excited', true);
    }
    setPhase('playing');
  }

  function startGame() {
    const rs = planLevel(level, tier);
    m.current = { shares: 0, fairFirst: 0, takeBacks: 0, unfairMoments: 0, blanks: 0, firstTry: 0, misses: 0, patternMs: [], maxBerries: 0, maxNumber: 0, startedAt: now() };
    setRounds(rs);
    setChestGems(0);
    setPetMood('cheer');
    startRound(rs, 0);
  }

  function roundWon(line: string) {
    setPhase('roundDone');
    setPetMood('dance');
    setChestGems(g => g + 1);
    sfx.good();
    fire(86, 24, ['#FDE047', '#FFFFFF', '#F472B6', '#67E8F9'], 14, 60);
    say(line, 'celebrating');
    later(() => {
      if (ri + 1 < rounds.length) startRound(rounds, ri + 1);
      else finish();
    }, 2100);
  }

  function finish() {
    sfx.fanfare();
    const x = m.current;
    const tries = x.blanks + x.misses;
    logQuestMetric('math', 'dragon-bridge', {
      level,
      shareRounds: x.shares,
      fairFirstTry: x.fairFirst,
      takeBacks: x.takeBacks,
      patternStones: x.blanks,
      patternFirstTry: x.firstTry,
      patternAccuracy: tries ? Math.round((x.blanks / tries) * 100) : 0,
      avgPatternMs: x.patternMs.length ? Math.round(x.patternMs.reduce((s, v) => s + v, 0) / x.patternMs.length) : 0,
      maxBerries: x.maxBerries,
      maxNumber: x.maxNumber,
      totalMs: now() - x.startedAt,
    });
    const light = Math.max(12, 16 + Math.min(level, 40) * 3 - x.misses - x.unfairMoments);
    awardStarlight(light);
    setEarned(light);
    recordGameLevel('dragon-bridge', level);
    later(() => setPhase('done'), 600);
  }

  // ── Fair shares ──
  function areaPx() {
    const r = areaRef.current?.getBoundingClientRect();
    return { w: r?.width ?? 360, h: r?.height ?? 500 };
  }

  function tapBaby(i: number) {
    if (phase !== 'playing' || round?.kind !== 'share') return;
    const { w, h } = areaPx();
    const k = round.babies;
    const dx = ((BASKET.x - nestX(i, k)) / 100) * w;
    const dy = ((BASKET.y - PLATE_Y) / 100) * h;
    const min = Math.min(...counts);

    if (basket === 0 || (unfair && counts[i] > min)) {
      // give one back to the basket from a baby that has more
      if (counts[i] > min) {
        const next = counts.map((c, j) => (j === i ? c - 1 : c));
        setCounts(next);
        setBasket(b => b + 1);
        m.current.takeBacks += 1;
        sfx.back();
        launch(i, true, -dx, -dy);
        setHintNest(-1);
        setUnfair(false);
        say('Thank you! Now give it to a baby with fewer.', 'happy');
      } else {
        setBabyFx(f => ({ i, n: f.n + 1 }));
        say('This baby has the fewest already. Try a baby with more!', 'thinking');
      }
      return;
    }

    const next = counts.map((c, j) => (j === i ? c + 1 : c));
    const left = basket - 1;
    setCounts(next);
    setBasket(left);
    sfx.plop(next[i]);
    setHop(n => n + 1);
    launch(i, false, dx, dy);
    setBabyFx(f => ({ i, n: f.n + 1 }));
    checkShare(next, left);
  }

  function launch(nest: number, back: boolean, dx: number, dy: number) {
    flyId.current += 1;
    const id = flyId.current;
    setFlyers(f => [...f, { id, nest, back, dx, dy }]);
    later(() => setFlyers(f => f.filter(x => x.id !== id)), 520);
  }

  function checkShare(next: number[], left: number) {
    if (round?.kind !== 'share') return;
    const k = round.babies;
    const lo = Math.min(...next), hi = Math.max(...next);
    if (lo === hi && left < k) {
      m.current.shares += 1;
      if (roundClean.current) m.current.fairFirst += 1;
      setHintNest(-1);
      setPetMood('cheer');
      if (left > 0) {
        // the berries that can't be shared hop over to Kailia
        later(() => {
          setBasket(0);
          setHop(n => n + 1);
          fire(16, 86, ['#818CF8', '#FFFFFF', '#FDE047'], 10, 40);
        }, 500);
        later(() => roundWon(`Fair and square! Every baby has ${lo}, and ${left === 1 ? 'one berry is' : `${left} berries are`} left for Kailia. Yum!`), 700);
      } else {
        later(() => roundWon(`Fair and square! Every baby dragon has ${lo}!`), 500);
      }
      return;
    }
    if (left === 0 || (left < k && hi - lo > left)) {
      // out of berries (or too few to even it out): gently ask to fix it
      roundClean.current = false;
      m.current.unfairMoments += 1;
      setUnfair(true);
      const most = next.indexOf(hi);
      setHintNest(most);
      setPetMood('oops');
      say('Is it fair? Tap a baby with more to take a berry back.', 'thinking', true);
      return;
    }
    if (hi - lo >= 2) {
      roundClean.current = false;
      setHintNest(next.indexOf(lo));
      say(`Psst! ${pet.name} found the baby with the fewest. Give that one a berry!`, 'thinking');
    } else if (hintNest >= 0 && next[hintNest] >= hi) {
      setHintNest(-1);
      say('Nice sharing!', 'excited');
    }
  }

  // ── Pattern stones ──
  function pickStone(oi: number) {
    if (phase !== 'playing' || round?.kind !== 'pattern' || crossing) return;
    const opts = round.options[bi];
    const choice = opts[oi];
    const ans = round.seq[round.blanks[bi]];
    if (same(choice, ans)) {
      m.current.blanks += 1;
      if (missRef.current === 0) m.current.firstTry += 1;
      m.current.patternMs.push(now() - roundStart.current);
      roundStart.current = now();
      missRef.current = 0;
      setHintOpt(-1);
      const nf = filled.map((f, j) => (j === bi ? choice : f));
      setFilled(nf);
      sfx.good();
      setPetMood('cheer');
      const sx = stoneX(round.blanks[bi], round.seq.length);
      fire(sx, STONE_Y, ['#FDE047', '#FFFFFF', choice.c >= 0 ? GEMS[choice.c].hex : '#67E8F9'], 10, 46);
      if (bi + 1 < round.blanks.length) {
        setBi(bi + 1);
        say('Yes! Now the next missing stone.', 'excited');
        return;
      }
      say('The path is whole! Go, Kailia!', 'celebrating');
      cross(round.seq.length);
      return;
    }
    // a gentle miss: the stone wobbles and stays in the tray
    missRef.current += 1;
    m.current.misses += 1;
    sfx.soft();
    setWobble(w => ({ i: oi, n: w.n + 1 }));
    setPetMood('oops');
    if (missRef.current >= 2) {
      const right = opts.findIndex(t => same(t, ans));
      setHintOpt(right);
      say(`${pet.name} is standing by the stone that fits. Try that one!`, 'thinking', true);
    } else {
      say(round.numbers ? 'Ooh, close! Count along the stones with me, then try again.' : 'Ooh, close! Say the pattern out loud with me and try again.', 'thinking');
    }
  }

  // Kailia hops stone by stone to the far bank
  function cross(n: number) {
    setCrossing(true);
    for (let j = 0; j < n; j++) {
      later(() => { setKailia({ x: stoneX(j, n), y: STONE_Y + 1.5 }); setHop(h => h + 1); sfx.hop(j); }, 350 + j * 330);
    }
    later(() => { setKailia({ x: 78, y: FAR_Y }); setHop(h => h + 1); }, 350 + n * 330);
    later(() => roundWon(pick(['Kailia made it across!', 'Hop, hop, hooray!', 'What a pattern path!'])), 700 + n * 330);
  }

  function tickle() {
    setPetMood('dance');
    later(() => setPetMood('idle'), 1300);
  }

  // ── Screens ──
  const chapter = chapterFor(level);

  if (phase === 'intro') return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{ background: 'linear-gradient(160deg,#2a1640,#4a2357 55%,#7c2d12)' }}>
      <div className="max-w-sm w-full text-center">
        <div className="flex items-end justify-center gap-2 mb-4">
          <PandaSprite size={104} expression="excited" className="float" />
          <KailiaSprite size={84} expression="excited" className="float" style={{ animationDelay: '0.2s' }} />
          <span className="float inline-block" style={{ animationDelay: '0.4s' }}>
            <LiveArt src={EMBER.art} alt="a baby dragon" size={petWidth(EMBER.art, 70)} kind="pet" />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2" style={{ textShadow: '0 0 20px #F59E0B' }}>Dragon Bridge</h1>
        <div data-read-aloud className="rounded-2xl px-4 py-3 mb-4 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <p className="text-gray-900 text-base font-bold leading-snug">
            The dragons&apos; treasure is across the crystal river! Share berries <strong>fairly</strong> with the
            baby dragons and finish the <strong>stepping-stone patterns</strong> so Kailia can hop across.
          </p>
        </div>
        <div className="flex justify-center items-end gap-2 mb-2" aria-hidden>
          {[0, 1, 2, 3].map(i => (
            <span key={i} className="float inline-block" style={{ animationDelay: `${i * 0.25}s` }}>
              <GemToken t={{ c: [0, 1, 0, 1][i], s: 0 }} size={30} />
            </span>
          ))}
          <span className="soft-pulse inline-flex items-center justify-center rounded-full font-extrabold text-amber-200"
            style={{ width: 30, height: 30, border: '2.5px dashed #FDE68A' }}>?</span>
        </div>
        <LevelPath gameId="dragon-bridge" level={level} onPick={setLevel} />
        <button onClick={startGame}
          className="mt-4 px-10 py-4 rounded-full font-extrabold text-amber-950 text-xl transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#FDE047,#F59E0B)', boxShadow: '0 0 30px rgba(245,158,11,0.45)' }}>
          <span className="whitespace-nowrap">Play level {level}</span>
        </button>
        <div className="mt-4">
          <Link href="/play" className="text-amber-200 text-sm hover:text-white">← Back to the map</Link>
        </div>
        <SkillIntro gameId="dragon-bridge" />
      </div>
    </main>
  );

  if (phase === 'done') return (
    <main className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg,#4a2357,#9a3412)' }}>
      <div className="text-center bounce-in">
        <div className="mx-auto mb-2 star-burst" style={{ width: 120 }}><Chest gems={rounds.length} open /></div>
        <div className="flex items-end justify-center gap-2 mb-4">
          <PandaSprite size={112} expression="celebrating" className="float" />
          <KailiaSprite size={88} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
          <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
            <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 76)} kind="pet" />
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
        <p className="text-amber-100 font-semibold mb-1">The treasure chest is sparkling, {chapter.name} bridge-builder!</p>
        <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
            className="px-8 py-3.5 rounded-full text-lg font-extrabold text-amber-900 shadow-xl transition-transform hover:scale-105"
            style={{ background: 'white' }}>
            <span className="whitespace-nowrap">Level {level + 1} ▶</span>
          </button>
          <Link href="/play"
            className="px-8 py-3.5 rounded-full text-lg font-extrabold text-amber-950 shadow-xl transition-transform hover:scale-105 inline-block"
            style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
            <span className="whitespace-nowrap">Back to the map</span>
          </Link>
        </div>
      </div>
    </main>
  );

  if (!round) return null;

  const share = round.kind === 'share' ? round : null;
  const pat = round.kind === 'pattern' ? round : null;
  const k = share?.babies ?? 0;
  const inFlightTo = (i: number) => flyers.filter(f => f.nest === i && !f.back).length;
  const petX = pat
    ? (hintOpt >= 0 ? optX(hintOpt, pat.options[bi].length) : 90)
    : (hintNest >= 0 ? nestX(hintNest, k) : 80);
  // pointing at a baby, the friend waits on the riverbank right under it;
  // pointing at a stone, it stands just below that stone in the tray
  const petY = share && hintNest >= 0 ? BANK_Y : GROUND - 0.5;

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg,#2a1640,#4a2357)' }}>
      <style>{DB_CSS}</style>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="font-bold text-sm text-amber-200">← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Dragon Bridge <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="flex justify-end gap-1 w-16" aria-hidden>
            {rounds.map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: '#FDE047', boxShadow: '0 0 8px #FDE047', opacity: i < chestGems ? 1 : 0.25 }} />
            ))}
          </span>
        </div>

        <div ref={areaRef}
          className="relative w-full rounded-[28px] overflow-hidden select-none"
          style={{ aspectRatio: '3 / 4.2', touchAction: 'manipulation', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.3), 0 10px 0 rgba(0,0,0,0.25)' }}>

          <CrystalCave />

          {/* the treasure chest up in its glowing nook: one gem per round won */}
          <div className="absolute pointer-events-none" style={{ left: '85%', top: '29%', width: '20%', transform: 'translate(-50%, -100%)', zIndex: 2 }}>
            <div key={chestGems} className={chestGems ? 'kp-jelly' : ''} style={{ transformOrigin: '50% 100%' }}>
              <Chest gems={chestGems} open={phase === 'roundDone' || chestGems > 0} />
            </div>
          </div>

          {/* ── Fair shares: baby dragons on the far bank ── */}
          {share && counts.map((c, i) => {
            const x = nestX(i, k);
            const shown = c - inFlightTo(i);
            const babyH = k >= 5 ? 54 : k === 4 ? 62 : k === 3 ? 72 : 84;
            const happy = phase === 'roundDone';
            return (
              <button key={`baby-${ri}-${i}`} onClick={() => tapBaby(i)} data-baby={i}
                aria-label={`Baby dragon ${i + 1}, ${shown} berries`}
                className="absolute flex flex-col items-center justify-end"
                style={{ left: `${x}%`, top: '10%', height: '37%', width: `${Math.min(30, 80 / k)}%`, transform: 'translateX(-50%)', zIndex: 6 }}>
                <span key={babyFx.i === i ? babyFx.n : 'still'}
                  className={`${happy ? 'fg-dance' : babyFx.i === i ? 'kp-jelly' : 'critter-bob'} ${hintNest === i ? 'hint-glow' : ''} inline-block`}
                  style={{ transformOrigin: '50% 100%', filter: BABY_TINT[i % BABY_TINT.length], animationDelay: `${-i * 0.4}s` }}>
                  <LiveArt src={EMBER.art} alt="" size={petWidth(EMBER.art, babyH)} kind="pet" pokeable={false} />
                </span>
                <Plate n={Math.max(0, shown)} />
              </button>
            );
          })}

          {share && (
            <div className="absolute pointer-events-none" style={{ left: `${BASKET.x}%`, top: `${BASKET.y}%`, width: '27%', transform: 'translate(-50%, -50%)', zIndex: 7 }}>
              <Basket n={basket} />
            </div>
          )}

          {/* berries in the air */}
          {share && flyers.map(f => {
            const x = f.back ? BASKET.x : nestX(f.nest, k);
            const y = f.back ? BASKET.y - 4 : PLATE_Y - 1;
            return (
              <span key={f.id} className="absolute pointer-events-none db-fly"
                style={{ left: `${x}%`, top: `${y}%`, zIndex: 9, ['--dx' as string]: `${f.dx}px`, ['--dy' as string]: `${f.dy}px` } as CSSProperties}>
                <Berry size={18} />
              </span>
            );
          })}

          {/* ── Pattern stones across the river ── */}
          {pat && pat.seq.map((t, j) => {
            const n = pat.seq.length;
            const blankAt = pat.blanks.indexOf(j);
            const isBlank = blankAt >= 0;
            const tok = isBlank ? filled[blankAt] : t;
            const active = isBlank && blankAt === bi && !filled[blankAt];
            const size = Math.min(15.5, 84 / n);
            return (
              <div key={`st-${ri}-${j}`} className="absolute drop-in" data-stone={j}
                style={{ left: `${stoneX(j, n)}%`, top: `${STONE_Y}%`, width: `${size}%`, transform: 'translate(-50%, -50%)', zIndex: 4, animationDelay: `${j * 70}ms`, animationFillMode: 'both' }}>
                <div className="db-bob" style={{ animationDelay: `${-j * 0.35}s` }}>
                  <Stone />
                  <div className="absolute inset-x-0 flex justify-center" style={{ top: '-6%' }}>
                    {tok
                      ? <span key={isBlank ? 'in' : 'base'} className={isBlank ? 'bounce-in inline-block' : 'inline-block'}><TokenView t={tok} size={pat.numbers ? 0.8 : 0.72} /></span>
                      : <span className={`${active ? 'soft-pulse' : ''} flex items-center justify-center rounded-full font-extrabold`}
                          style={{ width: '70%', aspectRatio: '1', border: `3px dashed ${active ? '#FDE68A' : 'rgba(253,230,138,0.5)'}`, color: '#FDE68A', fontSize: 'clamp(14px, 4.5vw, 22px)', background: 'rgba(30,27,75,0.35)' }}>?</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {pat && !crossing && phase === 'playing' && (
            <>
              <div className="absolute pointer-events-none rounded-full" style={{ left: '54%', top: `${TRAY_Y}%`, width: '66%', height: '15%', transform: 'translate(-50%, -50%)', background: 'rgba(59,36,22,0.55)', border: '2px solid rgba(253,230,138,0.35)', zIndex: 3 }} />
              {pat.options[bi].map((t, oi) => (
                <button key={`opt-${ri}-${bi}-${oi}`} onClick={() => pickStone(oi)} data-opt={oi}
                  aria-label={t.n !== undefined ? `Stone with ${t.n}` : `${GEMS[t.c].name} ${SHAPES[t.s]} gem stone`}
                  className="absolute drop-in"
                  style={{ left: `${optX(oi, pat.options[bi].length)}%`, top: `${TRAY_Y}%`, width: '19%', transform: 'translate(-50%, -50%)', zIndex: 8, animationDelay: `${oi * 90}ms`, animationFillMode: 'both' }}>
                  <div key={wobble.i === oi ? wobble.n : 'still'} className={`${wobble.i === oi ? 'soft-wobble' : ''} ${hintOpt === oi ? 'hint-glow' : ''} relative`}>
                    <Stone />
                    <div className="absolute inset-x-0 flex justify-center" style={{ top: '-6%' }}>
                      <TokenView t={t} size={pat.numbers ? 0.8 : 0.72} />
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* in pattern rounds a baby dragon waits on the far bank for Kailia */}
          {pat && (
            <div className="absolute pointer-events-none" style={{ left: '91%', top: `${FAR_Y}%`, transform: 'translate(-50%, -100%)', zIndex: 5 }}>
              <span className={`${phase === 'roundDone' ? 'fg-dance' : 'critter-bob'} inline-block`} style={{ transformOrigin: '50% 100%', filter: BABY_TINT[ri % BABY_TINT.length] }}>
                <LiveArt src={EMBER.art} alt="" size={petWidth(EMBER.art, 62)} kind="pet" pokeable={false} />
              </span>
            </div>
          )}

          <KailiaActor x={kailia.x} y={kailia.y} h={64} hop={hop} z={12} moveMs={600} />
          <div data-pet>
            <Actor art={pet.art} name={pet.name} x={petX} y={petY} h={46}
              mood={(hintOpt >= 0 || hintNest >= 0) && phase === 'playing' ? 'talk' : petMood} moodKey={petMoodKey} moveMs={800}
              flip={petX < kailia.x} onTap={tickle} z={13} />
          </div>
          {burstLayer}

          {phase === 'roundDone' && ri + 1 < rounds.length && (
            <div className="absolute inset-x-0 top-[6%] flex justify-center pointer-events-none" style={{ zIndex: 40 }}>
              <p className="bounce-in px-5 py-2 rounded-full text-lg font-extrabold text-amber-950" style={{ background: '#FFF8E7', border: '3px solid #3b2416' }}>
                A gem for the treasure!
              </p>
            </div>
          )}
        </div>

        {/* Noel's guide bar */}
        <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)' }}>
          <button aria-label="Hear it again" onClick={() => speak(noelLine)} style={{ flexShrink: 0 }}>
            <PandaSprite size={46} expression={noelMood} />
          </button>
            <div className="rounded-2xl px-3 py-2 mr-12 text-lg font-bold text-gray-900 bg-white leading-snug">{noelLine}</div>
        </div>
      </div>
    </main>
  );
}

const DB_CSS = `
@keyframes db-fly {
  0%   { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.8); }
  50%  { transform: translate(calc(-50% + var(--dx) * 0.5), calc(-50% + var(--dy) * 0.5 - 70px)) scale(1.15); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
.db-fly { animation: db-fly 0.5s cubic-bezier(.3,.1,.5,1) both; }
@keyframes db-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
.db-bob { position: relative; animation: db-bob 2.6s ease-in-out infinite; }
@keyframes db-flow { to { stroke-dashoffset: -40; } }
.db-flow { animation: db-flow 3s linear infinite; }
@media (prefers-reduced-motion: reduce) { .db-fly, .db-bob, .db-flow { animation-duration: 0.01s; animation-iteration-count: 1; } }
`;

// ── Drawings (painted style: warm brown outline, light rims on dark) ──

const SK = '#3b2416';

function GemShape({ t }: { t: Tok }) {
  const g = GEMS[t.c];
  if (t.s === 1) return (
    <g>
      <circle cx="20" cy="20" r="15" fill={g.hex} stroke={SK} strokeWidth="2" />
      <circle cx="20" cy="20" r="8.5" fill="none" stroke={g.dark} strokeWidth="1.4" opacity="0.6" />
      <path d="M11 15 Q14 9 20 8" stroke="#FFFFFF" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  );
  if (t.s === 2) return (
    <g>
      <path d="M20 4 L36 33 H4z" fill={g.hex} stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 4 L20 33 M4 33 L20 22 L36 33" stroke={g.dark} strokeWidth="1.2" fill="none" opacity="0.5" />
      <path d="M17 11 L10 25" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
    </g>
  );
  return (
    <g>
      <path d="M20 3 L36 16 L20 37 L4 16z" fill={g.hex} stroke={SK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 16 H36 M12 16 L20 3 L28 16 M12 16 L20 37 L28 16" stroke={g.dark} strokeWidth="1.2" fill="none" opacity="0.55" />
      <path d="M10 14 L17 7" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
    </g>
  );
}

function GemToken({ t, size }: { t: Tok; size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden style={{ overflow: 'visible', filter: `drop-shadow(0 0 2px #FFF8E1) drop-shadow(0 0 6px ${GEMS[t.c].hex}99)` }}>
      <g filter="url(#kp-brush)"><GemShape t={t} /></g>
    </svg>
  );
}

// a token on a stone: a gem, or a number painted on a little shell
function TokenView({ t, size }: { t: Tok; size: number }) {
  if (t.n !== undefined) return (
    <span className="flex items-center justify-center rounded-full font-extrabold"
      style={{ width: `${size * 100}%`, aspectRatio: '1', background: '#FFF4D6', border: `3px solid ${SK}`, color: SK,
        fontSize: `clamp(13px, ${t.n >= 100 ? 3.4 : 4.6}vw, ${t.n >= 100 ? 18 : 24}px)`, boxShadow: '0 0 10px rgba(253,230,138,0.7)' }}>
      {t.n}
    </span>
  );
  return (
    <span className="block" style={{ width: `${size * 100}%` }}>
      <svg viewBox="0 0 40 40" width="100%" aria-hidden style={{ display: 'block', overflow: 'visible', filter: `drop-shadow(0 0 2px #FFF8E1) drop-shadow(0 0 6px ${GEMS[t.c].hex}aa)` }}>
        <g filter="url(#kp-brush)"><GemShape t={t} /></g>
      </svg>
    </span>
  );
}

function Stone() {
  return (
    <svg viewBox="0 0 60 40" width="100%" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <ellipse cx="30" cy="36" rx="30" ry="5" fill="#67E8F9" opacity="0.35" />
      <g filter="url(#kp-brush)" stroke={SK} strokeLinejoin="round">
        <path d="M3 22 Q2 34 30 36 Q58 34 57 22z" fill="#7C6F99" strokeWidth="1.8" />
        <ellipse cx="30" cy="20" rx="27" ry="12" fill="#D8D0EC" strokeWidth="1.8" />
        <path d="M12 16 Q20 11 30 11" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

function Berry({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 0 2px #FFFFFF)' }}>
      <circle cx="10" cy="11" r="8" fill="#6366F1" stroke={SK} strokeWidth="1.6" />
      <path d="M7 3.5 L10 6 L13 3.5" stroke="#16A34A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="7" cy="9" r="2.2" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

// a leaf plate under each baby, berries in neat rows of three so the
// amounts are easy to compare at a glance
function Plate({ n }: { n: number }) {
  const rows = Math.ceil(n / 3);
  return (
    <span className="relative block" style={{ width: 62, height: 30 + Math.max(0, rows - 2) * 11, marginTop: -8 }}>
      <svg viewBox="0 0 62 22" width="62" height="22" className="absolute bottom-0 left-0" aria-hidden style={{ overflow: 'visible' }}>
        <g filter="url(#kp-brush)">
          <ellipse cx="31" cy="12" rx="29" ry="9" fill="#4ADE80" stroke={SK} strokeWidth="1.6" />
          <path d="M6 12 H56 M18 12 L12 6 M30 12 L26 5 M42 12 L40 5" stroke="#15803D" strokeWidth="1.1" fill="none" />
        </g>
      </svg>
      {Array.from({ length: n }, (_, i) => {
        const row = Math.floor(i / 3), col = i % 3;
        return (
          <span key={i} className="absolute drop-in" style={{ left: 13 + col * 13, bottom: 7 + row * 11 }}>
            <Berry size={14} />
          </span>
        );
      })}
    </span>
  );
}

function Basket({ n }: { n: number }) {
  const shown = Math.min(n, 24);
  return (
    <div className="relative w-full" style={{ aspectRatio: '100 / 70' }}>
      <svg viewBox="0 0 100 70" width="100%" className="absolute inset-0" aria-hidden style={{ overflow: 'visible' }}>
        <g filter="url(#kp-brush)" stroke={SK} strokeLinejoin="round">
          <path d="M18 30 Q50 -8 82 30" fill="none" strokeWidth="5" stroke="#8A5A32" />
          <path d="M18 30 Q50 -8 82 30" fill="none" strokeWidth="1.5" />
        </g>
      </svg>
      {/* the berries heaped inside */}
      {Array.from({ length: shown }, (_, i) => {
        const row = Math.floor(i / 6), col = i % 6;
        return (
          <span key={i} className="absolute" style={{ left: `${12 + col * 12.5 + (row % 2) * 6}%`, bottom: `${54 + row * 12}%` }}>
            <Berry size={15} />
          </span>
        );
      })}
      <svg viewBox="0 0 100 70" width="100%" className="absolute inset-0" aria-hidden style={{ overflow: 'visible' }}>
        <g filter="url(#kp-brush)" stroke={SK} strokeLinejoin="round">
          <path d="M8 34 H92 L82 68 H18z" fill="#C98B4E" strokeWidth="2.2" />
          <path d="M12 45 H88 M15 56 H85" stroke="#8A5A32" strokeWidth="1.6" />
          <path d="M30 34 L33 68 M50 34 V68 M70 34 L67 68" stroke="#8A5A32" strokeWidth="1.4" />
          <rect x="5" y="30" width="90" height="7" rx="3.5" fill="#E0A96A" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function Chest({ gems, open }: { gems: number; open?: boolean }) {
  const glow = Math.min(1, 0.25 + gems * 0.15);
  return (
    <svg viewBox="0 0 80 64" width="100%" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <ellipse cx="40" cy="34" rx="44" ry="30" fill="#FDE68A" opacity={glow * 0.45} className="fg-glow" />
      <g filter="url(#kp-brush)" stroke={SK} strokeLinejoin="round">
        {open && <path d="M10 30 L15 7 Q40 3 65 7 L70 30z" fill="#D97706" strokeWidth="2.2" />}
        {open && <path d="M16 26 L19 11 Q40 8 61 11 L64 26z" fill="#7C2D12" strokeWidth="1" />}
        {/* the gems heaped inside */}
        {Array.from({ length: Math.min(gems, 6) }, (_, i) => (
          <g key={i} transform={`translate(${14 + i * 9} ${18 - (i % 2) * 5}) scale(0.32)`}>
            <GemShape t={{ c: i % 5, s: i % 3 }} />
          </g>
        ))}
        <rect x="8" y="30" width="64" height="30" rx="4" fill="#B45309" strokeWidth="2.2" />
        <path d="M8 40 H72" stroke="#7C2D12" strokeWidth="1.6" />
        <rect x="34" y="34" width="12" height="12" rx="2" fill="#FACC15" strokeWidth="1.6" />
        {!open && <path d="M8 30 Q8 12 40 10 Q72 12 72 30z" fill="#D97706" strokeWidth="2.2" />}
      </g>
    </svg>
  );
}

// ── The crystal cave and its glowing river ──
function CrystalCave() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="db-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#24133D" /><stop offset="1" stopColor="#4A2A5E" />
          </linearGradient>
          <linearGradient id="db-river" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0E7490" /><stop offset="1" stopColor="#164E63" />
          </linearGradient>
          <radialGradient id="db-nook"><stop offset="0" stopColor="#FDE68A" stopOpacity="0.55" /><stop offset="1" stopColor="#FDE68A" stopOpacity="0" /></radialGradient>
          <radialGradient id="db-crys"><stop offset="0" stopColor="#F0ABFC" stopOpacity="0.5" /><stop offset="1" stopColor="#F0ABFC" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="140" fill="url(#db-wall)" />
        {/* the golden nook where the treasure sits */}
        <ellipse cx="85" cy="33" rx="17" ry="14" fill="url(#db-nook)" className="fg-glow" />
        <g filter="url(#kp-brush)" stroke={SK} strokeLinejoin="round">
          {/* stalactites */}
          {[[4, 9], [13, 14], [24, 7], [37, 12], [50, 6], [61, 11], [72, 8]].map(([x, h], i) => (
            <path key={i} d={`M${x - 3.5} 0 L${x} ${h} L${x + 3.5} 0z`} fill="#3A2152" strokeWidth="0.6" />
          ))}
          <path d="M70 41 Q72 26 85 24 Q98 26 100 34 V41z" fill="#5B3A6E" strokeWidth="0.7" />
          {/* crystal clusters on the walls */}
          {[[6, 46, '#67E8F9'], [34, 34, '#F0ABFC'], [57, 44, '#A5B4FC'], [18, 26, '#FDE68A']].map(([x, y, c], i) => (
            <g key={i}>
              <path d={`M${x as number - 3} ${y} L${x as number - 1.5} ${(y as number) - 7} L${x} ${y}z`} fill={c as string} strokeWidth="0.5" />
              <path d={`M${x} ${y} L${(x as number) + 1.5} ${(y as number) - 10} L${(x as number) + 3} ${y}z`} fill={c as string} strokeWidth="0.5" />
              <path d={`M${(x as number) + 3} ${y} L${(x as number) + 5} ${(y as number) - 5} L${(x as number) + 6} ${y}z`} fill={c as string} strokeWidth="0.5" />
            </g>
          ))}
          {/* the far bank where the baby dragons sit */}
          <path d="M0 50 Q25 46 50 49 T100 48 V67 H0z" fill="#6E4A6E" strokeWidth="0.8" />
          <path d="M0 50 Q25 46 50 49 T100 48" fill="none" stroke="#A47CA6" strokeWidth="1.2" />
          {/* the glowing river */}
          <rect x="0" y="66" width="100" height="37" fill="url(#db-river)" strokeWidth="0" />
          {/* the near bank */}
          <path d="M0 102 Q30 98 60 101 T100 100 V140 H0z" fill="#7A5236" strokeWidth="0.8" />
          <path d="M0 102 Q30 98 60 101 T100 100" fill="none" stroke="#B07A4A" strokeWidth="1.3" />
          {[[12, 118], [40, 128], [70, 116], [88, 132], [25, 135]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.4" fill="#9B6B45" strokeWidth="0.4" />
          ))}
        </g>
        {/* light flowing on the water */}
        {[71, 79, 87, 95].map((y, i) => (
          <path key={y} d={`M0 ${y} Q25 ${y - 1.5} 50 ${y} T100 ${y}`} fill="none" stroke="#A5F3FC" strokeWidth="0.6"
            strokeDasharray="6 14" className="db-flow" opacity="0.55" style={{ animationDelay: `${-i * 0.8}s`, animationDuration: `${3 + i * 0.6}s` }} />
        ))}
        <ellipse cx="36" cy="30" rx="10" ry="8" fill="url(#db-crys)" className="fg-glow" />
      </svg>
      {/* sparkles drifting up from the river */}
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className="fg-rise absolute rounded-full" style={{
          left: `${6 + seeded(i, 70) * 88}%`, top: `${50 + seeded(i, 71) * 18}%`, width: 6, height: 6,
          background: `radial-gradient(circle, #FFFFFF 0%, ${['#67E8F9', '#F0ABFC', '#FDE68A', '#A5B4FC'][i % 4]} 50%, transparent 75%)`,
          animationDuration: `${5 + seeded(i, 72) * 4}s`, animationDelay: `${-seeded(i, 73) * 8}s`,
          ['--rise' as string]: `${80 + seeded(i, 74) * 100}px`, ['--sway' as string]: `${(seeded(i, 75) - 0.5) * 30}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}
