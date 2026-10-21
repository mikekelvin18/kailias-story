'use client';

// ── Actor: the friend playing inside its game ──
// The friend is not a picture in the corner; it lives in the scene. It
// can fly or walk to a spot (x, y in % of the stage, measured at its
// feet), turn to face where it is going, talk, cheer, wobble ("oops",
// never "no"), and dance. Tapping it makes it giggle.
//
// usePetMood() gives a mood plus a setter; one-shot moods (cheer, oops)
// fall back to the resting mood by themselves.

import { useCallback, useRef, useState } from 'react';
import LiveArt from '@/components/characters/LiveArt';
import { petWidth } from '@/lib/companionTrails';

export type Mood = 'idle' | 'fly' | 'talk' | 'cheer' | 'oops' | 'dance';

const ONE_SHOT: Partial<Record<Mood, number>> = { cheer: 1100, oops: 900 };

export function usePetMood(rest: Mood = 'idle') {
  const [state, setState] = useState<{ mood: Mood; n: number }>({ mood: rest, n: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const set = useCallback((mood: Mood) => {
    if (timer.current) clearTimeout(timer.current);
    setState(s => ({ mood, n: s.n + 1 }));
    const ms = ONE_SHOT[mood];
    if (ms) timer.current = setTimeout(() => setState(s => ({ mood: 'idle', n: s.n + 1 })), ms);
  }, []);
  return [state.mood === 'idle' ? rest : state.mood, state.n, set] as const;
}

interface Props {
  art: string;
  name: string;
  /** feet position, % of the stage */
  x: number;
  y: number;
  /** picture height in px */
  h: number;
  mood?: Mood;
  moodKey?: number;
  /** how long a move to a new spot takes */
  moveMs?: number;
  /** face left instead of right (the pictures face the viewer, so this only tilts the turn) */
  flip?: boolean;
  onTap?: () => void;
  shadow?: boolean;
  z?: number;
}

export default function Actor({ art, name, x, y, h, mood = 'idle', moodKey = 0, moveMs = 600, flip, onTap, shadow = true, z = 5 }: Props) {
  const w = petWidth(art, h);
  const cls = mood === 'idle' ? '' : `fg-${mood}`;
  return (
    <div className="absolute" style={{
      left: `${x}%`, top: `${y}%`, width: w, height: h, marginLeft: -w / 2, marginTop: -h, zIndex: z,
      transition: `left ${moveMs}ms cubic-bezier(.45,.05,.4,1), top ${moveMs}ms cubic-bezier(.3,-0.3,.4,1)`,
      pointerEvents: onTap ? 'auto' : 'none',
    }}>
      {shadow && mood !== 'fly' && (
        <span aria-hidden="true" className="absolute left-[18%] right-[18%] -bottom-[4%] h-[10%] rounded-[50%]" style={{ background: 'rgba(0,0,0,0.22)', filter: 'blur(2px)' }} />
      )}
      <div style={{ transform: `scaleX(${flip ? -1 : 1})`, transition: 'transform 0.25s', transformOrigin: '50% 100%' }}>
        <div key={moodKey} className={cls} style={{ transformOrigin: '50% 100%' }}
          onClick={onTap} role={onTap ? 'button' : undefined} aria-label={onTap ? `Tickle ${name}` : undefined}>
          <LiveArt src={art} alt={name} size={w} kind="pet" pokeable={false} />
        </div>
      </div>
    </div>
  );
}
