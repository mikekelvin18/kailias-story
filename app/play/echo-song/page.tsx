'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import KailiaSprite from '@/components/characters/KailiaSprite';
import PandaSprite from '@/components/characters/PandaSprite';
import SkillIntro from '@/components/SkillIntro';
import LevelPath from '@/components/LevelPath';
import { logQuestMetric } from '@/lib/metrics';
import { difficultyTier } from '@/lib/difficulty';
import { awardStarlight, recordGameLevel, nextGameLevel } from '@/lib/rewards';
import { soundEnabled } from '@/lib/accessibility';
import KailiaActor from '@/components/games/KailiaActor';
import StarIcon from '@/components/games/StarIcon';
import { usePlayPet } from '@/components/games/playPet';
import Actor, { usePetMood } from '@/components/friends/kit/Actor';
import { useBursts } from '@/components/friends/kit/Burst';
import { seeded } from '@/components/friends/kit/Stage';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';
import styles from './game.module.css';

// ─── Echo Song ────────────────────────────────────────────────────────────────
// Simon-style sequence memory in Echo Caves: the crystals sing a little
// melody (light + tone), the child echoes it back by tapping. Levels grow
// the melody; misses just replay it — never a failure state.
// Measures auditory-visual sequence memory span (processing domain).
//
// The song happens inside a painted cave: four crystals sit on rock
// ledges and pillars, each rings out with sound waves and floating notes.
// Kailia runs under each crystal the child taps and sings along; the
// child's friend sits on the cave floor, wobbles "oops" with her when the
// echo slips, and after two slips runs to the crystal the song starts on.

const CRYSTALS = [
  { tone: 262, color: '#60A5FA', light: '#B3D6FE', name: 'blue' },
  { tone: 330, color: '#4ADE80', light: '#A7F3C4', name: 'green' },
  { tone: 392, color: '#C084FC', light: '#E2C6FE', name: 'purple' },
  { tone: 523, color: '#FB923C', light: '#FEC79C', name: 'orange' },
];
// where each crystal stands in the cave (centre x and base y, % of the scene):
// two on ledges up high, two on rock pillars below
const SPOTS: [number, number][] = [[27, 40], [73, 40], [27, 72], [73, 72]];
const FLOOR = 97;          // Kailia's and the friend's feet
const CRYSTAL_W = 92;      // px, drawn size (the button is a little bigger)

function tone(f: number, d = 0.32) {
  if (!soundEnabled()) return;
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

// where the friend sits to point at x without standing on Kailia (at k):
// right under it, or just beside her on the side nearer to it
function besideSpot(x: number, k: number, gap = 17) {
  if (Math.abs(x - k) >= gap) return x;
  const left = k - gap, right = k + gap;
  if (left < 6) return right;
  if (right > 94) return left;
  return Math.abs(left - x) < Math.abs(right - x) ? left : right;
}

const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3), i * 120));

export default function EchoSongPage() {
  const { state, totalScore } = useAssessment();
  const tier = difficultyTier(state.ageGroup, totalScore);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<'intro' | 'showing' | 'echo' | 'cheer' | 'levelDone'>('intro');
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  // bumps every time a crystal sings, so its rings and notes restart
  const [ringKey, setRingKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [noelLine, setNoelLine] = useState('Listen to the crystal song — then sing it back with your taps!');
  const [noelMood, setNoelMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [earned, setEarned] = useState(0);
  const [slips, setSlips] = useState(0);   // echo slips this level (for the friend's hint)
  const [hintOn, setHintOn] = useState(false);

  // Kailia and the friend on the cave floor
  const pet = usePlayPet();
  const [petMood, petMoodKey, setPetMood] = usePetMood('idle');
  const [kailiaX, setKailiaX] = useState(42);
  const [petX, setPetX] = useState(62);
  const [kailiaHop, setKailiaHop] = useState(0);
  const { layer: burstLayer, fire } = useBursts();

  const posRef = useRef(0);
  const statsRef = useRef({ attempts: 0, replays: 0, startedAt: 0 });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved level is only readable after mount
  useEffect(() => { setLevel(nextGameLevel('echo-song')); const timers = timersRef; return () => timers.current.forEach(clearTimeout); }, []);

  const seqLen = useCallback((lvl: number) => {
    const base = tier === 'tiny' ? 2 : tier === 'small' ? 2 : 3;
    return Math.min(base + (lvl - 1), 8);
  }, [tier]);

  const sing = useCallback((c: number, d?: number) => {
    setLit(c); setRingKey(k => k + 1); tone(CRYSTALS[c].tone, d);
  }, []);

  const playSeq = useCallback((s: number[]) => {
    setPhase('showing');
    setProgress(0);
    posRef.current = 0;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    // Kailia and the friend step back to the middle of the floor to listen
    setKailiaX(42); setPetX(60);
    const gap = tier === 'big' ? 620 : 780;
    s.forEach((c, i) => {
      timersRef.current.push(setTimeout(() => sing(c), 500 + i * gap));
      timersRef.current.push(setTimeout(() => setLit(null), 500 + i * gap + gap * 0.6));
    });
    timersRef.current.push(setTimeout(() => {
      setPhase('echo');
      setNoelLine('Your turn — echo the song!');
      setNoelMood('excited');
    }, 500 + s.length * gap + 200));
  }, [tier, sing]);

  const startLevel = useCallback((lvl: number) => {
    const s = Array.from({ length: seqLen(lvl) }, () => Math.floor(Math.random() * 4));
    statsRef.current = { attempts: 0, replays: 0, startedAt: Date.now() };
    setSeq(s);
    setSlips(0); setHintOn(false);
    setNoelLine('Shhh… listen to the crystals sing!');
    setNoelMood('happy');
    playSeq(s);
  }, [seqLen, playSeq]);

  // Kailia runs under the crystal she is singing to; the friend sits
  // beside her (on the inner side, so it never stands on top of her)
  function runTo(c: number) {
    const x = SPOTS[c][0];
    setKailiaX(x);
    setPetX(x < 50 ? x + 19 : x - 19);
  }

  function tap(c: number) {
    if (phase !== 'echo') return;
    sing(c, 0.25);
    timersRef.current.push(setTimeout(() => setLit(null), 260));
    runTo(c);
    const [sx, sy] = SPOTS[c];
    if (c === seq[posRef.current]) {
      posRef.current += 1;
      setProgress(posRef.current);
      setHintOn(false);
      if (posRef.current < seq.length) { setNoelLine(posRef.current === 1 ? 'Yes! Keep singing!' : 'Lovely! What comes next?'); setNoelMood('excited'); }
      fire(sx, sy - 14, ['#FFFFFF', CRYSTALS[c].light, CRYSTALS[c].color], 7, 42);
      if (posRef.current === seq.length) {
        // level cleared!
        const s = statsRef.current;
        logQuestMetric('processing', 'echo-song', {
          level, sequenceLength: seq.length, wrongTaps: s.attempts,
          replays: s.replays, totalMs: Date.now() - s.startedAt,
        });
        const stars = Math.max(8, 10 + seq.length * 2 - s.attempts * 2);
        awardStarlight(stars);
        recordGameLevel('echo-song', level);
        setEarned(stars);
        setPhase('cheer');
        setNoelLine('You sang the whole song! Listen to the cave ring!');
        setNoelMood('celebrating');
        setKailiaHop(n => n + 1);
        setPetMood('cheer');
        timersRef.current.push(setTimeout(() => {
          fanfare();
          SPOTS.forEach(([x, y], i) => fire(x, y - 14, ['#FFE066', '#FFFFFF', CRYSTALS[i].color], 10, 60));
        }, 280));
        timersRef.current.push(setTimeout(() => setPhase('levelDone'), 1800));
      }
    } else {
      statsRef.current.attempts += 1;
      statsRef.current.replays += 1;
      const n = slips + 1;
      setSlips(n);
      setPetMood('oops');
      setNoelLine(n >= 2
        ? `The echo slipped! Listen once more. ${pet.name} will sit by the crystal the song starts on.`
        : 'Oops, the echo slipped! Listen once more — you almost have it!');
      setNoelMood('thinking');
      setPhase('showing');
      timersRef.current.push(setTimeout(() => {
        playSeq(seq);
        // after two slips the friend runs to the first crystal of the song
        if (n >= 2) timersRef.current.push(setTimeout(() => {
          setHintOn(true);
          setNoelLine(`Your turn! ${pet.name} is sitting by the crystal the song starts on.`);
        }, 500 + seq.length * (tier === 'big' ? 620 : 780) + 250));
      }, 900));
    }
  }

  function tickle() {
    setPetMood('dance');
    timersRef.current.push(setTimeout(() => setPetMood('idle'), 1300));
  }

  // the friend's spot: by the hinted crystal, else beside Kailia
  const hintCrystal = hintOn && phase === 'echo' ? seq[0] : null;
  let petSpot = petX;
  if (hintCrystal !== null) {
    const hx = SPOTS[hintCrystal][0];
    petSpot = besideSpot(hx, kailiaX, 19);
  }

  return (
    <main className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #082f49 0%, #0e7490 80%, #155e75 130%)' }}>
      <div className="max-w-md mx-auto px-3 relative">
        <div className="flex items-center justify-between pt-4 pb-2 px-1 relative z-10">
          <Link href="/play" className="h-11 px-3 inline-flex items-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.15)' }}>← Map</Link>
          <h1 className="text-xl font-extrabold text-white drop-shadow">
            Echo Song <span className="text-xs font-bold text-yellow-300 align-middle ml-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,224,71,0.15)', border: '1px solid rgba(253,224,71,0.4)' }}>Lv {level}</span>
          </h1>
          {/* one little light per note of the song, lit as the child echoes it */}
          <span className="flex justify-end flex-wrap gap-1 w-16" aria-hidden="true">
            {(phase === 'showing' || phase === 'echo' || phase === 'cheer') && seq.map((_, i) => (
              <span key={i} className="inline-block w-2.5 h-2.5 rounded-full"
                style={i < progress ? { background: '#FDE047', boxShadow: '0 0 8px #FDE047' } : { border: '2px solid #FDE68A' }} />
            ))}
          </span>
        </div>

        {phase === 'intro' && (
          <div className="text-center mt-6 bounce-in relative z-10">
            <div className="flex items-end justify-center gap-1 mb-4">
              <PandaSprite size={120} expression="happy" className="float" style={{ animationDelay: '0.2s' }} />
              <KailiaSprite size={90} expression="excited" className="float" />
              <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 64)} kind="pet" />
              <svg viewBox="0 0 100 120" width={54} height={65} aria-hidden="true" style={{ overflow: 'visible' }}>
                <Crystal c={0} lit={false} />
              </svg>
            </div>
            <div className="rounded-3xl p-6 mx-2 text-left" style={{ background: 'rgba(255,255,255,0.95)' }}>
              <p className="text-gray-900 text-2xl font-bold leading-snug mb-3">
                Deep in Echo Caves, the <strong>crystals sing</strong>!
              </p>
              <p className="text-gray-900 text-2xl font-bold leading-snug">
                Listen to their little song… then <strong>echo it back</strong> by tapping the
                crystals in the same order!
              </p>
            </div>
            <LevelPath gameId="echo-song" level={level} onPick={setLevel} />
            <button onClick={() => startLevel(level)}
              className="mt-6 px-12 py-4 rounded-full text-xl font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FDE047, #FBBF24)' }}>
              Level {level} — listen!
            </button>
            <SkillIntro gameId="echo-song" />
          </div>
        )}

        {(phase === 'showing' || phase === 'echo' || phase === 'cheer') && (
          <div className="relative z-10">
            <div className="relative w-full overflow-hidden rounded-[28px] select-none mt-1"
              style={{ aspectRatio: '3 / 3.5', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.35), 0 10px 0 rgba(0,0,0,0.22)' }}>
              <EchoCave />

              {/* who's singing now */}
              <div className="absolute left-0 right-0 top-2 flex justify-center pointer-events-none" style={{ zIndex: 12 }}>
                <span className="px-4 py-1 rounded-full text-sm font-extrabold"
                  style={{ background: 'rgba(7,20,40,0.72)', border: '1.5px solid rgba(255,255,255,0.35)', color: phase === 'echo' ? '#A5F3FC' : '#FDE047' }}>
                  {phase === 'showing' ? 'The crystals are singing…' : phase === 'echo' ? 'Your turn — echo the song!' : 'The whole cave is ringing!'}
                </span>
              </div>

              {CRYSTALS.map((c, i) => {
                const [x, y] = SPOTS[i];
                const on = lit === i || phase === 'cheer';
                const glow = hintCrystal === i && lit !== i;
                return (
                  <button key={i} data-crystal={i} onClick={() => tap(i)} aria-label={`${c.name} crystal`}
                    className="absolute"
                    style={{
                      left: `${x}%`, top: `${y}%`, width: CRYSTAL_W + 24, height: 132,
                      marginLeft: -(CRYSTAL_W + 24) / 2, marginTop: -128, zIndex: 8,
                      cursor: phase === 'echo' ? 'pointer' : 'default', background: 'none', border: 'none', padding: 0,
                    }}>
                    {/* sound rings and notes while it sings */}
                    {lit === i && (
                      <span key={`r${ringKey}`} aria-hidden="true">
                        <span className={`${styles.ring} absolute rounded-full pointer-events-none`}
                          style={{ left: '50%', top: '52%', width: 120, height: 120, border: `4px solid ${c.light}`, boxShadow: `0 0 18px ${c.color}` }} />
                        <span className={`${styles.ring} absolute rounded-full pointer-events-none`}
                          style={{ left: '50%', top: '52%', width: 120, height: 120, border: `3px solid ${c.color}`, animationDelay: '0.18s', opacity: 0 }} />
                        <span className={`${styles.noteUp} absolute pointer-events-none`}
                          style={{ left: i % 2 ? '18%' : '66%', top: '18%', ['--nx' as string]: i % 2 ? '-16px' : '16px' } as CSSProperties}>
                          <Note color={c.light} />
                        </span>
                      </span>
                    )}
                    <span className={`absolute inset-0 flex items-end justify-center ${glow ? 'hint-glow' : ''}`}>
                      <svg key={`s${lit === i ? ringKey : 0}`} viewBox="0 0 100 120" width={CRYSTAL_W} height={CRYSTAL_W * 1.2}
                        className={lit === i ? styles.sing : undefined} aria-hidden="true" style={{ overflow: 'visible' }}>
                        <Crystal c={i} lit={on} dim={phase === 'showing' && lit !== i} />
                      </svg>
                    </span>
                  </button>
                );
              })}

              <KailiaActor x={kailiaX} y={FLOOR} h={80} hop={kailiaHop} />
              <div data-pet>
                <Actor art={pet.art} name={pet.name} x={petSpot} y={FLOOR} h={54}
                  mood={hintCrystal !== null ? 'talk' : petMood} moodKey={petMoodKey} moveMs={900}
                  onTap={tickle} z={9} />
              </div>
              {burstLayer}
            </div>

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

      {phase === 'levelDone' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #164e63, #0e7490)' }}>
          <div className="text-center bounce-in">
            <span className="inline-flex items-end gap-1 mb-10 star-burst" aria-hidden="true">
              {[0, 2, 1, 3].map(i => (
                <svg key={i} viewBox="0 0 100 120" width={i === 2 || i === 1 ? 58 : 44} height={(i === 2 || i === 1 ? 58 : 44) * 1.2} style={{ overflow: 'visible' }}>
                  <Crystal c={i} lit />
                </svg>
              ))}
            </span>
            <div className="flex items-end justify-center gap-2 mb-4">
              <PandaSprite size={120} expression="celebrating" className="float" />
              <KailiaSprite size={92} expression="celebrating" className="float" style={{ animationDelay: '0.2s' }} />
              <span className="fg-dance inline-block" style={{ transformOrigin: '50% 100%' }}>
                <LiveArt src={pet.art} alt={pet.name} size={petWidth(pet.art, 84)} kind="pet" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">Level {level} complete!</h2>
            <p className="text-cyan-100 font-semibold mb-1">A {seq.length}-note song, echoed back! The caves are ringing and {pet.name} is dancing!</p>
            <p className="text-yellow-300 font-extrabold text-lg mb-6"><StarIcon /> +{earned} starlight</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-900 shadow-xl transition-transform hover:scale-105"
                style={{ background: 'white' }}>
                <span className="whitespace-nowrap">Level {level + 1} ▶</span>
              </button>
              <Link href="/play"
                className="px-8 py-3.5 rounded-full text-lg font-extrabold text-cyan-950 shadow-xl transition-transform hover:scale-105 inline-block"
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

// ── A singing crystal ──
// A cluster of three painted shards on a little rock. Bright, light-rimmed
// bodies so they stand out on the dark cave; when it sings it turns almost
// lighter with a big glow in its own colour.
function Crystal({ c, lit, dim = false }: { c: number; lit: boolean; dim?: boolean }) {
  const { color, light } = CRYSTALS[c];
  const sk = '#3b2416';
  const body = lit ? light : color;
  const shards = [
    'M24 52 L36 64 L39 106 L20 106 L13 72 Z',
    'M77 46 L88 66 L82 106 L62 106 L64 62 Z',
    'M50 6 L67 40 L61 106 L39 106 L33 40 Z',
  ];
  return (
    <g style={{ opacity: dim ? 0.82 : 1, transition: 'opacity 0.2s' }}>
      <ellipse cx="50" cy="66" rx={lit ? 62 : 44} ry={lit ? 62 : 46} fill={color} opacity={lit ? 0.55 : 0.2}
        style={{ filter: 'blur(10px)', transition: 'all 0.2s' }} />
      <g filter="url(#kp-brush)">
        {/* rock it grows from */}
        <path d="M6 112 Q12 98 30 100 Q50 94 70 100 Q90 98 94 112 Q50 120 6 112z" fill="#5B6B7A" stroke={sk} strokeWidth="2.4" />
        {/* a light rim under the dark outline keeps the edge visible on the dark cave */}
        {shards.map((d, i) => <path key={`rim${i}`} d={d} fill="none" stroke="#FFFFFF" strokeOpacity="0.75" strokeWidth="6" strokeLinejoin="round" />)}
        {shards.map((d, i) => (
          <path key={i} d={d} fill={body} stroke={sk} strokeWidth="2.6" strokeLinejoin="round" style={{ transition: 'fill 0.15s' }} />
        ))}
        {/* facets */}
        <path d="M50 6 L45 40 L47 104 L39 106 L33 40 Z" fill="#FFFFFF" opacity="0.45" />
        <path d="M24 52 L22 72 L27 106 L20 106 L13 72 Z" fill="#FFFFFF" opacity="0.4" />
        <path d="M77 46 L74 64 L72 106 L62 106 L64 62 Z" fill="#FFFFFF" opacity="0.35" />
        <path d="M33 40 L50 46 L67 40" fill="none" stroke={sk} strokeWidth="1.4" opacity="0.5" />
        <circle cx="45" cy="26" r="3" fill="#FFFFFF" opacity="0.9" />
      </g>
    </g>
  );
}

// a painted music note
function Note({ color }: { color: string }) {
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" aria-hidden="true">
      <g filter="url(#kp-edge)">
        <path d="M10 25 V5 L23 2 V20" fill="none" stroke="#3b2416" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 25 V5 L23 2 V20" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="6.5" cy="25.5" rx="5.5" ry="4.3" fill={color} stroke="#3b2416" strokeWidth="1.8" />
        <ellipse cx="19.5" cy="21" rx="5.5" ry="4.3" fill={color} stroke="#3b2416" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

// ── Echo Caves ──
// A painted cave: stalactites that drip, glow-worms twinkling on the
// ceiling, rock ledges and pillars for the crystals, glowing mushrooms
// and motes drifting up. Decoration only; it never catches taps.
function EchoCave() {
  const sk = '#3b2416';
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 350" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ec-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0A1A33" /><stop offset="0.55" stopColor="#0F3550" /><stop offset="1" stopColor="#155A66" />
          </linearGradient>
          <radialGradient id="ec-glow"><stop offset="0" stopColor="#7DF9FF" stopOpacity="0.5" /><stop offset="1" stopColor="#7DF9FF" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="300" height="350" fill="url(#ec-sky)" />
        <circle cx="150" cy="190" r="120" fill="url(#ec-glow)" className="fg-glow" />
        {/* glow-worms on the ceiling */}
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={seeded(i, 41) * 300} cy={30 + seeded(i, 42) * 90} r={0.8 + seeded(i, 43) * 1.4}
            fill="#B8FFF6" className="fg-twinkle"
            style={{ animationDelay: `${-seeded(i, 44) * 2.4}s`, animationDuration: `${1.8 + seeded(i, 45) * 2}s` }} />
        ))}
        <g filter="url(#kp-edge)">
          {/* back walls */}
          <path d="M0 0 H40 Q30 120 46 230 Q30 300 0 320z" fill="#0B2236" />
          <path d="M300 0 H262 Q272 120 254 230 Q272 300 300 320z" fill="#0B2236" />
          {/* ceiling and stalactites */}
          <path d="M0 0 H300 V18 Q280 24 270 18 L262 46 L252 20 Q236 26 222 20 L214 38 L206 20 Q186 28 170 20 L160 56 L150 22 Q130 28 112 20 L104 40 L96 20 Q76 26 62 20 L52 50 L42 18 Q20 26 0 18z"
            fill="#132B44" stroke={sk} strokeWidth="1.6" strokeLinejoin="round" />
          {/* ledges for the top crystals */}
          <path d="M0 132 Q40 128 112 138 Q120 150 100 156 Q50 160 0 154z" fill="#36506A" stroke={sk} strokeWidth="1.8" />
          <path d="M300 132 Q260 128 188 138 Q180 150 200 156 Q250 160 300 154z" fill="#36506A" stroke={sk} strokeWidth="1.8" />
          <path d="M8 136 Q50 132 104 140" stroke="#6E8CA8" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M292 136 Q250 132 196 140" stroke="#6E8CA8" strokeWidth="2" fill="none" opacity="0.7" />
          {/* pillars for the bottom crystals */}
          <path d="M58 256 Q81 248 104 256 L110 320 H52z" fill="#2E465E" stroke={sk} strokeWidth="1.8" />
          <path d="M196 256 Q219 248 242 256 L248 320 H190z" fill="#2E465E" stroke={sk} strokeWidth="1.8" />
          <path d="M64 262 L60 316 M236 262 L240 316" stroke="#4F6B86" strokeWidth="3" opacity="0.7" />
        </g>
        <g filter="url(#kp-edge)">
          {/* floor */}
          <path d="M0 312 Q60 300 150 308 T300 304 V350 H0z" fill="#22404F" stroke={sk} strokeWidth="1.6" />
          <path d="M0 318 Q70 308 150 314 T300 310" stroke="#3E6A78" strokeWidth="3" fill="none" />
          {/* glowing mushrooms */}
          {[[18, 318, 1], [284, 314, 0.8], [148, 312, 0.7]].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <path d="M-2 0 V-10 H2 V0z" fill="#E8F7F5" stroke={sk} strokeWidth="1" />
              <path d="M-9 -9 Q0 -22 9 -9z" fill="#7DF9D7" stroke={sk} strokeWidth="1.2" />
              <circle cx="-3" cy="-13" r="1.4" fill="#FFFFFF" />
            </g>
          ))}
        </g>
        {[[18, 304], [284, 302], [148, 302]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="16" fill="url(#ec-glow)" className="fg-glow" style={{ animationDelay: `${-i}s` }} />
        ))}
      </svg>
      {/* drips falling from the stalactite tips */}
      {[[17.3, 14.3, 0], [53.3, 16, 1.6], [87.3, 13.1, 3.1]].map(([x, y, d], i) => (
        <span key={i} className={`${styles.drip} absolute rounded-full`}
          style={{ left: `${x}%`, top: `${y}%`, width: 6, height: 8, marginLeft: -3, background: '#A5F3FC', boxShadow: '0 0 6px #A5F3FC',
            animationDelay: `${-d}s`, ['--fall' as string]: '250px' } as CSSProperties} />
      ))}
      {/* motes drifting up */}
      {Array.from({ length: 9 }, (_, i) => {
        const s = 4 + seeded(i, 51) * 5;
        return (
          <span key={i} className="fg-rise absolute rounded-full" style={{
            left: `${6 + seeded(i, 52) * 88}%`, bottom: `${seeded(i, 53) * 30}%`, width: s, height: s,
            background: 'radial-gradient(circle, #FFFFFF 0%, #7DF9FF 45%, #7DF9FF00 72%)',
            animationDuration: `${6 + seeded(i, 54) * 6}s`, animationDelay: `${-seeded(i, 55) * 10}s`,
            ['--rise' as string]: `${200 + seeded(i, 56) * 120}px`, ['--sway' as string]: `${(seeded(i, 57) - 0.5) * 30}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}
