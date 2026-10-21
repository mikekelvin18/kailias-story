'use client';

// ── Kiko Says (Kiko · talking & listening) ──
// Kiko says what to tap ("Tap the small blue star, then the red heart")
// out loud; the words are not on screen unless the child asks for them.
// Listening to and following spoken directions, holding them in order.
// Difficulty: one step → describing words (big/small) → two steps → three.
// Notices: steps followed, replays and "show me the words" requests.
// Kiko only speaks; nothing ever listens (no microphone).

import { useEffect, useRef, useState } from 'react';
import type { RoundProps } from '../FriendGameShell';
import { speak, canSpeak, tones } from '../voice';

const COLORS = [
  { name: 'red', fill: '#EF4444' }, { name: 'blue', fill: '#3B82F6' },
  { name: 'yellow', fill: '#FACC15' }, { name: 'green', fill: '#22C55E' },
] as const;
const SHAPES = ['circle', 'square', 'star', 'heart', 'triangle'] as const;

interface Item { color: typeof COLORS[number]; shape: typeof SHAPES[number]; big: boolean }

function ShapeArt({ item }: { item: Item }) {
  const f = item.color.fill, s = '#FFFFFF';
  const p = { fill: f, stroke: s, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" width={item.big ? 64 : 38} height={item.big ? 64 : 38} aria-hidden="true">
      {item.shape === 'circle' && <circle cx="12" cy="12" r="9.5" {...p} />}
      {item.shape === 'square' && <rect x="3" y="3" width="18" height="18" rx="3" {...p} />}
      {item.shape === 'star' && <path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z" {...p} />}
      {item.shape === 'heart' && <path d="M12 21s-8.5-5.3-8.5-11A4.7 4.7 0 0 1 12 7.2 4.7 4.7 0 0 1 20.5 10c0 5.7-8.5 11-8.5 11z" {...p} />}
      {item.shape === 'triangle' && <path d="M12 3l9.5 17h-19z" {...p} />}
    </svg>
  );
}

function shuffle<T>(xs: T[]) { return [...xs].sort(() => Math.random() - 0.5); }

export default function KikoSays({ difficulty, accent, say, onDone }: RoundProps) {
  const [round] = useState(() => makeRound(difficulty));
  return <KikoBoard round={round} accent={accent} say={say} onDone={onDone} />;
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
    const text = `Tap ${targets.map(name).join(targets.length > 2 ? ', then ' : ', then ')}.`;
    return { items, targets, text };
}

function KikoBoard({ round, accent, say, onDone }: { round: KikoRound } & Omit<RoundProps, 'difficulty'>) {
  const [tapped, setTapped] = useState<number[]>([]);
  const [showWords, setShowWords] = useState(!canSpeak());
  const st = useRef({ replays: 0, helped: 0, done: false });

  useEffect(() => {
    say('Listen carefully to Kiko!');
    const id = setTimeout(() => speak(round.text, { rate: 0.85, pitch: 1.35 }), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function replay() { st.current.replays++; speak(round.text, { rate: 0.8, pitch: 1.35 }); }

  function tap(i: number) {
    const s = st.current;
    if (s.done || tapped.includes(i)) return;
    const step = tapped.length;
    if (round.targets[step] !== i) {
      s.done = true;
      onDone({ ok: false, data: { steps: round.targets.length, stepsFollowed: step, replays: s.replays, wordsShown: s.helped } });
      return;
    }
    tones([{ f: 620 + step * 120, t: 0, d: 0.14 }]);
    const next = [...tapped, i];
    setTapped(next);
    if (next.length === round.targets.length) {
      s.done = true;
      onDone({ ok: s.helped === 0, data: { steps: round.targets.length, stepsFollowed: next.length, replays: s.replays, wordsShown: s.helped } });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {round.items.map((it, i) => {
          const done = tapped.includes(i);
          return (
            <button key={i} onClick={() => tap(i)}
              aria-label={`${it.big ? 'big' : 'small'} ${it.color.name} ${it.shape}`}
              className="relative aspect-square rounded-3xl flex items-center justify-center transition-transform active:scale-95"
              style={{ background: done ? `${accent}55` : 'rgba(255,255,255,0.1)', border: done ? `3px solid ${accent}` : '3px solid transparent' }}>
              <ShapeArt item={it} />
              {done && (
                <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bounce-in" style={{ background: accent }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F2A44" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={replay} className="flex-1 min-h-[52px] rounded-full font-extrabold flex items-center justify-center gap-2" style={{ background: accent, color: '#1F2A44' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></svg>
          Say it again
        </button>
        {!showWords && (
          <button onClick={() => { st.current.helped = 1; setShowWords(true); }}
            className="min-h-[52px] px-4 rounded-full font-extrabold" style={{ background: 'rgba(255,255,255,0.14)' }}>
            Show words
          </button>
        )}
      </div>
      {showWords && <p className="text-center text-lg font-extrabold slide-up">{round.text}</p>}
    </div>
  );
}
