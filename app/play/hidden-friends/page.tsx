'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { CritterSprite, type SpeciesKey } from '@/components/characters/CritterSprite';
import { characterArt } from '@/components/characters/characters.config';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import { PIECES, PieceIcon, type PieceKind } from './pieces';

// ─── Where's Noel? ────────────────────────────────────────────────────────────
// Seek-and-find in the Where's-Waldo tradition: busy story scenes packed
// with painted objects and look-alike critters. Noel is peeking out from
// behind a bush somewhere in the crowd, plus themed treasures among their
// own foils. Levels add clutter and shrink everything. Measures visual
// scanning & discrimination.
//
// Kailia searches along the path at the bottom of the scene: every find
// sends her running under it with a hop, and the child's friend cheers
// beside her. Two looks at the wrong thing in a row and the friend runs
// to sit right under something still hiding.

type CrowdDef = { piece: PieceKind } | { critter: SpeciesKey };

interface SceneDef {
  name: string; story: string;
  world: 'forest' | 'market' | 'snow' | 'night';
  crowd: CrowdDef[];             // the crowd (includes look-alike foils!)
  treasure: { piece: PieceKind; count: number; label: string };
}

const P = (piece: PieceKind): CrowdDef => ({ piece });
const C = (critter: SpeciesKey): CrowdDef => ({ critter });

const SCENES: SceneDef[] = [
  {
    name: 'The Forest Party', world: 'forest',
    story: 'The forest creatures threw a berry party — but Noel wandered off for a nap! Find him peeking out from behind a bush… and his 3 bamboo snacks!',
    crowd: [P('pine'), P('tree'), P('mushroom'), C('fox'), C('rabbit'), C('owl'), C('squirrel'), P('flower'), P('leaf'), C('raccoon'), C('koala'), P('strawberry'), P('acorn'), P('bush')],
    treasure: { piece: 'bamboo', count: 3, label: 'bamboo' },
  },
  {
    name: 'The Busy Market', world: 'market',
    story: 'Market day in the village! Noel went shopping and got lost in the crowd. Find him — and the 3 cookies he dropped!',
    crowd: [P('basket'), P('apple'), P('carrot'), P('bread'), P('cheese'), P('grapes'), P('pot'), P('bucket'), C('rabbit'), C('raccoon'), C('koala'), P('pretzel'), C('hedgehog'), P('bush')],
    treasure: { piece: 'cookie', count: 3, label: 'cookies' },
  },
  {
    name: 'The Snowy Peaks', world: 'snow',
    story: 'Brrr! Noel climbed the snowy mountain — and white fur hides well in the snow! Spot him in the snowy crowd, and find 3 golden stars!',
    crowd: [P('snowman'), P('snowflake'), P('peak'), C('deer'), P('pine'), P('ice'), C('koala'), C('raccoon'), C('owl'), P('cloud'), P('bush')],
    treasure: { piece: 'star', count: 3, label: 'stars' },
  },
  {
    name: 'The Night Garden', world: 'night',
    story: 'The moon garden blooms at midnight! Noel snuck in to smell the flowers. Find him in the shadows — and light the 3 lost lanterns!',
    crowd: [P('moon'), P('sparkle'), C('owl'), P('flower'), P('mushroom'), P('fern'), C('rabbit'), C('raccoon'), C('koala'), P('tulip'), P('star'), P('bush')],
    treasure: { piece: 'lantern', count: 3, label: 'lanterns' },
  },
];

// the scene's drawing box (matches the scene's 3 : 3.8 shape)
const VW = 300, VH = 380;
const BUSY_TOP = 24, BUSY_BOTTOM = 292;   // where the crowd sits; below is Kailia's path
const GROUND = 96;                          // Kailia's and the friend's feet, % of the scene
const LOOKALIKES: SpeciesKey[] = ['raccoon', 'koala'];

interface Placed {
  id: number; def: CrowdDef | null; x: number; y: number; size: number; rot: number;
  kind: 'crowd' | 'noel' | 'treasure';
  found: boolean;
}

import { soundEnabled } from '@/lib/accessibility';
function playNotes(notes: { f: number; t: number; d: number }[]) {
  if (!soundEnabled()) return;
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
  look: () => playNotes([{ f: 392, t: 0, d: 0.12 }]),
  fanfare: () => playNotes([{ f: 523, t: 0, d: 0.15 }, { f: 659, t: 0.12, d: 0.15 }, { f: 784, t: 0.24, d: 0.15 }, { f: 1047, t: 0.36, d: 0.45 }]),
};

const pctX = (x: number) => (x / VW) * 100;
const pctY = (y: number) => (y / VH) * 100;
const clampPct = (v: number) => Math.max(8, Math.min(92, v));

// where the friend sits to point at x without standing on Kailia (at k):
// right under it, or just beside her on the side nearer to it
function besideSpot(x: number, k: number, gap = 17) {
  if (Math.abs(x - k) >= gap) return x;
  const left = k - gap, right = k + gap;
  if (left < 6) return right;
  if (right > 94) return left;
  return Math.abs(left - x) < Math.abs(right - x) ? left : right;
}

export default function WheresNoelPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'levelDone'>('intro');
  const [items, setItems] = useState<Placed[]>([]);
  const [noelLine, setNoelLine] = useState('');
  const [earned, setEarned] = useState(0);
  const [wobbleId, setWobbleId] = useState<number | null>(null);
  const [hintId, setHintId] = useState<number | null>(null);
  const statsRef = useRef({ wrongTaps: 0, startedAt: 0 });
  const missRunRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // the scene's width on screen, so the things to find match the crowd's size
  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneW, setSceneW] = useState(366);

  // Kailia and the friend on the path along the bottom
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(22);
  const [petX, setPetX] = useState(38);
  const [kailiaHop, setKailiaHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved level is only readable after mount
  useEffect(() => { setLevel(nextGameLevel('hidden-friends')); const t = timersRef; return () => t.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSceneW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const scene = SCENES[(level - 1) % SCENES.length];

  const startLevel = useCallback(() => {
    // clutter grows with level; the littlest ones get fewer, bigger things
    const base = tier === 'tiny' ? 30 : tier === 'small' ? 45 : 60;
    const crowdCount = Math.min(base + (level - 1) * 12, 150);
    const sizeBase = (tier === 'tiny' ? 34 : 28) - Math.min(8, (level - 1) * 1.5);
    const u = sizeBase * 0.85;   // px → drawing units (the scene is ~1.2 px per unit on a phone)

    const placed: Placed[] = [];
    let id = 0;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const spot = () => ({ x: rnd(14, VW - 14), y: rnd(BUSY_TOP, BUSY_BOTTOM) });
    // targets never pile on top of each other
    const targetSpots: { x: number; y: number }[] = [];
    const targetSpot = () => {
      let s = spot();
      for (let k = 0; k < 40 && targetSpots.some(t => Math.hypot(t.x - s.x, t.y - s.y) < u * 2.2); k++) s = spot();
      targetSpots.push(s);
      return s;
    };

    for (let i = 0; i < crowdCount; i++) {
      placed.push({ id: ++id, def: scene.crowd[i % scene.crowd.length],
        ...spot(), size: rnd(u * 0.8, u * 1.25), rot: rnd(-20, 20), kind: 'crowd', found: false });
    }
    for (let i = 0; i < scene.treasure.count; i++) {
      placed.push({ id: ++id, def: { piece: scene.treasure.piece }, ...targetSpot(),
        size: rnd(u * 0.9, u * 1.1), rot: rnd(-20, 20), kind: 'treasure', found: false });
    }
    // Noel is a little taller than the pieces so a whole panda (peeking
    // over his bush) reads at a glance
    placed.push({ id: ++id, def: null, ...targetSpot(), size: u * 1.15, rot: rnd(-8, 8), kind: 'noel', found: false });

    // shuffle so the crowd's drawing order is mixed
    placed.sort(() => Math.random() - 0.5);
    statsRef.current = { wrongTaps: 0, startedAt: Date.now() };
    missRunRef.current = 0;
    setItems(placed);
    setHintId(null); setWobbleId(null);
    setKailiaX(22); setPetX(38);
    setNoelLine(`Find Noel and the ${scene.treasure.count} ${scene.treasure.label}!`);
    setPhase('playing');
  }, [level, scene, tier]);

  function tapCrowd(it: Placed) {
    if (phase !== 'playing') return;
    statsRef.current.wrongTaps += 1;
    setWobbleId(it.id);
    timersRef.current.push(setTimeout(() => setWobbleId(w => (w === it.id ? null : w)), 600));
    sfx.look();
    const critter = it.def && 'critter' in it.def ? it.def.critter : null;
    setNoelLine(critter && LOOKALIKES.includes(critter)
      ? `Ooh, close — that's a ${critter}, not Noel! Look for the panda!`
      : 'Keep looking — scan slowly, corner to corner!');
    setPetMood('oops');
    missRunRef.current += 1;
    // two looks in a row at the wrong thing: the friend runs to sit right
    // under something still hiding
    if (missRunRef.current >= 2) {
      const left = items.filter(i => i.kind !== 'crowd' && !i.found);
      const near = left.sort((a, b) => Math.hypot(a.x - it.x, a.y - it.y) - Math.hypot(b.x - it.x, b.y - it.y))[0];
      if (near) {
        setHintId(near.id);
        setNoelLine(`${pet.name} is sitting right under something! Look up above ${pet.name}!`);
      }
    }
  }

  function tapTarget(it: Placed) {
    if (phase !== 'playing' || it.found) return;
    if (it.kind === 'noel') sfx.noel(); else sfx.found();
    missRunRef.current = 0;
    setHintId(null);
    const next = items.map(p => (p.id === it.id ? { ...p, found: true } : p));
    setItems(next);
    // Kailia runs under it and hops, the friend cheers beside her
    const x = clampPct(pctX(it.x));
    setKailiaX(x);
    setPetX(x > 70 ? x - 17 : x + 17);
    setKailiaHop(n => n + 1);
    setPetMood('cheer');
    fire(pctX(it.x), pctY(it.y), ['#FFE066', '#FFFFFF', '#FF9EC7', '#8BE3FF'], it.kind === 'noel' ? 16 : 10, it.kind === 'noel' ? 80 : 56);
    setNoelLine(it.kind === 'noel' ? 'You found me! Peekaboo!' : `A ${scene.treasure.label.replace(/s$/, '')}! Keep going!`);

    // level complete when every target is found
    const targets = next.filter(i => i.kind !== 'crowd');
    if (targets.every(t => t.found)) {
      const s = statsRef.current;
      logQuestMetric('processing', 'hidden-friends', {
        level, targets: targets.length, wrongTaps: s.wrongTaps, totalMs: Date.now() - s.startedAt,
      });
      const stars = Math.max(8, 14 + level * 2 - s.wrongTaps);
      awardStarlight(stars);
      recordGameLevel('hidden-friends', level);
      setEarned(stars);
      setNoelLine('Everyone is found! Hooray!');
      timersRef.current.push(setTimeout(() => { sfx.fanfare(); setPhase('levelDone'); }, 1300));
    }
  }

  function tickle() {
    setPetMood('dance');
    timersRef.current.push(setTimeout(() => setPetMood('idle'), 1300));
  }

  const noelItem = items.find(i => i.kind === 'noel');
  const noelFound = !!noelItem?.found;
  const treasuresFound = items.filter(i => i.kind === 'treasure' && i.found).length;
  const hinted = items.find(i => i.id === hintId && !i.found);
  // the friend sits under the hinted thing, else beside Kailia
  let petSpot = petX;
  if (hinted) {
    const hx = clampPct(pctX(hinted.x));
    petSpot = besideSpot(hx, kailiaX);
  }

  return (
    <main className="min-h-screen pb-6" style={{ background: '#0f172a' }}>
      <div className="max-w-md mx-auto px-3">
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Where&apos;s Noel? <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          <span className="w-16" />
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-4 bounce-in">
            <div className="flex items-end justify-center gap-2 mb-4">
              <Magnifier size={70} />
              <KailiaSprite size={92} expression="thinking" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 62)} kind="pet" />
              <PeekingNoel size={58} />
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                <PieceIcon kind={scene.treasure.piece} size={22} /> Chapter {level}: {scene.name}
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">{scene.story}</p>
            </div>
            <LevelPath gameId="hidden-friends" level={level} onPick={setLevel} />
            <button onClick={startLevel}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Start the search!
            </button>
            <SkillIntro gameId="hidden-friends" />
          </div>
        )}

        {phase !== 'intro' && (
          <>
            {/* find list: a little Noel and one picture per treasure, lit when found */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`h-10 pl-1.5 pr-3 inline-flex items-center gap-1 rounded-full text-sm font-extrabold ${noelFound ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-800'}`}>
                <Image src={characterArt('noel', 'portrait-front')} alt="" width={26} height={34} unoptimized style={{ objectFit: 'contain', opacity: noelFound ? 1 : 0.85 }} />
                Noel {noelFound && '✓'}
              </span>
              <span className={`h-10 px-3 inline-flex items-center gap-1 rounded-full ${treasuresFound === scene.treasure.count ? 'bg-emerald-400' : 'bg-white'}`}
                aria-label={`${treasuresFound} of ${scene.treasure.count} ${scene.treasure.label} found`}>
                {Array.from({ length: scene.treasure.count }, (_, i) => (
                  <PieceIcon key={i} kind={scene.treasure.piece} size={24} dim={i >= treasuresFound} />
                ))}
              </span>
            </div>

            {/* the busy scene */}
            <div ref={sceneRef} className="relative w-full rounded-[28px] overflow-hidden select-none"
              style={{ aspectRatio: '3 / 3.8', touchAction: 'manipulation', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.35), 0 10px 0 rgba(0,0,0,0.22)' }}>
              <Backdrop world={scene.world} />

              {/* the crowd: one painted drawing, every piece tappable */}
              <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VW} ${VH}`} style={{ zIndex: 2 }}>
                <g filter="url(#kp-brush)">
                  {items.filter(it => it.kind === 'crowd' && it.def && 'piece' in it.def).map(it => (
                    <CrowdPiece key={it.id} it={it} wobble={wobbleId === it.id} onTap={() => tapCrowd(it)}>
                      {PIECES[(it.def as { piece: PieceKind }).piece]}
                    </CrowdPiece>
                  ))}
                </g>
                {items.filter(it => it.kind === 'crowd' && it.def && 'critter' in it.def).map(it => (
                  <CrowdPiece key={it.id} it={it} wobble={wobbleId === it.id} onTap={() => tapCrowd(it)}>
                    <CritterSprite species={(it.def as { critter: SpeciesKey }).critter} size={100} animate={false} />
                  </CrowdPiece>
                ))}
              </svg>

              {/* the things to find, each a forgiving tap target */}
              {items.filter(it => it.kind !== 'crowd').map(it => {
                const isNoel = it.kind === 'noel';
                const w = ((isNoel ? it.size * 0.85 : it.size) / VW) * sceneW;  // drawing size, px
                const hit = Math.max(48, w * 1.35);                                   // tap size, px
                return (
                  <button key={it.id} data-kind={it.kind} data-found={it.found} onClick={() => tapTarget(it)}
                    aria-label={isNoel ? 'Noel' : scene.treasure.label}
                    className="absolute flex items-center justify-center"
                    style={{ left: `${pctX(it.x)}%`, top: `${pctY(it.y)}%`, width: hit, height: hit, marginLeft: -hit / 2, marginTop: -hit / 2,
                      zIndex: it.found ? 6 : 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    {it.found && (
                      <span className="absolute inset-0 rounded-full bounce-in" aria-hidden="true"
                        style={{ background: 'radial-gradient(circle, rgba(255,246,176,0.95) 0%, rgba(253,224,71,0.55) 45%, rgba(253,224,71,0) 70%)' }} />
                    )}
                    {hintId === it.id && !it.found && (
                      <span className="absolute inset-0 rounded-full pulse" style={{ border: '3px dashed #B45309', boxShadow: '0 0 0 2px rgba(255,255,255,0.8), inset 0 0 0 2px rgba(255,255,255,0.8)' }} aria-hidden="true" />
                    )}
                    <span className={it.found ? 'star-burst' : undefined}
                      style={{ display: 'block', lineHeight: 0, position: 'relative', filter: it.found ? 'drop-shadow(0 0 8px #FDE047)' : undefined }}>
                      {isNoel
                        ? <PeekingNoel size={w} out={it.found} />
                        : <span style={{ display: 'block', transform: `rotate(${it.rot}deg)` }}><PieceIcon kind={scene.treasure.piece} size={w} /></span>}
                    </span>
                    {it.found && <span className="absolute -top-1 -right-1 bounce-in"><StarIcon size={18} /></span>}
                  </button>
                );
              })}

              <KailiaActor x={kailiaX} y={GROUND} h={72} hop={kailiaHop} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petSpot} y={GROUND} h={50}
                  mood={hinted ? 'talk' : petMood} moodKey={petMoodKey} moveMs={900}
                  onTap={tickle} z={9} />
              </div>
              {burstLayer}
            </div>

            {/* Noel guide (he narrates his own rescue) */}
            <div className="flex items-center gap-3 mt-3 rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              <PandaSprite size={46} expression={noelFound ? 'celebrating' : 'thinking'} style={{ flexShrink: 0 }} />
              <div className="rounded-2xl px-3 py-2 text-lg font-bold text-gray-900 bg-white relative">
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
          style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
          <div className="text-center bounce-in">
            <span className="inline-flex items-end gap-1 mb-3 star-burst" aria-hidden="true">
              {Array.from({ length: scene.treasure.count }, (_, i) => <PieceIcon key={i} kind={scene.treasure.piece} size={i === 1 ? 64 : 48} />)}
            </span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-slate-200 font-semibold mb-1">You found Noel and every {scene.treasure.label.replace(/s$/, '')} in {scene.name}!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { setLevel(l => l + 1); setPhase('intro'); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Next chapter ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-slate-950 shadow-xl transition-transform hover:scale-105 inline-block"
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

// one crowd piece at its spot; the inner group wobbles when tapped
function CrowdPiece({ it, wobble, onTap, children }: { it: Placed; wobble: boolean; onTap: () => void; children: ReactNode }) {
  const s = it.size / 100;
  return (
    <g data-kind="crowd" transform={`translate(${it.x} ${it.y}) rotate(${it.rot}) scale(${s})`} onClick={onTap} style={{ cursor: 'pointer' }}>
      <g className={wobble ? 'soft-wobble' : undefined} style={{ transformBox: 'fill-box', transformOrigin: '50% 90%' }}>
        <g transform="translate(-50 -50)">{children}</g>
      </g>
    </g>
  );
}

// Noel peeking over a bush; once found he pops up and the bush drops away
function PeekingNoel({ size, out = false }: { size: number; out?: boolean }) {
  const h = size * 1.31;
  return (
    <span className="relative inline-block" style={{ width: size, height: h }}>
      <span key={out ? 'out' : 'in'} className={out ? 'kp-hop' : undefined}
        style={{ position: 'absolute', left: 0, right: 0, bottom: out ? 0 : h * 0.06, transformOrigin: '50% 100%' }}>
        <Image src={characterArt('noel', 'portrait-front')} alt="" width={size} height={h} unoptimized draggable={false}
          style={{ width: size, height: h, objectFit: 'contain', pointerEvents: 'none' }} />
      </span>
      {!out && (
        <svg viewBox="0 0 100 60" width={size * 1.25} height={size * 0.75} aria-hidden="true"
          style={{ position: 'absolute', left: -size * 0.125, bottom: -size * 0.12, pointerEvents: 'none' }}>
          <g filter="url(#kp-brush)">
            <path d="M6 58 Q2 34 20 32 Q22 10 44 16 Q58 2 74 18 Q96 18 94 40 Q100 58 84 58z" fill="#6CC36B" stroke="#3b2416" strokeWidth="3.4" strokeLinejoin="round" />
            <path d="M22 40 Q30 30 40 34 M60 28 Q70 24 78 32" stroke="#B5EBA9" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      )}
    </span>
  );
}

function Magnifier({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="float" aria-hidden="true">
      <g filter="url(#kp-brush)">
        <path d="M58 60 L86 90" stroke="#3b2416" strokeWidth="16" strokeLinecap="round" />
        <path d="M58 60 L86 90" stroke="#C9822F" strokeWidth="9" strokeLinecap="round" />
        <circle cx="40" cy="40" r="28" fill="#CFF3FF" stroke="#3b2416" strokeWidth="6" />
        <circle cx="40" cy="40" r="28" fill="none" stroke="#FDE047" strokeWidth="3" />
        <path d="M26 30 Q32 20 44 20" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── Each chapter's painted backdrop ──
// Soft, light colours so every piece's brown outline reads; a little life
// in each (bunting and leaves, clouds, snowfall, twinkling stars and
// fireflies), and a path along the bottom for Kailia and the friend.
function Backdrop({ world }: { world: SceneDef['world'] }) {
  const sk = '#3b2416';
  const look = {
    forest: { top: '#E4F7C4', mid: '#B4E08E', path: '#D9B98A', grass: '#8CC56E' },
    market: { top: '#CDEBFF', mid: '#F8E3B8', path: '#E2C08E', grass: '#E8C98F' },
    snow:   { top: '#E8F4FF', mid: '#CFE4F7', path: '#F4FAFF', grass: '#BFD8EE' },
    night:  { top: '#4B3F96', mid: '#6352B0', path: '#8B7BC9', grass: '#5546A0' },
  }[world];
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`hf-sky-${world}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={look.top} /><stop offset="0.45" stopColor={look.mid} /><stop offset="1" stopColor={look.mid} />
          </linearGradient>
        </defs>
        <rect width={VW} height={VH} fill={`url(#hf-sky-${world})`} />
        <g filter="url(#kp-brush)" opacity="0.9">
          {world === 'forest' && (
            <>
              {[20, 70, 130, 200, 260].map((x, i) => <ellipse key={i} cx={x} cy={40 + (i % 2) * 10} rx="44" ry="34" fill="#C9EBA6" />)}
              <path d="M0 22 Q75 52 150 24 T300 22" stroke={sk} strokeWidth="1.4" fill="none" />
            </>
          )}
          {world === 'market' && (
            <>
              <path d="M0 40 Q75 60 150 40 T300 40 V0 H0z" fill="#BFE3FF" />
              {Array.from({ length: 10 }, (_, i) => (
                <path key={i} d={`M${i * 30} 30 h30 v18 q-7.5 8 -15 0 q-7.5 8 -15 0z`} fill={i % 2 ? '#FFFFFF' : '#F87171'} stroke={sk} strokeWidth="1.2" opacity="0.85" />
              ))}
            </>
          )}
          {world === 'snow' && (
            <>
              <path d="M-10 120 L50 52 L95 98 L145 40 L205 104 L245 64 L310 120z" fill="#DDEBFA" stroke="#9FB8D6" strokeWidth="1.4" />
              <path d="M38 66 L50 52 L62 66 L56 62 L50 70 L44 62z M133 54 L145 40 L157 54 L151 50 L145 58 L139 50z" fill="#FFFFFF" />
            </>
          )}
          {world === 'night' && (
            <>
              <circle cx="258" cy="40" r="34" fill="#FFF4C2" opacity="0.25" className="fg-glow" />
              <circle cx="258" cy="40" r="16" fill="#FFF1B8" stroke={sk} strokeWidth="1.2" />
            </>
          )}
          {/* the path along the bottom */}
          <path d={`M0 ${VH * 0.8} Q75 ${VH * 0.78} 150 ${VH * 0.8} T300 ${VH * 0.79} V${VH} H0z`} fill={look.grass} stroke={sk} strokeWidth="1.4" />
          <path d={`M0 ${VH * 0.9} Q80 ${VH * 0.86} 160 ${VH * 0.9} T300 ${VH * 0.88} V${VH} H0z`} fill={look.path} stroke={sk} strokeWidth="1.2" />
        </g>
        {world === 'night' && Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={seeded(i, 61) * VW} cy={seeded(i, 62) * VH * 0.75} r={0.8 + seeded(i, 63) * 1.3} fill="#FFFFFF"
            className="fg-twinkle" style={{ animationDelay: `${-seeded(i, 64) * 2.4}s`, animationDuration: `${1.8 + seeded(i, 65) * 2}s` }} />
        ))}
      </svg>
      {/* bunting flags swaying over the forest party */}
      {world === 'forest' && [8, 22, 36, 50, 64, 78, 92].map((x, i) => (
        <span key={i} className="fg-sway absolute" style={{ left: `${x}%`, top: `${5.5 + Math.sin((x / 100) * Math.PI * 2) * 1.6 + (i % 2 ? 1.6 : 0.4)}%`, transformOrigin: '50% 0%', animationDelay: `${-i * 0.6}s`, animationDuration: '3s' }}>
          <svg width="16" height="18" viewBox="0 0 16 18"><path d="M1 1 H15 L8 17z" fill={['#F87171', '#FDE047', '#60A5FA', '#F9A8D4'][i % 4]} stroke="#3b2416" strokeWidth="1.2" strokeLinejoin="round" /></svg>
        </span>
      ))}
      {/* falling leaves, snow, or rising fireflies */}
      {world !== 'market' && Array.from({ length: world === 'snow' ? 16 : 7 }, (_, i) => {
        if (world === 'night') {
          return (
            <span key={i} className="fg-rise absolute rounded-full" style={{
              left: `${6 + seeded(i, 71) * 88}%`, bottom: `${10 + seeded(i, 72) * 30}%`, width: 8, height: 8,
              background: 'radial-gradient(circle, #FFFFFF 0%, #FFE59A 45%, #FFE59A00 72%)',
              animationDuration: `${6 + seeded(i, 73) * 5}s`, animationDelay: `${-seeded(i, 74) * 10}s`,
              ['--rise' as string]: '240px', ['--sway' as string]: `${(seeded(i, 75) - 0.5) * 40}px`,
            } as CSSProperties} />
          );
        }
        return (
          <span key={i} className="fg-fall absolute top-[-4%]" style={{
            left: `${seeded(i, 81) * 95}%`,
            animationDuration: `${(world === 'snow' ? 6 : 8) + seeded(i, 82) * 6}s`, animationDelay: `${-seeded(i, 83) * 12}s`,
            ['--sway' as string]: `${(seeded(i, 84) - 0.5) * 60}px`, ['--fall' as string]: '470px',
          } as CSSProperties}>
            {world === 'snow'
              ? <span className="block rounded-full" style={{ width: 6, height: 6, background: '#FFFFFF', boxShadow: '0 0 0 1px #9FB8D6' }} />
              : (
                <svg width="14" height="10" viewBox="0 0 16 12"><path d="M1 6 Q8 -2 15 6 Q8 14 1 6z" fill={['#F7B267', '#9ED36A', '#F4845F'][i % 3]} stroke="#3b2416" strokeWidth="0.8" /></svg>
              )}
          </span>
        );
      })}
      {/* clouds drifting over the market */}
      {world === 'market' && [0, 1].map(i => (
        <div key={i} className="fg-drift absolute left-0" style={{ top: `${1 + i * 3}%`, animationDuration: `${60 + i * 20}s`, animationDelay: `${-i * 30}s`, opacity: 0.9 }}>
          <svg viewBox="0 0 100 50" width={70 - i * 16}><g filter="url(#kp-brush)" fill="#FFFFFF"><ellipse cx="30" cy="32" rx="22" ry="14" /><ellipse cx="55" cy="24" rx="24" ry="18" /><ellipse cx="76" cy="33" rx="17" ry="12" /></g></svg>
        </div>
      ))}
    </div>
  );
}
