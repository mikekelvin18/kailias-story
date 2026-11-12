'use client';

// ── Kiko Says (Kiko · talking & listening) ──
// Kiko perches on a jungle branch above six little shape friends and says
// out loud what to tap ("Tap the small blue star, then the red heart");
// the words are not on screen unless the child asks for them. Every right
// tap, Kiko swoops down to that shape friend, which jumps for joy, then
// flies back up to the branch. Listening to and following spoken
// directions, holding them in order.
// Difficulty: one step → describing words (big/small) → two steps → three.
// Notices: steps followed, replays and "show me the words" requests.
// Kiko only speaks; nothing ever listens (no microphone).

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import Stage from '../kit/Stage';
import Actor, { usePetMood } from '../kit/Actor';
import { useBursts } from '../kit/Burst';
import { speak, canSpeak, tones } from '../voice';

const COLORS = [
  { name: 'red', fill: '#EF4444' }, { name: 'blue', fill: '#3B82F6' },
  { name: 'yellow', fill: '#FACC15' }, { name: 'green', fill: '#22C55E' },
] as const;
const SHAPES = ['circle', 'square', 'star', 'heart', 'triangle'] as const;

interface Item { color: typeof COLORS[number]; shape: typeof SHAPES[number]; big: boolean }

// where the six shape friends sit on the jungle floor (% of the stage)
const SPOTS = [[18, 62], [50, 60], [82, 62], [18, 88], [50, 86], [82, 88]];
const PERCH = { x: 50, y: 36 };

function ShapeArt({ item, happy }: { item: Item; happy: boolean }) {
  const f = item.color.fill;
  const p = { fill: f, stroke: '#3b2416', strokeWidth: 1.1, strokeLinejoin: 'round' as const };
  const s = item.big ? 66 : 42;
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true" style={{ overflow: 'visible', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.25))' }}>
      <g filter="url(#kp-brush)">
        {item.shape === 'circle' && <circle cx="12" cy="12" r="9.5" {...p} />}
        {item.shape === 'square' && <rect x="3" y="3" width="18" height="18" rx="3.5" {...p} />}
        {item.shape === 'star' && <path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9l6.6-.8z" {...p} />}
        {item.shape === 'heart' && <path d="M12 21s-8.5-5.3-8.5-11A4.7 4.7 0 0 1 12 7.2 4.7 4.7 0 0 1 20.5 10c0 5.7-8.5 11-8.5 11z" {...p} />}
        {item.shape === 'triangle' && <path d="M12 3l9.5 17h-19z" {...p} />}
      </g>
      {/* shine and a little face */}
      <ellipse cx="8.6" cy="8.4" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.55" transform="rotate(-30 8.6 8.4)" />
      <circle cx="10" cy="12.6" r="0.95" fill="#3b2416" /><circle cx="14" cy="12.6" r="0.95" fill="#3b2416" />
      <path d={happy ? 'M10.2 14.6 Q12 16.8 13.8 14.6' : 'M10.8 15 Q12 15.8 13.2 15'} stroke="#3b2416" strokeWidth="0.75" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function shuffle<T>(xs: T[]) { return [...xs].sort(() => Math.random() - 0.5); }

export default function KikoSays(props: RoundProps) {
  const [round] = useState(() => makeRound(props.difficulty));
  return <KikoBoard round={round} {...props} />;
}

type KikoRound = ReturnType<typeof makeRound>;

function makeRound(difficulty: number) {
  const steps = difficulty <= 4 ? 1 : difficulty <= 8 ? 2 : 3;
  const sizes = difficulty >= 3 && difficulty !== 5 && difficulty !== 6;
  // six items, each a different color + shape, so a description is never ambiguous
  const combos = shuffle(COLORS.flatMap(color => SHAPES.map(shape => ({ color, shape }))));
  const items: Item[] = combos.slice(0, 6).map(c => ({ ...c, big: Math.random() < 0.5 }));
  const targets = shuffle(items.map((_, i) => i)).slice(0, steps);
  const name = (i: number) => {
    const it = items[i];
    return `the ${sizes ? (it.big ? 'big ' : 'small ') : ''}${it.color.name} ${it.shape}`;
  };
  const text = `Tap ${targets.map(name).join(', then ')}.`;
  return { items, targets, text };
}

function KikoBoard({ round, say, onDone, pet, reaction }: { round: KikoRound } & RoundProps) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [showWords, setShowWords] = useState(!canSpeak());
  const [spot, setSpot] = useState(PERCH);
  const [jump, setJump] = useState(-1);
  const [miss, setMiss] = useState(-1);
  const [hint, setHint] = useState(-1);
  const [mood, moodKey, setMood] = usePetMood('idle');
  const { layer, fire } = useBursts();
  const st = useRef({ replays: 0, helped: 0, done: false });
  const talkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function talk(rate: number) {
    speak(round.text, { rate, pitch: 1.35 });
    setMood('talk');
    if (talkTimer.current) clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setMood('idle'), 600 + round.text.length * 62 / rate);
  }

  useEffect(() => {
    say('Listen carefully to Kiko!');
    const id = setTimeout(() => talk(0.85), 900);
    return () => { clearTimeout(id); if (talkTimer.current) clearTimeout(talkTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  useEffect(() => { if (reaction === 'win') setMood('cheer'); }, [reaction, setMood]);

  function replay() { st.current.replays++; talk(0.8); }

  function tap(i: number) {
    const s = st.current;
    if (s.done || tapped.includes(i)) return;
    const step = tapped.length;
    if (round.targets[step] !== i) {
      s.done = true;
      setMiss(i);
      setMood('oops');
      tones([{ f: 330, t: 0, d: 0.18 }]);
      setTimeout(() => setHint(round.targets[step]), 400);
      setTimeout(() => onDone({ ok: false, data: { steps: round.targets.length, stepsFollowed: step, replays: s.replays, wordsShown: s.helped } }), 1400);
      return;
    }
    tones([{ f: 620 + step * 120, t: 0, d: 0.14 }, { f: 820 + step * 120, t: 0.1, d: 0.16 }]);
    const [x, y] = SPOTS[i];
    setMood('fly');
    setSpot({ x: x + (x > 50 ? -12 : 12), y: y - 4 });
    setJump(i);
    fire(x, y - 8, ['#BEF264', '#FFE066', '#FFFFFF', round.items[i].color.fill], 10, 50);
    const next = [...tapped, i];
    setTapped(next);
    if (next.length === round.targets.length) {
      s.done = true;
      setTimeout(() => { setSpot(PERCH); setMood('cheer'); }, 650);
      setTimeout(() => onDone({ ok: s.helped === 0, data: { steps: round.targets.length, stepsFollowed: next.length, replays: s.replays, wordsShown: s.helped } }), 1100);
    } else {
      setTimeout(() => { setSpot(PERCH); setMood('idle'); }, 650);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Stage world="kiko" className="aspect-[4/4.6]">
        {/* Kiko's branch */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ zIndex: 2 }}>
          <g filter="url(#kp-brush)">
            <path d="M-2 40 Q30 33 62 37 T104 30" stroke="#3b2416" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M-2 40 Q30 33 62 37 T104 30" stroke="#8B5A2B" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <ellipse cx="22" cy="34" rx="4" ry="2" fill="#5DB04E" stroke="#3b2416" strokeWidth="0.4" transform="rotate(-25 22 34)" />
            <ellipse cx="78" cy="31" rx="4" ry="2" fill="#6CC35B" stroke="#3b2416" strokeWidth="0.4" transform="rotate(20 78 31)" />
            {/* leaf pads for the shape friends */}
            {SPOTS.map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y + 2} rx="13" ry="3.6" fill={i % 2 ? '#B5763F' : '#C8874E'} stroke="#3b2416" strokeWidth="0.6" />
            ))}
          </g>
        </svg>
        {round.items.map((it, i) => {
          const [x, y] = SPOTS[i];
          const done = tapped.includes(i);
          return (
            <button key={i} onClick={() => tap(i)}
              aria-label={`${it.big ? 'big' : 'small'} ${it.color.name} ${it.shape}`}
              className="absolute flex items-end justify-center"
              style={{ left: `${x}%`, top: `${y}%`, width: '28%', height: '24%', transform: 'translate(-50%, -88%)', zIndex: 3 }}>
              <span key={`${jump === i}-${miss === i}`} className={`block ${jump === i ? 'kp-hop' : miss === i ? 'shake' : hint === i ? 'soft-pulse' : 'fg-bob'}`}
                style={{ animationDelay: jump === i || miss === i || hint === i ? undefined : `${-i * 0.45}s`, transformOrigin: '50% 100%' }}>
                <ShapeArt item={it} happy={done || hint === i} />
              </span>
              {(done || hint === i) && (
                <span className="absolute top-0 right-[14%] w-6 h-6 rounded-full flex items-center justify-center bounce-in" style={{ background: hint === i ? '#FFFFFF' : '#BEF264', border: '2px solid #3b2416' }}>
                  {done
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M12 19V6M7 11l5-5 5 5" /></svg>}
                </span>
              )}
            </button>
          );
        })}
        <Actor art={pet.art} name={pet.name} x={spot.x} y={spot.y} h={86} mood={mood} moodKey={moodKey} moveMs={420} flip={spot.x < 50} shadow={false} z={6} />
        {showWords && (
          <div className="absolute inset-x-3 top-3 rounded-2xl px-3 py-2 text-center text-lg font-extrabold slide-up" style={{ background: 'rgba(255,255,255,0.92)', color: '#1F3B16', zIndex: 7 }}>
            {round.text}
          </div>
        )}
        {layer}
      </Stage>
      <div className="flex gap-2">
        <button onClick={replay} className="flex-1 min-h-[56px] rounded-full font-extrabold flex items-center justify-center gap-2 transition-transform active:scale-95"
          style={{ background: '#BEF264', color: '#1F2A44', boxShadow: '0 5px 0 rgba(0,0,0,0.25)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
          Kiko, say it again!
        </button>
        {!showWords && (
          <button onClick={() => { st.current.helped = 1; setShowWords(true); }}
            className="min-h-[56px] px-4 rounded-full font-extrabold" style={{ background: 'rgba(255,255,255,0.16)' }}>
            Show words
          </button>
        )}
      </div>
    </div>
  );
}
